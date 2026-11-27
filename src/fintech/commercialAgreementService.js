/**
 * 🦅 GARUDA OS — COMMERCIAL AGREEMENT & 2% COMMISSION GOVERNANCE SERVICE
 * Enforces signed contractual configuration, 2.00% (200 bps) default rate lock,
 * founder-only approval for any rate changes, and cross-tenant isolation.
 *
 * Non-Negotiable Invariant:
 * - Default rate = 2.00% (200 bps). Never silently substitutes legacy 1%, 0.65%, or 0.15%.
 * - Commercial billing is strictly blocked without an APPROVED_ACTIVE signed agreement.
 */

const crypto = require("crypto");
const { defaultAuditLogger } = require("./auditLogger");

const DEFAULT_COMMISSION_RATE = 0.02; // 2.00%
const DEFAULT_COMMISSION_BPS = 200;

const AGREEMENT_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  APPROVED_ACTIVE: "APPROVED_ACTIVE",
  SUSPENDED: "SUSPENDED",
  TERMINATED: "TERMINATED"
});

const BILLING_MODES = Object.freeze({
  PREPAID: "PREPAID",
  POSTPAID: "POSTPAID"
});

const MANDATORY_AGREEMENT_FIELDS = Object.freeze([
  "eligibleTransactionDefinition",
  "dailyReportingDeadline",
  "paymentDeadlineDays",
  "refundAdjustmentMethod",
  "taxTreatment",
  "auditAndReconciliationRights",
  "invoiceDisputeProcedure",
  "terminationReceivablesClause",
  "dataRetentionYears",
  "governingJurisdiction",
  "disputeResolutionMechanism"
]);

