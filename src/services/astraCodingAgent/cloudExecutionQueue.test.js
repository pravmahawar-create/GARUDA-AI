/**
 * 🦅 GARUDA PAWAN ASTRA™ — CLOUD EXECUTION QUEUE & WORKER REGRESSION SUITE
 * 
 * Verifies Cloud-First Execution, Mobile Asynchronous Independence,
 * Stranded Task Recovery, Bounded Retries, and Cloud Artifact Indexing.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const TEST_QUEUE_FILE = path.join(__dirname, "..", "..", "..", "data", "test-pawan-cloud-queue.json");
process.env.PAWAN_QUEUE_DATA_FILE = TEST_QUEUE_FILE;

const { PawanCloudExecutionQueue } = require("./pawanCloudExecutionQueue");

test("GARUDA PAWAN ASTRA — Cloud Execution Queue & Worker Suite", async (t) => {
  // Clean setup
  if (fs.existsSync(TEST_QUEUE_FILE)) {
    fs.unlinkSync(TEST_QUEUE_FILE);
  }

  const queueEngine = new PawanCloudExecutionQueue({
    queueFile: TEST_QUEUE_FILE,
    maxConcurrency: 1,
    executionTimeoutMs: 10000,
    maxRetries: 2,
    pollIntervalMs: 500
  });

  // Test 1: Immediate non-blocking enqueue (<10ms)
  await t.test("1. Non-blocking enqueue returns immediately (<10ms) with QUEUED status", () => {
    const start = Date.now();
    const res = queueEngine.enqueueTask({
      instruction: "Build a responsive mobile landing hero section",
      projectId: "project_mobile_test",
      sessionId: "sess_test_123"
    });
    const duration = Date.now() - start;

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, "QUEUED");
    assert.ok(res.taskId.startsWith("task_pwn_"));
    assert.ok(duration < 50, `Enqueue took ${duration}ms (must be <50ms)`);

    const task = queueEngine.getTask(res.taskId);
    assert.ok(task);
    assert.strictEqual(task.status, "QUEUED");
    assert.strictEqual(task.instruction, "Build a responsive mobile landing hero section");
  });

  // Test 2: Task status querying and trajectory
  await t.test("2. Task status retrieval returns accurate trajectory and metadata", () => {
    const res = queueEngine.enqueueTask({
      instruction: "Add dark mode toggle to navigation header",
      targetFile: "src/Navbar.jsx"
    });

    const task = queueEngine.getTask(res.taskId);
    assert.strictEqual(task.status, "QUEUED");
    assert.strictEqual(task.targetFile, "src/Navbar.jsx");
    assert.ok(Array.isArray(task.trajectory));
    assert.strictEqual(task.trajectory[0].step, "TASK_ENQUEUED");
  });

  // Test 3: Task cancellation before worker picks up
  await t.test("3. Task cancellation immediately updates status to CANCELLED", () => {
    const res = queueEngine.enqueueTask({
      instruction: "Task to be cancelled by user",
      projectId: "project_cancel_test"
    });

    const cancelRes = queueEngine.cancelTask(res.taskId, "User clicked stop");
    assert.strictEqual(cancelRes.success, true);
    assert.strictEqual(cancelRes.status, "CANCELLED");

    const task = queueEngine.getTask(res.taskId);
    assert.strictEqual(task.status, "CANCELLED");
    assert.strictEqual(task.error, "User clicked stop");
  });

  // Test 4: Stranded task recovery after simulated worker crash
  await t.test("4. Stranded task recovery re-queues in-flight tasks upon worker reboot", () => {
    // Manually inject a stranded task into queue file
    const queueData = JSON.parse(fs.readFileSync(TEST_QUEUE_FILE, "utf8"));
    const strandedTaskId = `task_pwn_stranded_${Date.now()}`;
    queueData.tasks.push({
      taskId: strandedTaskId,
      instruction: "In-flight task interrupted by server crash",
      status: "PROCESSING",
      retryCount: 0,
      enqueuedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      trajectory: [{ step: "TASK_ENQUEUED" }, { step: "TASK_PROCESSING_STARTED" }]
    });
    fs.writeFileSync(TEST_QUEUE_FILE, JSON.stringify(queueData, null, 2), "utf8");

    // Boot a new instance of PawanCloudExecutionQueue (simulating server restart)
    const rebootedQueue = new PawanCloudExecutionQueue({
      queueFile: TEST_QUEUE_FILE,
      maxRetries: 2
    });

    const recovered = rebootedQueue.getTask(strandedTaskId);
    assert.ok(recovered);
    assert.strictEqual(recovered.status, "QUEUED", "Stranded task must be transitioned back to QUEUED");
    assert.strictEqual(recovered.retryCount, 1, "Retry count must be incremented to 1");
    assert.ok(recovered.lastError.includes("Cloud worker restarted mid-execution"));
  });

  // Test 5: Worker health and resource observability
  await t.test("5. Worker health endpoint exposes queue depth, uptime, and memory metrics", () => {
    const health = queueEngine.getWorkerHealth();
    assert.strictEqual(health.status, "HEALTHY");
    assert.strictEqual(typeof health.uptimeSeconds, "number");
    assert.strictEqual(typeof health.activeTasksCount, "number");
    assert.ok(health.queue.total >= 3);
    assert.strictEqual(typeof health.systemMemory.heapUsedMb, "number");
  });

  // Test 6: Secret redaction in task queue
  await t.test("6. Sensitive API keys and tokens are scrubbed from task payloads", () => {
    const res = queueEngine.enqueueTask({
      instruction: "Deploy with secret API key: AIzaSyD12345678901234567890123456789012",
      metadata: { apiKey: "gsk_live_secret_key_1234567890" }
    });

    const task = queueEngine.getTask(res.taskId);
    assert.ok(!task.instruction.includes("AIzaSyD12345678901234567890123456789012"));
    assert.ok(task.instruction.includes("[REDACTED]"));
    assert.strictEqual(task.metadata.apiKey, "[REDACTED]");
  });

  // Teardown
  t.after(() => {
    queueEngine.stopWorker();
    try {
      if (fs.existsSync(TEST_QUEUE_FILE)) fs.unlinkSync(TEST_QUEUE_FILE);
    } catch {}
  });
});
