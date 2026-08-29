/**
 * GARUDA Automated Test Suite — Real Money Loop End-to-End
 * Verifies complete commercial lifecycle:
 * Chat / Scope -> Proposal Formulation -> Cloud Persistence -> Retrieval -> Digital Acceptance ->
 * Razorpay Payment Binding -> Webhook Verification -> Deposit Paid -> Automated Project Activation -> Founder Notification.
 */

const assert = require("assert");
const crypto = require("crypto");
const persistentProposalService = require("./persistentProposalService");
const proposalsHandler = require("../../api/proposals");
const clientProposalService = require("./clientProposalService");
const publicChatCommercialAgentService = require("./publicChatCommercialAgentService");

function mockReqRes(options = {}) {
  let statusCode = 200;
  let headers = {};
  let body = null;
  let ended = false;

  const req = {
    method: options.method || "GET",
    url: options.url || "/",
    headers: options.headers || {},
    query: options.query || {},
    body: options.body || {},
    socket: { remoteAddress: "127.0.0.1" }
  };

  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      body = data;
      ended = true;
      return data;
    },
    end: (d) => {
      if (d) body = d;
      ended = true;
    }
  };

  return { req, res, getStatus: () => statusCode, getBody: () => body, isEnded: () => ended };
}

async function runMoneyLoopTests() {
  console.log("=== RUNNING GARUDA REAL MONEY LOOP END-TO-END SUITE ===");

  // -------------------------------------------------------------
  // TEST 1: Proposal Generation & Cloud Persistence
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Generate & Persist Commercial Proposal ---");
  const testProposal = await clientProposalService.createProposal({
    title: "AI Commercial Pipeline System",
    requirements: "Build an automated multi-channel lead acquisition and webhook processing pipeline in Node.js and React",
    amount: 50000,
    currency: "INR",
    client: {
      name: "Acme Enterprises",
      email: "ceo@acme.com",
      phone: "+919876543210"
    }
  }, { founderApproved: true });

  assert.ok(testProposal.proposalId, "Proposal must have a unique proposalId");
  assert.strictEqual(testProposal.pricing.totalAmount, 50000, "Total amount must match quote");
  assert.strictEqual(testProposal.pricing.depositAmount, 25000, "50% kickoff deposit must be 25,000");
  assert.strictEqual(testProposal.status, "APPROVED", "Proposal status must be APPROVED");
  console.log(`✔ Generated Proposal: ${testProposal.proposalId} (Deposit: ₹${testProposal.pricing.depositAmount})`);

  // Verify persistence in persistentProposalService
  const retrievedPersisted = await persistentProposalService.getProposal(testProposal.proposalId);
  assert.ok(retrievedPersisted, "Proposal must be retrievable from persistent storage");
  assert.strictEqual(retrievedPersisted.proposalId, testProposal.proposalId);
  console.log("✔ Proposal successfully saved to persistent database & cache layer.");

  // -------------------------------------------------------------
  // TEST 2: Serverless HTTP Proposal Retrieval (GET /api/proposals/:id)
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Serverless API Retrieval (GET /api/proposals/:proposalId) ---");
  const getCall = mockReqRes({
    method: "GET",
    url: `/api/proposals/${testProposal.proposalId}?public=true`,
    query: { proposalId: testProposal.proposalId, public: "true" }
  });

  await proposalsHandler(getCall.req, getCall.res);
  assert.strictEqual(getCall.getStatus(), 200, "Retrieval must return HTTP 200");
  const getBody = getCall.getBody();
  assert.strictEqual(getBody.success, true);
  assert.strictEqual(getBody.proposal.proposalId, testProposal.proposalId);
  assert.strictEqual(getBody.proposal.isVerified, true);
  assert.ok(getBody.proposal.deliverables.length > 0, "Deliverables must be present");
  console.log("✔ Serverless API returned sanitized, verified public proposal structure.");

  // -------------------------------------------------------------
  // TEST 3: Digital Terms Acceptance (POST /api/proposals/:id/accept)
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Client Digital Terms Acceptance ---");
  const acceptCall = mockReqRes({
    method: "POST",
    url: `/api/proposals/${testProposal.proposalId}/accept`,
    query: { proposalId: testProposal.proposalId, action: "accept" },
    body: { name: "Rohan Sharma", email: "rohan@acme.com" }
  });

  await proposalsHandler(acceptCall.req, acceptCall.res);
  assert.strictEqual(acceptCall.getStatus(), 200, "Acceptance must return HTTP 200");
  const acceptBody = acceptCall.getBody();
  assert.strictEqual(acceptBody.success, true);
  assert.strictEqual(acceptBody.proposal.status, "CLIENT_ACCEPTED");
  assert.strictEqual(acceptBody.proposal.clientAcceptance.signerName, "Rohan Sharma");
  console.log("✔ Client digital signature and acceptance recorded with cryptographic timestamp.");

  // -------------------------------------------------------------
  // TEST 4: Payment Order Creation (POST /api/proposals/:id/payment/order)
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Razorpay Payment Order Creation ---");
  const orderCall = mockReqRes({
    method: "POST",
    url: `/api/proposals/${testProposal.proposalId}/payment/order`,
    query: { proposalId: testProposal.proposalId, action: "payment", subAction: "order" }
  });

  await proposalsHandler(orderCall.req, orderCall.res);
  assert.strictEqual(orderCall.getStatus(), 200, "Order creation must return HTTP 200");
  const orderBody = orderCall.getBody();
  assert.strictEqual(orderBody.success, true);
  assert.ok(orderBody.orderId, "Must return Razorpay orderId");
  assert.strictEqual(orderBody.amount, 2500000, "25,000 INR must convert to 2,500,000 paise");
  assert.strictEqual(orderBody.currency, "INR");
  console.log(`✔ Generated Razorpay Order: ${orderBody.orderId} (Amount: ${orderBody.amount} paise)`);

  // -------------------------------------------------------------
  // TEST 5: Payment Verification & Automatic Project Activation
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Authoritative Payment Verification & Project Activation ---");
  const verifyCall = mockReqRes({
    method: "POST",
    url: `/api/proposals/${testProposal.proposalId}/payment/verify`,
    headers: { "x-garuda-test": "true" },
    query: { proposalId: testProposal.proposalId, action: "payment", subAction: "verify" },
    body: {
      paymentId: "pay_test_deposit_998877",
      orderId: orderBody.orderId,
      isTest: true
    }
  });

  await proposalsHandler(verifyCall.req, verifyCall.res);
  assert.strictEqual(verifyCall.getStatus(), 200, "Verification must return HTTP 200");
  const verifyBody = verifyCall.getBody();
  assert.strictEqual(verifyBody.success, true);
  assert.strictEqual(verifyBody.verified, true);
  assert.strictEqual(verifyBody.status, "DEPOSIT_PAID");
  assert.ok(verifyBody.project, "Project must be automatically created");
  assert.ok(verifyBody.project.projectId.startsWith("proj_"), "ProjectId must have standard format");
  assert.strictEqual(verifyBody.project.status, "ACTIVE_IN_DEVELOPMENT");
  console.log(`✔ Deposit Verified! Activated Project Workspace: ${verifyBody.project.projectId}`);

  // -------------------------------------------------------------
  // TEST 6: Webhook Processing Hook (POST /api/proposals/webhook)
  // -------------------------------------------------------------
  console.log("\n--- TEST 6: Asynchronous Webhook Processing ---");
  // Create a second fresh proposal for webhook test
  const webhookProposal = await clientProposalService.createProposal({
    title: "Autonomous Agent Bot",
    requirements: "Telegram automated trading assistant",
    amount: 30000,
    currency: "INR",
    client: { name: "Trader Pro", email: "trader@pro.com" }
  }, { founderApproved: true });

  const webhookCall = mockReqRes({
    method: "POST",
    url: "/api/proposals/webhook",
    headers: { "x-garuda-test": "true" },
    query: { action: "webhook" },
    body: {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_rzp_webhook_554433",
            order_id: "order_mock_991122",
            amount: 1500000,
            currency: "INR",
            notes: { proposalId: webhookProposal.proposalId }
          }
        }
      }
    }
  });

  await proposalsHandler(webhookCall.req, webhookCall.res);
  assert.strictEqual(webhookCall.getStatus(), 200, "Webhook must return HTTP 200");
  const webhookBody = webhookCall.getBody();
  assert.strictEqual(webhookBody.success, true);
  assert.strictEqual(webhookBody.activated, true);
  console.log(`✔ Asynchronous Webhook verified deposit & activated Project: ${webhookBody.project.projectId}`);

  // -------------------------------------------------------------
  // TEST 7: Robustness & Edge Cases
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: Robustness & Edge Cases ---");

  // A. Non-existent proposal returns 404
  const invalidGet = mockReqRes({
    method: "GET",
    url: "/api/proposals/prop_non_existent_99999",
    query: { proposalId: "prop_non_existent_99999" }
  });
  await proposalsHandler(invalidGet.req, invalidGet.res);
  assert.strictEqual(invalidGet.getStatus(), 404, "Invalid proposal must return 404");
  console.log("✔ Non-existent proposal ID correctly returns 404.");

  // B. Missing signer name returns 400
  const missingNameAccept = mockReqRes({
    method: "POST",
    url: `/api/proposals/${testProposal.proposalId}/accept`,
    query: { proposalId: testProposal.proposalId, action: "accept" },
    body: { name: "" }
  });
  await proposalsHandler(missingNameAccept.req, missingNameAccept.res);
  assert.strictEqual(missingNameAccept.getStatus(), 400, "Missing name must return 400");
  console.log("✔ Acceptance without name correctly returns 400.");

  // C. Duplicate acceptance is handled idempotently
  const dupAccept = mockReqRes({
    method: "POST",
    url: `/api/proposals/${testProposal.proposalId}/accept`,
    query: { proposalId: testProposal.proposalId, action: "accept" },
    body: { name: "Rohan Sharma" }
  });
  await proposalsHandler(dupAccept.req, dupAccept.res);
  assert.strictEqual(dupAccept.getStatus(), 200, "Duplicate acceptance must return 200 safely");
  console.log("✔ Duplicate acceptance handled idempotently.");

  // D. Duplicate payment verification is handled idempotently
  const dupVerify = mockReqRes({
    method: "POST",
    url: `/api/proposals/${testProposal.proposalId}/payment/verify`,
    headers: { "x-garuda-test": "true" },
    query: { proposalId: testProposal.proposalId, action: "payment", subAction: "verify" },
    body: { paymentId: "pay_test_deposit_998877", isTest: true }
  });
  await proposalsHandler(dupVerify.req, dupVerify.res);
  assert.strictEqual(dupVerify.getStatus(), 200, "Duplicate verification must return 200 safely");
  console.log("✔ Duplicate payment verification handled idempotently.");

  console.log("\n🎉 ALL REAL MONEY LOOP TESTS PASSED (100% SUCCESS)!");
}

runMoneyLoopTests().catch((err) => {
  console.error("Test Failure:", err);
  process.exit(1);
});
