/**
 * 🦅 GARUDA CLI — LONG-CONTEXT & HUGE PROMPT PIPELINE (PART E)
 * 
 * "Never silently discard critical instructions during compaction."
 * 
 * Complete Pipeline:
 * INPUT -> INGEST -> NORMALIZE -> CHUNK -> INDEX -> SUMMARIZE -> RETRIEVE -> PLAN -> EXECUTE -> VERIFY
 * 
 * Features:
 * 1. Task Contract Decomposition (Objective, Requirements, Constraints, Do-Not-Do, Acceptance Criteria, Files, Tools, Deadlines)
 * 2. Immutable Prompt Persistence (Survives context compaction and session resume via .garuda/tasks/)
 * 3. Structured Large Document Indexer (Markdown, Source, TXT, JSON, CSV, Logs)
 * 4. Chunking, Hashing (SHA-256), Relevance Retrieval, and Hierarchical Summarization
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { computeSha256 } = require("./diffEngine");
const { resolveSafeRepositoryPath } = require("./security");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DEFAULT_TASKS_DIR = path.join(ROOT_DIR, ".garuda", "tasks");
const DEFAULT_DOCS_INDEX_DIR = path.join(ROOT_DIR, ".garuda", "index");

class TaskContract {
  constructor(data = {}) {
    this.id = data.id || `task_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.rawPrompt = data.rawPrompt || "";
    this.rawPromptSha256 = data.rawPromptSha256 || computeSha256(this.rawPrompt);

    // E1 Decomposition fields
    this.objective = data.objective || "";
    this.requirements = data.requirements || [];
    this.constraints = data.constraints || [];
    this.doNotDo = data.doNotDo || [];
    this.acceptanceCriteria = data.acceptanceCriteria || [];
    this.files = data.files || [];
    this.tools = data.tools || [];
    this.dependencies = data.dependencies || [];
    this.priority = data.priority || "NORMAL";
    this.deadlines = data.deadlines || [];
    this.outputFormat = data.outputFormat || "STANDARD";
    this.unknownItems = data.unknownItems || [];

    // State Tracking
    this.executionState = data.executionState || "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, FAILED
    this.validationState = data.validationState || "UNVERIFIED"; // UNVERIFIED, VALIDATED, REGRESSION
    this.completedSteps = data.completedSteps || [];
    this.pendingSteps = data.pendingSteps || [];
    this.summaries = data.summaries || [];
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      rawPrompt: this.rawPrompt,
      rawPromptSha256: this.rawPromptSha256,
      objective: this.objective,
      requirements: this.requirements,
      constraints: this.constraints,
      doNotDo: this.doNotDo,
      acceptanceCriteria: this.acceptanceCriteria,
      files: this.files,
      tools: this.tools,
      dependencies: this.dependencies,
      priority: this.priority,
      deadlines: this.deadlines,
      outputFormat: this.outputFormat,
      unknownItems: this.unknownItems,
      executionState: this.executionState,
      validationState: this.validationState,
      completedSteps: this.completedSteps,
      pendingSteps: this.pendingSteps,
      summaries: this.summaries
    };
  }
}

class PromptDecomposer {
  /**
   * Decomposes arbitrary long user prompt into a structured TaskContract (E1).
   */
  static decompose(rawPrompt) {
    if (!rawPrompt || typeof rawPrompt !== "string") {
      return new TaskContract({ objective: "Empty task prompt." });
    }

    const text = rawPrompt.trim();
    const lines = text.split(/\r?\n/);

    let objective = "";
    const requirements = [];
    const constraints = [];
    const doNotDo = [];
    const acceptanceCriteria = [];
    const files = new Set();
    const tools = new Set();
    const deadlines = [];
    const unknownItems = [];

    // 1. Extract File references
    const fileRegex = /\b([a-zA-Z0-9_\-\.\/\\]+\.(?:js|jsx|ts|tsx|json|md|html|css|py|java|gradle|xml|txt|csv|yaml|yml))\b/g;
    let fileMatch;
    while ((fileMatch = fileRegex.exec(text)) !== null) {
      files.add(fileMatch[1]);
    }

    // 2. Extract Tools Mentioned
    const toolKeywords = {
      run_command: ["run", "command", "npm", "exec", "test", "build", "powershell", "cmd"],
      view_file: ["read", "view", "inspect", "inspect file", "check code"],
      write_file: ["write", "create file", "save new file"],
      edit_file: ["patch", "edit", "replace", "fix bug", "modify"],
      list_dir: ["list", "dir", "directory", "files in"],
      browser: ["browser", "ticket", "website", "navigate", "search web", "click", "book"]
    };
    const lowerText = text.toLowerCase();
    for (const [tName, kws] of Object.entries(toolKeywords)) {
      for (const kw of kws) {
        if (lowerText.includes(kw)) {
          tools.add(tName);
          break;
        }
      }
    }

    // 3. Scan Line by Line for semantics
    let currentSection = "OBJECTIVE";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const lowerLine = line.toLowerCase();

      // Heading detection
      if (lowerLine.startsWith("# objective") || lowerLine.startsWith("objective:")) {
        currentSection = "OBJECTIVE";
        const val = line.replace(/^[#\s]*objective:?\s*/i, "").trim();
        if (val) objective = val;
        continue;
      }
      if (lowerLine.startsWith("# requirements") || lowerLine.startsWith("requirements:")) {
        currentSection = "REQUIREMENTS";
        continue;
      }
      if (lowerLine.startsWith("# constraints") || lowerLine.startsWith("constraints:")) {
        currentSection = "CONSTRAINTS";
        continue;
      }
      if (lowerLine.startsWith("# do-not-do") || lowerLine.startsWith("do not") || lowerLine.startsWith("prohibited:")) {
        currentSection = "DO_NOT_DO";
        continue;
      }
      if (lowerLine.startsWith("# acceptance criteria") || lowerLine.startsWith("acceptance criteria:")) {
        currentSection = "ACCEPTANCE_CRITERIA";
        continue;
      }

      // Do-Not-Do detection
      if (lowerLine.includes("do not") || lowerLine.includes("never") || lowerLine.includes("no git commit") || lowerLine.includes("no git push") || lowerLine.includes("strictly forbidden") || lowerLine.includes("prohibited")) {
        doNotDo.push(line.replace(/^[-*•\d.]\s*/, ""));
        continue;
      }

      // Constraint detection
      if (lowerLine.startsWith("must ") || lowerLine.includes("strictly") || lowerLine.includes("mandatory") || lowerLine.includes("deadline")) {
        constraints.push(line.replace(/^[-*•\d.]\s*/, ""));
      }

      // Acceptance Criteria detection
      if (lowerLine.startsWith("[ ]") || lowerLine.startsWith("[x]") || lowerLine.includes("criteria") || lowerLine.includes("accepted only if")) {
        acceptanceCriteria.push(line.replace(/^[-*•\d.]\s*/, ""));
        continue;
      }

      // Section routing
      const cleanedItem = line.replace(/^[-*•\d.]\s*/, "");
      if (currentSection === "REQUIREMENTS") {
        requirements.push(cleanedItem);
      } else if (currentSection === "CONSTRAINTS") {
        constraints.push(cleanedItem);
      } else if (currentSection === "DO_NOT_DO") {
        doNotDo.push(cleanedItem);
      } else if (currentSection === "ACCEPTANCE_CRITERIA") {
        acceptanceCriteria.push(cleanedItem);
      } else if (!objective) {
        objective = cleanedItem;
      } else {
        requirements.push(cleanedItem);
      }

      // Dates & Deadlines detection
      const dateMatch = line.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i);
      if (dateMatch) {
        deadlines.push(`${dateMatch[0]} (from line: "${line.slice(0, 50)}")`);
      }
    }

    if (!objective && requirements.length > 0) {
      objective = requirements[0];
    }

    // Contradiction detection heuristic
    for (let c of constraints) {
      for (let d of doNotDo) {
        if (c.toLowerCase().includes("deploy") && d.toLowerCase().includes("no deployment")) {
          unknownItems.push(`Contradiction flag: Constraint specifies deploy while Do-Not-Do forbids deployment.`);
        }
      }
    }

    return new TaskContract({
      rawPrompt: text,
      rawPromptSha256: computeSha256(text),
      objective: objective || "Execute provided multi-step instruction",
      requirements: requirements.slice(0, 40),
      constraints: constraints.slice(0, 30),
      doNotDo: doNotDo.slice(0, 20),
      acceptanceCriteria: acceptanceCriteria.slice(0, 25),
      files: Array.from(files),
      tools: Array.from(tools),
      deadlines,
      unknownItems
    });
  }
}

