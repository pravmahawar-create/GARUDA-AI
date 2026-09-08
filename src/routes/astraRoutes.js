/**
 * 🦅 GARUDA ASTRA API ROUTES
 * Endpoints for autonomous coding, self-healing, and audit trails.
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");
const { AstraExecutionEngine } = require("../services/astraCodingAgent/astraExecutionEngine");

const engine = new AstraExecutionEngine();

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
 * POST /api/astra/execute
 * Execute an autonomous coding or refactoring task
 */
router.post("/execute", async (req, res) => {
  try {
    const { instruction, targetFile, searchQuery, code, currentCode, summary } = req.body;
    if (!instruction) {
      return res.status(400).json({ success: false, error: "instruction is required" });
    }

    const result = await engine.executeTask(instruction, {
      targetFile,
      searchQuery,
      code,
      currentCode,
      summary
    });

    res.json({
      success: result.success,
      error: result.error || null,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

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

/**
 * POST /api/pawan/build-apk
 * Compile or package active application for mobile installation & testing
 */
router.post("/build-apk", async (req, res) => {
  try {
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
 * GET /api/astra/status
 * Check engine status and provider configuration
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    engine: "GARUDA PAWAN Sovereign Coding Agent",
    slogan: "As fast as wind. Smooth and powerful.",
    founder: "Praveen Mahawar",
    status: "online",
    capabilities: [
      "autonomous_react_loop",
      "closed_loop_syntax_verification",
      "self_healing_recovery",
      "sha256_audit_trail",
      "multimodal_repo_reconnaissance"
    ],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/astra/history
 * Retrieve recent execution audit trail
 */
router.get("/history", (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const history = engine.getAuditHistory(limit);
  res.json({
    success: true,
    count: history.length,
    history
  });
});

/**
 * POST /api/astra/inspect
 * Inspect a file with line numbers and SHA-256
 */
router.post("/inspect", (req, res) => {
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

module.exports = router;
