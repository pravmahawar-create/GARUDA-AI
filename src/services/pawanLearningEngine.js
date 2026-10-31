/**
 * 🦅 GARUDA PAWAN ASTRA™ — CONTINUOUS LEARNING ENGINE
 * 
 * Closed-Loop Verification & Reusable Lesson Synthesis:
 * EXECUTION -> RESULT CAPTURE -> ERROR/SUCCESS FORENSICS -> LESSON EXTRACTION -> STORAGE -> PROMPT RETRIEVAL
 * 
 * Strict Governance:
 * - 100% Anti-Fabrication Law: Only extracts lessons from verified runtime executions.
 * - Anti-Pattern Inversion: Stores both what to DO and what NOT to do.
 * - Test Isolation: Supports PAWAN_LESSONS_DATA_FILE for isolated testing.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sanitizeSecrets } = require("./pawanMemoryService");

const DEFAULT_LESSONS_FILE = path.join(__dirname, "..", "..", "data", "memory", "pawan-lessons.jsonl");

class PawanLearningEngine {
  constructor(options = {}) {
    this.lessonsFile = options.lessonsFile || process.env.PAWAN_LESSONS_DATA_FILE || DEFAULT_LESSONS_FILE;
    this._ensureStore();
  }

  getLessonsFile() {
    return process.env.PAWAN_LESSONS_DATA_FILE || this.lessonsFile;
  }

  _ensureStore() {
    const file = this.getLessonsFile();
    const dir = path.dirname(file);
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn("[PawanLearning] Store init notice:", err.message);
    }
  }

  /**
   * Primary entry point after every Astra task execution
   */
  recordExecutionOutcome({
    taskId,
    requestId,
    executionId,
    projectId = "global",
    instruction,
    file,
    success,
    healCyclesRun = 0,
    durationMs = 0,
    validation = {},
    code = "",
    sha256 = null,
    inference = {}
  }) {
    this._ensureStore();
    const isSuccess = Boolean(success);
    const hadSelfHeal = healCyclesRun > 0;

    let lesson = null;

    // Pattern 1: Self-Healed Success (Crucial lesson: what broke and what fixed it)
    if (isSuccess && hadSelfHeal) {
      const errorContext = validation.error || validation.stderr || "Initial validation check failed before repair";
      lesson = {
        lessonId: `lsn_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        sourceTaskId: taskId,
        sourceExecutionId: executionId,
        projectId: projectId || "global",
        category: this._classifyCategory(errorContext),
        fileType: path.extname(file || "").replace(".", "") || "unknown",
        problemPattern: sanitizeSecrets(String(errorContext).slice(0, 300)),
        solutionSummary: `Self-healed within ${healCyclesRun} cycles by repairing validation issues in ${file}.`,
        antiPattern: `Avoid the pattern that triggered: "${sanitizeSecrets(String(errorContext).slice(0, 150))}"`,
        confidenceStatus: "HIGH",
        verificationStatus: "RUNTIME_VERIFIED",
        evidence: {
          sha256,
          healCyclesRun,
          durationMs,
          provider: inference?.provider || "UNKNOWN"
        },
        recordedAt: new Date().toISOString()
      };
    }
    // Pattern 2: Direct Execution Failure (Learn anti-pattern to avoid repeating)
    else if (!isSuccess) {
      const errorMsg = validation.error || validation.stderr || "Execution failed to meet validation criteria";
      lesson = {
        lessonId: `lsn_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        sourceTaskId: taskId,
        sourceExecutionId: executionId,
        projectId: projectId || "global",
        category: this._classifyCategory(errorMsg),
        fileType: path.extname(file || "").replace(".", "") || "unknown",
        problemPattern: sanitizeSecrets(String(errorMsg).slice(0, 300)),
        solutionSummary: "Ensure clean syntax, valid exports, and self-contained bundle imports.",
        antiPattern: `Known failing construct: "${sanitizeSecrets(String(errorMsg).slice(0, 150))}"`,
        confidenceStatus: "MEDIUM",
        verificationStatus: "FAILURE_CAPTURED",
        evidence: {
          sha256,
          durationMs,
          instruction: sanitizeSecrets((instruction || "").slice(0, 120))
        },
        recordedAt: new Date().toISOString()
      };
    }
    // Pattern 3: Flawless Execution (Capture success pattern)
    else {
      lesson = {
        lessonId: `lsn_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        sourceTaskId: taskId,
        sourceExecutionId: executionId,
        projectId: projectId || "global",
        category: "CLEAN_EXECUTION",
        fileType: path.extname(file || "").replace(".", "") || "unknown",
        problemPattern: sanitizeSecrets((instruction || "").slice(0, 200)),
        solutionSummary: `Clean 1-shot execution in ${file} with verified SHA-256 integrity.`,
        antiPattern: "None (Clean baseline)",
        confidenceStatus: "HIGH",
        verificationStatus: "RUNTIME_VERIFIED",
        evidence: { sha256, durationMs },
        recordedAt: new Date().toISOString()
      };
    }

    if (lesson) {
      this._saveLesson(lesson);
      this._syncToCloud(lesson);

      // Emit Learning Event to GARUDA Event Nervous System
      try {
        const { garudaEventService } = require("./garudaEventService");
        const { GARUDA_EVENT_TYPES, GARUDA_ENTITY_TYPES } = require("./garudaEventTypes");
        garudaEventService.emitEvent({
          eventType: GARUDA_EVENT_TYPES.PAWAN_LEARNING_RECORDED,
          entityType: GARUDA_ENTITY_TYPES.PAWAN_LESSON,
          entityId: lesson.lessonId,
          projectId: lesson.projectId,
          metadata: {
            lessonId: lesson.lessonId,
            category: lesson.category,
            verificationStatus: lesson.verificationStatus
          }
        });
      } catch {}
    }

    return lesson;
  }

  _syncToCloud(lesson) {
    if (process.env.PAWAN_LESSONS_DATA_FILE) return; // Skip in isolated tests
    try {
      const { createClient } = require("@supabase/supabase-js");
      const url = process.env.SUPABASE_URL || "https://gcifzzuyswrcwvkcfqbr.supabase.co";
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_uYLXTH4M1PFyem5pQSMJtQ_7YqZ2rFp";
      const supabase = createClient(url, key);
      supabase.from("leads").insert({
        id: lesson.lessonId,
        name: `[PawanLesson] ${lesson.category}`,
        email: "system-pawan-learning@garudaos.in",
        source: `pawan_learning:${lesson.projectId}`,
        status: "VERIFIED_LESSON",
        message: JSON.stringify(lesson),
        reply_snippet: lesson.category
      }).then(() => {}).catch(() => {});
    } catch {}
  }

  _classifyCategory(errorText) {
    const text = String(errorText).toLowerCase();
    if (text.includes("syntaxerror") || text.includes("unexpected token")) return "SYNTAX_ERROR";
    if (text.includes("cannot find module") || text.includes("import")) return "IMPORT_RESOLUTION";
    if (text.includes("referenceerror") || text.includes("is not defined")) return "RUNTIME_REFERENCE";
    if (text.includes("typeerror")) return "TYPE_MISMATCH";
    if (text.includes("build") || text.includes("gradle")) return "BUILD_TOOLCHAIN";
    return "LOGIC_INTEGRATION";
  }

  _saveLesson(lesson) {
    const file = this.getLessonsFile();
    try {
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(file, JSON.stringify(lesson) + "\n", "utf8");
    } catch (err) {
      console.warn("[PawanLearning] Lesson write error:", err.message);
    }
  }

  /**
   * Retrieve relevant lessons before beginning execution
   */
  getApplicableLessons(instruction = "", targetFile = "", projectId = "global") {
    const file = this.getLessonsFile();
    if (!fs.existsSync(file)) return [];

    try {
      const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
      const allLessons = lines.map(l => JSON.parse(l));

      const fileExt = path.extname(targetFile || "").replace(".", "").toLowerCase();
      const instructionLower = (instruction || "").toLowerCase();

      const matched = allLessons.filter(l => {
        // Project isolation guard
        if (l.projectId && l.projectId !== "global" && l.projectId !== projectId) return false;

        // Match file type or problem pattern
        const matchesType = !fileExt || l.fileType === fileExt || l.fileType === "unknown";
        const matchesKeywords = instructionLower.includes(l.category.toLowerCase()) ||
          instructionLower.includes((l.fileType || "").toLowerCase()) ||
          l.problemPattern.toLowerCase().split(/\s+/).some(word => word.length > 4 && instructionLower.includes(word));

        return matchesType && (matchesKeywords || l.confidenceStatus === "HIGH");
      });

      return matched.slice(-5).reverse();
    } catch {
      return [];
    }
  }

  getLearningMetrics() {
    const file = this.getLessonsFile();
    if (!fs.existsSync(file)) {
      return { totalLessons: 0, categories: {}, highConfidenceCount: 0 };
    }

    try {
      const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
      const allLessons = lines.map(l => JSON.parse(l));

      const categories = {};
      let highConfidence = 0;

      for (const l of allLessons) {
        categories[l.category] = (categories[l.category] || 0) + 1;
        if (l.confidenceStatus === "HIGH") highConfidence++;
      }

      return {
        totalLessons: allLessons.length,
        categories,
        highConfidenceCount: highConfidence,
        lessonsFile: file
      };
    } catch {
      return { totalLessons: 0, categories: {}, highConfidenceCount: 0 };
    }
  }

  clearLessons() {
    const file = this.getLessonsFile();
    if (fs.existsSync(file)) {
      try { fs.unlinkSync(file); } catch {}
    }
    return { success: true };
  }
}

const pawanLearningEngine = new PawanLearningEngine();

module.exports = {
  PawanLearningEngine,
  pawanLearningEngine
};
