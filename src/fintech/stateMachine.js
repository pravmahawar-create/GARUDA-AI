/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION STATE MACHINE
 * Deterministic 13-State Transition Engine for High-Value Settlements
 * Spec: GARUDA-FINTECH-SPEC-V2.0
 */

const crypto = require("crypto");

const STATES = Object.freeze({
  INITIATED: "INITIATED",
  PAYMENT_INSTRUCTION_CREATED: "PAYMENT_INSTRUCTION_CREATED",
  PAYMENT_SENT: "PAYMENT_SENT",
  BANK_PROCESSING: "BANK_PROCESSING",
  COMPLIANCE_REVIEW: "COMPLIANCE_REVIEW",
  SETTLEMENT_PENDING: "SETTLEMENT_PENDING",
  SETTLED: "SETTLED",
  FAILED: "FAILED",
  RETURNED: "RETURNED",
  REVERSED: "REVERSED",
  RECALLED: "RECALLED",
  DISPUTED: "DISPUTED",
  MANUAL_REVIEW: "MANUAL_REVIEW"
});

// Deterministic valid state transitions graph
const VALID_TRANSITIONS = Object.freeze({
  [STATES.INITIATED]: [
    STATES.PAYMENT_INSTRUCTION_CREATED,
    STATES.FAILED
  ],
  [STATES.PAYMENT_INSTRUCTION_CREATED]: [
    STATES.PAYMENT_SENT,
    STATES.BANK_PROCESSING,
    STATES.SETTLEMENT_PENDING,
    STATES.SETTLED,
    STATES.FAILED,
    STATES.MANUAL_REVIEW
  ],
  [STATES.PAYMENT_SENT]: [
    STATES.BANK_PROCESSING,
    STATES.COMPLIANCE_REVIEW,
    STATES.SETTLEMENT_PENDING,
    STATES.SETTLED,
    STATES.FAILED,
    STATES.MANUAL_REVIEW
  ],
  [STATES.BANK_PROCESSING]: [
    STATES.COMPLIANCE_REVIEW,
    STATES.SETTLEMENT_PENDING,
    STATES.SETTLED,
    STATES.FAILED,
    STATES.RETURNED,
    STATES.MANUAL_REVIEW
  ],
  [STATES.COMPLIANCE_REVIEW]: [
    STATES.SETTLEMENT_PENDING,
    STATES.FAILED,
    STATES.RETURNED,
    STATES.MANUAL_REVIEW
  ],
  [STATES.SETTLEMENT_PENDING]: [
    STATES.SETTLED,
    STATES.FAILED,
    STATES.RETURNED,
    STATES.MANUAL_REVIEW
  ],
  [STATES.SETTLED]: [
    STATES.REVERSED,
    STATES.RECALLED,
    STATES.DISPUTED
  ],
  [STATES.FAILED]: [
    // Terminal or manual forensic review only. Cannot directly transition to SETTLED without bank proof
    STATES.MANUAL_REVIEW
  ],
  [STATES.RETURNED]: [
    STATES.MANUAL_REVIEW
  ],
  [STATES.REVERSED]: [
    STATES.DISPUTED,
    STATES.MANUAL_REVIEW
  ],
  [STATES.RECALLED]: [
    STATES.DISPUTED,
    STATES.MANUAL_REVIEW
  ],
  [STATES.DISPUTED]: [
    STATES.MANUAL_REVIEW
  ],
  [STATES.MANUAL_REVIEW]: [
    // Administrative resolution allowed only with verified provider evidence
    STATES.SETTLED,
    STATES.FAILED,
    STATES.RETURNED
  ]
});

/**
 * Validates a proposed state transition
 * @param {string} currentState
 * @param {string} nextState
 * @param {object} context - Execution context (actor, providerEvidence, reason)
 * @returns {boolean}
 */
function validateTransition(currentState, nextState, context = {}) {
  if (!STATES[currentState]) {
    throw new Error(`INVALID_CURRENT_STATE: Unknown state "${currentState}"`);
  }
  if (!STATES[nextState]) {
    throw new Error(`INVALID_NEXT_STATE: Unknown state "${nextState}"`);
  }

  // Reject self-transitions as redundant
  if (currentState === nextState) {
    return true;
  }

  // HARD LOCK: Never allow transition from SETTLED back to INITIATED
  if (currentState === STATES.SETTLED && nextState === STATES.INITIATED) {
    throw new Error("ILLEGAL_TRANSITION: SETTLED transactions can never revert to INITIATED");
  }

  // 1. Structural State Machine Transition Validation
  const allowed = VALID_TRANSITIONS[currentState] || [];
  if (!allowed.includes(nextState)) {
    throw new Error(
      `DISALLOWED_TRANSITION: Cannot transition from "${currentState}" to "${nextState}". Allowed transitions: [${allowed.join(", ")}]`
    );
  }

  // 2. HARD LOCK: Never allow client-side JavaScript or unverified callers to mark SETTLED
  if (nextState === STATES.SETTLED) {
    if (!context.providerConfirmed && !context.adminOverrideWithEvidence) {
      throw new Error("UNAUTHORIZED_SETTLEMENT: Transition to SETTLED requires verified provider/bank confirmation");
    }
  }

  return true;
}

/**
 * Creates an immutable state transition record
 */
function recordTransition(currentState, nextState, details = {}) {
  validateTransition(currentState, nextState, details);

  const timestamp = new Date().toISOString();
  const transitionHash = crypto
    .createHash("sha256")
    .update(`${details.transactionId}:${currentState}:${nextState}:${timestamp}:${details.providerReference || "NONE"}`)
    .digest("hex");

  return {
    transactionId: details.transactionId,
    previousState: currentState,
    newState: nextState,
    actor: details.actor || "GARUDA_ORCHESTRATION_CORE",
    providerReference: details.providerReference || null,
    reason: details.reason || "STANDARD_CLEARING_PROGRESSION",
    timestamp,
    transitionHash
  };
}

module.exports = {
  STATES,
  VALID_TRANSITIONS,
  validateTransition,
  recordTransition
};