class DocumentIndexer {
  constructor(options = {}) {
    this.rootDir = options.rootDir ? path.resolve(options.rootDir) : ROOT_DIR;
    this.chunkSize = options.chunkSize || 1200; // characters per chunk
    this.chunkOverlap = options.chunkOverlap || 200;
    this.indexDir = options.indexDir || DEFAULT_DOCS_INDEX_DIR;
    this.chunks = [];
  }

  /**
   * Ingests and chunks a local file or text content.
   */
  ingestDocument(filePathOrName, content = null) {
    let rawContent = content;
    let relPath = filePathOrName;

    if (rawContent === null) {
      const resolved = resolveSafeRepositoryPath(filePathOrName, this.rootDir);
      rawContent = fs.readFileSync(resolved, "utf8");
      relPath = path.relative(this.rootDir, resolved);
    }

    const docSha256 = computeSha256(rawContent);
    const lines = rawContent.split("\n");
    const totalLines = lines.length;

    // Windowed chunking
    const chunks = [];
    let currentChunk = "";
    let startLine = 1;
    let currentLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if ((currentChunk + "\n" + line).length > this.chunkSize && currentChunk.length > 0) {
        const chunkId = `chunk_${chunks.length + 1}_${crypto.randomBytes(2).toString("hex")}`;
        chunks.push({
          id: chunkId,
          docPath: relPath,
          docSha256,
          startLine,
          endLine: currentLine - 1,
          content: currentChunk.trim(),
          sha256: computeSha256(currentChunk.trim())
        });

        // Retain overlap lines
        const overlapSlice = lines.slice(Math.max(0, i - 3), i).join("\n");
        currentChunk = overlapSlice + "\n" + line;
        startLine = Math.max(1, i - 2);
      } else {
        currentChunk += (currentChunk ? "\n" : "") + line;
      }
      currentLine++;
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `chunk_${chunks.length + 1}_${crypto.randomBytes(2).toString("hex")}`,
        docPath: relPath,
        docSha256,
        startLine,
        endLine: totalLines,
        content: currentChunk.trim(),
        sha256: computeSha256(currentChunk.trim())
      });
    }

    this.chunks.push(...chunks);
    return {
      docPath: relPath,
      totalBytes: Buffer.byteLength(rawContent),
      totalLines,
      chunkCount: chunks.length,
      docSha256
    };
  }

  /**
   * Retrieves top-K most relevant chunks for a specific query without blowing context.
   */
  retrieve(query, topK = 3) {
    if (!query || this.chunks.length === 0) return [];

    const queryTokens = query.toLowerCase().split(/[^a-zA-Z0-9_\-\.]+/).filter(t => t.length > 2);

    const scored = this.chunks.map(chunk => {
      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerPath = chunk.docPath.toLowerCase();

      for (const token of queryTokens) {
        if (lowerPath.includes(token)) score += 5; // Path match boost
        if (lowerContent.includes(token)) {
          // Count occurrences
          const occurrences = (lowerContent.match(new RegExp(token, "g")) || []).length;
          score += Math.min(occurrences, 10);
        }
      }

      return { ...chunk, score };
    });

    return scored
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Creates a concise hierarchical summary of all indexed documents.
   */
  generateIndexSummary() {
    const docs = {};
    for (const c of this.chunks) {
      if (!docs[c.docPath]) {
        docs[c.docPath] = { chunks: 0, lines: 0, sha256: c.docSha256 };
      }
      docs[c.docPath].chunks++;
      docs[c.docPath].lines = Math.max(docs[c.docPath].lines, c.endLine);
    }

    const lines = [
      `📂 [GARUDA Long-Context Document Index] (${Object.keys(docs).length} documents indexed):`,
      ...Object.entries(docs).map(([dPath, meta]) => 
        `  • ${dPath} (${meta.lines} lines, ${meta.chunks} chunks, SHA-256: ${meta.sha256.slice(0, 16)}...)`
      )
    ];

    return lines.join("\n");
  }
}

