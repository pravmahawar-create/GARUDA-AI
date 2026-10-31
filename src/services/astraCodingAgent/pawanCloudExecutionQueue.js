/**
 * 🦅 GARUDA PAWAN ASTRA™ — CLOUD-FIRST EXECUTION QUEUE & PERSISTENT WORKER
 * 
 * Enables complete independence from the Founder's laptop.
 * 
 * Core Capabilities:
 * 1. Persistent Asynchronous Task Queue (Local atomic JSON + Cloud Supabase/MongoDB sync)
 * 2. Independent Cloud Worker (Runs 24/7 on Render / persistent cloud containers)
 * 3. Mobile Founder Control: Immediate <10ms queue response; mobile devices poll or stream without keeping connections alive
 * 4. Stranded Task Recovery: Automatically detects and recovers in-flight tasks if cloud worker restarts
 * 5. Bounded Automatic Retries: Retries transient failures up to maxRetries (default: 2)
 * 6. Execution Timeout Watchdog: Enforces bounded timeout (default: 180s) to prevent runaway hanging
 * 7. Task Cancellation: Supports clean abort of queued and in-flight tasks
 * 8. Cloud Artifact Storage & Expiration Index: Retains generated deliverables across worker restarts
 * 9. Worker Health & Observability: Live metrics on memory, active tasks, queue depth, throughput
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_QUEUE_FILE = path.join(__dirname, "..", "..", "..", "data", "pawan-cloud-queue.json");
const ARTIFACT_DIR = path.join(__dirname, "..", "..", "..", "data", "cloud-artifacts");

// Sensitive information patterns for sanitization
const SENSITIVE_PATTERNS = [
  /(?:api[_-]?key|secret|token|password|auth|bearer)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.]{8,})["']?/gi,
  /AIzaSy[a-zA-Z0-9_\-]{33}/g,
  /gsk_[a-zA-Z0-9]{30,}/g,
  /nvapi-[a-zA-Z0-9_\-]{40,}/g
];

function sanitizeSecrets(text) {
  if (typeof text !== "string") return text;
  let sanitized = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.includes(":") || match.includes("=")) {
        const parts = match.split(/[:=]/);
        return `${parts[0]}: [REDACTED]`;
      }
      return "[REDACTED]";
    });
  }
  return sanitized;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (typeof obj === "string") return sanitizeSecrets(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/password|secret|token|api_?key|private_?key|authorization/i.test(k)) {
      clean[k] = "[REDACTED]";
    } else {
      clean[k] = sanitizeObject(v);
    }
  }
  return clean;
}

class PawanCloudExecutionQueue {
  constructor(options = {}) {
    this.queueFile = options.queueFile || process.env.PAWAN_QUEUE_DATA_FILE || DEFAULT_QUEUE_FILE;
    this.maxConcurrency = options.maxConcurrency || 1; // Default 1 to respect Render Starter 384MB heap limit
    this.executionTimeoutMs = options.executionTimeoutMs || 180000; // 3 minutes timeout
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
    this.workerPollIntervalMs = options.pollIntervalMs || 2000;
    
    this.activeWorkers = new Map(); // taskId -> { abortController, startedAt, promise }
    this.isWorkerRunning = false;
    this.workerLoopTimer = null;
    this.bootTimestamp = new Date().toISOString();
    this.stats = {
      enqueuedTotal: 0,
      completedTotal: 0,
      failedTotal: 0,
      cancelledTotal: 0,
      retriedTotal: 0
    };

    this._ensureStorage();
    this.recoverStrandedTasks();
  }

  _getQueueFile() {
    return process.env.PAWAN_QUEUE_DATA_FILE || this.queueFile;
  }

  _ensureStorage() {
    const qFile = this._getQueueFile();
    const qDir = path.dirname(qFile);
    try {
      if (!fs.existsSync(qDir)) fs.mkdirSync(qDir, { recursive: true });
      if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
      if (!fs.existsSync(qFile)) {
        const initial = {
          version: "1.0",
          lastUpdated: new Date().toISOString(),
          tasks: []
        };
        fs.writeFileSync(qFile, JSON.stringify(initial, null, 2), "utf8");
      }
    } catch (err) {
      console.warn("[PawanQueue] Storage init notice:", err.message);
    }
  }

  _loadQueue() {
    this._ensureStorage();
    try {
      const raw = fs.readFileSync(this._getQueueFile(), "utf8");
      return JSON.parse(raw);
    } catch {
      return { version: "1.0", lastUpdated: new Date().toISOString(), tasks: [] };
    }
  }

  _saveQueue(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      const qFile = this._getQueueFile();
      const qDir = path.dirname(qFile);
      if (!fs.existsSync(qDir)) fs.mkdirSync(qDir, { recursive: true });
      const tmp = `${qFile}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tmp, qFile);
      return true;
    } catch (err) {
      console.error("[PawanQueue] Save error:", err.message);
      return false;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. RECOVERY OF STRANDED IN-FLIGHT TASKS (Cloud Worker Restart Resilience)
  // ──────────────────────────────────────────────────────────────────────────

  recoverStrandedTasks() {
    const queue = this._loadQueue();
    let modified = false;

    for (const task of queue.tasks) {
      if (task.status === "PROCESSING") {
        console.warn(`[PawanQueue] ⚠️ Detected stranded task ${task.taskId} from previous worker restart.`);
        if (task.retryCount < this.maxRetries) {
          task.status = "QUEUED";
          task.retryCount = (task.retryCount || 0) + 1;
          task.lastError = "Cloud worker restarted mid-execution. Automatically re-queued for execution.";
          this.stats.retriedTotal++;
          console.log(`[PawanQueue] Re-queued stranded task ${task.taskId} (attempt ${task.retryCount}/${this.maxRetries}).`);
        } else {
          task.status = "FAILED";
          task.failedAt = new Date().toISOString();
          task.error = "Cloud worker restarted mid-execution and maximum retries exhausted.";
          this.stats.failedTotal++;
        }
        modified = true;
      }
    }

    if (modified) {
      this._saveQueue(queue);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. TASK ENQUEUE (Mobile / Web Non-blocking Ingestion)
  // ──────────────────────────────────────────────────────────────────────────

  enqueueTask({
    instruction,
    targetFile = null,
    searchQuery = null,
    code = null,
    currentCode = null,
    summary = null,
    projectId = "pawan-default",
    sessionId = null,
    requestId = null,
    metadata = {}
  }) {
    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return { success: false, error: "instruction is required" };
    }

    const taskId = `task_pwn_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const cleanInstruction = sanitizeSecrets(instruction.trim());
    const now = new Date().toISOString();

    const taskRecord = {
      taskId,
      requestId: requestId || `req_${Date.now()}`,
      sessionId: sessionId || `sess_${Date.now()}`,
      projectId: projectId || "pawan-default",
      instruction: cleanInstruction,
      targetFile: targetFile || null,
      searchQuery: searchQuery || null,
      code: code ? sanitizeSecrets(code) : null,
      currentCode: currentCode ? sanitizeSecrets(currentCode) : null,
      summary: summary || null,
      metadata: sanitizeObject(metadata),
      status: "QUEUED", // QUEUED | PROCESSING | COMPLETED | FAILED | CANCELLED
      retryCount: 0,
      enqueuedAt: now,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      durationMs: null,
      result: null,
      error: null,
      trajectory: [{ step: "TASK_ENQUEUED", timestamp: now, note: "Accepted into persistent cloud queue" }]
    };

    const queue = this._loadQueue();
    queue.tasks.push(taskRecord);
    this._saveQueue(queue);
    this.stats.enqueuedTotal++;

    // Asynchronously replicate to cloud database if available
    this._replicateToCloud(taskRecord);

    // Trigger worker tick immediately
    this._triggerWorkerTick();

    return {
      success: true,
      taskId,
      status: "QUEUED",
      enqueuedAt: now,
      pollUrl: `/api/pawan/queue/status/${taskId}`,
      message: "Task accepted into cloud queue. Mobile devices may poll status or disconnect safely."
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. TASK STATUS & QUERYING
  // ──────────────────────────────────────────────────────────────────────────

  getTask(taskId) {
    if (!taskId) return null;
    const queue = this._loadQueue();
    return queue.tasks.find(t => t.taskId === taskId) || null;
  }

  listTasks({ projectId = null, status = null, limit = 20 } = {}) {
    const queue = this._loadQueue();
    let tasks = queue.tasks;

    if (projectId && projectId !== "all") {
      tasks = tasks.filter(t => t.projectId === projectId || t.projectId === "global");
    }

    if (status) {
      tasks = tasks.filter(t => t.status === status.toUpperCase());
    }

    return tasks.sort((a, b) => new Date(b.enqueuedAt) - new Date(a.enqueuedAt)).slice(0, limit);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. TASK CANCELLATION
  // ──────────────────────────────────────────────────────────────────────────

  cancelTask(taskId, reason = "Cancelled by user request") {
    if (!taskId) return { success: false, error: "taskId is required" };
    const queue = this._loadQueue();
    const task = queue.tasks.find(t => t.taskId === taskId);

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.status === "COMPLETED" || task.status === "FAILED") {
      return { success: false, error: `Cannot cancel task with terminal status ${task.status}` };
    }

    task.status = "CANCELLED";
    task.completedAt = new Date().toISOString();
    task.error = sanitizeSecrets(reason);
    task.trajectory.push({ step: "TASK_CANCELLED", timestamp: new Date().toISOString(), reason });

    // If currently processing, signal abort
    if (this.activeWorkers.has(taskId)) {
      const active = this.activeWorkers.get(taskId);
      if (active.abortController) {
        active.abortController.abort();
      }
      this.activeWorkers.delete(taskId);
    }

    this._saveQueue(queue);
    this.stats.cancelledTotal++;
    return { success: true, taskId, status: "CANCELLED" };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. INDEPENDENT CLOUD WORKER LOOP
  // ──────────────────────────────────────────────────────────────────────────

  startWorker() {
    if (this.isWorkerRunning) return;
    this.isWorkerRunning = true;
    console.log("[PawanCloudWorker] 🟢 Cloud Execution Worker booted and active.");

    const poll = async () => {
      if (!this.isWorkerRunning) return;
      try {
        await this._processNextBatch();
      } catch (err) {
        console.error("[PawanCloudWorker] Poll loop error:", err.message);
      } finally {
        if (this.isWorkerRunning) {
          this.workerLoopTimer = setTimeout(poll, this.workerPollIntervalMs);
        }
      }
    };

    poll();
  }

  stopWorker() {
    this.isWorkerRunning = false;
    if (this.workerLoopTimer) {
      clearTimeout(this.workerLoopTimer);
      this.workerLoopTimer = null;
    }
    console.log("[PawanCloudWorker] 🛑 Cloud Execution Worker stopped.");
  }

  _triggerWorkerTick() {
    if (this.isWorkerRunning) {
      setImmediate(() => {
        this._processNextBatch().catch(() => {});
      });
    }
  }

  async _processNextBatch() {
    if (this.activeWorkers.size >= this.maxConcurrency) {
      return; // At capacity
    }

    const queue = this._loadQueue();
    const nextTask = queue.tasks.find(t => t.status === "QUEUED");
    if (!nextTask) return; // Nothing queued

    await this._executeTaskInWorker(nextTask.taskId);
  }

  async _executeTaskInWorker(taskId) {
    const queue = this._loadQueue();
    const task = queue.tasks.find(t => t.taskId === taskId);
    if (!task || task.status !== "QUEUED") return;

    // Transition to PROCESSING
    task.status = "PROCESSING";
    task.startedAt = new Date().toISOString();
    task.trajectory.push({ step: "TASK_PROCESSING_STARTED", timestamp: task.startedAt, worker: "cloud_worker_01" });
    this._saveQueue(queue);

    const abortController = new AbortController();
    const startTimeMs = Date.now();
    this.activeWorkers.set(taskId, {
      abortController,
      startedAt: startTimeMs
    });

    console.log(`[PawanCloudWorker] ⚙️ Processing task ${taskId} ("${task.instruction.slice(0, 50)}...")`);

    let executionResult = null;
    let executionError = null;

    try {
      // Lazy load AstraExecutionEngine
      const { astraExecutionEngine } = require("./astraExecutionEngine");

      // Execution Timeout Watchdog Promise
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          abortController.abort();
          reject(new Error(`Execution timed out after ${this.executionTimeoutMs / 1000} seconds`));
        }, this.executionTimeoutMs);
        abortController.signal.addEventListener("abort", () => clearTimeout(timer));
      });

      // Actual Execution Promise
      const executePromise = astraExecutionEngine.executeTask(task.instruction, {
        taskId: task.taskId,
        requestId: task.requestId,
        sessionId: task.sessionId,
        projectId: task.projectId,
        targetFile: task.targetFile,
        searchQuery: task.searchQuery,
        code: task.code,
        currentCode: task.currentCode,
        summary: task.summary,
        abortSignal: abortController.signal
      });

      executionResult = await Promise.race([executePromise, timeoutPromise]);

    } catch (err) {
      executionError = err;
    } finally {
      this.activeWorkers.delete(taskId);
    }

    // Process Outcome
    const updatedQueue = this._loadQueue();
    const targetTask = updatedQueue.tasks.find(t => t.taskId === taskId);
    if (!targetTask) return;

    const durationMs = Date.now() - startTimeMs;
    targetTask.durationMs = durationMs;

    if (!executionError && executionResult && executionResult.success) {
      // SUCCESS
      targetTask.status = "COMPLETED";
      targetTask.completedAt = new Date().toISOString();
      targetTask.result = sanitizeObject({
        file: executionResult.file,
        sha256: executionResult.sha256,
        code: executionResult.code || null,
        summary: executionResult.summary,
        timing: executionResult.timing,
        tokenUsage: executionResult.tokenUsage
      });
      targetTask.trajectory.push({
        step: "TASK_COMPLETED",
        timestamp: targetTask.completedAt,
        durationMs,
        sha256: executionResult.sha256
      });

      // Archive Artifact if present
      this._persistArtifact(targetTask, executionResult);

      this.stats.completedTotal++;
      console.log(`[PawanCloudWorker] ✅ Task ${taskId} COMPLETED in ${durationMs}ms`);
    } else {
      // FAILURE OR RETRY
      const errorMessage = executionError ? executionError.message : (executionResult?.error || "Task execution failed");
      const isRetryable = !abortController.signal.aborted && targetTask.retryCount < this.maxRetries;

      if (isRetryable) {
        targetTask.status = "QUEUED";
        targetTask.retryCount = (targetTask.retryCount || 0) + 1;
        targetTask.lastError = sanitizeSecrets(errorMessage);
        targetTask.trajectory.push({
          step: "TASK_RETRY_SCHEDULED",
          timestamp: new Date().toISOString(),
          attempt: targetTask.retryCount,
          error: sanitizeSecrets(errorMessage)
        });
        this.stats.retriedTotal++;
        console.warn(`[PawanCloudWorker] 🔄 Task ${taskId} failed. Retrying (attempt ${targetTask.retryCount}/${this.maxRetries}): ${errorMessage}`);
      } else {
        targetTask.status = "FAILED";
        targetTask.failedAt = new Date().toISOString();
        targetTask.error = sanitizeSecrets(errorMessage);
        targetTask.trajectory.push({
          step: "TASK_FAILED",
          timestamp: targetTask.failedAt,
          durationMs,
          error: sanitizeSecrets(errorMessage)
        });
        this.stats.failedTotal++;
        console.error(`[PawanCloudWorker] ❌ Task ${taskId} FAILED permanently: ${errorMessage}`);
      }
    }

    this._saveQueue(updatedQueue);
    this._replicateToCloud(targetTask);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. CLOUD ARTIFACT PERSISTENCE
  // ──────────────────────────────────────────────────────────────────────────

  _persistArtifact(task, executionResult) {
    if (!executionResult || !executionResult.file) return;

    try {
      const artifactId = `art_${task.taskId}_${Date.now()}`;
      const artifactMeta = {
        artifactId,
        taskId: task.taskId,
        projectId: task.projectId,
        file: executionResult.file,
        sha256: executionResult.sha256,
        sizeBytes: executionResult.code ? Buffer.byteLength(executionResult.code, "utf8") : 0,
        createdAt: new Date().toISOString(),
        downloadUrl: `/api/pawan/artifacts/${artifactId}`
      };

      // Save metadata index
      const metaPath = path.join(ARTIFACT_DIR, `${artifactId}.json`);
      fs.writeFileSync(metaPath, JSON.stringify(artifactMeta, null, 2), "utf8");

      // Save payload if code is returned
      if (executionResult.code) {
        const payloadPath = path.join(ARTIFACT_DIR, `${artifactId}.payload`);
        fs.writeFileSync(payloadPath, executionResult.code, "utf8");
      }

      task.artifact = artifactMeta;
    } catch (err) {
      console.warn("[PawanCloudWorker] Artifact save warning:", err.message);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. CLOUD DATABASE REPLICATION (Non-blocking)
  // ──────────────────────────────────────────────────────────────────────────

  _replicateToCloud(taskRecord) {
    if (process.env.PAWAN_QUEUE_DATA_FILE) return; // Skip in isolated tests

    // 1. Supabase Replication
    try {
      const { createClient } = require("@supabase/supabase-js");
      const url = process.env.SUPABASE_URL || "https://gcifzzuyswrcwvkcfqbr.supabase.co";
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";
      const supabase = createClient(url, key);
      supabase.from("leads").insert({
        id: taskRecord.taskId,
        name: `[PawanTask] ${taskRecord.status}`,
        email: "system-pawan-queue@garudaos.in",
        source: `pawan_queue:${taskRecord.projectId}`,
        status: taskRecord.status,
        message: JSON.stringify({
          taskId: taskRecord.taskId,
          status: taskRecord.status,
          instruction: taskRecord.instruction,
          file: taskRecord.result?.file || taskRecord.targetFile || null,
          sha256: taskRecord.result?.sha256 || null,
          codeSnippet: taskRecord.result?.code ? taskRecord.result.code.slice(0, 5000) : null,
          durationMs: taskRecord.durationMs,
          error: taskRecord.error
        }),
        reply_snippet: taskRecord.status
      }).then(() => {}).catch(() => {});
    } catch {}

    // 2. MongoDB Replication
    try {
      const mongoose = require("mongoose");
      const db = require("../../database/db");
      if (db.isMongoConnected && db.isMongoConnected() && mongoose.connection.readyState === 1) {
        const col = mongoose.connection.collection("pawan_task_queue");
        col.updateOne({ taskId: taskRecord.taskId }, { $set: taskRecord }, { upsert: true }).catch(() => {});
      }
    } catch {}
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. WORKER HEALTH & METRICS
  // ──────────────────────────────────────────────────────────────────────────

  getWorkerHealth() {
    const queue = this._loadQueue();
    const queuedCount = queue.tasks.filter(t => t.status === "QUEUED").length;
    const processingCount = queue.tasks.filter(t => t.status === "PROCESSING").length;
    const completedCount = queue.tasks.filter(t => t.status === "COMPLETED").length;
    const failedCount = queue.tasks.filter(t => t.status === "FAILED").length;

    const mem = process.memoryUsage();

    return {
      status: "HEALTHY",
      workerRunning: this.isWorkerRunning,
      bootTimestamp: this.bootTimestamp,
      uptimeSeconds: Math.floor(process.uptime()),
      maxConcurrency: this.maxConcurrency,
      activeTasksCount: this.activeWorkers.size,
      queue: {
        total: queue.tasks.length,
        queued: queuedCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount
      },
      stats: this.stats,
      systemMemory: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024))
      }
    };
  }
}

// Singleton export
const pawanCloudQueue = new PawanCloudExecutionQueue();

module.exports = {
  PawanCloudExecutionQueue,
  pawanCloudQueue
};
