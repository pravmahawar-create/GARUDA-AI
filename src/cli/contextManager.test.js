const assert = require("assert");
const { ContextManager, truncateToolOutput, estimateTokens } = require("./contextManager");

console.log("\n=== GARUDA CLI CONTEXT MANAGER TESTS ===\n");

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

// 1. Tool Output Truncation
test("preserves short tool output without truncation", () => {
  const short = "All 5 tests passed.";
  const out = truncateToolOutput(short, 100);
  assert.strictEqual(out, short);
});

test("truncates oversized output preserving head, tail and SHA-256", () => {
  const longOutput = "START_LINE\n" + "x".repeat(5000) + "\nSHA-256: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n" + "y".repeat(5000) + "\nEND_LINE";
  const truncated = truncateToolOutput(longOutput, 2000);
  assert.ok(truncated.length < 3000);
  assert.ok(truncated.includes("START_LINE"));
  assert.ok(truncated.includes("END_LINE"));
  assert.ok(truncated.includes("truncated for context hygiene"));
  assert.ok(truncated.includes("0123456789abcdef"));
});

// 2. Token Estimation
test("estimates token counts sensibly", () => {
  const tokens = estimateTokens("const a = 1234;");
  assert.ok(tokens > 0 && tokens < 10);
});

// 3. Compaction by Message Count
test("compacts older history when message count exceeds threshold", () => {
  const cm = new ContextManager({
    maxMessages: 10,
    recentKeepCount: 4,
    maxContextChars: 100000
  });

  // Adding 11 messages should trigger compaction from 11 -> 5 (1 summary + 4 recent)
  for (let i = 1; i <= 11; i++) {
    cm.addMessage(i % 2 === 1 ? "user" : "assistant", `Message #${i}: Doing step ${i}`);
  }

  const msgs = cm.getMessages();
  assert.strictEqual(msgs.length, 5);
  assert.ok(msgs[0].content.includes("HISTORICAL CONTEXT SUMMARY"));
  assert.ok(msgs[4].content.includes("Message #11"));
});

// 4. Compaction by Character Limit
test("compacts older history when character limit exceeded", () => {
  const cm = new ContextManager({
    maxMessages: 50,
    recentKeepCount: 2,
    maxContextChars: 1000
  });

  // Adding 3 large messages forces character limit compaction
  cm.addMessage("user", "Large payload 1: " + "a".repeat(600));
  cm.addMessage("assistant", "Large payload 2: " + "b".repeat(600));
  cm.addMessage("user", "Large payload 3: " + "c".repeat(600));

  const msgs = cm.getMessages();
  // Expect 1 summary message + 2 recent messages = 3 messages
  assert.strictEqual(msgs.length, 3);
  assert.ok(msgs[0].content.includes("HISTORICAL CONTEXT SUMMARY"));
  assert.ok(msgs[2].content.includes("Large payload 3"));
});

console.log(`\n=== Summary ===`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
console.log(`  total:  ${passed + failed}\n`);

if (failed > 0) process.exit(1);
