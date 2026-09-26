/**
 * 🦅 GARUDA Client Acquisition — Phase 5.7 Acceptance Suite
 * 
 * 12 Sovereign Anti-Fabrication & Safety Invariants:
 * 1. Missing lead data (budget, company, urgency) remains explicitly UNKNOWN (never fabricated)
 * 2. Intent classification never claims HIGH_INTENT on empty or gibberish input
 * 3. Unsupported capability reports PARTIAL or UNKNOWN coverage (never false FULL coverage)
 * 4. Estimated value != proposed != invoiced != paid != revenue (all 5 values strictly separated)
 * 5. External outreach halts at AWAITING_FOUNDER with complete 8-part dossier
 * 6. Follow-up message cannot be marked SENT without provider delivery evidence
 * 7. Follow-up immediately halts on CLIENT_DECLINED or OPT_OUT
 * 8. Follow-up immediately halts when max follow-up count is reached (no spam)
 * 9. Follow-up halts on FOUNDER_BLOCK
 * 10. Duplicate lead intake is idempotent (no duplicate processing or duplicate mission)
 * 11. Client acceptance seamlessly hands off to Phase 5.6 revenue lifecycle (no duplicate mission)
 * 12. Inbound learning is validated and promoted through LearningPromoter (no direct memory writes)
 */

const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
  BusinessMissionOrchestrator,
  MISSION_STATES,
  INTENT_CATEGORIES
} = require("./businessMissionOrchestrator");

