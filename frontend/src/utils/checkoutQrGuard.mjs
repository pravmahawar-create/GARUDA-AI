/**
 * GARUDA FINTECH - Dynamic UPI QR Regression Guard
 * Pure deterministic guards ensuring:
 * 1. Reactive local preview QR strictly tracks valid positive amounts.
 * 2. QR amount and checkout reference match displayed amount/reference 1:1.
 * 3. Changing amount/merchant/rail invalidates stale generated checkout intents.
 * 4. Explicit separation between LOCAL_PREVIEW_QR and PROVIDER_GENERATED_PAYMENT_QR.
 * 5. Never labels a locally generated QR as LIVE NPCI / payment-ready.
 */

export const QR_SOURCE_TYPES = Object.freeze({
  LOCAL_PREVIEW_QR: "LOCAL_PREVIEW_QR",
  PROVIDER_GENERATED_PAYMENT_QR: "PROVIDER_GENERATED_PAYMENT_QR",
  NONE: "NONE"
});

export function validateCheckoutAmount(rawAmount) {
  if (rawAmount === "" || rawAmount === null || rawAmount === undefined || typeof rawAmount === "boolean") {
    return {
      valid: false,
      amount: null,
      errorCode: "INVALID_CHECKOUT_AMOUNT",
      error: "Enter a valid positive INR amount greater than ₹0 to generate checkout QR preview."
    };
  }
  const normalizedInput = typeof rawAmount === "string" ? rawAmount.trim() : rawAmount;
  if (normalizedInput === "") {
    return {
      valid: false,
      amount: null,
      errorCode: "INVALID_CHECKOUT_AMOUNT",
      error: "Enter a valid positive INR amount greater than ₹0 to generate checkout QR preview."
    };
  }
  const parsed = Number(normalizedInput);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100000000) {
    return {
      valid: false,
      amount: null,
      errorCode: "INVALID_CHECKOUT_AMOUNT",
      error: "Amount must be a finite number strictly greater than ₹0 (up to ₹10,00,00,000)."
    };
  }
  const amount = Math.round(parsed * 100) / 100;
  return {
    valid: true,
    amount,
    errorCode: null,
    error: null
  };
}

export function buildLocalPreviewReference({ merchantId, rail, amount }) {
  const safeMerchant = String(merchantId || "MERCHANT")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(-10)
    .toUpperCase() || "MERCHANT";
  const safeRail = String(rail || "IMPS")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase() || "IMPS";
  const safeAmountTag = String(amount).replace(".", "P");
  return `PREV-${safeMerchant}-${safeRail}-${safeAmountTag}`;
}

export function verifyQrDisplayConsistency({
  qrAmount,
  qrReference,
  displayedAmount,
  displayedReference,
  qrPayloadUri = ""
}) {
  const amtCheck = validateCheckoutAmount(displayedAmount);
  const qrAmtCheck = validateCheckoutAmount(qrAmount);
  if (!amtCheck.valid || !qrAmtCheck.valid) {
    return {
      consistent: false,
      errorCode: "INVALID_CHECKOUT_AMOUNT",
      reason: "Displayed amount or QR amount is not a valid positive number."
    };
  }
  if (Math.abs(qrAmtCheck.amount - amtCheck.amount) >= 0.0001) {
    return {
      consistent: false,
      errorCode: "QR_AMOUNT_MISMATCH",
      reason: `QR amount (₹${qrAmtCheck.amount}) does not match displayed amount (₹${amtCheck.amount}).`
    };
  }

  const refA = String(qrReference || "").trim();
  const refB = String(displayedReference || "").trim();
  if (!refA || !refB || refA !== refB) {
    return {
      consistent: false,
      errorCode: "QR_REFERENCE_MISMATCH",
      reason: `QR reference (${refA || "EMPTY"}) does not match displayed reference (${refB || "EMPTY"}).`
    };
  }

  if (qrPayloadUri) {
    const queryIdx = String(qrPayloadUri).indexOf("?");
    if (queryIdx !== -1) {
      const params = new URLSearchParams(String(qrPayloadUri).slice(queryIdx + 1));
      const uriAmt = params.get("am");
      const uriNote = params.get("tn") || params.get("tr");
      if (uriAmt !== null && Math.abs(Number(uriAmt) - amtCheck.amount) >= 0.0001) {
        return {
          consistent: false,
          errorCode: "QR_URI_AMOUNT_MISMATCH",
          reason: `QR payload am=${uriAmt} does not match displayed amount ₹${amtCheck.amount}.`
        };
      }
      if (uriNote !== null && uriNote.trim() !== refB) {
        return {
          consistent: false,
          errorCode: "QR_URI_REFERENCE_MISMATCH",
          reason: `QR payload reference (${uriNote}) does not match displayed reference (${refB}).`
        };
      }
    }
  }

  return {
    consistent: true,
    errorCode: null,
    reason: null
  };
}

