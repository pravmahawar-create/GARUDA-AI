/**
 * 🦅 GARUDA OS — DETERMINISTIC RECONCILIATION ENGINE
 * Strict Verification of Inward Bank Settlement vs Payment Intent
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 13
 */

const { STATES } = require("./stateMachine");

const RECONCILIATION_OUTCOMES = Object.freeze({
  MATCHED_EXACT: "MATCHED_EXACT",
  PARTIAL_PAYMENT: "PARTIAL_PAYMENT",
  OVERPAYMENT: "OVERPAYMENT",
  CURRENCY_MISMATCH: "CURRENCY_MISMATCH",
  REFERENCE_MISMATCH: "REFERENCE_MISMATCH",
  LATE_ARRIVAL: "LATE_ARRIVAL",
  DUPLICATE_SETTLEMENT: "DUPLICATE_SETTLEMENT",
  REVERSED: "REVERSED",
  RETURNED: "RETURNED",
  UNKNOWN_PAYMENT: "UNKNOWN_PAYMENT"
});

class ReconciliationEngine {
  constructor() {
    this.settledLedger = new Map(); // providerTxId -> record
  }

  /**
   * Reconciles an incoming bank settlement event against a known payment intent
   * @param {object} intent - Stored payment intent
   * @param {object} bankEvent - Verified bank telemetry event
   * @returns {object} Reconciliation decision & recommended state transition
   */
  reconcile(intent, bankEvent) {
    if (!bankEvent || typeof bankEvent !== "object") {
      return {
        outcome: RECONCILIATION_OUTCOMES.UNKNOWN_PAYMENT,
        status: STATES.MANUAL_REVIEW,
        reason: "MISSING_BANK_EVENT_PAYLOAD",
        canSettle: false
      };
    }

    const providerTxId = bankEvent.providerTxId || bankEvent.bankReference;
    if (!providerTxId) {
      return {
        outcome: RECONCILIATION_OUTCOMES.UNKNOWN_PAYMENT,
        status: STATES.MANUAL_REVIEW,
        reason: "MISSING_PROVIDER_TX_IDENTIFIER",
        canSettle: false
      };
    }

    // 1. Duplicate Settlement Check
    if (this.settledLedger.has(providerTxId)) {
      return {
        outcome: RECONCILIATION_OUTCOMES.DUPLICATE_SETTLEMENT,
        status: STATES.MANUAL_REVIEW,
        reason: `DUPLICATE_SETTLEMENT: Provider Tx ID ${providerTxId} was already settled`,
        canSettle: false,
        existingRecord: this.settledLedger.get(providerTxId)
      };
    }

    // 2. Unknown Intent Check
    if (!intent) {
      return {
        outcome: RECONCILIATION_OUTCOMES.UNKNOWN_PAYMENT,
        status: STATES.MANUAL_REVIEW,
        reason: "UNKNOWN_INTENT: Settlement received with no matching payment intent",
        canSettle: false
      };
    }

    // 3. Bank Return or Reversal Event
    if (bankEvent.isReversal) {
      return {
        outcome: RECONCILIATION_OUTCOMES.REVERSED,
        status: STATES.REVERSED,
        reason: "INTERBANK_REVERSAL_CONFIRMED",
        canSettle: false
      };
    }

    if (bankEvent.isReturn) {
      return {
        outcome: RECONCILIATION_OUTCOMES.RETURNED,
        status: STATES.RETURNED,
        reason: "INTERBANK_RETURN_CONFIRMED",
        canSettle: false
      };
    }

    // 4. Currency Mismatch Check
    const expectedCurrency = String(intent.currency || "").toUpperCase();
    const actualCurrency = String(bankEvent.currency || "").toUpperCase();
    if (expectedCurrency !== actualCurrency) {
      return {
        outcome: RECONCILIATION_OUTCOMES.CURRENCY_MISMATCH,
        status: STATES.MANUAL_REVIEW,
        reason: `CURRENCY_MISMATCH: Expected ${expectedCurrency}, Received ${actualCurrency}`,
        canSettle: false
      };
    }

    // 5. Reference Verification
    if (intent.paymentReference && bankEvent.paymentReference) {
      if (intent.paymentReference.trim() !== bankEvent.paymentReference.trim()) {
        return {
          outcome: RECONCILIATION_OUTCOMES.REFERENCE_MISMATCH,
          status: STATES.MANUAL_REVIEW,
          reason: `REFERENCE_MISMATCH: Expected ${intent.paymentReference}, Received ${bankEvent.paymentReference}`,
          canSettle: false
        };
      }
    }

    // 6. Expiry / Late Arrival Check
    if (intent.expiresAt) {
      const expiry = new Date(intent.expiresAt).getTime();
      const settlementTime = new Date(bankEvent.settledAt || Date.now()).getTime();
      if (settlementTime > expiry) {
        return {
          outcome: RECONCILIATION_OUTCOMES.LATE_ARRIVAL,
          status: STATES.MANUAL_REVIEW,
          reason: `LATE_ARRIVAL: Funds settled after VAN expiration timestamp`,
          canSettle: false
        };
      }
    }

    // 7. Amount Comparison
    const expectedAmount = Number(intent.amount);
    const actualAmount = Number(bankEvent.amount);
    const diff = Math.round((actualAmount - expectedAmount) * 100) / 100;

    if (diff < -0.01) {
      // Partial payment
      return {
        outcome: RECONCILIATION_OUTCOMES.PARTIAL_PAYMENT,
        status: STATES.MANUAL_REVIEW,
        reason: `PARTIAL_PAYMENT: Expected ${expectedAmount}, Received ${actualAmount} (Deficit: ${Math.abs(diff)})`,
        canSettle: false,
        receivedAmount: actualAmount,
        expectedAmount
      };
    }

    if (diff > 0.01) {
      // Overpayment
      return {
        outcome: RECONCILIATION_OUTCOMES.OVERPAYMENT,
        status: STATES.MANUAL_REVIEW,
        reason: `OVERPAYMENT: Expected ${expectedAmount}, Received ${actualAmount} (Surplus: ${diff})`,
        canSettle: false,
        receivedAmount: actualAmount,
        expectedAmount
      };
    }

    // 8. EXACT MATCH CONFIRMED
    const reconciliationRecord = {
      outcome: RECONCILIATION_OUTCOMES.MATCHED_EXACT,
      status: STATES.SETTLED,
      reason: "EXACT_INTERBANK_MATCH",
      canSettle: true,
      amount: actualAmount,
      currency: actualCurrency,
      providerTxId,
      settledAt: bankEvent.settledAt || new Date().toISOString()
    };

    // Store in settled ledger to prevent future duplicate processing
    this.settledLedger.set(providerTxId, reconciliationRecord);

    return reconciliationRecord;
  }
}

const defaultReconciliationEngine = new ReconciliationEngine();

module.exports = {
  RECONCILIATION_OUTCOMES,
  ReconciliationEngine,
  defaultReconciliationEngine
};
