const crypto = require('crypto');
const paymentWebhookService = require('../services/paymentWebhookService');

/**
 * GARUDA Governed Revenue Execution Adapter
 * Connects task execution to Revenue Engine states (WORK_COMPLETED, DELIVERY_SUBMITTED, CLIENT_ACCEPTED, PAYMENT_VERIFIED)
 * enforcing strict anti-fabrication laws and duplicate payment protection.
 */
const REVENUE_STATES = Object.freeze({
  OPPORTUNITY: 'OPPORTUNITY',
  QUALIFIED: 'QUALIFIED',
  APPROVED: 'APPROVED',
  EXECUTING: 'EXECUTING',
  WORK_COMPLETED: 'WORK_COMPLETED',
  DELIVERY_SUBMITTED: 'DELIVERY_SUBMITTED',
  CLIENT_ACCEPTED: 'CLIENT_ACCEPTED',
  PAYMENT_CLAIMED: 'PAYMENT_CLAIMED',
  PAYMENT_EVIDENCE_UNVERIFIED: 'PAYMENT_EVIDENCE_UNVERIFIED',
  PAYMENT_VERIFICATION_PENDING: 'PAYMENT_VERIFICATION_PENDING',
  PAYMENT_VERIFIED: 'PAYMENT_VERIFIED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_MISMATCH: 'PAYMENT_MISMATCH',
  PAYMENT_DUPLICATE: 'PAYMENT_DUPLICATE',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  REVENUE_REALIZED: 'REVENUE_REALIZED',
  REVENUE_CLOSED: 'REVENUE_CLOSED'
});

class RevenueExecutionAdapter {
  constructor(options = {}) {
    this.paymentWebhookService = options.paymentWebhookService || paymentWebhookService;
    this.processedPayments = new Set(); // Duplicate payment ledger protection
  }

  /**
   * Helper: Record user text claim ("I paid") safely without marking payment verified.
   */
  recordPaymentClaim(opportunityId, textClaim = '') {
    return {
      success: true,
      opportunityId,
      status: REVENUE_STATES.PAYMENT_CLAIMED,
      textClaim,
      signatureVerified: false,
      isRealRevenue: false,
      note: 'User text claim recorded; provider HMAC verification is still required before revenue realization.'
    };
  }

  /**
   * Helper: Record uploaded screenshot or receipt evidence safely without marking payment verified.
   */
  recordPaymentEvidence(opportunityId, imageOrDoc = {}) {
    return {
      success: true,
      opportunityId,
      status: REVENUE_STATES.PAYMENT_EVIDENCE_UNVERIFIED,
      evidenceFile: imageOrDoc.path || imageOrDoc.filename || 'uploaded_evidence',
      signatureVerified: false,
      isRealRevenue: false,
      note: 'Screenshot/receipt evidence stored; screenshots DO NOT constitute authoritative payment verification.'
    };
  }

  /**
   * Helper: Validates expected vs received amount and currency.
   */
  validatePaymentAmountAndCurrency(expected = {}, received = {}) {
    const expectedAmount = Number(expected.amount || 0);
    const receivedAmount = Number(received.amount || 0);
    const expectedCurrency = String(expected.currency || 'INR').toUpperCase();
    const receivedCurrency = String(received.currency || 'INR').toUpperCase();

    if (expectedAmount > 0 && Math.abs(expectedAmount - receivedAmount) > 0.01) {
      return {
        valid: false,
        status: REVENUE_STATES.PAYMENT_MISMATCH,
        error: `Payment amount mismatch: Expected ${expectedAmount} ${expectedCurrency}, but received ${receivedAmount} ${receivedCurrency}`,
        errorCode: 'AMOUNT_MISMATCH'
      };
    }

    if (expectedCurrency !== receivedCurrency) {
      return {
        valid: false,
        status: REVENUE_STATES.PAYMENT_MISMATCH,
        error: `Payment currency mismatch: Expected ${expectedCurrency}, but received ${receivedCurrency}`,
        errorCode: 'CURRENCY_MISMATCH'
      };
    }

    return { valid: true };
  }

  /**
   * Validates state machine transition.
   */
  isValidTransition(currentStatus, targetStatus) {
    const validOrder = [
      REVENUE_STATES.OPPORTUNITY,
      REVENUE_STATES.QUALIFIED,
      REVENUE_STATES.APPROVED,
      REVENUE_STATES.EXECUTING,
      REVENUE_STATES.WORK_COMPLETED,
      REVENUE_STATES.DELIVERY_SUBMITTED,
      REVENUE_STATES.CLIENT_ACCEPTED,
      REVENUE_STATES.PAYMENT_VERIFIED,
      REVENUE_STATES.REVENUE_REALIZED
    ];

    const currentIndex = validOrder.indexOf(currentStatus);
    const targetIndex = validOrder.indexOf(targetStatus);

    if (currentIndex === -1 || targetIndex === -1) return false;
    return targetIndex === currentIndex + 1; // Strict step-by-step progress
  }

