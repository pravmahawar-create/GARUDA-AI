const assert = require("assert");
const {
  STATUS_TRANSITIONS,
  assessPayoutEligibility,
  calculateSettlementAmounts,
  requireFounderApproval
} = require("./settlementService");

assert.deepStrictEqual(calculateSettlementAmounts(1000, 2.5), {
  grossAmount: 1000,
  feeRatePercent: 2.5,
  feeAmount: 25,
  netAmount: 975
});
assert.deepStrictEqual(assessPayoutEligibility({ status: "received", amount: 100 }), { eligible: true, reasons: [] });
assert.deepStrictEqual(assessPayoutEligibility({ status: "pending", amount: 100 }), { eligible: false, reasons: ["payment_not_received"] });
assert.deepStrictEqual(STATUS_TRANSITIONS.processing, ["settled", "failed"]);
assert.doesNotThrow(() => requireFounderApproval({ founderApproved: "true" }));
assert.throws(() => requireFounderApproval({ founderApproved: false }), /Founder approval/);
assert.throws(() => calculateSettlementAmounts(100, 101), /between 0 and 100/);

console.log("Settlement ledger validation test passed.");
