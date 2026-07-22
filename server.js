const app = require("./src/app");
const connectDB = require("./src/database/db");
const { startDiscoveryWorker } = require("./src/workers/discoveryWorker");
const { startRevenueTaskRunnerWorker } = require("./src/workers/revenueTaskRunnerWorker");
const { startRevenueAcquisitionWorker } = require("./src/workers/revenueAcquisitionWorker");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

(async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`?? GARUDA AI running on http://localhost:${PORT}`);
        startDiscoveryWorker();
        startRevenueTaskRunnerWorker();
        startRevenueAcquisitionWorker();
    });
})();
