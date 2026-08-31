const assert = require("assert");
const { parseCommand } = require("./commandParser");
const { generateResponse } = require("./responseGenerator");
const { processInput } = require("./garudaCli");

let passed = 0;
let failed = 0;

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

async function main() {
  console.log("\n=== GARUDA CLI Tests ===\n");

  console.log("--- Command Parser ---");
  await test("parseCommand parses help", () => {
    const cmd = parseCommand("help");
    assert.strictEqual(cmd.command, "help");
  });

  await test("parseCommand parses Hindi help", () => {
    const cmd = parseCommand("?");
    assert.strictEqual(cmd.command, "help");
  });

  await test("parseCommand parses status", () => {
    const cmd = parseCommand("status");
    assert.strictEqual(cmd.command, "status");
  });

  await test("parseCommand parses Hindi status", () => {
    const cmd = parseCommand("kya haal hai");
    assert.strictEqual(cmd.command, "status");
  });

  await test("parseCommand parses review with arg", () => {
    const cmd = parseCommand("review app.js");
    assert.strictEqual(cmd.command, "review");
    assert.strictEqual(cmd.args[0], "app.js");
  });

  await test("parseCommand parses plan", () => {
    const cmd = parseCommand("plan fix login bug");
    assert.strictEqual(cmd.command, "plan");
    assert.strictEqual(cmd.args[0], "fix login bug");
  });

  await test("parseCommand parses find", () => {
    const cmd = parseCommand("find repository");
    assert.strictEqual(cmd.command, "find");
    assert.strictEqual(cmd.args[0], "repository");
  });

  await test("parseCommand parses generate", () => {
    const cmd = parseCommand("generate function");
    assert.strictEqual(cmd.command, "generate");
    assert.strictEqual(cmd.args[0], "function");
  });

  await test("parseCommand parses remember", () => {
    const cmd = parseCommand("remember important lesson");
    assert.strictEqual(cmd.command, "remember");
    assert.strictEqual(cmd.args[0], "important lesson");
  });

  await test("parseCommand parses quit", () => {
    const cmd = parseCommand("quit");
    assert.strictEqual(cmd.command, "quit");
  });

  await test("parseCommand parses Hindi quit", () => {
    const cmd = parseCommand("band");
    assert.strictEqual(cmd.command, "quit");
  });

  await test("parseCommand parses empty", () => {
    const cmd = parseCommand("");
    assert.strictEqual(cmd.command, "empty");
  });

  await test("parseCommand parses unknown as chat", () => {
    const cmd = parseCommand("random text here");
    assert.strictEqual(cmd.command, "chat");
  });

  console.log("\n--- Response Generator ---");
  await test("generateResponse responds to help", () => {
    const resp = generateResponse({ command: "help", args: [] });
    assert.ok(resp.includes("GARUDA Commands"));
    assert.ok(resp.includes("review"));
  });

  await test("generateResponse responds to status", () => {
    const resp = generateResponse({ command: "status", args: [] }, { capabilities: 8, lessons: 100, healthStatus: "healthy" });
    assert.ok(resp.includes("8"));
    assert.ok(resp.includes("100"));
  });

  await test("generateResponse responds to health", () => {
    const resp = generateResponse({ command: "health", args: [] }, { health: { disk: "healthy", diskUsage: "45", memory: "healthy", memoryUsage: "60", overall: "healthy" } });
    assert.ok(resp.includes("Disk"));
    assert.ok(resp.includes("45"));
  });

  await test("generateResponse responds to capabilities", () => {
    const resp = generateResponse({ command: "capabilities", args: [] }, { capabilityList: [{ name: "Test", category: "eng", maturity: "production" }] });
    assert.ok(resp.includes("Test"));
  });

  await test("generateResponse responds to review", () => {
    const resp = generateResponse({ command: "review", args: ["app.js"] }, { reviewResult: { verdict: "APPROVE", score: 90, issues: [] } });
    assert.ok(resp.includes("APPROVE"));
    assert.ok(resp.includes("90"));
  });

  await test("generateResponse responds to plan", () => {
    const resp = generateResponse({ command: "plan", args: ["fix bug"] }, { planResult: { steps: [{ type: "analyze", description: "Analyze" }], reasoning: ["Rule triggered"] } });
    assert.ok(resp.includes("analyze"));
  });

  await test("generateResponse responds to find", () => {
    const resp = generateResponse({ command: "find", args: ["app"] }, { findResults: [{ path: "src/app.js" }] });
    assert.ok(resp.includes("src/app.js"));
  });

  await test("generateResponse responds to generate", () => {
    const resp = generateResponse({ command: "generate", args: ["function"] }, { generatedCode: "function hello() {}" });
    assert.ok(resp.includes("function hello()"));
  });

  await test("generateResponse responds to remember", () => {
    const resp = generateResponse({ command: "remember", args: ["important"] });
    assert.ok(resp.includes("Yaad"));
  });

  await test("generateResponse responds to quit", () => {
    const resp = generateResponse({ command: "quit", args: [] });
    assert.ok(resp.includes("Alvida"));
  });

  await test("generateResponse responds to chat greeting", () => {
    const resp = generateResponse({ command: "chat", args: ["hello"] });
    assert.ok(resp.includes("Namaste") || resp.includes("GARUDA"));
  });

  await test("generateResponse responds to empty", () => {
    const resp = generateResponse({ command: "empty", args: [] });
    assert.ok(resp.includes("Bolo"));
  });

  console.log("\n--- Integration ---");
  await test("processInput parses and responds to help", () => {
    const resp = processInput("help");
    assert.ok(resp.includes("GARUDA Commands"));
  });

  await test("processInput parses and responds to status", () => {
    const resp = processInput("status");
    assert.ok(resp.includes("GARUDA Status"));
  });

  await test("processInput parses Hindi commands", () => {
    const resp = processInput("kya haal hai");
    assert.ok(resp.includes("Status"));
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
