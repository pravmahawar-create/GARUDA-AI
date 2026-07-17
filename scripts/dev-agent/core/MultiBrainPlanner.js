const { brainRegistry } = require("./BrainRegistry");
const EngineeringDirector = require("./EngineeringDirector");

function toSlug(value) {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "goal"
  );
}

class MultiBrainPlanner {
  constructor({
    registry = brainRegistry,
    engineeringDirector = null
  } = {}) {
    this.registry = registry;
    this.engineeringDirector =
      engineeringDirector ||
      new EngineeringDirector();
  }

  _selectBrains(goalText) {
    const text = String(goalText || "").toLowerCase();
    const brains = ["architect", "reviewer", "documentation"];

    if (
      text.includes("frontend") ||
      text.includes("dashboard") ||
      text.includes("ui") ||
      text.includes("home")
    ) {
      brains.splice(1, 0, "frontend");
    }

    if (
      text.includes("backend") ||
      text.includes("api") ||
      text.includes("server")
    ) {
      brains.splice(2, 0, "backend");
    }

    if (
      text.includes("test") ||
      text.includes("quality") ||
      text.includes("validate")
    ) {
      const reviewerIndex = brains.indexOf("reviewer");
      brains.splice(
        reviewerIndex >= 0 ? reviewerIndex : brains.length,
        0,
        "tester"
      );
    }

    return Array.from(new Set(brains));
  }

  _buildTasks(goalText, engineeringRoadmap = null) {
    const text = String(goalText || "").toLowerCase();
    const slug = toSlug(goalText);
    const tasks = [
      {
        id: `${slug}-01`,
        title:
          "Scan the repository and identify the current implementation surface",
        workerType: "architect",
        dependencies: [],
        allowedActions: ["read", "analyze", "map_dependencies"],
        blockedActions: [
          "commit",
          "merge",
          "deploy",
          "paid_api",
          "write_source"
        ],
        approvalRequired: true
      }
    ];

    if (
      text.includes("frontend") ||
      text.includes("dashboard") ||
      text.includes("ui") ||
      text.includes("home")
    ) {
      tasks.push({
        id: `${slug}-02`,
        title:
          "Break the dashboard home into reusable frontend work packages",
        workerType: "frontend",
        dependencies: [`${slug}-01`],
        allowedActions: [
          "read",
          "inspect_ui",
          "suggest_components",
          "run_ui_checks"
        ],
        blockedActions: [
          "commit",
          "merge",
          "deploy",
          "paid_api",
          "write_source"
        ],
        approvalRequired: true
      });
    }

    if (
      text.includes("backend") ||
      text.includes("api") ||
      text.includes("server")
    ) {
      tasks.push({
        id: `${slug}-03`,
        title:
          "Map backend integration points and data dependencies",
        workerType: "backend",
        dependencies: [`${slug}-01`],
        allowedActions: [
          "read",
          "inspect_api",
          "suggest_routes",
          "map_services"
        ],
        blockedActions: [
          "commit",
          "merge",
          "deploy",
          "paid_api",
          "write_source"
        ],
        approvalRequired: true
      });
    }

    const roadmapPhaseTasks = [];

    if (
      engineeringRoadmap &&
      Array.isArray(engineeringRoadmap.phases)
    ) {
      engineeringRoadmap.phases.forEach((phase) => {
        const phaseTaskId = `${slug}-phase-${phase.phase}`;

        roadmapPhaseTasks.push({
          id: phaseTaskId,
          title: `${phase.name}: ${phase.goal}`,
          workerType:
            phase.phase === 1
              ? "architect"
              : phase.phase === 4
                ? "tester"
                : phase.phase === 5
                  ? "documentation"
                  : "backend",
          dependencies:
            Array.isArray(phase.dependencies) &&
            phase.dependencies.length > 0
              ? phase.dependencies.map(
                  (dependencyPhase) =>
                    `${slug}-phase-${dependencyPhase}`
                )
              : [`${slug}-01`],
          allowedActions:
            phase.phase === 2 || phase.phase === 3
              ? ["read", "analyze", "plan", "propose_changes"]
              : ["read", "analyze", "validate", "summarize"],
          blockedActions: [
            "commit",
            "merge",
            "deploy",
            "paid_api",
            "write_source"
          ],
          approvalRequired: true,
          phase: phase.phase,
          phaseTasks: Array.isArray(phase.tasks)
            ? phase.tasks
            : []
        });
      });
    }

    tasks.push(...roadmapPhaseTasks);

    tasks.push({
      id: `${slug}-04`,
      title: "Define validation checks and read-only test strategy",
      workerType: "tester",
      dependencies: tasks.map((task) => task.id),
      allowedActions: [
        "read",
        "run_tests",
        "run_syntax_checks",
        "verify_quality"
      ],
      blockedActions: [
        "commit",
        "merge",
        "deploy",
        "paid_api",
        "write_source"
      ],
      approvalRequired: true
    });

    tasks.push({
      id: `${slug}-05`,
      title:
        "Review the merged proposal for safety and approval boundaries",
      workerType: "reviewer",
      dependencies: [`${slug}-04`],
      allowedActions: [
        "read",
        "review",
        "validate",
        "approve_readonly"
      ],
      blockedActions: [
        "commit",
        "merge",
        "deploy",
        "paid_api",
        "write_source"
      ],
      approvalRequired: true
    });

    tasks.push({
      id: `${slug}-06`,
      title: "Prepare a founder-facing implementation report",
      workerType: "documentation",
      dependencies: [`${slug}-05`],
      allowedActions: [
        "read",
        "summarize",
        "draft_docs",
        "prepare_reports"
      ],
      blockedActions: [
        "commit",
        "merge",
        "deploy",
        "paid_api",
        "write_source"
      ],
      approvalRequired: true
    });

    return tasks;
  }

