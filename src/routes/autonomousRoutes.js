const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// GET /api/autonomous/status — single pane for founder (no daily manual checks)
router.get("/status", async (req, res) => {
  try {
    const out = {
      timestamp: new Date().toISOString(),
      autonomousActive: String(process.env.GARUDA_AUTONOMOUS_ACTIVE) === "true",
      bounty: {
        enabled: String(process.env.GARUDA_BOUNTY_DAEMON) === "true",
        intervalMinutes: Number(process.env.GARUDA_BOUNTY_INTERVAL || 30),
        supervisor: "auto-restart armed (30s backoff, Telegram alert)",
      },
      agency: {
        enabled: String(process.env.GARUDA_AGENCY_DAEMON) === "true",
        intervalMs: Number(process.env.GARUDA_AGENCY_INTERVAL_MS || 86400000),
        dedup: "24h guard",
      },
      overnight: {},
      revenueCycle: {},
      health: {},
    };

    // Overnight status
    try {
      const overnight = require("../workers/overnightSerperHuntersWorker");
      out.overnight = overnight.getOvernightStatus();
    } catch (e) { out.overnight = { error: e.message }; }

    // Revenue cycle telemetry
    try {
      const { getOperatingCycleTelemetry } = require("../services/revenueOperatingCycleInitializer");
      out.revenueCycle = getOperatingCycleTelemetry();
    } catch (e) { out.revenueCycle = { error: e.message }; }

    // Bounty memory
    try {
      const memPath = path.join(__dirname, "..", "..", "data", "bounty-scan-memory.json");
      if (fs.existsSync(memPath)) {
        const mem = JSON.parse(fs.readFileSync(memPath, "utf8"));
        out.bounty.memoryEntries = Object.keys(mem).length;
        out.bounty.lastScans = Object.entries(mem).slice(-3).map(([k,v]) => ({ target: k, status: v.status, lastScanned: v.lastScanned }));
      }
    } catch {}

    // Agency log
    try {
      const logPath = path.join(__dirname, "..", "..", "data", "agency-whitelabel-dispatch-log.json");
      if (fs.existsSync(logPath)) {
        const logs = JSON.parse(fs.readFileSync(logPath, "utf8"));
        out.agency.lastDispatch = logs[logs.length - 1] || null;
        out.agency.totalDispatched = logs.length;
        const lastTs = logs.length ? new Date(logs[logs.length-1].timestamp).getTime() : 0;
        out.agency.dueInHours = lastTs ? Math.max(0, 24 - (Date.now() - lastTs)/3600000).toFixed(1) : 0;
      }
    } catch {}

    // DB health
    try {
      const connectDB = require("../database/db");
      out.health.database = connectDB.isMongoConnected() ? "mongodb-connected" : "degraded";
    } catch { out.health.database = "unknown"; }

    out.health.render = "https://garuda-ai-xfif.onrender.com/health";

    res.json({ success: true, ...out });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/autonomous/trigger/:job — manual trigger without redeploy (founder only via header)
router.post("/trigger/:job", async (req, res) => {
  const job = req.params.job;
  if (!["bounty", "agency", "overnight"].includes(job)) return res.status(400).json({ success:false, message:"unknown job" });
  // Founder gate optional — allow but log
  try {
    if (job === "bounty") {
      const { spawn } = require("child_process");
      const p = path.join(__dirname, "..", "..", "scripts", "bounty-autonomous-daemon.js");
      const child = spawn("node", [p, "--once", "--discover"], { stdio: "inherit", env: process.env });
      return res.json({ success:true, message:"bounty --once --discover triggered", pid: child.pid });
    }
    if (job === "agency") {
      const { spawn } = require("child_process");
      const p = path.join(__dirname, "..", "..", "scripts", "dispatch-agency-whitelabel.js");
      const child = spawn("node", [p], { stdio: "inherit", env: process.env });
      return res.json({ success:true, message:"agency dispatch triggered", pid: child.pid });
    }
    if (job === "overnight") {
      const overnight = require("../workers/overnightSerperHuntersWorker");
      const r = overnight.startOvernightLoop();
      return res.json({ success:true, ...r });
    }
  } catch (e) { return res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;
