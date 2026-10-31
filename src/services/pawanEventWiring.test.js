/**
 * 🦅 GARUDA PAWAN ASTRA™ — EVENT NERVOUS SYSTEM WIRING TEST
 * 
 * Verifies Universe 04 Events:
 * - PAWAN_TASK_STARTED
 * - PAWAN_TASK_COMPLETED
 * - PAWAN_TASK_FAILED
 * - PAWAN_SELF_HEAL_CYCLE
 * - PAWAN_ARTIFACT_GENERATED
 * - PAWAN_MEMORY_CREATED
 * - PAWAN_LEARNING_RECORDED
 * - Event cryptographic SHA-256 integrity seal
 * - Safe Idempotency deduplication
 */

const test = require("node:test");
const assert = require("node:assert");
const { garudaEventService } = require("./garudaEventService");
const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");

test("GARUDA PAWAN ASTRA — Event Nervous System Wiring Suite", async (t) => {
  await t.test("1. Universe 04 Event constants are properly registered", () => {
    assert.strictEqual(GARUDA_EVENT_TYPES.PAWAN_TASK_STARTED, "PAWAN_TASK_STARTED");
    assert.strictEqual(GARUDA_EVENT_TYPES.PAWAN_TASK_COMPLETED, "PAWAN_TASK_COMPLETED");
    assert.strictEqual(GARUDA_EVENT_TYPES.PAWAN_TASK_FAILED, "PAWAN_TASK_FAILED");
    assert.strictEqual(GARUDA_EVENT_TYPES.PAWAN_SELF_HEAL_CYCLE, "PAWAN_SELF_HEAL_CYCLE");
    assert.strictEqual(GARUDA_EVENT_TYPES.PAWAN_ARTIFACT_GENERATED, "PAWAN_ARTIFACT_GENERATED");
    assert.strictEqual(GARUDA_EVENT_TYPES.PAWAN_MEMORY_CREATED, "PAWAN_MEMORY_CREATED");
    assert.strictEqual(GARUDA_EVENT_TYPES.PAWAN_LEARNING_RECORDED, "PAWAN_LEARNING_RECORDED");

    assert.strictEqual(GARUDA_ENTITY_TYPES.PAWAN_TASK, "pawan_task");
    assert.strictEqual(GARUDA_ENTITY_TYPES.PAWAN_ARTIFACT, "pawan_artifact");
    assert.strictEqual(GARUDA_ENTITY_TYPES.PAWAN_MEMORY, "pawan_memory");
    assert.strictEqual(GARUDA_ENTITY_TYPES.PAWAN_LESSON, "pawan_lesson");
  });

  await t.test("2. Event dispatch produces immutable envelope with cryptographic SHA-256 seal", async () => {
    const taskId = `task_test_evt_${Date.now()}`;
    const result = await garudaEventService.emitEvent({
      eventType: GARUDA_EVENT_TYPES.PAWAN_TASK_STARTED,
      entityType: GARUDA_ENTITY_TYPES.PAWAN_TASK,
      entityId: taskId,
      projectId: "test_project",
      source: "unit_test_wiring",
      metadata: { instruction: "Test event dispatch" }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.alreadyProcessed, false);
    assert.ok(result.event.eventHash, "Event must have eventHash");
    assert.strictEqual(result.event.eventHash.length, 64, "Seal must be 64-char SHA-256 hex");
    assert.strictEqual(result.event.eventType, "PAWAN_TASK_STARTED");
    assert.strictEqual(result.event.entityType, "pawan_task");
  });

  await t.test("3. Idempotency key prevents duplicate event emission", async () => {
    const uniqueKey = `idemp_pawan_${Date.now()}`;
    const firstCall = await garudaEventService.emitEvent({
      eventType: GARUDA_EVENT_TYPES.PAWAN_TASK_COMPLETED,
      entityType: GARUDA_ENTITY_TYPES.PAWAN_TASK,
      entityId: "task_idemp_1",
      idempotencyKey: uniqueKey,
      source: "unit_test_wiring",
      metadata: { durationMs: 120 }
    });

    assert.strictEqual(firstCall.success, true);
    assert.strictEqual(firstCall.alreadyProcessed, false);

    const secondCall = await garudaEventService.emitEvent({
      eventType: GARUDA_EVENT_TYPES.PAWAN_TASK_COMPLETED,
      entityType: GARUDA_ENTITY_TYPES.PAWAN_TASK,
      entityId: "task_idemp_1",
      idempotencyKey: uniqueKey,
      source: "unit_test_wiring",
      metadata: { durationMs: 120 }
    });

    assert.strictEqual(secondCall.success, true);
    assert.strictEqual(secondCall.alreadyProcessed, true, "Second call must be marked alreadyProcessed");
    assert.strictEqual(secondCall.event.eventId, firstCall.event.eventId, "Event ID must match cached event");
  });
});
