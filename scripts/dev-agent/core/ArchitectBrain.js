const crypto = require("crypto");
const { validateProposal } = require("./EngineeringProposalPolicy");

const MAX_GOAL_LENGTH = 1000;
const BLOCKED_ACTIONS = Object.freeze(["write_source", "arbitrary_code_execution", "commit", "push", "merge", "deploy", "paid_api"]);

function boundedText(value, name, maxLength = MAX_GOAL_LENGTH) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`${name} is required`);
  if (text.length > maxLength) throw new Error(`${name} exceeds ${maxLength} characters`);
  return text;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "architecture";
}

function dependencyOrder(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visiting = new Set();
  const visited = new Set();
  const order = [];
  function visit(task) {
    if (visited.has(task.id)) return;
    if (visiting.has(task.id)) throw new Error(`Circular architecture dependency: ${task.id}`);
    visiting.add(task.id);
    for (const dependency of task.dependencies) {
      if (!byId.has(dependency)) throw new Error(`Unknown architecture dependency: ${dependency}`);
      visit(byId.get(dependency));
    }
    visiting.delete(task.id);
    visited.add(task.id);
    order.push(task.id);
  }
  tasks.forEach(visit);
  return order;
}

function task(id, title, brain, dependencies, deliverable) {
  return {
    id,
    title,
    brain,
    dependencies,
    deliverable,
    allowedActions: ["read", "analyze", "plan", "propose", "validate"],
    blockedActions: BLOCKED_ACTIONS,
    founderApprovalRequiredForWriteOutcome: true
  };
}

class ArchitectBrain {
  plan(request = {}) {
    const goal = boundedText(request.goal || request.mission, "Architecture goal");
    const goalId = boundedText(request.goalId || slug(goal), "goalId", 120);
    const domain = String(request.domain || "engineering").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 50) || "engineering";
    let engineeringHandoff = null;
    if (request.engineeringSpec) {
      engineeringHandoff = validateProposal({
        schemaVersion: "1.0",
        intentId: `${goalId}-engineering`,
        summary: `Architect-proposed bounded artifact for ${goalId}`,
        confidence: Number.isFinite(request.confidence) ? request.confidence : null,
        artifactSpec: request.engineeringSpec
      });
    }

    const prefix = slug(goalId);
    const tasks = [
      task(`${prefix}-01`, "Inspect the current implementation surface", "architect", [], "repository_surface_report"),
      task(`${prefix}-02`, "Define boundaries, contracts, and acceptance criteria", "architect", [`${prefix}-01`], "architecture_contract"),
      task(`${prefix}-03`, engineeringHandoff ? "Prepare bounded Engineering Brain specification" : "Prepare analysis-only implementation proposal", engineeringHandoff ? "engineering" : "architect", [`${prefix}-02`], engineeringHandoff ? "validated_engineering_spec" : "implementation_proposal"),
      task(`${prefix}-04`, "Define real validation evidence requirements", "tester", [`${prefix}-03`], "test_evidence_plan"),
      task(`${prefix}-05`, "Review risks, evidence, and governance boundaries", "reviewer", [`${prefix}-04`], "technical_review_verdict"),
      task(`${prefix}-06`, "Prepare Founder decision checkpoint", "documentation", [`${prefix}-05`], "founder_review_packet")
    ];
    const risks = [
      { id: "SCOPE_DRIFT", level: "medium", mitigation: "Keep execution limited to the approved goal and declared deliverables." },
      { id: "ARCHITECTURE_CONFLICT", level: "high", mitigation: "Inspect existing contracts before proposing integration." },
      { id: "UNVERIFIED_IMPLEMENTATION", level: "high", mitigation: "Require Tester evidence and Reviewer verdict before Founder review." },
      { id: "UNAPPROVED_WRITE", level: "critical", mitigation: "Keep source, Git, deployment, spending, and external actions blocked." }
    ];
    if (domain === "revenue") risks.push({ id: "REVENUE_COMPLIANCE", level: "high", mitigation: "Require lawful source verification and separate approval for financial or external action." });

    const payload = {
      engine: "GARUDA Architect Brain v1",
      status: "PLAN_READY_FOR_REVIEW",
      goalId,
      goal,
      domain,
      selectedBrains: Array.from(new Set(tasks.map((item) => item.brain))),
      tasks,
      dependencyOrder: dependencyOrder(tasks),
      risks,
      engineeringHandoff,
      governance: {
        readOnlyPlan: true,
        sourceWriteAllowed: false,
        commitPushDeployAllowed: false,
        externalActionAllowed: false,
        founderApprovalRequired: true,
        reviewerVerdictRequired: true
      }
    };
    return {
      ...payload,
      planId: crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = ArchitectBrain;
module.exports.ArchitectBrain = ArchitectBrain;
module.exports.BLOCKED_ACTIONS = BLOCKED_ACTIONS;
module.exports.dependencyOrder = dependencyOrder;
