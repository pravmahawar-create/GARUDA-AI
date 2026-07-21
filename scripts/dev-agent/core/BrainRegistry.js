const TRUSTED_WORKERS = [
  {
    type: "architect",
    label: "Architect Brain",
    capabilities: ["system_mapping", "task_decomposition", "dependency_planning", "risk_review"],
    riskLevel: "medium",
    approvalRequired: true,
    allowedActions: ["read", "analyze", "decompose", "design", "map_dependencies"],
    blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source", "push"]
  },
  {
    type: "frontend",
    label: "Frontend Brain",
    capabilities: ["ui_shell_review", "component_planning", "layout_breakdown", "responsive_analysis"],
    riskLevel: "medium",
    approvalRequired: true,
    allowedActions: ["read", "inspect_ui", "suggest_components", "run_ui_checks"],
    blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source", "push"]
  },
  {
    type: "backend",
    label: "Backend Brain",
    capabilities: ["api_surface_review", "data_flow_analysis", "service_planning", "integration_mapping"],
    riskLevel: "medium",
    approvalRequired: true,
    allowedActions: ["read", "inspect_api", "suggest_routes", "map_services"],
    blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source", "push"]
  },
  {
    type: "tester",
    label: "Tester Brain",
    capabilities: ["syntax_checks", "real_test_execution", "execution_evidence", "quality_gate_analysis", "risk_verification"],
    riskLevel: "low",
    approvalRequired: true,
    allowedActions: ["read", "run_tests", "run_syntax_checks", "verify_quality"],
    blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source", "push"]
  },
  {
    type: "reviewer",
    label: "Reviewer Brain",
    capabilities: ["proposal_review", "risk_assessment", "approval_gate_check", "merge_readiness_review"],
    riskLevel: "low",
    approvalRequired: true,
    allowedActions: ["read", "review", "validate", "approve_readonly"],
    blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source", "push"]
  },
  {
    type: "documentation",
    label: "Documentation Brain",
    capabilities: ["document_planning", "report_drafting", "change_summaries", "knowledge_capture"],
    riskLevel: "low",
    approvalRequired: true,
    allowedActions: ["read", "summarize", "draft_docs", "prepare_reports"],
    blockedActions: ["commit", "merge", "deploy", "paid_api", "write_source", "push"]
  }
];

class BrainRegistry {
  constructor() {
    this.workers = new Map();
    TRUSTED_WORKERS.forEach((worker) => this.registerWorker(worker));
  }

  registerWorker(worker) {
    if (!worker || typeof worker !== "object" || !worker.type) {
      throw new Error("BrainRegistry requires a worker definition with a type.");
    }

    const normalized = {
      ...worker,
      approvalRequired: true,
      blockedActions: Array.from(new Set([...(worker.blockedActions || []), "commit", "merge", "deploy", "paid_api", "push", "write_source"])),
      allowedActions: Array.from(new Set(worker.allowedActions || []))
    };

    this.workers.set(normalized.type, normalized);
    return normalized;
  }

  getWorker(type) {
    return this.workers.get(type) || null;
  }

  getTrustedWorkers() {
    return Array.from(this.workers.values()).map((worker) => ({ ...worker }));
  }

  hasWorker(type) {
    return this.workers.has(type);
  }
}

const brainRegistry = new BrainRegistry();

module.exports = BrainRegistry;
module.exports.BrainRegistry = BrainRegistry;
module.exports.brainRegistry = brainRegistry;
