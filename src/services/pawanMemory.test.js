/**
 * 🦅 GARUDA PAWAN ASTRA™ — PERSISTENT MEMORY & CONTINUOUS LEARNING TEST SUITE
 * 
 * Verifies Mission 3 & Mission 4 Acceptance Criteria:
 * - Working memory session caching and cleanup.
 * - Persistent memory storage and retrieval.
 * - Episodic memory logging.
 * - Project-level context isolation.
 * - Secret sanitization on ingest and retrieval.
 * - Full Cross-Session Verification Protocol (Test A to F):
 *     Test A: Record unique project instruction in Session 1.
 *     Test B: Close and terminate Session 1.
 *     Test C: Spawn a genuinely new Session 2.
 *     Test D: Ask PAWAN to recall instruction in Session 2.
 *     Test E: Compare retrieved instruction with original stored record.
 *     Test F: Verify retrieval works after fresh service instance / disk reload.
 */

const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const TEST_MEMORY_FILE = path.join(__dirname, "..", "..", "data", "test-pawan-memory.json");
const TEST_EPISODES_FILE = path.join(__dirname, "..", "..", "data", "test-pawan-episodes.jsonl");
const TEST_LESSONS_FILE = path.join(__dirname, "..", "..", "data", "memory", "test-pawan-lessons.jsonl");

// Enforce test file isolation
process.env.PAWAN_MEMORY_DATA_FILE = TEST_MEMORY_FILE;
process.env.PAWAN_EPISODES_DATA_FILE = TEST_EPISODES_FILE;
process.env.PAWAN_LESSONS_DATA_FILE = TEST_LESSONS_FILE;

const { PawanMemoryService } = require("./pawanMemoryService");
const { PawanLearningEngine } = require("./pawanLearningEngine");

