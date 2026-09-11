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

        // ── 24/7 Bounty Autonomous Daemon (non-blocking) ──
        // Enable with GARUDA_BOUNTY_DAEMON=true + TELEGRAM_BOT_TOKEN + bounty-targets.txt
        // Runs: node scripts/bounty-autonomous-daemon.js --watch --interval 30 --discover
        // Uses OpenCode/ollama_code via smartModelRouter bypass (never Gemini)
        if (String(process.env.GARUDA_BOUNTY_DAEMON).toLowerCase() === "true") {
            try {
                const { spawn } = require("child_process");
                const path = require("path");
                const daemonPath = path.join(__dirname, "scripts", "bounty-autonomous-daemon.js");
                const interval = process.env.GARUDA_BOUNTY_INTERVAL || "30";
                const child = spawn("node", [daemonPath, "--watch", "--interval", interval, "--discover"], {
                    stdio: "inherit",
                    detached: false,
                    env: process.env
                });
                child.on("error", e => console.error("[GARUDA] Bounty daemon spawn failed:", e.message));
                child.on("exit", (code) => console.log(`[GARUDA] Bounty daemon exited code ${code} — will not auto-restart (use Render worker for HA)`));
                console.log(`[GARUDA] 🦅 Bounty Autonomous Daemon spawned — interval ${interval}m --discover --watch (PID ${child.pid})`);
            } catch (e) { console.error("[GARUDA] Bounty daemon boot failed:", e.message); }
        } else {
            console.log("[GARUDA] Bounty daemon idle — set GARUDA_BOUNTY_DAEMON=true to enable 24/7 hunting");
        }

        // ── 24/7 Agency White-Label Auto-Dispatch (6 agencies, 250 OK) ──
        // Enable with GARUDA_AGENCY_DAEMON=true — runs daily 09:00 IST via setInterval
        // Uses smtp.zoho.in:465 praveen@garudaos.in — verified 250 OK per dispatch
        if (String(process.env.GARUDA_AGENCY_DAEMON).toLowerCase() === "true") {
            try {
                const agencyIntervalMs = Number(process.env.GARUDA_AGENCY_INTERVAL_MS) || 24 * 60 * 60 * 1000; // daily
                const runAgencyDispatch = () => {
                    const { spawn } = require("child_process");
                    const path = require("path");
                    const scriptPath = path.join(__dirname, "scripts", "dispatch-agency-whitelabel.js");
                    const child = spawn("node", [scriptPath], { stdio: "inherit", env: process.env });
                    child.on("error", e => console.error("[GARUDA] Agency dispatch spawn failed:", e.message));
                    child.on("exit", code => console.log(`[GARUDA] Agency dispatch completed code ${code} — next in ${Math.round(agencyIntervalMs/3600000)}h`));
                    console.log(`[GARUDA] 🏢 Agency dispatch triggered — 6 agencies via Zoho 465 (PID ${child.pid})`);
                };
                // Initial run after 60s, then interval
                setTimeout(runAgencyDispatch, 60 * 1000);
                setInterval(runAgencyDispatch, agencyIntervalMs);
                console.log(`[GARUDA] 🏢 Agency daemon armed — interval ${Math.round(agencyIntervalMs/3600000)}h (GARUDA_AGENCY_DAEMON=true)`);
            } catch (e) { console.error("[GARUDA] Agency daemon boot failed:", e.message); }
        } else {
            console.log("[GARUDA] Agency daemon idle — set GARUDA_AGENCY_DAEMON=true to enable daily 6-agency 250 OK");
        }
    });
})();
