require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");

const { RevenueExecutionMission } = require("../src/models/RevenueExecutionMission");
const { DiscoveryCandidate } = require("../src/models/DiscoveryCandidate");
const { IncomeGoal } = require("../src/models/IncomeGoal");
const { RevenueRecord } = require("../src/models/RevenueRecord");
const { SettlementLedger } = require("../src/models/SettlementLedger");
const { RevenueExternalActionRequest } = require("../src/models/RevenueExternalActionRequest");
const razorpayPaymentLinkService = require("../src/services/razorpayPaymentLinkService");
const paymentWebhookService = require("../src/services/paymentWebhookService");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/garuda_ai";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET_TEST || "test_secret_that_is_at_least_16_chars";

function sha256(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function createIncomeGoal() {
  const goal = await IncomeGoal.create({
    title: "Test Revenue Loop Goal",
    targetAmount: 100000
  });
  return goal;
}

async function createCandidate() {
  const candidate = await DiscoveryCandidate.create({
    score: 85,
    sourceAttribution: "e2e-test",
    url: "https://example.com/e2e-test",
    title: "E2E Test Opportunity",
    externalId: `e2e-${Date.now()}`,
    source: "e2e",
    missionId: new mongoose.Types.ObjectId()
  });
  return candidate;
}

async function createPaymentReadyMission(candidateId, incomeGoalId) {
  const opportunity = {
    title: "E2E Test Opportunity",
    company: "E2E Client",
    engagementVerification: {
      verified: true,
      workAuthorizationConfirmed: true,
      termsAcceptedByClient: true,
      reference: "e2e-client-reference",
      source: "e2e",
      verifiedAt: new Date().toISOString()
    }
  };
  const truthHash = sha256({ candidateId: String(candidateId), listing: "e2e" });
  const realWorkIntake = {
    truthHash,
    workAuthorizationConfirmed: true,
    listingClassification: "public_listing_not_contract",
    verifiedAt: new Date().toISOString()
  };
  opportunity.engagementVerification.truthHash = truthHash;

  const workPackages = [{
    id: "wp-e2e-1",
    label: "E2E Deliverable",
    status: "completed",
    evidence: [{
      kind: "deliverable",
      label: "E2E Evidence",
      reference: "e2e-evidence-1",
      sha256: sha256("e2e-evidence-1")
    }]
  }];

  const governance = {
    internalDraftOnly: false,
    autoPublish: false,
    fakeTraffic: false,
    paidAdsApproved: false,
    founderApprovalRequired: true,
    e2e: true
  };
  const approvalEvidence = {
    decision: "approved",
    founderApproved: true,
    approvedAt: new Date().toISOString(),
    e2e: true
  };
  const founderDecision = {
    decision: "approved",
    decisionHash: sha256({ decision: "approved", candidateId: String(candidateId) }),
    approvedAt: new Date().toISOString()
  };
  const missionHash = sha256({
    candidateId: String(candidateId),
    truthHash,
    founderDecision: founderDecision.decisionHash
  });

  const mission = await RevenueExecutionMission.create({
    engine: "revenue-brain-v1",
    missionKey: `e2e-mission-${Date.now()}`,
    candidateId,
    incomeGoalId,
    status: "founder_approved",
    opportunity,
    realWorkIntake,
    capability: { capability: "software_engineering", reason: "e2e" },
    architecturePlan: { plan: "e2e", stacks: [] },
    boundedScope: { summary: "e2e", inclusions: [], exclusions: [] },
    workPackages,
    deliverableWorkspace: { status: "complete", completedAt: new Date().toISOString() },
    productionDelivery: { status: "client_accepted", clientAcceptedAt: new Date().toISOString() },
    executionEvidence: { e2e: true },
    founderDecision,
    revisionNumber: 0,
    revisionHistory: [],
    executionPath: ["discovery", "intake", "mission", "delivery"],
    governance,
    approvalEvidence,
    missionHash
  });

  return mission;
}

async function runLoop() {
  console.log("=== GARUDA LIVE REVENUE LOOP (E2E) ===");
  console.log("Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB connected:", mongoose.connection.name);

  const incomeGoal = await createIncomeGoal();
  const candidate = await createCandidate();
  const mission = await createPaymentReadyMission(candidate._id, incomeGoal._id);
  console.log(`Created mission ${mission._id} (status: ${mission.status}, production: ${mission.productionDelivery.status})`);

  console.log("\n--- Step 1: Generate Razorpay Payment Link (mocked transport) ---");
  const mockTransport = async () => {
    return {
      ok: true,
      json: async () => ({
        id: "plink_e2e_1",
        short_url: "https://rzp.io/e2e-test",
        reference_id: `${String(mission._id)}:${String(candidate._id)}`,
        amount: 150000,
        currency: "INR",
        description: "GARUDA service payment",
        status: "created",
        created_at: Math.floor(Date.now() / 1000),
        notes: { missionId: String(mission._id), candidateId: String(candidate._id) }
      })
    };
  };

  const linkResult = await razorpayPaymentLinkService.generatePaymentLink(
    {
      missionId: String(mission._id),
      candidateId: String(candidate._id),
      amount: 1500,
      currency: "INR",
      description: "GARUDA service payment"
    },
    {
      transport: mockTransport,
      env: {
        ...process.env,
        RAZORPAY_LIVE_ENABLED: "false",
        RAZORPAY_KEY_ID_TEST: "rzp_test_e2eplaceholder",
        RAZORPAY_KEY_SECRET_TEST: "e2e_secret_placeholder",
        RAZORPAY_WEBHOOK_SECRET_TEST: WEBHOOK_SECRET
      }
    }
  );
  console.log(`Payment link: ${linkResult.paymentUrl} (referenceId: ${linkResult.referenceId}, mode: ${linkResult.mode})`);

  console.log("\n--- Step 2: Simulate Razorpay Webhook (payment.captured) ---");
  const event = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_e2e_1",
          amount: 150000,
          currency: "INR",
          status: "captured",
          reference_id: `${String(mission._id)}:${String(candidate._id)}`,
          notes: {
            missionId: String(mission._id),
            candidateId: String(candidate._id)
          },
          captured_at: Math.floor(Date.now() / 1000)
        }
      }
    }
  };
  const rawBody = JSON.stringify(event);
  const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");

  const webhookResult = await paymentWebhookService.processRazorpayWebhook(rawBody, {
    "x-razorpay-signature": signature
  });
  console.log(`Webhook success: ${webhookResult.success}`);
  console.log(`Revenue record created: ${webhookResult.revenueRecordCreated} (id: ${webhookResult.revenueRecord.id})`);
  console.log(`Settlement created: ${webhookResult.settlementCreated} (net: ${webhookResult.settlement.netAmount}, fee: ${webhookResult.settlement.feeAmount} @ ${webhookResult.settlement.feeRatePercent}%)`);
  console.log(`Delivery unlock: ${JSON.stringify(webhookResult.deliveryUnlock)}`);

  const refreshedMission = await RevenueExecutionMission.findById(mission._id);
  console.log(`Mission production status now: ${refreshedMission.productionDelivery.status}`);
  console.log(`Mission deliverable workspace status now: ${refreshedMission.deliverableWorkspace.status}`);

  const request = await RevenueExternalActionRequest.findOne({ missionId: mission._id, actionType: "payment_verification" });
  console.log(`External action request: ${request ? request.status : "MISSING"} (decision hash: ${request ? request.latestDecisionHash : "N/A"})`);

  const revenueRecords = await RevenueRecord.find({ paymentEventKey: webhookResult.revenueRecord.paymentEventKey });
  const settlements = await SettlementLedger.find({ revenueRecordId: webhookResult.revenueRecord.id });
  console.log(`\nDB revenue records matching paymentEventKey: ${revenueRecords.length}`);
  console.log(`DB settlement ledgers for revenue record: ${settlements.length}`);

  const passes = webhookResult.success
    && webhookResult.revenueRecordCreated
    && webhookResult.settlementCreated
    && webhookResult.deliveryUnlock.unlocked === true
    && refreshedMission.productionDelivery.status === "payment_verified"
    && refreshedMission.deliverableWorkspace.status === "delivery_authorized"
    && request && request.status === "handoff_ready";

  console.log(`\n=== LOOP RESULT: ${passes ? "PASS" : "FAIL"} ===`);

  await RevenueRecord.deleteMany({ _id: webhookResult.revenueRecord.id });
  await SettlementLedger.deleteMany({ revenueRecordId: webhookResult.revenueRecord.id });
  await RevenueExternalActionRequest.deleteMany({ missionId: mission._id, actionType: "payment_verification" });
  await RevenueExecutionMission.deleteMany({ _id: mission._id });
  await DiscoveryCandidate.deleteMany({ _id: candidate._id });
  await IncomeGoal.deleteMany({ _id: incomeGoal._id });
  await mongoose.disconnect();

  process.exit(passes ? 0 : 1);
}

runLoop().catch((error) => {
  console.error("E2E loop error:", error);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});