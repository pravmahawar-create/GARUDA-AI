const assert = require("assert");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const connectDB = require("../database/db");
const revenueService = require("./revenueService");

function hasPaymentEvidence(record) {
  const hasKey = Boolean(record.paymentEventKey && String(record.paymentEventKey).length > 0);
  const hasEvidence = Boolean(record.verificationEvidence && typeof record.verificationEvidence === "object" && Object.keys(record.verificationEvidence).length > 0);
  return hasKey || hasEvidence;
}

(async () => {
  const connected = await connectDB();
  assert.strictEqual(connected, true, "MongoDB must be connected to run the revenue wire repair test");
  const dbName = require("mongoose").connection.name;
  console.log(`[wire-repair] connected DB: ${dbName}`);

  const records = await revenueService.listRevenue({});
  assert.ok(records.length >= 88, `expected at least 88 genuine revenue records, got ${records.length}`);

  const noEvidenceReceived = records.filter((r) => r.status === "received" && !hasPaymentEvidence(r));
  assert.strictEqual(
    noEvidenceReceived.length,
    0,
    `fabricated revenue must not be marked received without payment evidence (found ${noEvidenceReceived.length})`
  );

  const metrics = await revenueService.getRevenueMetrics();
  const receivedFromMetrics = metrics.byStatus.find((row) => row.status === "received");
  const evidencedReceived = records.filter((r) => r.status === "received" && hasPaymentEvidence(r));
  const expectedReceivedCount = evidencedReceived.length;
  const expectedReceivedAmount = evidencedReceived.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  assert.strictEqual(
    metrics.receivedRevenue,
    expectedReceivedAmount,
    "receivedRevenue must equal only evidenced payments, never lead-score estimates"
  );
  assert.strictEqual(
    (receivedFromMetrics && receivedFromMetrics.count) || 0,
    expectedReceivedCount,
    "received record count must match only evidenced payments"
  );

  const oppLinked = records.filter((r) => r.opportunityId).length;
  assert.strictEqual(oppLinked, records.length, "every revenue record must link to an opportunity");

  console.log(
    `Revenue wire repair test passed: ${records.length} genuine records, ` +
    `received=${metrics.receivedRevenue} (INR, evidence-only), pending=${metrics.pendingRevenue} (INR), ` +
    `all opportunity-linked, zero fabricated received revenue.`
  );
  process.exit(0);
})().catch((error) => {
  console.error("Revenue wire repair test FAILED:", error.message);
  process.exit(1);
});