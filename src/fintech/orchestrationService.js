/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION SERVICE
 * Master Software Orchestrator for Sovereign Multi-Rail Payments
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 4 & 5
 * Controlled Pilot Mandate: Idempotency, Observability, High-Value Gate & Secret Redaction
 */

const crypto = require("crypto");
const { STATES, recordTransition } = require("./stateMachine");
const { assertZeroCustody } = require("./zeroCustodyEnforcer");
const { getProvider } = require("./adapters");
const { defaultWebhookSecurity } = require("./webhookSecurity");
const { defaultRiskEngine } = require("./riskEngine");
const { defaultReconciliationEngine } = require("./reconciliationEngine");
const { defaultFuelTank } = require("./fuelTankService");
const { defaultAuditLogger } = require("./auditLogger");
const { defaultFeeEngine } = require("./feeEngine");
const { defaultObservability, redactSecrets } = require("./observability");

class FintechOrchestrationService {
  constructor() {
    this.intents = new Map();           // intentId -> paymentIntent
    this.virtualAccounts = new Map();   // vanId -> vanObject
    this.idempotencyMap = new Map();    // idempotencyKey -> intentId
    this.webhookIdempotencyMap = new Set(); // nonce/eventId deduplication
  }

  /**
   * Creates a payment intent after risk evaluation, zero-custody verification,
   * high-value gate inspection, and deterministic idempotency checking.
   */
  async createPaymentIntent({
    merchantId,
    merchantLegalName,
    destinationBankIban,
    amount,
    currency = "USD",
    originCountry = "US",
    destinationCountry = "AE",
    selectedRail = "FEDWIRE",
    preferredProvider = "mock_sovereign_bank",
    idempotencyKey
  }) {
    if (!merchantId || !amount || !destinationBankIban) {
      throw new Error("merchantId, amount, and destinationBankIban are mandatory");
    }

    // 0. Idempotency Check
    if (idempotencyKey && this.idempotencyMap.has(idempotencyKey)) {
      const existingIntentId = this.idempotencyMap.get(idempotencyKey);
      const existingIntent = this.intents.get(existingIntentId);
      if (existingIntent) {
        defaultAuditLogger.logEvent({
          transactionId: existingIntentId,
          action: "IDEMPOTENT_RETRY_INTERCEPTED",
          oldState: existingIntent.status,
          newState: existingIntent.status,
          payload: { idempotencyKey, returnedExistingIntentId: existingIntentId }
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

    // 2. SaaS Fuel Tank Pre-Flight Check
    const fuelBalance = defaultFuelTank.getBalance(merchantId);

    // 3. Risk Engine Pre-Evaluation
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

    // 4. High-Value Commercial Transaction Gate (Section 14)
    const highValueEvaluation = defaultObservability.evaluateHighValueGate({
      amount,
      currency,
      merchantId,
      transactionId: intentId
    });

    const intent = {
      id: intentId,
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
      isHighValue: highValueEvaluation.isHighValue,
      highValueSafety: highValueEvaluation,
      idempotencyKey: idempotencyKey || intentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.intents.set(intentId, intent);
    if (idempotencyKey) {
      this.idempotencyMap.set(idempotencyKey, intentId);
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
  async provisionPaymentInstructions(intentId) {
    const intent = this.intents.get(intentId);
    if (!intent) {
      throw new Error(`PAYMENT_INTENT_NOT_FOUND: ${intentId}`);
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

      // 3. Calculate Itemized Fees
      const feeBreakdown = defaultFeeEngine.calculateFees({
        amount: intent.amount,
        currency: intent.currency,
        clearingRail: intent.selectedRail
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
        intent.status = recon.status;
        intent.reconciliationNotes = recon.reason;
        intent.updatedAt = new Date().toISOString();
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
    intent.updatedAt = new Date().toISOString();

    // 5. Deduct Metered SaaS Software Maintenance Fee from Prepaid Fuel Tank
    const saasDeduction = defaultFuelTank.deductSaaSFee(intent.merchantId, intent.amount);

    intent.saasDeduction = saasDeduction;

    // Audit Log
    defaultAuditLogger.logEvent({
      transactionId: intent.id,
      action: "SETTLEMENT_VERIFIED_AND_RECONCILED",
      oldState: STATES.PAYMENT_INSTRUCTION_CREATED,
      newState: STATES.SETTLED,
      providerReference: providerTxId,
      payload: redactSecrets({
        settlement: recon,
        saasFeeDeducted: saasDeduction.feeDeducted,
        merchantNetRetained: intent.amount
      })
    });

    return {
      success: true,
      status: STATES.SETTLED,
      paymentIntentId: intent.id,
      providerTxId,
      amountSettledToMerchantBank: intent.amount,
      currency: intent.currency,
      saasFeeDeducted: saasDeduction.feeDeducted
    };
  }

  getPaymentIntent(intentId) {
    return this.intents.get(intentId) || null;
  }
}

const defaultOrchestrationService = new FintechOrchestrationService();

module.exports = {
  FintechOrchestrationService,
  defaultOrchestrationService
};