export function isCheckoutIntentStale(intent, { merchantId, amount, rail } = {}) {
  if (!intent) {
    return { isStale: false, reason: null, errorCode: null };
  }
  const amtCheck = validateCheckoutAmount(amount);
  if (!amtCheck.valid) {
    return {
      isStale: true,
      errorCode: "STALE_INTENT_INVALID_AMOUNT",
      reason: "Current checkout amount is invalid; any previously generated intent is invalidated."
    };
  }
  if (merchantId && String(intent.merchantId || "") !== String(merchantId)) {
    return {
      isStale: true,
      errorCode: "STALE_INTENT_MERCHANT_CHANGED",
      reason: `Merchant changed from ${intent.merchantId} to ${merchantId}; regenerate checkout intent.`
    };
  }
  if (Math.abs(Number(intent.amount) - amtCheck.amount) >= 0.0001) {
    return {
      isStale: true,
      errorCode: "STALE_INTENT_AMOUNT_CHANGED",
      reason: `Amount changed from ₹${Number(intent.amount).toLocaleString("en-IN")} to ₹${amtCheck.amount.toLocaleString("en-IN")} — previous intent ${intent.id} invalidated.`
    };
  }
  if (rail && intent.selectedRail && String(intent.selectedRail) !== String(rail)) {
    return {
      isStale: true,
      errorCode: "STALE_INTENT_RAIL_CHANGED",
      reason: `Rail changed from ${intent.selectedRail} to ${rail} — previous intent ${intent.id} invalidated.`
    };
  }
  return { isStale: false, reason: null, errorCode: null };
}

export function hasAuthenticatedProviderQr(intent, { mode, nowMs = Date.now() } = {}) {
  if (mode !== "LIVE" || !intent) return false;
  if (intent.qrSourceType !== QR_SOURCE_TYPES.PROVIDER_GENERATED_PAYMENT_QR) return false;
  if (intent.providerQrVerified !== true) return false;
  if (typeof intent.providerQrPayload !== "string" || !intent.providerQrPayload.trim()) return false;
  if (intent.qrExpiresAt) {
    const expMs = new Date(intent.qrExpiresAt).getTime();
    if (!Number.isFinite(expMs) || expMs <= nowMs) return false;
  }
  return true;
}

