const { runDiscoveryCycle } = require("../services/opportunityDiscoveryService");

function startDiscoveryWorker(options = {}) {
  if (String(process.env.DISCOVERY_ENABLED || "true").toLowerCase() === "false") return null;
  const intervalMs = Math.max(60000, Number(options.intervalMs || process.env.DISCOVERY_INTERVAL_MS || 900000));
  let running = false;
  const cycle = async () => {
    if (running) return;
    running = true;
    try { const result = await runDiscoveryCycle({ intervalMs }); console.log("[Discovery]", result); }
    catch (error) { console.error("[Discovery] cycle failed:", error.message); }
    finally { running = false; }
  };
  const initialTimer = setTimeout(cycle, 5000);
  const timer = setInterval(cycle, intervalMs);
  initialTimer.unref(); timer.unref();
  return { intervalMs, stop: () => { clearTimeout(initialTimer); clearInterval(timer); } };
}

module.exports = { startDiscoveryWorker };
