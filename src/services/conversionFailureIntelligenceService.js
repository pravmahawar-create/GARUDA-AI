/**
 * GARUDA Commercial Conversion Failure Intelligence & Diagnostic Engine
 * Identifies, classifies, and prescribes remediation actions for all blockers in the commercial loop:
 * DISCOVER → QUALIFY → OUTREACH → CONVERSATION → SCOPE → PROPOSAL → PAYMENT → EXECUTION → REVENUE
 */

const BLOCKER_REGISTRY = Object.freeze({
  NO_LEADS: {
    code: "NO_LEADS",
    stage: "DISCOVER",
    severity: "MEDIUM",
    reason: "No commercial opportunities discovered across active discovery feeds in the current cycle.",
    nextAction: "Trigger multi-source adapter scan across Remotive, RemoteOK, WWR, and GitHub Bounties."
  },
  LOW_LEAD_QUALITY: {
    code: "LOW_LEAD_QUALITY",
    stage: "QUALIFY",
    severity: "LOW",
    reason: "Discovered opportunities failed commercial scoring threshold or matched W2 employment criteria.",
    nextAction: "Review rejection taxonomy in Acquisition Command Center and refine search keyword filters."
  },
  NO_CONTACT_PATH: {
    code: "NO_CONTACT_PATH",
    stage: "OUTREACH",
    severity: "MEDIUM",
    reason: "Opportunity lacks a verifiable public contact channel or secure URL for outreach.",
    nextAction: "Filter out opportunities without secure actionable URLs or manual sourcing."
  },
  OUTBOUND_CREDENTIAL_MISSING: {
    code: "OUTBOUND_CREDENTIAL_MISSING",
    stage: "OUTREACH",
    severity: "HIGH",
    reason: "Outbound relay credentials (SMTP / Resend API) not configured in production environment.",
    nextAction: "Configure SMTP or Resend API credentials in environment variables for automated dispatch."
  },
  FOUNDER_APPROVAL_REQUIRED: {
    code: "FOUNDER_APPROVAL_REQUIRED",
    stage: "OUTREACH",
    severity: "LOW",
    reason: "Outreach draft prepared and awaiting Founder authorization via Telegram / Console.",
    nextAction: "Founder reviews prospect and approves via Telegram /approve_outreach <id>."
  },
  CLIENT_NOT_RESPONDED: {
    code: "CLIENT_NOT_RESPONDED",
    stage: "CONVERSATION",
    severity: "MEDIUM",
    reason: "Outreach communication dispatched; waiting for prospect inbound reply.",
    nextAction: "Allow 48-72 business hours for prospect response before queueing gentle follow-up."
  },
  SCOPE_INCOMPLETE: {
    code: "SCOPE_INCOMPLETE",
    stage: "SCOPE",
    severity: "MEDIUM",
    reason: "Prospect requirements require progressive architectural clarification.",
    nextAction: "Solution Architect engages prospect on /chat to define technical deliverables and timeline."
  },
  PROPOSAL_NOT_ACCEPTED: {
    code: "PROPOSAL_NOT_ACCEPTED",
    stage: "PROPOSAL",
    severity: "HIGH",
    reason: "Formal proposal portal generated but client has not digitally signed milestone terms.",
    nextAction: "Send milestone guarantee brief explaining QA test suite and SHA-256 manifest to prospect."
  },
  PAYMENT_PENDING: {
    code: "PAYMENT_PENDING",
    stage: "PAYMENT",
    severity: "CRITICAL",
    reason: "Proposal accepted by client, but 50% advance kickoff deposit has not been settled via Razorpay.",
    nextAction: "Ensure client has direct Razorpay checkout link and clarify payment methods (Card, NetBanking, UPI)."
  },
  PAYMENT_UNVERIFIED: {
    code: "PAYMENT_UNVERIFIED",
    stage: "PAYMENT",
    severity: "CRITICAL",
    reason: "Payment claim or screenshot submitted without cryptographically verified Razorpay webhook evidence.",
    nextAction: "Maintain Payment Truth Law; prompt client to complete checkout via official gateway."
  },
  PAYMENT_MISMATCH: {
    code: "PAYMENT_MISMATCH",
    stage: "PAYMENT",
    severity: "HIGH",
    reason: "Received payment amount does not match required 50% deposit for proposal scope.",
    nextAction: "Audit transaction ID against proposal balance and request delta settlement if required."
  },
  WORK_AUTHORIZATION_BLOCKED: {
    code: "WORK_AUTHORIZATION_BLOCKED",
    stage: "AUTHORIZATION",
    severity: "HIGH",
    reason: "Project value exceeds ₹25,000 low-risk threshold and requires manual Founder authorization.",
    nextAction: "Founder reviews scope in Console and confirms mission authorization via /approve <id>."
  },
  EXECUTION_FAILURE: {
    code: "EXECUTION_FAILURE",
    stage: "EXECUTION",
    severity: "CRITICAL",
    reason: "Governed worker encountered unrecoverable runtime exception during Phase 1-8 execution.",
    nextAction: "Inspect worker logs, fix failing test cases, and restart governed mission build."
  },
  DELIVERY_PENDING: {
    code: "DELIVERY_PENDING",
    stage: "DELIVERY",
    severity: "MEDIUM",
    reason: "Code changes complete; awaiting automated QA test suite verification and release manifest generation.",
    nextAction: "Run full regression pass and generate signed cryptographic SHA-256 delivery manifest."
  },
  CLIENT_ACCEPTANCE_PENDING: {
    code: "CLIENT_ACCEPTANCE_PENDING",
    stage: "DELIVERY",
    severity: "HIGH",
    reason: "Deliverables submitted to client portal; awaiting final client sign-off and 50% settlement.",
    nextAction: "Provide interactive preview and invite client to inspect QA test suite results."
  }
});

class ConversionFailureIntelligenceService {
  /**
   * Diagnoses a prospect or funnel state and returns structured failure intelligence.
   */
  diagnoseBlocker(blockerCode, customContext = {}) {
    const template = BLOCKER_REGISTRY[blockerCode] || {
      code: "UNKNOWN_BLOCKER",
      stage: "UNKNOWN",
      severity: "MEDIUM",
      reason: "Unspecified operational delay.",
      nextAction: "Inspect system telemetry."
    };

    return {
      status: "BLOCKED",
      code: template.code,
      stage: template.stage,
      severity: template.severity,
      reason: customContext.reason || template.reason,
      nextAction: customContext.nextAction || template.nextAction,
      diagnosedAt: new Date().toISOString()
    };
  }

  /**
   * Returns complete catalog of commercial blocker definitions.
   */
  getAllBlockerDefinitions() {
    return Object.values(BLOCKER_REGISTRY);
  }
}

module.exports = new ConversionFailureIntelligenceService();
