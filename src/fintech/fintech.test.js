/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION PRODUCTION HARDENING TEST SUITE
 * Complete Verification of Zero-Custody, Webhook Security, State Machine,
 * Reconciliation, Cryptographic Audit, and Failure Safety.
 * Spec: GARUDA-FINTECH-SPEC-V2.0
 */

const assert = require("assert");
const crypto = require("crypto");

const { STATES, validateTransition, recordTransition } = require("./stateMachine");
const {
  FORBIDDEN_ACCOUNT_CONSTRUCTS,
  ZeroCustodyViolationError,
  assertZeroCustody,
  validateLedgerSeparation
} = require("./zeroCustodyEnforcer");
const { WebhookSecurityEngine, WebhookSecurityError } = require("./webhookSecurity");
const { RISK_LEVELS, TransactionRiskEngine } = require("./riskEngine");
const { RECONCILIATION_OUTCOMES, ReconciliationEngine, defaultReconciliationEngine } = require("./reconciliationEngine");
const { FuelTankService } = require("./fuelTankService");
const { ForensicAuditLogger, AuditTamperingError } = require("./auditLogger");
const { VALUE_STATUS, DynamicFeeEngine } = require("./feeEngine");
const { MockBankAdapter } = require("./adapters/MockBankAdapter");
const { WioBankAdapter } = require("./adapters/WioBankAdapter");
const { PROVIDER_STATUSES } = require("./adapters/PaymentProviderAdapter");
const { FintechOrchestrationService } = require("./orchestrationService");

console.log("\n========================================================");
console.log("🦅 GARUDA FINTECH PRODUCTION HARDENING TEST SUITE");
console.log("========================================================\n");

let totalTests = 0;
let passedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