export function resolveCheckoutQrState({
  mode = "SIMULATED",
  selectedMerchantId = "",
  checkoutAmount,
  checkoutRail = "IMPS",
  activeIntent = null,
  invalidatedReason = ""
} = {}) {
  const amtCheck = validateCheckoutAmount(checkoutAmount);
  if (!amtCheck.valid) {
    return {
      valid: false,
      validationError: amtCheck.error,
      amount: null,
      reference: "",
      payloadUri: "",
      qrOrigin: QR_SOURCE_TYPES.NONE,
      isLivePaymentReady: false,
      intentStatus: activeIntent ? "STALE_INVALIDATED" : "INVALID_AMOUNT",
      isIntentStale: Boolean(activeIntent),
      staleReason: activeIntent ? amtCheck.error : null,
      statusBadgeText: "INVALID AMOUNT — QR PREVIEW DISABLED",
      consistency: {
        consistent: false,
        errorCode: amtCheck.errorCode,
        reason: amtCheck.error
      }
    };
  }

  const validAmount = amtCheck.amount;
  const staleStatus = isCheckoutIntentStale(activeIntent, {
    merchantId: selectedMerchantId,
    amount: validAmount,
    rail: checkoutRail
  });
  const effectiveInvalidationReason = invalidatedReason || staleStatus.reason || "";
  const isStale = Boolean(activeIntent && (staleStatus.isStale || invalidatedReason));
  const usableIntent = activeIntent && !isStale ? activeIntent : null;

  const checkoutReference = usableIntent
    ? String(usableIntent.paymentReference || usableIntent.id)
    : buildLocalPreviewReference({
        merchantId: selectedMerchantId,
        rail: checkoutRail,
        amount: validAmount
      });

  const providerVerified = hasAuthenticatedProviderQr(usableIntent, { mode });

  if (providerVerified) {
    const providerUri = String(usableIntent.providerQrPayload).trim();
    const consistency = verifyQrDisplayConsistency({
      qrAmount: usableIntent.amount,
      qrReference: usableIntent.paymentReference || usableIntent.id,
      displayedAmount: validAmount,
      displayedReference: checkoutReference,
      qrPayloadUri: providerUri
    });

    if (!consistency.consistent) {
      return {
        valid: false,
        validationError: consistency.reason,
        amount: validAmount,
        reference: checkoutReference,
        payloadUri: "",
        qrOrigin: QR_SOURCE_TYPES.NONE,
        isLivePaymentReady: false,
        intentStatus: "PROVIDER_QR_MISMATCH",
        isIntentStale: true,
        staleReason: consistency.reason,
        statusBadgeText: "PROVIDER QR MISMATCH BLOCKED — NOT PAYMENT-READY",
        consistency
      };
    }

    return {
      valid: true,
      validationError: null,
      amount: validAmount,
      reference: checkoutReference,
      payloadUri: providerUri,
      qrOrigin: QR_SOURCE_TYPES.PROVIDER_GENERATED_PAYMENT_QR,
      isLivePaymentReady: true,
      intentStatus: usableIntent.status || "PAYMENT_INSTRUCTION_CREATED",
      isIntentStale: false,
      staleReason: null,
      statusBadgeText: "LIVE PAYMENT-READY · PROVIDER_GENERATED_PAYMENT_QR",
      consistency
    };
  }

  const vpaPrefix = mode === "LIVE" ? "merchant.pending" : String(selectedMerchantId || "sim.ops").toLowerCase();
  const payloadUri = `upi://pay?pa=${encodeURIComponent(vpaPrefix)}@bank.sim&am=${validAmount}&cu=INR&tr=${encodeURIComponent(checkoutReference)}&tn=${encodeURIComponent(checkoutReference)}`;
  const consistency = verifyQrDisplayConsistency({
    qrAmount: validAmount,
    qrReference: checkoutReference,
    displayedAmount: validAmount,
    displayedReference: checkoutReference,
    qrPayloadUri: payloadUri
  });

  const statusBadgeText = usableIntent
    ? "LOCAL_PREVIEW_QR · Intent Generated (NOT LIVE NPCI — Awaiting Acquiring Bank QR)"
    : effectiveInvalidationReason
      ? "LOCAL_PREVIEW_QR · Previous Intent Invalidated (NOT LIVE NPCI)"
      : "LOCAL_PREVIEW_QR · Preview Only (NOT LIVE NPCI / Payment-Ready)";

  return {
    valid: consistency.consistent,
    validationError: consistency.consistent ? null : consistency.reason,
    amount: validAmount,
    reference: checkoutReference,
    payloadUri: consistency.consistent ? payloadUri : "",
    qrOrigin: QR_SOURCE_TYPES.LOCAL_PREVIEW_QR,
    isLivePaymentReady: false,
    intentStatus: usableIntent ? usableIntent.status : (isStale || effectiveInvalidationReason ? "STALE_INVALIDATED" : "LOCAL_PREVIEW_ONLY"),
    isIntentStale: Boolean(isStale || effectiveInvalidationReason),
    staleReason: effectiveInvalidationReason || null,
    statusBadgeText,
    consistency
  };
}
