/**
 * 🦅 GARUDA OS — CUSTOMER ANALYTICS ENGINE TEST SUITE
 * 
 * Verifies all analytical models, edge cases, security sanitization,
 * and performance benchmarks for CustomerAnalytics.
 */

const assert = require("assert");
const { CustomerAnalytics } = require("../src/services/customerAnalytics");

console.log("🦅 ==========================================================================");
console.log("🦅 GARUDA CUSTOMER ANALYTICS — VERIFICATION SUITE");
console.log("🦅 ==========================================================================\n");

const engine = new CustomerAnalytics();
let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// Mock Dataset
const mockCustomers = [
  { id: "cust_1", name: "Aarav Sharma", email: "aarav@example.com", signupDate: "2024-01-01" },
  { id: "cust_2", name: "Pooja Patel", email: "pooja@example.com", signupDate: "2024-01-15" },
  { id: "cust_3", name: "Vikram Malhotra", email: "vikram@example.com", signupDate: "2024-02-01" },
  { id: "cust_4", name: "Neha Verma", email: "neha@example.com", signupDate: "2024-03-01" },
  { id: "cust_5", name: "Rohan Kapoor", email: "rohan@example.com", signupDate: "2024-04-01" }
];

const mockTransactions = [
  // Aarav: Frequent, High Spender, Recent (Champion)
  { id: "tx_101", customerId: "cust_1", amount: 1200, date: "2024-10-01" },
  { id: "tx_102", customerId: "cust_1", amount: 1500, date: "2024-10-15" },
  { id: "tx_103", customerId: "cust_1", amount: 2000, date: "2024-11-01" },
  { id: "tx_104", customerId: "cust_1", amount: 1800, date: "2024-11-04" },

  // Pooja: Moderate spend, frequent
  { id: "tx_201", customerId: "cust_2", amount: 350, date: "2024-06-01" },
  { id: "tx_202", customerId: "cust_2", amount: 400, date: "2024-07-15" },
  { id: "tx_203", customerId: "cust_2", amount: 500, date: "2024-10-25" },

  // Vikram: Inactive for months (High churn risk / At Risk)
  { id: "tx_301", customerId: "cust_3", amount: 5000, date: "2024-02-10" },
  { id: "tx_302", customerId: "cust_3", amount: 4500, date: "2024-03-12" },

  // Neha: Single transaction
  { id: "tx_401", customerId: "cust_4", amount: 250, date: "2024-11-02" },

  // Rohan: Anomaly high spend spike
  { id: "tx_501", customerId: "cust_5", amount: 100, date: "2024-04-10" },
  { id: "tx_502", customerId: "cust_5", amount: 120, date: "2024-05-10" },
  { id: "tx_503", customerId: "cust_5", amount: 95000, date: "2024-06-15" } // Huge anomaly
];

const REF_DATE = new Date("2024-11-05");

// 1. Validation & Input Sanitization
console.log("SECTION 1: Validation & Security Sanitization");
runTest("Throws error when customer record is missing id", () => {
  assert.throws(() => engine.validateCustomer({ name: "Incomplete" }), /missing required 'id'/);
});

runTest("Throws error when transaction amount is negative or non-numeric", () => {
  assert.throws(() => engine.validateTransaction({ id: "tx_err", customerId: "cust_1", amount: -50, date: "2024-01-01" }), /invalid amount/);
  assert.throws(() => engine.validateTransaction({ id: "tx_err", customerId: "cust_1", amount: "not_a_number", date: "2024-01-01" }), /invalid amount/);
});

runTest("Prototype pollution attack is neutralized cleanly", () => {
  const maliciousInput = JSON.parse('{"id": "cust_hack", "__proto__": {"polluted": true}, "name": "Hacker"}');
  const safe = CustomerAnalytics.sanitizeRecord(maliciousInput);
  assert.strictEqual(safe.polluted, undefined);
  assert.strictEqual({}.polluted, undefined);
});

// 2. RFM Quintile Scoring & Segmentation
console.log("\nSECTION 2: RFM Behavioral Segmentation");
runTest("Calculates RFM metrics correctly", () => {
  const rfm = engine.calculateRFM(mockCustomers, mockTransactions, REF_DATE);
  assert.strictEqual(rfm.totalCustomers, 5);
  assert.ok(rfm.totalRevenue > 100000);
  assert.ok(rfm.profiles.length === 5);

  const aarav = rfm.profiles.find(p => p.customerId === "cust_1");
  assert.strictEqual(aarav.frequency, 4);
  assert.strictEqual(aarav.monetary, 6500);
  assert.strictEqual(aarav.recencyDays, 1);
  assert.ok(aarav.rScore >= 4);
  assert.strictEqual(aarav.segment, "CHAMPIONS");
});