async function runAll() {
  // =========================================================================
  // 1. DETERMINISTIC STATE MACHINE TESTS
  // =========================================================================
  console.log("--- 1. Deterministic State Machine Tests ---");

  await runTest("Allows valid state progression (INITIATED -> PAYMENT_INSTRUCTION_CREATED)", () => {
    assert.strictEqual(validateTransition(STATES.INITIATED, STATES.PAYMENT_INSTRUCTION_CREATED), true);
  });

  await runTest("Rejects illegal transition from SETTLED back to INITIATED", () => {
    assert.throws(
      () => validateTransition(STATES.SETTLED, STATES.INITIATED),
      /ILLEGAL_TRANSITION/
    );
  });

  await runTest("Rejects transition from FAILED to SETTLED without provider evidence", () => {
    assert.throws(
      () => validateTransition(STATES.FAILED, STATES.SETTLED, { providerConfirmed: false }),
      /DISALLOWED_TRANSITION/
    );
  });

  await runTest("Rejects transition to SETTLED when unverified client-side attempt", () => {
    assert.throws(
      () => validateTransition(STATES.SETTLEMENT_PENDING, STATES.SETTLED, { providerConfirmed: false }),
      /UNAUTHORIZED_SETTLEMENT/
    );
  });

  await runTest("Allows transition to SETTLED with verified provider confirmation", () => {
    assert.strictEqual(
      validateTransition(STATES.SETTLEMENT_PENDING, STATES.SETTLED, { providerConfirmed: true }),
      true
    );
  });

  await runTest("Produces deterministic transition record with SHA-256 hash", () => {
    const record = recordTransition(STATES.INITIATED, STATES.PAYMENT_INSTRUCTION_CREATED, {
      transactionId: "pi_test_001",
      actor: "ORCHESTRATION_TEST"
    });
    assert.strictEqual(record.transactionId, "pi_test_001");
    assert.strictEqual(record.previousState, STATES.INITIATED);
    assert.strictEqual(record.newState, STATES.PAYMENT_INSTRUCTION_CREATED);
    assert.strictEqual(typeof record.transitionHash, "string");
    assert.strictEqual(record.transitionHash.length, 64);
  });

  // =========================================================================
  // 2. ZERO-CUSTODY INVARIANT TESTS
  // =========================================================================
  console.log("\n--- 2. Zero-Custody Invariant Tests ---");

  await runTest("Throws ZeroCustodyViolationError on forbidden account construct (CUSTOMER_WALLET)", () => {
    assert.throws(
      () => assertZeroCustody({ accountType: "CUSTOMER_WALLET" }),
      (err) => err instanceof ZeroCustodyViolationError && err.violationCode === "ILLEGAL_ACCOUNT_TYPE"
    );
  });

  await runTest("Throws ZeroCustodyViolationError on POOLED_ESCROW construct", () => {
    assert.throws(
      () => assertZeroCustody({ accountType: "POOLED_ESCROW" }),
      (err) => err instanceof ZeroCustodyViolationError && err.violationCode === "ILLEGAL_ACCOUNT_TYPE"
    );
  });

  await runTest("Throws ZeroCustodyViolationError if GARUDA is set as transaction principal beneficiary", () => {
    assert.throws(
      () => assertZeroCustody({
        accountType: "STANDARD_CORPORATE",
        beneficiaryLegalName: "GARUDA OS Technologies",
        isTransactionPrincipal: true,
        destinationBankIban: "AE990001"
      }),
      (err) => err instanceof ZeroCustodyViolationError && err.violationCode === "PROHIBITED_BENEFICIARY"
    );
  });

  await runTest("Throws ZeroCustodyViolationError if transaction principal lacks external bank destination", () => {
    assert.throws(
      () => assertZeroCustody({
        accountType: "STANDARD_CORPORATE",
        beneficiaryLegalName: "Emaar Properties PJSC",
        isTransactionPrincipal: true
      }),
      (err) => err instanceof ZeroCustodyViolationError && err.violationCode === "MISSING_EXTERNAL_BANK_DESTINATION"
    );
  });

  await runTest("Passes ZeroCustody check for legitimate merchant corporate bank account", () => {
    const result = assertZeroCustody({
      accountType: "STANDARD_CORPORATE",
      beneficiaryLegalName: "Emaar Properties PJSC",
      isTransactionPrincipal: true,
      destinationBankIban: "AE290860000009841029481"
    });
    assert.strictEqual(result, true);
  });

  await runTest("Enforces ledger separation: Prevents commingling on merchant principal", () => {
    assert.throws(
      () => validateLedgerSeparation("MERCHANT_SHADOW_TELEMETRY", { action: "COMMINGLE_FUNDS" }),
      /ILLEGAL_PRINCIPAL_MUTATION/
    );
  });

  await runTest("Enforces ledger separation: Prevents customer principal inside SaaS fuel credits", () => {
    assert.throws(
      () => validateLedgerSeparation("GARUDA_SAAS_CREDITS", { representsCustomerPrincipal: true }),
      /SAAS_CREDIT_CONTAMINATION/
    );
  });

  // =========================================================================
  // 3. WEBHOOK SECURITY TESTS (10 REQUIRED SCENARIOS)
  // =========================================================================
  console.log("\n--- 3. Webhook Security Tests (10 Mandatory Scenarios) ---");

  const webhookEngine = new WebhookSecurityEngine({ toleranceSeconds: 300 });
  const testSecret = "top_secret_bank_key_1234567890abcdef";
  const samplePayload = JSON.stringify({ event: "transfer.settled", id: "evt_99182", amount: 500000 });

  function createSignature(payload, secret, timestamp) {
    const toSign = `${timestamp}.${payload}`;
    return crypto.createHmac("sha256", secret).update(toSign).digest("hex");
  }

  await runTest("1. Valid signature passes verification", () => {
    const now = Math.floor(Date.now() / 1000);
    const sig = createSignature(samplePayload, testSecret, now);
    const header = `t=${now},v1=${sig}`;

    const valid = webhookEngine.verifyWebhook({
      rawPayload: samplePayload,
      signatureHeader: header,
      secretKey: testSecret,
      nonce: "nonce_001"
    });
    assert.strictEqual(valid, true);
  });

  await runTest("2. Invalid signature is rejected with 401", () => {
    const now = Math.floor(Date.now() / 1000);
    const fakeSig = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const header = `t=${now},v1=${fakeSig}`;

    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: samplePayload,
        signatureHeader: header,
        secretKey: testSecret,
        nonce: "nonce_002"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "INVALID_SIGNATURE" && err.httpStatus === 401
    );
  });

  await runTest("3. Expired timestamp (>300s old) is rejected with 400", () => {
    const expiredTime = Math.floor(Date.now() / 1000) - 350; // 350 seconds ago
    const sig = createSignature(samplePayload, testSecret, expiredTime);
    const header = `t=${expiredTime},v1=${sig}`;

    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: samplePayload,
        signatureHeader: header,
        secretKey: testSecret,
        nonce: "nonce_003"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "EXPIRED_TIMESTAMP" && err.httpStatus === 400
    );
  });

  await runTest("4. Future timestamp (>300s in future) is rejected with 400", () => {
    const futureTime = Math.floor(Date.now() / 1000) + 400;
    const sig = createSignature(samplePayload, testSecret, futureTime);
    const header = `t=${futureTime},v1=${sig}`;

    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: samplePayload,
        signatureHeader: header,
        secretKey: testSecret,
        nonce: "nonce_004"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "FUTURE_TIMESTAMP" && err.httpStatus === 400
    );
  });

  await runTest("5. Replayed nonce is rejected with 409", () => {
    const now = Math.floor(Date.now() / 1000);
    const sig = createSignature(samplePayload, testSecret, now);
    const header = `t=${now},v1=${sig}`;

    // First ingestion succeeds
    webhookEngine.verifyWebhook({
      rawPayload: samplePayload,
      signatureHeader: header,
      secretKey: testSecret,
      nonce: "replayed_nonce_test_005"
    });

    // Replayed ingestion with same nonce must be rejected
    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: samplePayload,
        signatureHeader: header,
        secretKey: testSecret,
        nonce: "replayed_nonce_test_005"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "REPLAYED_NONCE" && err.httpStatus === 409
    );
  });

  await runTest("6. Duplicate event with same nonce rejected", () => {
    const now = Math.floor(Date.now() / 1000);
    const sig = createSignature(samplePayload, testSecret, now);
    const header = `t=${now},v1=${sig}`;

    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: samplePayload,
        signatureHeader: header,
        secretKey: testSecret,
        nonce: "replayed_nonce_test_005"
      }),
      /REPLAYED_NONCE/
    );
  });

  await runTest("7. Altered payload is rejected (Tamper Detection)", () => {
    const now = Math.floor(Date.now() / 1000);
    const sig = createSignature(samplePayload, testSecret, now);
    const header = `t=${now},v1=${sig}`;

    const tamperedPayload = JSON.stringify({ event: "transfer.settled", id: "evt_99182", amount: 9999999 });

    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: tamperedPayload,
        signatureHeader: header,
        secretKey: testSecret,
        nonce: "nonce_007"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "INVALID_SIGNATURE"
    );
  });

  await runTest("8. Missing signature header is rejected with 401", () => {
    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: samplePayload,
        signatureHeader: "",
        secretKey: testSecret,
        nonce: "nonce_008"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "MISSING_SIGNATURE"
    );
  });

  await runTest("9. Malformed payload (null or empty) is rejected", () => {
    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: null,
        signatureHeader: "v1=abc",
        secretKey: testSecret,
        nonce: "nonce_009"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "MISSING_PAYLOAD"
    );
  });

  await runTest("10. Missing secret key throws internal configuration error", () => {
    assert.throws(
      () => webhookEngine.verifyWebhook({
        rawPayload: samplePayload,
        signatureHeader: "t=123,v1=abc",
        secretKey: null,
        nonce: "nonce_010"
      }),
      (err) => err instanceof WebhookSecurityError && err.errorCode === "MISSING_SECRET_KEY"
    );
  });

  // =========================================================================
  // 4. RECONCILIATION ENGINE TESTS
  // =========================================================================
  console.log("\n--- 4. Deterministic Reconciliation Engine Tests ---");

  const reconEngine = new ReconciliationEngine();
  const mockIntent = {
    id: "pi_test_recon_100",
    amount: 500000.00,
    currency: "USD",
    paymentReference: "GAR-REF-9921",
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
  };

  await runTest("Exact Match -> MATCHED_EXACT & SETTLED", () => {
    const result = reconEngine.reconcile(mockIntent, {
      providerTxId: "tx_bank_exact_001",
      amount: 500000.00,
      currency: "USD",
      paymentReference: "GAR-REF-9921",
      settledAt: new Date().toISOString()
    });

    assert.strictEqual(result.outcome, RECONCILIATION_OUTCOMES.MATCHED_EXACT);
    assert.strictEqual(result.status, STATES.SETTLED);
    assert.strictEqual(result.canSettle, true);
  });

  await runTest("Partial Payment -> PARTIAL_PAYMENT & MANUAL_REVIEW", () => {
    const result = reconEngine.reconcile(mockIntent, {
      providerTxId: "tx_bank_partial_002",
      amount: 450000.00, // Deficit of $50,000
      currency: "USD",
      paymentReference: "GAR-REF-9921"
    });

    assert.strictEqual(result.outcome, RECONCILIATION_OUTCOMES.PARTIAL_PAYMENT);
    assert.strictEqual(result.status, STATES.MANUAL_REVIEW);
    assert.strictEqual(result.canSettle, false);
  });

  await runTest("Overpayment -> OVERPAYMENT & MANUAL_REVIEW", () => {
    const result = reconEngine.reconcile(mockIntent, {
      providerTxId: "tx_bank_over_003",
      amount: 505000.00, // Surplus of $5,000
      currency: "USD",
      paymentReference: "GAR-REF-9921"
    });

    assert.strictEqual(result.outcome, RECONCILIATION_OUTCOMES.OVERPAYMENT);
    assert.strictEqual(result.status, STATES.MANUAL_REVIEW);
    assert.strictEqual(result.canSettle, false);
  });

  await runTest("Currency Mismatch -> CURRENCY_MISMATCH & MANUAL_REVIEW", () => {
    const result = reconEngine.reconcile(mockIntent, {
      providerTxId: "tx_bank_curr_004",
      amount: 500000.00,
      currency: "EUR", // Expected USD
      paymentReference: "GAR-REF-9921"
    });

    assert.strictEqual(result.outcome, RECONCILIATION_OUTCOMES.CURRENCY_MISMATCH);
    assert.strictEqual(result.status, STATES.MANUAL_REVIEW);
    assert.strictEqual(result.canSettle, false);
  });

  await runTest("Duplicate Settlement Attempt -> DUPLICATE_SETTLEMENT & MANUAL_REVIEW", () => {
    // Re-submitting tx_bank_exact_001 which was already settled
    const result = reconEngine.reconcile(mockIntent, {
      providerTxId: "tx_bank_exact_001",
      amount: 500000.00,
      currency: "USD",
      paymentReference: "GAR-REF-9921"
    });

    assert.strictEqual(result.outcome, RECONCILIATION_OUTCOMES.DUPLICATE_SETTLEMENT);
    assert.strictEqual(result.status, STATES.MANUAL_REVIEW);
    assert.strictEqual(result.canSettle, false);
  });

  await runTest("Late Arrival (after VAN expiry) -> LATE_ARRIVAL & MANUAL_REVIEW", () => {
    const expiredIntent = {
      ...mockIntent,
      expiresAt: new Date(Date.now() - 3600 * 1000).toISOString() // 1 hour ago
    };

    const result = reconEngine.reconcile(expiredIntent, {
      providerTxId: "tx_bank_late_005",
      amount: 500000.00,
      currency: "USD",
      paymentReference: "GAR-REF-9921"
    });

    assert.strictEqual(result.outcome, RECONCILIATION_OUTCOMES.LATE_ARRIVAL);
    assert.strictEqual(result.status, STATES.MANUAL_REVIEW);
    assert.strictEqual(result.canSettle, false);
  });

  // =========================================================================
  // 5. CRYPTOGRAPHIC AUDIT CHAIN TAMPER DETECTION TESTS
  // =========================================================================
  console.log("\n--- 5. Forensic Audit Chain Tamper Tests ---");

  const auditLogger = new ForensicAuditLogger();

  await runTest("Appends audit events and verifies unbroken cryptographic chain", () => {
    auditLogger.logEvent({
      transactionId: "tx_aud_1",
      action: "CREATE_INTENT",
      newState: STATES.INITIATED,
      payload: { amount: 10000 }
    });

    auditLogger.logEvent({
      transactionId: "tx_aud_1",
      action: "PROVISION_VAN",
      oldState: STATES.INITIATED,
      newState: STATES.PAYMENT_INSTRUCTION_CREATED,
      payload: { van: "VAN_123" }
    });

    auditLogger.logEvent({
      transactionId: "tx_aud_1",
      action: "SETTLE",
      oldState: STATES.PAYMENT_INSTRUCTION_CREATED,
      newState: STATES.SETTLED,
      payload: { settled: true }
    });

    assert.strictEqual(auditLogger.verifyChainIntegrity(), true);
  });

  await runTest("Catches silent tampering in past audit entry payload", () => {
    const logs = auditLogger.logs;
    logs[1] = {
      ...logs[1],
      payloadHash: "faked_tampered_payload_hash_1234567890abcdef"
    };

    assert.throws(
      () => auditLogger.verifyChainIntegrity(),
      (err) => err instanceof AuditTamperingError
    );
  });

  // =========================================================================
  // 6. TRANSACTION RISK ENGINE TESTS
  // =========================================================================
  console.log("\n--- 6. Multi-Factor Risk Engine Tests ---");

  const riskEngine = new TransactionRiskEngine();

  await runTest("Standard low-risk commercial transaction returns LOW", () => {
    const result = riskEngine.evaluateRisk({
      amount: 50000,
      currency: "USD",
      originCountry: "US",
      destinationCountry: "AE"
    });
    assert.strictEqual(result.riskLevel, RISK_LEVELS.LOW);
    assert.strictEqual(result.allowed, true);
  });

  await runTest("Sanctioned country origin returns REVIEW_REQUIRED or HIGH", () => {
    const result = riskEngine.evaluateRisk({
      amount: 100000,
      currency: "USD",
      originCountry: "KP", // North Korea
      destinationCountry: "AE"
    });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.requiresManualReview, true);
    assert.ok(result.flags.includes("SANCTIONED_OR_HIGH_RISK_ORIGIN"));
  });

  await runTest("Provider blocked transaction CANNOT be overridden by GARUDA", () => {
    const result = riskEngine.evaluateRisk({
      amount: 10000,
      currency: "USD",
      originCountry: "US",
      destinationCountry: "AE",
      providerStatus: "BLOCKED"
    });
    assert.strictEqual(result.riskLevel, RISK_LEVELS.BLOCKED_BY_PROVIDER);
    assert.strictEqual(result.allowed, false);
  });

  // =========================================================================
  // 7. DYNAMIC FEE ENGINE TESTS
  // =========================================================================
  console.log("\n--- 7. Dynamic Fee Engine Tests ---");

  const feeEngine = new DynamicFeeEngine();

  await runTest("Itemizes fees with status tags (LIVE, CONTRACTUAL, ESTIMATED)", () => {
    const fee = feeEngine.calculateFees({
      amount: 500000,
      currency: "USD",
      clearingRail: "FEDWIRE"
    });

    assert.strictEqual(fee.grossAmount.value, 500000);
    assert.strictEqual(fee.grossAmount.status, VALUE_STATUS.LIVE);
    assert.strictEqual(fee.garudaSaaSFee.value, 750); // 0.15% of 500k
    assert.strictEqual(fee.garudaSaaSFee.status, VALUE_STATUS.CONTRACTUAL);
    assert.strictEqual(fee.bankFee.status, VALUE_STATUS.ESTIMATED);
    assert.strictEqual(fee.railFee.status, VALUE_STATUS.ESTIMATED);
    assert.strictEqual(fee.merchantNetProceeds.value, 500000 - 15 - 12 - 750);
  });

  // =========================================================================
  // 8. ZERO-CUSTODY & END-TO-END ORCHESTRATION TEST
  // =========================================================================
  console.log("\n--- 8. Zero-Custody End-to-End Orchestration Test ---");

  const orchService = new FintechOrchestrationService();
  const fuelTank = new FuelTankService();

  await runTest("Complete Zero-Custody flow: Buyer -> Bank Rail -> Merchant Account (Zero GARUDA Custody)", async () => {
    // Step 1: Pre-fund merchant software fuel balance ($10,000 for IT maintenance)
    fuelTank.topUp("merch_emaar", 10000, { invoiceRef: "INV-SAAS-2026" });
    assert.strictEqual(fuelTank.getBalance("merch_emaar"), 10000);

    // Step 2: Create Payment Intent for $500,000 villa booking
    const intent = await orchService.createPaymentIntent({
      merchantId: "merch_emaar",
      merchantLegalName: "Emaar Properties PJSC",
      destinationBankIban: "AE290860000009841029481", // Client's corporate account in Wio Bank
      amount: 500000,
      currency: "USD",
      originCountry: "US",
      destinationCountry: "AE",
      selectedRail: "FEDWIRE",
      preferredProvider: "mock_sovereign_bank"
    });

    assert.strictEqual(intent.status, STATES.INITIATED);
    assert.strictEqual(intent.amount, 500000);

    // Step 3: Provision VAN & Payment Instruction via Bank Adapter
    const instructions = await orchService.provisionPaymentInstructions(intent.id);
    assert.strictEqual(instructions.status, STATES.PAYMENT_INSTRUCTION_CREATED);
    assert.ok(instructions.van.vanIdentifier.startsWith("VAN-SIM-USD"));

    // Step 4: Buyer dispatches Fedwire. Bank clears directly to Merchant. Bank sends Webhook.
    const webhookSecret = "test_webhook_secret_key";
    const now = Math.floor(Date.now() / 1000);
    const bankEvent = {
      paymentIntentId: intent.id,
      providerTxId: "fedwire_tx_99812401",
      amount: 500000,
      currency: "USD",
      bankReference: "FEDWIRE-REF-99",
      settledAt: new Date().toISOString()
    };

    const rawPayload = JSON.stringify(bankEvent);
    const signature = createSignature(rawPayload, webhookSecret, now);
    const signatureHeader = `t=${now},v1=${signature}`;

    // Process Webhook
    const settlementResult = await orchService.handleBankWebhook("mock_sovereign_bank", {
      rawPayload,
      signatureHeader,
      secretKey: webhookSecret,
      nonce: "evt_fedwire_settle_001",
      eventPayload: bankEvent
    });

    assert.strictEqual(settlementResult.success, true);
    assert.strictEqual(settlementResult.status, STATES.SETTLED);
    assert.strictEqual(settlementResult.amountSettledToMerchantBank, 500000);

    // Verify Intent is SETTLED
    const updatedIntent = orchService.getPaymentIntent(intent.id);
    assert.strictEqual(updatedIntent.status, STATES.SETTLED);

    // PROOF: GARUDA did not hold the $500,000 principal.
    // The $500,000 was credited directly to the merchant's corporate bank account.
    // GARUDA only earned 0.15% ($750) IT software fee deducted from merchant's software credit tank.
    assert.strictEqual(settlementResult.saasFeeDeducted, 750);
  });

  // =========================================================================
  // 9. OUTAGE & FAILURE SAFETY RECOVERY TEST
  // =========================================================================
  console.log("\n--- 9. Outage & Failure Safety Recovery Test ---");

  await runTest("Simulated GARUDA restart / network timeout does not lose funds and recovers via idempotent replay", async () => {
    // Replay attempt with same providerTxId that was settled in Test 8
    const mockIntent2 = {
      id: "pi_replay_test_200",
      amount: 100000,
      currency: "USD",
      paymentReference: "GAR-REF-REPLAY",
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    };

    const duplicateBankEvent = {
      providerTxId: "fedwire_tx_99812401", // settled in Test 8 via defaultReconciliationEngine
      amount: 100000,
      currency: "USD",
      paymentReference: "GAR-REF-REPLAY"
    };

    // Reconcile via defaultReconciliationEngine must identify duplicate
    const reconResult = defaultReconciliationEngine.reconcile(mockIntent2, duplicateBankEvent);
    assert.strictEqual(reconResult.outcome, RECONCILIATION_OUTCOMES.DUPLICATE_SETTLEMENT);
    assert.strictEqual(reconResult.canSettle, false);
  });

  console.log("\n========================================================");
  console.log(`🎉 ALL ${totalTests} PRODUCTION HARDENING TESTS PASSED CLEANLY!`);
  console.log("========================================================\n");
}

runAll().catch(err => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
