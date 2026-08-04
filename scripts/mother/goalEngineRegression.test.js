const assert = require("assert");
const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");

console.log("Running Goal Engine & Task Decomposer Regression Tests...\n");

// 1. Implementation Goal
const g1 = understandGoal("Create a new local utility module named autonomousProofUtility with a corresponding unit test.");
assert.strictEqual(g1.actionType, "creation");
assert.strictEqual(g1.targetName, "autonomousProofUtility");
const d1 = decompose(g1);
assert.ok(d1.some((t) => t.includes("Implement required module autonomousProofUtility")));
console.log("✔ Test 1 — Implementation goal preserves target artifact creation tasks");

// 2. Modification / Fix Goal
const g2 = understandGoal("Fix bug in API service module named riskAssessmentService");
assert.strictEqual(g2.actionType, "modification");
assert.strictEqual(g2.targetName, "riskAssessmentService");
const d2 = decompose(g2);
assert.ok(d2.some((t) => t.includes("Implement modification for riskAssessmentService")));
console.log("✔ Test 2 — Modification goal preserves fix & patch tasks");

// 3. Analysis-Only Goal
const g3 = understandGoal("Analyze current Mother architecture and find missing brain modules");
assert.strictEqual(g3.actionType, "analysis");
const d3 = decompose(g3);
assert.ok(d3.some((t) => t.includes("Analyze current Mother architecture")));
console.log("✔ Test 3 — Analysis-only goal produces read-only analysis tasks");

// 4. Test / Verification Goal
const g4 = understandGoal("Run unit tests and verify quality for approvalPolicy");
assert.strictEqual(g4.actionType, "verification");
assert.strictEqual(g4.targetName, "approvalPolicy");
const d4 = decompose(g4);
assert.ok(d4.some((t) => t.includes("Run unit test verification")));
console.log("✔ Test 4 — Verification goal produces test execution tasks");

// 5. Continuing Revenue Goal
const g5 = understandGoal("Discover and draft proposals for high-score revenue opportunities");
assert.strictEqual(g5.actionType, "revenue");
const d5 = decompose(g5);
assert.ok(d5.some((t) => t.includes("Analyze existing Revenue Engine")));
console.log("✔ Test 5 — Continuing revenue goal produces revenue discovery & intake tasks");

// 6. Self-development meta-mission must not extract arbitrary prompt tokens as artifact target.
const g6 = understandGoal(
	"Inspect your currently available runtime capabilities and identify one highest-value capability to improve, then formulate one bounded self-development engineering mission for that target."
);
assert.strictEqual(g6.intent, "self_development_meta");
assert.strictEqual(g6.targetName, null);
const d6 = decompose(g6);
assert.ok(d6.some((t) => t.includes("Inspect current body capability snapshot")));
console.log("✔ Test 6 — Self-development meta-mission avoids arbitrary artifact target extraction");

// 7. Explicit engineering request keeps artifact target extraction.
const g7 = understandGoal("Create module named foo with unit tests");
assert.strictEqual(g7.intent, "create_code_artifact");
assert.strictEqual(g7.targetName, "foo");
assert.strictEqual(g7.targetSource, "FOUNDER_EXPLICIT_TARGET");
console.log("✔ Test 7 — Explicit engineering mission preserves founder artifact target");

// 8. Test A: Read-only inspection with negative write constraint
const gA = understandGoal(
  "Inspect the GARUDA repository and determine whether the Revenue Engine is actually implemented. Base the answer on executable repository evidence, not documentation or filenames. Do not modify any file."
);
assert.strictEqual(gA.actionType, "analysis");
assert.strictEqual(gA.intent, "read_only_audit");
console.log("✔ Test A — Read-only inspection with negative write constraint yields analysis / read_only_audit");

// 9. Test B: Passive state determination query
const gB = understandGoal("Determine whether the Revenue Engine is implemented.");
assert.strictEqual(gB.actionType, "analysis");
assert.strictEqual(gB.intent, "read_only_audit");
console.log("✔ Test B — State determination query yields analysis / read_only_audit");

// 10. Test C: Affirmative creation/modification command
const gC = understandGoal("Implement the Revenue Engine.");
assert.strictEqual(gC.actionType, "creation");
assert.strictEqual(gC.intent, "create_code_artifact");
console.log("✔ Test C — Affirmative implement command yields creation / create_code_artifact");

// 11. Test D: Analysis with explicit negative write constraint
const gD = understandGoal("Analyze current Mother architecture without changing any files.");
assert.strictEqual(gD.actionType, "analysis");
assert.ok(gD.intent === "read_only_audit" || gD.intent === "improve_autonomy");
console.log("✔ Test D — Analysis with negative write constraint yields analysis / read-only intent");

// 12. Test E: Affirmative fix command
const gE = understandGoal("Fix the Revenue Engine implementation.");
assert.strictEqual(gE.actionType, "modification");
assert.strictEqual(gE.intent, "modify_code_artifact");
console.log("✔ Test E — Affirmative fix command yields modification / modify_code_artifact");

// 13. Test Decomposer Read-Only Audit Path
const dA = decompose(gA);
assert.strictEqual(dA.length, 1);
assert.notStrictEqual(dA[0], "Analyze project");
assert.ok(dA[0].includes("Perform read-only repository inspection"));
assert.ok(dA[0].includes("Revenue Engine"));
console.log("✔ Test Decomposer A — read_only_audit decomposes to explicit read-only repository inspection task preserving goal text");

console.log("\nAll Goal Engine & Task Decomposer Regression Tests PASSED cleanly.");

