const assert = require("assert");
const {
  evaluateClientIntelligence,
  evaluateRiskEngine,
  calculateOpportunityIntelligence
} = require("./clientIntelligenceEngineService");

async function runClientIntelligenceEngineTests() {
  const sampleCandidate = {
    title: "Build Custom Node.js & React Dashboard",
    company: "Acme FinTech Corp",
    source: "Remotive",
    description: "Build a custom Node.js and React administrative dashboard with automated Jest test suite. The project scope includes full API integration, data schema design, and responsive frontend UI components. The acceptance criteria require 100% passing test execution report, zero placeholder code, and full documentation. Fixed-price milestone project. Long-term contract potential for ongoing maintenance.",
    salaryText: "$3,000 fixed price",
    score: 90,
    tags: ["Node.js", "React", "Automated Testing"]
  };

  // 1. Client Intelligence Test
  const clientIntel = evaluateClientIntelligence(sampleCandidate);
  assert.ok(clientIntel.clientTrustScore >= 70);
  assert.ok(clientIntel.budgetConfidence >= 80);
  assert.ok(clientIntel.scopeClarity >= 70);
  assert.ok(clientIntel.technicalMatch >= 85);
  assert.ok(["low", "medium", "high"].includes(clientIntel.communicationComplexity));
  assert.ok(["low", "medium", "high", "immediate"].includes(clientIntel.urgency));
  assert.ok(clientIntel.longTermRevenuePotential >= 70);

  // 2. Risk Engine Test
  const riskAnalysis = evaluateRiskEngine(sampleCandidate, clientIntel);
  assert.ok(["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(riskAnalysis.riskLevel));
  assert.ok(Array.isArray(riskAnalysis.findings));

  // 3. Overall Opportunity Intelligence Test
  const oppIntel = calculateOpportunityIntelligence(sampleCandidate);
  assert.ok(oppIntel.opportunityScore >= 50 && oppIntel.opportunityScore <= 100);
  assert.ok(oppIntel.riskScore >= 0 && oppIntel.riskScore <= 100);
  assert.ok(oppIntel.expectedRevenueValue > 0);
  assert.ok(["✅ Submit Immediately", "⚠️ Negotiate First", "🟡 Ask Questions", "❌ Reject"].includes(oppIntel.recommendedAction));

  // 4. Critical Risk Enforcement Test
  const scamCandidate = {
    title: "Simple Task - No Milestones",
    description: "Do everything, no deposit, pay net 60 after 60 days.",
    salaryText: "unrealistic $5"
  };
  const scamIntel = calculateOpportunityIntelligence(scamCandidate);
  assert.strictEqual(scamIntel.riskLevel, "CRITICAL");
  assert.strictEqual(scamIntel.recommendedAction, "❌ Reject");

  console.log("Client Intelligence Engine unit tests PASSED cleanly.");
}

runClientIntelligenceEngineTests().catch((err) => {
  console.error("Client Intelligence test error:", err);
  process.exit(1);
});
