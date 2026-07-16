const { brainRegistry } = require("./BrainRegistry");

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "goal";
}

class MultiBrainPlanner {
  constructor({ registry = brainRegistry } = {}) {
    this.registry = registry;
  }

  _selectBrains(goalText) {
    const text = goalText.toLowerCase();
    const brains = ["architect", "reviewer", "documentation"];

    if (text.includes("frontend") || text.includes("dashboard") || text.includes("ui") || text.includes("home")) {
      brains.splice(1, 0, "frontend");
    }

    if (text.includes("backend") || text.includes("api") || text.includes("server")) {
      brains.splice(2, 0, "backend");
    }

    if (text.includes("test") || text.includes("quality") || text.includes("validate")) {
      brains.splice(brains.indexOf("reviewer"), 0, "tester");
    }

    return Array.from(new Set(brains));
  }

  _buildTasks(goalText) {
    const text = goalText.toLowerCase();
    const tasks = [
      {
        id: `${toSlug(goalText)}-01`,
        title: "Scan the repository and identify the current implementation surface",
        workerType: "architect",
        dependencies: [],
        allowedActions: ["read", "analyze", "map_dependencies"],
        blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source"],
        approvalRequired: true
      }
    ];

    if (text.includes("frontend") || text.includes("dashboard") || text.includes("ui") || text.includes("home")) {
      tasks.push({
        id: `${toSlug(goalText)}-02`,
        title: "Break the dashboard home into reusable frontend work packages",
        workerType: "frontend",
        dependencies: [`${toSlug(goalText)}-01`],
        allowedActions: ["read", "inspect_ui", "suggest_components", "run_ui_checks"],
        blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source"],
        approvalRequired: true
      });
    }

    if (text.includes("backend") || text.includes("api") || text.includes("server")) {
      tasks.push({
        id: `${toSlug(goalText)}-03`,
        title: "Map backend integration points and data dependencies",
        workerType: "backend",
        dependencies: [`${toSlug(goalText)}-01`],
        allowedActions: ["read", "inspect_api", "suggest_routes", "map_services"],
        blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source"],
        approvalRequired: true
      });
    }

    tasks.push({
      id: `${toSlug(goalText)}-04`,
      title: "Define validation checks and read-only test strategy",
      workerType: "tester",
      dependencies: tasks.map((task) => task.id),
      allowedActions: ["read", "run_tests", "run_syntax_checks", "verify_quality"],
      blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source"],
      approvalRequired: true
    });

    tasks.push({
      id: `${toSlug(goalText)}-05`,
      title: "Review the merged proposal for safety and approval boundaries",
      workerType: "reviewer",
      dependencies: [tasks[tasks.length - 1].id],
      allowedActions: ["read", "review", "validate", "approve_readonly"],
      blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source"],
      approvalRequired: true
    });

    tasks.push({
      id: `${toSlug(goalText)}-06`,
      title: "Prepare a founder-facing implementation report",
      workerType: "documentation",
      dependencies: [tasks[tasks.length - 1].id],
      allowedActions: ["read", "summarize", "draft_docs", "prepare_reports"],
      blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source"],
      approvalRequired: true
    });

    return tasks;
  }

  _dependencyOrder(tasks = []) {
    const order = [];
    const visited = new Set();
    const byId = new Map(tasks.map((task) => [task.id, task]));

    function visit(task) {
      if (!task || visited.has(task.id)) {
        return;
      }

      (task.dependencies || []).forEach((dependencyId) => {
        visit(byId.get(dependencyId));
      });

      visited.add(task.id);
      order.push(task.id);
    }

    tasks.forEach(visit);
    return order;
  }

  plan(goalInput, context = {}) {
    const goalText = typeof goalInput === "string" ? goalInput.trim() : String(goalInput && goalInput.rawGoal ? goalInput.rawGoal : "").trim();

    if (!goalText) {
      throw new Error("MultiBrainPlanner requires a founder-approved development goal.");
    }

    const selectedBrains = this._selectBrains(goalText);
    const tasks = this._buildTasks(goalText);

    return {
      engine: "GARUDA MultiBrainPlanner",
      goal: goalText,
      founderApprovalRequired: true,
      selectedBrains,
      tasks,
      dependencyOrder: this._dependencyOrder(tasks),
      validation: {
        status: "PENDING_REVIEW",
        requiredBrains: ["reviewer"],
        approvalRequired: true,
        founderApprovalRequired: true
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        readOnly: true,
        context
      }
    };
  }
}

module.exports = MultiBrainPlanner;
module.exports.MultiBrainPlanner = MultiBrainPlanner;