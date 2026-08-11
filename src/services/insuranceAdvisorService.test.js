const assert = require("assert");
const insuranceAdvisorService = require("./insuranceAdvisorService");
const garudaCommandRouter = require("./garudaCommandRouter");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  xx  ${name}: ${error.message}`);
  }
}

test("insurance intent detected for term/health/absli queries", () => {
  assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("term insurance kya hai"), true);
  assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("health insurance plan batao"), true);
  assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("absli plans"), true);
});

test("non-insurance messages are not intercepted", () => {
  assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("mujhe website chahiye"), false);
  assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("telegram bot banwana hai"), false);
});

test("health query is grounded in ABSLI knowledge with positioning", () => {
  const result = insuranceAdvisorService.answerInsuranceQuery("health insurance activ one nxt plan");
  assert.strictEqual(result.handled, true);
  assert.ok(result.answer.includes("AI Financial Advisor"));
  assert.ok(result.answer.includes("ABSLI"));
  assert.ok(result.answer.includes("garudaos.in"));
  assert.ok(result.answer.includes("₹30,000"));
  assert.ok(result.answer.includes("terms & conditions"));
});

test("term query returns a source-verified figure", () => {
  const result = insuranceAdvisorService.answerInsuranceQuery("term insurance kya hai");
  assert.strictEqual(result.grounded, true);
  assert.ok(Array.isArray(result.factsUsed) && result.factsUsed.length > 0);
  assert.ok(result.factsUsed.some((f) => Array.isArray(f.numbers) && f.numbers.length > 0));
});

test("command router maps insurance leadgen to insurance domain", () => {
  const detection = garudaCommandRouter.detectCommand("insurance ke liye leads generate karo");
  assert.strictEqual(detection.command, "leadgen");
  assert.strictEqual(detection.params.domain, "insurance");
});

test("command router maps absli to insurance domain", () => {
  const detection = garudaCommandRouter.detectCommand("absli ke liye leads nikalo");
  assert.strictEqual(detection.command, "leadgen");
  assert.strictEqual(detection.params.domain, "insurance");
});

test("command router detects insurance pitch command", () => {
  const detection = garudaCommandRouter.detectCommand("absli insurance pitch banao");
  assert.strictEqual(detection.command, "insurance_pitch");
});

test("insurance_pitch handler returns grounded advisor answer", () => {
  const result = garudaCommandRouter.handleInsurancePitch({ query: "absli term insurance plans" });
  assert.strictEqual(result.success, true);
  assert.ok(result.message.includes("ABSLI"));
});

console.log(`\ninsuranceAdvisorService.test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
