/**
 * 🦅 GARUDA CLI — COMPLEX TASK PLANNER & DEPENDENCY GRAPH (PART F)
 * 
 * Decomposes multi-job instructions into structured, dependent execution graphs:
 * TASK-001 inspect -> TASK-002 diagnose -> TASK-003 patch -> TASK-004 test
 * -> TASK-005 build -> TASK-006 verify -> TASK-007 report
 * 
 * Enforces:
 * - Strict topological dependency sequencing (Prerequisites must pass before dependents run)
 * - Automatic cascade blocking (Downstream jobs block if an upstream prerequisite fails)
 * - Structured plan visualization tree
 */

class PlannedTask {
  constructor(data = {}) {
    this.id = data.id || `TASK-${String(data.index || 1).padStart(3, "0")}`;
    this.title = data.title || "Untitled Step";
    this.type = data.type || "custom";
    this.dependencies = Array.isArray(data.dependencies) ? data.dependencies : [];
    this.status = data.status || "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, BLOCKED, FAILED
    this.output = data.output || null;
    this.error = data.error || null;
    this.metadata = data.metadata || {};
  }
}

class ComplexTaskPlanner {
  constructor(tasks = []) {
    this.tasks = tasks.map((t, idx) => (t instanceof PlannedTask ? t : new PlannedTask({ ...t, index: idx + 1 })));
  }

  /**
   * Automatically parses multi-job task descriptions into dependent sub-tasks.
   */
  static planFromContract(taskContract) {
    const planner = new ComplexTaskPlanner();
    const prompt = (taskContract.rawPrompt || taskContract.objective || "").toLowerCase();

    const standardSteps = [
      { keys: ["search", "browser"], type: "search", title: "Search external sources or travel schedules" },
      { keys: ["ingest", "retrieve", "index"], type: "ingest", title: "Ingest documentation and retrieve relevant rules" },
      { keys: ["inspect", "audit"], type: "inspect", title: "Inspect target code and environment" },
      { keys: ["diagnose"], type: "diagnose", title: "Diagnose root cause and error dynamics" },
      { keys: ["patch", "fix"], type: "patch", title: "Apply minimal surgical patch" },
      { keys: ["test", "regression"], type: "test", title: "Run unit and regression test suite" },
      { keys: ["build"], type: "build", title: "Compile build artifacts or APK" },
      { keys: ["verify"], type: "verify", title: "Verify output artifacts and SHA-256 evidence" },
      { keys: ["report"], type: "report", title: "Compile final forensic report" }
    ];

    const detected = [];

    // Check which steps are mentioned in prompt or requirements
    for (const step of standardSteps) {
      if (step.keys.some(k => prompt.includes(k)) || prompt.includes(step.type)) {
        detected.push(step);
      }
    }

    // If generic instruction or none detected, create standard 4-phase execution
    if (detected.length === 0) {
      detected.push(
        { key: "inspect", type: "inspect", title: "Inspect codebase and scope" },
        { key: "patch", type: "patch", title: "Execute changes according to specification" },
        { key: "test", type: "test", title: "Verify test suite execution" },
        { key: "report", type: "report", title: "Report verified evidence and diff" }
      );
    }

    // Build dependency chain: each step depends on previous step
    for (let i = 0; i < detected.length; i++) {
      const step = detected[i];
      const taskId = `TASK-${String(i + 1).padStart(3, "0")}`;
      const deps = i > 0 ? [`TASK-${String(i).padStart(3, "0")}`] : [];

      planner.addTask({
        id: taskId,
        title: step.title,
        type: step.type,
        dependencies: deps
      });
    }

    return planner;
  }

  addTask(taskSpec) {
    const task = taskSpec instanceof PlannedTask ? taskSpec : new PlannedTask(taskSpec);
    this.tasks.push(task);
    return task;
  }

  getTask(taskId) {
    return this.tasks.find(t => t.id === taskId) || null;
  }

  /**
   * Retrieves the next task ready for execution (all dependencies COMPLETED).
   */
  getNextExecutableTask() {
    for (const task of this.tasks) {
      if (task.status === "PENDING") {
        // Check if all prerequisites are COMPLETED
        const prereqs = task.dependencies.map(dId => this.getTask(dId)).filter(Boolean);
        const hasFailedPrereq = prereqs.some(p => p.status === "FAILED" || p.status === "BLOCKED");

        if (hasFailedPrereq) {
          task.status = "BLOCKED";
          continue;
        }

        const allCompleted = prereqs.every(p => p.status === "COMPLETED");
        if (allCompleted) {
          return task;
        }
      }
    }
    return null;
  }

  markTaskComplete(taskId, output = null) {
    const task = this.getTask(taskId);
    if (!task) return false;
    task.status = "COMPLETED";
    task.output = output;
    return true;
  }

  markTaskFailed(taskId, error = null) {
    const task = this.getTask(taskId);
    if (!task) return false;
    task.status = "FAILED";
    task.error = error;

    // Cascade blocking to all downstream tasks
    for (const other of this.tasks) {
      if (other.dependencies.includes(taskId) && other.status === "PENDING") {
        other.status = "BLOCKED";
      }
    }
    return true;
  }

  isAllComplete() {
    return this.tasks.length > 0 && this.tasks.every(t => t.status === "COMPLETED");
  }

  hasFailures() {
    return this.tasks.some(t => t.status === "FAILED" || t.status === "BLOCKED");
  }

  /**
   * Generates a structured ASCII plan tree.
   */
  renderPlanTree() {
    const icons = {
      COMPLETED: "✔",
      IN_PROGRESS: "⚡",
      PENDING: "⏳",
      BLOCKED: "🚫",
      FAILED: "✖"
    };

    const lines = [
      `🦅 GARUDA COMPLEX TASK PLAN (${this.tasks.length} Sequential Jobs):`
    ];

    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      const isLast = i === this.tasks.length - 1;
      const prefix = isLast ? "└─" : "├─";
      const icon = icons[task.status] || "•";
      const deps = task.dependencies.length > 0 ? ` (Depends on: ${task.dependencies.join(", ")})` : "";
      lines.push(`${prefix} [${icon}] ${task.id}: ${task.title}${deps} [${task.status}]`);
    }

    return lines.join("\n");
  }
}

module.exports = {
  ComplexTaskPlanner,
  PlannedTask
};
