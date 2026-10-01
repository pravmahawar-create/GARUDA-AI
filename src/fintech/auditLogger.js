/**
 * 🦅 GARUDA OS — IMMUTABLE FORENSIC AUDIT LOGGER
 * Cryptographic Hash Chaining & Tamper-Evident State Recording
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 14
 */

const crypto = require("crypto");

class AuditTamperingError extends Error {
  constructor(message, entryIndex) {
    super(`[AUDIT_TAMPERING_DETECTED] ${message} at index ${entryIndex}`);
    this.name = "AuditTamperingError";
    this.entryIndex = entryIndex;
  }
}

class ForensicAuditLogger {
  constructor() {
    this.logs = []; // Append-only audit chain
    this.genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";
  }

  _computePayloadHash(payload) {
    return crypto
      .createHash("sha256")
      .update(typeof payload === "string" ? payload : JSON.stringify(payload || {}))
      .digest("hex");
  }

  _computeChainHash(entry, prevHash) {
    const raw = `${entry.eventId}:${entry.transactionId}:${entry.timestamp}:${entry.actor}:${entry.action}:${entry.oldState}:${entry.newState}:${entry.payloadHash}:${prevHash}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Appends an immutable audit entry
   */
  logEvent({
    transactionId,
    actor = "SYSTEM",
    action,
    oldState = "NONE",
    newState,
    payload = {},
    providerReference = null,
    correlationId = null
  }) {
    const eventId = `aud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const timestamp = new Date().toISOString();
    const payloadHash = this._computePayloadHash(payload);
    
    const prevHash = this.logs.length > 0 
      ? this.logs[this.logs.length - 1].chainHash 
      : this.genesisHash;

    const entry = {
      eventId,
      transactionId,
      timestamp,
      actor,
      action,
      oldState,
      newState,
      payloadHash,
      providerReference,
      correlationId,
      previousHash: prevHash,
      chainHash: "" // Computed below
    };

    entry.chainHash = this._computeChainHash(entry, prevHash);
    
    // Freeze to prevent accidental in-memory mutation
    Object.freeze(entry);
    this.logs.push(entry);

    return entry;
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain
   * Throws AuditTamperingError if any entry was altered
   * @returns {boolean} true if chain is 100% valid
   */
  verifyChainIntegrity() {
    for (let i = 0; i < this.logs.length; i++) {
      const current = this.logs[i];
      const expectedPrevHash = i === 0 ? this.genesisHash : this.logs[i - 1].chainHash;

      if (current.previousHash !== expectedPrevHash) {
        throw new AuditTamperingError(
          `Previous hash mismatch: expected ${expectedPrevHash}, found ${current.previousHash}`,
          i
        );
      }

      const recalculatedChainHash = this._computeChainHash(current, expectedPrevHash);
      if (current.chainHash !== recalculatedChainHash) {
        throw new AuditTamperingError(
          `Chain hash corrupted: expected ${recalculatedChainHash}, recorded ${current.chainHash}`,
          i
        );
      }
    }
    return true;
  }

  getLogs(transactionId = null) {
    if (!transactionId) return [...this.logs];
    return this.logs.filter(l => l.transactionId === transactionId);
  }
}

const defaultAuditLogger = new ForensicAuditLogger();

module.exports = {
  ForensicAuditLogger,
  AuditTamperingError,
  defaultAuditLogger
};
