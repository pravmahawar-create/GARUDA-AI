/**
 * 🦅 GARUDA ASTRA API ROUTES
 * Endpoints for autonomous coding, self-healing, and audit trails.
 */

const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");
const { AstraExecutionEngine } = require("../services/astraCodingAgent/astraExecutionEngine");

const engine = new AstraExecutionEngine();

const FOUNDER_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
function hasFounderExecutionAccess(req) {
  if (req.garudaContext?.isFounderApproved) return true;
  // Local development remains usable without requiring a production credential.
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "::1"].includes(req.hostname)) return true;

  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const match = token.match(/^(gs|gp)_(\d+)\.([A-Za-z0-9_-]+)$/);
  const secret = process.env.FOUNDER_SESSION_SECRET;
  if (!match || !secret) return false;

  const tokenKind = match[1];
  const issuedAt = Number(match[2]);
  const signature = match[3];
  const ttlMs = tokenKind === "gp" ? 5 * 60 * 1000 : FOUNDER_TOKEN_TTL_MS;
  if (!Number.isFinite(issuedAt) || issuedAt > Date.now() || Date.now() - issuedAt > ttlMs) return false;
  const expected = crypto.createHmac("sha256", secret).update(`founder_${issuedAt}`).digest("base64url");
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function requireFounderExecutionAccess(req, res) {
  if (hasFounderExecutionAccess(req)) return true;
  res.status(403).json({ success: false, error: "Founder authentication required for code execution." });
  return false;
}

function getAdbPath() {
  const localApp = process.env.LOCALAPPDATA || "C:\\Users\\hp\\AppData\\Local";
  const defaultPath = path.join(localApp, "Android", "Sdk", "platform-tools", "adb.exe");
  if (fs.existsSync(defaultPath)) return defaultPath;
  return "adb";
}

function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

/**
 * Unified Execution Handler for /execute and legacy /pawan/execute
 */
async function handleExecuteRequest(req, res) {
  try {
    if (!requireFounderExecutionAccess(req, res)) return;
    const { instruction, targetFile, searchQuery, code, currentCode, summary, attachment, sessionId } = req.body || {};
    if (!instruction) return res.status(400).json({ success: false, error: "instruction is required" });

    const requestId = req.garudaContext?.requestId || req.headers["x-request-id"] || `REQ-${Date.now()}`;
    const result = await engine.executeTask(instruction, {
      requestId,
      sessionId: sessionId || req.headers["x-session-id"] || null,
      targetFile,
      searchQuery,
      code,
      currentCode,
      summary,
      attachment
    });

    try {
      const pawanHistoryService = require("../services/pawanHistoryService");
      const device = pawanHistoryService.detectDevice(req.headers["user-agent"]);
      pawanHistoryService.recordInteraction({
        type: "execution",
        device,
        requestId,
        instruction: instruction || "",
        attachmentMeta: { hasAttachment: !!attachment, mimeType: attachment?.mimeType || null },
        executionResult: { file: result.file || targetFile || null, sha256: result.sha256 || null, success: !!result.success },
      }).catch(() => {});
    } catch {}

    res.json({ success: result.success, error: result.error || null, data: result });
  } catch (err) {
    try {
      engine._logAudit({
        taskId: `ASTRA-ERR-${Date.now()}`,
        success: false,
        error: err.message,
        stack: err.stack,
        status: "FATAL_EXCEPTION",
        instruction: req.body?.instruction || ""
      });
    } catch {}
    res.status(500).json({ success: false, error: err.message });
  }
}

router.post("/execute", handleExecuteRequest);
router.post("/pawan/execute", handleExecuteRequest);

/**
 * POST /api/pawan/consult
 * Consultative Brain: Analyze requirements, sketches, or PDFs and propose recommendations
 */
