const app = require("./src/app");
const connectDB = require("./src/database/db");
const { initRevenueOperatingCycle } = require("./src/services/revenueOperatingCycleInitializer");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// ── KEEP-ALIVE: Prevent Render free-tier cold start ──
// Pings own /health endpoint every 10 min so Render never spins down the process.
const KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
if (String(process.env.GARUDA_KEEPALIVE ?? "true").toLowerCase() !== "false") {
    setInterval(() => {
        const base = `http://localhost:${PORT}`;
        fetch(`${base}/health`).then(r => r.json()).then(d => {
            console.log(`[GARUDA] Keep-alive ping OK — mongo: ${d.database}`);
        }).catch(e => console.warn(`[GARUDA] Keep-alive ping failed: ${e.message}`));
    }, KEEPALIVE_INTERVAL_MS).unref();
    console.log(`[GARUDA] Keep-alive armed — pinging /health every ${KEEPALIVE_INTERVAL_MS / 60000}min`);
}

(async () => {
    const mongoConnected = await connectDB();

    app.listen(PORT, () => {
        console.log(`[GARUDA] GARUDA AI running on http://localhost:${PORT} (mongo: ${mongoConnected ? "connected" : "degraded"})`);

        // Workers are Mongo-backed; only start when the DB is available.
        // File/Supabase/NVIDIA features (lead-gen, outreach, affiliate, public chat) work regardless.
        if (mongoConnected) {
            try { initRevenueOperatingCycle(); console.log("[GARUDA] Revenue operating cycle booted ✓"); } catch (e) { console.error("[GARUDA] revenue operating cycle start failed:", String(e.message).slice(0,300)); }
        } else {
            console.log("[GARUDA] MongoDB unavailable — Mongo workers skipped. API + lead-gen + outreach + affiliate still live.");
            // Heartbeat: retry Mongo + boot workers if reconnected
            let retries = 0;
            const hb = setInterval(async () => {
              if (connectDB.isMongoConnected && connectDB.isMongoConnected()) {
                clearInterval(hb);
                try { initRevenueOperatingCycle(); console.log("[GARUDA] Heartbeat: Mongo reconnected — workers booted ✓"); } catch(e){ console.error("[GARUDA] heartbeat boot failed:", e.message); }
              } else if (retries++ < 12) {
                try { const ok = await connectDB(); if (ok) { clearInterval(hb); initRevenueOperatingCycle(); console.log("[GARUDA] Heartbeat: reconnect success — workers booted ✓"); } } catch {}
              } else { clearInterval(hb); console.log("[GARUDA] Heartbeat: max retries reached"); }
            }, 30000);
        }

        // ── 24/7 Bounty Autonomous Daemon (non-blocking) — SILENCED BY DEFAULT ──
        // Enable only with explicit GARUDA_BOUNTY_DAEMON=true. Default is strictly FALSE.
        // Routine crash and scan alerts to Telegram are disabled to eliminate noise.
        const bountyEnabled = String(process.env.GARUDA_BOUNTY_DAEMON || "false").toLowerCase() === "true";
        if (bountyEnabled) {
            try {
                const { spawn } = require("child_process");
                const path = require("path");
                const daemonPath = path.join(__dirname, "scripts", "bounty-autonomous-daemon.js");
                const interval = process.env.GARUDA_BOUNTY_INTERVAL || "30";
                let bountyRestartCount = 0;
                const spawnBounty = () => {
                    const child = spawn("node", [daemonPath, "--watch", "--interval", interval, "--discover"], {
                        stdio: "inherit",
                        detached: false,
                        env: process.env
                    });
                    child._spawnAt = Date.now();
                    console.log(`[GARUDA] 🦅 Bounty Autonomous Daemon spawned — interval ${interval}m (PID ${child.pid}, restart #${bountyRestartCount})`);
                    child.on("error", e => console.error("[GARUDA] Bounty daemon spawn failed:", e.message));
                    child.on("exit", (code, signal) => {
                        const uptimeSec = ((Date.now() - child._spawnAt)/1000).toFixed(0);
                        console.log(`[GARUDA] Bounty daemon exited code ${code} signal ${signal} uptime ${uptimeSec}s — auto-restart in 30s (silent)`);
                        bountyRestartCount++;
                        setTimeout(spawnBounty, 30000);
                    });
                    return child;
                };
                spawnBounty();
            } catch (e) { console.error("[GARUDA] Bounty daemon boot failed:", e.message); }
        } else {
            console.log("[GARUDA] Bounty daemon idle — set GARUDA_BOUNTY_DAEMON=true to enable");
        }

        // ── 24/7 Agency White-Label Auto-Dispatch — SILENCED BY DEFAULT ──
        // Enable only with explicit GARUDA_AGENCY_DAEMON=true. Default is strictly FALSE.
        // Telegram notifications removed to prevent repetitive routine alerts.
        const agencyEnabled = String(process.env.GARUDA_AGENCY_DAEMON || "false").toLowerCase() === "true";
        if (agencyEnabled) {
            try {
                const agencyIntervalMs = Number(process.env.GARUDA_AGENCY_INTERVAL_MS) || 24 * 60 * 60 * 1000; // daily
                const fs = require("fs");
                const path = require("path");
                const logPath = path.join(__dirname, "data", "agency-whitelabel-dispatch-log.json");
                const isDue = () => {
                    try {
                        if (!fs.existsSync(logPath)) return true;
                        const logs = JSON.parse(fs.readFileSync(logPath, "utf8"));
                        if (!Array.isArray(logs) || logs.length === 0) return true;
                        const last = logs[logs.length - 1];
                        const lastTs = new Date(last.timestamp).getTime();
                        return (Date.now() - lastTs) > (23 * 60 * 60 * 1000); // 23h grace
                    } catch { return true; }
                };
                const runAgencyDispatch = () => {
                    if (!isDue()) {
                        console.log("[GARUDA] 🏢 Agency dispatch skipped — already dispatched within 24h (dedup guard)");
                        return;
                    }
                    const { spawn } = require("child_process");
                    const scriptPath = path.join(__dirname, "scripts", "dispatch-agency-whitelabel.js");
                    const child = spawn("node", [scriptPath], { stdio: "inherit", env: process.env });
                    child.on("error", e => console.error("[GARUDA] Agency dispatch spawn failed:", e.message));
                    child.on("exit", code => {
                        console.log(`[GARUDA] Agency dispatch completed code ${code} (silent)`);
                    });
                    console.log(`[GARUDA] 🏢 Agency dispatch triggered (PID ${child.pid})`);
                };
                setTimeout(runAgencyDispatch, 90 * 1000);
                setInterval(runAgencyDispatch, agencyIntervalMs);
                console.log(`[GARUDA] 🏢 Agency daemon armed (silent, GARUDA_AGENCY_DAEMON=true)`);
            } catch (e) { console.error("[GARUDA] Agency daemon boot failed:", e.message); }
        } else {
            console.log("[GARUDA] Agency daemon idle — set GARUDA_AGENCY_DAEMON=true to enable");
        }

        // ── 24/7 Cloud Radar Reply Monitor Daemon (Render Cloud 24/7) ──
        const radarMonitorEnabled = String(process.env.GARUDA_RADAR_MONITOR ?? "true").toLowerCase() === "true";
        if (radarMonitorEnabled) {
            try {
                const { spawn } = require("child_process");
                const path = require("path");
                const monitorPath = path.join(__dirname, "scripts", "radar", "instant-reply-monitor.js");
                let monitorRestartCount = 0;
                const spawnMonitor = () => {
                    const child = spawn("node", [monitorPath, "--watch"], {
                        stdio: "inherit",
                        detached: false,
                        env: process.env
                    });
                    child._spawnAt = Date.now();
                    console.log(`[GARUDA] 🦅 24/7 Cloud Radar Reply Monitor spawned (PID ${child.pid}, restart #${monitorRestartCount})`);
                    child.on("error", e => console.error("[GARUDA] Cloud reply monitor spawn failed:", e.message));
                    child.on("exit", (code, signal) => {
                        const uptimeSec = ((Date.now() - child._spawnAt)/1000).toFixed(0);
                        console.log(`[GARUDA] Cloud reply monitor exited code ${code} signal ${signal} uptime ${uptimeSec}s — auto-restart in 60s`);
                        monitorRestartCount++;
                        setTimeout(spawnMonitor, 60000);
                    });
                    return child;
                };
                // Initial warm up delay (25s) after server boot
                setTimeout(spawnMonitor, 25000);
            } catch (e) { console.error("[GARUDA] Cloud reply monitor boot failed:", e.message); }
        } else {
            console.log("[GARUDA] Cloud reply monitor idle — set GARUDA_RADAR_MONITOR=true to enable");
        }
    });
})();
