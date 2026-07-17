const crypto = require("crypto");

class EngineeringDirector {
  constructor({ workerRouter = null, approvalGate = null } = {}) {
    this.workerRouter = workerRouter;
    this.approvalGate = approvalGate;
  }

  normalizeGoal(goalInput) {
    if (typeof goalInput === "string") {
      return {
        rawGoal: goalInput.trim(),
        project: this.inferProject(goalInput),
        mission: goalInput.trim()
      };
    }

    const rawGoal = String(
      (goalInput && (goalInput.rawGoal || goalInput.goal || goalInput.mission)) || ""
    ).trim();

    return {
      rawGoal,
      project:
        (goalInput && goalInput.project) ||
        this.inferProject(rawGoal),
      mission:
        (goalInput && goalInput.mission) ||
        rawGoal
    };
  }

  inferProject(goalText = "") {
    const text = String(goalText).toLowerCase();

    if (text.includes("affiliate")) return "GARUDA Affiliate Engine";
    if (text.includes("insurance")) return "GARUDA Insurance Universe";
    if (text.includes("revenue")) return "GARUDA Revenue Universe";
    if (text.includes("mother") || text.includes("brain")) return "GARUDA Mother Brain";
    if (text.includes("security")) return "GARUDA Security Universe";
    if (text.includes("creative")) return "GARUDA Creative Universe";
    if (text.includes("travel")) return "GARUDA Travel Universe";

    return "GARUDA Engineering Project";
  }

  buildPhases(goalText = "") {
    const text = String(goalText).toLowerCase();

    const phases = [
      {
        phase: 1,
        name: "Discovery and Architecture",
        goal: "Understand the goal, inspect the current repository, and define the target architecture.",
        tasks: [
          "Analyze current project structure",
          "Identify reusable modules",
          "Identify missing modules",
          "Define architecture boundaries",
          "Define validation requirements"
        ],
        dependencies: []
      },
      {
        phase: 2,
        name: "Core Implementation",
        goal: "Build the minimum complete backend and domain logic required for the requested capability.",
        tasks: [
          "Create core services",
          "Create orchestration layer",
          "Create data contracts",
          "Add policy and approval checks",
          "Add error handling"
        ],
        dependencies: [1]
      },
      {
        phase: 3,
        name: "Integration",
        goal: "Connect the new capability with GARUDA Mother, workers, memory, and reporting.",
        tasks: [
          "Integrate with EngineeringManager",
          "Integrate with WorkforceRouter",
          "Integrate with ProjectMemoryEngine",
          "Integrate with Reporter",
          "Add runtime configuration"
        ],
        dependencies: [2]
      },
      {
        phase: 4,
        name: "Validation",
        goal: "Verify syntax, behavior, governance, and safe execution.",
        tasks: [
          "Run syntax checks",
          "Run unit validation",
          "Run integration validation",
          "Verify approval boundaries",
          "Verify zero-cost policy"
        ],
        dependencies: [3]
      },
      {
        phase: 5,
        name: "Delivery",
        goal: "Prepare a founder-reviewable result with clear changes, risks, and next actions.",
        tasks: [
          "Generate implementation report",
          "List created and modified files",
          "List unresolved risks",
          "Prepare approval checkpoint",
          "Prepare commit recommendation"
        ],
        dependencies: [4]
      }
    ];

    if (text.includes("affiliate")) {
      phases[1].tasks.push(
        "Create affiliate source registry",
        "Create campaign tracking service",
        "Create conversion attribution service",
        "Create commission ledger"
      );
    }

    if (text.includes("insurance")) {
      phases[1].tasks.push(
        "Create policy knowledge workflow",
        "Create lead qualification workflow",
        "Create compliant recommendation boundary"
      );
    }

    if (text.includes("security")) {
      phases[1].tasks.push(
        "Create threat detection workflow",
        "Create isolation workflow",
        "Create forensic reporting workflow"
      );
    }

    return phases;
  }

  buildWorkers(phases = []) {
    const assignments = [];

    for (const phase of phases) {
      let preferredWorker = "local_brain_worker";
      let fallbackWorkers = ["aider", "gemini", "cline", "copilot"];

      if (phase.phase === 2 || phase.phase === 3) {
        preferredWorker = "aider";
        fallbackWorkers = ["cline", "gemini", "local_brain_worker"];
      } else if (phase.phase === 4) {
        preferredWorker = "local_brain_worker";
        fallbackWorkers = ["aider", "cline"];
      } else if (phase.phase === 5) {
        preferredWorker = "local_brain_worker";
        fallbackWorkers = ["gemini", "aider"];
      }

      assignments.push({
        phase: phase.phase,
        preferredWorker,
        fallbackWorkers,
        approvalRequired: phase.phase === 2 || phase.phase === 3,
        allowedActions:
          phase.phase === 2 || phase.phase === 3
            ? ["read", "analyze", "plan", "write", "validate"]
            : ["read", "analyze", "plan", "validate", "summarize"],
        blockedActions: ["deploy", "push", "merge_without_approval", "paid_api"]
      });
    }

    return assignments;
  }