class TaskPersistenceManager {
  constructor(tasksDir = DEFAULT_TASKS_DIR) {
    this.tasksDir = path.resolve(tasksDir);
    this._ensureDir();
  }

  _ensureDir() {
    try {
      if (!fs.existsSync(this.tasksDir)) fs.mkdirSync(this.tasksDir, { recursive: true });
    } catch (_) {}
  }

  /**
   * Atomically saves a task contract to disk (E2).
   */
  saveTaskContract(taskContract) {
    this._ensureDir();
    const data = taskContract instanceof TaskContract ? taskContract.toJSON() : taskContract;
    const targetFile = path.join(this.tasksDir, `${data.id}.json`);
    const tempFile = path.join(this.tasksDir, `${data.id}.${Date.now()}.${crypto.randomBytes(2).toString("hex")}.tmp`);

    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tempFile, targetFile);
      return true;
    } catch (err) {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (_) {}
      return false;
    }
  }

  /**
   * Loads a task contract by ID.
   */
  loadTaskContract(taskId) {
    this._ensureDir();
    const cleanId = String(taskId).replace(/[^a-zA-Z0-9_\-]/g, "");
    const targetFile = path.join(this.tasksDir, `${cleanId}.json`);

    if (!fs.existsSync(targetFile)) return null;

    try {
      const parsed = JSON.parse(fs.readFileSync(targetFile, "utf8"));
      return new TaskContract(parsed);
    } catch (_) {
      return null;
    }
  }

  /**
   * Retrieves the most recently created or updated task contract.
   */
  getLatestTaskContract() {
    this._ensureDir();
    try {
      const files = fs.readdirSync(this.tasksDir).filter(f => f.endsWith(".json"));
      if (files.length === 0) return null;

      const tasks = files.map(file => {
        try {
          const content = fs.readFileSync(path.join(this.tasksDir, file), "utf8");
          const parsed = JSON.parse(content);
          return new TaskContract(parsed);
        } catch (_) {
          return null;
        }
      }).filter(Boolean);

      return tasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;
    } catch (_) {
      return null;
    }
  }
}

