/**
 * 🦅 GARUDA OS — MERCHANT LEGAL ELIGIBILITY & CONFIGURABLE TAX SERVICE (PHASE 11)
 *
 * Statutory Compliance Invariant:
 * - Enforces Promotion and Regulation of Online Gaming Act, 2025 (Rules effective 1 May 2026):
 *   Prohibited ONLINE_MONEY_GAME (real-money stake/winnings regardless of skill vs chance)
 *   FAIL-CLOSED across campaign, acquisition, and payment activation APIs.
 * - Permitted gaming verticals strictly limited to verified SOCIAL_GAME (no monetary stakes/winnings),
 *   RECOGNIZED_ESPORTS (statutory sports framework without wagers), or standard B2B_COMMERCE.
 * - Unknown / UNVERIFIED merchants remain BLOCKED pending legal/counsel review.
 * - Tax rules use effective dates and explicit CA approval flags (no hardcoded legacy sections).
 */

const GAME_CATEGORIES = Object.freeze({
  SOCIAL_GAME: "SOCIAL_GAME",
  RECOGNIZED_ESPORTS: "RECOGNIZED_ESPORTS",
  B2B_COMMERCE: "B2B_COMMERCE",
  ONLINE_MONEY_GAME: "ONLINE_MONEY_GAME",
  UNVERIFIED: "UNVERIFIED"
});

const ELIGIBILITY_DECISIONS = Object.freeze({
  ELIGIBLE: "ELIGIBLE",
  BLOCKED_PROHIBITED_RMG: "BLOCKED_PROHIBITED_RMG",
  BLOCKED_PENDING_REVIEW: "BLOCKED_PENDING_REVIEW",
  BLOCKED_EXPIRED: "BLOCKED_EXPIRED"
});

