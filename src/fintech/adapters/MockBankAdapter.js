/**
 * 🦅 GARUDA OS — MOCK BANK ADAPTER (TESTING & SANDBOX HARNESS)
 * Safe In-Memory Simulation Adapter for Unit & Integration Testing
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 10
 * Complete 10-Capability Provider Interface Implementation
 */

const crypto = require("crypto");
const { PaymentProviderAdapter, PROVIDER_STATUSES } = require("./PaymentProviderAdapter");

class MockBankAdapter extends PaymentProviderAdapter {
  constructor() {
    super("mock_sovereign_bank", "GARUDA Mock Interbank Simulator", PROVIDER_STATUSES.MOCK, "mock");
    this.settledTransactions = new Map();
    this.virtualAccounts = new Map();
    this.paymentInstructions = new Map();
  }

  getSupportedRails() {
    return ["FEDWIRE", "ACH", "FPS", "SEPA_INSTANT", "UAE_IPI", "RTGS"];
  }

  getSupportedCurrencies() {
    return ["USD", "GBP", "EUR", "AED", "INR"];
  }

  // 1. createVirtualAccount
  async createVirtualAccount({ merchantId, currency = "USD", amount }) {
    const timestamp = Date.now();
    const hash = crypto.createHash("md5").update(`${merchantId}:${currency}:${timestamp}`).digest("hex").slice(0, 8);
    const vanIdentifier = `VAN-SIM-${currency}-${hash.toUpperCase()}`;

    const van = {
      providerId: this.providerId,
      vanIdentifier,
      currency,
      routingCode: "SIM00123",
      beneficiaryBank: "Mock Central Clearing Bank",
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    };

    this.virtualAccounts.set(vanIdentifier, van);
    return van;
  }

  // 2. getVirtualAccountStatus
  async getVirtualAccountStatus(vanIdentifier) {
    const van = this.virtualAccounts.get(vanIdentifier);
    if (!van) {
      return {
        providerId: this.providerId,
        vanIdentifier,
        status: "NOT_FOUND",
        active: false
      };
    }
    return {
      providerId: this.providerId,
      vanIdentifier,
      status: van.status,
      active: van.status === "ACTIVE",
      expiresAt: van.expiresAt
    };
  }

  // 3. getTransactionStatus
  async getTransactionStatus(providerTxId) {
    if (this.settledTransactions.has(providerTxId)) {
      const tx = this.settledTransactions.get(providerTxId);
      return {
        providerId: this.providerId,
        providerTxId,
        status: tx.status,
        amount: tx.confirmedAmount,
        currency: tx.currency,
        settledAt: tx.settledAt
      };
    }
    return {
      providerId: this.providerId,
      providerTxId,
      status: "PENDING_SIMULATION",
      amount: 0
    };
  }

  // 4. getSettlementStatus
  async getSettlementStatus(providerTxId) {
    if (this.settledTransactions.has(providerTxId)) {
      return this.settledTransactions.get(providerTxId);
    }
    return {
      providerTxId,
      status: "PENDING_SIMULATION",
      confirmedAmount: 0
    };
  }

  // 5. processWebhook
  async processWebhook(rawPayload, headers, secretKey) {
    const isValid = await this.verifyWebhook(rawPayload, headers, secretKey);
    if (!isValid) {
      this.lastFailedEvent = {
        timestamp: new Date().toISOString(),
        reason: "INVALID_SIGNATURE"
      };
      throw new Error("MOCK_WEBHOOK_VERIFICATION_FAILED: Signature mismatch");
    }

    const payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
    const event = {
      providerId: this.providerId,
      paymentIntentId: payload.paymentIntentId || payload.id,
      providerTxId: payload.providerTxId || `sim_tx_${Date.now()}`,
      amount: payload.amount,
      currency: payload.currency,
      bankReference: payload.bankReference || "SIM-REF-MOCK",
      settledAt: payload.settledAt || new Date().toISOString(),
      isReversal: Boolean(payload.isReversal),
      isReturn: Boolean(payload.isReturn),
      isFailed: Boolean(payload.isFailed),
      errorReason: payload.errorReason || null
    };

    this.lastSuccessfulEvent = {
      timestamp: new Date().toISOString(),
      eventId: event.providerTxId,
      action: payload.isReversal ? "REVERSAL" : payload.isReturn ? "RETURN" : "SETTLEMENT"
    };

    return event;
  }

