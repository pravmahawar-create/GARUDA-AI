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
      text.includes("creative") ||
      text.includes("ad copy") ||
      text.includes("campaign") ||
      text.includes("concept") ||
      text.includes("storyboard")
    ) {
      brains.splice(1, 0, "creative");
    }

    if (
      text.includes("content") ||
      text.includes("calendar") ||
      text.includes("social") ||
      text.includes("editorial") ||
      text.includes("reels")
    ) {
      brains.splice(1, 0, "content");
    }

    if (
      text.includes("brand") ||
      text.includes("identity") ||
      text.includes("logo") ||
      text.includes("typography") ||
      text.includes("style")
    ) {
      brains.splice(1, 0, "brand");
    }

    if (
      text.includes("seo") ||
      text.includes("search") ||
      text.includes("topic cluster") ||
      text.includes("landing") ||
      text.includes("presence")
    ) {
      brains.splice(1, 0, "digital_presence");
    }

    if (
      text.includes("real estate") ||
      text.includes("property") ||
      text.includes("builder") ||
      text.includes("site visit") ||
      text.includes("rera")
    ) {
      brains.splice(1, 0, "real_estate");
    }

    if (
      text.includes("research") ||
      text.includes("market study") ||
      text.includes("analysis") ||
      text.includes("synthesis")
    ) {
      brains.splice(1, 0, "research");
    }

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
          "Scan the repository and requirements surface to identify the architecture context",
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

    if (/creative|ad copy|campaign|concept|hook/i.test(text)) {
      tasks.push({
        id: `${slug}-creative-01`,
        title: "Synthesize multimodal creative brief and 5-angle ad copy hooks",
        workerType: "creative",
        dependencies: [`${slug}-01`],
        allowedActions: ["read", "generate_brief", "generate_copy_angles", "orchestrate_concept"],
        blockedActions: ["commit", "merge", "deploy"],
        approvalRequired: true
      });
    }

    if (/content|calendar|social|editorial|reels|shorts/i.test(text)) {
      tasks.push({
        id: `${slug}-content-01`,
        title: "Generate 4-week multi-phase editorial calendar and social content pillars",
        workerType: "content",
        dependencies: tasks.map(t => t.id),
        allowedActions: ["read", "generate_calendar", "generate_pillars", "draft_scripts"],
        blockedActions: ["commit", "merge", "deploy"],
        approvalRequired: true
      });
    }

    if (/brand|identity|logo|typography|tone/i.test(text)) {
      tasks.push({
        id: `${slug}-brand-01`,
        title: "Establish IdentityLock™ brand tokens, tone-of-voice rules, and compliance gates",
        workerType: "brand",
        dependencies: [`${slug}-01`],
        allowedActions: ["read", "validate_brand", "build_tokens", "generate_white_pdf"],
        blockedActions: ["commit", "merge", "deploy"],
        approvalRequired: true
      });
    }

    if (/seo|search|topic cluster|landing|presence|website/i.test(text)) {
      tasks.push({
        id: `${slug}-presence-01`,
        title: "Formulate SEO topic clusters and high-converting landing page conversion blueprint",
        workerType: "digital_presence",
        dependencies: tasks.map(t => t.id),
        allowedActions: ["read", "map_keywords", "generate_landing_blueprint"],
        blockedActions: ["commit", "merge", "deploy"],
        approvalRequired: true
      });
    }

    if (/real estate|property|builder|inventory|site visit/i.test(text)) {
      tasks.push({
        id: `${slug}-re-01`,
        title: "Evaluate project intelligence, corridor trends, buyer personas, and site visit funnel",
        workerType: "real_estate",
        dependencies: [`${slug}-01`],
        allowedActions: ["read", "analyze_project", "qualify_leads", "book_walkthrough"],
        blockedActions: ["commit", "merge", "deploy"],
        approvalRequired: true
      });
    }

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
      id: `${slug}-qa`,
      title: "Define validation checks and automated test verification suite",
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
      id: `${slug}-review`,
      title:
        "Review the merged deliverables for safety and governance boundaries",
      workerType: "reviewer",
      dependencies: [`${slug}-qa`],
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
      id: `${slug}-doc`,
      title: "Prepare a client-facing delivery package and executive white documentation",
      workerType: "documentation",
      dependencies: [`${slug}-review`],
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