class LegalEligibilityError extends Error {
  constructor(message, errorCode = "LEGAL_ELIGIBILITY_BLOCKED", httpStatus = 403) {
    super(`[LEGAL_ELIGIBILITY] ${message} (${errorCode})`);
    this.name = "LegalEligibilityError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

class MerchantEligibilityService {
  constructor() {
    this.declarations = new Map(); // `${tenantId}::${merchantId}` -> record
    this.taxConfigs = new Map(); // `${tenantId}::${configId}` -> tax rule

    // Default effective-dated baseline tax config (pending merchant CA sign-off for production)
    this.defaultTaxRule = {
      configId: "TAX-IN-STD-2026-04",
      jurisdiction: "IN",
      effectiveFrom: "2026-04-01",
      gstRatePercent: 18,
      sacCode: "998313",
      tdsApplicable: true,
      statutoryCodeLabel: "Income Tax Act, 2025 — Section 393 (Configured Table Code)",
      caApproved: false,
      notes: "Effective 1 April 2026 framework. Requires CA-verified confirmation before production invoicing."
    };
  }

  _requireTenant(tenantId) {
    const clean = String(tenantId || "").trim();
    if (!clean) throw new LegalEligibilityError("Tenant identity is required", "TENANT_REQUIRED", 401);
    return clean;
  }

  _scopeKey(tenantId, merchantId) {
    return `${this._requireTenant(tenantId)}::${String(merchantId || "").trim()}`;
  }

  declareMerchantProfile({
    tenantId,
    merchantId,
    legalName,
    category = GAME_CATEGORIES.UNVERIFIED,
    involvesMoneyStakeOrWinnings = false,
    esportsRegistrationRef = null,
    socialGameDeclarationNote = "",
    expiresAt = null,
    actorId = "TENANT_OPERATOR"
  }) {
    const cleanTenant = this._requireTenant(tenantId);
    const cleanMerchant = String(merchantId || "").trim();
    if (!cleanMerchant || !legalName) {
      throw new LegalEligibilityError("merchantId and legalName are required", "INVALID_MERCHANT_DECLARATION", 400);
    }

    const normalizedCat = String(category || GAME_CATEGORIES.UNVERIFIED).toUpperCase();
    if (!Object.values(GAME_CATEGORIES).includes(normalizedCat)) {
      throw new LegalEligibilityError(`Unsupported category "${category}"`, "INVALID_GAME_CATEGORY", 400);
    }

    const isProhibitedMoneyGame =
      normalizedCat === GAME_CATEGORIES.ONLINE_MONEY_GAME || Boolean(involvesMoneyStakeOrWinnings);

    const record = {
      tenantId: cleanTenant,
      merchantId: cleanMerchant,
      legalName: String(legalName).trim(),
      category: isProhibitedMoneyGame ? GAME_CATEGORIES.ONLINE_MONEY_GAME : normalizedCat,
      involvesMoneyStakeOrWinnings: Boolean(involvesMoneyStakeOrWinnings),
      esportsRegistrationRef: esportsRegistrationRef ? String(esportsRegistrationRef).trim() : null,
      socialGameDeclarationNote: String(socialGameDeclarationNote || "").trim(),
      counselReviewed: false,
      founderApproved: false,
      decision: isProhibitedMoneyGame
        ? ELIGIBILITY_DECISIONS.BLOCKED_PROHIBITED_RMG
        : ELIGIBILITY_DECISIONS.BLOCKED_PENDING_REVIEW,
      blockedReason: isProhibitedMoneyGame
        ? "Blocked under Promotion and Regulation of Online Gaming Act, 2025 (operational May 2026): online money games with stakes or cash winnings are strictly prohibited across ads and payments."
        : "Awaiting legal counsel verification and Founder approval prior to activation.",
      expiresAt: expiresAt || new Date(Date.now() + 90 * 86400000).toISOString(),
      policyHistory: [
        {
          timestamp: new Date().toISOString(),
          actor: actorId,
          action: "MERCHANT_ELIGIBILITY_DECLARED",
          decision: isProhibitedMoneyGame
            ? ELIGIBILITY_DECISIONS.BLOCKED_PROHIBITED_RMG
            : ELIGIBILITY_DECISIONS.BLOCKED_PENDING_REVIEW
        }
      ],
      updatedAt: new Date().toISOString()
    };

    this.declarations.set(this._scopeKey(cleanTenant, cleanMerchant), record);
    return record;
  }

  reviewAndApprove({
    tenantId,
    merchantId,
    counselApproved = false,
    counselReference = "",
    founderContext = {},
    expiresAt = null
  }) {
    const cleanTenant = this._requireTenant(tenantId);
    const key = this._scopeKey(cleanTenant, merchantId);
    const existing = this.declarations.get(key);
    if (!existing) {
      throw new LegalEligibilityError(`No eligibility declaration for merchant "${merchantId}"`, "DECLARATION_NOT_FOUND", 404);
    }

    if (!founderContext || founderContext.role !== "platform_founder" || founderContext.isFounderApproved !== true) {
      throw new LegalEligibilityError(
        "Legal eligibility approval strictly requires Platform Founder authorization",
        "FOUNDER_APPROVAL_REQUIRED",
        403
      );
    }

    if (existing.category === GAME_CATEGORIES.ONLINE_MONEY_GAME || existing.involvesMoneyStakeOrWinnings) {
      existing.decision = ELIGIBILITY_DECISIONS.BLOCKED_PROHIBITED_RMG;
      existing.counselReviewed = true;
      existing.founderApproved = false;
      existing.policyHistory.push({
        timestamp: new Date().toISOString(),
        actor: founderContext.actorId || "founder_praveen",
        action: "RMG_APPROVAL_REJECTED",
        decision: ELIGIBILITY_DECISIONS.BLOCKED_PROHIBITED_RMG
      });
      throw new LegalEligibilityError(
        "Cannot approve ONLINE_MONEY_GAME or stake/winnings activity under Indian law.",
        "PROHIBITED_ONLINE_MONEY_GAME",
        403
      );
    }

    if (!counselApproved || !counselReference) {
      throw new LegalEligibilityError(
        "Written legal counsel review reference is mandatory before approving gaming/marketing eligibility",
        "COUNSEL_REVIEW_REQUIRED",
        400
      );
    }

    if (existing.category === GAME_CATEGORIES.RECOGNIZED_ESPORTS && !existing.esportsRegistrationRef) {
      throw new LegalEligibilityError(
        "RECOGNIZED_ESPORTS requires valid statutory recognition/registration reference",
        "ESPORTS_REGISTRATION_REQUIRED",
        400
      );
    }

    if (existing.category === GAME_CATEGORIES.UNVERIFIED) {
      throw new LegalEligibilityError(
        "Cannot approve UNVERIFIED category",
        "UNVERIFIED_CATEGORY",
        400
      );
    }

    existing.counselReviewed = true;
    existing.counselReference = String(counselReference).trim();
    existing.founderApproved = true;
    existing.decision = ELIGIBILITY_DECISIONS.ELIGIBLE;
    existing.blockedReason = null;
    if (expiresAt) existing.expiresAt = expiresAt;
    existing.updatedAt = new Date().toISOString();
    existing.policyHistory.push({
      timestamp: existing.updatedAt,
      actor: founderContext.actorId || "founder_praveen",
      action: "ELIGIBILITY_APPROVED",
      counselReference: existing.counselReference,
      decision: ELIGIBILITY_DECISIONS.ELIGIBLE
    });
    return existing;
  }

  evaluateEligibility(tenantId, merchantId, now = new Date()) {
    const cleanTenant = this._requireTenant(tenantId);
    const record = this.declarations.get(this._scopeKey(cleanTenant, merchantId));
    if (!record) {
      return {
        eligible: false,
        decision: ELIGIBILITY_DECISIONS.BLOCKED_PENDING_REVIEW,
        errorCode: "ELIGIBILITY_UNDECLARED",
        reason: `Merchant "${merchantId}" has no verified legal eligibility declaration.`
      };
    }

    if (record.category === GAME_CATEGORIES.ONLINE_MONEY_GAME || record.involvesMoneyStakeOrWinnings) {
      return {
        eligible: false,
        decision: ELIGIBILITY_DECISIONS.BLOCKED_PROHIBITED_RMG,
        errorCode: "PROHIBITED_ONLINE_MONEY_GAME",
        reason: record.blockedReason
      };
    }

    if (!record.counselReviewed || !record.founderApproved || record.decision !== ELIGIBILITY_DECISIONS.ELIGIBLE) {
      return {
        eligible: false,
        decision: ELIGIBILITY_DECISIONS.BLOCKED_PENDING_REVIEW,
        errorCode: "LEGAL_REVIEW_PENDING",
        reason: record.blockedReason || "Merchant eligibility pending legal counsel & founder review."
      };
    }

    if (record.expiresAt && new Date(record.expiresAt).getTime() < now.getTime()) {
      return {
        eligible: false,
        decision: ELIGIBILITY_DECISIONS.BLOCKED_EXPIRED,
        errorCode: "ELIGIBILITY_EXPIRED",
        reason: "Legal eligibility approval has expired; fresh review required."
      };
    }

    return { eligible: true, decision: ELIGIBILITY_DECISIONS.ELIGIBLE, record };
  }

  assertEligible(tenantId, merchantId, operationName = "OPERATION") {
    const check = this.evaluateEligibility(tenantId, merchantId);
    if (!check.eligible) {
      throw new LegalEligibilityError(
        `${operationName} blocked for merchant "${merchantId}": ${check.reason}`,
        check.errorCode,
        403
      );
    }
    return check.record;
  }

  listDeclarations(tenantId) {
    const cleanTenant = this._requireTenant(tenantId);
    return Array.from(this.declarations.values())
      .filter((r) => r.tenantId === cleanTenant)
      .map((r) => ({ ...r, evaluation: this.evaluateEligibility(cleanTenant, r.merchantId) }));
  }

  setTaxConfig({ tenantId, jurisdiction = "IN", effectiveFrom, gstRatePercent, sacCode, statutoryCodeLabel, caApproved = false, caFirmRef = "", founderContext = {} }) {
    const cleanTenant = this._requireTenant(tenantId);
    if (caApproved && (!founderContext || founderContext.role !== "platform_founder" || founderContext.isFounderApproved !== true)) {
      throw new LegalEligibilityError("CA-approved production tax rules require Founder authorization", "FOUNDER_APPROVAL_REQUIRED", 403);
    }
    if (!effectiveFrom || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
      throw new LegalEligibilityError("Valid effectiveFrom YYYY-MM-DD date is required", "INVALID_TAX_DATE", 400);
    }
    const cfg = {
      configId: `TAX-${jurisdiction}-${effectiveFrom}`,
      tenantId: cleanTenant,
      jurisdiction,
      effectiveFrom,
      gstRatePercent: Number(gstRatePercent ?? 18),
      sacCode: String(sacCode || "998313"),
      statutoryCodeLabel: String(statutoryCodeLabel || "Income Tax Act, 2025 — Section 393 (Configured Rule)"),
      caApproved: Boolean(caApproved),
      caFirmRef: String(caFirmRef || "").trim(),
      updatedAt: new Date().toISOString()
    };
    this.taxConfigs.set(`${cleanTenant}::${cfg.configId}`, cfg);
    return cfg;
  }

  getActiveTaxConfig(tenantId, asOfDate = new Date().toISOString().slice(0, 10)) {
    const cleanTenant = this._requireTenant(tenantId);
    const matching = Array.from(this.taxConfigs.values())
      .filter((c) => c.tenantId === cleanTenant && c.effectiveFrom <= asOfDate)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    return matching[0] || { ...this.defaultTaxRule, tenantId: cleanTenant };
  }
}

const defaultMerchantEligibilityService = new MerchantEligibilityService();

module.exports = {
  GAME_CATEGORIES,
  ELIGIBILITY_DECISIONS,
  LegalEligibilityError,
  MerchantEligibilityService,
  defaultMerchantEligibilityService
};
