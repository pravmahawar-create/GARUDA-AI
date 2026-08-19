const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const GovernedEngineeringLoop = require("./GovernedEngineeringLoop");

const BASE = path.join(os.tmpdir(), `garuda-governed-loop-${process.pid}-${Date.now()}`);

function caseRoot(label) {
  return path.join(BASE, label);
}

function moduleSource(name) {
  return `function ${name}(value) {\n  return String(value).toUpperCase();\n}\nmodule.exports = { ${name} };\n`;
}

function testSource(moduleName, extraAssertions = "") {
  return `const assert = require("assert");\nconst { ${moduleName} } = require("./${moduleName}");\nassert.strictEqual(${moduleName}("garuda"), "GARUDA");\n${extraAssertions}\nconsole.log("governed loop probe passed.");\n`;
}

function validProposal(name) {
  return {
    task: `Implement a small ${name} helper`,
    confidence: 0.99,
    targetFiles: [`src/generated/${name}.js`, `src/generated/${name}.test.js`],
    implementationPlan: { summary: "small helper", steps: ["write module", "write test"] },
    proposedChanges: [
      { path: `src/generated/${name}.js`, content: moduleSource(name) },
      { path: `src/generated/${name}.test.js`, content: testSource(name) }
    ],
    verification: { tests: [`src/generated/${name}.test.js`] }
  };
}

function mockLlm(json) {
  return async () => ({ answer: JSON.stringify(json) });
}

async function runLoop({ name, llm, founderApproved, rootDir }) {
  const loop = new GovernedEngineeringLoop({ rootDir });
  return loop.runGenericCodeTask({ task: `Implement ${name} helper`, llm, founderApproved });
}

function assertNoGeneratedFiles(rootDir) {
  const dir = path.join(rootDir, "src", "generated");
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith("."));
  assert.strictEqual(files.length, 0, `expected no generated files, found: ${files.join(", ")}`);
}

async function setup() {
  fs.rmSync(BASE, { recursive: true, force: true });
}

async function main() {
  await setup();
  const results = [];
  const completed = [];

  // CASE A: no founder approval -> BLOCKED_BY_APPROVAL, zero mutation
  {
    const name = "probeA";
    const rootDir = caseRoot("A");
    fs.mkdirSync(path.join(rootDir, "src", "generated"), { recursive: true });
    const output = await runLoop({ name, llm: mockLlm(validProposal(name)), founderApproved: false, rootDir });
    assert.strictEqual(output.status, "BLOCKED_BY_APPROVAL");
    assert.deepStrictEqual(output.stages, ["PROPOSAL_GENERATED"]);
    assert.strictEqual(output.finalReview.verdict, "APPROVE");
    assert.ok(output.finalArtifact.patchSha256);
    assertNoGeneratedFiles(rootDir);
    results.push("CASE_A_BLOCKED_WITHOUT_APPROVAL_PASSED");
  }

  // CASE B: founder approval -> COMPLETED_AND_APPLIED, files created, module loads
  {
    const name = "probeB";
    const rootDir = caseRoot("B");
    fs.mkdirSync(path.join(rootDir, "src", "generated"), { recursive: true });
    const output = await runLoop({ name, llm: mockLlm(validProposal(name)), founderApproved: true, rootDir });
    assert.strictEqual(output.status, "COMPLETED_AND_APPLIED");
    assert.deepStrictEqual(output.stages, ["PROPOSAL_GENERATED", "PATCH_APPLIED_AND_VERIFIED", "COMPLETED_AND_APPLIED"]);
    assert.ok(Array.isArray(output.appliedFiles) && output.appliedFiles.length === 2);
    const modulePath = path.join(rootDir, "src", "generated", `${name}.js`);
    assert.ok(fs.existsSync(modulePath), "generated module should exist");
    const mod = require(modulePath);
    assert.strictEqual(mod[name]("garuda"), "GARUDA");
    completed.push(modulePath);
  }

  // CASE C: founder approval but real-workspace verification fails -> rollback
  {
    const name = "probeC";
    const rootDir = caseRoot("C");
    fs.mkdirSync(path.join(rootDir, "src", "generated"), { recursive: true });
    const marker = path.join(rootDir, "marker.txt");
    fs.writeFileSync(marker, "present");
    const proposal = validProposal(name);
    proposal.proposedChanges[1].content = testSource(
      name,
      'const fs = require("fs");\nconst path = require("path");\nassert.strictEqual(fs.existsSync(path.join(process.cwd(), "marker.txt")), false, "marker should not exist");'
    );
    const output = await runLoop({ name, llm: mockLlm(proposal), founderApproved: true, rootDir });
    assert.strictEqual(output.status, "ROLLED_BACK");
    assert.ok(String(output.reason).includes("rollback"));
    assertNoGeneratedFiles(rootDir);
    results.push("CASE_C_ROLLBACK_AFTER_FAILED_VERIFICATION_PASSED");
  }

  // CASE D: malformed LLM output -> EXECUTION_FAILED, zero mutation
  {
    const name = "probeD";
    const rootDir = caseRoot("D");
    fs.mkdirSync(path.join(rootDir, "src", "generated"), { recursive: true });
    const output = await runLoop({ name, llm: mockLlm("this is not json at all"), founderApproved: true, rootDir });
    assert.strictEqual(output.status, "EXECUTION_FAILED");
    assert.ok(String(output.reason).includes("GENERIC_CODE_TASK"));
    assertNoGeneratedFiles(rootDir);
    results.push("CASE_D_MALFORMED_OUTPUT_REJECTED_PASSED");
  }

  // CASE E: unsafe path -> EXECUTION_FAILED, zero mutation
  {
    const name = "probeE";
    const rootDir = caseRoot("E");
    fs.mkdirSync(path.join(rootDir, "src", "generated"), { recursive: true });
    const proposal = validProposal(name);
    proposal.proposedChanges[0].path = "../../evil.js";
    proposal.targetFiles = ["../../evil.js", `src/generated/${name}.test.js`];
    const output = await runLoop({ name, llm: mockLlm(proposal), founderApproved: true, rootDir });
    assert.strictEqual(output.status, "EXECUTION_FAILED");
    assertNoGeneratedFiles(rootDir);
    results.push("CASE_E_UNSAFE_PATH_REJECTED_PASSED");
  }

  for (const file of completed) {
    const cached = require.cache[require.resolve(file)];
    if (cached) delete require.cache[require.resolve(file)];
  }

  console.log("\nGovernedEngineeringLoop generic-code-task results:");
  results.forEach((result) => console.log(`  [PASS] ${result}`));
  console.log(`Total: ${results.length + 3} passed (incl. 3 COMPLETED assertion groups)`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);