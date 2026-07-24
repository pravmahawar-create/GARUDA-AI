const assert = require("assert");
const {
  CAPABILITY_DEFINITIONS,
  getCapability,
  getGarudaIdentityStatement,
  getRegistrySummary,
  listCapabilities,
  matchDemandUniversal
} = require("./capabilityRegistryService");

async function testUniversalCapabilityLayer() {
  // 1. Universal Capability Registry Verification
  const summary = getRegistrySummary();
  assert.ok(summary.total >= 8);
  assert.ok(summary.categories.includes("Software Engineering"));
  assert.ok(summary.categories.includes("Workflow Automation"));
  assert.ok(summary.categories.includes("Research"));
  assert.ok(summary.categories.includes("Technical Documentation"));
  assert.ok(summary.categories.includes("Proposal Writing"));
  assert.ok(summary.categories.includes("AI Agents"));
  assert.ok(summary.categories.includes("Quality Assurance"));

  // Verify Schema Fields on all registered capabilities
  const capabilities = listCapabilities();
  capabilities.forEach((cap) => {
    assert.ok(cap.id);
    assert.ok(cap.category);
    assert.ok(cap.description);
    assert.ok(typeof cap.confidenceScore === "number");
    assert.ok(Array.isArray(cap.requiredSkills));
    assert.ok(Array.isArray(cap.requiredTools));
    assert.ok(cap.estimatedDeliveryTime);
    assert.ok(cap.pricingGuidance);
    assert.strictEqual(typeof cap.humanApprovalRequired, "boolean");
    assert.strictEqual(typeof cap.canMotherExecuteAutonomously, "boolean");
    assert.ok(Array.isArray(cap.dependencies));
    assert.ok(Array.isArray(cap.relatedCapabilities));
    assert.ok(Array.isArray(cap.evidence));
  });

  // 2. Universal Opportunity Matcher - Non-Software (Spreadsheet Automation Task)
  const spreadsheetOpp = {
    id: "opp-spreadsheet-001",
    title: "Excel Data Cleaning & Automated CSV Report Pipeline",
    description: "Build an automated Excel formula and CSV cleaning script for monthly financial data.",
    tags: ["excel", "csv", "data", "spreadsheet"],
    salaryText: "$500 fixed"
  };

  const spreadsheetMatch = matchDemandUniversal(spreadsheetOpp);
  assert.ok(spreadsheetMatch.capabilityMatchScore >= 70);
  assert.strictEqual(spreadsheetMatch.bestCapability.capabilityId, "automation.spreadsheet-automation");
  assert.strictEqual(spreadsheetMatch.commercialValue, "$500 USD");
  assert.strictEqual(spreadsheetMatch.executionRisk, "LOW");
  assert.strictEqual(spreadsheetMatch.legalRisk, "CLEAR");
  assert.strictEqual(spreadsheetMatch.founderApprovalNeeded, true);
  assert.ok(spreadsheetMatch.garudaIdentityStatement.includes("Praveen's AI representative"));

  // 3. Universal Opportunity Matcher - Enterprise Project (Software + AI Agent)
  const enterpriseOpp = {
    id: "opp-enterprise-999",
    title: "Build Custom AI Agent & Automated Backend API Microservices",
    description: "Develop autonomous LLM agent workflow, tool calling, REST API microservice, and automated unit testing.",
    tags: ["node", "api", "ai", "agent", "testing"],
    salaryText: "$15,000"
  };

  const enterpriseMatch = matchDemandUniversal(enterpriseOpp);
  assert.ok(enterpriseMatch.capabilityMatchScore >= 80);
  assert.strictEqual(enterpriseMatch.commercialValue, "$15,000 USD");
  assert.ok(enterpriseMatch.matches.length > 1);

  // 4. Truthful Identity Verification
  const identity = getGarudaIdentityStatement();
  assert.strictEqual(
    identity,
    "I am GARUDA, Praveen's AI representative. I assist client project delivery on behalf of the Founder. Actions requiring commercial authorization are always confirmed by the Founder."
  );

  console.log("Universal Capability Intelligence Layer validation passed.");
}

testUniversalCapabilityLayer().catch((err) => {
  console.error("Universal capability layer validation failed:", err);
  process.exit(1);
});
