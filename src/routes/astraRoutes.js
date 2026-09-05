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
    const { instruction, targetFile, searchQuery, code, summary } = req.body;
    if (!instruction) {
      return res.status(400).json({ success: false, error: "instruction is required" });
    }

    const result = await engine.executeTask(instruction, {
      targetFile,
      searchQuery,
      code,
      summary
    });

    res.json({
      success: result.success,
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

    res.json({
      success: true,
      connected: devices.length > 0,
      devices,
      localIp,
      wifiUrl: `http://${localIp}:5173/`,
      usbUrl: "http://localhost:5173/",
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
        message: "USB Bridge Active! Now open Chrome on your phone and go to http://localhost:5173",
        ports: [5173, 3000]
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
