/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION SERVICE
 * Master Software Orchestrator for Sovereign Multi-Rail Payments
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 4 & 5 + Part 6 Commercial Revenue Engine (2%)
 * Controlled Pilot Mandate: Idempotency, Observability, High-Value Gate & Secret Redaction
 */

const crypto = require("crypto");
const { STATES, recordTransition } = require("./stateMachine");
const { assertZeroCustody } = require("./zeroCustodyEnforcer");
const { getProvider } = require("./adapters");
const { defaultWebhookSecurity } = require("./webhookSecurity");
const { defaultRiskEngine } = require("./riskEngine");
const { defaultReconciliationEngine } = require("./reconciliationEngine");
const { DEFAULT_FUEL_RATE, defaultFuelTank } = require("./fuelTankService");
const { defaultAuditLogger } = require("./auditLogger");
const { defaultFeeEngine } = require("./feeEngine");
const { defaultObservability, redactSecrets } = require("./observability");
const {
  DEFAULT_COMMISSION_RATE,
  BILLING_MODES,
  defaultCommercialAgreementService
} = require("./commercialAgreementService");
const { defaultCommissionProtectionService } = require("./commissionProtectionService");

class FintechOrchestrationService {
  constructor(options = {}) {
    this.merchants = new Map();         // `${tenantId}::${merchantId}` -> merchant profile
    this.intents = new Map();           // intentId -> paymentIntent
    this.virtualAccounts = new Map();   // vanId -> vanObject
    this.idempotencyMap = new Map();    // `${tenantId}::${idempotencyKey}` -> intentId
    this.webhookIdempotencyMap = new Set(); // nonce/eventId deduplication
    this.fuelTank = options.fuelTank || defaultFuelTank;
    this.agreementService = options.agreementService || defaultCommercialAgreementService;
    this.commissionProtection = options.commissionProtection || defaultCommissionProtectionService;
    // Phase 2 #1: Strict signed commercial agreement enforcement ON by default server-side.
    this.strictAgreementMode = options.strictAgreementMode !== false;
    this.repository = options.repository || null;
    if (this.repository && typeof this.repository.registerStateStore === "function") {
      this.repository.registerStateStore("orchestration", this);
    }
  }

  exportSnapshot() {
    return {
      merchants: Array.from(this.merchants.entries()),
      intents: Array.from(this.intents.entries()),
      virtualAccounts: Array.from(this.virtualAccounts.entries()),
      idempotencyMap: Array.from(this.idempotencyMap.entries()),
      webhookIdempotencyMap: Array.from(this.webhookIdempotencyMap.values())
    };
  }

  hydrateSnapshot(snap) {
    if (!snap) return;
    this.merchants = new Map(snap.merchants || []);
    this.intents = new Map(snap.intents || []);
    this.virtualAccounts = new Map(snap.virtualAccounts || []);
    this.idempotencyMap = new Map(snap.idempotencyMap || []);
    this.webhookIdempotencyMap = new Set(snap.webhookIdempotencyMap || []);
  }