  _dependencyOrder(tasks = []) {
    const order = [];
    const visiting = new Set();
    const visited = new Set();
    const byId = new Map(
      tasks.map((task) => [task.id, task])
    );

    function visit(task) {
      if (!task || visited.has(task.id)) {
        return;
      }

      if (visiting.has(task.id)) {
        throw new Error(
          `Circular task dependency detected at ${task.id}.`
        );
      }

      visiting.add(task.id);

      (task.dependencies || []).forEach((dependencyId) => {
        visit(byId.get(dependencyId));
      });

      visiting.delete(task.id);
      visited.add(task.id);
      order.push(task.id);
    }

    tasks.forEach(visit);
    return order;
  }

  _normalizeGoal(goalInput) {
    if (typeof goalInput === "string") {
      return goalInput.trim();
    }

    return String(
      goalInput &&
      (goalInput.rawGoal ||
        goalInput.goal ||
        goalInput.mission)
        ? goalInput.rawGoal ||
            goalInput.goal ||
            goalInput.mission
        : ""
    ).trim();
  }

  plan(goalInput, context = {}) {
    const goalText = this._normalizeGoal(goalInput);

    if (!goalText) {
      throw new Error(
        "MultiBrainPlanner requires a founder-approved development goal."
      );
    }

    const engineeringRoadmap =
      this.engineeringDirector.plan(goalInput, context);

    const selectedBrains = this._selectBrains(goalText);
    const tasks = this._buildTasks(
      goalText,
      engineeringRoadmap
    );

    return {
      engine: "GARUDA MultiBrainPlanner",
      goal: goalText,
      project: engineeringRoadmap.project,
      mission: engineeringRoadmap.mission,
      founderApprovalRequired: true,
      selectedBrains,
      tasks,
      dependencyOrder: this._dependencyOrder(tasks),
      engineeringRoadmap,
      validation: {
        status: "PENDING_REVIEW",
        requiredBrains: ["reviewer"],
        approvalRequired: true,
        founderApprovalRequired: true
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        readOnly: true,
        context,
        directorFingerprint:
          engineeringRoadmap.fingerprint
      }
    };
  }
}

module.exports = MultiBrainPlanner;
module.exports.MultiBrainPlanner = MultiBrainPlanner;