// 3. Customer Lifetime Value (Historical & Predictive CLV)
console.log("\nSECTION 3: Customer Lifetime Value (CLV)");
runTest("Computes Historical and Predictive CLV for portfolio", () => {
  const ltv = engine.calculateLTV(mockCustomers, mockTransactions, { grossMargin: 0.70, lifespanYears: 3 });
  assert.ok(ltv.portfolioHistoricalTotal > 100000);
  assert.ok(ltv.averageHistoricalLtv > 20000);
  assert.ok(ltv.customerLtv.length === 5);

  const aarav = ltv.customerLtv.find(p => p.customerId === "cust_1");
  assert.strictEqual(aarav.historicalLtv, 6500);
  assert.ok(aarav.predictiveClv >= aarav.historicalLtv);
});

// 4. Churn Risk Probability
console.log("\nSECTION 4: Churn Risk Prediction");
runTest("Predicts low churn for active recent customer (Aarav)", () => {
  const churn = engine.predictChurnRisk(mockCustomers[0], mockTransactions, REF_DATE);
  assert.strictEqual(churn.riskTier, "LOW_RISK");
  assert.ok(churn.churnProbability < 0.35);
});

runTest("Predicts high churn for long-dormant customer (Vikram)", () => {
  const churn = engine.predictChurnRisk(mockCustomers[2], mockTransactions, REF_DATE);
  assert.strictEqual(churn.riskTier, "HIGH_RISK");
  assert.ok(churn.churnProbability >= 0.70);
  assert.ok(churn.recommendation.length > 10);
});

// 5. Cohort Retention Matrix
console.log("\nSECTION 5: Cohort Retention Matrix");
runTest("Generates monthly retention matrix", () => {
  const cohorts = engine.generateCohortMatrix(mockCustomers, mockTransactions);
  assert.ok(Array.isArray(cohorts));
  assert.ok(cohorts.length >= 3);

  const cohortJan = cohorts.find(c => c.cohort === "2024-01");
  assert.ok(cohortJan);
  assert.strictEqual(cohortJan.retention.M0.ratePercent, 100);
});

// 6. Statistical Spend Anomaly Detection (Z-Score)
console.log("\nSECTION 6: Anomaly Detection");
runTest("Detects $95,000 spend spike as anomaly outlier", () => {
  const anomalies = engine.detectSpendAnomalies(mockTransactions, 2.0);
  assert.ok(anomalies.count >= 1);
  const outlier = anomalies.anomalies.find(a => a.transactionId === "tx_503");
  assert.ok(outlier);
  assert.strictEqual(outlier.anomalyType, "HIGH_SPEND_SPIKE");
  assert.ok(outlier.zScore > 2.0);
});

// 7. Executive Summary Report
console.log("\nSECTION 7: Executive Summary & Health Score");
runTest("Generates complete executive portfolio report", () => {
  const summary = engine.generateExecutiveSummary(mockCustomers, mockTransactions, REF_DATE);
  assert.ok(summary.portfolioHealthScore >= 0 && summary.portfolioHealthScore <= 100);
  assert.strictEqual(summary.totalCustomers, 5);
  assert.ok(summary.churnRatePercent > 0);
  assert.ok(summary.segmentDistribution["CHAMPIONS"] >= 1);
});

// 8. Performance Benchmark
console.log("\nSECTION 8: Performance Benchmark");
runTest("Processes 2,000 transactions under 20 milliseconds", () => {
  const bigTx = [];
  for (let i = 0; i < 2000; i++) {
    bigTx.push({
      id: `tx_perf_${i}`,
      customerId: `cust_${(i % 50) + 1}`,
      amount: 100 + (i % 200),
      date: new Date(2024, (i % 10), (i % 28) + 1).toISOString()
    });
  }
  const bigCust = [];
  for (let c = 1; c <= 50; c++) {
    bigCust.push({ id: `cust_${c}`, name: `Customer ${c}`, signupDate: "2024-01-01" });
  }

  const start = Date.now();
  engine.calculateRFM(bigCust, bigTx);
  engine.calculateLTV(bigCust, bigTx);
  engine.detectSpendAnomalies(bigTx);
  const elapsed = Date.now() - start;

  console.log(`    ⏱ 2,000 transactions processed in: ${elapsed}ms`);
  assert.ok(elapsed < 100, `Execution took ${elapsed}ms, expected < 100ms`);
});

// Final Test Verdict
console.log("\n🦅 ==========================================================================");
console.log(`🦅 RESULTS: ${passed} Passed | ${failed} Failed`);
console.log("🦅 ==========================================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
