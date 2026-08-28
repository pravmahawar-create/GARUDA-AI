const assert = require("assert");
const outreachDispatch = require("./garudaOutreachDispatchService");
const prospectQueueService = require("./realCommercialProspectQueueService");
const emailRelay = require("./emailRelayService");

async function runTests() {
  console.log("================================================================================");
  console.log("STARTING GARUDA OUTREACH APPROVAL & DISPATCH STATE REGRESSION TEST SUITE");
  console.log("================================================================================\n");

  const testProspectId = `outreach_test_apex_${Date.now()}`;
  const mockProspect = {
    prospectId: testProspectId,
    company: "Apex Global Logistics",
    title: "Enterprise Multi-Agent WhatsApp Dispatch Bot",
    contactEmail: "procurement@apexlogistics.com",
    sourceUrl: "https://apexlogistics.com/rfp/crm-bot"
  };

  // Test 1: Qualification & Persistence
  console.log("--- 1. Qualification & Durable Persistence ---");
  const qualified = await outreachDispatch.qualifyProspectForOutreach(mockProspect, { isTest: true });
  assert.strictEqual(qualified.status, "APPROVAL_REQUIRED");
  assert.strictEqual(qualified.company, "Apex Global Logistics");

  const fetched1 = await outreachDispatch.getOutreachRecord(testProspectId);
  assert(fetched1 !== null, "Record must be retrievable from persistence");
  assert.strictEqual(fetched1.status, "APPROVAL_REQUIRED");
  console.log("✔ PASS: Qualified prospect saved and persisted in APPROVAL_REQUIRED status");

  // Test 2: Unapproved Dispatch Block (Founder Gate)
  console.log("\n--- 2. Unapproved Dispatch Blocking (Founder Approval Gate) ---");
  try {
    await outreachDispatch.dispatchOutreach(testProspectId, { mockRelay: true });
    assert.fail("Should have thrown 403 for unapproved dispatch");
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    assert(err.message.includes("Founder approval required"));
    console.log("✔ PASS: Unapproved dispatch strictly blocked with HTTP 403");
  }

  // Test 3: Founder Approval State Transition
  console.log("\n--- 3. Founder Approval State Transition ---");
  const approved = await outreachDispatch.approveOutreach(testProspectId, { approver: "Founder" });
  assert.strictEqual(approved.status, "APPROVED");
  assert(approved.approvedAt !== undefined);
  assert.strictEqual(approved.approvedBy, "Founder");

  const fetched2 = await outreachDispatch.getOutreachRecord(testProspectId);
  assert.strictEqual(fetched2.status, "APPROVED");
  console.log("✔ PASS: Approval successfully transitioned status to APPROVED and persisted");

  // Test 4: Provider Failure Handling (Never Claims Success)
  console.log("\n--- 4. Provider Failure Handling (Never Claims Sent on Failure) ---");
  const failProspectId = `outreach_test_fail_${Date.now()}`;
  await outreachDispatch.qualifyProspectForOutreach({
    prospectId: failProspectId,
    company: "Failing Corp",
    title: "Faulty RFP",
    contactEmail: null // Missing email causes failure
  }, { isTest: false });
  await outreachDispatch.approveOutreach(failProspectId, { approver: "Founder" });

  try {
    await outreachDispatch.dispatchOutreach(failProspectId, { mockRelay: true, isTest: false });
    assert.fail("Should have thrown 422 for missing contact email");
  } catch (err) {
    assert.strictEqual(err.statusCode, 422);
    const failRecord = await outreachDispatch.getOutreachRecord(failProspectId);
    assert.notStrictEqual(failRecord.status, "SENT", "Failed dispatch must NEVER claim SENT");
    console.log("✔ PASS: Missing email rejected with HTTP 422 without setting SENT");
  }

  // Test 5: Successful Relay Dispatch
  console.log("\n--- 5. Successful Relay Dispatch ---");
  const dispatchRes = await outreachDispatch.dispatchOutreach(testProspectId, { mockRelay: true });
  assert.strictEqual(dispatchRes.success, true);
  assert.strictEqual(dispatchRes.status, "SENT");
  assert(dispatchRes.providerResponseId.startsWith("MOCK_RELAY_") || dispatchRes.providerResponseId.startsWith("RELAY_ACCEPTED_"));
  assert(dispatchRes.relayProvider.includes("brevo"));

  const sentRecord = await outreachDispatch.getOutreachRecord(testProspectId);
  assert.strictEqual(sentRecord.status, "SENT");
  assert(sentRecord.dispatchedAt !== undefined);
  assert.strictEqual(sentRecord.providerResponseId, dispatchRes.providerResponseId);
  console.log(`✔ PASS: Successful dispatch recorded SENT with providerResponseId: ${dispatchRes.providerResponseId}`);

  // Test 6: Duplicate Dispatch Protection
  console.log("\n--- 6. Duplicate Dispatch Protection ---");
  const duplicateRes = await outreachDispatch.dispatchOutreach(testProspectId, { mockRelay: true });
  assert.strictEqual(duplicateRes.success, true);
  assert.strictEqual(duplicateRes.status, "SENT");
  assert.strictEqual(duplicateRes.alreadyDispatched, true);
  assert(duplicateRes.message.includes("already dispatched"));
  console.log("✔ PASS: Repeated dispatch safely intercepted by duplicate protection without sending duplicate email");

  // Test 7: Prospect Queue State Hydration on Page Refresh / Reload
  console.log("\n--- 7. Prospect Queue State Hydration on Reload ---");
  const draftsResult = await prospectQueueService.prepareTopOutreachDrafts({ useCache: true });
  const apexDraft = draftsResult.topDrafts.find((d) => d.company === "Apex Global Logistics");
  assert(apexDraft !== undefined, "Apex Global Logistics must be in top drafts");
  assert.strictEqual(apexDraft.prospectId, "outreach_rfp_apex_2026_01", "Prospect ID must be stable deterministic ID");

  // Now verify that approving the real stable ID reflects immediately in the queue
  await outreachDispatch.approveAndDispatchOutreach("outreach_rfp_apex_2026_01", {
    company: "Apex Global Logistics",
    contactEmail: "procurement@apexlogistics.com",
    title: "Enterprise Multi-Agent WhatsApp Dispatch Bot",
    mockRelay: true
  });

  const refreshedQueue = await prospectQueueService.prepareTopOutreachDrafts({ useCache: true });
  const refreshedApex = refreshedQueue.topDrafts.find((d) => d.company === "Apex Global Logistics");
  assert.strictEqual(refreshedApex.status, "SENT", "Draft must reflect SENT status after dispatch");
  assert.strictEqual(refreshedApex.safetyRating, "OUTREACH_SENT", "Safety rating must reflect OUTREACH_SENT");
  assert(refreshedApex.providerResponseId !== null);
  assert(refreshedApex.dispatchedAt !== null);
  console.log("✔ PASS: Refreshing prospect queue displays actual persisted SENT state with provider ID");

  // Test 8: Atomic Approve-And-Dispatch Endpoint
  console.log("\n--- 8. Atomic Approve-And-Dispatch Method ---");
  const omniKey = "outreach_rfp_omniflow_2026_07";
  const atomicRes = await outreachDispatch.approveAndDispatchOutreach(omniKey, {
    company: "OmniFlow Automation",
    contactEmail: "procurement@omniflow.dev",
    title: "Custom Business Workflow Automation",
    mockRelay: true
  });
  assert.strictEqual(atomicRes.success, true);
  assert.strictEqual(atomicRes.status, "SENT");

  const omniRecord = await outreachDispatch.getOutreachRecord(omniKey);
  assert.strictEqual(omniRecord.status, "SENT");
  console.log("✔ PASS: Atomic approveAndDispatch successfully transitioned and persisted record");

  console.log("\n================================================================================");
  console.log("🦅 ALL OUTREACH APPROVAL & DISPATCH STATE REGRESSION TESTS PASSED 100%!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("Outreach Approval Dispatch State Test failure:", err);
  process.exit(1);
});
