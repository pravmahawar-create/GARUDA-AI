const assert = require("assert");
const http = require("http");
const express = require("express");
const outreachDispatch = require("./garudaOutreachDispatchService");
const acquisitionRoutes = require("../routes/acquisitionRoutes");
const selfMarketing = require("./garudaSelfMarketingService");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA Milestone 28: Programmatic Landing Pages & Governed Outreach Test Suite...\n");

  // --- 1. Service Catalog & Search Topics Coverage ---
  console.log("--- 1. Service Catalog & Search Topics Coverage ---");
  const topics = selfMarketing.getTopics();
  const requiredSlugs = [
    "custom-ai-development",
    "custom-software-saas-mvp",
    "business-workflow-ai-automation",
    "whatsapp-telegram-ai-bots"
  ];
  for (const slug of requiredSlugs) {
    const found = topics.find((t) => t.slug === slug);
    assert(Boolean(found), `Must index service topic: ${slug}`);
  }
  console.log("✔ PASS: All 4 high-intent service landing page topics verified in catalog");

  // --- 2. Outbound Prospect Qualification ---
  console.log("\n--- 2. Outbound Prospect Qualification ---");
  const prospect = await outreachDispatch.qualifyProspectForOutreach({
    company: "Acme Health Logistics (TEST / SIMULATION)",
    source: "Healthcare RFPs",
    sourceUrl: "https://example.com/rfp/123",
    serviceMatch: "business-workflow-ai-automation",
    requirements: "Need automated document parsing and hospital EMR integration pipeline",
    leadScore: 85,
    isTest: true
  });

  assert(prospect.prospectId.startsWith("outreach_"));
  assert.strictEqual(prospect.status, "APPROVAL_REQUIRED");
  assert.strictEqual(prospect.isTest, true);
  console.log("✔ PASS: Discovered prospect qualified and transitioned to APPROVAL_REQUIRED");

  // --- 3. Governance Gate: Dispatch Without Approval Blocked ---
  console.log("\n--- 3. Governance Gate: Dispatch Without Approval Blocked ---");
  let dispatchError = null;
  try {
    await outreachDispatch.dispatchOutreach(prospect.prospectId);
  } catch (err) {
    dispatchError = err;
  }
  assert(Boolean(dispatchError), "Should strictly block unapproved outreach dispatch");
  assert.strictEqual(dispatchError.statusCode, 403);
  console.log("✔ PASS: Unapproved outbound dispatch strictly blocked by Governance Gate (HTTP 403)");

  // --- 4. Founder Approval & Governed Dispatch ---
  console.log("\n--- 4. Founder Approval & Governed Dispatch ---");
  const approved = await outreachDispatch.approveOutreach(prospect.prospectId, { actor: "founder" });
  assert.strictEqual(approved.status, "APPROVED");
  assert.strictEqual(approved.approvedBy, "founder");

  const dispatched = await outreachDispatch.dispatchOutreach(prospect.prospectId);
  assert.strictEqual(dispatched.status, "SENT");
  assert(dispatched.record.dispatchPayload.portalLink.includes("business-workflow-ai-automation"));
  console.log("✔ PASS: Founder approval recorded and governed dispatch executed successfully");

  // --- 5. Prospect Inbound Response & Scoping Ready ---
  console.log("\n--- 5. Prospect Inbound Response & Scoping Ready ---");
  const responded = await outreachDispatch.recordResponse(prospect.prospectId, {
    message: "We are interested. What is the timeline and advance milestone required?"
  });
  assert.strictEqual(responded.status, "RESPONSE_RECEIVED");
  assert(responded.responseText.includes("interested"));
  console.log("✔ PASS: Prospect response captured and transitioned to RESPONSE_RECEIVED");

  // Start local test server for REST API verification
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 6. REST API: POST /api/acquisition/outreach/qualify ---
    console.log("\n--- 6. REST API: POST /api/acquisition/outreach/qualify ---");
    const resQualify = await fetch(`${baseUrl}/api/acquisition/outreach/qualify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-garuda-test": "true" },
      body: JSON.stringify({
        company: "Apex Fintech (TEST / SIMULATION)",
        serviceMatch: "custom-software-saas-mvp",
        isTest: true
      })
    });
    const qualifyData = await resQualify.json();
    assert.strictEqual(resQualify.status, 201);
    assert.strictEqual(qualifyData.prospect.status, "APPROVAL_REQUIRED");
    const testProspectId = qualifyData.prospect.prospectId;
    console.log("✔ PASS: POST /api/acquisition/outreach/qualify returned 201 Created");

    // --- 7. REST API: POST /api/acquisition/outreach/:id/approve & dispatch ---
    console.log("\n--- 7. REST API: POST /api/acquisition/outreach/:id/approve & dispatch ---");
    const resApprove = await fetch(`${baseUrl}/api/acquisition/outreach/${testProspectId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: "founder" })
    });
    assert.strictEqual(resApprove.status, 200);

    const resDispatch = await fetch(`${baseUrl}/api/acquisition/outreach/${testProspectId}/dispatch`, {
      method: "POST"
    });
    const dispatchData = await resDispatch.json();
    assert.strictEqual(resDispatch.status, 200);
    assert.strictEqual(dispatchData.status, "SENT");
    console.log("✔ PASS: REST API approve and dispatch endpoints verified");

    // --- 8. REST API: GET /api/acquisition/outreach/metrics ---
    console.log("\n--- 8. REST API: GET /api/acquisition/outreach/metrics ---");
    const resMetrics = await fetch(`${baseUrl}/api/acquisition/outreach/metrics`);
    const metricsData = await resMetrics.json();
    assert.strictEqual(resMetrics.status, 200);
    assert(metricsData.metrics.totalOutreachProspects >= 2);
    assert(metricsData.metrics.sent >= 1);
    assert(metricsData.metrics.responsesReceived >= 1);
    console.log("✔ PASS: GET /api/acquisition/outreach/metrics returned active pipeline counts");

    // --- 9. Command Center Funnel Integration ---
    console.log("\n--- 9. Command Center Funnel Integration ---");
    const resCC = await fetch(`${baseUrl}/api/acquisition/command-center`, {
      headers: { "x-garuda-test": "true" }
    });
    const ccData = await resCC.json();
    assert.strictEqual(resCC.status, 200);
    assert(typeof ccData.funnel.outreachSent === "number");
    assert.strictEqual(ccData.truthDeclaration.realCustomerRevenue, "₹0");
    console.log("✔ PASS: Acquisition Command Center seamlessly unified outreach metrics with revenue truth");

    console.log("\n🦅 ALL 9 MILESTONE 28 OUTREACH & LANDING PAGE TEST CASES PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Milestone 28 test failure:", err);
  process.exit(1);
});
