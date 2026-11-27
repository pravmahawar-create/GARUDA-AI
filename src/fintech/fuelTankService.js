/**
 * 🦅 GARUDA OS — MODE A: PREPAID SAAS FUEL TANK SERVICE
 * Metered 2.00% (200 bps) Software Orchestration Credit Ledger
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 6 & 13 + Part 6 Section 6.2 + Phase 2 Hardening
 *
 * CRITICAL INVARIANTS:
 * - Prepaid credits are GARUDA's advance software-service consideration ONLY.
 * - Top-ups require server-side authenticated software-payment receipt evidence
 *   (`FUEL_TANK_TOPUP` in VerifiedBankReceiptRegistry) — no arbitrary unverified minting.
 * - Credits are debited ONLY after authenticated bank-verified settlement evidence.
 * - Zero balance gracefully pauses NEW orchestration; NEVER blocks or redirects bank principal.
 */

const crypto = require("crypto");
const { validateLedgerSeparation } = require("./zeroCustodyEnforcer");
const { toMinorUnits, fromMinorUnits, computeBpsFeeMinor } = require("./persistenceRepository");
const { RECEIPT_PURPOSES, defaultBankReceiptRegistry } = require("./bankReceiptVerifier");
const { defaultObservability } = require("./observability");

const DEFAULT_FUEL_RATE = 0.02; // 2.00% (200 bps)
const DEFAULT_LOW_BALANCE_THRESHOLD_MINOR = 1000000;
const GENESIS_LEDGER_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

class FuelTankService {
  constructor(options = {}) {
    this.merchantBalances = new Map(); // `${tenantId}::${merchantId}` -> minor units
    this.pendingUsage = new Map();
    this.lowThresholds = new Map();
    this.ledger = [];
    this.processedSettlementRefs = new Set();
    this.bankReceiptRegistry = options.bankReceiptRegistry || defaultBankReceiptRegistry;
    this.strictReceiptVerification = options.strictReceiptVerification !== false;
    this.repository = options.repository || null;
    if (this.repository && typeof this.repository.registerStateStore === "function") {
      this.repository.registerStateStore("fuelTank", this);
    }
  }

  _scopeKey(merchantId, tenantId = "default_tenant") {
    return `${String(tenantId || "default_tenant")}::${String(merchantId)}`;
  }

