const { DEFAULT_INTERVAL_MS, runContinuousAttemptCycle } = require("../services/continuousRevenueAttemptService");

function startRevenueAcquisitionWorker(options = {}) {
  if (String(process.env.REVENUE_ACQUISITION_WORKER_ENABLED || "true").toLowerCase() === "false") return null;
  const intervalMs = Math.max(60000, Number(options.intervalMs || process.env.REVENUE_ACQUISITION_WORKER_INTERVAL_MS || DEFAULT_INTERVAL_MS));
  let running = false;
  const cycle = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runContinuousAttemptCycle({ intervalMs });
      console.log("[RevenueAttempt]", result);
    } catch (error) {
      console.error("[RevenueAttempt] cycle failed:", error.message);
    } finally {
      running = false;
    }
  };
  const initialTimer = setTimeout(cycle, 15000);
  const timer = setInterval(cycle, intervalMs);
  initialTimer.unref();
  timer.unref();
  return { intervalMs, stop: () => { clearTimeout(initialTimer); clearInterval(timer); } };
}

module.exports = { startRevenueAcquisitionWorker };
