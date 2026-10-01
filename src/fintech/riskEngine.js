/**
 * 🦅 GARUDA OS — MULTI-FACTOR TRANSACTION RISK ENGINE
 * Evaluates Pre-Payment Telemetry, Velocity & Sanctions Indicators
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 11 & 16
 */

const RISK_LEVELS = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED_BY_PROVIDER: "BLOCKED_BY_PROVIDER"
});

// FATF High-Risk / Monitored Jurisdictions
const HIGH_RISK_JURISDICTIONS = new Set(["KP", "IR", "MM", "SY"]);

class TransactionRiskEngine {
  /**
   * Evaluates transaction risk
   * @param {object} params
   * @returns {{ riskLevel: string, score: number, flags: string[], allowed: boolean }}
   */
  evaluateRisk({
    amount,
    currency,
    originCountry,
    destinationCountry,
    merchantProfile = {},
    providerStatus,
    beneficiaryChanged = false,
    velocityCountLastHour = 0
  }) {
    const flags = [];
    let score = 10; // Baseline low risk score

    // 1. HARD RULE: If provider has blocked the transaction, GARUDA never overrides
    if (providerStatus === "BLOCKED" || providerStatus === "SANCTIONED") {
      return {
        riskLevel: RISK_LEVELS.BLOCKED_BY_PROVIDER,
        score: 100,
        flags: ["BLOCKED_BY_REGULATED_BANK_OR_PSP"],
        allowed: false,
        requiresManualReview: true
      };
    }

    // 2. Jurisdiction Risk
    const origin = String(originCountry || "").toUpperCase();
    if (HIGH_RISK_JURISDICTIONS.has(origin)) {
      flags.push("SANCTIONED_OR_HIGH_RISK_ORIGIN");
      score += 70;
    }

    // 3. Beneficiary Integrity
    if (beneficiaryChanged) {
      flags.push("BENEFICIARY_ACCOUNT_CHANGED_RECENTLY");
      score += 35;
    }

    // 4. Velocity Checks (e.g. rapid-fire payments)
    if (velocityCountLastHour > 10) {
      flags.push("HIGH_VELOCITY_BURST_DETECTED");
      score += 25;
    }

    // 5. Large Value Anomaly
    const numAmount = Number(amount);
    const avgTicket = Number(merchantProfile.averageTicketSize || 50000);
    if (numAmount > avgTicket * 5) {
      flags.push("TICKET_SIZE_DEVIATION_5X_ABOVE_AVERAGE");
      score += 20;
    }

    // Cap score at 100
    score = Math.min(score, 100);

    let riskLevel = RISK_LEVELS.LOW;
    let allowed = true;
    let requiresManualReview = false;

    if (score >= 80) {
      riskLevel = RISK_LEVELS.REVIEW_REQUIRED;
      allowed = false;
      requiresManualReview = true;
    } else if (score >= 50) {
      riskLevel = RISK_LEVELS.HIGH;
      allowed = true;
      requiresManualReview = true;
    } else if (score >= 25) {
      riskLevel = RISK_LEVELS.MEDIUM;
      allowed = true;
    }

    return {
      riskLevel,
      score,
      flags,
      allowed,
      requiresManualReview
    };
  }
}

const defaultRiskEngine = new TransactionRiskEngine();

module.exports = {
  RISK_LEVELS,
  TransactionRiskEngine,
  defaultRiskEngine
};