router.post("/consult", async (req, res) => {
  try {
    const { instruction, attachment, currentCode, targetFile, history } = req.body;
    const result = await engine.consultOnTask({
      instruction,
      attachment,
      currentCode,
      targetFile,
      history
    });

    // Persistent logging — fire-and-forget, never blocks response
    try {
      const pawanHistoryService = require("../services/pawanHistoryService");
      const device = pawanHistoryService.detectDevice(req.headers["user-agent"]);
      pawanHistoryService.recordInteraction({
        type: "consultation",
        device,
        instruction: instruction || "",
        attachmentMeta: { hasAttachment: !!attachment, mimeType: attachment?.mimeType || null },
        consultation: result.success ? result.consultation : null,
      }).catch(() => {});
    } catch {}

    if (result.success) {
      res.json({ success: true, consultation: result.consultation });
    } else {
      res.status(500).json({ success: false, error: result.error || "Consultation failed" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const { containerizeApp, APPS_DIR } = require("../services/pawanApkService");
const pawanHistoryService = require("../services/pawanHistoryService");

/**
 * POST /api/pawan/verify-founder
 * Secure backend verification for Founder passkeys (timing-safe, zero secrets in frontend)
 */
router.post("/verify-founder", (req, res) => {
  try {
    const { passkey } = req.body || {};
    if (!passkey || typeof passkey !== "string") {
      return res.status(400).json({ success: false, error: "Passkey is required" });
    }

    const candidate = passkey.trim();
    const validSecrets = [
      process.env.FOUNDER_ADMIN_KEY,
      process.env.GARUDA_FOUNDER_KEY,
      process.env.FOUNDER_SECRET,
      process.env.FOUNDER_SESSION_SECRET,
      process.env.FOUNDER_ACCESS_PASSWORD
    ].filter(Boolean);
    if (!validSecrets.length || !process.env.FOUNDER_SESSION_SECRET) {
      return res.status(503).json({ success: false, error: "Founder authentication is not configured on this server." });
    }

    let isAuthorized = false;
    for (const secret of validSecrets) {
      if (candidate.length === secret.length) {
        const leftHash = crypto.createHash("sha256").update(candidate).digest();
        const rightHash = crypto.createHash("sha256").update(secret).digest();
        if (crypto.timingSafeEqual(leftHash, rightHash)) {
          isAuthorized = true;
          break;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({ success: false, error: "Galat Passkey! Founder access restricted." });
    }

    // Issue cryptographically signed session token
    const serverSecret = process.env.FOUNDER_SESSION_SECRET;
    const issuedAt = Date.now();
    const signature = crypto.createHmac("sha256", serverSecret).update(`founder_${issuedAt}`).digest("base64url");
    const sessionToken = `gs_${issuedAt}.${signature}`;

    res.json({
      success: true,
      authorized: true,
      token: sessionToken,
      message: "Founder Praveen authenticated. Internal sovereign controls active."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pawan/verify-founder-token
 * Validate a stored session token on the backend
 */
router.get("/verify-founder-token", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "") || req.query.token || "";
  if (!token || !token.startsWith("gs_")) {
    return res.json({ success: false, authorized: false });
  }

  const [prefixAndIssued, signature] = token.split(".");
  const issuedAt = prefixAndIssued ? prefixAndIssued.replace(/^gs_/, "") : "";
  const serverSecret = process.env.FOUNDER_SESSION_SECRET;
  if (!serverSecret) return res.json({ success: false, authorized: false });
  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs) || issuedAtMs > Date.now() || Date.now() - issuedAtMs > FOUNDER_TOKEN_TTL_MS) {
    return res.json({ success: false, authorized: false });
  }
  const expectedSig = crypto.createHmac("sha256", serverSecret).update(`founder_${issuedAt}`).digest("base64url");

  if (signature && expectedSig && signature.length === expectedSig.length) {
    const sigHash = crypto.createHash("sha256").update(signature).digest();
    const expHash = crypto.createHash("sha256").update(expectedSig).digest();
    if (crypto.timingSafeEqual(sigHash, expHash)) {
      return res.json({ success: true, authorized: true });
    }
  }

  return res.json({ success: false, authorized: false });
});

/**
 * Unified History Handler: Merges audit trail and pawan interaction logs
 */
async function handleHistoryRequest(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const auditLogs = engine.getAuditHistory(limit);
    const interactions = await pawanHistoryService.getRecentHistory(limit);

    // Merge and deduplicate by key
    const combined = [];
    const seen = new Set();

    for (const item of [...auditLogs, ...interactions]) {
      const key = item.taskId || item.id || `${item.timestamp}_${item.instruction}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }
    combined.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    const history = combined.slice(0, limit);

    res.json({
      success: true,
      count: history.length,
      history,
      auditTrailCount: auditLogs.length,
      interactionCount: interactions.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.get("/pawan/history", handleHistoryRequest);
router.get("/history", handleHistoryRequest);

/**
 * DELETE /api/pawan/history
 * Clear history (Founder-only — caller must gate)
 */
router.delete("/pawan/history", async (req, res) => {
  try {
    await pawanHistoryService.clearHistory();
    res.json({ success: true, cleared: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pawan/build-apk
 * Compile or package active application for mobile installation & testing
 */
router.post("/build-apk", async (req, res) => {
  try {
    if (!requireFounderExecutionAccess(req, res)) return;
    const { code, targetFile, appName } = req.body;
    let actualCode = code;
    if (!actualCode && targetFile) {
      const fullPath = path.join(engine.rootDir, targetFile);
      if (fs.existsSync(fullPath)) {
        actualCode = fs.readFileSync(fullPath, "utf8");
      }
    }

    if (!actualCode) {
      return res.status(400).json({ success: false, error: "No code provided to package" });
    }

    const result = await containerizeApp({
      code: actualCode,
      targetFile,
      appName: appName || (targetFile ? path.basename(targetFile, path.extname(targetFile)) : "garuda-app")
    });

    try {
      const device = pawanHistoryService.detectDevice(req.headers["user-agent"]);
      pawanHistoryService.recordInteraction({
        type: "apk_build",
        device,
        instruction: `APK build for ${targetFile || appName || "app"}`,
        executionResult: { file: result.safeName || appName || targetFile || null, sha256: result.sha256 || null, success: !!result.success },
      }).catch(() => {});
    } catch {}

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pawan/download-bundle
 * Download standalone zipped mobile bundle (.zip / APK ready)
 */
router.get("/download-bundle", (req, res) => {
  try {
    const app = req.query.app;
    if (!app) return res.status(400).send("App name required");
    const safeName = app.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const zipPath = path.join(APPS_DIR, safeName, `${safeName}-mobile-package.zip`);
    if (!fs.existsSync(zipPath)) {
      return res.status(404).send("Package not found. Please build APK first.");
    }
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}-mobile-package.zip"`);
    fs.createReadStream(zipPath).pipe(res);
  } catch (err) {
    res.status(500).send("Error streaming bundle: " + err.message);
  }
});

const { generateMarketQuote, negotiateQuote } = require("../services/pawanConsultativeService");

/**
 * POST /api/pawan/market-quote
 * Generate consultative feasibility, Sasti vs Premium comparison, and psychological pricing
 */
router.post("/market-quote", (req, res) => {
  try {
    const { clientName, prompt, budget, appName } = req.body;
    const quote = generateMarketQuote({ clientName, prompt, budget, appName });
    res.json({ success: true, quote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pawan/negotiate-quote
 * Client counter-offer evaluation and dynamic milestone adjustment
 */
router.post("/negotiate-quote", (req, res) => {
  try {
    const { currentQuote, clientCounterOffer, clientNotes } = req.body;
    const result = negotiateQuote({ currentQuote, clientCounterOffer, clientNotes });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



/**
 * POST /api/pawan/workspace/create
 * Create a new multi-file project workspace
 */
router.post("/workspace/create", (req, res) => {
  try {
    const { name, files } = req.body;
    const ws = engine.createWorkspace(name || "Sovereign Application", files || null);
    res.json({
      success: true,
      workspace: ws.getManifest()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pawan/workspace/:id
 * Retrieve workspace manifest and file structure
 */
router.get("/workspace/:id", (req, res) => {
  const ws = engine.getWorkspace(req.params.id);
  if (!ws) return res.status(404).json({ success: false, error: "Workspace not found" });
  res.json({
    success: true,
    workspace: ws.getManifest()
  });
});

/**
 * POST /api/pawan/workspace/:id/patch
 * Apply surgical Search/Replace block patch to a workspace file
 */
router.post("/workspace/:id/patch", (req, res) => {
  try {
    const ws = engine.getWorkspace(req.params.id);
    if (!ws) return res.status(404).json({ success: false, error: "Workspace not found" });

    const { filePath, searchBlock, replaceBlock } = req.body;
    if (!filePath || !searchBlock) {
      return res.status(400).json({ success: false, error: "filePath and searchBlock are required" });
    }

    const fileDoc = ws.getFile(filePath);
    if (!fileDoc) {
      return res.status(404).json({ success: false, error: `File ${filePath} does not exist in workspace` });
    }

    const patchRes = engine.patchEngine.applySearchReplace(fileDoc.content, searchBlock, replaceBlock || "");
    if (!patchRes.success) {
      return res.status(400).json({ success: false, error: patchRes.error });
    }

    // Validate new content before accepting
    const valRes = engine.validator.validateContent(patchRes.newContent, filePath);
    if (!valRes.valid) {
      return res.status(422).json({
        success: false,
        error: `Patch introduced validation error: ${valRes.error}`,
        validation: valRes
      });
    }

    const updatedDoc = ws.setFile(filePath, patchRes.newContent);
    res.json({
      success: true,
      file: updatedDoc,
      patchMeta: patchRes,
      manifest: ws.getManifest()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pawan/workspace/:id/preview
 * Stream standalone preview bundle for iframe sandboxes
 */
router.get("/workspace/:id/preview", (req, res) => {
  const ws = engine.getWorkspace(req.params.id);
  if (!ws) return res.status(404).send("Workspace not found");
  const html = ws.generateStandalonePreview();
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

/**
 * GET /api/astra/status
 * Check engine status, providers, and capabilities
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    engine: "GARUDA PAWAN Sovereign Coding Agent",
    slogan: "As fast as wind. Smooth and powerful.",
    founder: "Praveen Mahawar",
    status: "online",
    phase: "phase_1_foundation_verified",
    capabilities: [
      "autonomous_react_loop",
      "layered_syntax_and_script_validation",
      "html_inline_script_verification",
      "surgical_search_replace_patcher",
      "multi_file_virtual_workspace",
      "immutable_snapshot_and_rollback",
      "closed_loop_self_healing",
      "sha256_audit_trail",
      "multimodal_repo_reconnaissance",
      "truthful_pwa_apk_classification"
    ],
    timestamp: new Date().toISOString()
  });
});


router.get("/history", handleHistoryRequest);

/**
 * POST /api/astra/inspect
 * Inspect a file with line numbers and SHA-256
 */
router.post("/inspect", (req, res) => {
  if (!requireFounderExecutionAccess(req, res)) return;
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ success: false, error: "filePath required" });
  const inspect = engine.inspectFile(filePath);
  res.json({ success: !inspect.error, data: inspect });
});

/**
 * GET /api/astra/mobile-status
 * Detect attached mobile phone via ADB and provide local Wi-Fi / USB bridge URLs
 */
router.get("/mobile-status", (req, res) => {
  const adbPath = getAdbPath();
  const localIp = getLocalIp();

  execFile(adbPath, ["devices", "-l"], { timeout: 4000 }, (err, stdout) => {
    const rawOut = stdout || "";
    const lines = rawOut.trim().split("\n").slice(1).filter(Boolean);
    const devices = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      const id = parts[0];
      const status = parts[1] || "unknown";
      const modelMatch = line.match(/model:([^\s]+)/);
      const deviceMatch = line.match(/device:([^\s]+)/);
      return {
        id,
        status,
        model: modelMatch ? modelMatch[1] : id,
        deviceName: deviceMatch ? deviceMatch[1] : id,
        raw: line.trim()
      };
    }).filter(d => d.id && d.id !== "List");

    const baseUrl = process.env.PUBLIC_APP_URL || process.env.BASE_URL || "https://www.garudaos.in";
    res.json({
      success: true,
      connected: devices.length > 0,
      devices,
      localIp,
      wifiUrl: baseUrl,
      usbUrl: baseUrl,
      chromeInspectUrl: "chrome://inspect/#devices",
      adbAvailable: true
    });
  });
});

/**
 * POST /api/astra/mobile-reverse
 * Setup reverse port forwarding so USB-connected phone can hit localhost:5173 and localhost:3000
 */
router.post("/mobile-reverse", (req, res) => {
  const adbPath = getAdbPath();
  execFile(adbPath, ["reverse", "tcp:5173", "tcp:5173"], (err1) => {
    execFile(adbPath, ["reverse", "tcp:3000", "tcp:3000"], (err2) => {
      if (err1 && err2) {
        return res.json({ success: false, error: "Could not reverse ports. Check USB cable and USB Debugging in Phone Developer Options." });
      }
      res.json({
        success: true,
        message: "USB Bridge Active! Mobile device is now synchronized with GARUDA Studio."
      });
    });
  });
});

/**
 * GET /api/astra/mobile-logs
 * Read recent error logs from connected mobile phone
 */
router.get("/mobile-logs", (req, res) => {
  const adbPath = getAdbPath();
  execFile(adbPath, ["logcat", "-d", "-t", "50", "*:E"], { timeout: 4000 }, (err, stdout) => {
    if (err) {
      return res.json({ success: false, logs: "No device attached or logcat unavailable." });
    }
    res.json({ success: true, logs: stdout || "No recent error logs." });
  });
});

/**
 * GET /api/pawan/memory
 * Retrieve persistent memories or query by relevance
 */
const handleGetMemory = (req, res) => {
  try {
    const { pawanMemoryService } = require("../services/pawanMemoryService");
    const { q, projectId, type, limit } = req.query;

    if (q) {
      const searchResult = pawanMemoryService.retrieveContext({
        query: q,
        projectId: projectId || "global",
        limit: parseInt(limit, 10) || 5
      });
      return res.json({ success: true, ...searchResult });
    }

    const memories = pawanMemoryService.getPersistentMemories({
      projectId: projectId || null,
      type: type || null,
      limit: parseInt(limit, 10) || 20
    });
    const snapshot = pawanMemoryService.getMemorySnapshot();

    res.json({
      success: true,
      count: memories.length,
      memories,
      snapshot
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get("/pawan/memory", handleGetMemory);
router.get("/memory", handleGetMemory);

/**
 * POST /api/pawan/memory
 * Store a persistent directive, decision, or preference
 */
const handlePostMemory = (req, res) => {
  try {
    const { pawanMemoryService } = require("../services/pawanMemoryService");
    const { content, type, projectId, importance, tags, isGlobal, metadata } = req.body || {};

    if (!content) {
      return res.status(400).json({ success: false, error: "content is required" });
    }

    const result = pawanMemoryService.storePersistentMemory({
      content,
      type: type || "DECISION",
      projectId: projectId || "global",
      importance: importance || 5,
      tags: tags || [],
      isGlobal: Boolean(isGlobal),
      metadata: metadata || {}
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.post("/pawan/memory", handlePostMemory);
router.post("/memory", handlePostMemory);

/**
 * DELETE /api/pawan/memory/:id
 * Delete a specific persistent memory item
 */
const handleDeleteMemory = (req, res) => {
  try {
    const { pawanMemoryService } = require("../services/pawanMemoryService");
    const result = pawanMemoryService.deletePersistentMemory(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.delete("/pawan/memory/:id", handleDeleteMemory);
router.delete("/memory/:id", handleDeleteMemory);

/**
 * GET /api/pawan/lessons
 * Retrieve continuous learning lessons and metrics
 */
const handleGetLessons = (req, res) => {
  try {
    const { pawanLearningEngine } = require("../services/pawanLearningEngine");
    const { instruction, targetFile, projectId } = req.query;

    if (instruction || targetFile) {
      const lessons = pawanLearningEngine.getApplicableLessons(instruction, targetFile, projectId || "global");
      return res.json({ success: true, count: lessons.length, lessons });
    }

    const metrics = pawanLearningEngine.getLearningMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get("/pawan/lessons", handleGetLessons);
router.get("/lessons", handleGetLessons);

/**
 * GET /api/pawan/telemetry/stats
 * Complete execution telemetry metrics, token accounting, and provider reliability
 */
const handleGetTelemetryStats = (req, res) => {
  try {
    const recentAudit = engine.getAuditHistory(100);
    const { pawanMemoryService } = require("../services/pawanMemoryService");
    const { pawanLearningEngine } = require("../services/pawanLearningEngine");

    const total = recentAudit.length;
    const successful = recentAudit.filter(a => a.success).length;
    const failed = recentAudit.filter(a => !a.success).length;
    const selfHealed = recentAudit.filter(a => a.healCyclesRun > 0).length;

    let totalTokensKnown = 0;
    let tokensUnknownCount = 0;
    const providers = {};
    const models = {};

    for (const entry of recentAudit) {
      const inf = entry.inference || entry.telemetry || {};
      const prov = inf.provider || "UNKNOWN";
      const mod = inf.model || "UNKNOWN";
      providers[prov] = (providers[prov] || 0) + 1;
      models[mod] = (models[mod] || 0) + 1;

      const tok = inf.tokens;
      if (tok && typeof tok.totalTokens === "number") {
        totalTokensKnown += tok.totalTokens;
      } else {
        tokensUnknownCount++;
      }
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      executions: {
        total,
        successful,
        failed,
        selfHealed,
        successRatePercentage: total > 0 ? Math.round((successful / total) * 100) : 100
      },
      tokens: {
        knownTotalTokens: totalTokensKnown,
        unreportedTokensCount: tokensUnknownCount,
        truthPolicy: "STRICT_100_PERCENT_TRUTH_NO_FABRICATION"
      },
      providersBreakdown: providers,
      modelsBreakdown: models,
      memorySnapshot: pawanMemoryService.getMemorySnapshot(),
      learningMetrics: pawanLearningEngine.getLearningMetrics()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get("/pawan/telemetry/stats", handleGetTelemetryStats);
router.get("/telemetry/stats", handleGetTelemetryStats);

/**
 * GET /api/pawan/execute/stream
 * Real-time SSE stream for live execution trajectory observability
 */
const handleExecuteStream = (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent("connected", {
    status: "LIVE_OBSERVABILITY_ACTIVE",
    timestamp: new Date().toISOString()
  });

  // Listen to live events on GARUDA Event Nervous System
  const { garudaEventService } = require("../services/garudaEventService");
  const onGarudaEvent = (eventData) => {
    if (eventData && String(eventData.eventType).startsWith("PAWAN_")) {
      sendEvent("pawan_event", eventData);
    }
  };

  garudaEventService.on("*", onGarudaEvent);

  req.on("close", () => {
    garudaEventService.removeListener("*", onGarudaEvent);
  });
};
router.get("/pawan/execute/stream", handleExecuteStream);
router.get("/execute/stream", handleExecuteStream);

// ──────────────────────────────────────────────────────────────────────────
// CLOUD-FIRST EXECUTION QUEUE & WORKER ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────

const { pawanCloudQueue } = require("../services/astraCodingAgent/pawanCloudExecutionQueue");

// Auto-boot background worker if not already running
pawanCloudQueue.startWorker();

/**
 * POST /api/pawan/queue/enqueue
 * Non-blocking task ingestion for mobile and cloud clients
 */
function handleQueueEnqueue(req, res) {
  try {
    if (!requireFounderExecutionAccess(req, res)) return;
    const payload = req.body || {};
    const result = pawanCloudQueue.enqueueTask(payload);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(202).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.post("/queue/enqueue", handleQueueEnqueue);
router.post("/pawan/queue/enqueue", handleQueueEnqueue);
router.post("/async-execute", handleQueueEnqueue);
router.post("/pawan/async-execute", handleQueueEnqueue);

/**
 * GET /api/pawan/queue/status/:taskId
 * Poll task status, trajectory, and results from mobile or desktop
 */
function handleQueueStatus(req, res) {
  try {
    const { taskId } = req.params;
    const task = pawanCloudQueue.getTask(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.get("/queue/status/:taskId", handleQueueStatus);
router.get("/pawan/queue/status/:taskId", handleQueueStatus);

/**
 * POST /api/pawan/queue/cancel/:taskId
 * Abort a queued or in-flight task
 */
function handleQueueCancel(req, res) {
  try {
    const { taskId } = req.params;
    const { reason } = req.body || {};
    const result = pawanCloudQueue.cancelTask(taskId, reason);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.post("/queue/cancel/:taskId", handleQueueCancel);
router.post("/pawan/queue/cancel/:taskId", handleQueueCancel);

/**
 * GET /api/pawan/queue/health
 * Cloud worker health, queue depth, and memory telemetry
 */
function handleQueueHealth(req, res) {
  try {
    const health = pawanCloudQueue.getWorkerHealth();
    res.json({ success: true, health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.get("/queue/health", handleQueueHealth);
router.get("/pawan/queue/health", handleQueueHealth);

/**
 * GET /api/pawan/queue/list
 * List recent queued, active, and completed tasks
 */
function handleQueueList(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status || null;
    const projectId = req.query.projectId || null;
    const tasks = pawanCloudQueue.listTasks({ limit, status, projectId });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.get("/queue/list", handleQueueList);
router.get("/pawan/queue/list", handleQueueList);

/**
 * GET /api/pawan/artifacts/:artifactId
 * Retrieve persisted cloud artifact payload or metadata
 */
function handleArtifactDownload(req, res) {
  try {
    const { artifactId } = req.params;
    const safeId = path.basename(artifactId).replace(/[^a-zA-Z0-9_\-]/g, "");
    const artifactDir = path.join(__dirname, "..", "..", "data", "cloud-artifacts");
    const metaPath = path.join(artifactDir, `${safeId}.json`);
    const payloadPath = path.join(artifactDir, `${safeId}.payload`);

    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ success: false, error: "Artifact not found" });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (fs.existsSync(payloadPath)) {
      const payload = fs.readFileSync(payloadPath, "utf8");
      return res.json({ success: true, artifact: meta, payload });
    }

    res.json({ success: true, artifact: meta });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.get("/artifacts/:artifactId", handleArtifactDownload);
router.get("/pawan/artifacts/:artifactId", handleArtifactDownload);

module.exports = router;
