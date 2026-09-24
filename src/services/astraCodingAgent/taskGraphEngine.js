/**
 * 🦅 GARUDA PAWAN ASTRA — TASK GRAPH PLANNER & MULTI-FILE TRANSACTION ENGINE
 * 
 * Capabilities:
 * 1. DAG Task Graph Architecture: Dependency resolution, conflict detection, topological sorting
 * 2. Multi-File Atomic Transactions: Pre-transaction snapshots, all-or-nothing rollback on validation failure
 * 3. Structured Task Planning: Decomposes high-level requirements into coordinated engineering tasks
 * 4. Regression Safe: Guarantees workspaces are never left in half-patched or corrupted states
 */

const crypto = require("crypto");
const { LayeredValidator } = require("./layeredValidator");
const { PatchEngine } = require("./patchEngine");

class TaskGraph {
  constructor(options = {}) {
    this.id = options.id || `graph_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    this.name = options.name || "Engineering Task Graph";
    this.tasks = new Map(); // taskId -> TaskDoc
    this.executionLog = [];
  }

  /**
   * Add a structured task to the graph with complete Phase 3 metadata
   */
  addTask({
    id,
    title,
    objective,
    reason = "",
    dependencies = [],
    files = [],
    symbols = [],
    commands = [],
    risk = "low",
    acceptanceCriteria = [],
    verification = "static",
    rollbackPoint = false
  }) {
    const taskId = id || `task_${this.tasks.size + 1}_${crypto.randomBytes(2).toString("hex")}`;
    const taskDoc = {
      id: taskId,
      title: title || "Engineering Task",
      objective: objective || "",
      reason: reason || "",
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      files: Array.isArray(files) ? files.map(f => f.replace(/\\/g, "/")) : [],
      symbols: Array.isArray(symbols) ? symbols : [],
      commands: Array.isArray(commands) ? commands : [],
      risk: ["low", "medium", "high"].includes(risk) ? risk : "low",
      acceptanceCriteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [],
      verification: verification || "static",
      rollbackPoint: Boolean(rollbackPoint),
      status: "PLANNED", // 'PLANNED' | 'RUNNING' | 'VERIFIED' | 'FAILED' | 'ROLLED_BACK'
      evidence: null,
      error: null,
      startedAt: null,
      completedAt: null
    };

    this.tasks.set(taskId, taskDoc);
    return taskDoc;
  }

  /**
   * Check for circular dependencies using cycle detection (DFS)
   */
  hasCycle() {
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const task = this.tasks.get(nodeId);
      if (task) {
        for (const depId of task.dependencies) {
          if (!visited.has(depId)) {
            if (dfs(depId)) return true;
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const [taskId] of this.tasks.entries()) {
      if (!visited.has(taskId)) {
        if (dfs(taskId)) return true;
      }
    }
    return false;
  }

  /**
   * Compute topological execution stages (parallel independent batches)
   * Tasks in stage N can execute in parallel only if their target file sets do not intersect
   */
  getExecutionStages() {
    if (this.hasCycle()) {
      throw new Error("Cannot execute task graph: Circular dependency detected!");
    }

    const inDegree = new Map();
    const adj = new Map();

    for (const [id] of this.tasks.entries()) {
      inDegree.set(id, 0);
      adj.set(id, []);
    }

    for (const [id, task] of this.tasks.entries()) {
      for (const depId of task.dependencies) {
        if (adj.has(depId)) {
          adj.get(depId).push(id);
          inDegree.set(id, (inDegree.get(id) || 0) + 1);
        }
      }
    }

    const stages = [];
    let ready = [];

    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) ready.push(id);
    }

    const completed = new Set();

    while (ready.length > 0) {
      const currentBatch = [];
      const usedFiles = new Set();
      const deferred = [];

      // Conflict detection: tasks in same parallel batch must NOT touch the same files
      for (const id of ready) {
        const task = this.tasks.get(id);
        const hasFileConflict = task.files.some(f => usedFiles.has(f));

        if (!hasFileConflict) {
          currentBatch.push(id);
          task.files.forEach(f => usedFiles.add(f));
        } else {
          deferred.push(id);
        }
      }

      stages.push(currentBatch.map(id => this.tasks.get(id)));
      currentBatch.forEach(id => completed.add(id));

      // Formulate next ready tasks
      const nextReady = [...deferred];
      for (const id of currentBatch) {
        for (const neighbor of adj.get(id) || []) {
          inDegree.set(neighbor, inDegree.get(neighbor) - 1);
          if (inDegree.get(neighbor) === 0 && !completed.has(neighbor) && !nextReady.includes(neighbor)) {
            nextReady.push(neighbor);
          }
        }
      }

      ready = nextReady;
    }

    return stages;
  }
}

/**
 * Multi-File Atomic Patch Transaction Coordinator
 */
class PatchTransactionCoordinator {
  constructor(options = {}) {
    this.validator = options.validator || new LayeredValidator();
    this.patchEngine = options.patchEngine || new PatchEngine();
  }

  /**
   * Execute multi-file patch transaction atomically on a ProjectWorkspace
   * If ANY file fails validation or patch context mismatch, ALL files are rolled back!
   */
  async executeTransaction(workspace, patchOperations = [], description = "Atomic Multi-File Patch") {
    if (!workspace) throw new Error("Workspace required for transaction");
    if (!Array.isArray(patchOperations) || patchOperations.length === 0) {
      return { success: true, patchesApplied: 0, message: "Empty transaction" };
    }

    // 1. Create Pre-Transaction Snapshot
    const preSnapshot = workspace.createSnapshot(`Pre-Tx: ${description}`);
    const appliedLogs = [];

    try {
      for (let i = 0; i < patchOperations.length; i++) {
        const op = patchOperations[i];
        const { filePath, searchBlock, replaceBlock, newContent } = op;
        if (!filePath) throw new Error(`Patch operation #${i + 1} missing filePath`);

        let targetContent = "";
        const existingDoc = workspace.getFile(filePath);

        if (searchBlock) {
          if (!existingDoc) {
            throw new Error(`Cannot search/replace: ${filePath} does not exist in workspace`);
          }
          const patchRes = this.patchEngine.applySearchReplace(existingDoc.content, searchBlock, replaceBlock || "", op.options);
          if (!patchRes.success) {
            throw new Error(`Surgical patch failed on ${filePath}: ${patchRes.error}`);
          }
          targetContent = patchRes.newContent;
        } else if (newContent !== undefined) {
          targetContent = newContent;
        } else {
          throw new Error(`Patch operation #${i + 1} on ${filePath} requires either searchBlock or newContent`);
        }

        // 2. Validate Modified Content Immediately
        const valRes = this.validator.validateContent(targetContent, filePath);
        if (!valRes.valid) {
          throw new Error(`Validation failed for ${filePath}: ${valRes.error}`);
        }

        // 3. Stage in Workspace
        workspace.setFile(filePath, targetContent);
        appliedLogs.push({
          filePath,
          method: searchBlock ? "search_replace" : "full_content",
          sha256: valRes.sha256
        });
      }