  registerMerchant({
    tenantId,
    merchantId,
    legalName,
    corporateBankName = "Customer Corporate Bank",
    destinationBankIban,
    bankCode = "ICICINBB",
    country = "IN",
    currency = "INR",
    preferredBillingMode = BILLING_MODES.PREPAID
  }) {
    if (!tenantId || !merchantId || !legalName || !destinationBankIban) {
      throw new Error("tenantId, merchantId, legalName, and destinationBankIban are required");
    }
    const cleanTenantId = String(tenantId);
    const cleanMerchantId = String(merchantId).trim();
    const rawIban = String(destinationBankIban).trim();
    assertZeroCustody({
      accountType: "STANDARD_MERCHANT_CORPORATE",
      beneficiaryLegalName: legalName,
      isTransactionPrincipal: true,
      destinationBankIban: rawIban
    });

    const ibanHmac = crypto
      .createHash("sha256")
      .update(`${cleanTenantId}:${rawIban}`)
      .digest("hex")
      .slice(0, 16);

    const record = {
      merchantId: cleanMerchantId,
      tenantId: cleanTenantId,
      legalName: String(legalName).trim(),
      corporateBankName: String(corporateBankName).trim(),
      maskedIban: rawIban.length >= 4 ? `****${rawIban.slice(-4)}` : "****",
      ibanDigest: ibanHmac,
      destinationBankIban: rawIban,
      bankCode: String(bankCode).toUpperCase(),
      country: String(country).toUpperCase(),
      currency: String(currency).toUpperCase(),
      preferredBillingMode: preferredBillingMode === BILLING_MODES.POSTPAID ? BILLING_MODES.POSTPAID : BILLING_MODES.PREPAID,
      kybStatus: "REGISTERED_PENDING_AGREEMENT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.merchants.set(`${cleanTenantId}::${cleanMerchantId}`, record);
    return record;
  }

  listMerchants(tenantId) {
    const cleanTenantId = String(tenantId || "");
    return Array.from(this.merchants.values()).filter((m) => m.tenantId === cleanTenantId);
  }

  listPaymentIntents(tenantId) {
    const cleanTenantId = String(tenantId || "");
    return Array.from(this.intents.values()).filter((i) => i.tenantId === cleanTenantId);
  }

  /**
   * Resolves effective contractual rate & billing mode safely with 2.00% (200 bps) default.
   * Strict server-side agreement check cannot be disabled via client request parameters.
   */
  _resolveCommercialContract(tenantId, merchantId, merchantContract = null) {
    const activeAgreement = this.agreementService.getActiveAgreement(tenantId, merchantId);
    if (activeAgreement) {
      return {
        hasApprovedAgreement: true,
        billingMode: activeAgreement.billingMode,
        saasRate: activeAgreement.commissionRate,
        rateBps: activeAgreement.commissionBps,
        taxRate: activeAgreement.taxRate,
        contractVersion: activeAgreement.contractVersion,
        contractId: activeAgreement.contractId
      };
    }

    if (this.strictAgreementMode) {
      this.agreementService.requireActiveAgreement(tenantId, merchantId);
    }

    const customRate =
      merchantContract && merchantContract.saasRate !== undefined && merchantContract.saasRate !== null
        ? Number(merchantContract.saasRate)
        : DEFAULT_COMMISSION_RATE;
    return {
      hasApprovedAgreement: false,
      billingMode: BILLING_MODES.PREPAID,
      saasRate: customRate,
      rateBps: Math.round(customRate * 10000),
      taxRate: (merchantContract && merchantContract.taxRate) || 0,
      contractVersion: (merchantContract && merchantContract.contractVersion) || "RAIPUR-PILOT-STD-200BPS-V1",
      contractId: null
    };
  }

  /**
   * Creates a payment intent after risk evaluation, zero-custody verification,
   * high-value gate inspection, mandatory signed commercial agreement check, and idempotency.
   */
  async createPaymentIntent({
    tenantId = "default_tenant",
    merchantId,
    merchantLegalName,
    destinationBankIban,
    amount,
    currency = "USD",
    originCountry = "US",
    destinationCountry = "AE",
    selectedRail = "FEDWIRE",
    preferredProvider = "mock_sovereign_bank",
    idempotencyKey,
    merchantContract = null
  }) {
    if (!merchantId || !amount || !destinationBankIban) {
      throw new Error("merchantId, amount, and destinationBankIban are mandatory");
    }

    const cleanTenantId = String(tenantId || "default_tenant");
    const idemScopeKey = idempotencyKey ? `${cleanTenantId}::${idempotencyKey}` : null;

    // 0. Idempotency Check (Tenant-Scoped)
    if (idemScopeKey && this.idempotencyMap.has(idemScopeKey)) {
      const existingIntentId = this.idempotencyMap.get(idemScopeKey);
      const existingIntent = this.intents.get(existingIntentId);
      if (existingIntent && existingIntent.tenantId === cleanTenantId) {
        defaultAuditLogger.logEvent({
          transactionId: existingIntentId,
          action: "IDEMPOTENT_RETRY_INTERCEPTED",
          oldState: existingIntent.status,
          newState: existingIntent.status,
          payload: { tenantId: cleanTenantId, idempotencyKey, returnedExistingIntentId: existingIntentId }
        });
        return existingIntent;
      }
    }

    // 1. Zero-Custody Hard Check
    assertZeroCustody({
      accountType: "STANDARD_MERCHANT_CORPORATE",
      beneficiaryLegalName: merchantLegalName,
      isTransactionPrincipal: true,
      destinationBankIban
    });

    // 2. Resolve Commercial Contract & Rate (2.00% = 200 bps default; unconditionally enforced in strictAgreementMode)
    const contractInfo = this._resolveCommercialContract(
      cleanTenantId,
      merchantId,
      merchantContract
    );

    // 3. SaaS Fuel Tank Pre-Flight Check (Graceful pause at zero balance in PREPAID mode)
    const fuelBalance = this.fuelTank.getBalance(merchantId, cleanTenantId);
    if (
      this.strictAgreementMode &&
      contractInfo.billingMode === BILLING_MODES.PREPAID &&
      !this.fuelTank.hasSufficientFuel(merchantId, cleanTenantId)
    ) {
      throw new Error(
        `SAAS_FUEL_DEPLETED: Prepaid SaaS software credits are zero for merchant "${merchantId}". Orchestration paused gracefully; existing bank funds remain untouched.`
      );
    }

    // 4. Risk Engine Pre-Evaluation
    const risk = defaultRiskEngine.evaluateRisk({
      amount,
      currency,
      originCountry,
      destinationCountry
    });

    if (!risk.allowed) {
      throw new Error(`RISK_EVALUATION_FAILED: Payment intent rejected with risk level ${risk.riskLevel} (${risk.flags.join(", ")})`);
    }

    const intentId = `pi_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const paymentReference = `GAR-${intentId.slice(3, 11).toUpperCase()}`;

    // 5. High-Value Commercial Transaction Gate (Section 14)
    const highValueEvaluation = defaultObservability.evaluateHighValueGate({
      amount,
      currency,
      merchantId,
      transactionId: intentId
    });

    const intent = {
      id: intentId,
      tenantId: cleanTenantId,
      merchantId,
      merchantLegalName,
      destinationBankIban,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      originCountry: originCountry.toUpperCase(),
      destinationCountry: destinationCountry.toUpperCase(),
      selectedRail: selectedRail.toUpperCase(),
      preferredProvider,
      paymentReference,
      status: STATES.INITIATED,
      riskScore: risk.score,
      riskLevel: risk.riskLevel,
      fuelBalanceAtCreation: fuelBalance,
      billingMode: contractInfo.billingMode,
      appliedRate: contractInfo.saasRate,
      appliedRateBps: contractInfo.rateBps,
      contractVersion: contractInfo.contractVersion,
      contractId: contractInfo.contractId,
      isHighValue: highValueEvaluation.isHighValue,
      highValueSafety: highValueEvaluation,
      idempotencyKey: idempotencyKey || intentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.intents.set(intentId, intent);
    if (idemScopeKey) {
      this.idempotencyMap.set(idemScopeKey, intentId);
    }

    // Audit Log
    defaultAuditLogger.logEvent({
      transactionId: intentId,
      action: "PAYMENT_INTENT_CREATED",
      oldState: "NONE",
      newState: STATES.INITIATED,
      payload: redactSecrets(intent)
    });

    return intent;
  }

  /**
   * Provisions Virtual Account Number (VAN) or Payment Instruction via Bank Adapter
   */
  async provisionPaymentInstructions(intentId, tenantId = null) {
    const intent = this.intents.get(intentId);
    if (!intent) {
      throw new Error(`PAYMENT_INTENT_NOT_FOUND: ${intentId}`);
    }
    if (tenantId && intent.tenantId !== String(tenantId)) {
      throw new Error("TENANT_ISOLATION_VIOLATION: Access denied for this payment intent");
    }

    const provider = getProvider(intent.preferredProvider);
    const startMs = Date.now();

    try {
      // 1. Request VAN from Provider
      const vanResponse = await provider.createVirtualAccount({
        merchantId: intent.merchantId,
        currency: intent.currency,
        amount: intent.amount
      });

      // 2. Request Wire Instructions
      const instructions = await provider.createPaymentInstruction({
        paymentIntentId: intentId,
        currency: intent.currency,
        amount: intent.amount,
        selectedRail: intent.selectedRail
      });

      defaultObservability.recordLatency(intent.preferredProvider, Date.now() - startMs);

      // 3. Calculate Itemized Fees using intent's contractual rate & version
      const feeBreakdown = defaultFeeEngine.calculateFees({
        amount: intent.amount,
        currency: intent.currency,
        clearingRail: intent.selectedRail,
        merchantContract: {
          saasRate: intent.appliedRate,
          contractVersion: intent.contractVersion
        }
      });

      // State Transition
      recordTransition(intent.status, STATES.PAYMENT_INSTRUCTION_CREATED, {
        transactionId: intentId,
        providerReference: vanResponse.vanIdentifier
      });

      intent.status = STATES.PAYMENT_INSTRUCTION_CREATED;
      intent.van = vanResponse;
      intent.instructions = instructions;
      intent.fees = feeBreakdown;
      intent.updatedAt = new Date().toISOString();

      defaultAuditLogger.logEvent({
        transactionId: intentId,
        action: "PAYMENT_INSTRUCTION_PROVISIONED",
        oldState: STATES.INITIATED,
        newState: STATES.PAYMENT_INSTRUCTION_CREATED,
        providerReference: vanResponse.vanIdentifier,
        payload: redactSecrets({ van: vanResponse, instructions })
      });

      return {
        intentId,
        status: intent.status,
        van: vanResponse,
        instructions,
        fees: feeBreakdown
      };
    } catch (err) {
      defaultObservability.recordApiFailure(intent.preferredProvider, "provisionPaymentInstructions", err);
      throw err;
    }
  }

  /**
   * Ingests and processes an incoming bank settlement webhook
   */
  async handleBankWebhook(providerId, { rawPayload, signatureHeader, secretKey, nonce, eventPayload }) {
    // 0. Deduplication / Idempotency check on webhook event ID or Nonce
    const dedupeKey = nonce || (eventPayload && (eventPayload.providerTxId || eventPayload.id));
    if (dedupeKey && this.webhookIdempotencyMap.has(dedupeKey)) {
      defaultObservability.metrics.duplicateEvents += 1;
      return {
        success: true,
        status: "DUPLICATE_IGNORED",
        message: "Webhook event previously processed idempotently",
        dedupeKey
      };
    }

    // 1. Cryptographic Security Check
    try {
      defaultWebhookSecurity.verifyWebhook({
        rawPayload,
        signatureHeader,
        secretKey,
        nonce
      });
    } catch (secErr) {
      defaultObservability.recordWebhookFailure(
        secErr.message.includes("Expired") ? "expiredTimestamp" :
        secErr.message.includes("Future") ? "futureTimestamp" :
        secErr.message.includes("Replayed") ? "replayedNonce" : "invalidSignature",
        { providerId, error: secErr.message, nonce }
      );
      throw secErr;
    }

    if (dedupeKey) {
      this.webhookIdempotencyMap.add(dedupeKey);
    }

    // 2. Extract Event Details
    const { paymentIntentId, providerTxId, amount, currency, bankReference, settledAt, isReversal, isReturn } = eventPayload;

    const intent = this.intents.get(paymentIntentId);

    // 3. Reconcile Event
    const recon = defaultReconciliationEngine.reconcile(intent, {
      providerTxId,
      amount,
      currency,
      paymentReference: intent?.paymentReference,
      bankReference,
      settledAt,
      isReversal,
      isReturn
    });

    if (!recon.canSettle || recon.status === STATES.MANUAL_REVIEW) {
      if (intent) {
        const previousStatus = intent.status;
        intent.status = recon.status;
        intent.reconciliationNotes = recon.reason;
        intent.updatedAt = new Date().toISOString();

        // Trigger refund/reversal commission adjustment if previously settled
        if ((recon.status === STATES.REVERSED || recon.status === STATES.RETURNED) && previousStatus === STATES.SETTLED) {
          if (intent.billingMode === BILLING_MODES.POSTPAID) {
            try {
              this.commissionProtection.recordRefundOrReversalAdjustment({
                tenantId: intent.tenantId,
                merchantId: intent.merchantId,
                transactionId: intent.id,
                adjustedPrincipalAmount: intent.amount,
                bankAdjustmentRef: bankReference || providerTxId,
                isReversal: recon.status === STATES.REVERSED,
                reason: recon.reason
              });
            } catch (_) { /* no postpaid accrual present */ }
          } else {
            this.fuelTank.creditRefundAdjustment(
              intent.merchantId,
              intent.amount,
              intent.appliedRate || DEFAULT_FUEL_RATE,
              {
                tenantId: intent.tenantId !== "default_tenant" ? intent.tenantId : null,
                transactionId: intent.id,
                bankSettlementRef: bankReference || providerTxId,
                contractVersion: intent.contractVersion,
                isReversal: recon.status === STATES.REVERSED
              }
            );
          }
        }
      }

      defaultObservability.recordManualReview(paymentIntentId || "UNKNOWN", recon.reason, amount);

      defaultAuditLogger.logEvent({
        transactionId: paymentIntentId || "UNKNOWN",
        action: "RECONCILIATION_FLAGGED_FOR_MANUAL_REVIEW",
        oldState: intent ? intent.status : "NONE",
        newState: recon.status,
        providerReference: providerTxId,
        payload: redactSecrets({ recon, eventPayload })
      });

      return {
        success: false,
        status: recon.status,
        reason: recon.reason
      };
    }

    // 4. State Transition to SETTLED
    recordTransition(intent.status, STATES.SETTLED, {
      transactionId: intent.id,
      providerReference: providerTxId,
      providerConfirmed: true
    });

    intent.status = STATES.SETTLED;
    intent.settledAt = recon.settledAt;
    intent.providerTxId = providerTxId;
    intent.bankSettlementRef = bankReference || providerTxId;
    intent.updatedAt = new Date().toISOString();

    const effectiveRate = intent.appliedRate !== undefined ? intent.appliedRate : DEFAULT_COMMISSION_RATE;
    const settledRef = bankReference || providerTxId;

    // 5. Commercial Revenue Execution (Mode A Prepaid Fuel Tank vs Mode B Postpaid Receivables)
    let saasFeeDeducted = 0;
    if (intent.billingMode === BILLING_MODES.POSTPAID) {
      const accrual = this.commissionProtection.accrueCommissionFromSettlement({
        tenantId: intent.tenantId,
        merchantId: intent.merchantId,
        merchantLegalName: intent.merchantLegalName,
        destinationBankIban: intent.destinationBankIban,
        transactionId: intent.id,
        bankSettlementRef: settledRef,
        settlementDate: recon.settledAt,
        settledPrincipalAmount: intent.amount,
        currency: intent.currency,
        providerConfirmed: true,
        requireActiveAgreement: this.strictAgreementMode || Boolean(intent.contractId)
      });
      intent.commissionRecord = accrual.commissionRecord;
      saasFeeDeducted = accrual.commissionRecord.commissionFee;
    } else {
      const saasDeduction = this.fuelTank.deductSaaSFee(
        intent.merchantId,
        intent.amount,
        effectiveRate,
        {
          tenantId: this.strictAgreementMode || intent.contractId ? intent.tenantId : null,
          transactionId: intent.id,
          bankSettlementRef: settledRef,
          contractVersion: intent.contractVersion,
          requireBankEvidence: true
        }
      );
      intent.saasDeduction = saasDeduction;
      saasFeeDeducted = saasDeduction.feeDeducted;
    }

    // Audit Log
    defaultAuditLogger.logEvent({
      transactionId: intent.id,
      action: "SETTLEMENT_VERIFIED_AND_RECONCILED",
      oldState: STATES.PAYMENT_INSTRUCTION_CREATED,
      newState: STATES.SETTLED,
      providerReference: providerTxId,
      payload: redactSecrets({
        settlement: recon,
        billingMode: intent.billingMode,
        appliedRateBps: intent.appliedRateBps,
        contractVersion: intent.contractVersion,
        saasFeeDeducted,
        merchantNetRetained: intent.amount
      })
    });

    return {
      success: true,
      status: STATES.SETTLED,
      paymentIntentId: intent.id,
      providerTxId,
      bankSettlementRef: settledRef,
      amountSettledToMerchantBank: intent.amount,
      currency: intent.currency,
      billingMode: intent.billingMode,
      appliedRateBps: intent.appliedRateBps,
      contractVersion: intent.contractVersion,
      saasFeeDeducted
    };
  }

  getPaymentIntent(intentId, tenantId = null) {
    const intent = this.intents.get(intentId) || null;
    if (!intent) return null;
    if (tenantId && intent.tenantId !== String(tenantId)) {
      return null;
    }
    return intent;
  }
}

const defaultOrchestrationService = new FintechOrchestrationService();

module.exports = {
  FintechOrchestrationService,
  defaultOrchestrationService
};
