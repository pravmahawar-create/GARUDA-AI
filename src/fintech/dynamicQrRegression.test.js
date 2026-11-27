/**
 * GARUDA FINTECH - Dynamic UPI QR Regression Guard Test Suite
 * Verifies:
 * 1. Reactive QR updates on valid amount typing & presets
 * 2. Exact 1:1 matching of QR amount & checkout reference with displayed values
 * 3. Stale intent invalidation when amount / rail / merchant changes
 * 4. Strict fail-closed rejection on invalid amounts (0, negative, empty, non-numeric)
 * 5. Reference / amount mismatch detection across display & UPI URI
 * 6. Strict separation: LOCAL_PREVIEW_QR (never live NPCI) vs PROVIDER_GENERATED_PAYMENT_QR
 */

const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");
const express = require("express");
const authContextMiddleware = require("../middleware/authContextMiddleware");
const merchantOpsRoutes = require("../routes/merchantOpsRoutes");
const { defaultMerchantEligibilityService, GAME_CATEGORIES } = require("./merchantEligibilityService");

async function run() {
  console.log("\n▶ Running Dynamic UPI QR Regression Guard Suite...");

  const guardUrl = pathToFileURL(path.resolve(__dirname, "../../frontend/src/utils/checkoutQrGuard.mjs")).href;
  const {
    QR_SOURCE_TYPES,
    validateCheckoutAmount,
    verifyQrDisplayConsistency,
    isCheckoutIntentStale,
    resolveCheckoutQrState
  } = await import(guardUrl);

  // 1. Valid amount typing produces reactive LOCAL_PREVIEW_QR with exact reference match
  const typed1 = resolveCheckoutQrState({
    mode: "SIMULATED",
    selectedMerchantId: "SIM_GM_ESPORTS_01",
    checkoutAmount: "4250",
    checkoutRail: "IMPS"
  });
  const typed2 = resolveCheckoutQrState({
    mode: "SIMULATED",
    selectedMerchantId: "SIM_GM_ESPORTS_01",
    checkoutAmount: "7890",
    checkoutRail: "IMPS"
  });
  assert.strictEqual(typed1.valid, true);
  assert.strictEqual(typed1.amount, 4250);
  assert.strictEqual(typed1.qrOrigin, QR_SOURCE_TYPES.LOCAL_PREVIEW_QR);
  assert.strictEqual(typed1.isLivePaymentReady, false);
  assert.ok(typed1.payloadUri.includes("am=4250"));
  assert.ok(typed1.payloadUri.includes(encodeURIComponent(typed1.reference)));
  assert.strictEqual(typed2.amount, 7890);
  assert.notStrictEqual(typed1.payloadUri, typed2.payloadUri);
  assert.notStrictEqual(typed1.reference, typed2.reference);
  assert.ok(!typed1.statusBadgeText.includes("LIVE PAYMENT-READY"), "Local preview must NEVER claim LIVE payment-ready");
  console.log("  ✔ [PASS] 1. Reactive amount typing regenerates matching LOCAL_PREVIEW_QR payload & ref");

  // 2. Preset selection (500, 1000, 2500, 10000, 25000) updates cleanly & consistently
  const presets = [500, 1000, 2500, 10000, 25000];
  const presetUris = new Set();
  for (const preset of presets) {
    const state = resolveCheckoutQrState({
      mode: "SIMULATED",
      selectedMerchantId: "SIM_GM_ESPORTS_01",
      checkoutAmount: preset,
      checkoutRail: "RTGS"
    });
    assert.strictEqual(state.valid, true);
    assert.strictEqual(state.amount, preset);
    assert.strictEqual(state.consistency.consistent, true);
    assert.strictEqual(state.isLivePaymentReady, false);
    assert.strictEqual(state.qrOrigin, QR_SOURCE_TYPES.LOCAL_PREVIEW_QR);
    presetUris.add(state.payloadUri);
  }
  assert.strictEqual(presetUris.size, presets.length, "Every preset must map to a unique QR payload URI");
  console.log("  ✔ [PASS] 2. All preset amounts update QR URI and consistency cleanly");

  // 3. Stale intent invalidation on amount / rail / merchant change
  const generatedIntent = {
    id: "pay_test_10k",
    merchantId: "SIM_GM_ESPORTS_01",
    amount: 10000,
    selectedRail: "IMPS",
    paymentReference: "GAR-INTENT-10K",
    status: "PAYMENT_INSTRUCTION_CREATED"
  };
  const matchedState = resolveCheckoutQrState({
    mode: "SIMULATED",
    selectedMerchantId: "SIM_GM_ESPORTS_01",
    checkoutAmount: 10000,
    checkoutRail: "IMPS",
    activeIntent: generatedIntent
  });
  assert.strictEqual(matchedState.isIntentStale, false);
  assert.strictEqual(matchedState.reference, "GAR-INTENT-10K");
  assert.ok(matchedState.payloadUri.includes("GAR-INTENT-10K"));

  const staleAfterAmountChange = resolveCheckoutQrState({
    mode: "SIMULATED",
    selectedMerchantId: "SIM_GM_ESPORTS_01",
    checkoutAmount: 25000,
    checkoutRail: "IMPS",
    activeIntent: generatedIntent
  });
  assert.strictEqual(staleAfterAmountChange.isIntentStale, true);
  assert.strictEqual(staleAfterAmountChange.intentStatus, "STALE_INVALIDATED");
  assert.strictEqual(staleAfterAmountChange.amount, 25000);
  assert.notStrictEqual(staleAfterAmountChange.reference, "GAR-INTENT-10K", "Stale intent reference must NOT stay attached to changed amount");
  assert.strictEqual(
    isCheckoutIntentStale(generatedIntent, { merchantId: "OTHER_MERCHANT", amount: 10000, rail: "IMPS" }).isStale,
    true
  );
  console.log("  ✔ [PASS] 3. Changing amount/merchant invalidates stale generated checkout intent immediately");

  // 4. Invalid amounts fail closed (never coerced silently to ₹1)
  for (const bad of ["", "   ", "0", 0, -500, "-1", "abc", NaN, Infinity, null, undefined, false]) {
    const v = validateCheckoutAmount(bad);
    assert.strictEqual(v.valid, false, `Expected invalid amount rejection for: ${String(bad)}`);
    const badState = resolveCheckoutQrState({
      mode: "SIMULATED",
      selectedMerchantId: "SIM_GM_ESPORTS_01",
      checkoutAmount: bad,
      checkoutRail: "IMPS",
      activeIntent: generatedIntent
    });
    assert.strictEqual(badState.valid, false);
    assert.strictEqual(badState.qrOrigin, QR_SOURCE_TYPES.NONE);
    assert.strictEqual(badState.payloadUri, "");
    assert.strictEqual(badState.isLivePaymentReady, false);
    assert.strictEqual(badState.isIntentStale, true);
  }
  console.log("  ✔ [PASS] 4. Invalid amounts fail closed with QR disabled and no ₹1 silent coercion");

  // 5. Reference and amount mismatch detection + provider mismatch protection
  const refMismatch = verifyQrDisplayConsistency({
    qrAmount: 5000,
    qrReference: "REF-AAA",
    displayedAmount: 5000,
    displayedReference: "REF-BBB"
  });
  assert.strictEqual(refMismatch.consistent, false);
  assert.strictEqual(refMismatch.errorCode, "QR_REFERENCE_MISMATCH");

  const uriMismatch = verifyQrDisplayConsistency({
    qrAmount: 5000,
    qrReference: "REF-AAA",
    displayedAmount: 5000,
    displayedReference: "REF-AAA",
    qrPayloadUri: "upi://pay?pa=merchant@bank&am=5000&cu=INR&tn=WRONG-REF"
  });
  assert.strictEqual(uriMismatch.consistent, false);
  assert.strictEqual(uriMismatch.errorCode, "QR_URI_REFERENCE_MISMATCH");

  // Even if backend marks providerQrVerified=true, mismatched URI amount/ref must NEVER show LIVE payment-ready
  const mismatchedProviderState = resolveCheckoutQrState({
    mode: "LIVE",
    selectedMerchantId: "M_ESP_GUARD",
    checkoutAmount: 5000,
    checkoutRail: "IMPS",
    activeIntent: {
      id: "pay_prov_bad",
      merchantId: "M_ESP_GUARD",
      amount: 5000,
      selectedRail: "IMPS",
      paymentReference: "GAR-PROV-5000",
      status: "PAYMENT_INSTRUCTION_CREATED",
      qrSourceType: QR_SOURCE_TYPES.PROVIDER_GENERATED_PAYMENT_QR,
      providerQrVerified: true,
      providerQrPayload: "upi://pay?pa=merchant@icici&am=999&cu=INR&tn=GAR-PROV-5000",
      qrExpiresAt: new Date(Date.now() + 600000).toISOString()
    }
  });
  assert.strictEqual(mismatchedProviderState.valid, false);
  assert.strictEqual(mismatchedProviderState.isLivePaymentReady, false);
  assert.strictEqual(mismatchedProviderState.qrOrigin, QR_SOURCE_TYPES.NONE);
  console.log("  ✔ [PASS] 5. Reference & amount mismatch checks block inconsistent QR display");

  // 6. Strict LOCAL_PREVIEW_QR vs PROVIDER_GENERATED_PAYMENT_QR gate
  const simWithProviderFlagAttempt = resolveCheckoutQrState({
    mode: "SIMULATED",
    selectedMerchantId: "SIM_GM_ESPORTS_01",
    checkoutAmount: 5000,
    checkoutRail: "IMPS",
    activeIntent: {
      id: "pay_sim_fake_prov",
      merchantId: "SIM_GM_ESPORTS_01",
      amount: 5000,
      selectedRail: "IMPS",
      paymentReference: "GAR-SIM-5000",
      qrSourceType: QR_SOURCE_TYPES.PROVIDER_GENERATED_PAYMENT_QR,
      providerQrVerified: true,
      providerQrPayload: "upi://pay?pa=sim@bank&am=5000&cu=INR&tn=GAR-SIM-5000",
      qrExpiresAt: new Date(Date.now() + 600000).toISOString()
    }
  });
  assert.strictEqual(simWithProviderFlagAttempt.qrOrigin, QR_SOURCE_TYPES.LOCAL_PREVIEW_QR, "SIMULATED mode must never report live provider QR");
  assert.strictEqual(simWithProviderFlagAttempt.isLivePaymentReady, false);

  const verifiedLiveProviderState = resolveCheckoutQrState({
    mode: "LIVE",
    selectedMerchantId: "M_ESP_GUARD",
    checkoutAmount: 5000,
    checkoutRail: "IMPS",
    activeIntent: {
      id: "pay_live_verified",
      merchantId: "M_ESP_GUARD",
      amount: 5000,
      selectedRail: "IMPS",
      paymentReference: "GAR-LIVE-5000",
      status: "PAYMENT_INSTRUCTION_CREATED",
      qrSourceType: QR_SOURCE_TYPES.PROVIDER_GENERATED_PAYMENT_QR,
      providerQrVerified: true,
      providerQrPayload: "upi://pay?pa=merchant@icici&am=5000&cu=INR&tn=GAR-LIVE-5000",
      qrExpiresAt: new Date(Date.now() + 600000).toISOString()
    }
  });
  assert.strictEqual(verifiedLiveProviderState.valid, true);
  assert.strictEqual(verifiedLiveProviderState.qrOrigin, QR_SOURCE_TYPES.PROVIDER_GENERATED_PAYMENT_QR);
  assert.strictEqual(verifiedLiveProviderState.isLivePaymentReady, true);
  console.log("  ✔ [PASS] 6. Strictly isolates LOCAL_PREVIEW_QR from verified LIVE PROVIDER_GENERATED_PAYMENT_QR");

  // 7. Preserve existing backend simulation & authenticated checkout + VAN intent creation
  const app = express();
  app.use(express.json());
  app.use(authContextMiddleware);
  app.use("/api/merchant", merchantOpsRoutes);
  const srv = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });

  try {
    const baseUrl = `http://127.0.0.1:${srv.address().port}`;
    const simCreateRes = await fetch(`${baseUrl}/api/merchant/simulation/actions/create_checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sim-session-id": "qr_guard_test_1" },
      body: JSON.stringify({ merchantId: "SIM_GM_ESPORTS_01", amount: 12500, rail: "IMPS" })
    });
    const simJson = await simCreateRes.json();
    assert.strictEqual(simCreateRes.status, 200);
    assert.strictEqual(simJson.data.outcome.intent.amount, 12500);
    assert.strictEqual(simJson.data.outcome.intent.qrSourceType, QR_SOURCE_TYPES.LOCAL_PREVIEW_QR);
    assert.strictEqual(simJson.data.outcome.intent.isLivePaymentReady, false);
    assert.ok(simJson.data.outcome.intent.van?.vanIdentifier, "Existing VAN workflow preserved");

    // Verify authenticated LIVE checkout intent creation still works for eligible tenant
    const tenantId = `T_QR_GUARD_${Date.now()}`;
    const merchantId = "M_QR_ESP_01";
    defaultMerchantEligibilityService.declareMerchantProfile({
      tenantId,
      merchantId,
      legalName: "Verified Esports Demo Ltd",
      category: GAME_CATEGORIES.RECOGNIZED_ESPORTS,
      involvesMoneyStakeOrWinnings: false,
      esportsRegistrationRef: "ESP-QR-2026"
    });
    defaultMerchantEligibilityService.reviewAndApprove({
      tenantId,
      merchantId,
      counselApproved: true,
      counselReference: "COUNSEL-QR-01",
      founderContext: { role: "platform_founder", isFounderApproved: true, actorId: "TEST_FOUNDER" }
    });
    const founderKey = process.env.GARUDA_FOUNDER_KEY;
    if (founderKey) {
      const liveIntentRes = await fetch(`${baseUrl}/api/merchant/checkout/intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-founder-key": founderKey,
          "x-tenant-id": tenantId
        },
        body: JSON.stringify({
          merchantId,
          merchantLegalName: "Verified Esports Demo Ltd",
          destinationBankIban: "INICIC000104998811",
          amount: 10000,
          selectedRail: "IMPS"
        })
      });
      const liveJson = await liveIntentRes.json();
      assert.strictEqual(liveIntentRes.status, 201);
      assert.strictEqual(liveJson.data.amount, 10000);
    }
    console.log("  ✔ [PASS] 7. Backend simulation & authenticated checkout + VAN workflow preserved cleanly");
  } finally {
    await new Promise((r) => srv.close(r));
  }

  console.log("\n🎉 ALL 7 DYNAMIC UPI QR REGRESSION GUARD TESTS PASSED CLEANLY!\n");
}

run().catch((err) => {
  console.error("❌ Dynamic QR Regression Guard FAILED:", err);
  process.exitCode = 1;
});
