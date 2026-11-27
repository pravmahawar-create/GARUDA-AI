/**
 * 🦅 GARUDA OS — BSA SECTION 63 ELECTRONIC EVIDENCE ENGINE (PHASE 11)
 *
 * Truthful Compliance Architecture:
 * - Implements Bharatiya Sakshya Adhiniyam (BSA), 2023 Section 63(4)(c) preservation pipeline:
 *   1. Ingestion of original raw source bytes + UTR/intent/complaint provenance.
 *   2. Cryptographic SHA-256 hashing of raw bytes + append-only previousHash -> chainHash ledger.
 *   3. Server timestamps recorded in UTC internally + formatted IST alongside clock sync metadata.
 *   4. Structured Schedule Part A (Deponent/Custodian) & Part B (Qualified Technical Expert) drafts.
 *   5. Human-only signature gates: software NEVER auto-signs on behalf of a human or claims "court-certified".
 *   6. Complete access & export audit logging + independent tamper verification.
 */

const crypto = require("crypto");

const CASE_STATES = Object.freeze({
  ALERT_RECEIVED: "ALERT_RECEIVED",
  EVIDENCE_PRESERVED: "EVIDENCE_PRESERVED",
  UNDER_REVIEW: "UNDER_REVIEW",
  BANK_NOTIFIED: "BANK_NOTIFIED",
  RESOLVED: "RESOLVED"
});

class EvidenceEngineError extends Error {
  constructor(message, errorCode = "EVIDENCE_ERROR", httpStatus = 400) {
    super(`[BSA_SEC63_EVIDENCE] ${message} (${errorCode})`);
    this.name = "EvidenceEngineError";
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

function formatIst(date = new Date()) {
  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }) + " IST";
  } catch {
    return new Date(date).toISOString();
  }
}

class BsaSection63EvidenceService {
  constructor() {
    this.cases = new Map(); // caseId -> case object
    this.records = new Map(); // caseId -> array of preserved records (append-only hash chain)
    this.accessLogs = new Map(); // caseId -> array of view/export audit events
    this.genesisHash = "0".repeat(64);
  }

  _requireTenant(tenantId) {
    const clean = String(tenantId || "").trim();
    if (!clean) throw new EvidenceEngineError("Tenant ID is required", "TENANT_REQUIRED", 401);
    return clean;
  }

  _getAuthorizedCase(caseId, tenantId) {
    const cleanTenant = this._requireTenant(tenantId);
    const c = this.cases.get(caseId);
    if (!c) throw new EvidenceEngineError(`Evidence case "${caseId}" not found`, "CASE_NOT_FOUND", 404);
    if (c.tenantId !== cleanTenant) {
      throw new EvidenceEngineError("Cross-tenant evidence access denied", "TENANT_ISOLATION_VIOLATION", 403);
    }
    return c;
  }

