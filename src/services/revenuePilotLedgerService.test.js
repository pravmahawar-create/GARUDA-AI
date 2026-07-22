const assert = require("assert");
const { buildLedgerEntry, deploymentReadiness } = require("./revenuePilotLedgerService");
const request = { id: "request-1", missionId: "mission-1", actionType: "payment_verification", status: "externally_completed", evidenceHash: "evidence", completionReceipt: { paymentVerified: true, receiptHash: "receipt-hash", provider: "verified-provider", reference: "payment-1" } };
const entry = buildLedgerEntry(request, { amount: 1250.5, currency: "inr" }, null, new Date("2026-07-22T00:00:00Z"));
assert.equal(entry.amount, 1250.5); assert.equal(entry.currency, "INR"); assert.equal(entry.governance.revenueClaimAllowed, true); assert.equal(entry.governance.payoutNotImplied, true); assert.equal(entry.entryHash.length, 64);
assert.throws(() => buildLedgerEntry({ ...request, completionReceipt: { ...request.completionReceipt, paymentVerified: false } }, { amount: 1 }), /verified payment receipt/);
assert.equal(deploymentReadiness({ NODE_ENV: "production", GARUDA_PUBLIC_URL: "https://garuda.example", MONGODB_URI: "mongodb://db", GARUDA_WEBHOOK_ENABLED: "true" }).ready, true);
assert.equal(deploymentReadiness({ NODE_ENV: "development" }).ready, false);
console.log("Controlled pilot ledger and deployment readiness validation passed.");