  buildRisks(goalText = "") {
    const risks = [
      {
        id: "RISK_SCOPE_DRIFT",
        level: "medium",
        description: "The implementation may expand beyond the requested goal.",
        mitigation: "Keep all work phase-scoped and approval-gated."
      },
      {
        id: "RISK_ARCHITECTURE_BREAK",
        level: "high",
        description: "New modules may conflict with existing GARUDA architecture.",
        mitigation: "Reuse existing modules and validate integration before writing."
      },
      {
        id: "RISK_UNAPPROVED_WRITE",
        level: "critical",
        description: "A worker may attempt file changes without founder approval.",
        mitigation: "Block write operations until approval is explicitly present."
      },
      {
        id: "RISK_EXTERNAL_COST",
        level: "high",
        description: "External AI execution may create paid usage.",
        mitigation: "Allow only zero-cost or explicitly approved free-credit execution."
      }
    ];

    if (String(goalText).toLowerCase().includes("revenue")) {
      risks.push({
        id: "RISK_FINANCIAL_COMPLIANCE",
        level: "high",
        description: "Revenue workflows may require legal, tax, payment, or platform compliance.",
        mitigation: "Use verified rules and require founder approval for financial execution."
      });
    }

    return risks;
  }

  createFingerprint(payload) {
    return crypto
      .createHash("sha1")
      .update(JSON.stringify(payload))
      .digest("hex");
  }

  createEngineeringRoadmap(goalInput, context = {}) {
    const normalized = this.normalizeGoal(goalInput);

    if (!normalized.rawGoal) {
      throw new Error("EngineeringDirector requires a valid goal.");
    }

    const phases = this.buildPhases(normalized.rawGoal);
    const workers = this.buildWorkers(phases);
    const risks = this.buildRisks(normalized.rawGoal);

    const roadmap = {
      project: normalized.project,
      mission: normalized.mission,
      rawGoal: normalized.rawGoal,
      mode: "autonomous_engineering",
      status: "PLANNED",
      approvalRequired: true,
      founderApprovalStatus: "NOT_APPROVED",
      phases,
      workers,
      dependencies: phases.map((phase) => ({
        phase: phase.phase,
        dependsOn: phase.dependencies
      })),
      risks,
      governance: {
        founderApprovalRequiredForWrites: true,
        paidApiAllowed: false,
        autoCommitAllowed: false,
        autoPushAllowed: false,
        autoDeployAllowed: false
      },
      validation: {
        required: true,
        commands: [
          "node --check scripts/dev-agent/core/EngineeringDirector.js",
          "node --check scripts/dev-agent/core/EngineeringManager.js",
          "node scripts/mother/mother.js"
        ]
      },
      context: {
        currentBranch: context.currentBranch || "unknown",
        rootDir: context.rootDir || process.cwd(),
        scanSummary: context.scanSummary || {}
      },
      createdAt: new Date().toISOString()
    };

    roadmap.fingerprint = this.createFingerprint(roadmap);

    return roadmap;
  }

  approveRoadmap(roadmap, approval = {}) {
    if (!roadmap || typeof roadmap !== "object") {
      throw new Error("A valid engineering roadmap is required.");
    }

    const founderApproved =
      approval.founderApproved === true ||
      Boolean(approval.founderApprovalToken);

    return {
      ...roadmap,
      founderApprovalStatus: founderApproved ? "APPROVED" : "NOT_APPROVED",
      status: founderApproved ? "READY_FOR_EXECUTION" : "WAITING_FOR_APPROVAL",
      writeAllowed: founderApproved,
      approval: {
        allowed: founderApproved,
        status: founderApproved ? "APPROVED" : "BLOCKED_BY_APPROVAL",
        reason: founderApproved
          ? "Founder approval verified."
          : "Founder approval is required before write execution."
      }
    };
  }

  plan(goalInput, context = {}) {
    return this.createEngineeringRoadmap(goalInput, context);
  }
}

module.exports = EngineeringDirector;
module.exports.EngineeringDirector = EngineeringDirector;