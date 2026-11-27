/**
 * 🦅 GARUDA OS — SERVER-SIDE VERIFIED BANK RECEIPT ENGINE (PHASE 2 CRITICAL CONTROL)
 * Replaces caller-supplied boolean self-attestation (`verifiedBankReceipt: true`)
 * with cryptographically verified, single-use server-side bank receipt evidence.
 *
 * Strictly separates:
 * - "FUEL_TANK_TOPUP": Advance B2B software consideration paid to GARUDA corporate account.
 * - "COMMISSION_INVOICE_PAYMENT": Postpaid B2B software fee invoice paid to GARUDA corporate account.
 */

const crypto = require("crypto");
const { toMinorUnits, fromMinorUnits } = require("./persistenceRepository");
const { defaultAuditLogger } = require("./auditLogger");

const RECEIPT_PURPOSES = Object.freeze({
  FUEL_TANK_TOPUP: "FUEL_TANK_TOPUP",
  COMMISSION_INVOICE_PAYMENT: "COMMISSION_INVOICE_PAYMENT"
});

class BankReceiptVerificationError extends Error {
  constructor(message, errorCode, httpStatus = 400) {
    super(`[BANK_RECEIPT_VERIFICATION_ERROR] ${message} (${errorCode})`);
    this.name = "BankReceiptVerificationError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

class VerifiedBankReceiptRegistry {
  constructor(options = {}) {
    this.receipts = new Map(); // bankReceiptId -> receiptRecord
    this.refIndex = new Map(); // `${tenantId}::${purpose}::${bankTransactionRef}` -> bankReceiptId
    this.repository = options.repository || null;
  }

  _requireFeedSecret(explicitSecret = null) {
    const secret =
      explicitSecret ||
      process.env.FINTECH_BANK_FEED_SECRET ||
      process.env.FINTECH_WEBHOOK_SECRET ||
      null;
    if (!secret) {
      throw new BankReceiptVerificationError(
        "Bank receipt feed secret is not configured; cannot verify external bank receipt",
        "MISSING_BANK_FEED_SECRET",
        500
      );
    }
    return secret;
  }

  /**
   * Ingests an authenticated bank statement feed / signed PSP receipt webhook.
   * Requires cryptographic HMAC-SHA256 verification before creating trusted server state.
   */
  ingestAuthenticatedReceipt({
    rawFeedPayload,
    feedSignatureHeader,
    feedSecretKey = null,
    tenantId,
    merchantId,
    purpose,
    bankTransactionRef,
    payerCorporateAccount,
    amount,
    currency = "INR",
    settledAt = new Date().toISOString()
  }) {
    if (!tenantId || !merchantId) {
      throw new BankReceiptVerificationError("tenantId and merchantId are mandatory", "MISSING_TENANT_OR_MERCHANT", 400);
    }

    const normalizedPurpose = String(purpose || "").toUpperCase();
    if (!RECEIPT_PURPOSES[normalizedPurpose]) {
      throw new BankReceiptVerificationError(`Invalid receipt purpose: ${purpose}`, "INVALID_RECEIPT_PURPOSE", 400);
    }

    if (!bankTransactionRef || !payerCorporateAccount) {
      throw new BankReceiptVerificationError(
        "Authenticated bankTransactionRef and payerCorporateAccount are required",
        "MISSING_BANK_RECEIPT_DETAILS",
        400
      );
    }

    const secret = this._requireFeedSecret(feedSecretKey);
    const rawStr = typeof rawFeedPayload === "string" ? rawFeedPayload : JSON.stringify(rawFeedPayload || "");
    if (!rawStr || !feedSignatureHeader) {
      throw new BankReceiptVerificationError(
        "Raw feed payload and cryptographic signature header are required",
        "MISSING_FEED_SIGNATURE",
        401
      );
    }

    // Supports "t=<ts>,v1=<hex>" or raw HMAC-SHA256 hex digest over rawStr
    let sigHex = String(feedSignatureHeader).trim();
    let payloadToSign = rawStr;
    if (sigHex.includes("t=") && sigHex.includes("v1=")) {
      const parts = Object.fromEntries(sigHex.split(",").map((p) => p.trim().split("=")));
      if (!parts.t || !parts.v1) {
        throw new BankReceiptVerificationError("Malformed bank feed signature header", "MALFORMED_FEED_SIGNATURE", 401);
      }
      const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(parts.t));
      if (!Number.isFinite(skew) || skew > 300) {
        throw new BankReceiptVerificationError("Expired or invalid bank feed timestamp", "EXPIRED_FEED_TIMESTAMP", 400);
      }
      sigHex = parts.v1;
      payloadToSign = `${parts.t}.${rawStr}`;
    }

    const expectedHex = crypto.createHmac("sha256", secret).update(payloadToSign).digest("hex");
    const sigBuf = Buffer.from(sigHex, "utf8");
    const expBuf = Buffer.from(expectedHex, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new BankReceiptVerificationError("Cryptographic bank feed signature mismatch", "INVALID_FEED_SIGNATURE", 401);
    }

    const dedupKey = `${String(tenantId)}::${normalizedPurpose}::${String(bankTransactionRef)}`;
    if (this.refIndex.has(dedupKey)) {
      throw new BankReceiptVerificationError(
        `Bank receipt reference "${bankTransactionRef}" already registered`,
        "DUPLICATE_BANK_RECEIPT",
        409
      );
    }

    const numericAmt = Number(amount);
    if (!Number.isFinite(numericAmt) || numericAmt <= 0) {
      throw new BankReceiptVerificationError("Verified receipt amount must be positive", "INVALID_RECEIPT_AMOUNT", 400);
    }

    const amountMinor = toMinorUnits(numericAmt);
    const bankReceiptId = `brcpt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const receiptHash = crypto
      .createHash("sha256")
      .update(`${bankReceiptId}:${tenantId}:${merchantId}:${normalizedPurpose}:${bankTransactionRef}:${amountMinor}:${expectedHex}`)
      .digest("hex");

    const record = {
      bankReceiptId,
      tenantId: String(tenantId),
      merchantId: String(merchantId),
      purpose: normalizedPurpose,
      bankTransactionRef: String(bankTransactionRef),
      payerCorporateAccount: String(payerCorporateAccount),
      amountMinor,
      amount: fromMinorUnits(amountMinor),
      currency: String(currency).toUpperCase(),
      hmacVerified: true,
      receiptHash,
      settledAt,
      consumed: false,
      consumedByRecordId: null,
      consumedAt: null,
      createdAt: new Date().toISOString()
    };

    this.receipts.set(bankReceiptId, record);
    this.refIndex.set(dedupKey, bankReceiptId);

    if (this.repository && typeof this.repository.saveState === "function") {
      this.repository.saveState();
    }

    defaultAuditLogger.logEvent({
      transactionId: bankReceiptId,
      actor: "BANK_FEED_VERIFIER",
      action: "AUTHENTICATED_BANK_RECEIPT_INGESTED",
      oldState: "NONE",
      newState: "VERIFIED_UNCONSUMED",
      providerReference: bankTransactionRef,
      payload: {
        tenantId,
        merchantId,
        purpose: normalizedPurpose,
        amount: record.amount,
        currency: record.currency,
        receiptHash
      }
    });

    return record;
  }

  /**
   * Atomically validates and consumes a verified bank receipt.
   * Rejects self-attested booleans, mismatched tenants/merchants/purposes,
   * insufficient verified amounts, or replay of already-consumed receipts.
   */
  consumeVerifiedReceipt({
    tenantId,
    merchantId,
    purpose,
    bankReceiptId = null,
    bankTransactionRef = null,
    expectedMinAmount = 0,
    consumedByRecordId
  }) {
    if (!tenantId || !merchantId) {
      throw new BankReceiptVerificationError("tenantId and merchantId are required", "MISSING_TENANT_OR_MERCHANT", 400);
    }

    const normalizedPurpose = String(purpose || "").toUpperCase();
    let record = null;

    if (bankReceiptId) {
      record = this.receipts.get(String(bankReceiptId)) || null;
    } else if (bankTransactionRef) {
      const lookupId = this.refIndex.get(`${String(tenantId)}::${normalizedPurpose}::${String(bankTransactionRef)}`);
      record = lookupId ? this.receipts.get(lookupId) : null;
    }

    if (!record || record.hmacVerified !== true) {
      throw new BankReceiptVerificationError(
        "No server-side authenticated bank receipt found; client boolean attestation is not accepted",
        "UNVERIFIED_BANK_RECEIPT",
        400
      );
    }
    if (record.tenantId !== String(tenantId)) {
      throw new BankReceiptVerificationError("Cross-tenant bank receipt usage denied", "TENANT_ISOLATION_VIOLATION", 403);
    }
    if (record.merchantId !== String(merchantId)) {
      throw new BankReceiptVerificationError("Bank receipt merchant mismatch", "RECEIPT_MERCHANT_MISMATCH", 403);
    }
    if (record.purpose !== normalizedPurpose) {
      throw new BankReceiptVerificationError(
        `Bank receipt purpose mismatch: expected ${normalizedPurpose}, got ${record.purpose}`,
        "RECEIPT_PURPOSE_MISMATCH",
        400
      );
    }
    if (record.consumed === true) {
      throw new BankReceiptVerificationError(
        `Bank receipt "${record.bankReceiptId}" has already been consumed`,
        "BANK_RECEIPT_ALREADY_CONSUMED",
        409
      );
    }

    const minMinor = toMinorUnits(expectedMinAmount || 0);
    if (minMinor > 0 && record.amountMinor < minMinor) {
      throw new BankReceiptVerificationError(
        `Verified bank receipt amount (${record.amount}) is less than claimed amount (${fromMinorUnits(minMinor)})`,
        "RECEIPT_AMOUNT_MISMATCH",
        400
      );
    }

    record.consumed = true;
    record.consumedByRecordId = consumedByRecordId || null;
    record.consumedAt = new Date().toISOString();

    if (this.repository && typeof this.repository.saveState === "function") {
      this.repository.saveState();
    }

    return record;
  }

  exportSnapshot() {
    return Array.from(this.receipts.values());
  }

  hydrateSnapshot(records = []) {
    this.receipts.clear();
    this.refIndex.clear();
    for (const rec of records) {
      if (rec && rec.bankReceiptId) {
        this.receipts.set(rec.bankReceiptId, { ...rec });
        this.refIndex.set(`${rec.tenantId}::${rec.purpose}::${rec.bankTransactionRef}`, rec.bankReceiptId);
      }
    }
  }
}

const defaultBankReceiptRegistry = new VerifiedBankReceiptRegistry();

module.exports = {
  RECEIPT_PURPOSES,
  BankReceiptVerificationError,
  VerifiedBankReceiptRegistry,
  defaultBankReceiptRegistry
};
