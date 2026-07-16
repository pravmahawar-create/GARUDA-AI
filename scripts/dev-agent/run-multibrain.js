const { scan } = require("../mother/scanner");
const { report } = require("../mother/reporter");
const EngineeringManager = require("./core/EngineeringManager");
const { brainRegistry } = require("./core/BrainRegistry");
const { MultiBrainPlanner } = require("./core/MultiBrainPlanner");
const { BrainCoordinator } = require("./core/BrainCoordinator");
const { developmentApprovalGate } = require("./core/DevelopmentApprovalGate");
const { ProjectMemoryEngine } = require("./core/ProjectMemoryEngine");
const LocalBrainWorker = require("./workers/LocalBrainWorker");

function parseGoalFromArgv() {
  const goal = process.argv.slice(2).join(" ").trim();

  if (!goal) {
    throw new Error('Provide a founder-approved goal, for example: npm run dev:multibrain -- "Build GARUDA dashboard home"');
  }

  return goal;
}

function buildReadOnlyAnalysis(rootDir) {
  const architect = new LocalBrainWorker({ role: "architect", rootDir });

  return {
    projectStructure: architect.readProjectStructure(2),
    fileSample: architect.scanFiles([]).slice(0, 30),
    reportDraft: architect.prepareReports({ summary: "Read-only local analysis complete." })
  };
}

function buildWorkflowProgress(orchestration, coordination) {
  const stepOneDone = Boolean(orchestration && orchestration.plan);
  const stepTwoDone = Boolean(orchestration && orchestration.coordination);
  const stepThreeDone = Boolean(
    coordination &&
    coordination.writeStopped === true &&
    coordination.approval &&
    coordination.approval.status === "BLOCKED_BY_APPROVAL"
  );

  const completedSteps = [stepOneDone, stepTwoDone, stepThreeDone].filter(Boolean).length;

  return {
    completedSteps,
    totalSteps: 3,
    status: completedSteps === 3 ? "Completed (3/3)" : `In Progress (${completedSteps}/3)`,
    steps: [
      {
        step: 1,
        name: "Multi-brain plan generation",
        status: stepOneDone ? "COMPLETED" : "PENDING"
      },
      {
        step: 2,
        name: "Coordinator integration",
        status: stepTwoDone ? "COMPLETED" : "PENDING"
      },
      {
        step: 3,
        name: "Final verification and founder stop gate",
        status: stepThreeDone ? "COMPLETED" : "PENDING"
      }
    ]
  };
}

async function main() {
  const goal = parseGoalFromArgv();
  const memoryEngine = new ProjectMemoryEngine();
  const memoryMatches = memoryEngine.findSimilarGoal(goal);
  const latestExact = memoryMatches.exactMatches[0] || null;

  if (latestExact) {
    const isIncomplete = latestExact.workflowStatus !== "Completed (3/3)" || !latestExact.completedAt;

    if (isIncomplete) {
      const resumeOutput = {
        status: "RESUME_AVAILABLE",
        goal,
        record: latestExact,
        message: "An interrupted goal exists. Resume is available from project memory."
      };

      console.log(JSON.stringify(resumeOutput, null, 2));
      return;
    }

    if (latestExact.workflowStatus === "Completed (3/3)") {
      const completedOutput = {
        status: "ALREADY_COMPLETED",
        goal,
        record: latestExact,
        message: "The same completed goal already exists in project memory."
      };

      console.log(JSON.stringify(completedOutput, null, 2));
      return;
    }
  }

  const readOnlyAnalysis = buildReadOnlyAnalysis(process.cwd());

  const planner = new MultiBrainPlanner({ registry: brainRegistry });
  const coordinator = new BrainCoordinator({
    registry: brainRegistry,
    approvalGate: developmentApprovalGate
  });

  const manager = new EngineeringManager({
    scanner: { scan },
    planner,
    dispatcher: null,
    validator: { validateGoal: () => true },
    reporter: { report },
    multiBrainPlanner: planner,
    brainCoordinator: coordinator,
    approvalGate: developmentApprovalGate
  });

  const orchestration = await manager.manageMultiBrainGoal(goal, {
    context: {
      analysis: readOnlyAnalysis
    },
    approval: {
      founderApprovalToken: null,
      founderApproved: false,
      intendedOperation: "read_only_plan"
    }
  });

  const plan = orchestration.plan;
  const coordination = orchestration.coordination;
  const projectScan = orchestration.scanResult;
  const workflow = buildWorkflowProgress(orchestration, coordination);
  const nextAction = coordination.writeStopped ? "await_founder_approval" : "ready_for_write";

  const memorySave = memoryEngine.saveRecord({
    goal: plan.goal,
    createdAt: new Date().toISOString(),
    completedAt: workflow.status === "Completed (3/3)" ? new Date().toISOString() : null,
    selectedBrains: coordination.selectedBrains,
    taskPlan: {
      tasks: coordination.tasks,
      dependencyOrder: plan.dependencyOrder
    },
    validationStatus: coordination.validationStatus,
    workflowStatus: workflow.status,
    approvalStatus: coordination.approval.status,
    filesCreated: coordination.filesCreated || [],
    filesModified: coordination.filesModified || [],
    failures: coordination.failures || [],
    nextAction
  });

  const artifact = report({
    scanResult: projectScan,
    validation: {
      passed: coordination.validationStatus === "VALIDATED_READONLY",
      status: coordination.validationStatus,
      issues: coordination.writeStopped ? [coordination.stopReason] : []
    },
    governance: {
      status: coordination.approval.status,
      reason: coordination.approval.reason
    },
    nextAction,
    multiBrain: {
      goal: plan.goal,
      selectedBrains: coordination.selectedBrains,
      tasks: coordination.tasks,
      dependencyOrder: plan.dependencyOrder,
      validation: {
        status: coordination.validationStatus,
        approvalStatus: coordination.approval.status
      },
      founderApprovalRequired: true,
      unifiedImplementationProposal: coordination.unifiedImplementationProposal,
      writeStopped: coordination.writeStopped,
      stopReason: coordination.stopReason,
      workflow
    },
    memory: {
      status: memorySave.status,
      recordFingerprint: memorySave.planFingerprint,
      filePath: memoryEngine.memoryFilePath
    },
    persistReport: false
  });

  const output = {
    goal: plan.goal,
    plan,
    coordination,
    orchestration,
    workflow,
    memory: {
      status: memorySave.status,
      recordFingerprint: memorySave.planFingerprint,
      latest: memorySave.record
    },
    report: artifact
  };

  console.log(JSON.stringify(output, null, 2));
  console.log(`\n[MultiBrain] Workflow Status: ${workflow.status}`);

  if (coordination.writeStopped) {
    console.log("\n[MultiBrain] Execution stopped before any write operation because founder approval is required.");
  }
}

main().catch((error) => {
  console.error("[MultiBrain] Failed:", error.message);
  process.exitCode = 1;
});