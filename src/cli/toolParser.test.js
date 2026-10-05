const assert = require("assert");
const { parseActions, parseThoughts, parseToolParams, sanitizeOutput } = require("./toolParser");

console.log("\n=== GARUDA CLI TOOL PARSER TESTS ===\n");

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

// 1. Single Action
test("parses single action correctly", () => {
  const text = `I will run the tests.
<action name="run_command">
{"cmd": "npm test"}
</action>`;
  const actions = parseActions(text);
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].name, "run_command");
  assert.strictEqual(actions[0].params.cmd, "npm test");
  assert.strictEqual(actions[0].isMalformed, false);
});

// 2. Two Sequential Actions
test("parses two sequential actions preserving order", () => {
  const text = `Step 1 and Step 2:
<action name="view_file">
{"filePath": "package.json", "startLine": 1, "endLine": 20}
</action>
Then:
<action name="run_command">
{"cmd": "npm run test:cli"}
</action>`;
  const actions = parseActions(text);
  assert.strictEqual(actions.length, 2);
  assert.strictEqual(actions[0].name, "view_file");
  assert.strictEqual(actions[0].params.filePath, "package.json");
  assert.strictEqual(actions[1].name, "run_command");
  assert.strictEqual(actions[1].params.cmd, "npm run test:cli");
});

// 3. Five Actions Bounded
test("parses 5 actions correctly", () => {
  let text = "";
  for (let i = 1; i <= 5; i++) {
    text += `<action name="tool_${i}">{"idx": ${i}}</action>\n`;
  }
  const actions = parseActions(text, 5);
  assert.strictEqual(actions.length, 5);
  assert.strictEqual(actions[4].name, "tool_5");
  assert.strictEqual(actions[4].params.idx, 5);
});

// 4. Exceeding Max Actions Bounded
test("enforces bounded maximum actions per turn", () => {
  let text = "";
  for (let i = 1; i <= 8; i++) {
    text += `<action name="tool_${i}">{"idx": ${i}}</action>\n`;
  }
  const actions = parseActions(text, 5);
  assert.strictEqual(actions.length, 5);
});

// 5. Malformed First + Valid Second
test("handles malformed first action without corrupting valid second", () => {
  const text = `
<action name="broken_tool">
{this is invalid json not valid at all
</action>
<action name="run_command">
{"cmd": "node -v"}
</action>`;
  const actions = parseActions(text);
  assert.strictEqual(actions.length, 2);
  assert.strictEqual(actions[0].name, "broken_tool");
  assert.strictEqual(actions[0].isMalformed, true);
  assert.strictEqual(actions[1].name, "run_command");
  assert.strictEqual(actions[1].isMalformed, false);
  assert.strictEqual(actions[1].params.cmd, "node -v");
});

// 6. Valid First + Malformed Second
test("handles valid first + malformed second", () => {
  const text = `
<action name="view_file">
{"filePath": "server.js"}
</action>
<action name="broken_tool">
{{bad:json,
</action>`;
  const actions = parseActions(text);
  assert.strictEqual(actions.length, 2);
  assert.strictEqual(actions[0].name, "view_file");
  assert.strictEqual(actions[0].isMalformed, false);
  assert.strictEqual(actions[1].name, "broken_tool");
  assert.strictEqual(actions[1].isMalformed, true);
});

// 7. Multiline JSON
test("parses multiline JSON with special characters and linebreaks", () => {
  const text = `
<action name="write_file">
{
  "filePath": "src/hello.js",
  "content": "const a = 1;\nconsole.log(a);\n"
}
</action>`;
  const actions = parseActions(text);
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].name, "write_file");
  assert.strictEqual(actions[0].params.filePath, "src/hello.js");
  assert.ok(actions[0].params.content.includes("console.log(a)"));
});

// 8. Duplicate Tool Actions
test("supports duplicate tool actions in sequence", () => {
  const text = `
<action name="run_command">
{"cmd": "git status"}
</action>
<action name="run_command">
{"cmd": "git branch"}
</action>`;
  const actions = parseActions(text);
  assert.strictEqual(actions.length, 2);
  assert.strictEqual(actions[0].name, "run_command");
  assert.strictEqual(actions[0].params.cmd, "git status");
  assert.strictEqual(actions[1].name, "run_command");
  assert.strictEqual(actions[1].params.cmd, "git branch");
});

// 9. Thought Extraction & Sanitization
test("extracts thoughts and sanitizes output text cleanly", () => {
  const text = `<thought>Investigating the bug in server.js</thought>
I will inspect server.js.
<action name="view_file">{"filePath": "server.js"}</action>`;
  const thoughts = parseThoughts(text);
  assert.strictEqual(thoughts.length, 1);
  assert.strictEqual(thoughts[0], "Investigating the bug in server.js");

  const clean = sanitizeOutput(text);
  assert.strictEqual(clean, "I will inspect server.js.");
});

console.log(`\n=== Summary ===`);
console.log(`  passed: ${passed}`);
console.log(`  failed: ${failed}`);
console.log(`  total:  ${passed + failed}\n`);

if (failed > 0) process.exit(1);