  // 6. verifyWebhook
  async verifyWebhook(rawPayload, headers, secretKey) {
    const signature = headers["x-mock-signature"] || headers["x-webhook-signature"] || headers["x-signature"];
    if (!signature) return false;

    // Support timestamp-signed header t=...,v1=... format or raw hex
    let signatureToMatch = signature;
    let payloadToHash = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);

    if (signature.includes("v1=")) {
      const matchT = signature.match(/t=([^,]+)/);
      const matchV1 = signature.match(/v1=([^,]+)/);
      if (matchT && matchV1) {
        payloadToHash = `${matchT[1]}.${payloadToHash}`;
        signatureToMatch = matchV1[1];
      }
    }

    const expected = crypto.createHmac("sha256", secretKey).update(payloadToHash).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(signatureToMatch), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  // 7. reconcileTransaction
  async reconcileTransaction(localRecord, providerRecord) {
    if (!localRecord || !providerRecord) {
      return {
        matched: false,
        reason: "MISSING_RECORD_PAIR",
        outcome: "MANUAL_REVIEW"
      };
    }

    const amountMatch = Number(localRecord.amount) === Number(providerRecord.amount);
    const currencyMatch = String(localRecord.currency).toUpperCase() === String(providerRecord.currency).toUpperCase();

    if (amountMatch && currencyMatch) {
      return {
        matched: true,
        outcome: "MATCHED_EXACT",
        providerTxId: providerRecord.providerTxId,
        settledAmount: providerRecord.amount
      };
    }

    return {
      matched: false,
      reason: !amountMatch ? "AMOUNT_MISMATCH" : "CURRENCY_MISMATCH",
      outcome: "MANUAL_REVIEW"
    };
  }

  // 8. handleReturn
  async handleReturn(returnEvent) {
    return {
      handled: true,
      action: "RETURN_RECORDED",
      providerTxId: returnEvent.providerTxId,
      reason: returnEvent.reason || "INTERBANK_RETURN_MOCK",
      timestamp: new Date().toISOString()
    };
  }

  // 9. handleReversal
  async handleReversal(reversalEvent) {
    return {
      handled: true,
      action: "REVERSAL_RECORDED",
      providerTxId: reversalEvent.providerTxId,
      reason: reversalEvent.reason || "CENTRAL_CLEARING_REVERSAL_MOCK",
      timestamp: new Date().toISOString()
    };
  }

  // 10. healthCheck
  async healthCheck() {
    this.lastHealthCheck = new Date().toISOString();
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      status: "HEALTHY",
      operationalStatus: this.operationalStatus,
      environment: this.environment,
      latencyMs: 1,
      timestamp: this.lastHealthCheck,
      details: "Mock interbank simulation harness operating normally"
    };
  }

  // Payment Instruction creation
  async createPaymentInstruction({ paymentIntentId, currency, amount, selectedRail }) {
    const instruction = {
      providerId: this.providerId,
      paymentIntentId,
      clearingRail: selectedRail,
      wireInstructions: {
        accountName: "Client Master Corporate Account (Mock Beneficiary)",
        accountNumber: `SIM-${Math.floor(10000000 + Math.random() * 90000000)}`,
        routingIdentifier: "ROUTING-SIM-999",
        referenceCode: `REF-${paymentIntentId.slice(0, 10).toUpperCase()}`
      },
      estimatedSettlementWindow: "5 - 15 Minutes (Simulated)",
      status: "INSTRUCTION_DISPATCHED",
      createdAt: new Date().toISOString()
    };

    this.paymentInstructions.set(paymentIntentId, instruction);
    return instruction;
  }

  // Testing helper: simulate incoming bank confirmation
  simulateSettlement(providerTxId, amount, currency) {
    const record = {
      providerTxId,
      status: "SETTLED",
      confirmedAmount: amount,
      currency,
      settledAt: new Date().toISOString()
    };
    this.settledTransactions.set(providerTxId, record);
    return record;
  }
}

module.exports = { MockBankAdapter };
