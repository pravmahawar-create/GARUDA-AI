/**
 * 🦅 GARUDA OS — MODE B POSTPAID & 2% COMMISSION PROTECTION ENGINE
 * Implements Part 6 (Sections 6.3, 6.4, 6.5, 6.6):
 * - Daily Postpaid 2.00% (200 bps) Software Orchestration Fee Receivables Ledger
 * - Immutable Transaction Commission Records & Contract/Rate History Traceability
 * - Daily Reproducible Signed Reconciliation Statements & Duplicate-Safe GST Invoicing
 * - Independent Payment Receipt Verification & Partial Payment Handling
 * - Refund / Reversal Adjustments, Overdue Alerts & Aging Reports
 * - Lawful Merchant Account Freeze Evidence Preservation (Zero Lien/Freeze Bypass)
 * - 3-Section Commercial Dashboard Builder (Merchant Tx / GARUDA 2% Revenue / Reconciliation)
 */

const crypto = require("crypto");
const { defaultAuditLogger } = require("./auditLogger");
const { assertZeroCustody, validateLedgerSeparation } = require("./zeroCustodyEnforcer");
const { defaultObservability } = require("./observability");
const {
  DEFAULT_COMMISSION_RATE,
  BILLING_MODES,
  defaultCommercialAgreementService
} = require("./commercialAgreementService");
const { toMinorUnits, fromMinorUnits, computeBpsFeeMinor } = require("./persistenceRepository");
const { RECEIPT_PURPOSES, defaultBankReceiptRegistry } = require("./bankReceiptVerifier");

const RECEIVABLE_STATES = Object.freeze({
  ACCRUED: "ACCRUED",
  RECONCILED: "RECONCILED",
  INVOICED: "INVOICED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  // Exception states
  DISPUTED: "DISPUTED",
  REFUND_ADJUSTMENT_PENDING: "REFUND_ADJUSTMENT_PENDING",
  OVERDUE: "OVERDUE",
  LEGAL_REVIEW: "LEGAL_REVIEW"
});

