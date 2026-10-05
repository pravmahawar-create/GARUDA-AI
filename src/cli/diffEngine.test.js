const assert = require("assert");
const { generateUnifiedDiff, renderTerminalDiff, isBinary } = require("./diffEngine");

console.log("\n=== GARUDA CLI DIFF ENGINE TESTS ===\n");

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

test("detects line additions correctly", () => {
  const oldText = "line 1\nline 2";
  const newText = "line 1\nline 1.5\nline 2";
  const diff = generateUnifiedDiff(oldText, newText, "test.js");
  assert.strictEqual(diff.additions, 1);
  assert.strictEqual(diff.deletions, 0);
  assert.strictEqual(diff.isBinary, false);
});

test("detects line deletions correctly", () => {
  const oldText = "line 1\nline 2\nline 3";
  const newText = "line 1\nline 3";
  const diff = generateUnifiedDiff(oldText, newText, "test.js");
  assert.strictEqual(diff.additions, 0);
  assert.strictEqual(diff.deletions, 1);
});

test("detects replacements (additions + deletions)", () => {
  const oldText = "function oldCode() {}";
  const newText = "function newCode() {}";
  const diff = generateUnifiedDiff(oldText, newText, "test.js");
  assert.strictEqual(diff.additions, 1);
  assert.strictEqual(diff.deletions, 1);
  assert.notStrictEqual(diff.oldSha256, diff.newSha256);
});

test("handles identical content with zero additions/deletions", () => {
  const text = "constant code line";
  const diff = generateUnifiedDiff(text, text, "test.js");
  assert.strictEqual(diff.additions, 0);
  assert.strictEqual(diff.deletions, 0);
  assert.strictEqual(diff.oldSha256, diff.newSha256);
});

test("detects binary content", () => {
  const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0xff]);
  assert.strictEqual(isBinary(binaryBuffer), true);
  assert.strictEqual(isBinary("clean text string"), false);

  const diff = generateUnifiedDiff(binaryBuffer, binaryBuffer, "image.png");
  assert.strictEqual(diff.isBinary, true);
});

test("renders ANSI terminal diff with filename and metrics", () => {
  const oldText = "alpha\nbeta";
  const newText = "alpha\ngamma";
  const diff = generateUnifiedDiff(oldText, newText, "sample.js");
  const rendered = renderTerminalDiff(diff);
  assert.ok(rendered.includes("FILE CHANGED:"));
  assert.ok(rendered.includes("sample.js"));
  assert.ok(rendered.includes("+1 additions"));
  assert.ok(rendered.includes("-1 deletions"));
  assert.ok(rendered.includes("+ gamma"));
  assert.ok(rendered.includes("- beta"));
});

console.log(`\n=== Summary ===`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
console.log(`  total:  ${passed + failed}\n`);

if (failed > 0) process.exit(1);
