const assert = require("assert");
const express = require("express");
const proposalRoutes = require("./proposalRoutes");

async function runTests() {
  console.log("Starting Proposal Routes HTTP Integration Test Suite...\n");

  const app = express();
  app.use(express.json());
  app.use("/api/proposals", proposalRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/proposals`;

  try {
    // 1. Create Proposal via REST API
    const createRes = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Automated Hotel WhatsApp Booking Bot",
        requirements: "WhatsApp cloud API integration with booking calendar synchronization",
        amount: 22000,
        currency: "INR",
        client: { name: "Rajesh Sharma", email: "rajesh@hotelroyal.in", organization: "Hotel Royal Palace" }
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    assert.strictEqual(createData.success, true);
    const propId = createData.proposal.proposalId;
    console.log("✔ PASS: POST /api/proposals created proposal:", propId);

    // 2. Public Read-Only Endpoint
    const publicRes = await fetch(`${baseUrl}/${propId}?public=true`);
    assert.strictEqual(publicRes.status, 200);
    const publicData = await publicRes.json();
    assert.strictEqual(publicData.proposal.status, "CLIENT_VIEWED");
    assert.strictEqual(publicData.proposal.auditTrail, undefined, "Public view must not leak audit trail");
    console.log("✔ PASS: GET /api/proposals/:id?public=true sanitized public view verified");

    // 3. Client Accepts Terms
    const acceptRes = await fetch(`${baseUrl}/${propId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Rajesh Sharma", email: "rajesh@hotelroyal.in" })
    });
    assert.strictEqual(acceptRes.status, 200);
    const acceptData = await acceptRes.json();
    assert.strictEqual(acceptData.proposal.status, "CLIENT_ACCEPTED");
    console.log("✔ PASS: POST /api/proposals/:id/accept signed terms successfully");

    // 4. Unauthoritative Payment Claim Rejection
    const claimRes = await fetch(`${baseUrl}/${propId}/verify-deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimText: "Paid 11000 INR on GPay", authoritative: false })
    });
    assert.strictEqual(claimRes.status, 422);
    const claimData = await claimRes.json();
    assert.strictEqual(claimData.verified, false);
    assert.strictEqual(claimData.state, "PAYMENT_CLAIMED");
    console.log("✔ PASS: POST /api/proposals/:id/verify-deposit rejected unverified payment claim (HTTP 422)");

    // 5. Authoritative Deposit Verification & Automated Mission Kickoff
    const verifyRes = await fetch(`${baseUrl}/${propId}/verify-deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId: "pay_live_hotel_99812",
        providerEvidence: "razorpay_hmac_verified",
        amount: 11000,
        currency: "INR",
        authoritative: true
      })
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.verified, true);
    assert.strictEqual(verifyData.proposal.status, "IN_EXECUTION");
    assert(verifyData.proposal.missionId.startsWith("mission_"));
    console.log("✔ PASS: POST /api/proposals/:id/verify-deposit verified payment authoritatively & spawned mission");

    // 6. Funnel Metrics Endpoint
    const funnelRes = await fetch(`${baseUrl}/metrics/funnel`);
    assert.strictEqual(funnelRes.status, 200);
    const funnelData = await funnelRes.json();
    assert(funnelData.metrics.totalProposals >= 1);
    assert(funnelData.metrics.depositsPaidINR >= 11000);
    console.log("✔ PASS: GET /api/proposals/metrics/funnel returned accurate real metrics");

    console.log("\n🦅 ALL 6 PROPOSAL ROUTES HTTP TESTS PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Proposal Routes test failure:", err);
  process.exit(1);
});
