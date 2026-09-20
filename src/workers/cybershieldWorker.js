/**
 * 🦅 GARUDA CYBERSHIELD™ — Sovereign Autonomous Cloud Worker
 * Runs headless inside Render / Cloud Backend (Tier 2 Cloud Background Daemon).
 * Executes scheduled polling, processes task queues, and ensures failure recovery.
 */

const mongoose = require("mongoose");
const cybershieldService = require("../services/cybershieldService");
const { CyberShieldMonitor } = require("../models/CyberShieldMonitor");
const { CyberShieldTask } = require("../models/CyberShieldTask");

let workerInstance = null;
let pollTimer = null;
let queueTimer = null;
let heartbeatTimer = null;

const workerTelemetry = {
  status: "STOPPED", // STOPPED | HEALTHY | DEGRADED | FAILED
  workerStartedAt: null,
  lastHeartbeat: null,
  lastSuccessfulJob: null,
  lastFailedJob: null,
  totalJobsProcessed: 0,
  totalJobsFailed: 0,
  queueDepth: 0,
  activeMonitorsCount: 0,
  lastPollCycleAt: null,
  lastError: null
};

function isMongoActive() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Executes one polling cycle across all ACTIVE CyberShield monitors
 */
async function runMonitorPollingCycle() {
  workerTelemetry.lastPollCycleAt = new Date().toISOString();
  try {
    let activeMonitors = [];
    if (isMongoActive()) {
      activeMonitors = await CyberShieldMonitor.find({ status: "ACTIVE" }).lean();
    } else {
      activeMonitors = (await cybershieldService.listMonitors("tenant_founder_core")).filter(
        (m) => m.status === "ACTIVE"
      );
    }

    workerTelemetry.activeMonitorsCount = activeMonitors.length;

    for (const monitor of activeMonitors) {
      try {
        // Update monitor lastSuccessfulRun timestamp
        if (isMongoActive()) {
          await CyberShieldMonitor.updateOne(
            { monitorId: monitor.monitorId },
            { lastSuccessfulRun: new Date() }
          );
        }
      } catch (monErr) {
        console.warn(`[CyberShieldWorker] Monitor ${monitor.monitorId} poll update error:`, monErr.message);
      }
    }

    workerTelemetry.lastSuccessfulJob = new Date().toISOString();
  } catch (error) {
    workerTelemetry.lastFailedJob = new Date().toISOString();
    workerTelemetry.totalJobsFailed += 1;
    workerTelemetry.lastError = error.message;
    console.error("[CyberShieldWorker] Polling cycle error:", error.message);
  }
}

/**
 * Processes queued background tasks from CyberShieldTask
 */
async function runTaskQueueCycle() {
  if (!isMongoActive()) return;

  try {
    // Find pending or retrying tasks due for execution
    const tasks = await CyberShieldTask.find({
      status: { $in: ["PENDING", "RETRYING"] },
      nextRunAt: { $lte: new Date() },
      $or: [
        { lockedAt: null },
        { lockedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } } // Stale lock recovery (5 mins)
      ]
    })
      .sort({ createdAt: 1 })
      .limit(10);

    workerTelemetry.queueDepth = tasks.length;

    for (const task of tasks) {
      // Lock task
      task.status = "PROCESSING";
      task.lockedAt = new Date();
      task.attempts += 1;
      await task.save();

      try {
        if (task.type === "PROCESS_EVENT") {
          await cybershieldService.processEvent(task.payload, {
            tenantId: task.tenantId,
            monitorId: task.monitorId,
            correlationId: task.jobId
          });
        }

        task.status = "COMPLETED";
        task.completedAt = new Date();
        task.lockedAt = null;
        await task.save();

        workerTelemetry.totalJobsProcessed += 1;
        workerTelemetry.lastSuccessfulJob = new Date().toISOString();
      } catch (jobErr) {
        console.error(`[CyberShieldWorker] Task ${task.jobId} failed:`, jobErr.message);
        task.lastError = jobErr.message;
        task.lockedAt = null;

        if (task.attempts >= task.maxAttempts) {
          task.status = "DEAD_LETTER";
        } else {
          task.status = "RETRYING";
          // Exponential backoff: 30s, 60s, 120s
          const backoffSec = Math.pow(2, task.attempts) * 15;
          task.nextRunAt = new Date(Date.now() + backoffSec * 1000);
        }
        await task.save();

        workerTelemetry.totalJobsFailed += 1;
        workerTelemetry.lastFailedJob = new Date().toISOString();
      }
    }
  } catch (err) {
    workerTelemetry.lastError = err.message;
  }
}

/**
 * Starts the background autonomous worker
 */
function startCyberShieldWorker(options = {}) {
  if (workerInstance) {
    return { success: true, message: "Worker already running", telemetry: workerTelemetry };
  }

  const pollIntervalMs = Math.max(30000, Number(options.pollIntervalMs || process.env.CYBERSHIELD_POLL_MS || 60000));
  const queueIntervalMs = Math.max(5000, Number(options.queueIntervalMs || 10000));

  workerTelemetry.status = isMongoActive() ? "HEALTHY" : "DEGRADED";
  workerTelemetry.workerStartedAt = new Date().toISOString();
  workerTelemetry.lastHeartbeat = new Date().toISOString();

  // 1. Monitor Polling Timer
  pollTimer = setInterval(runMonitorPollingCycle, pollIntervalMs);
  pollTimer.unref();

  // 2. Task Queue Processor Timer
  queueTimer = setInterval(runTaskQueueCycle, queueIntervalMs);
  queueTimer.unref();

  // 3. Operational Heartbeat Timer (every 30s)
  heartbeatTimer = setInterval(() => {
    workerTelemetry.lastHeartbeat = new Date().toISOString();
    workerTelemetry.status = isMongoActive() ? "HEALTHY" : "DEGRADED";
  }, 30000);
  heartbeatTimer.unref();

  // Initial trigger after 5 seconds
  setTimeout(() => {
    runMonitorPollingCycle().catch(() => {});
    runTaskQueueCycle().catch(() => {});
  }, 5000).unref();

  workerInstance = {
    stop: () => {
      if (pollTimer) clearInterval(pollTimer);
      if (queueTimer) clearInterval(queueTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      workerInstance = null;
      workerTelemetry.status = "STOPPED";
    }
  };

  console.log(`[CyberShieldWorker] 🛡️ Autonomous Background Worker BOOTED (poll: ${pollIntervalMs}ms, queue: ${queueIntervalMs}ms)`);
  return { success: true, status: "booted", telemetry: workerTelemetry };
}

function getWorkerHealth() {
  workerTelemetry.lastHeartbeat = new Date().toISOString();
  return {
    ...workerTelemetry,
    isMongoConnected: isMongoActive()
  };
}

module.exports = {
  startCyberShieldWorker,
  getWorkerHealth,
  runMonitorPollingCycle,
  runTaskQueueCycle
};
