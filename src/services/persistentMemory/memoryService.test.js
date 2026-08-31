const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createExperience, createLesson, generateMemoryId } = require("./memorySchema");
const { logExperience, logExperiences, readExperiences, readExperiencesByGoal, getExperienceStats, clearExperiences } = require("./experienceLogger");
const { searchExperiences, getRecentExperiences, getFailedExperiences, getSuccessfulExperiences } = require("./memorySearch");
const { extractLessonsFromGoal, extractLessonsFromExperiences, saveLesson, readLessons, searchLessons, clearLessons } = require("./lessonExtractor");
const memoryService = require("./memoryService");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(() => { passed++; console.log(`  ok  ${name}`); }).catch((err) => { failed++; console.log(`  xx  ${name}: ${err.message}`); });
    }
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  xx  ${name}: ${err.message}`);
  }
}

function cleanup() {
  clearExperiences();
  clearLessons();
}

async function main() {
  console.log("\n=== Persistent Memory System Tests ===\n");

  cleanup();

  console.log("--- Memory Schema ---");
  await test("createExperience creates valid experience", () => {
    const exp = createExperience({ type: "test", action: "ran tests", outcome: "success" });
    assert.ok(exp.id, "Should have id");
    assert.strictEqual(exp.type, "test");
    assert.strictEqual(exp.outcome, "success");
    assert.ok(exp.timestamp, "Should have timestamp");
  });

  await test("createLesson creates valid lesson", () => {
    const lesson = createLesson({ lesson: "eval is dangerous", confidence: 0.9 });
    assert.ok(lesson.id, "Should have id");
    assert.strictEqual(lesson.lesson, "eval is dangerous");
    assert.strictEqual(lesson.confidence, 0.9);
    assert.strictEqual(lesson.timesApplied, 0);
  });

  await test("generateMemoryId creates unique ids", () => {
    const id1 = generateMemoryId();
    const id2 = generateMemoryId();
    assert.ok(id1 !== id2, "Ids should be unique");
    assert.ok(id1.startsWith("mem-"), "Should start with mem-");
  });

  console.log("\n--- Experience Logger ---");
  await test("logExperience writes and reads", () => {
    const exp = logExperience({ type: "test", action: "build", outcome: "success" });
    assert.ok(exp.id, "Should return experience with id");
    const all = readExperiences(100);
    assert.ok(all.length > 0, "Should have experiences");
  });

  await test("logExperiences writes multiple", () => {
    clearExperiences();
    const exps = logExperiences([
      { type: "test", action: "a", outcome: "success" },
      { type: "test", action: "b", outcome: "failure" }
    ]);
    assert.strictEqual(exps.length, 2);
    const all = readExperiences(100);
    assert.strictEqual(all.length, 2);
  });

  await test("readExperiencesByGoal filters", () => {
    clearExperiences();
    logExperience({ type: "test", goalId: "g1", outcome: "success" });
    logExperience({ type: "test", goalId: "g2", outcome: "success" });
    const filtered = readExperiencesByGoal("g1");
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].goalId, "g1");
  });

  await test("getExperienceStats counts", () => {
    clearExperiences();
    logExperience({ type: "bugfix", outcome: "success" });
    logExperience({ type: "feature", outcome: "failure" });
    const stats = getExperienceStats();
    assert.strictEqual(stats.total, 2);
    assert.strictEqual(stats.byType.bugfix, 1);
    assert.strictEqual(stats.byOutcome.success, 1);
  });

  console.log("\n--- Memory Search ---");
  await test("searchExperiences finds by query", () => {
    clearExperiences();
    logExperience({ type: "test", action: "deploy production", outcome: "success" });
    logExperience({ type: "test", action: "run tests", outcome: "success" });
    const results = searchExperiences("deploy");
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].action.includes("deploy"));
  });

  await test("searchExperiences filters by outcome", () => {
    clearExperiences();
    logExperience({ type: "test", action: "a", outcome: "success" });
    logExperience({ type: "test", action: "b", outcome: "failure" });
    const results = searchExperiences("", { outcome: "failure" });
    assert.strictEqual(results.length, 1);
  });

  await test("getFailedExperiences returns failures", () => {
    clearExperiences();
    logExperience({ type: "test", action: "a", outcome: "success" });
    logExperience({ type: "test", action: "b", outcome: "failure", error: "boom" });
    const failures = getFailedExperiences();
    assert.ok(failures.length >= 1);
  });

  console.log("\n--- Lesson Extractor ---");
  await test("extractLessonsFromGoal creates lessons", () => {
    clearExperiences();
    logExperience({ type: "test", goalId: "g1", action: "deploy", outcome: "failure", error: "port in use" });
    logExperience({ type: "test", goalId: "g1", action: "deploy", outcome: "failure", error: "port in use" });
    const lessons = extractLessonsFromGoal("g1");
    assert.ok(lessons.length > 0, "Should extract lessons");
  });

  await test("extractLessonsFromExperiences finds recurring errors", () => {
    const exps = [
      { error: "timeout exceeded", tags: ["network"] },
      { error: "timeout exceeded", tags: ["network"] },
      { error: "timeout exceeded", tags: ["network"] }
    ];
    const lessons = extractLessonsFromExperiences(exps);
    assert.ok(lessons.length > 0, "Should find recurring error");
    assert.ok(lessons[0].confidence > 0.5, "Confidence should increase with count");
  });

  await test("saveLesson and readLessons roundtrip", () => {
    clearLessons();
    const lesson = saveLesson(createLesson({ lesson: "test lesson", confidence: 0.8 }));
    assert.ok(lesson.id);
    const all = readLessons(100);
    assert.ok(all.length > 0);
  });

  await test("searchLessons finds by query", () => {
    clearLessons();
    saveLesson(createLesson({ lesson: "eval is dangerous", tags: ["security"] }));
    saveLesson(createLesson({ lesson: "use let instead of var", tags: ["style"] }));
    const results = searchLessons("eval");
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].lesson.includes("eval"));
  });

  console.log("\n--- Memory Service (Facade) ---");
  await test("remember and recall work", () => {
    memoryService.wipeMemory();
    memoryService.remember({ type: "test", action: "hello", outcome: "success" });
    const results = memoryService.recall({ query: "hello" });
    assert.ok(results.length > 0);
  });

  await test("rememberMultiple works", () => {
    memoryService.wipeMemory();
    memoryService.rememberMultiple([
      { type: "test", action: "a", outcome: "success" },
      { type: "test", action: "b", outcome: "failure" }
    ]);
    const stats = memoryService.getStats();
    assert.strictEqual(stats.experiences.total, 2);
  });

  await test("learnFromGoal extracts and saves lessons", () => {
    memoryService.wipeMemory();
    memoryService.remember({ type: "test", goalId: "g1", action: "fail", outcome: "failure", error: "oops" });
    memoryService.remember({ type: "test", goalId: "g1", action: "fail", outcome: "failure", error: "oops" });
    const lessons = memoryService.learnFromGoal("g1");
    assert.ok(lessons.length > 0, "Should extract lessons");
  });

  await test("getWisdom searches lessons", () => {
    memoryService.wipeMemory();
    memoryService.remember({ type: "test", goalId: "g1", action: "fail", outcome: "failure", error: "timeout" });
    memoryService.remember({ type: "test", goalId: "g1", action: "fail", outcome: "failure", error: "timeout" });
    memoryService.learnFromGoal("g1");
    const wisdom = memoryService.getWisdom("timeout");
    assert.ok(wisdom.length > 0);
  });

  await test("getStats returns combined stats", () => {
    memoryService.wipeMemory();
    memoryService.remember({ type: "test", action: "x", outcome: "success" });
    const stats = memoryService.getStats();
    assert.ok(stats.experiences.total >= 1);
    assert.ok(typeof stats.totalMemories === "number");
  });

  await test("wipeMemory clears everything", () => {
    memoryService.remember({ type: "test", action: "x", outcome: "success" });
    memoryService.wipeMemory();
    const stats = memoryService.getStats();
    assert.strictEqual(stats.experiences.total, 0);
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  cleanup();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  cleanup();
  process.exit(1);
});
