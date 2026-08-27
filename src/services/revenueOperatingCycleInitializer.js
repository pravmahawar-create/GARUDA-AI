const { startDiscoveryWorker } = require("../workers/discoveryWorker");
const { startRevenueAcquisitionWorker } = require("../workers/revenueAcquisitionWorker");

let isInitialized = false;
let discoveryWorkerInstance = null;
let acquisitionWorkerInstance = null;
let heartbeatTimer = null;

const operationalState = {
  lastCycleAt: null,
  totalCyclesExecuted: 0,
  lastDiscoverySummary: null,
  status: "idle",
  error: null
};

/**
 * Initializes and starts the 24x7 GARUDA Revenue Operating Loop workers.
 */
function initRevenueOperatingCycle(options = {}) {
  if (isInitialized) {
    return { success: true, message: "Revenue operating cycle already initialized", state: operationalState };
  }

  try {
    const discoveryInterval = Number(process.env.DISCOVERY_INTERVAL_MS || options.discoveryIntervalMs || 900000); // 15 mins
    const acquisitionInterval = Number(process.env.REVENUE_ACQUISITION_INTERVAL_MS || options.acquisitionIntervalMs || 1200000); // 20 mins

    discoveryWorkerInstance = startDiscoveryWorker({ intervalMs: discoveryInterval });
    acquisitionWorkerInstance = startRevenueAcquisitionWorker({ intervalMs: acquisitionInterval });

    isInitialized = true;
    operationalState.status = "active";
    operationalState.lastCycleAt = new Date().toISOString();

    // Setup 60s operational heartbeat
    heartbeatTimer = setInterval(() => {
      operationalState.lastCycleAt = new Date().toISOString();
      operationalState.totalCyclesExecuted += 1;
    }, 60000);
    heartbeatTimer.unref();

    console.log("🦅 [GARUDA Revenue Operating Cycle] 24x7 Background Schedulers BOOTED Successfully.");
    return { success: true, status: "booted", state: operationalState };
  } catch (err) {
    operationalState.status = "error";
    operationalState.error = err.message;
    console.error("❌ [GARUDA Revenue Operating Cycle] Failed to boot workers:", err.message);
    return { success: false, error: err.message };
  }
}

function getOperatingCycleTelemetry() {
  return {
    isInitialized,
    state: operationalState,
    discoveryWorkerActive: Boolean(discoveryWorkerInstance),
    acquisitionWorkerActive: Boolean(acquisitionWorkerInstance)
  };
}

function stopRevenueOperatingCycle() {
  if (discoveryWorkerInstance && typeof discoveryWorkerInstance.stop === "function") {
    discoveryWorkerInstance.stop();
  }
  if (acquisitionWorkerInstance && typeof acquisitionWorkerInstance.stop === "function") {
    acquisitionWorkerInstance.stop();
  }
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  isInitialized = false;
  operationalState.status = "stopped";
}

module.exports = {
  initRevenueOperatingCycle,
  getOperatingCycleTelemetry,
  stopRevenueOperatingCycle
};
