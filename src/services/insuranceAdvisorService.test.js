const assert = require("assert");
const insuranceAdvisorService = require("./insuranceAdvisorService");
const garudaCommandRouter = require("./garudaCommandRouter");

let passed = 0;
let failed = 0;

async function run(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  xx  ${name}: ${error.message}`);
  }
}

async function main() {
  await run("insurance intent detected for term/health/absli queries", () => {
    assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("term insurance kya hai"), true);
    assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("health insurance plan batao"), true);
    assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("absli plans"), true);
  });

  await run("non-insurance messages are not intercepted", () => {
    assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("mujhe website chahiye"), false);
    assert.strictEqual(insuranceAdvisorService.detectInsuranceIntent("telegram bot banwana hai"), false);
  });

  await run("health query is grounded in ABSLI knowledge with positioning", async () => {
    const result = await insuranceAdvisorService.answerInsuranceQuery("health insurance activ one nxt plan");
    assert.strictEqual(result.handled, true);
    assert.ok(result.answer.includes("AI Financial Advisor"));
    assert.ok(result.answer.includes("ABSLI"));
    assert.ok(result.answer.includes("garudaos.in"));
    assert.ok(result.answer.includes("₹30,000"));
    assert.ok(result.answer.includes("terms & conditions"));
  });

  await run("term query returns a source-verified figure", async () => {
    const result = await insuranceAdvisorService.answerInsuranceQuery("term insurance kya hai");
    assert.strictEqual(result.grounded, true);
    assert.ok(Array.isArray(result.factsUsed) && result.factsUsed.length > 0);
    assert.ok(result.factsUsed.some((f) => Array.isArray(f.numbers) && f.numbers.length > 0));
  });

  await run("unknown insurance question does not fabricate figures", async () => {
    const result = await insuranceAdvisorService.answerInsuranceQuery("bima insurance product 100% guaranteed profit");
    assert.ok(result.grounded === false || Array.isArray(result.factsUsed));
    assert.ok(result.answer.includes("verify") || result.answer.includes("knowledge base") || result.answer.includes("figure"));
  });

  await run("context personalizes the answer with name and budget", async () => {
    const result = await insuranceAdvisorService.answerInsuranceQuery("term insurance kya hai", {
      userName: "Vikram",
      budget: 45000,
      age: 34
    });
    assert.ok(result.answer.includes("Vikram"));
    assert.ok(result.answer.includes("45,000"));
    assert.ok(result.answer.includes("34"));
  });

  await run("context is optional and backward compatible", async () => {
    const plain = await insuranceAdvisorService.answerInsuranceQuery("term insurance kya hai");
    assert.strictEqual(plain.handled, true);
    assert.ok(plain.answer.includes("ABSLI"));
  });

  await run("command router maps insurance leadgen to insurance domain", () => {
    const detection = garudaCommandRouter.detectCommand("insurance ke liye leads generate karo");
    assert.strictEqual(detection.command, "leadgen");
    assert.strictEqual(detection.params.domain, "insurance");
  });

  await run("command router maps absli to insurance domain", () => {
    const detection = garudaCommandRouter.detectCommand("absli ke liye leads nikalo");
    assert.strictEqual(detection.command, "leadgen");
    assert.strictEqual(detection.params.domain, "insurance");
  });

  await run("command router detects insurance pitch command", () => {
    const detection = garudaCommandRouter.detectCommand("absli insurance pitch banao");
    assert.strictEqual(detection.command, "insurance_pitch");
  });

  await run("insurance_pitch handler returns grounded advisor answer", async () => {
    const result = await garudaCommandRouter.handleInsurancePitch({ query: "absli term insurance plans" });
    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes("ABSLI"));
  });

  console.log(`\ninsuranceAdvisorService.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();