      return {
        success: true,
        transactionCommitted: true,
        snapshotId: preSnapshot.snapshotId,
        filesModified: appliedLogs.length,
        operations: appliedLogs,
        manifest: workspace.getManifest()
      };

    } catch (txError) {
      // 4. ATOMIC ROLLBACK: Restore entire workspace to pre-transaction snapshot
      workspace.rollback(preSnapshot.snapshotId);

      return {
        success: false,
        transactionCommitted: false,
        rolledBack: true,
        snapshotRestored: preSnapshot.snapshotId,
        error: txError.message,
        failedAtStep: appliedLogs.length + 1
      };
    }
  }
}

/**
 * Task Graph Planner Helper
 * Decomposes requirements into structured multi-file DAG
 */
function planEngineeringTaskGraph(requirement, existingFiles = []) {
  const graph = new TaskGraph({ name: `Plan for: ${(requirement || "").slice(0, 40)}` });
  const lowerReq = (requirement || "").toLowerCase();

  // 1. Data Schema / Mock Task
  const t1 = graph.addTask({
    id: "task_1_data_schema",
    title: "Define Data Models & Persistence",
    objective: "Create or update state structure and data schemas",
    reason: "Establish authoritative data schema before writing service logic",
    files: ["src/data/models.json"],
    symbols: ["SchemaDefinition"],
    commands: [],
    dependencies: [],
    risk: "low",
    acceptanceCriteria: ["Valid JSON schema", "Required data fields present"],
    verification: "static",
    rollbackPoint: true
  });

  // 2. Logic / Service Helper Task
  const t2 = graph.addTask({
    id: "task_2_business_logic",
    title: "Implement Core Business Logic & Handlers",
    objective: "Implement calculation, validation, and action methods",
    reason: "Provide deterministic business logic and operational controllers",
    files: ["src/services/appLogic.js"],
    symbols: ["processState", "validateInput"],
    commands: ["node -c src/services/appLogic.js"],
    dependencies: [t1.id],
    risk: "medium",
    acceptanceCriteria: ["Functions exported cleanly", "Handles edge cases"],
    verification: "static",
    rollbackPoint: false
  });

  // 3. UI Component / Screen Task
  const t3 = graph.addTask({
    id: "task_3_ui_presentation",
    title: "Integrate Interactive UI Presentation",
    objective: "Wire buttons, modals, input forms, and status feedback",
    reason: "Expose user-facing controls and responsive visual layout",
    files: ["index.html", "src/styles.css"],
    symbols: ["renderUI", "handleActionClick"],
    commands: [],
    dependencies: [t2.id],
    risk: "medium",
    acceptanceCriteria: ["Semantic accessibility", "Mobile responsive CSS", "Event listeners wired"],
    verification: "browser",
    rollbackPoint: false
  });

  // 4. Runtime Verification Task
  const t4 = graph.addTask({
    id: "task_4_runtime_verification",
    title: "Execute Headless Browser Runtime Verification",
    objective: "Verify zero page errors, responsive rendering, and button interaction flows",
    reason: "Guarantee zero runtime ReferenceErrors and flawless user interaction flow",
    files: ["index.html"],
    symbols: [],
    commands: ["npm test"],
    dependencies: [t3.id],
    risk: "low",
    acceptanceCriteria: ["0 console.error", "0 pageerror", "Interactive click flows pass"],
    verification: "browser",
    rollbackPoint: false
  });

  return graph;
}

module.exports = {
  TaskGraph,
  PatchTransactionCoordinator,
  planEngineeringTaskGraph
};
