/**
 * 🦅 GARUDA OS — ZERO-CUSTODY ENFORCEMENT ENGINE
 * Technical Invariants & Guardrails Preventing Accidental Fund Custody
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 5 & 12
 */

// List of forbidden account types in GARUDA database/state
const FORBIDDEN_ACCOUNT_CONSTRUCTS = Object.freeze([
  "CUSTOMER_WALLET",
  "POOLED_ESCROW",
  "OMNIBUS_DEPOSITORY",
  "STORED_VALUE_ACCOUNT",
  "GARUDA_SETTLEMENT_HOLDING",
  "INTERNAL_CUSTOMER_BALANCE"
]);

class ZeroCustodyViolationError extends Error {
  constructor(message, violationCode) {
    super(`[ZERO-CUSTODY VIOLATION] ${message} (Code: ${violationCode})`);
    this.name = "ZeroCustodyViolationError";
    this.violationCode = violationCode;
  }
}

/**
 * Asserts that an account schema or transaction attempt does not create custody
 */
function assertZeroCustody(accountConfig) {
  if (!accountConfig || typeof accountConfig !== "object") {
    throw new ZeroCustodyViolationError("Account configuration is required", "MISSING_CONFIG");
  }

  // 1. Forbidden Account Type Check
  const accountType = String(accountConfig.accountType || "").toUpperCase();
  if (FORBIDDEN_ACCOUNT_CONSTRUCTS.includes(accountType)) {
    throw new ZeroCustodyViolationError(
      `Construct "${accountType}" is forbidden under GARUDA Sovereign Constitution`,
      "ILLEGAL_ACCOUNT_TYPE"
    );
  }

  // 2. Beneficiary Ownership Check
  // The beneficiary MUST be the client's verified corporate entity, NEVER GARUDA OS or an employee
  const beneficiaryEntity = String(accountConfig.beneficiaryLegalName || "").toLowerCase();
  const prohibitedOwners = ["garuda", "garuda os", "praveen mahawar", "founder_garuda", "garudaos.in"];
  
  // Exemption: SaaS billing for GARUDA's own software subscription invoices is allowed,
  // but customer transaction settlement principal must NEVER have GARUDA as beneficiary.
  if (accountConfig.isTransactionPrincipal && prohibitedOwners.some(p => beneficiaryEntity.includes(p))) {
    throw new ZeroCustodyViolationError(
      "Customer transaction principal must NEVER have GARUDA as the legal beneficiary",
      "PROHIBITED_BENEFICIARY"
    );
  }

  // 3. Routing Destination Check
  // Funds must clear directly into the merchant's licensed bank account
  if (accountConfig.isTransactionPrincipal && !accountConfig.destinationBankIban && !accountConfig.destinationAccountNumber) {
    throw new ZeroCustodyViolationError(
      "Transaction principal must route directly to a verified external merchant bank account",
      "MISSING_EXTERNAL_BANK_DESTINATION"
    );
  }

  return true;
}

/**
 * Validates that an incoming ledger mutation is strictly separated
 * @param {string} ledgerType - "MERCHANT_SHADOW_TELEMETRY" vs "GARUDA_SAAS_CREDITS"
 * @param {object} mutation - Details of the mutation
 */
function validateLedgerSeparation(ledgerType, mutation) {
  if (ledgerType === "MERCHANT_SHADOW_TELEMETRY") {
    // Principal funds: GARUDA must only observe, never transfer or withdraw
    if (mutation.action === "WITHDRAW_TO_GARUDA" || mutation.action === "COMMINGLE_FUNDS") {
      throw new ZeroCustodyViolationError(
        "Cannot execute withdrawals or commingling on merchant transaction principal",
        "ILLEGAL_PRINCIPAL_MUTATION"
      );
    }
  }

  if (ledgerType === "GARUDA_SAAS_CREDITS") {
    // SaaS Fuel Tank credits: Cannot represent or store customer principal
    if (mutation.representsCustomerPrincipal === true) {
      throw new ZeroCustodyViolationError(
        "SaaS Fuel Tank credits must never represent customer transaction principal",
        "SAAS_CREDIT_CONTAMINATION"
      );
    }
  }

  return true;
}

module.exports = {
  FORBIDDEN_ACCOUNT_CONSTRUCTS,
  ZeroCustodyViolationError,
  assertZeroCustody,
  validateLedgerSeparation
};
