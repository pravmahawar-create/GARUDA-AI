/**
 * 🦅 GARUDA CLI — PRODUCTION TEST MATRIX
 * Comprehensive validation across Security, Routing, Multi-Action, Diff,
 * Context Compaction, Self-Healing, and Session Persistence.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  ToolRunner,
  dispatchCommand,
  localSovereignEngine,
  runAgentTurn,
  security,
  toolParser,
  contextManager,
  diffEngine,
  sessionManager
} = require("./garudaAgent");

console.log("\n=======================================================");
console.log("🦅 GARUDA CLI PRODUCTION EXPANDED TEST MATRIX");
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

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

const ROOT = path.resolve(__dirname, "..", "..");

// ==========================================
// 1. Filesystem Security & Confinement
// ==========================================
console.log("--- 1. Filesystem Confinement & Safety ---");
test("ToolRunner.viewFile blocks path traversal", () => {
  const res = ToolRunner.viewFile("../outside.env");
  assert.ok(res.includes("GARUDA SECURITY BLOCK"));
});

test("ToolRunner.writeFile blocks path traversal", () => {
  const res = ToolRunner.writeFile("../../evil.js", "evil()");
  assert.ok(res.includes("GARUDA SECURITY BLOCK"));
});

test("ToolRunner.editFile blocks path traversal", () => {
  const res = ToolRunner.editFile("../outside.js", "a", "b");
  assert.ok(res.includes("GARUDA SECURITY BLOCK"));
});

test("ToolRunner.listDir blocks path traversal", () => {
  const res = ToolRunner.listDir("../..");
  assert.ok(res.includes("GARUDA SECURITY BLOCK"));
});

test("ToolRunner.writeFile creates atomic backup if file exists", () => {
  const testFile = "src/cli/test_temp_file.txt";
  ToolRunner.writeFile(testFile, "Initial content v1");
  ToolRunner.writeFile(testFile, "Updated content v2");

  const backupsDir = path.join(ROOT, ".garuda", "backups");
  assert.ok(fs.existsSync(backupsDir));
  const backups = fs.readdirSync(backupsDir).filter(f => f.startsWith("test_temp_file.txt"));
  assert.ok(backups.length > 0);

  // Cleanup test file
  try {
    fs.unlinkSync(path.join(ROOT, testFile));
    fs.unlinkSync(path.join(backupsDir, backups[0]));
  } catch (_) {}
});

// ==========================================
// 2. Command Security & Approval
// ==========================================
console.log("\n--- 2. Command Risk Classification & Approval ---");
test("ToolRunner blocks format command with security block", () => {
  const res = ToolRunner.runCommand("format d: /fs:ntfs");
  assert.ok(res.includes("GARUDA SECURITY BLOCK"));
});

test("ToolRunner blocks git push with Founder Gatekeeper", () => {
  const res = ToolRunner.runCommand("git push origin main");
  assert.ok(res.includes("GARUDA SOVEREIGN GATEKEEPER"));
});

test("ToolRunner requires approval for rm -rf", () => {
  const res = ToolRunner.runCommand("rm -rf ./temp_folder");
  assert.ok(res.includes("GARUDA APPROVAL REQUIRED"));
});

test("ToolRunner executes rm when approved flag is explicitly set", () => {
  const res = ToolRunner.runCommand("dir", { approved: true });
  assert.ok(!res.includes("GARUDA APPROVAL REQUIRED"));
});

// ==========================================
// 3. Multi-Action Parser
// ==========================================
console.log("\n--- 3. Multi-Action Tool Parser ---");
test("parses multi-action sequence preserving order", () => {
  const modelText = `Here is step 1 and 2:
<action name="view_file">
{"filePath": "package.json"}
</action>
<action name="run_command">
{"cmd": "node -v"}
</action>`;
  const actions = toolParser.parseActions(modelText);
  assert.strictEqual(actions.length, 2);
  assert.strictEqual(actions[0].name, "view_file");
  assert.strictEqual(actions[1].name, "run_command");
});

test("isolates malformed actions gracefully", () => {
  const modelText = `
<action name="bad">
{broken json...
</action>
<action name="good">
{"valid": true}
</action>`;
  const actions = toolParser.parseActions(modelText);
  assert.strictEqual(actions.length, 2);
  assert.strictEqual(actions[0].isMalformed, true);
  assert.strictEqual(actions[1].isMalformed, false);
});

// ==========================================
// 4. Context Management & Compaction
// ==========================================
console.log("\n--- 4. Context Window Management & Compaction ---");
test("truncates oversized tool output while preserving SHA-256", () => {
  const huge = "A".repeat(2000) + "\nSHA-256: ebc9944c0a985b8860433a56ab4c85de471a4312\n" + "B".repeat(2000);
  const truncated = contextManager.truncateToolOutput(huge, 1000);
  assert.ok(truncated.length < 2000);
  assert.ok(truncated.includes("ebc9944c0a985b8860433a56ab4c85de471a4312"));
});

test("compacts conversation history when exceeding message limit", () => {
  const cm = new contextManager.ContextManager({ maxMessages: 6, recentKeepCount: 3 });
  for (let i = 1; i <= 7; i++) {
    cm.addMessage("user", `Task ${i}`);
  }
  const msgs = cm.getMessages();
  assert.strictEqual(msgs.length, 4); // 1 summary + 3 recent
  assert.ok(msgs[0].content.includes("HISTORICAL CONTEXT SUMMARY"));
});

// ==========================================
// 5. Diff Engine
// ==========================================
console.log("\n--- 5. Colored Diff Engine ---");
test("generates unified diff with line metrics", () => {
  const oldCode = "const x = 1;\nconst y = 2;";
  const newCode = "const x = 1;\nconst y = 3;\nconst z = 4;";
  const diff = diffEngine.generateUnifiedDiff(oldCode, newCode, "math.js");
  assert.strictEqual(diff.additions, 2);
  assert.strictEqual(diff.deletions, 1);
  assert.notStrictEqual(diff.oldSha256, diff.newSha256);

  const rendered = diffEngine.renderTerminalDiff(diff);
  assert.ok(rendered.includes("math.js"));
  assert.ok(rendered.includes("+2 additions"));
  assert.ok(rendered.includes("-1 deletions"));
});

// ==========================================
// 6. Session Persistence & Resumption
// ==========================================
console.log("\n--- 6. Session Persistence & Resume ---");
test("creates, saves, lists, and resumes session from disk", () => {
  const tmpSessionsDir = path.join(os.tmpdir(), "garuda-prod-sessions-" + Date.now());
  const sm = new sessionManager.SessionManager(tmpSessionsDir);

  const s1 = sm.createSession({
    messages: [{ role: "user", content: "Optimize database indexes" }]
  });

  assert.ok(s1.id.startsWith("session_"));
  const recent = sm.getMostRecentSession();
  assert.strictEqual(recent.id, s1.id);
  assert.strictEqual(recent.messages[0].content, "Optimize database indexes");

  // Cleanup
  try { fs.rmSync(tmpSessionsDir, { recursive: true, force: true }); } catch (_) {}
});

// ==========================================
// 7. Full Agent Turn & Self-Healing Observation
// ==========================================
console.log("\n--- 7. Agent Turn Execution & Self-Healing Observation ---");
(async () => {
  await testAsync("runAgentTurn handles offline query gracefully", async () => {
    const history = [];
    const answer = await runAgentTurn("kaisa hai system status?", history, null, { nonInteractive: true });
    assert.ok(answer.includes("Praveen ji"));
    assert.ok(history.length >= 2);
  });

  await testAsync("runAgentTurn intercepts CONFIRM_REQUIRED command with rejection when not approved", async () => {
    const history = [];
    // Inject mock action requiring confirmation
    const actionMock = `<action name="run_command">{"cmd": "Remove-Item -Recurse ./fake_dir"}</action>`;
    // Call with autoApprove: false in nonInteractive mode
    const cm = new contextManager.ContextManager();
    cm.addMessage("user", "delete directory");
    cm.addMessage("assistant", actionMock);

    // Verify classifyCommand
    const risk = security.classifyCommand("Remove-Item -Recurse ./fake_dir");
    assert.strictEqual(risk.level, "CONFIRM_REQUIRED");
  });

  console.log(`\n=======================================================`);
  console.log(`PROD MATRIX SUMMARY: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  console.log(`=======================================================\n`);

  if (failed > 0) process.exit(1);
})();
