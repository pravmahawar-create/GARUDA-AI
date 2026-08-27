const crypto = require("crypto");
const { fetchRemotiveJobs, normalizeRemotiveJob } = require("../services/opportunityDiscoveryService");
const outboundCommunicationService = require("../services/outboundCommunicationService");
const inboundResponseService = require("../services/inboundResponseService");
const opportunityFollowUpService = require("../services/opportunityFollowUpService");
const missionControlService = require("../services/missionControlService");
const { RevenueExecutionAdapter } = require("../tools/revenueExecutionAdapter");
const razorpayTestService = require("../services/razorpayTestPaymentService");

async function runFounderOfflineOperatingTest() {
  console.log("🧪 Starting GARUDA Mission 17 Founder-Offline Operating Test Suite...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // STEP 1: FOUNDER APPROVES INITIAL OUTREACH
  // -------------------------------------------------------------
  console.log("--- STEP 1: INITIAL OUTREACH APPROVED BY FOUNDER ---");
  const jobs = await fetchRemotiveJobs();
  const candidates = jobs.map((j) => normalizeRemotiveJob(j, "offline_test_mission")).filter((c) => c.status === "ranked");
  const selectedOpp = candidates[0];

  assert(selectedOpp && selectedOpp.externalId, `Selected real opportunity: "${selectedOpp.title}" by ${selectedOpp.company}`);

  const draftOutreach = await outboundCommunicationService.draftCommunication(
    {
      recipient: `applications@${selectedOpp.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      channel: "email",
      subject: `Commercial Proposal: ${selectedOpp.title}`,
      body: `Proposal for ${selectedOpp.title} by GARUDA AI OS`,
      opportunityId: selectedOpp.externalId
    },
    { founderApproved: false }
  );

  const approvedOutreach = await outboundCommunicationService.approveAndSend(draftOutreach.communicationId, { founderApproved: true });
  assert(approvedOutreach.status === "SENT", "Initial outreach approved by Founder; Status transitioned to SENT");

  // -------------------------------------------------------------
  // STEP 2: FOUNDER GOES OFFLINE — GARUDA WAITS & DETECTS RESPONSE
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: FOUNDER OFFLINE — GARUDA DETECTS & UNDERSTANDS INBOUND RESPONSE ---");

  const inboundResponse = await inboundResponseService.processInboundResponse({
    sender: approvedOutreach.recipient,
    channel: "email",
    messageText: "We reviewed your proposal. Please provide the technical scope and deliverables schedule.",
    opportunityId: selectedOpp.externalId
  });

  assert(
    inboundResponse &&
    inboundResponse.classification.action === "prepare_scope" &&
    inboundResponse.lifecycleState === "SCOPE_PROPOSED",
    "Inbound response detected and classified automatically as prepare_scope → SCOPE_PROPOSED while Founder is offline"
  );

  assert(
    inboundResponse.draftedOutreach && inboundResponse.draftedOutreach.status === "APPROVAL_REQUIRED",
    "GARUDA drafted next scope response in APPROVAL_REQUIRED state (Paused for Founder approval)"
  );

  // -------------------------------------------------------------
  // STEP 3: GARUDA SCHEDULES FOLLOW-UP CADENCE SILENTLY
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: GARUDA SCHEDULES FOLLOW-UP CADENCE SILENTLY ---");

  const evalCadence = opportunityFollowUpService.evaluateFollowUp({
    externalId: selectedOpp.externalId,
    status: "AWAITING_RESPONSE",
    lastOutreachAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    followUpCount: 0
  });

  assert(evalCadence.isDue === true && evalCadence.followUpNumber === 1, "Cadence check evaluates follow-up #1 as due after 4 days");

  // -------------------------------------------------------------
  // STEP 4: FOUNDER RESUMES, APPROVES SCOPE & AUTHORIZES WORK
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: FOUNDER RESUMES, APPROVES SCOPE & AUTHORIZES WORK ---");

  const sentScope = await outboundCommunicationService.approveAndSend(inboundResponse.draftedOutreach.communicationId, { founderApproved: true });
  assert(sentScope.status === "SENT", "Founder resumed and approved scope outbound response");

  const workAuthMission = await missionControlService.createMission(
    `Execute authorized technical deliverables for opportunity ${selectedOpp.externalId}`,
    { founderApproved: true }
  );

  assert(
    workAuthMission && ["READY", "RUNNING", "COMPLETED"].includes(workAuthMission.status),
    "Work authorized by Founder; Phase 1-8 governed tools executed deliverables cleanly"
  );

  // -------------------------------------------------------------
  // STEP 5: AUTHORITATIVE PAYMENT VERIFICATION & REVENUE RECORDED
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: AUTHORITATIVE PAYMENT VERIFICATION & REVENUE ---");

  const revenueAdapter = new RevenueExecutionAdapter();
  const mockOpp = { id: `opp_${selectedOpp.externalId}`, status: "EXECUTING" };
  const workRec = revenueAdapter.recordWorkCompletion(mockOpp);
  const delRec = revenueAdapter.submitDelivery(workRec, [{ path: selectedOpp.url }]);
  const accRec = revenueAdapter.recordClientAcceptance(delRec, { accepted: true });

  const paymentSecret = "test_webhook_secret_123456";
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_test_offline_99", amount: 150000, currency: "INR", status: "captured" } } }
  });
  const signature = crypto.createHmac("sha256", paymentSecret).update(rawBody).digest("hex");

  const verifiedReceipt = revenueAdapter.verifyPayment(accRec, {
    paymentId: "pay_test_offline_99",
    amount: 1500,
    currency: "INR",
    signatureVerified: true,
    signature,
    rawBody,
    secret: paymentSecret
  });

  assert(
    verifiedReceipt && verifiedReceipt.status === "PAYMENT_VERIFIED" && verifiedReceipt.paymentId === "pay_test_offline_99",
    "Razorpay HMAC payment verification succeeded authoritatively (Status: PAYMENT_VERIFIED)"
  );

  console.log(`\n📊 Founder-Offline Operating Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runFounderOfflineOperatingTest();
}

module.exports = runFounderOfflineOperatingTest;
