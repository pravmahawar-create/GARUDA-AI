/**
 * 🦅 GARUDA PHASE 5.6 — REVENUE EXECUTION BRIDGE ACCEPTANCE SUITE
 * 
 * Tests the complete truthful commercial lifecycle:
 * LEAD -> QUALIFY -> SCOPE -> PROPOSAL -> FOUNDER APPROVAL -> CLIENT ACTION ->
 * PROJECT EXECUTION -> DELIVERY -> CLIENT ACCEPTANCE -> PAYMENT EVIDENCE -> REVENUE -> LEARNING
 * 
 * Strict Anti-Fabrication & Invariant Tests:
 * 1. proposal != revenue
 * 2. invoice != revenue
 * 3. payment link != revenue
 * 4. unverified webhook != revenue
 * 5. forged webhook != revenue
 * 6. test payment != production revenue
 * 7. client acceptance != payment
 * 8. internal verification != client acceptance
 * 9. founder-required external action cannot silently execute
 * 10. verified payment creates truthful revenue record
 * 11. duplicate payment event is idempotent
 * 12. duplicate webhook cannot double-count revenue
 * 13. End-to-End Real Lifecycle via resumeRevenueLifecycle
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
  BusinessMissionOrchestrator,
  MISSION_STATES,
  COMMERCIAL_FINANCIAL_STATES,
  REVENUE_STATUSES
} = require("./businessMissionOrchestrator");

test("🦅 GARUDA Revenue Execution Bridge — Phase 5.6 Acceptance Suite", async (t) => {
  const orchestrator = new BusinessMissionOrchestrator();

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: Proposal != Revenue
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 1: proposal != revenue (Proposed amount is never reported as revenue)", async () => {
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Acme Enterprises",
      email: "procurement@acme.com",
      requirements: "Develop a custom multi-agent workflow for supply chain logistics and ERP data ingestion",
      budget: 75000,
      currency: "INR"
    }, { founderApproved: false });

    assert.strictEqual(outcome.proposedAmount, 75000);
    assert.strictEqual(outcome.proposedStatus, COMMERCIAL_FINANCIAL_STATES.PROPOSED);
    assert.strictEqual(outcome.paidAmount, 0, "paidAmount must strictly remain 0 upon proposal generation");
    assert.strictEqual(outcome.paymentStatus, COMMERCIAL_FINANCIAL_STATES.PAYMENT_PENDING);
    assert.strictEqual(outcome.revenueStatus, REVENUE_STATUSES.UNKNOWN);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: Invoice != Revenue
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 2: invoice != revenue (Generated corporate invoice is not revenue until settled)", async () => {
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "TechCorp Global",
      email: "finance@techcorp.com",
      requirements: "Build automated test infrastructure and continuous regression verification harness",
      budget: 60000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      createInvoice: true
    });

    assert.strictEqual(outcome.invoicedAmount, 60000);
    assert.strictEqual(outcome.invoiceStatus, COMMERCIAL_FINANCIAL_STATES.INVOICED);
    assert.strictEqual(outcome.paidAmount, 0, "paidAmount must strictly remain 0 when invoice is generated");
    assert.strictEqual(outcome.paymentStatus, COMMERCIAL_FINANCIAL_STATES.PAYMENT_PENDING);
    assert.strictEqual(outcome.revenueStatus, REVENUE_STATUSES.UNKNOWN);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: Payment Link != Revenue
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 3: payment link != revenue (Prepared payment link is not revenue)", async () => {
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Starlight SaaS",
      email: "billing@starlight.io",
      requirements: "Implement real-time WebSocket communication gateway and client authorization",
      budget: 45000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      preparePaymentLink: true
    });

    assert.ok(outcome.paymentLinkInfo, "Payment link must be prepared");
    assert.strictEqual(outcome.paidAmount, 0, "paidAmount must strictly remain 0 when payment link is prepared");
    assert.strictEqual(outcome.paymentStatus, COMMERCIAL_FINANCIAL_STATES.PAYMENT_PENDING);
    assert.strictEqual(outcome.revenueStatus, REVENUE_STATUSES.UNKNOWN);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 4: Unverified Webhook != Revenue
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 4: unverified webhook != revenue (Unsigned payment claim is rejected)", async () => {
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Delta Dynamics",
      email: "ops@deltadynamics.com",
      requirements: "Engineer custom REST APIs with forensic input sanitization and rate limiting",
      budget: 50000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      paymentWebhook: {
        rawBody: JSON.stringify({ amount: 50000 }),
        // No signature, no valid proof
        unverified: true
      }
    });

    assert.strictEqual(outcome.paidAmount, 0, "Unverified webhook must not record revenue");
    assert.strictEqual(outcome.paymentStatus, "PAYMENT_UNVERIFIED");
    assert.strictEqual(outcome.revenueStatus, REVENUE_STATUSES.UNKNOWN);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 5: Forged Webhook != Revenue
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 5: forged webhook != revenue (Invalid HMAC signature throws/fails verification)", async () => {
    const secret = "correct_webhook_secret_key_123456";
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_forged_999", amount: 5000000 } } }
    });
    const fakeSignature = "0000000000000000000000000000000000000000000000000000000000000000";

    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Cyber Security Labs",
      email: "security@cybersec.com",
      requirements: "Build impenetrable API gateway with HMAC signature verification and rate limiting",
      budget: 50000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      paymentWebhook: {
        provider: "razorpay",
        rawBody,
        signature: fakeSignature,
        secret
      }
    });

    assert.strictEqual(outcome.paidAmount, 0, "Forged webhook must yield 0 paid amount");
    assert.strictEqual(outcome.paymentStatus, "PAYMENT_UNVERIFIED");
    assert.notStrictEqual(outcome.revenueStatus, REVENUE_STATUSES.REVENUE_RECORDED);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 6: Test Payment != Production Revenue
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 6: test payment != production revenue (Sandbox webhook never contaminates production)", async () => {
    const secret = "test_webhook_secret_min_16_chars";
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payment: { id: "pay_test_12345", amount: 35000 }
    });
    const validTestSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Beta Testers Ltd",
      email: "tester@betatesters.com",
      requirements: "Configure end-to-end sandbox testing suite with mock fixtures and assert checks",
      budget: 35000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      mode: "test",
      paymentWebhook: {
        mode: "test",
        rawBody,
        signature: validTestSignature,
        secret,
        amount: 35000
      }
    });

    assert.strictEqual(outcome.paidAmount, 0, "Production paidAmount must strictly remain 0 for sandbox payments");
    assert.strictEqual(outcome.revenueStatus, REVENUE_STATUSES.UNKNOWN);
    const testEvidence = outcome.evidence.find(e => e.type === "test_payment_receipt");
    assert.ok(testEvidence, "Must log isolated test receipt evidence");
    assert.strictEqual(testEvidence.mode, "test");
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 7: Client Acceptance != Payment
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 7: client acceptance != payment (Accepted proposal does not record revenue)", async () => {
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Apex Holdings",
      email: "director@apex.com",
      requirements: "Deliver custom executive dashboard with real-time analytics and data visualization",
      budget: 80000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true
    });

    assert.ok(outcome.stateHistory.some(s => s.state === MISSION_STATES.CLIENT_ACCEPTED));
    assert.strictEqual(outcome.paidAmount, 0, "paidAmount must remain 0 when client accepts terms");
    assert.strictEqual(outcome.paymentStatus, COMMERCIAL_FINANCIAL_STATES.PAYMENT_PENDING);
    assert.strictEqual(outcome.revenueStatus, REVENUE_STATUSES.UNKNOWN);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 8: Internal Verification != Client Acceptance
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 8: internal verification != client acceptance (Delivery pass is separate from client signoff)", async () => {
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Nexus Innovations",
      email: "lead@nexus.com",
      requirements: "Architect secure microservice backend with Docker containerization and CI/CD",
      budget: 50000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true
    });

    const deliveryReadyState = outcome.stateHistory.find(s => s.state === MISSION_STATES.DELIVERY_READY);
    assert.ok(deliveryReadyState, "Must transition through DELIVERY_READY");
    assert.strictEqual(deliveryReadyState.internalVerification, "INTERNAL_VERIFIED");

    const clientAcceptedState = outcome.stateHistory.find(s => s.state === MISSION_STATES.CLIENT_ACCEPTED);
    assert.ok(clientAcceptedState, "Must have distinct CLIENT_ACCEPTED state");
    assert.notStrictEqual(deliveryReadyState.timestamp, clientAcceptedState.timestamp);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 9: Founder-Required External Action Cannot Silently Execute
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 9: founder-required external action halts dispatch and sets REQUIRES_FOUNDER", async () => {
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Enterprise Core",
      email: "contact@enterprisecore.com",
      requirements: "Develop mission-critical data migration script with zero data loss guarantee",
      budget: 100000,
      currency: "INR"
    }, {
      founderApproved: false
    });

    assert.strictEqual(outcome.state, MISSION_STATES.AWAITING_FOUNDER);
    assert.strictEqual(outcome.commercialStatus, MISSION_STATES.AWAITING_FOUNDER);
    assert.strictEqual(outcome.requiresFounder, true);
    assert.strictEqual(outcome.nextAction.requiresFounder, true);
    assert.strictEqual(outcome.nextAction.communicationAction.executionStatus, "REQUIRES_FOUNDER");
    assert.notStrictEqual(outcome.nextAction.communicationAction.executionStatus, "DISPATCHED");
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 10: Verified Payment Creates Truthful Revenue Record
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 10: verified payment creates truthful revenue record with SHA-256 evidence", async () => {
    const paymentId = `pay_auth_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const outcome = await orchestrator.executeRevenueLifecycle({
      name: "Vertex Cloud Systems",
      email: "cto@vertexcloud.com",
      requirements: "Implement high-throughput event bus with dead-letter queue and retry policies",
      budget: 55000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      paymentWebhook: {
        authoritative: true,
        paymentId,
        amount: 55000,
        currency: "INR"
      }
    });

    assert.strictEqual(outcome.paidAmount, 55000);
    assert.strictEqual(outcome.paymentStatus, COMMERCIAL_FINANCIAL_STATES.PAYMENT_VERIFIED);
    assert.strictEqual(outcome.revenueStatus, REVENUE_STATUSES.REVENUE_RECORDED);

    const verifiedReceipt = outcome.evidence.find(e => e.type === "verified_payment_receipt");
    assert.ok(verifiedReceipt, "Must record verified payment receipt");
    assert.strictEqual(verifiedReceipt.amount, 55000);
    assert.strictEqual(verifiedReceipt.eventId, paymentId);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 11: Duplicate Payment Event is Idempotent
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 11: duplicate payment event is idempotent and handled gracefully", async () => {
    const fixedPaymentId = "pay_idempotent_fixed_777";
    const paymentInput = {
      authoritative: true,
      paymentId: fixedPaymentId,
      amount: 40000,
      currency: "INR"
    };

    const firstRun = await orchestrator.executeRevenueLifecycle({
      name: "Idempotent Corp",
      email: "audit@idempotent.com",
      requirements: "Build idempotent webhook consumer with transactional outbox pattern",
      budget: 40000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      paymentWebhook: paymentInput
    });

    assert.strictEqual(firstRun.paidAmount, 40000);

    // Second execution with identical payment ID
    const secondRun = await orchestrator.executeRevenueLifecycle({
      name: "Idempotent Corp",
      email: "audit@idempotent.com",
      requirements: "Build idempotent webhook consumer with transactional outbox pattern",
      budget: 40000,
      currency: "INR"
    }, {
      founderApproved: true,
      clientAccepted: true,
      paymentWebhook: paymentInput
    });

    assert.strictEqual(secondRun.paidAmount, 40000, "Second run must not alter paidAmount");
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 12: Duplicate Webhook Cannot Double-Count Revenue
  // ─────────────────────────────────────────────────────────────────
  await t.test("Safety Invariant 12: duplicate webhook cannot double-count revenue", async () => {
    const secret = "test_webhook_secret_min_16_chars";
    const eventId = `evt_dedup_${Date.now()}`;
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: eventId, amount: 5000000 } } }
    });
    const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    const webhookPayload = {
      provider: "razorpay",
      eventId,
      rawBody,
      signature,
      secret,
      amount: 50000
    };

    const run1 = orchestrator._verifyPaymentAuthoritative(webhookPayload);
    assert.strictEqual(run1.verified, true);
    assert.strictEqual(run1.amount, 50000);

    // Duplicate webhook call
    const run2 = orchestrator._verifyPaymentAuthoritative(webhookPayload);
    assert.strictEqual(run2.verified, true);
    assert.strictEqual(run2.duplicate, true);
    assert.strictEqual(run2.amount, 50000, "Amount must remain exactly 50000, never 100000");
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST 13: Full End-to-End Real Commercial Lifecycle via resumeRevenueLifecycle
  // ─────────────────────────────────────────────────────────────────
  await t.test("Real Lifecycle: End-to-end 12-stage commercial lifecycle via resumeRevenueLifecycle", async () => {
    // Step 1: Inbound Lead Capture & Autonomous Preparation (Halts at AWAITING_FOUNDER)
    const step1 = await orchestrator.executeRevenueLifecycle({
      name: "Sovereign Logistics",
      email: "procurement@sovereignlogistics.in",
      phone: "+919876543210",
      requirements: "Design and implement autonomous fleet tracking gateway with MQTT and geofencing verification",
      budget: 65000,
      currency: "INR"
    }, { founderApproved: false });

    assert.strictEqual(step1.state, MISSION_STATES.AWAITING_FOUNDER);
    assert.strictEqual(step1.requiresFounder, true);
    assert.strictEqual(step1.proposedAmount, 65000);
    assert.strictEqual(step1.paidAmount, 0);

    // Step 2: Founder Praveen Approves Proposal Dispatch
    const step2 = await orchestrator.resumeRevenueLifecycle(step1.missionId, {
      founderApproved: true
    });

    assert.strictEqual(step2.state, MISSION_STATES.AWAITING_CLIENT);
    assert.strictEqual(step2.requiresFounder, false);
    assert.strictEqual(step2.paidAmount, 0);

    // Step 3: Client Reviews and Formally Accepts Terms
    const step3 = await orchestrator.resumeRevenueLifecycle(step1.missionId, {
      clientAccepted: true
    });

    assert.strictEqual(step3.state, MISSION_STATES.AWAITING_PAYMENT);
    assert.ok(step3.stateHistory.some(s => s.state === MISSION_STATES.DELIVERED));
    assert.ok(step3.stateHistory.some(s => s.state === MISSION_STATES.PROJECT_ACTIVE));
    assert.ok(step3.stateHistory.some(s => s.state === MISSION_STATES.DELIVERY_READY));
    assert.strictEqual(step3.paidAmount, 0, "Still awaiting payment, paidAmount must be 0");

    // Step 4: Authoritative Payment Webhook Received & Verified
    const paymentId = `pay_sovereign_${Date.now()}`;
    const step4 = await orchestrator.resumeRevenueLifecycle(step1.missionId, {
      paymentWebhook: {
        authoritative: true,
        paymentId,
        amount: 65000,
        currency: "INR"
      }
    });

    assert.strictEqual(step4.state, MISSION_STATES.MISSION_COMPLETE);
    assert.strictEqual(step4.commercialStatus, "REVENUE_REALIZED");
    assert.strictEqual(step4.paidAmount, 65000);
    assert.strictEqual(step4.paymentStatus, COMMERCIAL_FINANCIAL_STATES.PAYMENT_VERIFIED);
    assert.strictEqual(step4.revenueStatus, REVENUE_STATUSES.REVENUE_RECORDED);
    assert.ok(step4.memoryStatus.promoted, "Must promote verified learning to memory");

    // Verify all physical artifacts on disk
    for (const ev of step4.evidence) {
      if (ev.path) {
        assert.ok(fs.existsSync(ev.path), `Artifact must exist on disk: ${ev.path}`);
        assert.ok(ev.sizeBytes > 0, "Size must be > 0");
        assert.strictEqual(typeof ev.sha256, "string");
        assert.strictEqual(ev.sha256.length, 64, "SHA-256 must be 64-char hex");
      }
    }
  });
});
