const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { SessionManager } = require("./sessionManager");

console.log("\n=== GARUDA CLI SESSION MANAGER TESTS ===\n");

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

// Use a temporary isolated test directory
const testDir = path.join(os.tmpdir(), "garuda-sessions-test-" + Date.now());
const sm = new SessionManager(testDir);

test("creates and saves new session with timestamps", () => {
  const s = sm.createSession({
    messages: [{ role: "user", content: "Build test feature" }]
  });
  assert.ok(s.id.startsWith("session_"));
  assert.ok(s.createdAt);
  assert.strictEqual(s.messages.length, 1);

  const loaded = sm.loadSession(s.id);
  assert.strictEqual(loaded.id, s.id);
  assert.strictEqual(loaded.messages[0].content, "Build test feature");
});

test("redacts secret tokens from persistent disk session", () => {
  const s = sm.createSession({
    messages: [{ role: "user", content: "Hello" }],
    metadata: {
      API_KEY: "secret12345",
      AUTH_TOKEN: "bearer-token-abc"
    }
  });

  const loaded = sm.loadSession(s.id);
  assert.strictEqual(loaded.metadata.API_KEY, "[REDACTED]");
  assert.strictEqual(loaded.metadata.AUTH_TOKEN, "[REDACTED]");
});

test("lists sessions ordered by update timestamp descending", () => {
  const s1 = sm.createSession({ messages: [{ role: "user", content: "Task 1" }] });
  const s2 = sm.createSession({ messages: [{ role: "user", content: "Task 2" }] });

  const list = sm.listSessions();
  assert.ok(list.length >= 2);
  assert.strictEqual(list[0].id, s2.id); // s2 is newest
});

test("getMostRecentSession retrieves the latest session", () => {
  const latest = sm.getMostRecentSession();
  assert.ok(latest);
  assert.ok(latest.id);
});

test("handles corrupted session file gracefully without crashing", () => {
  const corruptFile = path.join(testDir, "corrupted_session.json");
  fs.writeFileSync(corruptFile, "{not valid json at all...}}}", "utf8");

  const loaded = sm.loadSession("corrupted_session");
  assert.strictEqual(loaded, null);

  const list = sm.listSessions();
  assert.ok(Array.isArray(list));
});

// Cleanup temp test directory
try {
  fs.rmSync(testDir, { recursive: true, force: true });
} catch (_) {}

console.log(`\n=== Summary ===`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
console.log(`  total:  ${passed + failed}\n`);

if (failed > 0) process.exit(1);
