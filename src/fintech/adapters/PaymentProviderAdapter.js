/**
 * 🦅 GARUDA OS — PAYMENT PROVIDER ADAPTER INTERFACE
 * Standard Contract for Regulated Banking and Payment Service Providers
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 10 & 11
 * Controlled Pilot Mandate: Section 2 & 3
 */

const PROVIDER_STATUSES = Object.freeze({
  MOCK: "MOCK",
  SANDBOX_READY: "SANDBOX_READY",
  SANDBOX_CONNECTED: "SANDBOX_CONNECTED",
  SANDBOX_VERIFIED: "SANDBOX_VERIFIED",
  LIVE_CREDENTIALS_PENDING: "LIVE_CREDENTIALS_PENDING",
  LIVE_CONNECTED: "LIVE_CONNECTED",
  LIVE_VERIFIED: "LIVE_VERIFIED",

  // Legacy compatibility mappings
  REQUIRES_PROVIDER_CREDENTIALS: "REQUIRES_PROVIDER_CREDENTIALS",
  SANDBOX: "SANDBOX",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED"
});

class PaymentProviderAdapter {
  /**
   * @param {string} providerId
   * @param {string} providerName
   * @param {string} operationalStatus - Member of PROVIDER_STATUSES
   * @param {string} environment - "mock" | "sandbox" | "live"
   */
  constructor(providerId, providerName, operationalStatus, environment = "sandbox") {
    if (!providerId || !providerName || !operationalStatus) {
      throw new Error("Provider ID, Name, and Operational Status are mandatory");
    }
    if (!PROVIDER_STATUSES[operationalStatus]) {
      throw new Error(`Invalid provider operational status: ${operationalStatus}`);
    }

    this.providerId = providerId;
    this.providerName = providerName;
    this.operationalStatus = operationalStatus;
    this.environment = operationalStatus === PROVIDER_STATUSES.MOCK ? "mock" : environment;
    this.lastHealthCheck = null;
    this.lastSuccessfulEvent = null;
    this.lastFailedEvent = null;
  }

  /**
   * Returns canonical operational connectivity status adhering to 7-tier model
   */
  getStatus() {
    let canonicalStatus = this.operationalStatus;
    if (canonicalStatus === PROVIDER_STATUSES.REQUIRES_PROVIDER_CREDENTIALS) {
      canonicalStatus = PROVIDER_STATUSES.SANDBOX_READY;
    } else if (canonicalStatus === PROVIDER_STATUSES.SANDBOX) {
      canonicalStatus = PROVIDER_STATUSES.SANDBOX_CONNECTED;
    }

    return {
      providerId: this.providerId,
      providerName: this.providerName,
      status: canonicalStatus,
      rawStatus: this.operationalStatus,
      environment: this.environment,
      isLive: canonicalStatus === PROVIDER_STATUSES.LIVE_VERIFIED,
      isSandbox: canonicalStatus.startsWith("SANDBOX"),
      isMock: canonicalStatus === PROVIDER_STATUSES.MOCK,
      lastHealthCheck: this.lastHealthCheck,
      lastSuccessfulEvent: this.lastSuccessfulEvent,
      lastFailedEvent: this.lastFailedEvent,
      supportedRails: this.getSupportedRails ? this.getSupportedRails() : [],
      supportedCurrencies: this.getSupportedCurrencies ? this.getSupportedCurrencies() : []
    };
  }

  /**
   * 1. Provisions a dedicated Virtual Account Number (VAN) or payment reference via Bank API
   */
  async createVirtualAccount(params) {
    throw new Error("METHOD_NOT_IMPLEMENTED: createVirtualAccount must be implemented by adapter subclass");
  }

  /**
   * 2. Checks active status of a provisioned Virtual Account Number (VAN)
   */
  async getVirtualAccountStatus(vanIdentifier) {
    throw new Error("METHOD_NOT_IMPLEMENTED: getVirtualAccountStatus must be implemented by adapter subclass");
  }

  /**
   * 3. Retrieves transaction status from provider
   */
  async getTransactionStatus(providerTxId) {
    throw new Error("METHOD_NOT_IMPLEMENTED: getTransactionStatus must be implemented by adapter subclass");
  }

  /**
   * 4. Fetches latest settlement status from provider
   */
  async getSettlementStatus(providerTxId) {
    throw new Error("METHOD_NOT_IMPLEMENTED: getSettlementStatus must be implemented by adapter subclass");
  }

  /**
   * 5. Ingests and adapts provider-specific webhook into unified GARUDA event payload
   */
  async processWebhook(rawPayload, headers, secretKey) {
    throw new Error("METHOD_NOT_IMPLEMENTED: processWebhook must be implemented by adapter subclass");
  }

  /**
   * 6. Verifies incoming webhook signature and payload authenticity
   */
  async verifyWebhook(rawPayload, headers, secretKey) {
    throw new Error("METHOD_NOT_IMPLEMENTED: verifyWebhook must be implemented by adapter subclass");
  }

  /**
   * 7. Reconciles provider settlement statement with internal payment record
   */
  async reconcileTransaction(localRecord, providerRecord) {
    throw new Error("METHOD_NOT_IMPLEMENTED: reconcileTransaction must be implemented by adapter subclass");
  }

  /**
   * 8. Handles provider bank return events
   */
  async handleReturn(returnEvent) {
    throw new Error("METHOD_NOT_IMPLEMENTED: handleReturn must be implemented by adapter subclass");
  }

  /**
   * 9. Handles provider bank reversal / recall events
   */
  async handleReversal(reversalEvent) {
    throw new Error("METHOD_NOT_IMPLEMENTED: handleReversal must be implemented by adapter subclass");
  }

  /**
   * 10. Performs live/sandbox provider connectivity and credential health check
   */
  async healthCheck() {
    throw new Error("METHOD_NOT_IMPLEMENTED: healthCheck must be implemented by adapter subclass");
  }

  /**
   * Generates domestic or cross-border payment instructions
   */
  async createPaymentInstruction(params) {
    throw new Error("METHOD_NOT_IMPLEMENTED: createPaymentInstruction must be implemented by adapter subclass");
  }

  /**
   * Returns supported rails and currencies
   */
  getSupportedRails() {
    throw new Error("METHOD_NOT_IMPLEMENTED: getSupportedRails must be implemented by adapter subclass");
  }

  getSupportedCurrencies() {
    throw new Error("METHOD_NOT_IMPLEMENTED: getSupportedCurrencies must be implemented by adapter subclass");
  }
}

module.exports = {
  PaymentProviderAdapter,
  PROVIDER_STATUSES
};
