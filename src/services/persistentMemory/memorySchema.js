const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MEMORY_DIR = path.join(process.cwd(), "data", "memory");
const EXPERIENCES_FILE = path.join(MEMORY_DIR, "experiences.jsonl");
const LESSONS_FILE = path.join(MEMORY_DIR, "lessons.jsonl");

function ensureMemoryDir() {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

function createExperience(input) {
  return {
    id: generateMemoryId(),
    timestamp: new Date().toISOString(),
    type: input.type || "general",
    goalId: input.goalId || null,
    stepId: input.stepId || null,
    action: input.action || "",
    input: input.input || null,
    output: input.output || null,
    outcome: input.outcome || "unknown",
    error: input.error || null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    context: input.context || {},
    duration: input.duration || null
  };
}

function createLesson(input) {
  return {
    id: generateMemoryId(),
    timestamp: new Date().toISOString(),
    experienceId: input.experienceId || null,
    goalId: input.goalId || null,
    type: input.type || "general",
    lesson: input.lesson || "",
    pattern: input.pattern || "",
    confidence: typeof input.confidence === "number" ? input.confidence : 0.5,
    timesApplied: 0,
    lastApplied: null,
    tags: Array.isArray(input.tags) ? input.tags : []
  };
}

function generateMemoryId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString("hex");
  return `mem-${ts}-${rand}`;
}

module.exports = {
  createExperience, createLesson, generateMemoryId,
  ensureMemoryDir, MEMORY_DIR, EXPERIENCES_FILE, LESSONS_FILE
};
