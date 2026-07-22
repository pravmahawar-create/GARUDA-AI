const { runEligibleCycle } = require("../services/autonomousRevenueTaskRunnerService");
function startRevenueTaskRunnerWorker(options = {}) {
  if (String(process.env.REVENUE_TASK_RUNNER_ENABLED || "true").toLowerCase() === "false") return null;
  const intervalMs = Math.max(60000, Number(options.intervalMs || process.env.REVENUE_TASK_RUNNER_INTERVAL_MS || 120000));
  let running = false;
  const cycle = async () => { if (running) return; running = true; try { const result = await runEligibleCycle(); if (result.scanned) console.log("[RevenueTaskRunner]", result); } catch (error) { console.error("[RevenueTaskRunner] cycle failed:", error.message); } finally { running = false; } };
  const initialTimer = setTimeout(cycle, 10000); const timer = setInterval(cycle, intervalMs); initialTimer.unref(); timer.unref();
  return { intervalMs, stop: () => { clearTimeout(initialTimer); clearInterval(timer); } };
}
module.exports = { startRevenueTaskRunnerWorker };