describe("🦅 GARUDA Client Acquisition — Phase 5.7 Acceptance Suite", () => {
  const testOutputDir = path.join(__dirname, "..", "..", "output", "test_acquisition_" + Date.now());
  const orchestrator = new BusinessMissionOrchestrator({ outputDir: testOutputDir });

  // ─────────────────────────────────────────────────────────────────
  // 1. Safety Invariant 1: Missing Lead Data -> UNKNOWN (Never Fabricated)
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 1: Missing lead data (budget, company, urgency) remains explicitly UNKNOWN (never fabricated)", async () => {
    const rawInput = {
      requirements: "Build an automated customer support AI chatbot with Telegram integration",
      name: "Acme Prospect",
      email: "prospect@acme-inc.test"
      // Note: NO budget, NO company, NO urgency provided
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput);

    assert.strictEqual(lead.customer.company, "UNKNOWN", "Company must be UNKNOWN if not provided");
    assert.strictEqual(lead.urgency, "UNKNOWN", "Urgency must be UNKNOWN if not provided");
    assert.strictEqual(lead.financials.estimatedValue, null, "Estimated value must be null when budget is not provided");
    assert.strictEqual(lead.valueEstimation.status, "UNKNOWN", "Value status must be UNKNOWN");
    assert.notStrictEqual(lead.customer.company, "Google", "Never synthesize company name");
  });

  // ─────────────────────────────────────────────────────────────────
  // 2. Safety Invariant 2: Intent Classification -> Never High Intent on Empty/Gibberish
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 2: Intent classification never claims HIGH_INTENT on empty or gibberish input", () => {
    const emptyRes = orchestrator.classifyInboundIntent("", {});
    assert.strictEqual(emptyRes.category, INTENT_CATEGORIES.UNKNOWN, "Empty input must return UNKNOWN intent");
    assert.strictEqual(emptyRes.confidence, 0.0);

    const whitespaceRes = orchestrator.classifyInboundIntent("    ", {});
    assert.strictEqual(whitespaceRes.category, INTENT_CATEGORIES.UNKNOWN, "Whitespace input must return UNKNOWN intent");

    const gibberishRes = orchestrator.classifyInboundIntent("asdfghjkl qwerty test123", {});
    assert.strictEqual(gibberishRes.category, INTENT_CATEGORIES.UNQUALIFIED, "Gibberish input must return UNQUALIFIED");

    const spamRes = orchestrator.classifyInboundIntent("aaaaabbbbbaaaaa", {});
    assert.strictEqual(spamRes.category, INTENT_CATEGORIES.UNQUALIFIED, "Spam pattern must return UNQUALIFIED");

    const hostileRes = orchestrator.classifyInboundIntent("build malware exploit to ddos casino website", {});
    assert.strictEqual(hostileRes.category, INTENT_CATEGORIES.UNQUALIFIED, "Prohibited content must return UNQUALIFIED");

    // Legitimate High Intent requirement for contrast
    const legitRes = orchestrator.classifyInboundIntent(
      "Build a multi-agent automated CRM dashboard with REST API integration and PostgreSQL storage",
      { company: "TechCorp" },
      { budget: 85000, timeline: "2 weeks" }
    );
    assert.strictEqual(legitRes.category, INTENT_CATEGORIES.HIGH_INTENT, "Detailed tech spec with budget/timeline is HIGH_INTENT");
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. Safety Invariant 3: Unsupported Capability -> PARTIAL or UNKNOWN (Never False FULL)
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 3: Unsupported capability reports PARTIAL or UNKNOWN coverage (never false FULL coverage)", () => {
    // Unsupported requirement (food delivery)
    const foodAssessment = orchestrator.assessCapabilityCoverage("Deliver fresh hot pizza and burgers to room 402 with fries and soda");
    assert.notStrictEqual(foodAssessment.coverage, "FULL", "Pizza delivery must not report FULL capability coverage");
    assert.strictEqual(foodAssessment.coverage, "UNKNOWN", "Completely unrepresented domain must report UNKNOWN");
    assert(foodAssessment.gaps.length > 0, "Gaps must be explicitly populated for unsupported requests");

    // Partial requirement (extreme offshore quantum physics submarine)
    const submarineAssessment = orchestrator.assessCapabilityCoverage("Construct an underwater titanium submarine with nuclear reactor propulsion");
    assert.notStrictEqual(submarineAssessment.coverage, "FULL", "Submarine construction must not report FULL capability coverage");
    assert(submarineAssessment.coverage === "PARTIAL" || submarineAssessment.coverage === "UNKNOWN");
    assert(submarineAssessment.gaps.length > 0);

    // Supported requirement (software engineering)
    const softAssessment = orchestrator.assessCapabilityCoverage("Plan, build, test, and deploy a secure Node.js REST API with authentication and automated tests");
    assert.strictEqual(softAssessment.coverage, "FULL", "Core software engineering should match FULL coverage");
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. Safety Invariant 4: Strict Separation of 5 Financial Values
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 4: Estimated value != proposed != invoiced != paid != revenue (all 5 values strictly separated)", async () => {
    const rawInput = {
      requirements: "Develop an automated WhatsApp lead capture bot with database synchronization",
      name: "Logistics Enterprise",
      contact: "ops@logistics.example.com",
      budget: 65000
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput);
    const { financials } = lead;

    assert(financials, "Financials block must exist");
    assert.strictEqual(financials.estimatedValue, 65000, "Estimated value tracks evidence-backed budget");
    assert.strictEqual(financials.proposedAmount, 65000, "Proposed amount matches initial scoping quotation");
    assert.strictEqual(financials.invoicedAmount, 0, "Invoiced amount must remain strictly 0");
    assert.strictEqual(financials.paidAmount, 0, "Paid amount must remain strictly 0");
    assert.strictEqual(financials.verifiedRevenue, 0, "Verified revenue must remain strictly 0");

    // Ensure none of the zero values are confused with proposed amount
    assert.notStrictEqual(financials.proposedAmount, financials.paidAmount, "Proposal amount must NEVER be reported as paid");
    assert.notStrictEqual(financials.proposedAmount, financials.verifiedRevenue, "Proposal amount must NEVER be reported as revenue");
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Safety Invariant 5: Founder Gate Halts with Complete 8-Part Dossier
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 5: External outreach halts at AWAITING_FOUNDER with complete 8-part dossier", async () => {
    const rawInput = {
      requirements: "Build automated high-performance scraper and notification pipeline for real estate listings",
      name: "Harish Patel",
      contact: "harish@realestate-hub.test",
      budget: 50000
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput, { founderApproved: false });

    assert.strictEqual(lead.state, MISSION_STATES.AWAITING_FOUNDER, "Lead must halt at AWAITING_FOUNDER");
    assert.strictEqual(lead.founderGovernance.requiresFounder, true);
    assert.strictEqual(lead.founderGovernance.status, "AWAITING_FOUNDER_APPROVAL");
    assert.strictEqual(lead.communicationAction.executionStatus, "REQUIRES_FOUNDER");

    const { dossier } = lead.founderGovernance;
    assert(dossier, "Founder dossier must be present");
    assert(typeof dossier.whyThisLead === "string" && dossier.whyThisLead.length > 0, "1. whyThisLead must be present");
    assert(typeof dossier.whatClientWants === "string" && dossier.whatClientWants.length > 0, "2. whatClientWants must be present");
    assert(typeof dossier.whatGarudaCanDeliver === "string" && dossier.whatGarudaCanDeliver.length > 0, "3. whatGarudaCanDeliver must be present");
    assert(typeof dossier.proposedScope === "string" && dossier.proposedScope.length > 0, "4. proposedScope must be present");
    assert(typeof dossier.proposedPrice === "string" && dossier.proposedPrice.length > 0, "5. proposedPrice must be present");
    assert(Array.isArray(dossier.risks) && dossier.risks.length > 0, "6. risks must be an array");
    assert(Array.isArray(dossier.evidence) && dossier.evidence.length > 0, "7. evidence must be an array");
    assert(typeof dossier.nextAction === "string" && dossier.nextAction.length > 0, "8. nextAction must be present");

    // Verify SHA-256 evidence in dossier
    assert(dossier.evidence[0].sha256, "Dossier evidence must include SHA-256 hash");
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. Safety Invariant 6: Follow-Up Cannot Be Marked SENT Without Provider Evidence
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 6: Follow-up message cannot be marked SENT without provider delivery evidence", async () => {
    const rawInput = {
      requirements: "Build automated KYC verification workflow with document OCR",
      name: "Fintech Startup",
      contact: "team@fintech.test",
      budget: 90000
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput, { founderApproved: true });

    // Attempt 1: Dispatch without provider delivery evidence
    const unverifiedAttempt = orchestrator.processInboundFollowUp(lead.leadId, {
      action: "SEND_FOLLOWUP",
      founderApproved: true
      // Notice: NO providerEvidence
    });

    assert.notStrictEqual(unverifiedAttempt.followUp.status, "SENT", "Follow-up must NOT be marked SENT without provider evidence");
    assert.strictEqual(unverifiedAttempt.followUp.status, "READY_TO_SEND", "Status should be READY_TO_SEND");
    assert.strictEqual(unverifiedAttempt.followUp.followUpCount, 0, "Follow-up count must not increment without proof");

    // Attempt 2: Dispatch with valid provider delivery evidence
    const verifiedAttempt = orchestrator.processInboundFollowUp(lead.leadId, {
      action: "SEND_FOLLOWUP",
      founderApproved: true,
      providerEvidence: {
        provider: "ses_email_gateway",
        messageId: "ses_msg_48291039",
        delivered: true,
        timestamp: new Date().toISOString()
      }
    });

    assert.strictEqual(verifiedAttempt.followUp.status, "SENT", "Follow-up must be marked SENT with valid provider evidence");
    assert.strictEqual(verifiedAttempt.followUp.followUpCount, 1, "Follow-up count should increment to 1");
    assert(verifiedAttempt.followUp.lastFollowUpAt, "lastFollowUpAt must be recorded");
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. Safety Invariant 7: Follow-Up Immediately Halts on CLIENT_DECLINED or OPT_OUT
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 7: Follow-up immediately halts on CLIENT_DECLINED or OPT_OUT", async () => {
    const rawInput = {
      requirements: "Custom billing engine for subscription management",
      name: "SaaS Ops",
      contact: "billing@saasops.test"
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput, { founderApproved: true });

    // Test client declined
    const declinedLead = orchestrator.processInboundFollowUp(lead.leadId, { action: "CLIENT_DECLINED" });
    assert.strictEqual(declinedLead.followUp.status, "STOPPED", "Follow-up must stop on client decline");
    assert.strictEqual(declinedLead.followUp.stopReason, "CLIENT_DECLINED");
    assert.strictEqual(declinedLead.commercialStatus, "CLIENT_DECLINED");

    // Test opt-out on a new lead
    const rawInput2 = {
      requirements: "Mobile fitness tracking dashboard application",
      name: "Fitness App",
      contact: "info@fitapp.test"
    };
    const lead2 = await orchestrator.executeInboundAcquisitionLoop(rawInput2, { founderApproved: true });
    const optOutLead = orchestrator.processInboundFollowUp(lead2.leadId, { action: "OPT_OUT" });
    assert.strictEqual(optOutLead.followUp.status, "STOPPED", "Follow-up must stop on opt out");
    assert.strictEqual(optOutLead.followUp.stopReason, "OPT_OUT");
  });

  // ─────────────────────────────────────────────────────────────────
  // 8. Safety Invariant 8: Follow-Up Halts When Max Follow-Up Count Reached (No Spam)
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 8: Follow-up immediately halts when max follow-up count is reached (no spam)", async () => {
    const rawInput = {
      requirements: "Automated social media scheduler and analytics bot",
      name: "Creator Studio",
      contact: "growth@creator.test"
    };

    // Lead configured with max 2 follow-ups
    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput, { founderApproved: true, maxFollowUps: 2 });

    // 1st follow-up
    orchestrator.processInboundFollowUp(lead.leadId, {
      action: "SEND_FOLLOWUP",
      founderApproved: true,
      providerEvidence: { provider: "whatsapp", messageId: "wa_001", delivered: true }
    });

    // 2nd follow-up
    const secondFollowUp = orchestrator.processInboundFollowUp(lead.leadId, {
      action: "SEND_FOLLOWUP",
      founderApproved: true,
      providerEvidence: { provider: "whatsapp", messageId: "wa_002", delivered: true }
    });
    assert.strictEqual(secondFollowUp.followUp.followUpCount, 2);

    // 3rd attempt exceeds max -> must halt and transition to EXHAUSTED
    const thirdAttempt = orchestrator.processInboundFollowUp(lead.leadId, {
      action: "SEND_FOLLOWUP",
      founderApproved: true,
      providerEvidence: { provider: "whatsapp", messageId: "wa_003", delivered: true }
    });

    assert.strictEqual(thirdAttempt.followUp.status, "EXHAUSTED", "Follow-up state must be EXHAUSTED");
    assert.strictEqual(thirdAttempt.followUp.stopReason, "MAX_FOLLOWUPS_EXCEEDED");
    assert.strictEqual(thirdAttempt.followUp.followUpCount, 2, "Follow-up count must remain capped at 2 (no spam)");
  });

  // ─────────────────────────────────────────────────────────────────
  // 9. Safety Invariant 9: Follow-Up Halts on FOUNDER_BLOCK
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 9: Follow-up halts on FOUNDER_BLOCK", async () => {
    const rawInput = {
      requirements: "Automated trading signal generator with Telegram alerts",
      name: "Trading Desk",
      contact: "desk@trading.test"
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput, { founderApproved: true });

    // Founder issues block command
    const blockedLead = orchestrator.processInboundFollowUp(lead.leadId, { action: "FOUNDER_BLOCK" });

    assert.strictEqual(blockedLead.followUp.status, "STOPPED", "Follow-up must stop on FOUNDER_BLOCK");
    assert.strictEqual(blockedLead.followUp.stopReason, "FOUNDER_BLOCK");
    assert.strictEqual(blockedLead.commercialStatus, "BLOCKED");

    // Any subsequent attempt returns stopped
    const retryAttempt = orchestrator.processInboundFollowUp(lead.leadId, {
      action: "SEND_FOLLOWUP",
      founderApproved: true,
      providerEvidence: { delivered: true }
    });
    assert.strictEqual(retryAttempt.followUp.status, "STOPPED");
  });

  // ─────────────────────────────────────────────────────────────────
  // 10. Safety Invariant 10: Duplicate Lead Intake is Idempotent
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 10: Duplicate lead intake is idempotent (no duplicate processing or duplicate mission)", async () => {
    const rawInput = {
      requirements: "Build an enterprise React dashboard with role-based access control and PostgreSQL schema",
      name: "Sovereign Enterprise",
      contact: "director@sovereign.test",
      budget: 85000
    };

    const lead1 = await orchestrator.executeInboundAcquisitionLoop(rawInput);
    const lead2 = await orchestrator.executeInboundAcquisitionLoop(rawInput);

    assert.strictEqual(lead1.leadId, lead2.leadId, "Identical lead submission must yield identical leadId");
    assert.strictEqual(lead1.missionId, lead2.missionId, "Identical lead submission must preserve missionId");
    assert.strictEqual(lead1.preparedResponse.proposalSha256, lead2.preparedResponse.proposalSha256, "Proposal hash must be identical");
  });

  // ─────────────────────────────────────────────────────────────────
  // 11. Safety Invariant 11: Client Acceptance Hands Off to Phase 5.6 Revenue Lifecycle
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 11: Client acceptance seamlessly hands off to Phase 5.6 revenue lifecycle (no duplicate mission)", async () => {
    const rawInput = {
      requirements: "Build production microservice with layered validator and automated unit test suite",
      name: "Tech Venture",
      contact: "cto@venture.test",
      budget: 70000
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput, { founderApproved: true });
    assert.strictEqual(lead.commercialStatus, MISSION_STATES.AWAITING_CLIENT);

    // Client accepts terms
    const activeProject = await orchestrator.convertLeadToActiveProject(lead.leadId, { clientAccepted: true });

    assert.strictEqual(activeProject.leadId, lead.leadId, "Project must inherit identical leadId");
    assert.strictEqual(activeProject.missionId, lead.missionId, "Project must inherit identical missionId");
    assert.strictEqual(activeProject.projectId, `proj_${lead.missionId}`, "Project ID must correspond to mission");
    assert(
      activeProject.commercialStatus === MISSION_STATES.PROJECT_ACTIVE ||
      activeProject.state === MISSION_STATES.PROJECT_ACTIVE ||
      activeProject.state === MISSION_STATES.DELIVERY_READY ||
      activeProject.state === MISSION_STATES.AWAITING_PAYMENT,
      "Project must be in active delivery or awaiting payment lifecycle state"
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // 12. Safety Invariant 12: Inbound Learning Promoted Through LearningPromoter
  // ─────────────────────────────────────────────────────────────────
  test("Safety Invariant 12: Inbound learning is validated and promoted through LearningPromoter (no direct memory writes)", async () => {
    const rawInput = {
      requirements: "Develop multi-tenant SaaS analytics reporting pipeline with CSV export",
      name: "Analytics Corp",
      contact: "product@analytics.test",
      budget: 55000
    };

    const lead = await orchestrator.executeInboundAcquisitionLoop(rawInput);

    assert(lead.memoryStatus, "Memory status must exist on canonical lead record");
    assert.strictEqual(lead.memoryStatus.promoted, true, "Learning must be evaluated and promoted");
    assert(lead.memoryStatus.itemId, "Item ID must be assigned by LearningPromoter");
    assert(
      lead.memoryStatus.confidence > 0 && lead.memoryStatus.confidence < 1.0,
      "Bayesian confidence must be computed genuinely between 0 and 1 (never hardcoded 1.0)"
    );
  });
});
