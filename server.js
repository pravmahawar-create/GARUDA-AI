const app = require("./src/app");
const connectDB = require("./src/database/db");
const { startDiscoveryWorker } = require("./src/workers/discoveryWorker");
const { startRevenueTaskRunnerWorker } = require("./src/workers/revenueTaskRunnerWorker");
const { startRevenueAcquisitionWorker } = require("./src/workers/revenueAcquisitionWorker");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

(async () => {
    const mongoConnected = await connectDB();

    app.listen(PORT, () => {
        console.log(`[GARUDA] GARUDA AI running on http://localhost:${PORT} (mongo: ${mongoConnected ? "connected" : "degraded"})`);

        // Workers are Mongo-backed; only start when the DB is available.
        // File/Supabase/NVIDIA features (lead-gen, outreach, affiliate, public chat) work regardless.
        if (mongoConnected) {
            try { startDiscoveryWorker(); } catch (e) { console.error("[GARUDA] discovery worker start failed:", e.message); }
            try { startRevenueTaskRunnerWorker(); } catch (e) { console.error("[GARUDA] revenue task runner start failed:", e.message); }
            try { startRevenueAcquisitionWorker(); } catch (e) { console.error("[GARUDA] revenue acquisition worker start failed:", e.message); }
        } else {
            console.log("[GARUDA] MongoDB unavailable — Mongo workers skipped. API + lead-gen + outreach + affiliate still live.");
        }
    });
})();
