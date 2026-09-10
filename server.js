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
    });
})();