  /**
   * Records work completion for a governed revenue task.
   */
  recordWorkCompletion(opportunity = {}) {
    if (!opportunity || !opportunity.id) {
      return { success: false, error: 'Valid opportunity contract required', errorCode: 'INVALID_OPPORTUNITY' };
    }

    const currentStatus = opportunity.status || REVENUE_STATES.EXECUTING;
    if (currentStatus !== REVENUE_STATES.EXECUTING) {
      return { success: false, error: `Invalid transition from ${currentStatus} to WORK_COMPLETED`, errorCode: 'INVALID_STATE_TRANSITION' };
    }

    return {
      success: true,
      opportunityId: opportunity.id,
      status: REVENUE_STATES.WORK_COMPLETED,
      workCompletedAt: new Date().toISOString(),
      summary: 'Task execution completed cleanly'
    };
  }

  /**
   * Submits production delivery artifact separately from work completion.
   */
  submitDelivery(workRecord = {}, deliverableArtifacts = []) {
    if (workRecord.status !== REVENUE_STATES.WORK_COMPLETED) {
      return { success: false, error: 'Delivery submission requires WORK_COMPLETED status', errorCode: 'INVALID_STATE_TRANSITION' };
    }

    if (!Array.isArray(deliverableArtifacts) || deliverableArtifacts.length === 0) {
      return { success: false, error: 'At least one deliverable artifact is required', errorCode: 'MISSING_ARTIFACT' };
    }

    return {
      success: true,
      opportunityId: workRecord.opportunityId,
      status: REVENUE_STATES.DELIVERY_SUBMITTED,
      deliverySubmittedAt: new Date().toISOString(),
      deliverables: deliverableArtifacts.map((art) => ({
        path: art.path || art.reference,
        sha256: art.sha256 || crypto.createHash('sha256').update(JSON.stringify(art)).digest('hex')
      }))
    };
  }

  /**
   * Records explicit client acceptance separately from delivery.
   */
  recordClientAcceptance(deliveryRecord = {}, acceptanceConfirmation = {}) {
    if (deliveryRecord.status !== REVENUE_STATES.DELIVERY_SUBMITTED) {
      return { success: false, error: 'Client acceptance requires DELIVERY_SUBMITTED status', errorCode: 'INVALID_STATE_TRANSITION' };
    }

    if (acceptanceConfirmation.accepted !== true) {
      return { success: false, error: 'Explicit client acceptance confirmation is required', errorCode: 'NOT_ACCEPTED' };
    }

    return {
      success: true,
      opportunityId: deliveryRecord.opportunityId,
      status: REVENUE_STATES.CLIENT_ACCEPTED,
      acceptedAt: new Date().toISOString(),
      feedback: acceptanceConfirmation.feedback || 'Client accepted deliverables without objection'
    };
  }

  /**
   * Authoritatively verifies payment transaction and enforces duplicate payment protection.
   */
  verifyPayment(acceptanceRecord = {}, paymentTransaction = {}) {
    if (acceptanceRecord.status !== REVENUE_STATES.CLIENT_ACCEPTED) {
      return { success: false, error: 'Payment verification requires CLIENT_ACCEPTED status', errorCode: 'INVALID_STATE_TRANSITION' };
    }

    const { paymentId, amount, currency, signatureVerified } = paymentTransaction;

    if (!paymentId || !amount || signatureVerified !== true) {
      return {
        success: false,
        error: 'Authoritative payment verification failed: Missing signature or valid transaction data',
        errorCode: 'UNAUTHORITATIVE_PAYMENT'
      };
    }

    // Duplicate Payment Protection
    if (this.processedPayments.has(paymentId)) {
      return {
        success: false,
        error: `Duplicate payment ID '${paymentId}' rejected. Revenue cannot be double-counted.`,
        errorCode: 'DUPLICATE_PAYMENT_BLOCKED'
      };
    }

    this.processedPayments.add(paymentId);

    return {
      success: true,
      opportunityId: acceptanceRecord.opportunityId,
      status: REVENUE_STATES.PAYMENT_VERIFIED,
      paymentId,
      amount,
      currency: currency || 'INR',
      verifiedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  REVENUE_STATES,
  RevenueExecutionAdapter
};
