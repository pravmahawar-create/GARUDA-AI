const assert = require("assert");
const {
  buildConversionPreview,
  founderApprovalGranted
} = require("./revenueConversionService");

const opportunity = {
  _id: "507f1f77bcf86cd799439011",
  title: "Founder-approved ABSLI opportunity",
  client: "Qualified prospect",
  potentialValue: 50000,
  currency: "INR",
  source: "insurance",
  stage: "qualified"
};

const pending = buildConversionPreview(opportunity, {});
assert.strictEqual(pending.status, "pending");
assert.strictEqual(pending.paymentVerified, false);
assert.strictEqual(pending.opportunityStageAfter, "qualified");
assert.strictEqual(pending.writeAllowed, false);

const received = buildConversionPreview(opportunity, { paymentVerified: true });
assert.strictEqual(received.status, "received");
assert.strictEqual(received.opportunityStageAfter, "won");

assert.strictEqual(founderApprovalGranted(true), true);
assert.strictEqual(founderApprovalGranted("true"), true);
assert.strictEqual(founderApprovalGranted(false), false);
assert.strictEqual(founderApprovalGranted("false"), false);

assert.throws(
  () => buildConversionPreview({ ...opportunity, stage: "lost" }),
  /cannot be converted/
);

console.log("Revenue conversion approval test passed.");
