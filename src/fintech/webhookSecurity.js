/**
 * 🦅 GARUDA OS — WEBHOOK SECURITY HARDENING ENGINE
 * Deterministic Cryptographic Ingestion & Anti-Replay Defense
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 9
 */

const crypto = require("crypto");

class WebhookSecurityError extends Error {
  constructor(message, errorCode, httpStatus = 400) {
    super(`[WEBHOOK_SECURITY_ERROR] ${message} (Code: ${errorCode})`);
    this.name = "WebhookSecurityError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

class WebhookSecurityEngine {
  constructor(options = {}) {
    this.toleranceSeconds = options.toleranceSeconds || 300; // 5-minute anti-replay window
    this.processedNonces = new Map(); // Nonce / event ID cache with TTL
    this.ttlMs = (options.ttlMinutes || 15) * 60 * 1000;
  }

  /**
   * Cleans expired nonces from memory
   */
  _purgeExpiredNonces() {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.processedNonces.entries()) {
      if (now > expiresAt) {
        this.processedNonces.delete(nonce);
      }
    }
  }

  /**
   * Cryptographically verifies an incoming webhook payload
   * @param {string|Buffer} rawPayload - Exact unparsed request body string or buffer
   * @param {string} signatureHeader - Header containing timestamp and signature (e.g. "t=1790000000,v1=abc...")
   * @param {string} secretKey - Secret HMAC key for the provider
   * @param {string} nonce - Unique event/delivery ID for idempotency
   * @returns {boolean}
   */
  verifyWebhook({ rawPayload, signatureHeader, secretKey, nonce }) {
    this._purgeExpiredNonces();

    if (!rawPayload || (typeof rawPayload !== "string" && !Buffer.isBuffer(rawPayload))) {
      throw new WebhookSecurityError("Raw payload string or buffer is required", "MISSING_PAYLOAD");
    }

    if (!signatureHeader || typeof signatureHeader !== "string") {
      throw new WebhookSecurityError("Signature header is missing or invalid format", "MISSING_SIGNATURE", 401);
    }

    if (!secretKey) {
      throw new WebhookSecurityError("Webhook secret key is not configured for provider", "MISSING_SECRET_KEY", 500);
    }

    // 1. Parse signature header (supports format "t=...,v1=..." or raw hex)
    let timestamp = null;
    let signature = null;

    if (signatureHeader.includes("t=") && signatureHeader.includes("v1=")) {
      const parts = signatureHeader.split(",");
      for (const part of parts) {
        const [k, v] = part.trim().split("=");
        if (k === "t") timestamp = parseInt(v, 10);
        if (k === "v1") signature = v;
      }
    } else {
      // Direct hex signature without timestamp prefix
      signature = signatureHeader.trim();
    }

    if (!signature) {
      throw new WebhookSecurityError("Signature could not be parsed from header", "MALFORMED_SIGNATURE", 401);
    }

    // 2. Timestamp Freshness Verification (Anti-Replay Window)
    if (timestamp !== null) {
      if (isNaN(timestamp)) {
        throw new WebhookSecurityError("Timestamp in signature header is not an integer", "INVALID_TIMESTAMP", 400);
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      const diff = nowSeconds - timestamp;

      // Expired if sent more than toleranceSeconds in the past
      if (diff > this.toleranceSeconds) {
        throw new WebhookSecurityError(
          `Webhook timestamp expired. Age: ${diff}s, Max allowed: ${this.toleranceSeconds}s`,
          "EXPIRED_TIMESTAMP",
          400
        );
      }

      // Expired/Rejected if timestamp is too far in the future (clock skew > tolerance)
      if (diff < -this.toleranceSeconds) {
        throw new WebhookSecurityError(
          `Webhook timestamp in the future. Clock skew: ${Math.abs(diff)}s`,
          "FUTURE_TIMESTAMP",
          400
        );
      }
    }

    // 3. Nonce / Event-ID Deduplication & Replay Protection
    if (nonce) {
      if (this.processedNonces.has(nonce)) {
        throw new WebhookSecurityError(
          `Duplicate or replayed webhook event ID detected: ${nonce}`,
          "REPLAYED_NONCE",
          409
        );
      }
    }

    // 4. Cryptographic HMAC-SHA256 Signature Verification
    const payloadStringToSign = timestamp !== null
      ? `${timestamp}.${typeof rawPayload === "string" ? rawPayload : rawPayload.toString("utf8")}`
      : (typeof rawPayload === "string" ? rawPayload : rawPayload.toString("utf8"));

    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(payloadStringToSign)
      .digest("hex");

    let isMatch = false;
    try {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch (err) {
      // Buffer length mismatch or malformed hex
      isMatch = false;
    }

    if (!isMatch) {
      throw new WebhookSecurityError("Signature mismatch: Payload tampering detected", "INVALID_SIGNATURE", 401);
    }

    // Record verified nonce with TTL
    if (nonce) {
      this.processedNonces.set(nonce, Date.now() + this.ttlMs);
    }

    return true;
  }
}

// Singleton default instance
const defaultWebhookSecurity = new WebhookSecurityEngine();

module.exports = {
  WebhookSecurityEngine,
  WebhookSecurityError,
  defaultWebhookSecurity
};