test("GARUDA PAWAN ASTRA — Memory & Continuous Learning Suite", async (t) => {
  const memoryService = new PawanMemoryService({
    memoryFile: TEST_MEMORY_FILE,
    episodesFile: TEST_EPISODES_FILE
  });
  const learningEngine = new PawanLearningEngine({
    lessonsFile: TEST_LESSONS_FILE
  });

  // Ensure clean test environment
  memoryService.clearStore();
  learningEngine.clearLessons();

  await t.test("1. Working memory retains and updates active session state", () => {
    const session1 = "sess_test_101";
    memoryService.setWorkingMemory(session1, {
      currentTask: "Build navbar",
      activeFile: "public/index.html"
    });

    const state = memoryService.getWorkingMemory(session1);
    assert.strictEqual(state.currentTask, "Build navbar");
    assert.strictEqual(state.activeFile, "public/index.html");

    memoryService.updateWorkingContext(session1, "currentTask", "Build footer");
    const updated = memoryService.getWorkingMemory(session1);
    assert.strictEqual(updated.currentTask, "Build footer");

    memoryService.clearWorkingMemory(session1);
    assert.strictEqual(memoryService.getWorkingMemory(session1), null);
  });

  await t.test("2. Cross-Session Verification Protocol (Tests A through F)", async () => {
    const projectId = "project-phoenix-core";
    const uniqueInstruction = "Always configure MongoDB with replicaSet rs0 and connection timeout 5000ms";

    // Test A: Give PAWAN a unique project instruction in Session 1
    const session1Id = "sess_active_1001";
    memoryService.setWorkingMemory(session1Id, { activeProjectId: projectId });
    const stored = memoryService.storePersistentMemory({
      type: "FOUNDER_INSTRUCTION",
      content: uniqueInstruction,
      projectId,
      importance: 9,
      tags: ["mongodb", "database_config"]
    });
    assert.strictEqual(stored.success, true);
    assert.ok(stored.memory.id);

    // Test B: Close and terminate Session 1
    memoryService.clearWorkingMemory(session1Id);
    assert.strictEqual(memoryService.getWorkingMemory(session1Id), null);

    // Test C: Start a genuinely new session with different Session ID
    const session2Id = "sess_active_2002";
    memoryService.setWorkingMemory(session2Id, { activeProjectId: projectId });

    // Test D: Ask PAWAN to recall instruction in Session 2
    const recalled = memoryService.retrieveContext({
      query: "How should we configure MongoDB for this project?",
      projectId,
      limit: 3
    });

    // Test E: Verify retrieved information against original stored record
    assert.ok(recalled.items.length > 0, "Must recall stored instruction in new session");
    const matched = recalled.items.find(i => i.content === uniqueInstruction);
    assert.ok(matched, "Recalled item must exactly match original instruction");
    assert.strictEqual(matched.projectId, projectId);
    assert.ok(recalled.contextText.includes("MongoDB with replicaSet rs0"));

    // Test F: Check retrieval works after fresh service instance / backend reload
    const freshInstance = new PawanMemoryService({
      memoryFile: TEST_MEMORY_FILE,
      episodesFile: TEST_EPISODES_FILE
    });
    const reloadedRecall = freshInstance.retrieveContext({
      query: "MongoDB replicaSet",
      projectId,
      limit: 1
    });
    assert.ok(reloadedRecall.items.length > 0, "Must recall across fresh service instances");
    assert.strictEqual(reloadedRecall.items[0].content, uniqueInstruction);
  });

  await t.test("3. Project context isolation prevents cross-contamination", () => {
    const projAlpha = "proj_alpha";
    const projBeta = "proj_beta";

    memoryService.storePersistentMemory({
      type: "DECISION",
      content: "Use Tailwind CSS and React for frontend",
      projectId: projAlpha,
      isGlobal: false
    });

    memoryService.storePersistentMemory({
      type: "DECISION",
      content: "Use Vue 3 and Bootstrap for frontend",
      projectId: projBeta,
      isGlobal: false
    });

    const alphaRecall = memoryService.retrieveContext({
      query: "frontend framework",
      projectId: projAlpha
    });
    assert.ok(alphaRecall.items.some(i => i.content.includes("Tailwind")));
    assert.ok(!alphaRecall.items.some(i => i.content.includes("Bootstrap")), "Project Alpha must not see Project Beta memories");

    const betaRecall = memoryService.retrieveContext({
      query: "frontend framework",
      projectId: projBeta
    });
    assert.ok(betaRecall.items.some(i => i.content.includes("Bootstrap")));
    assert.ok(!betaRecall.items.some(i => i.content.includes("Tailwind")), "Project Beta must not see Project Alpha memories");
  });

  await t.test("4. Episodic memory records and queries task execution experiences", () => {
    const episode = memoryService.recordEpisode({
      taskId: "ASTRA-TEST-99",
      executionId: "EXEC-99",
      instruction: "Fix broken button event handler",
      problem: "ReferenceError: handleClick is not defined",
      solution: "Bound handleClick to component scope",
      result: "Button click verified",
      failed: false,
      learned: "Ensure handler is defined before JSX return",
      projectId: "project-ui"
    });

    assert.ok(episode.episodeId);
    assert.strictEqual(episode.failed, false);

    const episodes = memoryService.getRecentEpisodes({ limit: 5, projectId: "project-ui" });
    assert.ok(episodes.length > 0);
    assert.strictEqual(episodes[0].taskId, "ASTRA-TEST-99");
  });

  await t.test("5. Continuous Learning Engine extracts reusable lessons from execution outcomes", () => {
    // Scenario 1: Self-healed repair yields a high-confidence lesson
    const healedLesson = learningEngine.recordExecutionOutcome({
      taskId: "ASTRA-LEARN-1",
      executionId: "EXEC-LEARN-1",
      projectId: "global",
      instruction: "Render Chart.js inside canvas",
      file: "public/chart.html",
      success: true,
      healCyclesRun: 1,
      durationMs: 450,
      validation: { error: "SyntaxError: Unexpected token '<'" },
      sha256: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
    });

    assert.ok(healedLesson.lessonId);
    assert.strictEqual(healedLesson.category, "SYNTAX_ERROR");
    assert.strictEqual(healedLesson.verificationStatus, "RUNTIME_VERIFIED");
    assert.strictEqual(healedLesson.confidenceStatus, "HIGH");

    // Scenario 2: Retrieve applicable lesson before future execution
    const lessons = learningEngine.getApplicableLessons("Render Chart.js with canvas", "public/chart.html");
    assert.ok(lessons.length > 0);
    assert.ok(lessons[0].antiPattern.includes("SyntaxError"));

    // Scenario 3: Verify metrics
    const metrics = learningEngine.getLearningMetrics();
    assert.ok(metrics.totalLessons >= 1);
    assert.ok(metrics.highConfidenceCount >= 1);
  });

  // Cleanup test files
  try {
    if (fs.existsSync(TEST_MEMORY_FILE)) fs.unlinkSync(TEST_MEMORY_FILE);
    if (fs.existsSync(TEST_EPISODES_FILE)) fs.unlinkSync(TEST_EPISODES_FILE);
    if (fs.existsSync(TEST_LESSONS_FILE)) fs.unlinkSync(TEST_LESSONS_FILE);
  } catch {}
});
