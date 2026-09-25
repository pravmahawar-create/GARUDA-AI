/**
 * 🦅 GARUDA Revenue Funnel Security & Trust Boundary Test Suite (Phase 5.8)
 * 
 * 12 Sovereign Security & Trust Boundary Invariants:
 * 1. Browser cannot set founderApproved: true
 * 2. Browser cannot set paidAmount: 50000
 * 3. Browser cannot set verifiedRevenue: true
 * 4. Browser cannot set paymentStatus: "CONFIRMED"
 * 5. Browser cannot set confidence: 1.0
 * 6. Duplicate submission returns idempotent response with matching leadId / missionId
 * 7. Malformed payload (< 10 chars / non-string / missing requirements) rejected with HTTP 400
 * 8. Payload > 50KB rejected with HTTP 413
 * 9. XSS / script injection in requirements sanitized cleanly without code execution
 * 10. Test lead submissions quarantined into environment: "test" (zero production metric pollution)
 * 11. Webhook payment tampering rejected without valid cryptographic signature
 * 12. Attribution parameters sanitized without client overwrite of server authority / timestamps
 */

const { test, describe } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const {
  RevenueFunnelSecurityService,
  FORBIDDEN_CLIENT_FIELDS,
  MAX_PAYLOAD_BYTES
} = require("./revenueFunnelSecurityService");

