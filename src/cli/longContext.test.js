/**
 * 🦅 GARUDA CLI — LONG-CONTEXT PIPELINE UNIT TESTS (PART E)
 * 
 * Verifies:
 * - E1: Prompt decomposition into structured TaskContract
 * - Preservation of intent, constraints, do-not-do, file references, deadlines
 * - E2: Prompt persistence surviving context compaction and reload
 * - E3: Document indexer, chunking, SHA-256 hashing, and top-K relevance retrieval
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  LongContextPipeline,
  TaskContract,
  PromptDecomposer,
  DocumentIndexer,
  TaskPersistenceManager
} = require("./longContext");

console.log("\n=======================================================");
console.log("🦅 GARUDA CLI LONG-CONTEXT & HUGE PROMPT TEST MATRIX");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

const ROOT = path.resolve(__dirname, "..", "..");
const tempTasksDir = path.join(os.tmpdir(), "garuda-tasks-test-" + Date.now());

try {
  // ==========================================
  // E1: Prompt Decomposition & Task Contract
  // ==========================================
  console.log("--- E1: Task Contract Extraction ---");
  test("decomposes huge complex prompt preserving constraints, files, tools, and deadlines", () => {
    const hugePrompt = `
# OBJECTIVE
Build an end-to-end audit engine for GARUDA CLI and verify all modules.

# REQUIREMENTS
1. Inspect src/cli/security.js for bypasses.
2. Run npm test to verify unit tests.
3. Update package.json scripts.
4. Deadline is 15 October 2026.

# CONSTRAINTS
- Must strictly maintain exit code 0.
- Must preserve existing working behavior.

# DO-NOT-DO
- Never execute git commit without Founder authorization.
- Never execute git push.
- No deployment to Vercel or Render.

# ACCEPTANCE CRITERIA
[ ] All 108 existing tests pass.
[ ] New security tests pass.
    `;

    const contract = PromptDecomposer.decompose(hugePrompt);

    assert.ok(contract.objective.includes("Build an end-to-end audit engine"));
    assert.ok(contract.requirements.length >= 3);
    assert.ok(contract.constraints.some(c => c.includes("exit code 0")));
    assert.ok(contract.doNotDo.some(d => d.includes("git commit")));
    assert.ok(contract.doNotDo.some(d => d.includes("git push")));
    assert.ok(contract.files.includes("src/cli/security.js"));
    assert.ok(contract.files.includes("package.json"));
    assert.ok(contract.tools.includes("run_command") || contract.tools.includes("view_file"));
    assert.ok(contract.deadlines.length > 0);
    assert.strictEqual(contract.acceptanceCriteria.length, 2);
  });

  // ==========================================
  // E2: Prompt Persistence & Survival Across Compaction
  // ==========================================
  console.log("\n--- E2: Task Contract Persistence & Resume ---");
  test("persists task contract to disk atomically and reloads accurately", () => {
    const pm = new TaskPersistenceManager(tempTasksDir);
    const contract = new TaskContract({
      objective: "Persist crucial instructions",
      constraints: ["Strictly zero hallucination"],
      doNotDo: ["No unauthorized commits"],
      files: ["src/app.js"]
    });

    const saved = pm.saveTaskContract(contract);
    assert.strictEqual(saved, true);

    const reloaded = pm.loadTaskContract(contract.id);
    assert.ok(reloaded !== null);
    assert.strictEqual(reloaded.id, contract.id);
    assert.strictEqual(reloaded.objective, "Persist crucial instructions");
    assert.deepStrictEqual(reloaded.constraints, ["Strictly zero hallucination"]);
    assert.deepStrictEqual(reloaded.files, ["src/app.js"]);

    // Test getLatestTaskContract
    const latest = pm.getLatestTaskContract();
    assert.ok(latest !== null);
    assert.strictEqual(latest.id, contract.id);
  });

  // ==========================================
  // E3: Document Chunking, Hashing & Relevant Retrieval
  // ==========================================
  console.log("\n--- E3: Document Indexing & Chunk Retrieval ---");
  test("chunks large documents, computes SHA-256 and retrieves relevant windows", () => {
    const indexer = new DocumentIndexer({ chunkSize: 300, chunkOverlap: 50 });

    const sampleDoc = `
# SECTION 1: INTRODUCTION
GARUDA Operating System is engineered by Praveen Mahawar.
It provides sovereign artificial intelligence workflows.

# SECTION 2: BILLING APIS
The billing API handles invoice calculation, CGST, SGST, and totals.
Invoice totals are computed reactive to GSTIN input.
Sharma Hardware uses GSTIN 23AABCS1429B1ZB.

# SECTION 3: KUNDLI ASTROLOGY
Sanatan Setu generates Vedic horoscope and planetary positions.
    `.trim();

    const meta = indexer.ingestDocument("docs/architecture.md", sampleDoc);
    assert.ok(meta.chunkCount >= 2);
    assert.ok(meta.docSha256);

    // Test Retrieval
    const results = indexer.retrieve("Sharma Hardware GSTIN", 2);
    assert.ok(results.length > 0);
    assert.ok(results[0].content.includes("Sharma Hardware"));
    assert.ok(results[0].sha256);
    assert.strictEqual(results[0].docPath, "docs/architecture.md");

    // Test Summary
    const summary = indexer.generateIndexSummary();
    assert.ok(summary.includes("docs/architecture.md"));
    assert.ok(summary.includes("chunks"));
  });

} finally {
  try { fs.rmSync(tempTasksDir, { recursive: true, force: true }); } catch (_) {}
}

console.log(`\n=======================================================`);
console.log(`LONG-CONTEXT SUITE SUMMARY: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
console.log(`=======================================================\n`);

if (failed > 0) process.exit(1);
