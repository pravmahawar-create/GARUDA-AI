const app = require("./src/app");
const connectDB = require("./src/database/db");
const { initRevenueOperatingCycle } = require("./src/services/revenueOperatingCycleInitializer");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

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

        // ── 24/7 Bounty Autonomous Daemon (non-blocking) — AUTO-RECOVERY SUPERVISOR ──
        // Enable with GARUDA_BOUNTY_DAEMON=true — default ON in production (Render). Set GARUDA_BOUNTY_DAEMON=false to disable.
        // Runs: node scripts/bounty-autonomous-daemon.js --watch --interval 30 --discover
        // Uses OpenCode/ollama_code via smartModelRouter bypass (never Gemini)
        const bountyEnabled = String(process.env.GARUDA_BOUNTY_DAEMON ?? (process.env.NODE_ENV === "production" ? "true" : "false")).toLowerCase() === "true";
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
                    console.log(`[GARUDA] 🦅 Bounty Autonomous Daemon spawned — interval ${interval}m --discover --watch (PID ${child.pid}, restart #${bountyRestartCount})`);
                    child.on("error", e => console.error("[GARUDA] Bounty daemon spawn failed:", e.message));
                    child.on("exit", (code, signal) => {
                        const uptimeSec = ((Date.now() - child._spawnAt)/1000).toFixed(0);
                        console.error(`[GARUDA] 🚨 Bounty daemon exited code ${code} signal ${signal} uptime ${uptimeSec}s — auto-restart in 30s`);
                        try {
                            const tg = require("./src/services/telegramBotService");
                            if (tg.isConfigured && tg.isConfigured()) tg.sendMessage(`🚨 GARUDA Bounty Daemon crashed (code ${code}, uptime ${uptimeSec}s) — auto-restarting in 30s (restart #${bountyRestartCount+1})`).catch(()=>{});
                        } catch {}
                        bountyRestartCount++;
                        // Exponential backoff cap 5m
                        const delay = Math.min(300000, 30000 * Math.pow(1.5, Math.min(bountyRestartCount, 6)));
                        setTimeout(spawnBounty, 30000);
                    });
                    return child;
                };
                spawnBounty();
                // Daily alive ping to founder
                setInterval(() => {
                    try {
                        const tg = require("./src/services/telegramBotService");
                        if (tg.isConfigured && tg.isConfigured()) tg.sendMessage(`✅ GARUDA Bounty Daemon alive — interval ${interval}m — ${new Date().toISOString()} — auto-recovery armed`).catch(()=>{});
                    } catch {}
                }, 24*60*60*1000).unref();
            } catch (e) { console.error("[GARUDA] Bounty daemon boot failed:", e.message); }
        } else {
            console.log("[GARUDA] Bounty daemon idle — set GARUDA_BOUNTY_DAEMON=true to enable 24/7 hunting");
        }

        // ── 24/7 Agency White-Label Auto-Dispatch (6 agencies, 250 OK) — DEDUP GUARD + AUTO-RECOVERY ──
        // Enable with GARUDA_AGENCY_DAEMON=true — default ON in production. Set false to disable.
        // Uses smtp.zoho.in:465 praveen@garudaos.in — verified 250 OK per dispatch
        const agencyEnabled = String(process.env.GARUDA_AGENCY_DAEMON ?? (process.env.NODE_ENV === "production" ? "true" : "false")).toLowerCase() === "true";
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
                        console.log(`[GARUDA] Agency dispatch completed code ${code} — next check in ${Math.round(agencyIntervalMs/3600000)}h`);
                        try {
                            const tg = require("./src/services/telegramBotService");
                            if (tg.isConfigured && tg.isConfigured()) tg.sendMessage(`🏢 Agency dispatch done (code ${code}) — 6 agencies via Zoho 465 — next in ${Math.round(agencyIntervalMs/3600000)}h`).catch(()=>{});
                        } catch {}
                    });
                    console.log(`[GARUDA] 🏢 Agency dispatch triggered — 6 agencies via Zoho 465 (PID ${child.pid})`);
                };
                // Initial check after 90s (allow DB boot), then interval with dedup
                setTimeout(runAgencyDispatch, 90 * 1000);
                setInterval(runAgencyDispatch, agencyIntervalMs);
                console.log(`[GARUDA] 🏢 Agency daemon armed — interval ${Math.round(agencyIntervalMs/3600000)}h dedup 24h guard (GARUDA_AGENCY_DAEMON=true)`);
            } catch (e) { console.error("[GARUDA] Agency daemon boot failed:", e.message); }
        } else {
            console.log("[GARUDA] Agency daemon idle — set GARUDA_AGENCY_DAEMON=true to enable daily 6-agency 250 OK");
        }
    });
})();
