const path = require("path");
const fs = require("fs");
const os = require("os");
const assert = require("assert");

const founderMemoryService = require("./founderMemoryService");

let passed = 0;
let failed = 0;
let tmpDir;

function fresh() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-memory-"));
  founderMemoryService.setMemoryFile(path.join(tmpDir, "memory.json"));
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test("order capture heuristic detects order message", () => {
  const capture = founderMemoryService.captureMemoryFromMessage(
    "mujhe ek order mila hai humdard company ki ek dawa hai barshasha krke 1 container jana hai dubai"
  );
  assert.strictEqual(capture.action, "order");
  assert.ok(capture.text.includes("humdard"));
});

test("remember-note capture strips keyword", () => {
  const capture = founderMemoryService.captureMemoryFromMessage("yaad rakho: hamare paas ABSLI insurance partnership hai");
  assert.strictEqual(capture.action, "note");
  assert.ok(!/yaad rakho/i.test(capture.text));
  assert.ok(capture.text.includes("ABSLI"));
});

test("non-fact messages are not captured", () => {
  assert.strictEqual(founderMemoryService.captureMemoryFromMessage("hello, kaise ho"), null);
  assert.strictEqual(founderMemoryService.captureMemoryFromMessage("kya kar sakte ho"), null);
});

test("saveFact + getAllFacts recall persisted order", async () => {
  await founderMemoryService.addOrder("Hamdard Barshasha 1 container to Dubai");
  const memory = await founderMemoryService.getAllFacts();
  assert.ok(Array.isArray(memory.orders));
  assert.ok(memory.orders.some((o) => String(o).includes("Barshasha")));
});

test("duplicate facts are not saved twice", async () => {
  const first = await founderMemoryService.saveFact("business", "GARUDA websites bechta hai");
  const second = await founderMemoryService.saveFact("business", "GARUDA websites bechta hai");
  assert.strictEqual(first.saved, true);
  assert.strictEqual(second.saved, false);
  const memory = await founderMemoryService.getAllFacts();
  assert.strictEqual(memory.business.filter((b) => b === "GARUDA websites bechta hai").length, 1);
});

test("buildContextPack includes orders, partners and live pipeline", async () => {
  await founderMemoryService.addOrder("Hamdard Barshasha 1 container to Dubai");
  const pack = await founderMemoryService.buildContextPack();
  assert.ok(pack.includes("Hamdard Barshasha"));
  assert.ok(pack.includes("[Partners]"));
  assert.ok(pack.includes("ABSLI"));
  assert.ok(pack.includes("[Live Pipeline]"));
  assert.ok(pack.includes("bounced"));
});

(async function runAll() {
  for (const t of tests) {
    try {
      fresh();
      await t.fn();
      passed += 1;
      console.log(`  ok  ${t.name}`);
    } catch (error) {
      failed += 1;
      console.log(`  xx  ${t.name}: ${error.message}`);
    }
  }
  console.log(`\nfounderMemoryService.test: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