  _logAccess(caseId, { actorId, role, action, details = {} }) {
    const logs = this.accessLogs.get(caseId) || [];
    logs.push({
      logId: `evlog_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      caseId,
      actorId: actorId || "SYSTEM",
      role: role || "unknown",
      action,
      details,
      timestampUtc: new Date().toISOString(),
      timestampIst: formatIst()
    });
    this.accessLogs.set(caseId, logs);
  }

  createCase({
    tenantId,
    merchantId,
    complaintRef,
    authorityOrBank,
    paymentIntentId = null,
    vanIdentifier = null,
    bankUtr = null,
    disputedAmount = 0,
    currency = "INR",
    summary = "",
    actorId = "DISPUTE_OFFICER"
  }) {
    const cleanTenant = this._requireTenant(tenantId);
    if (!merchantId || !complaintRef || !authorityOrBank) {
      throw new EvidenceEngineError("merchantId, complaintRef, and authorityOrBank are required", "MISSING_CASE_FIELDS", 400);
    }

    const now = new Date();
    const caseId = `evc_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const caseObj = {
      caseId,
      tenantId: cleanTenant,
      merchantId: String(merchantId),
      complaintRef: String(complaintRef).trim(),
      authorityOrBank: String(authorityOrBank).trim(),
      paymentIntentId,
      vanIdentifier,
      bankUtr,
      disputedAmount: Number(disputedAmount || 0),
      currency: String(currency || "INR").toUpperCase(),
      summary: String(summary || ""),
      status: CASE_STATES.ALERT_RECEIVED,
      serverHostInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        clockSyncSource: "UTC_SYSTEM_CLOCK"
      },
      partAAttestation: {
        signed: false,
        status: "PENDING_HUMAN_REVIEW_AND_SIGNATURE",
        deponentName: null,
        designation: null,
        signedAtUtc: null,
        signedAtIst: null,
        declarationConfirmed: false
      },
      partBVerification: {
        signed: false,
        status: "PENDING_QUALIFIED_EXPERT_SIGNATURE",
        expertName: null,
        qualification: null,
        signedAtUtc: null,
        signedAtIst: null,
        examinationTooling: null
      },
      legalDisclaimer:
        "Evidence preservation draft compliant with BSA 2023 Section 63 Schedule structure. Final legal admissibility rests solely with the competent court/authority and requires human signatory execution.",
      createdAtUtc: now.toISOString(),
      createdAtIst: formatIst(now),
      updatedAtUtc: now.toISOString()
    };

    this.cases.set(caseId, caseObj);
    this.records.set(caseId, []);
    this._logAccess(caseId, { actorId, role: "tenant_operator", action: "CASE_CREATED" });
    return caseObj;
  }

  ingestSourceRecord({
    tenantId,
    caseId,
    sourceType, // BANK_WEBHOOK_RAW | PAYMENT_INTENT_RECORD | SETTLEMENT_UTR_FEED | AUTH_TELEMETRY_LOG
    sourceSystem,
    originalRawPayload,
    actorId = "EVIDENCE_INGESTION"
  }) {
    const c = this._getAuthorizedCase(caseId, tenantId);
    if (originalRawPayload === undefined || originalRawPayload === null) {
      throw new EvidenceEngineError("originalRawPayload bytes/string required", "MISSING_RAW_PAYLOAD", 400);
    }

    const rawString = typeof originalRawPayload === "string"
      ? originalRawPayload
      : JSON.stringify(originalRawPayload);

    const originalBytesSha256 = crypto.createHash("sha256").update(rawString, "utf8").digest("hex");
    const chain = this.records.get(caseId) || [];
    const previousHash = chain.length > 0 ? chain[chain.length - 1].chainHash : this.genesisHash;
    const now = new Date();
    const recordId = `evr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const chainInput = `${recordId}:${caseId}:${sourceType}:${sourceSystem}:${originalBytesSha256}:${now.toISOString()}:${previousHash}`;
    const chainHash = crypto.createHash("sha256").update(chainInput).digest("hex");

    const record = Object.freeze({
      recordId,
      caseId,
      tenantId: c.tenantId,
      sourceType: String(sourceType || "BANK_WEBHOOK_RAW"),
      sourceSystem: String(sourceSystem || "UNSPECIFIED_SYSTEM"),
      originalRawBytes: rawString,
      byteLength: Buffer.byteLength(rawString, "utf8"),
      originalBytesSha256,
      previousHash,
      chainHash,
      ingestedAtUtc: now.toISOString(),
      ingestedAtIst: formatIst(now)
    });

    chain.push(record);
    this.records.set(caseId, chain);
    if (c.status === CASE_STATES.ALERT_RECEIVED) {
      c.status = CASE_STATES.EVIDENCE_PRESERVED;
    }
    c.updatedAtUtc = now.toISOString();
    this._logAccess(caseId, { actorId, role: "system", action: "RECORD_INGESTED", details: { recordId, originalBytesSha256 } });
    return record;
  }

  verifyCaseChain(caseId, tenantId) {
    this._getAuthorizedCase(caseId, tenantId);
    const chain = this.records.get(caseId) || [];
    for (let i = 0; i < chain.length; i++) {
      const rec = chain[i];
      const expectedPrev = i === 0 ? this.genesisHash : chain[i - 1].chainHash;
      if (rec.previousHash !== expectedPrev) {
        return {
          valid: false,
          tamperedIndex: i,
          reason: `Previous hash link mismatch at record ${rec.recordId}`
        };
      }
      const recalculatedRawSha = crypto.createHash("sha256").update(rec.originalRawBytes, "utf8").digest("hex");
      if (recalculatedRawSha !== rec.originalBytesSha256) {
        return {
          valid: false,
          tamperedIndex: i,
          reason: `Original raw bytes modified for record ${rec.recordId}`
        };
      }
      const chainInput = `${rec.recordId}:${rec.caseId}:${rec.sourceType}:${rec.sourceSystem}:${rec.originalBytesSha256}:${rec.ingestedAtUtc}:${expectedPrev}`;
      const recalculatedChain = crypto.createHash("sha256").update(chainInput).digest("hex");
      if (recalculatedChain !== rec.chainHash) {
        return {
          valid: false,
          tamperedIndex: i,
          reason: `Chain hash mismatch at record ${rec.recordId}`
        };
      }
    }
    return { valid: true, verifiedRecordCount: chain.length, rootChainHash: chain[chain.length - 1]?.chainHash || this.genesisHash };
  }

  generateCertificateDraft(caseId, tenantId) {
    const c = this._getAuthorizedCase(caseId, tenantId);
    const integrity = this.verifyCaseChain(caseId, tenantId);
    const chain = this.records.get(caseId) || [];

    return {
      statutoryBasis: "Bharatiya Sakshya Adhiniyam (BSA), 2023 — Section 63(4)(c) Schedule Draft",
      draftNotice: "DRAFT RECORD SCHEDULE FOR HUMAN REVIEW & EXECUTION — Software never auto-signs or declares admissibility.",
      caseSummary: {
        caseId: c.caseId,
        complaintRef: c.complaintRef,
        authorityOrBank: c.authorityOrBank,
        paymentIntentId: c.paymentIntentId,
        bankUtr: c.bankUtr,
        vanIdentifier: c.vanIdentifier,
        status: c.status
      },
      integrityVerification: integrity,
      partA_DeponentDraft: {
        title: "THE SCHEDULE — PART A (To be filled and signed by the Party / Authorized Custodian)",
        deviceType: "Cloud / Enterprise Server Environment",
        serverIdentifiers: c.serverHostInfo,
        hashesDeclared: chain.map((r) => ({
          recordId: r.recordId,
          sourceType: r.sourceType,
          sha256Hash: r.originalBytesSha256,
          capturedAtIst: r.ingestedAtIst
        })),
        lawfulControlStatementDraft:
          "The computer/server resource producing the attached electronic outputs was operated under lawful management during regular transaction orchestration and evidence logging.",
        attestationState: c.partAAttestation
      },
      partB_ExpertDraft: {
        title: "THE SCHEDULE — PART B (To be completed and signed by Qualified Technical Expert)",
        hashAlgorithmUsed: "SHA-256",
        preservationMethod: "Immutable append-only hash-chained preservation of original raw bytes",
        verificationResult: integrity.valid ? "HASH_CHAIN_MATCHED" : `TAMPER_DETECTED: ${integrity.reason}`,
        verificationState: c.partBVerification
      }
    };
  }

  signPartA({ tenantId, caseId, deponentName, designation, signerContext = {} }) {
    const c = this._getAuthorizedCase(caseId, tenantId);
    if (!signerContext || !["platform_founder", "tenant_admin", "compliance_officer"].includes(signerContext.role)) {
      throw new EvidenceEngineError("Unauthorized role attempting Part A custodian signature", "UNAUTHORIZED_PART_A_SIGNER", 403);
    }
    if (!deponentName || !designation) {
      throw new EvidenceEngineError("Human deponentName and designation required for Part A signature", "MISSING_SIGNER_DETAILS", 400);
    }
    const now = new Date();
    c.partAAttestation = {
      signed: true,
      status: "HUMAN_CUSTODIAN_SIGNED",
      deponentName: String(deponentName).trim(),
      designation: String(designation).trim(),
      signedByActorId: signerContext.actorId || "authorized_custodian",
      signedAtUtc: now.toISOString(),
      signedAtIst: formatIst(now),
      declarationConfirmed: true
    };
    c.status = CASE_STATES.UNDER_REVIEW;
    c.updatedAtUtc = now.toISOString();
    this._logAccess(caseId, { actorId: signerContext.actorId, role: signerContext.role, action: "PART_A_SIGNED" });
    return c;
  }

  signPartB({ tenantId, caseId, expertName, qualification, examinationTooling = "SHA-256 Forensic Verifier", signerContext = {} }) {
    const c = this._getAuthorizedCase(caseId, tenantId);
    if (!signerContext || !["platform_founder", "qualified_expert"].includes(signerContext.role)) {
      throw new EvidenceEngineError(
        "Part B signature restricted to authorized qualified_expert or Platform Founder technical verifier",
        "UNAUTHORIZED_EXPERT_SIGNER",
        403
      );
    }
    if (!expertName || !qualification) {
      throw new EvidenceEngineError("expertName and qualification required for Part B signature", "MISSING_EXPERT_DETAILS", 400);
    }
    const integrity = this.verifyCaseChain(caseId, tenantId);
    if (!integrity.valid) {
      throw new EvidenceEngineError(`Cannot sign Part B: evidence integrity check failed (${integrity.reason})`, "INTEGRITY_CHECK_FAILED", 409);
    }
    const now = new Date();
    c.partBVerification = {
      signed: true,
      status: "EXPERT_VERIFIED_SIGNED",
      expertName: String(expertName).trim(),
      qualification: String(qualification).trim(),
      examinationTooling,
      signedByActorId: signerContext.actorId || "qualified_expert",
      signedAtUtc: now.toISOString(),
      signedAtIst: formatIst(now)
    };
    c.status = CASE_STATES.BANK_NOTIFIED;
    c.updatedAtUtc = now.toISOString();
    this._logAccess(caseId, { actorId: signerContext.actorId, role: signerContext.role, action: "PART_B_SIGNED" });
    return c;
  }

  exportEvidencePackage(caseId, tenantId, actorContext = {}) {
    const c = this._getAuthorizedCase(caseId, tenantId);
    const bsaSection63ScheduleDraft = this.generateCertificateDraft(caseId, tenantId);
    const records = this.records.get(caseId) || [];
    const logs = this.accessLogs.get(caseId) || [];
    this._logAccess(caseId, { actorId: actorContext.actorId || "EXPORT", role: actorContext.role || "tenant", action: "EVIDENCE_EXPORTED" });

    const manifestPayload = {
      exportId: `evx_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      exportedAtUtc: new Date().toISOString(),
      exportedAtIst: formatIst(),
      caseMetadata: c,
      bsaSection63ScheduleDraft,
      preservedSourceRecords: records,
      accessAuditLog: logs
    };
    const manifestSha256 = crypto.createHash("sha256").update(JSON.stringify(manifestPayload)).digest("hex");
    return {
      ...manifestPayload,
      exportManifestSha256: manifestSha256
    };
  }

  listCases(tenantId) {
    const cleanTenant = this._requireTenant(tenantId);
    return Array.from(this.cases.values())
      .filter((c) => c.tenantId === cleanTenant)
      .map((c) => ({
        ...c,
        recordCount: (this.records.get(c.caseId) || []).length,
        chainIntegrity: this.verifyCaseChain(c.caseId, cleanTenant)
      }));
  }
}

const defaultBsaEvidenceService = new BsaSection63EvidenceService();

module.exports = {
  CASE_STATES,
  EvidenceEngineError,
  BsaSection63EvidenceService,
  defaultBsaEvidenceService
};
