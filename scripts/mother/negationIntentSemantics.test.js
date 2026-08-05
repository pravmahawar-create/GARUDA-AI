const assert = require("assert");
const { understandGoal } = require("./goalEngine");

console.log("=== NEGATION INTENT SEMANTICS REGRESSION TEST SUITE ===\n");

const readOnlyPrompts = [
  "Do not modify, create, delete, commit, or push any file.",
  "Inspect the repository. Do not modify anything.",
  "Audit the Revenue Engine without changing files.",
  "Read the implementation and report your findings.",
  "Verify whether this module exists. No writes.",
  "Analyze this code but don't commit or push anything.",
  "Inspect repository without changing code.",
  "Read-only audit of mother brain modules."
];

readOnlyPrompts.forEach((prompt, index) => {
  const g = understandGoal(prompt);
  assert.strictEqual(
    g.actionType,
    "analysis",
    `Failed actionType test for prompt #${index + 1}: "${prompt}" (got: ${g.actionType})`
  );
  assert.strictEqual(
    g.intent,
    "read_only_audit",
    `Failed intent test for prompt #${index + 1}: "${prompt}" (got: ${g.intent})`
  );
  console.log(`✔ Read-Only Prompt #${index + 1} ("${prompt.substring(0, 45)}..."): actionType=analysis, intent=read_only_audit`);
});

// Affirmative write commands must still trigger write actionTypes
console.log("\n--- AFFIRMATIVE WRITE INTENT TESTS ---");

const gWrite1 = understandGoal("Modify the Revenue Engine code to add a function.");
assert.ok(gWrite1.actionType === "modification" || gWrite1.actionType === "creation");
assert.ok(gWrite1.intent === "modify_code_artifact" || gWrite1.intent === "create_code_artifact");
console.log("✔ Affirmative Write #1: actionType=" + gWrite1.actionType + ", intent=" + gWrite1.intent);

const gWrite2 = understandGoal("Create module named newLoggerService in src/services");
assert.strictEqual(gWrite2.actionType, "creation");
assert.strictEqual(gWrite2.intent, "create_code_artifact");
console.log("✔ Affirmative Write #2: actionType=creation, intent=create_code_artifact");

console.log("\nALL NEGATION INTENT SEMANTICS TESTS PASSED CLEANLY!");
