const assert = require("assert");
const express = require("express");
const inboundRoutes = require("./inboundRoutes");

async function runTests() {
  console.log("Starting Inbound Routes Test Suite...");

  const app = express();
  app.use(express.json());
  app.use("/api/inbound", inboundRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/inbound`;

  try {
    // 1. Missing requirements -> 400
    const badRes = await fetch(`${baseUrl}/project-scope`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.strictEqual(badRes.status, 400, "Should return 400 for empty requirements");
    console.log("✔ Case 1 — Empty requirements returns 400 error");

    // 2. Successful Project Scope Generation
    const goodRes = await fetch(`${baseUrl}/project-scope`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirements: "Build automated WhatsApp CRM bot with lead qualification and database storage",
        name: "Enterprise Client",
        email: "client@example.com",
        budget: 45000
      })
    });
    assert.strictEqual(goodRes.status, 201, "Should create project scope with 201 status");
    const goodData = await goodRes.json();
    assert.strictEqual(goodData.success, true);
    assert(goodData.proposal.scopeId.startsWith("scope_"), "Proposal should have scopeId");
    assert.strictEqual(goodData.proposal.pricing.totalINR, 45000);
    assert.strictEqual(goodData.proposal.pricing.milestones.length, 2, "Milestones should be 50/50 for >= 30,000 INR");
    console.log("✔ Case 2 — Custom software scope generated with milestone pricing");

    // 3. Retrieve Scope by ID
    const getRes = await fetch(`${baseUrl}/project-scope/${goodData.proposal.scopeId}`);
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    assert.strictEqual(getData.proposal.customer.name, "Enterprise Client");
    console.log("✔ Case 3 — Project scope retrieved by ID");

    // 4. Inbound Client Message Intent Processing
    const responseRes = await fetch(`${baseUrl}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "client@example.com",
        messageText: "What is your pricing and architecture timeline for this project?",
        opportunityId: "opp_test_123"
      })
    });
    assert.strictEqual(responseRes.status, 201);
    const responseData = await responseRes.json();
    assert.strictEqual(responseData.data.classification.action, "prepare_quote");
    assert.strictEqual(responseData.data.lifecycleState, "PRICE_PROPOSED");
    console.log("✔ Case 4 — Inbound client query classified and mapped to PRICE_PROPOSED state");

    console.log("\nAll Inbound Routes tests PASSED cleanly.");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Inbound Routes test failure:", err);
  process.exit(1);
});