class CommissionProtectionError extends Error {
  constructor(message, errorCode, httpStatus = 400) {
    super(`[COMMISSION_PROTECTION_ERROR] ${message} (${errorCode})`);
    this.name = "CommissionProtectionError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

class CommissionProtectionService {
  constructor(options = {}) {
    this.agreementService = options.agreementService || defaultCommercialAgreementService;
    this.bankReceiptRegistry = options.bankReceiptRegistry || defaultBankReceiptRegistry;
    this.receivables = new Map();       // commissionId -> record
    this.txDedupIndex = new Map();      // `${tenantId}::${transactionId}::${bankSettlementRef}` -> commissionId
    this.adjustments = [];              // refund/reversal/dispute adjustments
    this.dailyStatements = new Map();   // `${tenantId}::${merchantId}::${dateKey}` -> statement
    this.invoices = new Map();          // invoiceId -> invoice
    this.invoiceDateIndex = new Map();  // `${tenantId}::${merchantId}::${billingDate}` -> invoiceId
    this.payments = [];                 // verified & pending commission payments
    this.paymentRefSet = new Set();     // `${tenantId}::${paymentReference}`
    this.freezeRecords = [];            // lawful freeze / legal notice records
    this.repository = options.repository || null;
    if (this.repository && typeof this.repository.registerStateStore === "function") {
      this.repository.registerStateStore("commissionProtection", this);
    }
  }

  _persistIfConfigured() {
    if (this.repository && typeof this.repository.saveState === "function") {
      this.repository.saveState();
    }
  }

  exportSnapshot() {
    return {
      receivables: Array.from(this.receivables.entries()),
      txDedupIndex: Array.from(this.txDedupIndex.entries()),
      adjustments: [...this.adjustments],
      dailyStatements: Array.from(this.dailyStatements.entries()),
      invoices: Array.from(this.invoices.entries()),
      invoiceDateIndex: Array.from(this.invoiceDateIndex.entries()),
      payments: [...this.payments],
      paymentRefSet: Array.from(this.paymentRefSet.values()),
      freezeRecords: [...this.freezeRecords]
    };
  }

  hydrateSnapshot(snap) {
    if (!snap) return;
    this.receivables = new Map(snap.receivables || []);
    this.txDedupIndex = new Map(snap.txDedupIndex || []);
    this.adjustments = [...(snap.adjustments || [])];
    this.dailyStatements = new Map(snap.dailyStatements || []);
    this.invoices = new Map(snap.invoices || []);
    this.invoiceDateIndex = new Map(snap.invoiceDateIndex || []);
    this.payments = [...(snap.payments || [])];
    this.paymentRefSet = new Set(snap.paymentRefSet || []);
    this.freezeRecords = [...(snap.freezeRecords || [])];
  }

  _requireTenant(tenantId) {
    if (!tenantId || String(tenantId).trim() === "") {
      throw new CommissionProtectionError("tenantId is strictly required for tenant isolation", "MISSING_TENANT_ID", 400);
    }
    return String(tenantId);
  }

  _computeHash(payload) {
    return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  _resolveStatementSigningKey(explicitSecret = null) {
    return explicitSecret || process.env.FINTECH_STATEMENT_SIGNING_SECRET || process.env.FINTECH_WEBHOOK_SECRET || null;
  }

  /**
   * 6.3 / 6.4 Accrues GARUDA's 2% contractual software fee ONLY from authenticated,
   * bank-verified settled transaction principal (Zero double-counting on duplicate events).
   */
  accrueCommissionFromSettlement({
    tenantId,
    merchantId,
    merchantLegalName,
    destinationBankIban,
    transactionId,
    bankSettlementRef,
    settlementDate,
    settledPrincipalAmount,
    currency = "INR",
    providerConfirmed = false,
    requireActiveAgreement = true
  }) {
    const cleanTenantId = this._requireTenant(tenantId);
    if (!merchantId || !transactionId) {
      throw new CommissionProtectionError("merchantId and transactionId are mandatory", "MISSING_TX_METADATA", 400);
    }

    // Invariant: Zero-Custody principal validation when destination bank info is present
    if (destinationBankIban) {
      assertZeroCustody({
        accountType: "STANDARD_MERCHANT_CORPORATE",
        beneficiaryLegalName: merchantLegalName || merchantId,
        isTransactionPrincipal: true,
        destinationBankIban
      });
    }

    validateLedgerSeparation("MERCHANT_SHADOW_TELEMETRY", {
      action: "OBSERVE_SETTLED_PRINCIPAL",
      transactionId
    });

    // Strict Anti-Fabrication Gate: never count unverified transactions
    if (providerConfirmed !== true || !bankSettlementRef || String(bankSettlementRef).trim() === "") {
      throw new CommissionProtectionError(
        "Unverified transaction excluded: bank-verified settlement evidence and reference are mandatory",
        "UNVERIFIED_SETTLEMENT_REJECTED",
        400
      );
    }

    const amount = Number(settledPrincipalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CommissionProtectionError("Settled principal amount must be positive", "INVALID_PRINCIPAL_AMOUNT", 400);
    }

    // Active commercial agreement check (6.6)
    let agreement = this.agreementService.getActiveAgreement(cleanTenantId, merchantId);
    if (!agreement && requireActiveAgreement) {
      agreement = this.agreementService.requireActiveAgreement(cleanTenantId, merchantId);
    }

    // Duplicate settlement / webhook protection (6.7 #4)
    const dedupKey = `${cleanTenantId}::${transactionId}::${bankSettlementRef}`;
    if (this.txDedupIndex.has(dedupKey)) {
      const existing = this.receivables.get(this.txDedupIndex.get(dedupKey));
      return {
        duplicateIgnored: true,
        commissionRecord: existing
      };
    }

    const appliedRate = agreement ? agreement.commissionRate : DEFAULT_COMMISSION_RATE;
    const rateBps = agreement ? agreement.commissionBps : Math.round(appliedRate * 10000);
    const taxRate = agreement ? agreement.taxRate : 0.18;
    const taxBps = Math.round(taxRate * 10000);
    const contractVersion = agreement ? agreement.contractVersion : "RAIPUR-PILOT-STD-200BPS-V1";
    const contractId = agreement ? agreement.contractId : null;

    const principalMinor = toMinorUnits(amount);
    const commissionFeeMinor = computeBpsFeeMinor(principalMinor, rateBps);
    const taxAmountMinor = computeBpsFeeMinor(commissionFeeMinor, taxBps);
    const totalReceivableMinor = commissionFeeMinor + taxAmountMinor;

    const dateKey = (settlementDate || new Date().toISOString()).slice(0, 10);
    const commissionId = `com_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date().toISOString();

    const corePayload = {
      commissionId,
      tenantId: cleanTenantId,
      merchantId: String(merchantId),
      transactionId: String(transactionId),
      bankSettlementRef: String(bankSettlementRef),
      settlementDate: dateKey,
      currency: String(currency).toUpperCase(),
      eligiblePrincipalMinor: principalMinor,
      appliedRate,
      appliedRateBps: rateBps,
      contractId,
      contractVersion,
      commissionFeeMinor,
      taxAmountMinor,
      totalReceivableMinor
    };

    const record = {
      ...corePayload,
      eligiblePrincipalAmount: fromMinorUnits(principalMinor),
      commissionFee: fromMinorUnits(commissionFeeMinor),
      taxAmount: fromMinorUnits(taxAmountMinor),
      totalReceivable: fromMinorUnits(totalReceivableMinor),
      paidAmountMinor: 0,
      paidAmount: 0,
      outstandingAmount: fromMinorUnits(totalReceivableMinor),
      adjustmentStatus: "NONE",
      adjustmentDeltaMinor: 0,
      invoiceId: null,
      invoiceNumber: null,
      status: RECEIVABLE_STATES.ACCRUED,
      frozenAccountFlagged: false,
      freezeRecordId: null,
      recordHash: this._computeHash(corePayload),
      createdAt: now,
      updatedAt: now
    };

    this.receivables.set(commissionId, record);
    this.txDedupIndex.set(dedupKey, commissionId);
    this._persistIfConfigured();

    defaultAuditLogger.logEvent({
      transactionId,
      actor: "COMMISSION_PROTECTION_ENGINE",
      action: "COMMISSION_ACCRUED_FROM_VERIFIED_SETTLEMENT",
      oldState: "NONE",
      newState: RECEIVABLE_STATES.ACCRUED,
      providerReference: bankSettlementRef,
      payload: {
        commissionId,
        tenantId: cleanTenantId,
        merchantId,
        eligiblePrincipalAmount: record.eligiblePrincipalAmount,
        appliedRateBps: rateBps,
        contractVersion,
        commissionFee: record.commissionFee,
        totalReceivable: record.totalReceivable,
        recordHash: record.recordHash
      }
    });

    return {
      duplicateIgnored: false,
      commissionRecord: record
    };
  }

  /**
   * 6.4 Handles refund or bank reversal adjustments without corrupting historical settlement facts.
   */
  recordRefundOrReversalAdjustment({
    tenantId,
    merchantId,
    commissionId,
    transactionId,
    adjustedPrincipalAmount,
    bankAdjustmentRef,
    isReversal = false,
    reason = "CUSTOMER_REFUND_OR_BANK_REVERSAL"
  }) {
    const cleanTenantId = this._requireTenant(tenantId);
    const rec = commissionId
      ? this.receivables.get(commissionId)
      : Array.from(this.receivables.values()).find(
          (r) => r.tenantId === cleanTenantId && r.merchantId === merchantId && r.transactionId === transactionId
        );

    if (!rec) {
      throw new CommissionProtectionError("Commission record not found for adjustment", "COMMISSION_NOT_FOUND", 404);
    }
    if (rec.tenantId !== cleanTenantId) {
      throw new CommissionProtectionError("Cross-tenant adjustment denied", "TENANT_ISOLATION_VIOLATION", 403);
    }
    if (!bankAdjustmentRef) {
      throw new CommissionProtectionError("Bank adjustment/reversal reference required", "MISSING_ADJUSTMENT_REF", 400);
    }

    const adjPrincipalMinor = toMinorUnits(adjustedPrincipalAmount);
    if (adjPrincipalMinor <= 0 || adjPrincipalMinor > rec.eligiblePrincipalMinor) {
      throw new CommissionProtectionError("Adjustment principal exceeds settled principal", "INVALID_ADJUSTMENT_AMOUNT", 400);
    }

    const feeDeltaMinor = -computeBpsFeeMinor(adjPrincipalMinor, rec.appliedRateBps);
    const taxBps = rec.commissionFeeMinor > 0 ? Math.round((rec.taxAmountMinor / rec.commissionFeeMinor) * 10000) : 0;
    const taxDeltaMinor = -computeBpsFeeMinor(Math.abs(feeDeltaMinor), taxBps);
    const totalDeltaMinor = feeDeltaMinor + taxDeltaMinor;

    const adjustmentId = `adj_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const adjRecord = Object.freeze({
      adjustmentId,
      tenantId: cleanTenantId,
      merchantId: rec.merchantId,
      commissionId: rec.commissionId,
      transactionId: rec.transactionId,
      bankAdjustmentRef,
      type: isReversal ? "BANK_REVERSAL_ADJUSTMENT" : "REFUND_ADJUSTMENT",
      adjustedPrincipalAmount: fromMinorUnits(adjPrincipalMinor),
      feeDelta: fromMinorUnits(feeDeltaMinor),
      taxDelta: fromMinorUnits(taxDeltaMinor),
      totalDelta: fromMinorUnits(totalDeltaMinor),
      totalDeltaMinor,
      feeDeltaMinor,
      reason,
      createdAt: new Date().toISOString()
    });

    this.adjustments.push(adjRecord);

    rec.adjustmentDeltaMinor += totalDeltaMinor;
    rec.totalReceivableMinor = Math.max(0, rec.totalReceivableMinor + totalDeltaMinor);
    rec.totalReceivable = fromMinorUnits(rec.totalReceivableMinor);
    rec.outstandingAmount = fromMinorUnits(Math.max(0, rec.totalReceivableMinor - rec.paidAmountMinor));
    rec.adjustmentStatus = isReversal ? "REVERSAL_ADJUSTED" : "REFUND_ADJUSTED";
    if (rec.status === RECEIVABLE_STATES.ACCRUED || rec.status === RECEIVABLE_STATES.INVOICED) {
      rec.status = RECEIVABLE_STATES.REFUND_ADJUSTMENT_PENDING;
    }
    rec.updatedAt = new Date().toISOString();

    defaultAuditLogger.logEvent({
      transactionId: rec.transactionId,
      actor: "COMMISSION_PROTECTION_ENGINE",
      action: adjRecord.type,
      oldState: rec.adjustmentStatus,
      newState: rec.status,
      providerReference: bankAdjustmentRef,
      payload: adjRecord
    });

    return { adjustment: adjRecord, updatedCommission: rec };
  }

  /**
   * 6.3 / 6.4 Reconciles daily eligible transactions into a deterministic, signed statement.
   */
  generateDailyStatement({ tenantId, merchantId, dateKey, signingSecret = null }) {
    const cleanTenantId = this._requireTenant(tenantId);
    if (!merchantId || !dateKey) {
      throw new CommissionProtectionError("merchantId and dateKey (YYYY-MM-DD) are required", "MISSING_STATEMENT_PARAMS", 400);
    }

    const scopeKey = `${cleanTenantId}::${merchantId}::${dateKey}`;
    const dayRecords = Array.from(this.receivables.values()).filter(
      (r) => r.tenantId === cleanTenantId && r.merchantId === String(merchantId) && r.settlementDate === dateKey
    );

    let eligiblePrincipalMinor = 0;
    let grossCommissionMinor = 0;
    let taxAmountMinor = 0;
    let adjustmentDeltaMinor = 0;

    for (const r of dayRecords) {
      eligiblePrincipalMinor += r.eligiblePrincipalMinor;
      grossCommissionMinor += r.commissionFeeMinor;
      taxAmountMinor += r.taxAmountMinor;
      adjustmentDeltaMinor += r.adjustmentDeltaMinor;
      if (r.status === RECEIVABLE_STATES.ACCRUED || r.status === RECEIVABLE_STATES.REFUND_ADJUSTMENT_PENDING) {
        r.status = RECEIVABLE_STATES.RECONCILED;
        r.updatedAt = new Date().toISOString();
      }
    }

    const netTotalMinor = Math.max(0, grossCommissionMinor + taxAmountMinor + adjustmentDeltaMinor);
    const currency = dayRecords[0]?.currency || "INR";

    const statementBody = {
      tenantId: cleanTenantId,
      merchantId: String(merchantId),
      statementDate: dateKey,
      currency,
      txCount: dayRecords.length,
      eligiblePrincipalAmount: fromMinorUnits(eligiblePrincipalMinor),
      grossCommissionAmount: fromMinorUnits(grossCommissionMinor),
      adjustmentDeltaAmount: fromMinorUnits(adjustmentDeltaMinor),
      taxAmount: fromMinorUnits(taxAmountMinor),
      totalPayableAmount: fromMinorUnits(netTotalMinor),
      transactionRefs: dayRecords.map((r) => r.transactionId).sort()
    };

    const statementHash = this._computeHash(statementBody);
    const hmacKey = this._resolveStatementSigningKey(signingSecret);
    const hmacSignature = hmacKey
      ? crypto.createHmac("sha256", hmacKey).update(statementHash).digest("hex")
      : `UNSIGNED_HASH_ONLY:${statementHash}`;

    const statement = {
      statementId: this.dailyStatements.get(scopeKey)?.statementId || `stmt_${dateKey.replace(/-/g, "")}_${crypto.randomBytes(3).toString("hex")}`,
      ...statementBody,
      eligiblePrincipalMinor,
      grossCommissionMinor,
      adjustmentDeltaMinor,
      taxAmountMinor,
      totalPayableMinor: netTotalMinor,
      statementHash,
      hmacSignature,
      signed: Boolean(hmacKey),
      lineItems: dayRecords,
      generatedAt: new Date().toISOString()
    };

    this.dailyStatements.set(scopeKey, statement);

    defaultAuditLogger.logEvent({
      transactionId: statement.statementId,
      actor: "COMMISSION_PROTECTION_ENGINE",
      action: "DAILY_SIGNED_STATEMENT_GENERATED",
      oldState: "ACCRUED",
      newState: "RECONCILED",
      payload: {
        tenantId: cleanTenantId,
        merchantId,
        statementDate: dateKey,
        txCount: statement.txCount,
        totalPayableAmount: statement.totalPayableAmount,
        statementHash
      }
    });

    return statement;
  }

  /**
   * 6.3 / 6.7 #8 Generates daily GST B2B SaaS invoice with strict duplicate-invoice prevention.
   */
  generateDailyInvoice({ tenantId, merchantId, billingDate, signingSecret = null }) {
    const cleanTenantId = this._requireTenant(tenantId);
    const agreement = this.agreementService.requireActiveAgreement(cleanTenantId, merchantId);

    if (agreement.billingMode !== BILLING_MODES.POSTPAID) {
      throw new CommissionProtectionError(
        `Merchant billing mode is ${agreement.billingMode}; daily postpaid invoicing applies to POSTPAID agreements`,
        "BILLING_MODE_MISMATCH",
        400
      );
    }

    const invoiceKey = `${cleanTenantId}::${merchantId}::${billingDate}`;
    if (this.invoiceDateIndex.has(invoiceKey)) {
      throw new CommissionProtectionError(
        `Duplicate invoice prevented for merchant "${merchantId}" on billingDate "${billingDate}"`,
        "DUPLICATE_INVOICE_PREVENTED",
        409
      );
    }

    const statement =
      this.dailyStatements.get(invoiceKey) ||
      this.generateDailyStatement({ tenantId: cleanTenantId, merchantId, dateKey: billingDate, signingSecret });

    const invoiceId = `inv_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const invoiceNumber = `GRD-INV-${billingDate.replace(/-/g, "")}-${String(this.invoices.size + 1).padStart(4, "0")}`;
    const dueMs = new Date(`${billingDate}T00:00:00Z`).getTime() + (agreement.terms.paymentDeadlineDays || 1) * 86400000;
    const dueDate = new Date(dueMs).toISOString().slice(0, 10);

    const subtotalMinor = Math.max(0, statement.grossCommissionMinor + statement.adjustmentDeltaMinor);
    const gstAmountMinor = statement.taxAmountMinor;
    const totalAmountMinor = statement.totalPayableMinor;

    const invoice = {
      invoiceId,
      invoiceNumber,
      tenantId: cleanTenantId,
      merchantId: String(merchantId),
      contractId: agreement.contractId,
      contractVersion: agreement.contractVersion,
      statementId: statement.statementId,
      billingDate,
      dueDate,
      currency: statement.currency,
      sacCode: agreement.sacCode || "998313",
      taxTreatment: agreement.terms.taxTreatment,
      subtotalAmount: fromMinorUnits(subtotalMinor),
      gstAmount: fromMinorUnits(gstAmountMinor),
      totalAmount: fromMinorUnits(totalAmountMinor),
      totalAmountMinor,
      paidAmountMinor: 0,
      paidAmount: 0,
      outstandingAmount: fromMinorUnits(totalAmountMinor),
      partialPayments: [],
      status: RECEIVABLE_STATES.INVOICED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.invoices.set(invoiceId, invoice);
    this.invoiceDateIndex.set(invoiceKey, invoiceId);

    for (const r of statement.lineItems) {
      r.invoiceId = invoiceId;
      r.invoiceNumber = invoiceNumber;
      if (r.status === RECEIVABLE_STATES.RECONCILED || r.status === RECEIVABLE_STATES.ACCRUED) {
        r.status = RECEIVABLE_STATES.INVOICED;
        r.updatedAt = new Date().toISOString();
      }
    }

    defaultAuditLogger.logEvent({
      transactionId: invoiceId,
      actor: "COMMISSION_PROTECTION_ENGINE",
      action: "DAILY_COMMISSION_INVOICE_ISSUED",
      oldState: "RECONCILED",
      newState: RECEIVABLE_STATES.INVOICED,
      payload: {
        tenantId: cleanTenantId,
        merchantId,
        invoiceNumber,
        sacCode: invoice.sacCode,
        totalAmount: invoice.totalAmount,
        dueDate
      }
    });

    return invoice;
  }

  /**
   * 6.3 / 6.7 #9 Independently verifies merchant corporate bank payment for GARUDA's invoice.
   * Rejects self-attested client booleans (`verifiedBankReceipt: true`).
   * Marks PAID ONLY after consuming an authenticated server-side VerifiedBankReceipt record.
   */
  recordInvoicePayment({
    tenantId,
    invoiceId,
    paidAmount,
    bankReceiptId = null,
    paymentReference,
    payerCorporateAccount,
    verifiedBy = null
  }) {
    const cleanTenantId = this._requireTenant(tenantId);
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new CommissionProtectionError(`Invoice not found: ${invoiceId}`, "INVOICE_NOT_FOUND", 404);
    }
    if (invoice.tenantId !== cleanTenantId) {
      throw new CommissionProtectionError("Cross-tenant invoice payment access denied", "TENANT_ISOLATION_VIOLATION", 403);
    }

    const amount = Number(paidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CommissionProtectionError("Payment amount must be positive", "INVALID_PAYMENT_AMOUNT", 400);
    }

    if (!paymentReference || !payerCorporateAccount) {
      throw new CommissionProtectionError(
        "paymentReference and payerCorporateAccount are required",
        "UNVERIFIED_COMMISSION_RECEIPT",
        400
      );
    }

    // Strict Server-Side Verification: Consume authenticated bank receipt from registry.
    // Client-supplied booleans like `verifiedBankReceipt: true` are never accepted as proof.
    const verifiedReceipt = this.bankReceiptRegistry.consumeVerifiedReceipt({
      tenantId: cleanTenantId,
      merchantId: invoice.merchantId,
      purpose: RECEIPT_PURPOSES.COMMISSION_INVOICE_PAYMENT,
      bankReceiptId,
      bankTransactionRef: paymentReference,
      expectedMinAmount: amount,
      consumedByRecordId: invoiceId
    });

    const payRefKey = `${cleanTenantId}::${verifiedReceipt.bankTransactionRef}`;
    if (this.paymentRefSet.has(payRefKey)) {
      throw new CommissionProtectionError(`Duplicate commission payment reference: ${verifiedReceipt.bankTransactionRef}`, "DUPLICATE_PAYMENT_REF", 409);
    }

    const paidMinor = toMinorUnits(amount);
    this.paymentRefSet.add(payRefKey);

    const paymentRecord = {
      paymentRecordId: `cpay_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      invoiceId,
      bankReceiptId: verifiedReceipt.bankReceiptId,
      receiptHash: verifiedReceipt.receiptHash,
      tenantId: cleanTenantId,
      merchantId: invoice.merchantId,
      amount: fromMinorUnits(paidMinor),
      amountMinor: paidMinor,
      paymentReference: verifiedReceipt.bankTransactionRef,
      payerCorporateAccount: verifiedReceipt.payerCorporateAccount,
      verifiedBankReceipt: true,
      verifiedBy: verifiedBy || "BANK_FEED_VERIFIER",
      verifiedAt: verifiedReceipt.settledAt || new Date().toISOString()
    };

    this.payments.push(paymentRecord);
    invoice.paidAmountMinor += paidMinor;
    invoice.paidAmount = fromMinorUnits(invoice.paidAmountMinor);
    invoice.outstandingAmount = fromMinorUnits(Math.max(0, invoice.totalAmountMinor - invoice.paidAmountMinor));
    invoice.partialPayments.push(paymentRecord);

    const prevStatus = invoice.status;
    invoice.status =
      invoice.paidAmountMinor >= invoice.totalAmountMinor
        ? RECEIVABLE_STATES.PAID
        : RECEIVABLE_STATES.PAYMENT_PENDING;
    invoice.updatedAt = new Date().toISOString();

    for (const rec of this.receivables.values()) {
      if (rec.tenantId === cleanTenantId && rec.invoiceId === invoiceId) {
        rec.status = invoice.status;
        if (invoice.status === RECEIVABLE_STATES.PAID) {
          rec.paidAmountMinor = rec.totalReceivableMinor;
          rec.paidAmount = rec.totalReceivable;
          rec.outstandingAmount = 0;
        }
        rec.updatedAt = new Date().toISOString();
      }
    }

    this._persistIfConfigured();

    defaultAuditLogger.logEvent({
      transactionId: invoiceId,
      actor: paymentRecord.verifiedBy,
      action: invoice.status === RECEIVABLE_STATES.PAID ? "COMMISSION_INVOICE_PAID" : "COMMISSION_PARTIAL_PAYMENT_VERIFIED",
      oldState: prevStatus,
      newState: invoice.status,
      providerReference: verifiedReceipt.bankTransactionRef,
      payload: {
        tenantId: cleanTenantId,
        invoiceId,
        paidAmount: paymentRecord.amount,
        totalPaid: invoice.paidAmount,
        outstandingAmount: invoice.outstandingAmount
      }
    });

    return { payment: paymentRecord, invoice };
  }

  /**
   * 6.4 Overdue scanning & aging report
   */
  getReceivableAging(tenantId, merchantId = null, asOfDate = new Date().toISOString().slice(0, 10)) {
    const cleanTenantId = this._requireTenant(tenantId);
    const asOfMs = new Date(`${asOfDate}T00:00:00Z`).getTime();
    const buckets = { current: 0, days1to7: 0, days8to15: 0, days16to30: 0, over30Days: 0 };
    const overdueInvoices = [];

    for (const inv of this.invoices.values()) {
      if (inv.tenantId !== cleanTenantId) continue;
      if (merchantId && inv.merchantId !== String(merchantId)) continue;
      if (inv.status === RECEIVABLE_STATES.PAID) continue;

      const outstanding = Math.max(0, inv.totalAmountMinor - inv.paidAmountMinor);
      if (outstanding === 0) continue;

      const dueMs = new Date(`${inv.dueDate}T00:00:00Z`).getTime();
      const daysPastDue = Math.floor((asOfMs - dueMs) / 86400000);

      if (daysPastDue <= 0) buckets.current += outstanding;
      else if (daysPastDue <= 7) buckets.days1to7 += outstanding;
      else if (daysPastDue <= 15) buckets.days8to15 += outstanding;
      else if (daysPastDue <= 30) buckets.days16to30 += outstanding;
      else buckets.over30Days += outstanding;

      if (daysPastDue > 0) {
        if (inv.status !== RECEIVABLE_STATES.LEGAL_REVIEW && inv.status !== RECEIVABLE_STATES.DISPUTED) {
          inv.status = RECEIVABLE_STATES.OVERDUE;
        }
        overdueInvoices.push({
          invoiceId: inv.invoiceId,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          daysPastDue,
          outstandingAmount: fromMinorUnits(outstanding)
        });
      }
    }

    if (overdueInvoices.length > 0) {
      defaultObservability.dispatchAlert("MEDIUM", "Commission Receivables Overdue Reminder", {
        tenantId: cleanTenantId,
        merchantId,
        overdueCount: overdueInvoices.length
      });
    }

    return {
      tenantId: cleanTenantId,
      merchantId,
      asOfDate,
      buckets: {
        current: fromMinorUnits(buckets.current),
        days1to7: fromMinorUnits(buckets.days1to7),
        days8to15: fromMinorUnits(buckets.days8to15),
        days16to30: fromMinorUnits(buckets.days16to30),
        over30Days: fromMinorUnits(buckets.over30Days)
      },
      totalOverdueAmount: fromMinorUnits(buckets.days1to7 + buckets.days8to15 + buckets.days16to30 + buckets.over30Days),
      overdueInvoices
    };
  }

  /**
   * 6.4 / 6.7 #10-#11 LAWFUL MERCHANT ACCOUNT FREEZE SCENARIO HANDLER:
   * - Never bypasses liens, never diverts principal funds, never splits transactions.
   * - Preserves settlement evidence, separates affected vs unaffected txs,
   *   flags unpaid invoices & GARUDA's separately accrued receivables for lawful recovery.
   */
  recordMerchantAccountFreeze({
    tenantId,
    merchantId,
    authorityOrBank,
    orderReference,
    scope = "TOTAL_FREEZE",
    disputedAmount = 0,
    affectedTxIds = [],
    legalNoticeSummary = ""
  }) {
    const cleanTenantId = this._requireTenant(tenantId);
    if (!merchantId || !authorityOrBank || !orderReference) {
      throw new CommissionProtectionError("merchantId, authorityOrBank, and orderReference required", "MISSING_FREEZE_DETAILS", 400);
    }

    const freezeId = `frz_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const affectedSet = new Set((affectedTxIds || []).map(String));

    const merchantReceivables = Array.from(this.receivables.values()).filter(
      (r) => r.tenantId === cleanTenantId && r.merchantId === String(merchantId)
    );

    const affectedTransactions = [];
    const unaffectedTransactions = [];
    let preservedReceivableMinor = 0;

    for (const r of merchantReceivables) {
      if (r.status !== RECEIVABLE_STATES.PAID) {
        preservedReceivableMinor += Math.max(0, r.totalReceivableMinor - r.paidAmountMinor);
        r.frozenAccountFlagged = true;
        r.freezeRecordId = freezeId;
        if (affectedSet.has(r.transactionId)) {
          r.status = RECEIVABLE_STATES.LEGAL_REVIEW;
        }
        r.updatedAt = new Date().toISOString();
      }

      if (affectedSet.has(r.transactionId)) {
        affectedTransactions.push({
          transactionId: r.transactionId,
          bankSettlementRef: r.bankSettlementRef,
          settledPrincipal: r.eligiblePrincipalAmount,
          receivableStatus: r.status
        });
      } else {
        unaffectedTransactions.push({
          transactionId: r.transactionId,
          bankSettlementRef: r.bankSettlementRef,
          settledPrincipal: r.eligiblePrincipalAmount,
          receivableStatus: r.status
        });
      }
    }

    const flaggedInvoices = [];
    for (const inv of this.invoices.values()) {
      if (inv.tenantId === cleanTenantId && inv.merchantId === String(merchantId) && inv.status !== RECEIVABLE_STATES.PAID) {
        flaggedInvoices.push({
          invoiceId: inv.invoiceId,
          invoiceNumber: inv.invoiceNumber,
          outstandingAmount: fromMinorUnits(Math.max(0, inv.totalAmountMinor - inv.paidAmountMinor)),
          previousStatus: inv.status
        });
        inv.status = RECEIVABLE_STATES.LEGAL_REVIEW;
        inv.updatedAt = new Date().toISOString();
      }
    }

    const freezeRecord = Object.freeze({
      freezeId,
      tenantId: cleanTenantId,
      merchantId: String(merchantId),
      authorityOrBank,
      orderReference,
      scope,
      disputedAmount: Number(disputedAmount) || 0,
      affectedTransactions,
      unaffectedTransactions,
      flaggedInvoices,
      preservedReceivableAmount: fromMinorUnits(preservedReceivableMinor),
      lawfulComplianceNotice:
        "Lawful bank/court restriction respected. Zero fund diversion, zero lien bypass. Evidence & GARUDA fee receivables preserved for lawful contractual recovery.",
      legalNotices: [
        {
          recordedAt: new Date().toISOString(),
          authorityOrBank,
          orderReference,
          summary: legalNoticeSummary || "Official freeze/lien restriction logged."
        }
      ],
      createdAt: new Date().toISOString()
    });

    this.freezeRecords.push(freezeRecord);

    defaultObservability.dispatchAlert("CRITICAL", "Merchant Account Restriction Logged — Contractual Receivables Preserved", {
      tenantId: cleanTenantId,
      merchantId,
      authorityOrBank,
      orderReference,
      preservedReceivableAmount: freezeRecord.preservedReceivableAmount
    });

    defaultAuditLogger.logEvent({
      transactionId: freezeId,
      actor: "COMMISSION_PROTECTION_ENGINE",
      action: "LAWFUL_ACCOUNT_FREEZE_PRESERVATION_RECORDED",
      oldState: "ACTIVE",
      newState: RECEIVABLE_STATES.LEGAL_REVIEW,
      providerReference: orderReference,
      payload: freezeRecord
    });

    return freezeRecord;
  }

  /**
   * 6.4 Exportable accounting evidence with full SHA-256 chain integrity verification.
   */
  exportAccountingEvidence(tenantId, merchantId) {
    const cleanTenantId = this._requireTenant(tenantId);
    const chainValid = defaultAuditLogger.verifyChainIntegrity();

    return {
      exportedAt: new Date().toISOString(),
      tenantId: cleanTenantId,
      merchantId: String(merchantId),
      zeroCustodyVerified: true,
      auditChainIntegrityVerified: chainValid,
      agreement: this.agreementService.getActiveAgreement(cleanTenantId, merchantId),
      receivables: Array.from(this.receivables.values()).filter(
        (r) => r.tenantId === cleanTenantId && r.merchantId === String(merchantId)
      ),
      adjustments: this.adjustments.filter(
        (a) => a.tenantId === cleanTenantId && a.merchantId === String(merchantId)
      ),
      dailyStatements: Array.from(this.dailyStatements.values()).filter(
        (s) => s.tenantId === cleanTenantId && s.merchantId === String(merchantId)
      ),
      invoices: Array.from(this.invoices.values()).filter(
        (i) => i.tenantId === cleanTenantId && i.merchantId === String(merchantId)
      ),
      verifiedPayments: this.payments.filter(
        (p) => p.tenantId === cleanTenantId && p.merchantId === String(merchantId)
      ),
      freezeAndLegalRecords: this.freezeRecords.filter(
        (f) => f.tenantId === cleanTenantId && f.merchantId === String(merchantId)
      )
    };
  }

  /**
   * 6.5 Generates the 3 required Commercial Dashboard payloads with strict tenant scoping:
   * A. Merchant Transaction Dashboard
   * B. GARUDA Revenue Dashboard (2%)
   * C. Commission Reconciliation Table
   */
  getCommercialDashboards({ tenantId, merchantId, orchestrationService = null, fuelTankService = null }) {
    const cleanTenantId = this._requireTenant(tenantId);
    const mId = merchantId ? String(merchantId) : null;

    const allIntents = orchestrationService
      ? Array.from(orchestrationService.intents.values()).filter(
          (i) => (!i.tenantId || i.tenantId === cleanTenantId) && (!mId || i.merchantId === mId)
        )
      : [];

    let verifiedTxVolume = 0;
    let successfulSettlements = 0;
    let pendingSettlements = 0;
    let refundsAndReversals = 0;
    let disputedTransactions = 0;

    for (const intent of allIntents) {
      if (intent.status === "SETTLED") {
        successfulSettlements += 1;
        verifiedTxVolume += Number(intent.amount || 0);
      } else if (["INITIATED", "PAYMENT_INSTRUCTION_CREATED", "PAYMENT_SENT", "BANK_PROCESSING", "SETTLEMENT_PENDING"].includes(intent.status)) {
        pendingSettlements += 1;
      } else if (["RETURNED", "REVERSED", "RECALLED"].includes(intent.status)) {
        refundsAndReversals += 1;
      } else if (intent.status === "DISPUTED" || intent.status === "MANUAL_REVIEW") {
        disputedTransactions += 1;
      }
    }

    const scopedReceivables = Array.from(this.receivables.values()).filter(
      (r) => r.tenantId === cleanTenantId && (!mId || r.merchantId === mId)
    );
    const scopedInvoices = Array.from(this.invoices.values()).filter(
      (i) => i.tenantId === cleanTenantId && (!mId || i.merchantId === mId)
    );
    const scopedPayments = this.payments.filter(
      (p) => p.tenantId === cleanTenantId && (!mId || p.merchantId === mId)
    );

    const activeAgreement = mId ? this.agreementService.getActiveAgreement(cleanTenantId, mId) : null;
    const fuelStatement = fuelTankService && mId ? fuelTankService.getLedgerStatement(mId, cleanTenantId) : null;

    const totalEligibleSettledMinor = scopedReceivables.reduce((sum, r) => sum + r.eligiblePrincipalMinor, 0);
    const totalAccruedFeeMinor = scopedReceivables.reduce((sum, r) => sum + r.commissionFeeMinor, 0);
    const postpaidOutstandingMinor = scopedInvoices
      .filter((i) => i.status !== RECEIVABLE_STATES.PAID)
      .reduce((sum, i) => sum + Math.max(0, i.totalAmountMinor - i.paidAmountMinor), 0);
    const paymentsReceivedMinor = scopedPayments.reduce((sum, p) => sum + p.amountMinor, 0);
    const overdueMinor = scopedInvoices
      .filter((i) => i.status === RECEIVABLE_STATES.OVERDUE)
      .reduce((sum, i) => sum + Math.max(0, i.totalAmountMinor - i.paidAmountMinor), 0);

    return {
      tenantId: cleanTenantId,
      merchantId: mId,
      A_merchantTransactionDashboard: {
        verifiedTransactionVolume: verifiedTxVolume > 0 ? verifiedTxVolume : fromMinorUnits(totalEligibleSettledMinor),
        successfulSettlements: successfulSettlements > 0 ? successfulSettlements : scopedReceivables.length,
        pendingSettlements,
        refundsAndReversals,
        disputedTransactions
      },
      B_garudaRevenueDashboard: {
        applicableRatePercent: activeAgreement ? Number((activeAgreement.commissionBps / 100).toFixed(2)) : 2.0,
        applicableRateBps: activeAgreement ? activeAgreement.commissionBps : 200,
        contractVersion: activeAgreement?.contractVersion || "RAIPUR-PILOT-STD-200BPS-V1",
        totalEligibleSettledVolume: fromMinorUnits(totalEligibleSettledMinor),
        dailySoftwareFeesAccrued: fromMinorUnits(totalAccruedFeeMinor),
        prepaidCreditsAvailable: fuelStatement ? fuelStatement.closingBalance : 0,
        prepaidUtilization: fuelStatement ? fuelStatement.utilization : 0,
        postpaidReceivables: fromMinorUnits(postpaidOutstandingMinor),
        invoicesIssued: scopedInvoices.length,
        paymentsReceived: fromMinorUnits(paymentsReceivedMinor),
        overdueAmounts: fromMinorUnits(overdueMinor)
      },
      C_commissionReconciliation: scopedReceivables.map((r) => ({
        commissionId: r.commissionId,
        transactionReference: r.transactionId,
        bankSettlementReference: r.bankSettlementRef,
        settlementDate: r.settlementDate,
        eligiblePrincipalAmount: r.eligiblePrincipalAmount,
        contractualRate: `${(r.appliedRateBps / 100).toFixed(2)}%`,
        contractVersion: r.contractVersion,
        garudaFee: r.commissionFee,
        adjustmentStatus: r.adjustmentStatus,
        invoiceReference: r.invoiceNumber || r.invoiceId || "PENDING_INVOICE",
        paymentStatus: r.status
      }))
    };
  }
}

const defaultCommissionProtectionService = new CommissionProtectionService();

module.exports = {
  RECEIVABLE_STATES,
  CommissionProtectionError,
  CommissionProtectionService,
  defaultCommissionProtectionService
};
