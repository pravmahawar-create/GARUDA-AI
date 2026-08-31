const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createWorktree, removeWorktree, listWorktrees, getWorktreePath, isWorktreeClean, execGit } = require("./worktreeManager");
const { generateBranchName, parseBranchName, generateEvidenceId } = require("./branchNaming");
const { generateDiff, generateDiffSummary } = require("./diffGenerator");
const { findAbandonedWorktrees, cleanupAbandoned } = require("./worktreeCleaner");

let passed = 0;
let failed = 0;
const TEST_TASKS = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(() => { passed++; console.log(`  ok  ${name}`); }).catch((err) => { failed++; console.log(`  xx  ${name}: ${err.message}`); });
    }
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  xx  ${name}: ${err.message}`);
  }
}

function cleanup() {
  for (const taskId of TEST_TASKS) {
    try { removeWorktree(taskId); } catch {}
  }
}

async function main() {
  console.log("\n=== Git Worktree Isolation Tests ===\n");

  console.log("--- Branch Naming ---");
  await test("generateBranchName creates valid branch name", () => {
    const name = generateBranchName("fix-login-bug");
    assert.ok(name.startsWith("garuda/task/"), "Should start with garuda/task/");
    assert.ok(name.includes("fix-login-bug"), "Should contain task id");
  });

  await test("generateBranchName sanitizes special chars", () => {
    const name = generateBranchName("fix login/bug: v2.0");
    assert.ok(!name.includes("/login"), "Should sanitize slashes");
    assert.ok(!name.includes(":"), "Should sanitize colons");
  });

  await test("parseBranchName parses correctly", () => {
    const parsed = parseBranchName("garuda/task/fix-bug-abc123");
    assert.ok(parsed, "Should parse");
    assert.strictEqual(parsed.prefix, "garuda");
    assert.strictEqual(parsed.taskId, "fix-bug");
  });

  await test("parseBranchName returns null for invalid", () => {
    const parsed = parseBranchName("main");
    assert.strictEqual(parsed, null);
  });

  await test("generateEvidenceId creates hex string", () => {
    const id = generateEvidenceId();
    assert.strictEqual(id.length, 16);
    assert.ok(/^[a-f0-9]+$/.test(id));
  });

  console.log("\n--- Worktree Manager ---");
  await test("createWorktree creates isolated directory", () => {
    const taskId = "test-phase4-create";
    TEST_TASKS.push(taskId);
    const branch = generateBranchName(taskId);
    const result = createWorktree(taskId, branch);
    assert.ok(result.success, "Should succeed: " + (result.error || ""));
    assert.ok(fs.existsSync(result.path), "Worktree directory should exist");
    assert.ok(result.branch.includes(taskId), "Branch should contain task id");
  });

  await test("createWorktree fails for duplicate", () => {
    const taskId = "test-phase4-dup";
    TEST_TASKS.push(taskId);
    const branch = generateBranchName(taskId);
    const r1 = createWorktree(taskId, branch);
    assert.ok(r1.success, "First should succeed");
    const r2 = createWorktree(taskId, branch);
    assert.ok(!r2.success, "Duplicate should fail");
  });

  await test("listWorktrees shows created worktrees", () => {
    const worktrees = listWorktrees();
    assert.ok(Array.isArray(worktrees));
    const found = worktrees.some((w) => w.path.includes("test-phase4-create"));
    assert.ok(found, "Should find our test worktree");
  });

  await test("isWorktreeClean returns true for clean worktree", () => {
    const result = isWorktreeClean("test-phase4-create");
    assert.strictEqual(result, true);
  });

  await test("getWorktreePath returns correct path", () => {
    const p = getWorktreePath("test-phase4-create");
    assert.ok(p.includes("worktrees"));
    assert.ok(p.includes("test-phase4-create"));
  });

  console.log("\n--- Diff Generator ---");
  await test("generateDiff works on clean worktree", () => {
    const wtPath = getWorktreePath("test-phase4-create");
    const result = generateDiff(wtPath);
    assert.ok(result.success, "Should succeed");
  });

  await test("generateDiffSummary returns summary", () => {
    const wtPath = getWorktreePath("test-phase4-create");
    const result = generateDiffSummary(wtPath);
    assert.ok(result.success, "Should succeed");
    assert.ok(typeof result.totalFiles === "number", "Should have totalFiles");
  });

  console.log("\n--- Worktree Cleaner ---");
  await test("findAbandonedWorktrees returns array", () => {
    const result = findAbandonedWorktrees();
    assert.ok(Array.isArray(result), "Should return array");
  });

  await test("cleanupAbandoned works", () => {
    const result = cleanupAbandoned();
    assert.ok(typeof result.cleaned === "number");
  });

  console.log("\n--- Integration ---");
  await test("service can be imported without error", () => {
    const svc = require("./gitIsolationService");
    assert.ok(svc, "Should export service");
    assert.ok(typeof svc.createWorktree === "function");
    assert.ok(typeof svc.generateBranchName === "function");
    assert.ok(typeof svc.generateDiff === "function");
  });

  console.log("\n--- Cleanup ---");
  await test("removeWorktree cleans up", () => {
    for (const taskId of TEST_TASKS) {
      const result = removeWorktree(taskId);
      assert.ok(result.success, `Should remove ${taskId}: ${result.error || ""}`);
    }
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  cleanup();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  cleanup();
  process.exit(1);
});