class CommercialAgreementError extends Error {
  constructor(message, errorCode, httpStatus = 400) {
    super(`[COMMERCIAL_AGREEMENT_ERROR] ${message} (${errorCode})`);
    this.name = "CommercialAgreementError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

class CommercialAgreementService {
  constructor(options = {}) {
    this.agreements = new Map(); // contractId -> agreement
    this.merchantActiveIndex = new Map(); // `${tenantId}::${merchantId}` -> contractId
    this.repository = options.repository || null;
    if (this.repository && typeof this.repository.registerStateStore === "function") {
      this.repository.registerStateStore("agreements", this);
    }
  }

  exportSnapshot() {
    return {
      agreements: Array.from(this.agreements.entries()),
      merchantActiveIndex: Array.from(this.merchantActiveIndex.entries())
    };
  }

  hydrateSnapshot(snap) {
    if (!snap) return;
    this.agreements = new Map(snap.agreements || []);
    this.merchantActiveIndex = new Map(snap.merchantActiveIndex || []);
  }

  _scopeKey(tenantId, merchantId) {
    if (!tenantId || !merchantId) {
      throw new CommercialAgreementError("tenantId and merchantId are required", "MISSING_TENANT_OR_MERCHANT", 400);
    }
    return `${String(tenantId)}::${String(merchantId)}`;
  }

  /**
   * Registers a new commercial agreement draft with default 2.00% (200 bps) fee basis.
   * Rejects any non-2% custom rate at creation unless explicit founderApproval is supplied.
   */
  createAgreement({
    tenantId,
    merchantId,
    merchantLegalName,
    contractVersion = "v1.0",
    billingMode = BILLING_MODES.PREPAID,
    commissionRate = DEFAULT_COMMISSION_RATE,
    taxRate = 0.18,
    sacCode = "998313",
    terms = {},
    founderApproval = null,
    actor = "SYSTEM"
  }) {
    const scopeKey = this._scopeKey(tenantId, merchantId);
    const normalizedMode = String(billingMode || "").toUpperCase();
    if (!BILLING_MODES[normalizedMode]) {
      throw new CommercialAgreementError(`Unsupported billingMode "${billingMode}". Must be PREPAID or POSTPAID.`, "INVALID_BILLING_MODE", 400);
    }

    const numericRate = Number(commissionRate);
    if (!Number.isFinite(numericRate) || numericRate <= 0 || numericRate > 1) {
      throw new CommercialAgreementError("commissionRate must be between 0 (exclusive) and 1", "INVALID_COMMISSION_RATE", 400);
    }
    const rateBps = Math.round(numericRate * 10000);

    // Non-default rates require explicit Founder Praveen approval
    if (rateBps !== DEFAULT_COMMISSION_BPS) {
      if (!founderApproval || founderApproval.isFounderApproved !== true) {
        defaultAuditLogger.logEvent({
          transactionId: `ctr_${tenantId}_${merchantId}`,
          actor,
          action: "UNAUTHORIZED_NON_STANDARD_RATE_ATTEMPT",
          oldState: "NONE",
          newState: "REJECTED",
          payload: { tenantId, merchantId, requestedRateBps: rateBps, defaultBps: DEFAULT_COMMISSION_BPS }
        });
        throw new CommercialAgreementError(
          `Custom rate (${rateBps} bps) deviates from standard 200 bps (2.00%) and requires explicit Founder approval`,
          "UNAUTHORIZED_COMMISSION_RATE_CHANGE",
          403
        );
      }
    }

    const resolvedTerms = {
      eligibleTransactionDefinition:
        terms.eligibleTransactionDefinition ||
        "Bank-verified, cryptographically reconciled, successfully SETTLED principal inflows to merchant corporate account.",
      dailyReportingDeadline: terms.dailyReportingDeadline || "23:59 IST EOD",
      paymentDeadlineDays: Number.isFinite(Number(terms.paymentDeadlineDays)) ? Number(terms.paymentDeadlineDays) : 1,
      refundAdjustmentMethod:
        terms.refundAdjustmentMethod ||
        "Credit note / subsequent daily settlement fee offset against verified bank return/reversal UTR.",
      taxTreatment: terms.taxTreatment || "B2B SaaS Orchestration Service (18% IGST/CGST+SGST extra as applicable)",
      auditAndReconciliationRights:
        terms.auditAndReconciliationRights ||
        "Daily signed statement + append-only SHA-256 cryptographic telemetry inspection rights.",
      invoiceDisputeProcedure:
        terms.invoiceDisputeProcedure ||
        "Written itemization within 48 hours of invoice issuance; undisputed portion remains payable on schedule.",
      terminationReceivablesClause:
        terms.terminationReceivablesClause ||
        "All accrued unpaid software orchestration fees survive termination and remain payable via corporate wire.",
      dataRetentionYears: Number(terms.dataRetentionYears) || 8,
      governingJurisdiction: terms.governingJurisdiction || "Raipur, Chhattisgarh, India",
      disputeResolutionMechanism:
        terms.disputeResolutionMechanism || "Arbitration under Arbitration & Conciliation Act, 1996 (Seat: Raipur)"
    };

    for (const field of MANDATORY_AGREEMENT_FIELDS) {
      if (resolvedTerms[field] === undefined || resolvedTerms[field] === null || resolvedTerms[field] === "") {
        throw new CommercialAgreementError(`Missing mandatory agreement clause: ${field}`, "INCOMPLETE_COMMERCIAL_AGREEMENT", 400);
      }
    }

    const contractId = `ctr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date().toISOString();

    const agreement = {
      contractId,
      tenantId: String(tenantId),
      merchantId: String(merchantId),
      merchantLegalName: merchantLegalName || merchantId,
      contractVersion,
      billingMode: normalizedMode,
      commissionRate: numericRate,
      commissionBps: rateBps,
      taxRate: Number(taxRate),
      sacCode,
      terms: resolvedTerms,
      status: AGREEMENT_STATUS.DRAFT,
      founderApproved: false,
      founderApprovedBy: null,
      founderApprovedAt: null,
      signedAt: null,
      rateHistory: [
        {
          version: contractVersion,
          commissionRate: numericRate,
          commissionBps: rateBps,
          approvedBy: rateBps === DEFAULT_COMMISSION_BPS ? "FOUNDER_DEFAULT_POLICY" : (founderApproval?.approvedBy || "FOUNDER"),
          changedAt: now,
          reason: "INITIAL_CONTRACT_DRAFT"
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.agreements.set(contractId, agreement);
    if (this.repository && typeof this.repository.saveState === "function") {
      this.repository.saveState();
    }

    defaultAuditLogger.logEvent({
      transactionId: contractId,
      actor,
      action: "COMMERCIAL_AGREEMENT_DRAFT_CREATED",
      oldState: "NONE",
      newState: AGREEMENT_STATUS.DRAFT,
      payload: { tenantId, merchantId, billingMode: normalizedMode, rateBps, contractVersion }
    });

    if (founderApproval && founderApproval.isFounderApproved === true && founderApproval.activateImmediately) {
      return this.approveAgreement(contractId, {
        tenantId,
        founderApproved: true,
        approvedBy: founderApproval.approvedBy || "founder_praveen",
        signedRef: founderApproval.signedRef || `SIGN-${contractId}`
      });
    }

    void scopeKey;
    return agreement;
  }

  /**
   * Activates a commercial agreement strictly under Founder + signed merchant contract evidence.
   */
  approveAgreement(contractId, { tenantId, founderApproved = false, approvedBy = null, signedRef = null } = {}) {
    const agreement = this.agreements.get(contractId);
    if (!agreement) {
      throw new CommercialAgreementError(`Commercial agreement not found: ${contractId}`, "AGREEMENT_NOT_FOUND", 404);
    }
    if (tenantId && agreement.tenantId !== String(tenantId)) {
      throw new CommercialAgreementError("Cross-tenant agreement access denied", "TENANT_ISOLATION_VIOLATION", 403);
    }
    if (founderApproved !== true) {
      throw new CommercialAgreementError(
        "Founder approval is mandatory before activating commercial billing",
        "FOUNDER_APPROVAL_REQUIRED",
        403
      );
    }
    if (!signedRef) {
      throw new CommercialAgreementError(
        "Signed commercial agreement reference is required for activation",
        "MISSING_SIGNED_CONTRACT_REF",
        400
      );
    }

    const now = new Date().toISOString();
    const prevStatus = agreement.status;
    agreement.status = AGREEMENT_STATUS.APPROVED_ACTIVE;
    agreement.founderApproved = true;
    agreement.founderApprovedBy = approvedBy || "founder_praveen";
    agreement.founderApprovedAt = now;
    agreement.signedAt = now;
    agreement.signedRef = signedRef;
    agreement.updatedAt = now;

    this.merchantActiveIndex.set(this._scopeKey(agreement.tenantId, agreement.merchantId), contractId);
    if (this.repository && typeof this.repository.saveState === "function") {
      this.repository.saveState();
    }

    defaultAuditLogger.logEvent({
      transactionId: contractId,
      actor: agreement.founderApprovedBy,
      action: "COMMERCIAL_AGREEMENT_APPROVED",
      oldState: prevStatus,
      newState: AGREEMENT_STATUS.APPROVED_ACTIVE,
      payload: {
        tenantId: agreement.tenantId,
        merchantId: agreement.merchantId,
        billingMode: agreement.billingMode,
        commissionBps: agreement.commissionBps,
        contractVersion: agreement.contractVersion,
        signedRef
      }
    });

    return agreement;
  }

  /**
   * Modifies the contractual commission rate ONLY with explicit Founder authorization.
   */
  updateCommissionRate(contractId, { tenantId, newRate, newVersion, reason = "FOUNDER_RATE_AMENDMENT", founderContext = {} } = {}) {
    const agreement = this.agreements.get(contractId);
    if (!agreement) {
      throw new CommercialAgreementError(`Commercial agreement not found: ${contractId}`, "AGREEMENT_NOT_FOUND", 404);
    }
    if (tenantId && agreement.tenantId !== String(tenantId)) {
      throw new CommercialAgreementError("Cross-tenant agreement access denied", "TENANT_ISOLATION_VIOLATION", 403);
    }

    const isFounder =
      founderContext.role === "platform_founder" && founderContext.isFounderApproved === true;

    if (!isFounder) {
      defaultAuditLogger.logEvent({
        transactionId: contractId,
        actor: founderContext.actorId || "UNAUTHORIZED_ACTOR",
        action: "UNAUTHORIZED_COMMISSION_RATE_MODIFICATION_BLOCKED",
        oldState: agreement.status,
        newState: agreement.status,
        payload: {
          tenantId: agreement.tenantId,
          merchantId: agreement.merchantId,
          attemptedRate: newRate,
          actorRole: founderContext.role || "unknown"
        }
      });
      throw new CommercialAgreementError(
        "Only verified Platform Founder approval can modify contractual commission rates",
        "UNAUTHORIZED_COMMISSION_RATE_CHANGE",
        403
      );
    }

    const numericRate = Number(newRate);
    if (!Number.isFinite(numericRate) || numericRate <= 0 || numericRate > 1) {
      throw new CommercialAgreementError("Invalid new commission rate", "INVALID_COMMISSION_RATE", 400);
    }

    const newBps = Math.round(numericRate * 10000);
    const oldRate = agreement.commissionRate;
    const oldVersion = agreement.contractVersion;
    const now = new Date().toISOString();

    agreement.commissionRate = numericRate;
    agreement.commissionBps = newBps;
    agreement.contractVersion = newVersion || `${oldVersion}-r${agreement.rateHistory.length + 1}`;
    agreement.updatedAt = now;
    agreement.rateHistory.push({
      version: agreement.contractVersion,
      previousRate: oldRate,
      commissionRate: numericRate,
      commissionBps: newBps,
      approvedBy: founderContext.actorId || "founder",
      changedAt: now,
      reason
    });
    if (this.repository && typeof this.repository.saveState === "function") {
      this.repository.saveState();
    }

    defaultAuditLogger.logEvent({
      transactionId: contractId,
      actor: founderContext.actorId || "founder",
      action: "COMMISSION_RATE_UPDATED_BY_FOUNDER",
      oldState: `${oldRate}@${oldVersion}`,
      newState: `${numericRate}@${agreement.contractVersion}`,
      payload: {
        tenantId: agreement.tenantId,
        merchantId: agreement.merchantId,
        oldBps: Math.round(oldRate * 10000),
        newBps,
        newVersion: agreement.contractVersion,
        reason
      }
    });

    return agreement;
  }

  /**
   * Returns active approved agreement for a tenant + merchant, or null if absent.
   */
  getActiveAgreement(tenantId, merchantId) {
    const scopeKey = this._scopeKey(tenantId, merchantId);
    const contractId = this.merchantActiveIndex.get(scopeKey);
    if (!contractId) return null;
    const agreement = this.agreements.get(contractId);
    if (!agreement || agreement.status !== AGREEMENT_STATUS.APPROVED_ACTIVE) return null;
    if (agreement.tenantId !== String(tenantId)) return null;
    return agreement;
  }

  /**
   * Hard gate enforcing "Do not activate commercial billing without an approved agreement".
   */
  requireActiveAgreement(tenantId, merchantId) {
    const active = this.getActiveAgreement(tenantId, merchantId);
    if (!active) {
      throw new CommercialAgreementError(
        `No APPROVED_ACTIVE commercial agreement found for merchant "${merchantId}" in tenant "${tenantId}"`,
        "COMMERCIAL_AGREEMENT_REQUIRED",
        403
      );
    }
    return active;
  }

  getAgreementById(contractId, tenantId = null) {
    const agreement = this.agreements.get(contractId) || null;
    if (!agreement) return null;
    if (tenantId && agreement.tenantId !== String(tenantId)) {
      throw new CommercialAgreementError("Cross-tenant agreement access denied", "TENANT_ISOLATION_VIOLATION", 403);
    }
    return agreement;
  }
}

const defaultCommercialAgreementService = new CommercialAgreementService();

module.exports = {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_COMMISSION_BPS,
  AGREEMENT_STATUS,
  BILLING_MODES,
  MANDATORY_AGREEMENT_FIELDS,
  CommercialAgreementError,
  CommercialAgreementService,
  defaultCommercialAgreementService
};
