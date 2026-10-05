const assert = require("assert");
const { parseSSELines } = require("./streamProvider");

console.log("\n=== GARUDA CLI STREAM PROVIDER TESTS ===\n");

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

test("parses single data line from SSE chunk", () => {
  const chunk = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';
  const { dataLines, remaining } = parseSSELines(chunk);
  assert.strictEqual(dataLines.length, 1);
  assert.strictEqual(dataLines[0], '{"choices":[{"delta":{"content":"Hello"}}]}');
  assert.strictEqual(remaining, "");
});

test("buffers incomplete SSE lines across chunk boundaries", () => {
  const chunk1 = 'data: {"choic';
  const chunk2 = 'es":[{"delta":{"content":"World"}}]}\n\n';

  const r1 = parseSSELines(chunk1);
  assert.strictEqual(r1.dataLines.length, 0);
  assert.strictEqual(r1.remaining, 'data: {"choic');

  const r2 = parseSSELines(r1.remaining + chunk2);
  assert.strictEqual(r2.dataLines.length, 1);
  assert.ok(r2.dataLines[0].includes("World"));
});

test("handles [DONE] token termination line", () => {
  const chunk = 'data: [DONE]\n\n';
  const { dataLines } = parseSSELines(chunk);
  assert.strictEqual(dataLines[0], "[DONE]");
});

console.log(`\n=== Summary ===`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
console.log(`  total:  ${passed + failed}\n`);

if (failed > 0) process.exit(1);