describe("🦅 GARUDA Revenue Funnel Security & Trust Boundary Suite (Phase 5.8)", () => {
  const testOutputDir = path.join(__dirname, "..", "..", "output", "test_funnel_security_" + Date.now());
  const testLeadsFile = path.join(testOutputDir, "leads.json");
  const testTelemetryFile = path.join(testOutputDir, "telemetry.json");

  const service = new RevenueFunnelSecurityService({
    leadsFilePath: testLeadsFile,
    telemetryFilePath: testTelemetryFile
  });

  // ─────────────────────────────────────────────────────────────────
  // 1. Invariant 1: Browser cannot set founderApproved: true
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 1: Browser cannot set founderApproved: true (Trust Boundary Enforcement)", async () => {
    const maliciousPayload = {
      name: "Attacker",
      email: "attacker@untrusted.com",
      requirements: "Build custom high-frequency trading bot with low latency",
      founderApproved: true // Hostile client attempt to bypass Founder Gate
    };

    const res = await service.handleInboundSubmission(maliciousPayload);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.proposal.founderApproved, false, "founderApproved must remain false");
    assert.strictEqual(res.body.proposal.governanceStatus, "AWAITING_FOUNDER_APPROVAL");
  });

  // ─────────────────────────────────────────────────────────────────
  // 2. Invariant 2: Browser cannot set paidAmount: 50000
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 2: Browser cannot set paidAmount: 50000 (Zero Unverified Money)", async () => {
    const maliciousPayload = {
      name: "Payment Forger",
      email: "forger@untrusted.com",
      requirements: "Deliver distributed enterprise ledger infrastructure",
      paidAmount: 50000 // Hostile attempt to claim advance paid
    };

    const res = await service.handleInboundSubmission(maliciousPayload);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.proposal.paidAmount, 0, "paidAmount must remain 0");
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. Invariant 3: Browser cannot set verifiedRevenue: true
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 3: Browser cannot set verifiedRevenue: true (100% Anti-Fabrication Law)", async () => {
    const maliciousPayload = {
      name: "Revenue Fabricator",
      email: "fabricator@untrusted.com",
      requirements: "Build multi-tenant SaaS application with automated billing",
      verifiedRevenue: true // Hostile attempt to fabricate realized revenue
    };

    const res = await service.handleInboundSubmission(maliciousPayload);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.proposal.verifiedRevenue, false, "verifiedRevenue must remain false");
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. Invariant 4: Browser cannot set paymentStatus: 'CONFIRMED'
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 4: Browser cannot set paymentStatus: 'CONFIRMED' / 'PAID'", async () => {
    const maliciousPayload = {
      name: "Status Hijacker",
      email: "hijacker@untrusted.com",
      requirements: "Develop autonomous marketing intelligence engine",
      paymentStatus: "CONFIRMED" // Hostile attempt to mark status confirmed
    };

    const res = await service.handleInboundSubmission(maliciousPayload);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.proposal.paymentStatus, "UNPAID", "paymentStatus must remain UNPAID");
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Invariant 5: Browser cannot set confidence: 1.0
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 5: Browser cannot set confidence: 1.0 (Reviewer Governance Isolation)", () => {
    const sanitized = service.sanitizeInboundPayload({
      requirements: "Build custom workflow automation agent",
      confidence: 1.0 // Hostile attempt to spoof 100% confidence
    });

    assert.strictEqual(sanitized.confidence, undefined, "Client confidence must be stripped completely");
    assert(sanitized.strippedAuthorityFields.some(f => f.field === "confidence"), "Confidence stripping must be logged");
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. Invariant 6: Content-Hash Lead Idempotency
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 6: Duplicate submission returns idempotent response with matching leadId / missionId", async () => {
    const payload = {
      name: "Repeat Visitor",
      email: "repeat.visitor@enterprise.com",
      requirements: "Develop multi-channel customer intelligence platform with WhatsApp CRM",
      budget: 60000
    };

    const firstRes = await service.handleInboundSubmission(payload);
    assert.strictEqual(firstRes.statusCode, 201);
    assert.strictEqual(firstRes.body.success, true);
    const firstLeadId = firstRes.body.leadId;
    const firstProposalId = firstRes.body.proposalId;

    // Send exact same payload again
    const secondRes = await service.handleInboundSubmission(payload);
    assert.strictEqual(secondRes.statusCode, 200, "Idempotent submission returns HTTP 200");
    assert.strictEqual(secondRes.body.idempotent, true, "idempotent flag must be true");
    assert.strictEqual(secondRes.body.leadId, firstLeadId, "leadId must match exactly");
    assert.strictEqual(secondRes.body.proposalId, firstProposalId, "proposalId must match exactly");
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. Invariant 7: Malformed payload rejected with HTTP 400
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 7: Malformed payload (< 10 chars / non-string / missing requirements) rejected with HTTP 400", async () => {
    // Missing requirements
    assert.throws(
      () => service.sanitizeInboundPayload({}),
      (err) => err.statusCode === 400 && err.message.includes("Project requirements are required")
    );

    // Non-string requirements
    assert.throws(
      () => service.sanitizeInboundPayload({ requirements: 12345 }),
      (err) => err.statusCode === 400 && err.message.includes("must be text string")
    );

    // Too short (< 10 chars)
    assert.throws(
      () => service.sanitizeInboundPayload({ requirements: "Too short" }),
      (err) => err.statusCode === 400 && err.message.includes("minimum 10 characters")
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // 8. Invariant 8: Payload > 50KB rejected with HTTP 413
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 8: Payload > 50KB rejected with HTTP 413 (Denial of Service Guard)", () => {
    const hugeText = "A".repeat(52000); // Exceeds 50KB limit
    const oversizedPayload = {
      requirements: `Build platform: ${hugeText}`
    };

    assert.throws(
      () => service.sanitizeInboundPayload(oversizedPayload),
      (err) => err.statusCode === 413 && err.message.includes("exceeds 50KB limit")
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // 9. Invariant 9: XSS / Script Injection Sanitization
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 9: XSS / script injection in requirements is sanitized cleanly without code execution", () => {
    const maliciousInput = {
      requirements: "<script>alert('hacked');</script><iframe src='javascript:malicious()'></iframe>Build a secure healthcare patient appointment scheduler",
      name: "<b onmouseover='alert(1)'>Evil User</b>"
    };

    const sanitized = service.sanitizeInboundPayload(maliciousInput);

    assert(!sanitized.cleanRequirements.includes("<script>"), "Must not contain <script>");
    assert(!sanitized.cleanRequirements.includes("<iframe>"), "Must not contain <iframe>");
    assert(!sanitized.cleanRequirements.includes("javascript:"), "Must not contain javascript:");
    assert.strictEqual(sanitized.cleanRequirements, "Build a secure healthcare patient appointment scheduler");
    assert.strictEqual(sanitized.name, "Evil User");
  });

  // ─────────────────────────────────────────────────────────────────
  // 10. Invariant 10: Environment Segregation ('test' vs 'production')
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 10: Test lead submissions quarantined into environment: 'test' (Zero Production Contamination)", async () => {
    const initialProductionCount = service.getTelemetryMetrics().productionLeads;
    const initialTestCount = service.getTelemetryMetrics().testLeads;

    const testPayload = {
      name: "QA Automated Tester",
      email: "engineer@sandbox.test",
      requirements: "Verify end-to-end sandbox pipeline execution for regression test",
      isTest: true
    };

    const res = await service.handleInboundSubmission(testPayload);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.environment, "test", "Environment must be test");
    assert.strictEqual(res.body.proposal.isTest, true, "Proposal must be marked isTest: true");

    const afterMetrics = service.getTelemetryMetrics();
    assert.strictEqual(afterMetrics.testLeads, initialTestCount + 1, "testLeads must increment by 1");
    assert.strictEqual(afterMetrics.productionLeads, initialProductionCount, "productionLeads must NOT increment");
  });

  // ─────────────────────────────────────────────────────────────────
  // 11. Invariant 11: Webhook Payment Cryptographic Verification
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 11: Webhook payment tampering rejected without valid cryptographic signature", () => {
    const secret = "rzp_test_secret_key_12345";
    const payload = JSON.stringify({
      amount: 45000,
      paymentId: "pay_xyz987",
      status: "captured"
    });

    // 1. Forged / invalid signature -> Rejected
    const forgedSignature = "0000000000000000000000000000000000000000000000000000000000000000";
    const rejectRes = service.verifyPaymentWebhook(payload, forgedSignature, secret, "razorpay");
    assert.strictEqual(rejectRes.verified, false, "Forged signature must be rejected");
    assert(rejectRes.error.includes("Invalid cryptographic HMAC signature"));

    // 2. Valid HMAC signature -> Verified
    const validSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const acceptRes = service.verifyPaymentWebhook(payload, validSignature, secret, "razorpay");
    assert.strictEqual(acceptRes.verified, true, "Valid HMAC signature must be accepted");
    assert.strictEqual(acceptRes.amount, 45000);
    assert.strictEqual(acceptRes.mode, "production");
  });

  // ─────────────────────────────────────────────────────────────────
  // 12. Invariant 12: Attribution Tamper Prevention
  // ─────────────────────────────────────────────────────────────────
  test("Invariant 12: Attribution parameters sanitized without client overwrite of server authority / timestamps", () => {
    const inputWithTamperedAttribution = {
      requirements: "Build automated accounting reconciliation engine for fintech",
      attribution: {
        channel: "LinkedIn",
        source: "linkedin_inmail",
        campaign: "enterprise_q3",
        // Client attempt to forge internal server authority:
        verified: true,
        serverTimestamp: "2020-01-01T00:00:00Z",
        internalId: "root_bypass_99"
      }
    };

    const sanitized = service.sanitizeInboundPayload(inputWithTamperedAttribution);

    assert.strictEqual(sanitized.attribution.channel, "LinkedIn");
    assert.strictEqual(sanitized.attribution.source, "linkedin_inmail");
    assert.strictEqual(sanitized.attribution.campaign, "enterprise_q3");
    assert.strictEqual(sanitized.attribution.verified, undefined, "verified flag must be stripped");
    assert.strictEqual(sanitized.attribution.serverTimestamp, undefined, "serverTimestamp must be stripped");
    assert.strictEqual(sanitized.attribution.internalId, undefined, "internalId must be stripped");
  });
});