/**
 * Master Long-Context Pipeline Execution Orchestrator.
 */
class LongContextPipeline {
  constructor(options = {}) {
    this.rootDir = options.rootDir ? path.resolve(options.rootDir) : ROOT_DIR;
    this.indexer = new DocumentIndexer({ rootDir: this.rootDir });
    this.persistence = new TaskPersistenceManager(options.tasksDir || DEFAULT_TASKS_DIR);
    this.activeContract = null;
  }

  /**
   * Executes the ingestion, normalization, indexing and task contract extraction.
   */
  ingestAndDecompose(promptOrDocs) {
    let mainPrompt = "";
    if (typeof promptOrDocs === "string") {
      mainPrompt = promptOrDocs;
    } else if (promptOrDocs && promptOrDocs.prompt) {
      mainPrompt = promptOrDocs.prompt;
      if (Array.isArray(promptOrDocs.attachments)) {
        for (const att of promptOrDocs.attachments) {
          this.indexer.ingestDocument(att.path, att.content);
        }
      }
    }

    // 1. Decompose into structured Task Contract (E1)
    const contract = PromptDecomposer.decompose(mainPrompt);

    // 2. Persist to disk (E2)
    this.persistence.saveTaskContract(contract);
    this.activeContract = contract;

    return {
      contract,
      indexSummary: this.indexer.generateIndexSummary()
    };
  }

  /**
   * Queries relevant knowledge chunks for active prompt context.
   */
  getRelevantContext(query, maxChunks = 3) {
    return this.indexer.retrieve(query, maxChunks);
  }
}

module.exports = {
  LongContextPipeline,
  TaskContract,
  PromptDecomposer,
  DocumentIndexer,
  TaskPersistenceManager
};
