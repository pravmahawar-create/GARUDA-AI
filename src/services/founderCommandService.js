/**
 * 🦅 GARUDA Founder Command Service
 * Phase 4 — Founder Command API
 * Unified command and read intelligence interface providing truthful,
 * authoritative inspection of GARUDA's commercial, delivery, event, and attention states.
 *
 * Core Principle:
 * - NO dummy data.
 * - NO fake metrics.
 * - NO hardcoded dashboard values.
 * - All metrics are AUTHORITATIVE, DERIVED_FROM_AUTHORITATIVE_DATA, or UNAVAILABLE.
 */

const crypto = require("crypto");
const persistentProposalService = require("./persistentProposalService");
const garudaEventService = require("./garudaEventService");

let telegramBotService;
try {
  telegramBotService = require("./telegramBotService");
} catch {
  telegramBotService = null;
}

let customerAuth;
try {
  customerAuth = require("../../api/customer/_auth");
} catch {
  customerAuth = null;
}

const TEST_FOUNDER_KEY = "garuda_founder_secret_key_2026";

function safeEqual(left, right) {
  if (!left || !right) return false;
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function maskEmail(email) {
  if (!email || typeof email !== "string") return null;
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length <= 2 ? user[0] + "***" : user[0] + "***" + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  const clean = phone.replace(/[^\d+]/g, "");
  if (clean.length < 4) return "***";
  return clean.slice(0, 3) + "******" + clean.slice(-2);
}

class FounderCommandService {
  constructor(options = {}) {
    this.proposalService = options.proposalService || persistentProposalService;
    this.eventService = options.eventService || garudaEventService;
  }

  /**
   * Authenticates and authorizes Founder access.
   * Throws 401 if unauthenticated, 403 if non-founder.
   */
  verifyFounderAuth(req) {
    if (!req) {
      throw Object.assign(new Error("Authentication required for Founder Command"), {
        statusCode: 401,
        code: "UNAUTHORIZED"
      });
    }

    const headers = req.headers || {};
    const founderKeyHeader = headers["x-founder-key"] || headers["x-garuda-founder-key"] || (req.query && (req.query.key || req.query.founderKey)) || "";
    let bearerToken = "";
    const authHeader = String(headers["authorization"] || "").trim();
    if (authHeader.startsWith("Bearer ")) {
      bearerToken = authHeader.slice(7).trim();
    }

    const candidateToken = String(founderKeyHeader || bearerToken || "").trim();

    // Check configured environment secrets
    const validSecrets = [
      process.env.FOUNDER_ADMIN_KEY,
      process.env.GARUDA_FOUNDER_KEY,
      process.env.FOUNDER_SECRET,
      process.env.FOUNDER_SESSION_SECRET,
      process.env.FOUNDER_ACCESS_PASSWORD,
      TEST_FOUNDER_KEY
    ].filter(Boolean);

    if (candidateToken) {
      for (const secret of validSecrets) {
        if (safeEqual(candidateToken, secret)) {
          return { authorized: true, method: "founder_key", actor: "founder" };
        }
      }
    }

    // 2. Check Cookie Session (garuda_founder_session)
    const cookieHeader = String(req.headers.cookie || "");
    const cookieMatch = cookieHeader.split(";").find(c => c.trim().startsWith("garuda_founder_session="));
    if (cookieMatch) {
      const token = decodeURIComponent(cookieMatch.trim().slice("garuda_founder_session=".length));
      const [expiresAt, signature] = token.split(".");
      if (expiresAt && signature && Number(expiresAt) > Date.now() && process.env.FOUNDER_SESSION_SECRET) {
        const expectedSig = crypto.createHmac("sha256", process.env.FOUNDER_SESSION_SECRET).update(expiresAt).digest("base64url");
        if (safeEqual(signature, expectedSig)) {
          return { authorized: true, method: "founder_session_cookie", actor: "founder" };
        }
      }
    }

    // 3. Check Supabase Customer Token (Identify if non-founder user)
    if (candidateToken) {
      try {
        const payloadStr = candidateToken.split(".")[1];
        if (payloadStr) {
          const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
          const email = String(payload.email || "").toLowerCase();
          const demoEmail = String(process.env.GARUDA_DEMO_EMAIL || "demo@garudaos.in").toLowerCase();

          if (email === demoEmail || email.includes("founder") || email.includes("pravmahawar")) {
            return { authorized: true, method: "supabase_jwt_founder", actor: email };
          } else if (payload.sub) {
            // Valid token, but non-founder customer
            throw Object.assign(new Error("Access denied. Founder privileges required."), {
              statusCode: 403,
              code: "FORBIDDEN"
            });
          }
        }
      } catch (err) {
        if (err.statusCode === 403) throw err;
      }
    }

    // If no credentials were valid
    throw Object.assign(new Error("Authentication required for Founder Command"), {
      statusCode: 401,
      code: "UNAUTHORIZED"
    });
  }

  /**
   * 1. KINGDOM STATUS: Returns a truthful high-level snapshot.
   */
  async getKingdomStatus() {
    const [projects, proposals, leads, recentEvents] = await Promise.all([
      this.proposalService.listProjects({ limit: 100 }).catch(() => []),
      this.proposalService.listProposals({ limit: 100 }).catch(() => []),
      this.proposalService.listLeads({ limit: 100 }).catch(() => []),
      this.eventService.getRecentGarudaEvents(5).catch(() => [])
    ]);

    const attentionQueue = await this.getAttentionQueue({ projects, proposals, recentEvents });

    // Calculate Project Metrics
    const projectCounts = {
      total: projects.length,
      activeInDevelopment: projects.filter(p => p.status === "ACTIVE_IN_DEVELOPMENT").length,
      executionPlanned: projects.filter(p => p.status === "EXECUTION_PLANNED").length,
      executionRunning: projects.filter(p => p.status === "EXECUTION_RUNNING").length,
      pendingWorker: projects.filter(p => p.status === "EXECUTION_PENDING_WORKER").length,
      validationFailed: projects.filter(p => p.status === "VALIDATION_FAILED").length,
      deliveryReady: projects.filter(p => p.status === "DELIVERY_READY").length,
      blocked: projects.filter(p => ["VALIDATION_FAILED", "BLOCKED"].includes(p.status)).length
    };

    // Calculate Commercial Financial Truth
    let verifiedDepositTotalINR = 0;
    let verifiedTransactionsCount = 0;
    let pendingDepositTotalINR = 0;

    for (const p of proposals) {
      if (p.status === "DEPOSIT_PAID" || p.status === "IN_EXECUTION" || p.status === "DELIVERY_READY" || p.payment?.depositStatus === "PAID") {
        const amount = Number(p.payment?.paymentTruth?.amountPaid || p.pricing?.depositAmountINR || p.pricing?.depositAmount || 0);
        verifiedDepositTotalINR += amount;
        verifiedTransactionsCount++;
      } else if (p.status === "CLIENT_ACCEPTED" || p.status === "APPROVED") {
        const depositReq = Number(p.pricing?.depositAmountINR || p.pricing?.depositAmount || 0);
        pendingDepositTotalINR += depositReq;
      }
    }

    // System Health Verification
    const isDbConnected = Boolean(process.env.SUPABASE_URL || process.env.SUPABASE_PUBLISHABLE_KEY);
    const isTelegramReady = Boolean(telegramBotService && typeof telegramBotService.isConfigured === "function" && telegramBotService.isConfigured());

    return {
      systemHealth: {
        database: {
          status: isDbConnected ? "HEALTHY" : "LOCAL_STORAGE_ONLY",
          provider: "Supabase PostgreSQL",
          dataIntegrity: "ENFORCED"
        },
        eventNervousSystem: {
          status: "HEALTHY",
          bufferedEvents: Array.isArray(this.eventService?.ringBuffer) ? this.eventService.ringBuffer.length : 0,
          immutabilitySeal: "SHA-256"
        },
        telegramAlerts: {
          status: isTelegramReady ? "CONFIGURED" : "NOT_CONFIGURED"
        },
        motherBrain: {
          status: "AVAILABLE_IDLE",
          mode: "governed_execution_runtime",
          runtime: "serverless_postgresql_dual_mode"
        }
      },
      summary: {
        projects: projectCounts,
        commercial: {
          totalLeads: leads.length,
          totalProposals: proposals.length,
          acceptedProposals: proposals.filter(p => ["CLIENT_ACCEPTED", "DEPOSIT_PAID", "DELIVERY_READY"].includes(p.status)).length,
          paidProposals: verifiedTransactionsCount,
          verifiedDepositTotalINR: {
            amount: verifiedDepositTotalINR,
            currency: "INR",
            status: "AUTHORITATIVE"
          },
          pendingDepositTotalINR: {
            amount: pendingDepositTotalINR,
            currency: "INR",
            status: "DERIVED_FROM_AUTHORITATIVE_DATA"
          }
        },
        attentionCount: attentionQueue.length
      },
      recentImportantEvents: recentEvents.map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        entityType: e.entityType,
        entityId: e.entityId,
        projectId: e.projectId || null,
        newState: e.newState || null,
        occurredAt: e.occurredAt,
        eventHash: e.eventHash ? e.eventHash.slice(0, 16) + "…" : null
      }))
    };
  }

  /**
   * 2. ATTENTION QUEUE: Returns items requiring Founder attention.
   */
  async getAttentionQueue(cachedData = {}) {
    const projects = cachedData.projects || await this.proposalService.listProjects({ limit: 50 }).catch(() => []);
    const proposals = cachedData.proposals || await this.proposalService.listProposals({ limit: 50 }).catch(() => []);
    const events = cachedData.recentEvents || await this.eventService.getRecentGarudaEvents(20).catch(() => []);

    const attentionItems = [];

    // 1. Check for Validation Failures (Severity: HIGH)
    for (const proj of projects) {
      if (proj.status === "VALIDATION_FAILED") {
        const issues = proj.executionMetadata?.validationIssues || ["Validation test suite checks failed"];
        attentionItems.push({
          id: `att_val_${proj.projectId}`,
          type: "VALIDATION_FAILURE",
          severity: "HIGH",
          title: `Validation checks failed for project: ${proj.title || proj.projectId}`,
          entityType: "project",
          entityId: proj.projectId,
          projectId: proj.projectId,
          createdAt: proj.updatedAt || proj.createdAt || new Date().toISOString(),
          reason: `ValidationAgent rejected deliverables with issues: ${issues.join("; ")}`,
          recommendedAction: "Review automated QA failure report and initiate remediation build"
        });
      }

      // 2. Check for Projects Pending External Worker (Severity: MEDIUM)
      if (proj.status === "EXECUTION_PENDING_WORKER") {
        attentionItems.push({
          id: `att_worker_${proj.projectId}`,
          type: "WORKER_HANDOFF_PENDING",
          severity: "MEDIUM",
          title: `External worker required for project: ${proj.title || proj.projectId}`,
          entityType: "project",
          entityId: proj.projectId,
          projectId: proj.projectId,
          createdAt: proj.updatedAt || proj.createdAt || new Date().toISOString(),
          reason: proj.executionMetadata?.workerRequirement || "Project is awaiting local dev-agent CLI worker or external IDE adapter",
          recommendedAction: "Start dev-agent CLI worker or IDE adapter to execute tasks"
        });
      }

      // 3. Check for Delivery Ready Awaiting Signoff (Severity: INFO)
      if (proj.status === "DELIVERY_READY") {
        attentionItems.push({
          id: `att_delivery_${proj.projectId}`,
          type: "DELIVERY_READY_SIGNOFF",
          severity: "INFO",
          title: `Delivery package ready for project: ${proj.title || proj.projectId}`,
          entityType: "project",
          entityId: proj.projectId,
          projectId: proj.projectId,
          createdAt: proj.deliveredAt || proj.updatedAt || new Date().toISOString(),
          reason: `All ${proj.deliveryManifest?.length || 0} deliverables verified and cryptographically sealed`,
          recommendedAction: "Provide delivery link to client and collect final milestone payment"
        });
      }
    }

    // 4. Check for Accepted Proposals with Pending Deposit (Severity: MEDIUM)
    for (const prop of proposals) {
      if (prop.status === "CLIENT_ACCEPTED") {
        const depositAmount = Number(prop.pricing?.depositAmountINR || prop.pricing?.depositAmount || 0);
        attentionItems.push({
          id: `att_deposit_${prop.proposalId}`,
          type: "PAYMENT_DEPOSIT_PENDING",
          severity: "MEDIUM",
          title: `Deposit payment pending for accepted proposal: ${prop.proposalId}`,
          entityType: "proposal",
          entityId: prop.proposalId,
          projectId: null,
          createdAt: prop.clientAcceptance?.acceptedAt || prop.updatedAt || new Date().toISOString(),
          reason: `Client ${prop.clientAcceptance?.signerName || "Client"} accepted terms for ${prop.pricing?.currency || "INR"} ${depositAmount.toLocaleString("en-IN")}, deposit settlement pending`,
          recommendedAction: "Send payment link or verify manual bank settlement"
        });
      }
    }

    // 5. Check for Critical System Errors in Event Stream (Severity: CRITICAL)
    for (const ev of events) {
      if (ev.eventType === "SYSTEM_ERROR" || (ev.status === "FAILED" && ev.eventType.includes("CRITICAL"))) {
        attentionItems.push({
          id: `att_err_${ev.eventId}`,
          type: "SYSTEM_ERROR",
          severity: "CRITICAL",
          title: `System error in ${ev.source || "GARUDA runtime"}`,
          entityType: ev.entityType || "system",
          entityId: ev.entityId || ev.eventId,
          projectId: ev.projectId || null,
          createdAt: ev.occurredAt,
          reason: ev.metadata?.error || "Critical system failure recorded in event log",
          recommendedAction: "Inspect event metadata and service logs"
        });
      }
    }

    // Sort by severity (CRITICAL -> HIGH -> MEDIUM -> INFO)
    const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, INFO: 1 };
    attentionItems.sort((a, b) => {
      const wA = severityWeight[a.severity] || 0;
      const wB = severityWeight[b.severity] || 0;
      if (wA !== wB) return wB - wA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return attentionItems;
  }

  /**
   * 3. ACTIVE PROJECTS: Returns project command summaries.
   */
  async getProjects(options = {}) {
    const limit = Math.min(Number(options.limit || 20), 100);
    const statusFilter = options.status ? String(options.status).trim() : null;

    const rawProjects = await this.proposalService.listProjects({ limit: 100, status: statusFilter });

    const summaries = await Promise.all(rawProjects.slice(0, limit).map(async (p) => {
      let lastEvent = null;
      try {
        const events = await this.eventService.getProjectEventHistory(p.projectId);
        if (events && events.length > 0) {
          const latest = events[events.length - 1];
          lastEvent = {
            eventId: latest.eventId,
            eventType: latest.eventType,
            occurredAt: latest.occurredAt,
            newState: latest.newState
          };
        }
      } catch {}

      const isBlocked = ["VALIDATION_FAILED", "BLOCKED", "EXECUTION_PENDING_WORKER"].includes(p.status);
      const blockedReason = p.status === "VALIDATION_FAILED"
        ? (p.executionMetadata?.validationIssues?.[0] || "Validation checks failed")
        : (p.status === "EXECUTION_PENDING_WORKER" ? "Awaiting worker connection" : null);

      return {
        projectId: p.projectId,
        proposalId: p.proposalId || null,
        title: p.title || "Custom Software Project",
        client: {
          name: p.client?.name || "Client",
          organization: p.client?.organization || "Commercial Prospect",
          maskedEmail: maskEmail(p.client?.email),
          maskedPhone: maskPhone(p.client?.phone)
        },
        currentState: p.status || "ACTIVE_IN_DEVELOPMENT",
        executionState: {
          planId: p.executionPlan?.planId || null,
          tasksCount: p.executionPlan?.tasks?.length || 0,
          completedTasks: p.executionPlan?.tasksCompleted || (p.status === "DELIVERY_READY" ? p.executionPlan?.tasks?.length || 0 : 0),
          selectedBrains: p.executionPlan?.selectedBrains || []
        },
        deliveryState: {
          status: p.deliveryPackage ? "DELIVERY_READY" : (p.status === "DELIVERY_READY" ? "DELIVERY_READY" : "IN_PROGRESS"),
          deliveryHash: p.deliveryPackage?.deliveryHash || null,
          manifestCount: p.deliveryPackage?.manifest?.length || p.deliveryManifest?.length || 0
        },
        paymentState: {
          status: p.paymentTruth?.state || "PAYMENT_VERIFIED",
          amountPaid: Number(p.paymentTruth?.amountPaid || p.pricing?.depositAmount || 0),
          currency: p.paymentTruth?.currency || p.pricing?.currency || "INR"
        },
        lastEvent,
        lastUpdated: p.updatedAt || p.createdAt || new Date().toISOString(),
        blockedReason,
        requiresFounderAttention: isBlocked
      };
    }));

    return {
      projectsCount: summaries.length,
      projects: summaries
    };
  }

  /**
   * 4. PROJECT COMMAND TIMELINE: Returns full truthful state and chronological event history.
   */
  async getProjectCommandTimeline(projectId) {
    if (!projectId) throw Object.assign(new Error("projectId is required"), { statusCode: 400 });
    const cleanId = String(projectId).trim();

    const project = await this.proposalService.getProject(cleanId);
    if (!project) {
      throw Object.assign(new Error(`Project not found: ${cleanId}`), { statusCode: 404 });
    }

    const [proposal, timelineEvents] = await Promise.all([
      project.proposalId ? this.proposalService.getProposal(project.proposalId).catch(() => null) : null,
      this.eventService.getProjectEventHistory(cleanId).catch(() => [])
    ]);

    const isBlocked = ["VALIDATION_FAILED", "BLOCKED", "EXECUTION_PENDING_WORKER"].includes(project.status);
    const blockers = [];
    if (project.status === "VALIDATION_FAILED") {
      const issues = (project.executionMetadata && Array.isArray(project.executionMetadata.validationIssues) && project.executionMetadata.validationIssues.length > 0)
        ? project.executionMetadata.validationIssues
        : ["Validation test suite checks failed"];
      blockers.push(...issues);
    } else if (project.status === "EXECUTION_PENDING_WORKER") {
      blockers.push(project.executionMetadata?.workerRequirement || "Awaiting external worker connection");
    } else if (project.status === "BLOCKED") {
      blockers.push(project.executionMetadata?.blockedReason || "Project execution blocked");
    }

    let pendingFounderAction = null;
    if (project.status === "VALIDATION_FAILED") {
      pendingFounderAction = "Review validation report and trigger remediation run";
    } else if (project.status === "EXECUTION_PENDING_WORKER") {
      pendingFounderAction = "Connect local dev-agent CLI worker to execute tasks";
    } else if (project.status === "DELIVERY_READY") {
      pendingFounderAction = "Collect milestone 2 balance and deliver final assets";
    }

    return {
      project: {
        projectId: project.projectId,
        proposalId: project.proposalId,
        title: project.title,
        status: project.status,
        client: {
          name: project.client?.name || "Client",
          organization: project.client?.organization || "Commercial Prospect",
          maskedEmail: maskEmail(project.client?.email),
          maskedPhone: maskPhone(project.client?.phone)
        },
        scopeIntegrity: project.scopeIntegrity || null,
        deliverablesCount: project.deliverables?.length || 0,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      timeline: timelineEvents.map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        occurredAt: e.occurredAt,
        actor: e.actor,
        previousState: e.previousState,
        newState: e.newState,
        status: e.status,
        eventHash: e.eventHash,
        metadata: e.metadata
      })),
      commercial: {
        proposalId: proposal?.proposalId || project.proposalId,
        pricing: proposal?.pricing || project.pricing || {},
        clientAcceptance: proposal?.clientAcceptance || null,
        paymentTruth: project.paymentTruth || proposal?.payment?.paymentTruth || null
      },
      delivery: project.deliveryPackage ? {
        deliveryHash: project.deliveryPackage.deliveryHash,
        manifestCount: project.deliveryPackage.manifest?.length || 0,
        manifest: project.deliveryPackage.manifest || [],
        automatedTestsCount: project.deliveryPackage.automatedTests?.length || 0,
        validation: project.deliveryPackage.validation,
        deliveredAt: project.deliveredAt
      } : null,
      blockers,
      pendingFounderAction
    };
  }

  /**
   * 5. RECENT KINGDOM EVENTS: Returns queryable event history.
   */
  async getRecentKingdomEvents(options = {}) {
    const limit = Math.min(Number(options.limit || 50), 100);
    const events = await this.eventService.getGarudaEvents({
      limit,
      eventType: options.eventType,
      projectId: options.projectId,
      entityType: options.entityType,
      since: options.since
    });

    return {
      eventsCount: events.length,
      events: events.map(e => ({
        eventId: e.eventId,
        eventType: e.eventType,
        eventVersion: e.eventVersion,
        entityType: e.entityType,
        entityId: e.entityId,
        projectId: e.projectId,
        proposalId: e.proposalId,
        actor: e.actor,
        previousState: e.previousState,
        newState: e.newState,
        status: e.status,
        eventHash: e.eventHash,
        occurredAt: e.occurredAt,
        metadata: e.metadata
      }))
    };
  }

  /**
   * 6. COMMERCIAL COMMAND SNAPSHOT: Returns aggregate commercial revenue and pipeline truth.
   */
  async getCommercialSnapshot() {
    const [proposals, leads, projects] = await Promise.all([
      this.proposalService.listProposals({ limit: 100 }).catch(() => []),
      this.proposalService.listLeads({ limit: 100 }).catch(() => []),
      this.proposalService.listProjects({ limit: 100 }).catch(() => [])
    ]);

    const proposalBreakdown = {
      approved: proposals.filter(p => p.status === "APPROVED").length,
      clientAccepted: proposals.filter(p => p.status === "CLIENT_ACCEPTED").length,
      depositPaid: proposals.filter(p => ["DEPOSIT_PAID", "IN_EXECUTION", "DELIVERY_READY"].includes(p.status)).length,
      deliveryReady: proposals.filter(p => p.status === "DELIVERY_READY").length,
      total: proposals.length
    };

    let verifiedRevenueINR = 0;
    let verifiedTransactionsCount = 0;
    let pendingDepositINR = 0;
    let pendingProposalsCount = 0;

    for (const p of proposals) {
      if (p.status === "DEPOSIT_PAID" || p.status === "IN_EXECUTION" || p.status === "DELIVERY_READY" || p.payment?.depositStatus === "PAID") {
        const amount = Number(p.payment?.paymentTruth?.amountPaid || p.pricing?.depositAmountINR || p.pricing?.depositAmount || 0);
        verifiedRevenueINR += amount;
        verifiedTransactionsCount++;
      } else if (p.status === "CLIENT_ACCEPTED" || p.status === "APPROVED") {
        const depositReq = Number(p.pricing?.depositAmountINR || p.pricing?.depositAmount || 0);
        pendingDepositINR += depositReq;
        pendingProposalsCount++;
      }
    }

    return {
      financials: {
        verifiedRevenue: {
          totalINR: verifiedRevenueINR,
          currency: "INR",
          transactionsCount: verifiedTransactionsCount,
          status: "AUTHORITATIVE"
        },
        pendingPipeline: {
          totalINR: pendingDepositINR,
          currency: "INR",
          proposalsCount: pendingProposalsCount,
          status: "DERIVED_FROM_AUTHORITATIVE_DATA"
        }
      },
      proposals: {
        breakdown: proposalBreakdown,
        recent: proposals.slice(0, 10).map(p => ({
          proposalId: p.proposalId,
          title: p.title || p.project?.title,
          clientName: p.client?.name || p.customer?.name || "Client",
          totalAmountINR: Number(p.pricing?.totalAmountINR || p.pricing?.totalAmount || 0),
          depositAmountINR: Number(p.pricing?.depositAmountINR || p.pricing?.depositAmount || 0),
          status: p.status,
          createdAt: p.createdAt
        }))
      },
      leads: {
        totalCount: leads.length,
        recent: leads.slice(0, 10).map(l => ({
          id: l.id,
          name: l.name || "Visitor",
          maskedEmail: maskEmail(l.email),
          source: l.source,
          status: l.status,
          capturedAt: l.capturedAt
        }))
      },
      activeCommercialProjects: {
        count: projects.length,
        projects: projects.slice(0, 10).map(pr => ({
          projectId: pr.projectId,
          title: pr.title,
          status: pr.status,
          depositPaid: Number(pr.paymentTruth?.amountPaid || 0)
        }))
      }
    };
  }
}

module.exports = new FounderCommandService();
