const assert = require("assert");
const {
  validateOpportunityInput,
  OPP_STAGES
} = require("./opportunityService");

const valid = validateOpportunityInput({
  title: "ABSLI qualified lead",
  client: "Founder-approved prospect",
  potentialValue: 25000,
  probability: 70,
  stage: "qualified",
  expectedCloseDate: "2026-08-01"
});

assert.strictEqual(valid.stage, "qualified");
assert.strictEqual(valid.potentialValue, 25000);
assert.ok(valid.expectedCloseDate instanceof Date);
assert.ok(OPP_STAGES.includes("won"));

assert.throws(
  () => validateOpportunityInput({
    title: "Invalid lead",
    client: "Test",
    potentialValue: -1
  }),
  /potentialValue/
);

assert.throws(
  () => validateOpportunityInput({
    title: "Invalid probability",
    client: "Test",
    potentialValue: 100,
    probability: 101
  }),
  /probability/
);

console.log("Opportunity workflow validation test passed.");
