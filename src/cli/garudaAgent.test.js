const assert = require("assert");
const { ToolRunner, dispatchCommand, localSovereignEngine } = require("./garudaAgent");

console.log("\n=== GARUDA SOVEREIGN AGENT CONSOLE TESTS ===\n");

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

// 1. Dispatch Command Tests
console.log("--- Deterministic Command Dispatcher ---");
test("dispatchCommand catches /status and status", () => {
  const d1 = dispatchCommand("/status");
  const d2 = dispatchCommand("status");
  assert.strictEqual(d1.type, "print");
  assert.strictEqual(d2.type, "print");
  assert.ok(d1.output.includes("GARUDA OPERATING SYSTEM"));
});

test("dispatchCommand catches doctor and health", () => {
  const d1 = dispatchCommand("doctor");
  const d2 = dispatchCommand("--doctor");
  assert.strictEqual(d1.type, "print");
  assert.strictEqual(d2.type, "print");
  assert.ok(d1.output.includes("GARUDA SOVEREIGN SYSTEM DOCTOR"));
});

test("dispatchCommand catches help flags", () => {
  const d1 = dispatchCommand("--help");
  const d2 = dispatchCommand("-h");
  assert.strictEqual(d1.type, "print");
  assert.strictEqual(d2.type, "print");
  assert.ok(d1.output.includes("COMMAND & CAPABILITY MANUAL"));
});

test("dispatchCommand catches version flags", () => {
  const d1 = dispatchCommand("-v");
  const d2 = dispatchCommand("--version");
  assert.strictEqual(d1.type, "print");
  assert.strictEqual(d2.type, "print");
  assert.ok(d1.output.includes("Praveen Mahawar"));
});

test("dispatchCommand catches exit commands", () => {
  assert.strictEqual(dispatchCommand("exit").type, "exit");
  assert.strictEqual(dispatchCommand("quit").type, "exit");
  assert.strictEqual(dispatchCommand("/exit").type, "exit");
  assert.strictEqual(dispatchCommand("band").type, "exit");
});

test("dispatchCommand catches clear commands", () => {
  assert.strictEqual(dispatchCommand("clear").type, "clear");
  assert.strictEqual(dispatchCommand("/clear").type, "clear");
  assert.strictEqual(dispatchCommand("cls").type, "clear");
});

test("dispatchCommand catches review <file>", () => {
  const d = dispatchCommand("review package.json");
  assert.strictEqual(d.type, "print");
  assert.ok(d.output.includes("package.json"));
});

test("dispatchCommand catches find <query>", () => {
  const d = dispatchCommand("find garudaAgent");
  assert.strictEqual(d.type, "print");
  assert.ok(d.output.includes("garudaAgent"));
});

test("dispatchCommand returns null for NL tasks", () => {
  assert.strictEqual(dispatchCommand("src/app.js me naya API banao"), null);
  assert.strictEqual(dispatchCommand("kitne agents hain?"), null);
});

// 2. ToolRunner Safety & Governance
console.log("\n--- ToolRunner Safety & Governance ---");
test("ToolRunner blocks unauthorized git commit", () => {
  const res = ToolRunner.runCommand("git commit -m 'test'");
  assert.ok(res.includes("GARUDA SOVEREIGN GATEKEEPER"));
});

test("ToolRunner blocks unauthorized git push", () => {
  const res = ToolRunner.runCommand("git push origin main");
  assert.ok(res.includes("GARUDA SOVEREIGN GATEKEEPER"));
});

test("ToolRunner catches placeholder command", () => {
  const res = ToolRunner.runCommand("your command here");
  assert.ok(res.includes("Placeholder command"));
});

test("ToolRunner systemStatus returns complete sovereign info", () => {
  const status = ToolRunner.systemStatus();
  assert.ok(status.includes("Praveen Mahawar"));
  assert.ok(status.includes("PAWAN"));
  assert.ok(status.includes("MOTHER BRAIN"));
  assert.ok(status.includes("LIVE, SOVEREIGN & UNRESTRICTED"));
});

test("ToolRunner systemDoctor audits host environment", () => {
  const doctor = ToolRunner.systemDoctor();
  assert.ok(doctor.includes("Host Environment"));
  assert.ok(doctor.includes("DEMO-READY"));
});

// 3. Sovereign Local Fallback
console.log("\n--- Sovereign Local Fallback Engine ---");
test("localSovereignEngine handles status query gracefully", () => {
  const res = localSovereignEngine("kaisa hai status?", []);
  assert.ok(res.includes("Praveen ji"));
  assert.ok(res.includes("Sovereign Local Engine"));
});

test("localSovereignEngine answers agent scalability with zero sysadmin jargon", () => {
  const res = localSovereignEngine("kitne agent bana sakte hain?", []);
  assert.ok(res.includes("unlimited (anant) agents"));
  assert.ok(!res.toLowerCase().includes("swap memory"));
});

console.log(`\n=== Summary ===`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
console.log(`  total:  ${passed + failed}\n`);

if (failed > 0) process.exit(1);
