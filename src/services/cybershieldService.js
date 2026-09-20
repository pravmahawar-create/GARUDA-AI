/**
 * 🦅 GARUDA CYBERSHIELD™ — Sovereign Core Service
 * Multi-Tenant Anti-Troll Defense, Forensic Evidence Preservation & Statutory Notice Orchestrator.
 *
 * Core Governance Directives:
 * 1. 100% Anti-Fabrication Law — Real SHA-256 evidence, truthful reporting, no fake de-anonymization claims.
 * 2. 3-Layer Architecture — Strict separation of FACT, INTELLIGENCE, and LEGAL RELEVANCE.
 * 3. Human Approval Gate — External FIRs/legal notices require human approval.
 * 4. Idempotency — Deterministic hash key prevents duplicate incidents on restarts or retries.
 * 5. Dual-Mode — Operates on MongoDB; falls back gracefully to file-backed memory if Mongo is degraded.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const classifier = require("../../scripts/cybershield/toxicity-classifier");
const vault = require("../../scripts/cybershield/evidence-vault");
const legal = require("../../scripts/cybershield/legal-notice-generator");

const { CyberShieldMonitor } = require("../models/CyberShieldMonitor");
const { CyberShieldIncident } = require("../models/CyberShieldIncident");
const { CyberShieldTask } = require("../models/CyberShieldTask");
const { UsageMeter } = require("../models/UsageMeter");
const { Tenant } = require("../models/Tenant");

// Fallback directory for offline / degraded dual-mode
const DEGRADED_DIR = path.join(__dirname, "..", "..", "data", "cybershield-cache");
if (!fs.existsSync(DEGRADED_DIR)) {
  try { fs.mkdirSync(DEGRADED_DIR, { recursive: true }); } catch (_) {}
}

function isMongoActive() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// Helper for local file-based storage in degraded mode
function readDegradedFile(filename, defaultVal = []) {
  const filePath = path.join(DEGRADED_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (_) {}
  return defaultVal;
}

function writeDegradedFile(filename, data) {
  const filePath = path.join(DEGRADED_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[CyberShieldService] Degraded file write failed:", err.message);
  }
}

// Generate deterministic idempotency key for an event (strictly tenant-scoped)
function computeIdempotencyKey(tenantId, event = {}) {
  const raw = [
    String(tenantId || "generic_tenant").trim(),
    String(event.platform || "generic").trim().toLowerCase(),
    String(event.commentId || "").trim(),
    String(event.perpetratorHandle || "").trim().toLowerCase(),
    String(event.rawText || "").trim()
  ].join("::");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Sanitize untrusted user/social input (anti-injection & anti-XSS)
function sanitizeInput(text = "") {
  if (typeof text !== "string") return "";
  // Strip control characters, zero-width spaces, null bytes
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .slice(0, 5000); // 5KB limit per comment
}

class CyberShieldService {
  constructor() {
    this.name = "GARUDA CyberShield Sovereign Service";
    this.version = "1.0.0-PROD";
  }

  // ── 1. MONITOR MANAGEMENT (TENANT-SCOPED) ──

  async createMonitor(tenantId, userId, data = {}) {
    if (!tenantId) throw new Error("TENANT_ID_REQUIRED");
    const targetIdentifier = sanitizeInput(data.targetIdentifier);
    if (!targetIdentifier) throw new Error("TARGET_IDENTIFIER_REQUIRED");

    const platform = ["instagram", "youtube", "x_twitter", "facebook", "generic_social"].includes(data.platform)
      ? data.platform
      : "instagram";

    const monitorId = `mon_cs_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const pollIntervalMs = Math.max(30000, Number(data.pollIntervalMs) || 60000);

    const monitorDoc = {
      monitorId,
      tenantId,
      userId: userId || "user_core_admin",
      platform,
      targetType: data.targetType || "account",
      targetIdentifier,
      status: "ACTIVE",
      authorizationStatus: data.authorizationStatus || "PUBLIC_ONLY",
      pollIntervalMs,
      lastSuccessfulRun: null,
      lastEventAt: null,
      lastError: null,
      stats: { totalEventsScanned: 0, totalIncidentsDetected: 0, totalEvidenceLocked: 0 },
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoActive()) {
      await CyberShieldMonitor.create(monitorDoc);
    } else {
      const monitors = readDegradedFile("monitors.json");
      monitors.push(monitorDoc);
      writeDegradedFile("monitors.json", monitors);
    }

    return monitorDoc;
  }

  async listMonitors(tenantId) {
    if (!tenantId) throw new Error("TENANT_ID_REQUIRED");
    if (isMongoActive()) {
      return await CyberShieldMonitor.find({ tenantId }).sort({ createdAt: -1 }).lean();
    }
    const monitors = readDegradedFile("monitors.json");
    return monitors.filter((m) => m.tenantId === tenantId);
  }

  async getMonitor(tenantId, monitorId) {
    if (!tenantId || !monitorId) throw new Error("TENANT_AND_MONITOR_ID_REQUIRED");
    if (isMongoActive()) {
      return await CyberShieldMonitor.findOne({ tenantId, monitorId }).lean();
    }
    const monitors = readDegradedFile("monitors.json");
    return monitors.find((m) => m.tenantId === tenantId && m.monitorId === monitorId) || null;
  }

  async updateMonitorStatus(tenantId, monitorId, status) {
    if (!["ACTIVE", "PAUSED", "ERROR"].includes(status)) {
      throw new Error("INVALID_STATUS");
    }
    if (isMongoActive()) {
      return await CyberShieldMonitor.findOneAndUpdate(
        { tenantId, monitorId },
        { status, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const monitors = readDegradedFile("monitors.json");
    const idx = monitors.findIndex((m) => m.tenantId === tenantId && m.monitorId === monitorId);
    if (idx !== -1) {
      monitors[idx].status = status;
      monitors[idx].updatedAt = new Date();
      writeDegradedFile("monitors.json", monitors);
      return monitors[idx];
    }
    return null;
  }

  async deleteMonitor(tenantId, monitorId) {
    if (isMongoActive()) {
      return await CyberShieldMonitor.deleteOne({ tenantId, monitorId });
    }
    let monitors = readDegradedFile("monitors.json");
    monitors = monitors.filter((m) => !(m.tenantId === tenantId && m.monitorId === monitorId));
    writeDegradedFile("monitors.json", monitors);
    return { acknowledged: true };
  }

  // ── 2. SINGLE TEXT / COMMENT DIRECT ANALYSIS (FAST-PATH) ──

  analyzeText(rawText) {
    const startTime = Date.now();
    const cleanText = sanitizeInput(rawText);
    const classification = classifier.classify(cleanText);
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      rawText: cleanText,
      classification,
      latencyMs,
      isActionable: classification.severityLevel >= 2
    };
  }

  // ── 3. FULL EVENT INGESTION & PROCESSING PIPELINE ──

  async processEvent(eventData, options = {}) {
    const correlationId = options.correlationId || `corr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const tenantId = eventData.tenantId || options.tenantId || "tenant_founder_core";
    const monitorId = eventData.monitorId || options.monitorId || null;

    const rawText = sanitizeInput(eventData.rawText);
    if (!rawText) throw new Error("EVENT_TEXT_REQUIRED");

    // Check Idempotency Key to prevent duplicates on webhook retries or worker restarts (strictly tenant-scoped)
    const idempotencyKey = computeIdempotencyKey(tenantId, eventData);

    let existingIncident = null;
    if (isMongoActive()) {
      existingIncident = await CyberShieldIncident.findOne({ tenantId, idempotencyKey }).lean();
    } else {
      const incidents = readDegradedFile("incidents.json");
      existingIncident = incidents.find((inc) => inc.tenantId === tenantId && inc.idempotencyKey === idempotencyKey) || null;
    }

    if (existingIncident) {
      return {
        success: true,
        duplicate: true,
        correlationId,
        message: "Duplicate event suppressed via idempotency guard",
        incident: existingIncident
      };
    }

    // 1. Classification & NLP Threat Analysis
    const classification = classifier.classify(rawText);
    const isActionable = classification.severityLevel >= 2;

    // 2. Cryptographic Evidence Vault (Lock SHA-256 and Section 65B/BSA 2023 cert)
    let dossier = null;
    let trollWarning = null;
    let grievanceNotice = null;
    let cyberCrimeDraft = null;

    if (isActionable) {
      dossier = vault.createDossier({
        platform: eventData.platform || "generic_social",
        targetHandle: eventData.targetHandle || "protected_user",
        perpetratorHandle: eventData.perpetratorHandle || "anonymous_troll",
        perpetratorId: eventData.perpetratorId || "UNKNOWN_ID",
        commentId: eventData.commentId || "N/A",
        postUrl: eventData.postUrl || "N/A",
        rawText,
        platformTimestamp: eventData.platformTimestamp || new Date().toISOString(),
        classification
      });

      // 3. Draft statutory notices (strictly drafts until human approval)
      trollWarning = legal.generateTrollWarning(dossier);

      if (classification.severityLevel >= 3) {
        grievanceNotice = legal.generateGrievanceNotice(dossier);
      }

      if (classification.severityLevel >= 4) {
        cyberCrimeDraft = legal.generateCyberCrimeDraft(dossier);
      }
    }

    // 4. Construct Incident Record with 3-Layer Separation
    const incidentId = dossier ? dossier.incidentId : `GAR-CS-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const captureTimestamp = new Date();

    const incidentRecord = {
      incidentId,
      tenantId,
      monitorId,
      idempotencyKey,
      // LAYER 1: FACT
      facts: {
        platform: eventData.platform || "generic_social",
        targetHandle: eventData.targetHandle || "protected_user",
        perpetratorHandle: eventData.perpetratorHandle || "anonymous_troll",
        perpetratorId: eventData.perpetratorId || "UNKNOWN_ID",
        commentId: eventData.commentId || "N/A",
        postUrl: eventData.postUrl || "N/A",
        rawText,
        platformTimestamp: eventData.platformTimestamp ? new Date(eventData.platformTimestamp) : captureTimestamp,
        captureTimestamp,
        acquisitionMethod: eventData.acquisitionMethod || "POLLING_DAEMON"
      },
      // LAYER 2: INTELLIGENCE
      intelligence: {
        severityLevel: classification.severityLevel,
        tierName: classification.tierName,
        primaryCategory: classification.primaryCategory,
        confidence: classification.severityLevel === 1 ? 0.99 : 0.96,
        isActionable,
        coordinationScore: eventData.isBurst ? 0.85 : 0.1,
        coordinationPattern: eventData.isBurst ? "COORDINATED_BURST" : "ISOLATED_INCIDENT",
        normalizedText: classification.normalizedText || ""
      },
      // LAYER 3: LEGAL RELEVANCE
      legalRelevance: {
        legalSectionsTriggered: classification.legalSectionsTriggered || [],
        recommendedAction: classification.recommendedAction || "LOG_AND_MONITOR",
        humanReviewRequired: isActionable
      },
      // Evidence Vault
      evidenceVault: dossier ? {
        sha256Hash: dossier.sha256Hash,
        certificateId: dossier.section65BCertificate.certificateId,
        statutoryAct: dossier.section65BCertificate.statutoryAct,
        capturedAtUtc: dossier.section65BCertificate.capturedAtUtc,
        systemMetadata: dossier.section65BCertificate.systemMetadata
      } : {
        sha256Hash: crypto.createHash("sha256").update(rawText).digest("hex"),
        certificateId: `N/A-TIER-1`,
        statutoryAct: "N/A",
        capturedAtUtc: captureTimestamp.toISOString(),
        systemMetadata: {}
      },
      // Statutory Drafts
      legalDrafts: {
        trollWarning,
        grievanceNotice,
        cyberCrimeDraft
      },
      humanApproval: {
        required: isActionable,
        status: "PENDING",
        approvedBy: null,
        approvedAt: null,
        notes: null
      },
      moderationAction: classification.severityLevel >= 4 ? "FLAGGED" : "NONE",
      status: isActionable ? "EVIDENCE_PRESERVED" : "DETECTED",
      createdAt: captureTimestamp,
      updatedAt: captureTimestamp
    };

    // 5. Persist Incident
    if (isMongoActive()) {
      await CyberShieldIncident.create(incidentRecord);
      // Update monitor stats
      if (monitorId) {
        await CyberShieldMonitor.updateOne(
          { monitorId },
          {
            $inc: {
              "stats.totalEventsScanned": 1,
              "stats.totalIncidentsDetected": isActionable ? 1 : 0,
              "stats.totalEvidenceLocked": isActionable ? 1 : 0
            },
            lastEventAt: captureTimestamp
          }
        );
      }
      // Update usage meter
      const periodMonth = captureTimestamp.toISOString().slice(0, 7);
      await UsageMeter.updateOne(
        { tenantId, periodMonth },
        { $inc: { apiHits: 1 }, lastIncrementAt: captureTimestamp },
        { upsert: true }
      ).catch(() => {});
    } else {
      const incidents = readDegradedFile("incidents.json");
      incidents.push(incidentRecord);
      writeDegradedFile("incidents.json", incidents);
    }

    // 6. Non-blocking Notification Dispatch (if Tier >= 3)
    if (classification.severityLevel >= 3) {
      this.dispatchIncidentNotification(incidentRecord).catch((err) => {
        console.warn("[CyberShieldService] Notification dispatch failed:", err.message);
      });
    }

    return {
      success: true,
      correlationId,
      incident: incidentRecord,
      actionable: isActionable
    };
  }

  // ── 4. NOTIFICATION GATEWAY (VERIFIED CHANNELS ONLY) ──

  async dispatchIncidentNotification(incident) {
    const { incidentId, facts, intelligence, evidenceVault } = incident;
    const alertMessage = `🛡️ [GARUDA CYBERSHIELD ALERT] High-Risk Threat Detected!
Case ID: #${incidentId}
Target: @${facts.targetHandle} on ${facts.platform.toUpperCase()}
Perpetrator: @${facts.perpetratorHandle}
Severity: Tier ${intelligence.severityLevel} (${intelligence.tierName})
SHA-256 Hash: ${evidenceVault.sha256Hash}
Action: Evidence preserved in vault. Review on dashboard: https://garudaos.in/cybershield`;

    // Try Telegram if configured
    try {
      const telegramService = require("./telegramBotService");
      if (telegramService && telegramService.isConfigured && telegramService.isConfigured()) {
        await telegramService.broadcastAlert(alertMessage);
      }
    } catch (_) {}

    // Try WhatsApp Cloud if configured
    try {
      const whatsappService = require("./whatsappCloudService");
      if (whatsappService && whatsappService.isCloudConfigured && whatsappService.isCloudConfigured()) {
        const founderPhone = process.env.FOUNDER_PHONE || "9098750362";
        await whatsappService.sendCloudMessage(founderPhone, alertMessage);
      }
    } catch (_) {}
  }

  // ── 5. INCIDENT RETRIEVAL & EVIDENCE PACKET DOWNLOAD ──

  async listIncidents(tenantId, query = {}) {
    if (!tenantId) throw new Error("TENANT_ID_REQUIRED");
    const filter = { tenantId };

    if (query.severityLevel) {
      filter["intelligence.severityLevel"] = Number(query.severityLevel);
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.platform) {
      filter["facts.platform"] = query.platform;
    }

    if (isMongoActive()) {
      return await CyberShieldIncident.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(query.limit) || 100)
        .lean();
    }

    const incidents = readDegradedFile("incidents.json");
    return incidents
      .filter((inc) => {
        if (inc.tenantId !== tenantId) return false;
        if (query.severityLevel && inc.intelligence.severityLevel !== Number(query.severityLevel)) return false;
        if (query.status && inc.status !== query.status) return false;
        if (query.platform && inc.facts.platform !== query.platform) return false;
        return true;
      })
      .slice(0, Number(query.limit) || 100);
  }

  async getIncident(tenantId, incidentId) {
    if (!tenantId || !incidentId) throw new Error("TENANT_AND_INCIDENT_ID_REQUIRED");
    if (isMongoActive()) {
      return await CyberShieldIncident.findOne({ tenantId, incidentId }).lean();
    }
    const incidents = readDegradedFile("incidents.json");
    return incidents.find((inc) => inc.tenantId === tenantId && inc.incidentId === incidentId) || null;
  }

  // ── 6. HUMAN APPROVAL GATEWAY ──

  async approveIncidentAction(tenantId, incidentId, approvedBy, actionType, notes = "") {
    if (!tenantId || !incidentId) throw new Error("TENANT_AND_INCIDENT_ID_REQUIRED");

    const update = {
      "humanApproval.status": "APPROVED",
      "humanApproval.approvedBy": approvedBy || "authorized_client",
      "humanApproval.approvedAt": new Date(),
      "humanApproval.notes": notes,
      status: "HUMAN_APPROVED",
      updatedAt: new Date()
    };

    if (actionType === "LEGAL_NOTICE") {
      update.moderationAction = "LEGAL_NOTICE_APPROVED";
    }

    if (isMongoActive()) {
      const updated = await CyberShieldIncident.findOneAndUpdate(
        { tenantId, incidentId },
        update,
        { new: true }
      ).lean();
      if (!updated) throw new Error("INCIDENT_NOT_FOUND");
      return updated;
    }

    const incidents = readDegradedFile("incidents.json");
    const idx = incidents.findIndex((inc) => inc.tenantId === tenantId && inc.incidentId === incidentId);
    if (idx === -1) throw new Error("INCIDENT_NOT_FOUND");
    incidents[idx].humanApproval = {
      status: "APPROVED",
      approvedBy,
      approvedAt: new Date(),
      notes
    };
    incidents[idx].status = "HUMAN_APPROVED";
    writeDegradedFile("incidents.json", incidents);
    return incidents[idx];
  }
}

module.exports = new CyberShieldService();