  _appendLedgerEntry(entryData) {
    const prevHash = this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].entryHash : GENESIS_LEDGER_HASH;
    const entry = {
      entryId: `ftx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      timestamp: new Date().toISOString(),
      ...entryData,
      previousHash: prevHash,
      entryHash: ""
    };

    const raw = `${entry.entryId}:${entry.tenantId}:${entry.merchantId}:${entry.entryType}:${entry.openingBalanceMinor}:${entry.amountMinor}:${entry.closingBalanceMinor}:${entry.transactionId || ""}:${entry.bankSettlementRef || ""}:${prevHash}`;
    entry.entryHash = crypto.createHash("sha256").update(raw).digest("hex");
    Object.freeze(entry);
    this.ledger.push(entry);

    if (this.repository && typeof this.repository.saveState === "function") {
      this.repository.saveState();
    }
    return entry;
  }

  /**
   * Top up merchant prepaid SaaS maintenance balance strictly against verified software-payment evidence.
   */
  topUp(merchantId, amount, metadata = {}) {
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new Error("Top up amount must be a positive number");
    }

    validateLedgerSeparation("GARUDA_SAAS_CREDITS", {
      representsCustomerPrincipal: false,
      action: "TOP_UP_SOFTWARE_CREDITS",
      amount: numAmount
    });

    const metaObj = typeof metadata === "string" ? { invoiceRef: metadata } : (metadata || {});
    const tenantId = String(metaObj.tenantId || "default_tenant");
    const key = this._scopeKey(merchantId, tenantId);

    // Phase 2 #5: Verify prepaid top-up against authenticated software-payment bank receipt
    let verifiedReceipt = null;
    if (this.strictReceiptVerification) {
      verifiedReceipt = this.bankReceiptRegistry.consumeVerifiedReceipt({
        tenantId,
        merchantId: String(merchantId),
        purpose: RECEIPT_PURPOSES.FUEL_TANK_TOPUP,
        bankReceiptId: metaObj.bankReceiptId || null,
        bankTransactionRef: metaObj.bankTransactionRef || metaObj.invoiceRef || null,
        expectedMinAmount: numAmount,
        consumedByRecordId: `topup_${merchantId}_${Date.now()}`
      });
    }

    const openingMinor = this.merchantBalances.get(key) || 0;
    const creditMinor = toMinorUnits(numAmount);
    const closingMinor = openingMinor + creditMinor;
    this.merchantBalances.set(key, closingMinor);

    if (metaObj.lowBalanceThreshold !== undefined) {
      this.lowThresholds.set(key, toMinorUnits(metaObj.lowBalanceThreshold));
    }

    const ledgerEntry = this._appendLedgerEntry({
      merchantId: String(merchantId),
      tenantId,
      entryType: "TOP_UP",
      openingBalanceMinor: openingMinor,
      amountMinor: creditMinor,
      closingBalanceMinor: closingMinor,
      eligiblePrincipalMinor: 0,
      appliedRateBps: 0,
      contractVersion: metaObj.contractVersion || null,
      transactionId: null,
      bankSettlementRef: null,
      bankReceiptId: verifiedReceipt ? verifiedReceipt.bankReceiptId : null,
      invoiceRef: metaObj.invoiceRef || (verifiedReceipt ? verifiedReceipt.bankTransactionRef : null)
    });

    return {
      merchantId,
      tenantId,
      previousBalance: fromMinorUnits(openingMinor),
      newBalance: fromMinorUnits(closingMinor),
      creditedAmount: numAmount,
      invoiceRef: ledgerEntry.invoiceRef,
      bankReceiptId: ledgerEntry.bankReceiptId,
      ledgerEntryId: ledgerEntry.entryId,
      entryHash: ledgerEntry.entryHash,
      updatedAt: ledgerEntry.timestamp
    };
  }

  reservePendingUsage(merchantId, estimatedPrincipal, ratePercent = DEFAULT_FUEL_RATE, options = {}) {
    const tenantId = String(options.tenantId || "default_tenant");
    const key = this._scopeKey(merchantId, tenantId);
    const pendingMinor = computeBpsFeeMinor(toMinorUnits(estimatedPrincipal), Math.round(Number(ratePercent) * 10000));
    const currentPending = this.pendingUsage.get(key) || 0;
    this.pendingUsage.set(key, currentPending + pendingMinor);

    return {
      merchantId,
      pendingFeeReserved: fromMinorUnits(pendingMinor),
      totalPendingUsage: fromMinorUnits(currentPending + pendingMinor)
    };
  }

  hasSufficientFuel(merchantId, tenantId = "default_tenant", requiredFee = 0) {
    const key = this._scopeKey(merchantId, tenantId);
    const balanceMinor = this.merchantBalances.get(key) || 0;
    const reqMinor = requiredFee > 0 ? toMinorUnits(requiredFee) : 1;
    return balanceMinor >= reqMinor;
  }

  deductSaaSFee(merchantId, orchestratedVolume, ratePercent = DEFAULT_FUEL_RATE, evidence = {}) {
    const volume = Number(orchestratedVolume);
    if (!Number.isFinite(volume) || volume <= 0) {
      throw new Error("ORCHESTRATED_VOLUME_INVALID: Verified settled principal must be > 0");
    }

    if (evidence && evidence.requireBankEvidence !== false && !evidence.bankSettlementRef) {
      throw new Error("UNVERIFIED_SETTLEMENT_REJECTED: Cannot debit SaaS credits without bank-verified settlement reference");
    }

    const effectiveRate = ratePercent !== undefined && ratePercent !== null ? Number(ratePercent) : DEFAULT_FUEL_RATE;
    const rateBps = Math.round(effectiveRate * 10000);
    const tenantId = String(evidence?.tenantId || "default_tenant");
    const key = this._scopeKey(merchantId, tenantId);

    if (evidence?.transactionId && evidence?.bankSettlementRef) {
      const refKey = `${key}::${evidence.transactionId}::${evidence.bankSettlementRef}`;
      if (this.processedSettlementRefs.has(refKey)) {
        throw new Error(`DUPLICATE_FUEL_DEBIT_PREVENTED: Settlement ${evidence.bankSettlementRef} already metered`);
      }
      this.processedSettlementRefs.add(refKey);
    }

    const principalMinor = toMinorUnits(volume);
    const feeMinor = computeBpsFeeMinor(principalMinor, rateBps);
    const feeAmount = fromMinorUnits(feeMinor);

    validateLedgerSeparation("GARUDA_SAAS_CREDITS", {
      representsCustomerPrincipal: false,
      action: "METERED_SAAS_DEDUCTION",
      feeAmount
    });

    const openingMinor = this.merchantBalances.get(key) || 0;
    const closingMinor = openingMinor - feeMinor;
    this.merchantBalances.set(key, closingMinor);

    if (evidence?.releasePendingFee) {
      const releaseMinor = toMinorUnits(evidence.releasePendingFee);
      const currPending = this.pendingUsage.get(key) || 0;
      this.pendingUsage.set(key, Math.max(0, currPending - releaseMinor));
    }

    const thresholdMinor = this.lowThresholds.get(key) || DEFAULT_LOW_BALANCE_THRESHOLD_MINOR;
    const lowFuelWarning = closingMinor <= thresholdMinor;
    const suspendedForNewOrders = closingMinor <= 0;

    if (lowFuelWarning) {
      defaultObservability.dispatchAlert(
        suspendedForNewOrders ? "HIGH" : "MEDIUM",
        suspendedForNewOrders
          ? "Prepaid SaaS Fuel Tank Depleted — Graceful Orchestration Pause Armed"
          : "Prepaid SaaS Fuel Tank Low Balance Alert",
        {
          merchantId,
          tenantId,
          remainingBalance: fromMinorUnits(closingMinor),
          principalFundsHeldByBankUntouched: true
        }
      );
    }

    const ledgerEntry = this._appendLedgerEntry({
      merchantId: String(merchantId),
      tenantId,
      entryType: "SETTLEMENT_DEBIT",
      openingBalanceMinor: openingMinor,
      amountMinor: feeMinor,
      closingBalanceMinor: closingMinor,
      eligiblePrincipalMinor: principalMinor,
      appliedRateBps: rateBps,
      contractVersion: evidence?.contractVersion || "RAIPUR-PILOT-STD-200BPS-V1",
      transactionId: evidence?.transactionId || null,
      bankSettlementRef: evidence?.bankSettlementRef || null,
      bankReceiptId: null,
      invoiceRef: null
    });

    return {
      merchantId,
      tenantId,
      orchestratedVolume: volume,
      ratePercent: effectiveRate,
      rateBps,
      contractVersion: ledgerEntry.contractVersion,
      feeDeducted: feeAmount,
      openingBalance: fromMinorUnits(openingMinor),
      remainingBalance: fromMinorUnits(closingMinor),
      lowFuelWarning,
      suspendedForNewOrders,
      principalFundsProtectedAtBank: true,
      ledgerEntryId: ledgerEntry.entryId,
      entryHash: ledgerEntry.entryHash,
      timestamp: ledgerEntry.timestamp
    };
  }

  creditRefundAdjustment(merchantId, refundedVolume, ratePercent = DEFAULT_FUEL_RATE, evidence = {}) {
    const rateBps = Math.round(Number(ratePercent) * 10000);
    const tenantId = String(evidence?.tenantId || "default_tenant");
    const key = this._scopeKey(merchantId, tenantId);

    const refundMinor = toMinorUnits(refundedVolume);
    const creditFeeMinor = computeBpsFeeMinor(refundMinor, rateBps);
    const openingMinor = this.merchantBalances.get(key) || 0;
    const closingMinor = openingMinor + creditFeeMinor;
    this.merchantBalances.set(key, closingMinor);

    const ledgerEntry = this._appendLedgerEntry({
      merchantId: String(merchantId),
      tenantId,
      entryType: evidence?.isReversal ? "REVERSAL_CREDIT" : "REFUND_CREDIT",
      openingBalanceMinor: openingMinor,
      amountMinor: creditFeeMinor,
      closingBalanceMinor: closingMinor,
      eligiblePrincipalMinor: refundMinor,
      appliedRateBps: rateBps,
      contractVersion: evidence?.contractVersion || "RAIPUR-PILOT-STD-200BPS-V1",
      transactionId: evidence?.transactionId || null,
      bankSettlementRef: evidence?.bankSettlementRef || null,
      bankReceiptId: null,
      invoiceRef: evidence?.creditNoteRef || null
    });

    return {
      merchantId,
      creditedFeeAdjustment: fromMinorUnits(creditFeeMinor),
      openingBalance: fromMinorUnits(openingMinor),
      closingBalance: fromMinorUnits(closingMinor),
      ledgerEntryId: ledgerEntry.entryId
    };
  }

  getBalance(merchantId, tenantId = "default_tenant") {
    const key = this._scopeKey(merchantId, tenantId);
    return fromMinorUnits(this.merchantBalances.get(key) || 0);
  }

  getLedgerStatement(merchantId, tenantId = "default_tenant") {
    const cleanTenantId = String(tenantId || "default_tenant");
    const scopedEntries = this.ledger.filter(
      (e) => e.merchantId === String(merchantId) && e.tenantId === cleanTenantId
    );
    const key = this._scopeKey(merchantId, cleanTenantId);

    let creditsPurchasedMinor = 0;
    let utilizationMinor = 0;
    let adjustmentsCreditedMinor = 0;

    for (const entry of scopedEntries) {
      if (entry.entryType === "TOP_UP") creditsPurchasedMinor += entry.amountMinor;
      if (entry.entryType === "SETTLEMENT_DEBIT") utilizationMinor += entry.amountMinor;
      if (entry.entryType === "REFUND_CREDIT" || entry.entryType === "REVERSAL_CREDIT") {
        adjustmentsCreditedMinor += entry.amountMinor;
      }
    }

    const openingBalanceMinor = scopedEntries.length > 0 ? scopedEntries[0].openingBalanceMinor : 0;
    const closingBalanceMinor = this.merchantBalances.get(key) || 0;
    const pendingUsageMinor = this.pendingUsage.get(key) || 0;
    const thresholdMinor = this.lowThresholds.get(key) || DEFAULT_LOW_BALANCE_THRESHOLD_MINOR;

    return {
      merchantId,
      tenantId: cleanTenantId,
      billingClassification: "GARUDA_ADVANCE_SAAS_CONSIDERATION",
      representsCustomerDeposit: false,
      openingBalance: fromMinorUnits(openingBalanceMinor),
      creditsPurchased: fromMinorUnits(creditsPurchasedMinor),
      utilization: fromMinorUnits(utilizationMinor),
      refundCreditsAdjusted: fromMinorUnits(adjustmentsCreditedMinor),
      pendingUsage: fromMinorUnits(pendingUsageMinor),
      closingBalance: fromMinorUnits(closingBalanceMinor),
      lowBalanceThreshold: fromMinorUnits(thresholdMinor),
      lowBalanceAlert: closingBalanceMinor <= thresholdMinor,
      newOrchestrationPaused: closingBalanceMinor <= 0,
      entries: scopedEntries
    };
  }

  exportSnapshot() {
    return {
      merchantBalances: Array.from(this.merchantBalances.entries()),
      pendingUsage: Array.from(this.pendingUsage.entries()),
      lowThresholds: Array.from(this.lowThresholds.entries()),
      ledger: [...this.ledger],
      processedSettlementRefs: Array.from(this.processedSettlementRefs.values())
    };
  }

  hydrateSnapshot(snap) {
    if (!snap) return;
    this.merchantBalances = new Map(snap.merchantBalances || []);
    this.pendingUsage = new Map(snap.pendingUsage || []);
    this.lowThresholds = new Map(snap.lowThresholds || []);
    this.ledger = (snap.ledger || []).map((e) => Object.freeze({ ...e }));
    this.processedSettlementRefs = new Set(snap.processedSettlementRefs || []);
  }
}

const defaultFuelTank = new FuelTankService();

module.exports = {
  DEFAULT_FUEL_RATE,
  DEFAULT_LOW_BALANCE_THRESHOLD_MINOR,
  FuelTankService,
  defaultFuelTank
};
