const fs = require("fs");
const path = require("path");
const { scan } = require("./scanner");
const { think } = require("./thinker");
const { decide } = require("./decision");
const { plan } = require("./planner");
const { execute } = require("./executor");
const { build } = require("./builder");
const { validate } = require("./validator");
const { report } = require("./reporter");
const { loadConstitution } = require("./constitution");
const { getContext } = require("./context");

const { understandGoal } = require("./goalEngine");
const { decompose } = require("./taskDecomposer");
const { prioritize } = require("./priorityEngine");
const EngineeringManager = require("../dev-agent/core/EngineeringManager");
const WorkerDispatcher = require("../dev-agent/core/WorkerDispatcher");

const { ProjectMemoryEngine } = require("../dev-agent/core/ProjectMemoryEngine");
const { brainRegistry } = require("../dev-agent/core/BrainRegistry");
const { MultiBrainPlanner } = require("../dev-agent/core/MultiBrainPlanner");
const { BrainCoordinator } = require("../dev-agent/core/BrainCoordinator");
const { developmentApprovalGate } = require("../dev-agent/core/DevelopmentApprovalGate");
const { GarudaBibleLoader } = require("../dev-agent/core/GarudaBibleLoader");
const { GarudaBibleValidator } = require("../dev-agent/core/GarudaBibleValidator");
const { WorkerContextCompiler } = require("../dev-agent/core/WorkerContextCompiler");
const { CostGuard } = require("../dev-agent/core/CostGuard");
const { WorkforceRouter } = require("../dev-agent/core/WorkforceRouter");
const { PromptBuilder } = require("../dev-agent/core/PromptBuilder");
const { ExternalWorkerAdapter, SUPPORTED_WORKERS, EXECUTION_MODE } = require("../dev-agent/core/ExternalWorkerAdapter");
const LocalBrainWorker = require("../dev-agent/workers/LocalBrainWorker");
const { RevenueBridgeClient } = require("../../src/services/revenueBridgeClient");
const {
  SELF_DEVELOPMENT_TARGET_SOURCE,
  groundSelfDevelopmentGoal,
  buildSelfDevelopmentPlannedTasks,
  compareCapabilitySnapshots,
  getCurrentBodyState,
  resolvePreviousMissionEvidence
} = require("./bodyAwareness");

function buildReadOnlyAnalysis(rootDir) {
  const architect = new LocalBrainWorker({ role: "architect", rootDir });

  return {
    projectStructure: architect.readProjectStructure(2),
    fileSample: architect.scanFiles([]).slice(0, 30),
    reportDraft: architect.prepareReports({ summary: "Mother read-only local analysis complete." })
  };
}

function buildWorkflowProgress(orchestration, coordination) {
  const planned = Boolean(orchestration && orchestration.plan);
  const coordinated = Boolean(orchestration && orchestration.coordination);

  const approvalBlocked = Boolean(
    coordination &&
    coordination.writeStopped === true &&
    coordination.approval &&
    coordination.approval.status === "BLOCKED_BY_APPROVAL"
  );

  if (approvalBlocked) {
    return {
      completedSteps: 2,
      totalSteps: 3,
      status: "Waiting for Founder Approval"
    };
  }

  const completedSteps = [planned, coordinated].filter(Boolean).length;

  if (completedSteps === 2) {
    return {
      completedSteps: 2,
      totalSteps: 3,
      status: "Ready for Execution"
    };
  }

  return {
    completedSteps,
    totalSteps: 3,
    status: `In Progress (${completedSteps}/3)`
  };
}

function buildRequiredBibleChapters(goalInput) {
  const text = String(goalInput || "").toLowerCase();
  const chapters = new Set(["02_CONSTITUTION", "03_FOUNDER_PRINCIPLES"]);

  if (text.includes("architecture") || text.includes("mother") || text.includes("brain") || text.includes("engineer")) {
    chapters.add("04_SYSTEM_ARCHITECTURE");
    chapters.add("05_BRAIN_STANDARD");
    chapters.add("07_ENGINEERING_STANDARD");
  }

  if (text.includes("worker") || text.includes("dispatch")) {
    chapters.add("06_WORKER_STANDARD");
    chapters.add("07_ENGINEERING_STANDARD");
  }

  if (text.includes("security")) {
    chapters.add("11_SECURITY");
  }

  if (text.includes("memory")) {
    chapters.add("08_MEMORY_STANDARD");
  }

  return Array.from(chapters);
}

function buildDispatchPreview(goalInput, goal, tasks) {
  const text = String(goalInput || "").toLowerCase();
  const dispatcher = new WorkerDispatcher();

  let type = "feature";
  if (text.includes("security")) {
    type = "security";
  } else if (text.includes("architecture") || goal.domain === "mother") {
    type = "architecture";
  } else if (text.includes("refactor")) {
    type = "refactor";
  } else if (text.includes("docs") || text.includes("document")) {
    type = "documentation";
  }

  const risk = goal.priority === "critical" ? "high" : (goal.priority === "high" ? "medium" : "low");

  return dispatcher.dispatch({
    type,
    risk,
    files: Array.isArray(tasks) ? tasks : [],
    budget: { mode: "read_only" }
  });
}

function buildTaskProfile(goalInput, goal, tasks, scanResult) {
  const text = String(goalInput || "").toLowerCase();
  let type = "feature";

  if (text.includes("security")) {
    type = "security";
  } else if (text.includes("architecture") || goal.domain === "mother") {
    type = "architecture";
  } else if (text.includes("refactor")) {
    type = "refactor";
  } else if (text.includes("core")) {
    type = "core";
  } else if (text.includes("doc")) {
    type = "documentation";
  }

  const risk = goal.priority === "critical" ? "high" : (goal.priority === "high" ? "medium" : "low");
  const files = Array.isArray(tasks) ? tasks.map((task) => String(task || "").replace(/\s+/g, "_").toLowerCase()) : [];
  const complexity = files.length >= 6 ? 4 : (files.length >= 4 ? 3 : (files.length >= 2 ? 2 : 1));

  return {
    goal: goalInput,
    rawGoal: goal && goal.rawGoal ? goal.rawGoal : goalInput,
    intent: goal && goal.intent ? goal.intent : "unknown",
    domain: goal && goal.domain ? goal.domain : "engineering",
    type,
    risk,
    files,
    fileCount: files.length,
    complexity,
    requiresWrite: hasWriteIntent(goalInput, tasks, goal),
    budget: { mode: "policy_guarded" },
    scanSummary: scanResult && scanResult.summary ? scanResult.summary : {}
  };
}

function hasWriteIntent(goalInput = "", plannedTasks = [], goal = {}) {
  if (goal && (goal.actionType === "analysis" || goal.intent === "read_only_audit")) {
    return false;
  }

  const text = String(goalInput || "").toLowerCase();
  const hasNegativeWriteConstraint =
    /\b(do not|don't|dont|no|without|zero|never|stop)\s+([a-z\s,]+)?\b(modify|modifying|edit|editing|write|writes|writing|change|changes|changing|patch|patching|create|creating|delete|deleting|commit|committing|push|pushing|file|files|anything|code)\b/i.test(text) ||
    /\b(read-only|read only|no writes|no write|without changing|without modifying|don't commit|don't push|don't modify|don't write|dont commit|dont push|dont modify|dont write)\b/i.test(text);

  if (hasNegativeWriteConstraint) {
    return false;
  }

  const pattern = /\b(implement|write|patch|modify|refactor|create|build|deploy|commit|push)\b/i;
  if (pattern.test(text)) {
    return true;
  }

  return Array.isArray(plannedTasks) && plannedTasks.some((item) => {
    const taskText = typeof item === "string" ? item : (item && item.task ? item.task : "");
    return pattern.test(String(taskText || ""));
  });
}

function shouldEngageRevenueBridge(goalInput = "", goal = {}) {
  if (goal && (goal.actionType === "analysis" || goal.intent === "read_only_audit")) {
    return false;
  }

  const text = `${goalInput} ${goal && goal.domain ? goal.domain : ""} ${goal && goal.intent ? goal.intent : ""}`.toLowerCase();
  return /(revenue|income|payout|settlement|client_deal|deal_tracker|affiliate_conversion)/.test(text);
}

function buildRevenueBridgeInput(goalInput = "", goal = {}, tasks = []) {
  const title = String(goalInput || "").trim().slice(0, 240) || "Revenue evaluation request";
  const taskTags = Array.isArray(tasks)
    ? tasks
      .map((task) => String(typeof task === "string" ? task : (task && task.task ? task.task : "")))
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9_+#.]+/)
      .filter((value) => value && value.length >= 4)
      .slice(0, 12)
    : [];

  return {
    missionId: goal && goal.intent ? String(goal.intent) : "mother-revenue-mission",
    title,
    description: String(goal && goal.rawGoal ? goal.rawGoal : goalInput || "").slice(0, 2000),
    location: "Remote",
    tags: taskTags,
    potentialValue: 10000
  };
}

function deriveRevenueBridgeNextAction(revenueBridge = {}) {
  if (!revenueBridge || revenueBridge.engaged !== true) {
    return null;
  }

  const evaluation = revenueBridge.evaluation;
  if (evaluation && evaluation.ok && evaluation.raw && evaluation.raw.suggestedNextAction) {
    return `revenue_${String(evaluation.raw.suggestedNextAction).trim().toLowerCase()}`;
  }

  if (evaluation && !evaluation.ok && evaluation.error && evaluation.error.code) {
    return `revenue_bridge_${String(evaluation.error.code).trim().toLowerCase()}`;
  }

  return null;
}

function summarizeEngineeringEvidence(executedTasks = []) {
  const evidenceItems = Array.isArray(executedTasks)
    ? executedTasks.map((task) => task && task.evidence).filter(Boolean)
    : [];

  const filesChanged = new Set();
  const testsDiscovered = [];
  const testsExecuted = [];
  const testResults = [];
  const failedEvidence = [];
  const capabilityAttribution = [];

  evidenceItems.forEach((item) => {
    (item.filesChanged || []).forEach((filePath) => filesChanged.add(filePath));
    (item.testsDiscovered || []).forEach((entry) => testsDiscovered.push(entry));
    (item.testsExecuted || []).forEach((entry) => testsExecuted.push(entry));
    (item.testResults || []).forEach((entry) => testResults.push(entry));
    if (item.capabilityAttribution) {
      capabilityAttribution.push(item.capabilityAttribution);
    }
    if (item.verification && item.verification.success === false) {
      failedEvidence.push(item);
    }
  });

  const relevantCapabilityChanges = capabilityAttribution.flatMap((entry) => Array.isArray(entry.relevantDiff) ? entry.relevantDiff : []);
  const unrelatedCapabilityChanges = capabilityAttribution.flatMap((entry) => Array.isArray(entry.unrelatedDiff) ? entry.unrelatedDiff : []);

  return {
    evidenceItems,
    filesChanged: Array.from(filesChanged),
    testsDiscovered,
    testsExecuted,
    testResults,
    failedEvidence,
    capabilityAttribution,
    relevantCapabilityChanges: Array.from(new Set(relevantCapabilityChanges)),
    unrelatedCapabilityChanges: Array.from(new Set(unrelatedCapabilityChanges))
  };
}

function propagateVerificationEvidenceToCapability(snapshot, capabilityId, engineeringEvidence) {
  if (!snapshot || !capabilityId || !engineeringEvidence) {
    return { snapshot, propagatedEvidence: null };
  }

  const capabilities = Array.isArray(snapshot.capabilities) ? snapshot.capabilities : [];
  const capabilityIndex = capabilities.findIndex((item) => item && item.id === capabilityId);
  if (capabilityIndex < 0) {
    return { snapshot, propagatedEvidence: null };
  }

  const currentEvidence = Array.isArray(capabilities[capabilityIndex].verificationEvidence)
    ? capabilities[capabilityIndex].verificationEvidence
    : [];

  const propagatedEvidence = {
    type: "mission_execution",
    id: `cycle_verification_${Date.now()}`,
    success: Array.isArray(engineeringEvidence.testsExecuted) && engineeringEvidence.testsExecuted.length > 0,
    details: {
      testsDiscovered: Array.isArray(engineeringEvidence.testsDiscovered) ? engineeringEvidence.testsDiscovered : [],
      testsExecuted: Array.isArray(engineeringEvidence.testsExecuted) ? engineeringEvidence.testsExecuted : [],
      testResults: Array.isArray(engineeringEvidence.testResults) ? engineeringEvidence.testResults : []
    }
  };

  const nextCapabilities = capabilities.map((item, index) => {
    if (index !== capabilityIndex) {
      return item;
    }

    return {
      ...item,
      verificationEvidence: [...currentEvidence, propagatedEvidence]
    };
  });

  return {
    snapshot: {
      ...snapshot,
      capabilities: nextCapabilities
    },
    propagatedEvidence
  };
}

function normalizeRepoPath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
}

function hasCapabilitySurfaceEvidenceImproved(beforeSnapshot, afterSnapshot, capabilityId, engineeringEvidence) {
  if (!beforeSnapshot || !afterSnapshot || !capabilityId || !engineeringEvidence) {
    return false;
  }

  const beforeCapability = Array.isArray(beforeSnapshot.capabilities)
    ? beforeSnapshot.capabilities.find((item) => item && item.id === capabilityId)
    : null;
  const afterCapability = Array.isArray(afterSnapshot.capabilities)
    ? afterSnapshot.capabilities.find((item) => item && item.id === capabilityId)
    : null;

  const implementationLocations = new Set([
    ...(beforeCapability && Array.isArray(beforeCapability.implementationLocations)
      ? beforeCapability.implementationLocations.map(normalizeRepoPath)
      : []),
    ...(afterCapability && Array.isArray(afterCapability.implementationLocations)
      ? afterCapability.implementationLocations.map(normalizeRepoPath)
      : [])
  ]);

  if (!implementationLocations.size) {
    return false;
  }

  const changedFiles = Array.isArray(engineeringEvidence.filesChanged)
    ? engineeringEvidence.filesChanged.map(normalizeRepoPath)
    : [];

  const touchedCapabilitySurface = changedFiles.some((changedFile) => implementationLocations.has(changedFile));
  const verificationExecuted = Array.isArray(engineeringEvidence.testsExecuted) && engineeringEvidence.testsExecuted.length > 0;
  const hasFailures = Array.isArray(engineeringEvidence.failedEvidence) && engineeringEvidence.failedEvidence.length > 0;

  return touchedCapabilitySurface && verificationExecuted && !hasFailures;
}

class Mother {
  async start(overrideGoal = null, options = {}) {
    console.log("🦅 GARUDA Mother Started\n");

    const {
      goalInput,
      constitution,
      context,
      founderApprovalToken,
      founderApproved
    } = this._initializeCoreComponents(overrideGoal, options);

    if (!constitution || !Array.isArray(constitution.laws) || constitution.laws.length === 0) {
      const errorPayload = {
        status: "MISSING_CONSTITUTION",
        goal: goalInput,
        message: "Constitution is missing or invalid. Mother stopped immediately."
      };
      console.log(JSON.stringify(errorPayload, null, 2));
      report({
        goal: { rawGoal: goalInput, domain: "mother", intent: "startup_failure" },
        context,
        scanResult: { clean: false, summary: {} },
        validation: { passed: false, status: "MISSING_CONSTITUTION", issues: [errorPayload.message] },
        governance: { status: "blocked_by_validation", reason: "constitution_missing" },
        nextAction: "restore_constitution",
        bible: {
          validationStatus: "NOT_RUN",
          loadedChapters: [],
          version: { bibleVersion: "unknown", schemaVersion: "unknown" }
        },
        persistReport: false
      });
      console.log("\n🦅 GARUDA Mother Finished");
      return {
        goal: { rawGoal: goalInput, domain: "mother", intent: "startup_failure" },
        validation: { passed: false, status: "MISSING_CONSTITUTION", issues: [errorPayload.message] },
        governance: { status: "blocked_by_validation", reason: "constitution_missing" },
        nextAction: "restore_constitution"
      };
    }

    const bibleLoader = new GarudaBibleLoader();
    const bibleValidator = new GarudaBibleValidator({ loader: bibleLoader });
    const bibleValidation = bibleValidator.validate();

    if (!bibleValidation.ok) {
      const errorPayload = {
        status: "BIBLE_VALIDATION_FAILED",
        goal: goalInput,
        validation: bibleValidation,
        message: "GARUDA Bible validation failed. Planning stopped safely."
      };

      console.log(JSON.stringify(errorPayload, null, 2));
      report({
        goal: { rawGoal: goalInput, domain: "mother", intent: "startup_failure" },
        context,
        scanResult: { clean: false, summary: {} },
        validation: {
          passed: false,
          status: "BIBLE_VALIDATION_FAILED",
          issues: bibleValidation.messages
            .filter((message) => message.level === "error")
            .map((message) => `${message.code}: ${message.message}`)
        },
        governance: { status: "blocked_by_validation", reason: "bible_validation_failed" },
        nextAction: "fix_bible_validation_errors",
        bible: {
          validationStatus: "FAILED",
          loadedChapters: [],
          version: { bibleVersion: "unknown", schemaVersion: "unknown" },
          details: bibleValidation
        },
        persistReport: false
      });
      console.log("\n🦅 GARUDA Mother Finished");
      return {
        goal: { rawGoal: goalInput, domain: "mother", intent: "startup_failure" },
        validation: {
          passed: false,
          status: "BIBLE_VALIDATION_FAILED",
          issues: bibleValidation.messages
            .filter((message) => message.level === "error")
            .map((message) => `${message.code}: ${message.message}`)
        },
        governance: { status: "blocked_by_validation", reason: "bible_validation_failed" },
        nextAction: "fix_bible_validation_errors"
      };
    }

    const requestedBibleChapters = buildRequiredBibleChapters(goalInput);
    let bibleContext;

    try {
      bibleContext = bibleLoader.loadCompactContext({
        requestedChapterIds: requestedBibleChapters,
        mandatoryChapterIds: ["02_CONSTITUTION"],
        onlyActive: true,
        requireRequired: false
      });
    } catch (error) {
      const errorPayload = {
        status: "BIBLE_CONTEXT_LOAD_FAILED",
        goal: goalInput,
        requestedBibleChapters,
        message: error.message
      };

      console.log(JSON.stringify(errorPayload, null, 2));
      report({
        goal: { rawGoal: goalInput, domain: "mother", intent: "startup_failure" },
        context,
        scanResult: { clean: false, summary: {} },
        validation: {
          passed: false,
          status: "BIBLE_CONTEXT_LOAD_FAILED",
          issues: [error.message]
        },
        governance: { status: "blocked_by_validation", reason: "bible_context_load_failed" },
        nextAction: "fix_bible_chapters",
        bible: {
          validationStatus: "PASSED",
          loadedChapters: [],
          requestedChapters: requestedBibleChapters,
          version: { bibleVersion: "unknown", schemaVersion: "unknown" }
        },
        persistReport: false
      });
      console.log("\n🦅 GARUDA Mother Finished");
      return {
        goal: { rawGoal: goalInput, domain: "mother", intent: "startup_failure" },
        validation: { passed: false, status: "BIBLE_CONTEXT_LOAD_FAILED", issues: [error.message] },
        governance: { status: "blocked_by_validation", reason: "bible_context_load_failed" },
        nextAction: "fix_bible_chapters"
      };
    }

    console.log("[Constitution]", constitution.laws.length + " laws loaded");
    const parsedGoal = understandGoal(goalInput);
    let goal = parsedGoal;
    let bodySnapshotBefore = null;
    let selfDevelopmentSelection = null;

    if (parsedGoal.intent === "self_development_meta") {
      const priorMissionEvidence = options && options.previousMissionEvidence
        ? options.previousMissionEvidence
        : resolvePreviousMissionEvidence({ rootDir: process.cwd() });
      const grounding = groundSelfDevelopmentGoal(parsedGoal, {
        rootDir: process.cwd(),
        previousMissionEvidence: priorMissionEvidence
      });
      goal = grounding.goal;
      bodySnapshotBefore = grounding.beforeSnapshot;
      selfDevelopmentSelection = grounding.selection;
    }

    const tasks = prioritize(decompose(goal));
    const scanResult = scan();

    const revenueBridge = {
      engaged: false,
      capabilities: null,
      evaluation: null,
      suggestedNextAction: null,
      status: "NOT_ENGAGED"
    };

    if (shouldEngageRevenueBridge(goalInput, goal)) {
      revenueBridge.engaged = true;
      const revenueBridgeClient = new RevenueBridgeClient();
      revenueBridge.capabilities = await revenueBridgeClient.getCapabilities();
      revenueBridge.evaluation = await revenueBridgeClient.evaluateWork(
        buildRevenueBridgeInput(goalInput, goal, tasks),
        founderApproved
      );
      revenueBridge.suggestedNextAction = deriveRevenueBridgeNextAction(revenueBridge);
      revenueBridge.status = revenueBridge.evaluation && revenueBridge.evaluation.ok
        ? "EVALUATED"
        : "DEGRADED";
    }

    const memoryEngine = new ProjectMemoryEngine();
    const memoryMatches = memoryEngine.findSimilarGoal(goalInput);
    const isReadOnlyMission = Boolean(goal && (goal.actionType === "analysis" || goal.intent === "read_only_audit"));
    let latestExact = (options && options.bypassMemoryMatch) || isReadOnlyMission ? null : (memoryMatches.exactMatches[0] || null);

    if (latestExact && goal.targetName && goal.actionType === "creation") {
      const targetSlug = goal.targetName.replace(/\.(js|ts|json)$/i, "");
      const modulePath = path.join(process.cwd(), `src/generated/${targetSlug}.js`);
      const testPath = path.join(process.cwd(), `src/generated/${targetSlug}.test.js`);
      if (!fs.existsSync(modulePath) || !fs.existsSync(testPath)) {
        console.log(`[Memory] Target files ${targetSlug}.js missing on disk. Bypassing cached memory completion.`);
        latestExact = null;
      }
    }
    const taskProfile = buildTaskProfile(goalInput, goal, tasks, scanResult);
    const dispatchPreview = buildDispatchPreview(goalInput, goal, tasks);

    const workerContextCompiler = new WorkerContextCompiler();
    const costOptimizer = new CostGuard();
    const workforceRouter = new WorkforceRouter({ brainRegistry });
    const promptBuilder = new PromptBuilder();
    const externalWorkerAdapter = new ExternalWorkerAdapter();
    const planner = new MultiBrainPlanner({ registry: brainRegistry });

    const approvalGate = developmentApprovalGate;

    const coordinator = new BrainCoordinator({
      registry: brainRegistry,
      approvalGate
    });

    const manager = new EngineeringManager({
      scanner: { scan: () => scanResult },
      planner,
      dispatcher: null,
      validator: { validateGoal: () => true },
      reporter: { report },
      multiBrainPlanner: planner,
      brainCoordinator: coordinator,
      approvalGate,
      workforceRouter,
      externalWorkerAdapter
    });

    const intendsWrite = hasWriteIntent(goalInput, tasks, goal);
    const externalExecutionEnabled =
      process.env.GARUDA_EXTERNAL_WORKER_EXECUTION === "true";

    const isReadOnlyGoal = !intendsWrite || (goal && (goal.actionType === "analysis" || goal.intent === "read_only_audit"));
    const costDecision = costOptimizer.classify({
      complexity: taskProfile.complexity,
      fileCount: taskProfile.fileCount,
      risk: taskProfile.risk,
      duplicateDetected: Boolean(latestExact),
      localCapabilities: isReadOnlyGoal,
      requiresExternal:
        !isReadOnlyGoal && (
          intendsWrite ||
          taskProfile.complexity >= 4 ||
          taskProfile.fileCount > 3
        ),
      paidRequested: false,
      creditsAvailable: externalExecutionEnabled ? 1 : 0
    });

    const routingDecision = manager.selectWorker(taskProfile, {
      cost: costDecision,
      founderApproved,
      externalExecutionEnabled,
      approval: {
        founderApproved,
        founderApprovalToken: Boolean(founderApprovalToken)
      }
    });

    const compiledWorkerContext = workerContextCompiler.compile({
      goal: goalInput,
      supportedWorkers: SUPPORTED_WORKERS,
      executionMode: EXECUTION_MODE,
      selectedWorker: routingDecision.selectedWorker,
      fallbackWorkers: routingDecision.fallbackWorkers,
      bibleVersion: bibleContext.version,
      loadedBibleChapters: bibleContext.chapterSummaries.map((chapter) => chapter.chapterId),
      constitutionRules: constitution.laws,
      architectureRules: bibleContext.rules,
      latestMemoryCheckpoint: latestExact,
      scanSummary: scanResult.summary,
      taskScope: intendsWrite
        ? "approved_engineering_execution"
        : "planning_and_orchestration",
      allowedFiles: taskProfile.files,
      allowedActions: routingDecision.allowedActions,
      blockedActions: routingDecision.blockedActions,
      riskLevel: taskProfile.risk,
      costLimit: costDecision.classification,
      approvalState: {
        founderApproved,
        founderApprovalToken: Boolean(founderApprovalToken)
      },
      validationRequirements: ["node --check", "policy_guard", "approval_gate"],
      expectedOutputFormat: {
        type: "json",
        keys: ["summary", "proposedChanges", "risks", "validationPlan", "nextAction"]
      }
    });

    const planningPrompt = promptBuilder.buildPlanningPrompt({
      role: routingDecision.selectedWorker,
      goal: goalInput,
      existingModulesToReuse: [
        "Mother",
        "GarudaBibleLoader",
        "GarudaBibleValidator",
        "ProjectMemoryEngine",
        "EngineeringManager",
        "WorkerDispatcher",
        "BrainRegistry",
        "MultiBrainPlanner",
        "BrainCoordinator",
        "DevelopmentApprovalGate",
        "LocalBrainWorker"
      ],
      filesInScope: taskProfile.files,
      requiredContext: compiledWorkerContext,
      allowedActions: ["read", "analyze", "plan", "summarize"],
      blockedActions: routingDecision.blockedActions,
      founderApprovalStatus: "NOT_REQUIRED_FOR_READ_ONLY",
      validationCommands: ["node --check scripts/mother/mother.js"]
    });

    const implementationPrompt = promptBuilder.buildImplementationPrompt({
      role: routingDecision.selectedWorker,
      goal: goalInput,
      existingModulesToReuse: planningPrompt.prompt.existingModulesToReuse,
      filesInScope: taskProfile.files,
      requiredContext: compiledWorkerContext,
      allowedActions: routingDecision.allowedActions,
      blockedActions: routingDecision.blockedActions,
      founderApprovalStatus: founderApproved ? "APPROVED" : "NOT_APPROVED",
      validationCommands: ["node --check scripts/mother/mother.js"]
    });

    const writeApproval = intendsWrite
      ? approvalGate.evaluate({
          founderApprovalToken,
          founderApproved,
          intendedOperation: "file_write"
        })
      : {
          allowed: true,
          status: "READ_ONLY_APPROVED",
          reason: "read_only_planning",
          founderApprovalRequired: false,
          blockedActions: [],
          blockedReason: "None"
        };

    const promptDecision = {
      promptType: intendsWrite ? "implementation" : "planning",
      selected: intendsWrite ? implementationPrompt : planningPrompt,
      implementationBlocked: intendsWrite && !writeApproval.allowed
    };

    const workerFlow = manager.selectWorkerAndExecute(taskProfile, {
      cost: costDecision,
      goal: goalInput,
      prompt: `Goal: ${goalInput}\n\nImplementation instructions:\n${JSON.stringify(promptDecision.selected.prompt, null, 2)}`,
      promptFingerprint: promptDecision.selected.promptFingerprint,
      context: compiledWorkerContext,
      founderApproved: founderApproved && writeApproval.allowed,
      approvalState: {
        founderApproved: founderApproved && writeApproval.allowed,
        approved: writeApproval.allowed,
        founderApprovalToken: Boolean(founderApprovalToken)
      },
      externalExecutionEnabled,
      localWorkerHandler: (localInput = {}) => {
        void localInput;
        return buildReadOnlyAnalysis(process.cwd());
      }
    });

    const adapterPayload =
      workerFlow && workerFlow.adapterPayload
        ? workerFlow.adapterPayload
        : manager.requestAdapterPayload({
            worker: routingDecision.selectedWorker,
            goal: goalInput,
            prompt: promptDecision.selected.prompt,
            promptFingerprint: promptDecision.selected.promptFingerprint,
            context: compiledWorkerContext,
            estimatedCost: routingDecision.estimatedCostLevel,
            requiresApproval: intendsWrite
          });

    const workerExecutionResult =
      workerFlow && workerFlow.executionResult
        ? workerFlow.executionResult
        : null;

    const approvalBlocked =
      writeApproval.status === "BLOCKED_BY_APPROVAL";

    console.log("[Goal]", goal);
    console.log("[Tasks]", tasks);

    const checkModulePath = goal.targetName ? path.join(process.cwd(), `src/generated/${goal.targetName.replace(/\.(js|ts|json)$/i, "")}.js`) : null;
    const checkTestPath = goal.targetName ? path.join(process.cwd(), `src/generated/${goal.targetName.replace(/\.(js|ts|json)$/i, "")}.test.js`) : null;
    const targetFilesExist = checkModulePath && checkTestPath ? (fs.existsSync(checkModulePath) && fs.existsSync(checkTestPath)) : true;

    if (latestExact && targetFilesExist && !(options && options.bypassMemoryMatch)) {
      const isIncomplete = latestExact.workflowStatus !== "Completed (3/3)" || !latestExact.completedAt;

      if (isIncomplete && !founderApproved) {
        const resumePayload = {
          status: "RESUME_AVAILABLE",
          goal: goalInput,
          record: latestExact,
          message: "An interrupted goal exists in project memory."
        };

        console.log(JSON.stringify(resumePayload, null, 2));
        report({
          goal: { rawGoal: goalInput, domain: "mother", intent: "resume_available" },
          context,
          scanResult,
          validation: { passed: true, status: "RESUME_AVAILABLE", issues: [] },
          governance: { status: "approval_required", reason: "memory_resume_available" },
          nextAction: "resume_from_memory",
          bible: {
            validationStatus: "PASSED",
            version: bibleContext.version,
            loadedChapters: bibleContext.chapterSummaries.map((chapter) => chapter.chapterId),
            requestedChapters: requestedBibleChapters,
            sourcePaths: bibleContext.sourcePaths
          },
          multiBrain: {
            goal: goalInput,
            selectedBrains: latestExact.selectedBrains || [],
            tasks: (latestExact.taskPlan && latestExact.taskPlan.tasks) || [],
            dependencyOrder: (latestExact.taskPlan && latestExact.taskPlan.dependencyOrder) || [],
            validation: { status: "RESUME_AVAILABLE", approvalStatus: latestExact.approvalStatus || "unknown" },
            founderApprovalRequired: true,
            writeStopped: true,
            stopReason: "Resume available from memory",
            workflow: { status: "In Progress (2/3)", completedSteps: 2, totalSteps: 3 }
          },
          workforce: {
            selectedWorker: routingDecision.selectedWorker,
            fallbackWorkers: routingDecision.fallbackWorkers,
            routingReason: routingDecision.reason,
            selectionReason: routingDecision.reason,
            externalAIRequired: routingDecision.externalAIRequired,
            estimatedCost: routingDecision.estimatedCostLevel,
            estimatedCostLevel: routingDecision.estimatedCostLevel,
            adapterStatus: adapterPayload.adapterStatus,
            executionMode: adapterPayload.executionMode,
            promptType: promptDecision.promptType,
            promptFingerprint: adapterPayload.promptFingerprint,
            approvalStatus: latestExact.approvalStatus || writeApproval.status,
            writeStopped: promptDecision.implementationBlocked || approvalBlocked || latestExact.approvalStatus === "BLOCKED_BY_APPROVAL"
          },
          workerAdapter: adapterPayload,
          memory: {
            status: "RESUME_AVAILABLE",
            recordFingerprint: latestExact.planFingerprint,
            filePath: memoryEngine.memoryFilePath
          },
          persistReport: false
        });
        console.log("\n🦅 GARUDA Mother Finished");
        return {
          goal: { rawGoal: goalInput, domain: "mother", intent: "resume_available" },
          validation: { passed: false, status: "RESUME_AVAILABLE", issues: [] },
          governance: { status: "approval_required", reason: "memory_resume_available" },
          nextAction: "await_founder_approval"
        };
      }

      if (isIncomplete && founderApproved) {
        console.log("[Memory] Founder approval detected. Resuming interrupted goal execution.");
      }

      const targetSlug = goal.targetName ? goal.targetName.replace(/\.(js|ts|json)$/i, "") : null;
      const targetModulePath = targetSlug ? path.join(process.cwd(), `src/generated/${targetSlug}.js`) : null;
      const targetTestPath = targetSlug ? path.join(process.cwd(), `src/generated/${targetSlug}.test.js`) : null;
      const targetFilesMissing = targetSlug && goal.actionType === "creation" && (!fs.existsSync(targetModulePath) || !fs.existsSync(targetTestPath));

      if (
        latestExact.workflowStatus === "Completed (3/3)" &&
        latestExact.approvalStatus !== "BLOCKED_BY_APPROVAL" &&
        latestExact.completedAt &&
        !targetFilesMissing
      ) {
        const completedPayload = {
          status: "ALREADY_COMPLETED",
          goal: goalInput,
          record: latestExact,
          message: "The same completed goal already exists in project memory."
        };

        console.log(JSON.stringify(completedPayload, null, 2));
        report({
          goal: { rawGoal: goalInput, domain: "mother", intent: "already_completed" },
          context,
          scanResult,
          validation: { passed: true, status: "ALREADY_COMPLETED", issues: [] },
          governance: { status: "approval_required", reason: "memory_already_completed" },
          nextAction: "none",
          bible: {
            validationStatus: "PASSED",
            version: bibleContext.version,
            loadedChapters: bibleContext.chapterSummaries.map((chapter) => chapter.chapterId),
            requestedChapters: requestedBibleChapters,
            sourcePaths: bibleContext.sourcePaths
          },
          multiBrain: {
            goal: goalInput,
            selectedBrains: latestExact.selectedBrains || [],
            tasks: (latestExact.taskPlan && latestExact.taskPlan.tasks) || [],
            dependencyOrder: (latestExact.taskPlan && latestExact.taskPlan.dependencyOrder) || [],
            validation: { status: "ALREADY_COMPLETED", approvalStatus: latestExact.approvalStatus || "unknown" },
            founderApprovalRequired: true,
            writeStopped: true,
            stopReason: "Goal already completed",
            workflow: { status: "Completed (3/3)", completedSteps: 3, totalSteps: 3 }
          },
          workforce: {
            selectedWorker: routingDecision.selectedWorker,
            fallbackWorkers: routingDecision.fallbackWorkers,
            routingReason: routingDecision.reason,
            selectionReason: routingDecision.reason,
            externalAIRequired: routingDecision.externalAIRequired,
            estimatedCost: routingDecision.estimatedCostLevel,
            estimatedCostLevel: routingDecision.estimatedCostLevel,
            adapterStatus: adapterPayload.adapterStatus,
            executionMode: adapterPayload.executionMode,
            promptType: promptDecision.promptType,
            promptFingerprint: adapterPayload.promptFingerprint,
            approvalStatus: latestExact.approvalStatus || writeApproval.status,
            writeStopped: promptDecision.implementationBlocked || approvalBlocked || latestExact.approvalStatus === "BLOCKED_BY_APPROVAL"
          },
          workerAdapter: adapterPayload,
          memory: {
            status: "ALREADY_COMPLETED",
            recordFingerprint: latestExact.planFingerprint,
            filePath: memoryEngine.memoryFilePath
          },
          persistReport: false
        });
        console.log("\n🦅 GARUDA Mother Finished");
        return {
          goal: { rawGoal: goalInput, domain: "mother", intent: "already_completed" },
          validation: { passed: true, status: "ALREADY_COMPLETED", issues: [] },
          governance: { status: "approved_for_safe_execution" },
          nextAction: "execution_completed",
          executedTasks: [],
          multiBrain: { workflow: { status: "Completed (3/3)", completedSteps: 3, totalSteps: 3 } }
        };
      }
    }
    const readOnlyAnalysis = buildReadOnlyAnalysis(process.cwd());

    const orchestration = await manager.manageDevelopmentDirectorGoal(goalInput, {
      context: {
        analysis: readOnlyAnalysis,
        platformContext: context,
        localWorkerPreferred: true,
        workerPolicy: "local_first",
        currentArchitecture: readOnlyAnalysis.projectStructure
      },
      approval: {
        founderApprovalToken,
        founderApproved,
        intendedOperation: "mother_unified_runtime"
      }
    });
    const multiBrainPlan = orchestration.plan;
    const multiBrainCoordination = orchestration.coordination;
    const approvalResult = orchestration.approval;
    const workflow = buildWorkflowProgress(orchestration, multiBrainCoordination);
    console.log("[ExecutionApproved Check]", {
      founderApproved,
      approvalResultAllowed: approvalResult ? approvalResult.allowed : null,
      writeApprovalAllowed: writeApproval ? writeApproval.allowed : null
    });
    const executionApproved = Boolean(
      founderApproved &&
      approvalGate &&
      approvalResult.allowed === true &&
      writeApproval &&
      writeApproval.allowed === true
    );

    const groundedSelfDevelopmentPlan = goal.targetSource === SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET
      ? buildSelfDevelopmentPlannedTasks(goal)
      : null;

    const decisions = think({
      projectClean: scanResult.clean,
      summary: scanResult.summary,
      buildRequired: true,
      validateRequired: true,
      tasks: groundedSelfDevelopmentPlan ? groundedSelfDevelopmentPlan.map((item) => item.task) : tasks
    });

    const executionPlan = groundedSelfDevelopmentPlan
      ? groundedSelfDevelopmentPlan.map((item) => item.task)
      : decide(scanResult, decisions);
    const plannedTasks = groundedSelfDevelopmentPlan || plan(executionPlan);
    const writeIntentDetected = hasWriteIntent(goalInput, plannedTasks, goal);

    const preflight = validate(plannedTasks);

    if (parsedGoal.intent === "self_development_meta" && !goal.targetName) {
      preflight.passed = false;
      preflight.status = selfDevelopmentSelection && selfDevelopmentSelection.status
        ? selfDevelopmentSelection.status
        : "NO_ELIGIBLE_SELF_DEVELOPMENT_TARGET";
      preflight.issues = [
        ...(Array.isArray(preflight.issues) ? preflight.issues : []),
        preflight.status === "IMPLEMENTATION_SURFACE_UNKNOWN"
          ? "Selected self-development candidates lacked credible implementation ownership evidence."
          : "No eligible evidence-grounded self-development capability target was selected."
      ];
    }

    const cycle = {
      goal,
      context,
      bodyAwareness: {
        beforeSnapshot: bodySnapshotBefore,
        candidateSelection: selfDevelopmentSelection,
        afterSnapshot: null,
        capabilityTransition: null
      },
      targetProvenance: goal.targetProvenance || null,
      scanResult,
      revenueBridge,
      decisions,
      executionPlan,
      plannedTasks,
      validation: preflight,
      executedTasks: [],
      governance: {
        status: preflight.passed
          ? (executionApproved ? "ready" : "approval_required")
          : "blocked_by_validation"
      },
      nextAction: preflight.passed
        ? (executionApproved ? "continue_safe_execution" : "await_founder_approval")
        : (preflight.status === "NO_ELIGIBLE_SELF_DEVELOPMENT_TARGET"
          ? "NO_ELIGIBLE_SELF_DEVELOPMENT_TARGET"
          : "fix_validation_issues"),
      bible: {
        validationStatus: "PASSED",
        version: bibleContext.version,
        loadedChapters: bibleContext.chapterSummaries.map((chapter) => chapter.chapterId),
        requestedChapters: requestedBibleChapters,
        sourcePaths: bibleContext.sourcePaths
      },
      multiBrain: {
        goal: multiBrainPlan.goal,
        selectedBrains: multiBrainCoordination.selectedBrains,
        tasks: multiBrainCoordination.tasks,
        dependencyOrder: multiBrainPlan.dependencyOrder,
        validation: {
          status: multiBrainCoordination.validationStatus,
          approvalStatus: multiBrainCoordination.approval.status
        },
        founderApprovalRequired: true,
        unifiedImplementationProposal: multiBrainCoordination.unifiedImplementationProposal,
        writeStopped: multiBrainCoordination.writeStopped,
        stopReason: multiBrainCoordination.stopReason,
        workflow,
        localBrainPreferred: true
      },
      workerDispatch: dispatchPreview,
      workerAdapter: adapterPayload,
      workerExecution: workerExecutionResult,
      workforce: {
        selectedWorker: routingDecision.selectedWorker,
        fallbackWorkers: routingDecision.fallbackWorkers,
        routingReason: routingDecision.reason,
        selectionReason: routingDecision.reason,
        externalAIRequired: routingDecision.externalAIRequired,
        estimatedCost: routingDecision.estimatedCostLevel,
        estimatedCostLevel: routingDecision.estimatedCostLevel,
        adapterStatus: adapterPayload.adapterStatus,
        executionMode: adapterPayload.executionMode,
        loadedBibleChapters: bibleContext.chapterSummaries.map((chapter) => chapter.chapterId),
        promptType: promptDecision.promptType,
        promptFingerprint: adapterPayload.promptFingerprint,
        approvalStatus: executionApproved
          ? "APPROVED"
          : (approvalResult.status === "BLOCKED_BY_APPROVAL" || writeApproval.status === "BLOCKED_BY_APPROVAL"
              ? "BLOCKED_BY_APPROVAL"
              : writeApproval.status),
        writeStopped: !executionApproved,
        validationStatus: preflight.passed ? "PENDING_EXECUTION" : "PRECHECK_FAILED"
      },
      promptSummary: promptDecision.selected.safeSummary,
      contextSummary: {
        rulesCount: compiledWorkerContext.bible.architectureRules.length,
        chapterCount: compiledWorkerContext.bible.chapters.length,
        costClassification: costDecision.classification,
        costReason: costDecision.reason
      }
    };

    if (revenueBridge.engaged && revenueBridge.evaluation && !revenueBridge.evaluation.ok) {
      cycle.validation = {
        ...cycle.validation,
        issues: [
          ...(Array.isArray(cycle.validation.issues) ? cycle.validation.issues : []),
          `Revenue bridge degraded: ${revenueBridge.evaluation.error.code} - ${revenueBridge.evaluation.error.message}`
        ]
      };
    }

    if (revenueBridge.engaged && revenueBridge.suggestedNextAction && cycle.nextAction === "continue_safe_execution") {
      cycle.nextAction = revenueBridge.suggestedNextAction;
    }

    if ((writeIntentDetected || promptDecision.implementationBlocked) && !executionApproved) {
      cycle.validation = {
        ...cycle.validation,
        status: "BLOCKED_BY_APPROVAL",
        issues: [
          writeIntentDetected
            ? "Development Director mode allows planning/read-only execution but blocks all write operations until explicit founder approval."
            : writeApproval.blockedReason
        ]
      };
      cycle.governance = {
        status: "approval_required",
        reason: writeIntentDetected ? "development_director_write_blocked" : writeApproval.reason
      };
      cycle.nextAction = "await_founder_approval";
      cycle.workforce.validationStatus = "BLOCKED_BY_APPROVAL";
      cycle.workforce.writeStopped = true;
      cycle.workforce.approvalStatus = "BLOCKED_BY_APPROVAL";
    } else if (preflight.passed && executionApproved) {
      cycle.executedTasks = execute(plannedTasks);
      cycle.validation = validate(cycle.executedTasks);
      const engineeringEvidence = summarizeEngineeringEvidence(cycle.executedTasks);

      const executionBlocked = cycle.executedTasks.some(
        (task) => task && task.status === "BLOCKED_BY_APPROVAL"
      );
      const executionPassed = Boolean(cycle.validation && cycle.validation.passed) && !executionBlocked;

      if (writeIntentDetected && engineeringEvidence.filesChanged.length === 0) {
        cycle.validation.passed = false;
        cycle.validation.status = "FAILED";
        cycle.validation.issues = [
          ...(Array.isArray(cycle.validation.issues) ? cycle.validation.issues : []),
          "Write intent was detected but no workspace change evidence was produced."
        ];
      }

      if (writeIntentDetected && engineeringEvidence.testsExecuted.length === 0) {
        cycle.validation.passed = false;
        cycle.validation.status = "FAILED";
        cycle.validation.issues = [
          ...(Array.isArray(cycle.validation.issues) ? cycle.validation.issues : []),
          "No verification tests were executed for this mission cycle."
        ];
      }

      cycle.engineeringEvidence = engineeringEvidence;

      if (
        goal.targetSource === SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET &&
        goal.capabilityTarget &&
        goal.capabilityTarget.id
      ) {
        const capabilityEvidencePropagation = propagateVerificationEvidenceToCapability(
          bodySnapshotBefore || { capabilities: [] },
          goal.capabilityTarget.id,
          engineeringEvidence
        );

        if (capabilityEvidencePropagation.propagatedEvidence) {
          cycle.bodyAwareness.beforeSnapshot = capabilityEvidencePropagation.snapshot;
          cycle.bodyAwareness.selectedCapabilityVerificationEvidence = capabilityEvidencePropagation.propagatedEvidence;
        }

        if (!engineeringEvidence.relevantCapabilityChanges.length) {
          cycle.validation.passed = false;
          cycle.validation.status = "FAILED";
          cycle.validation.issues = [
            ...(Array.isArray(cycle.validation.issues) ? cycle.validation.issues : []),
            `No attributable implementation change was detected inside selected capability '${goal.capabilityTarget.id}' surface.`
          ];
        }

        const afterSnapshot = getCurrentBodyState({ rootDir: process.cwd() });
        const transition = compareCapabilitySnapshots(
          capabilityEvidencePropagation.snapshot || bodySnapshotBefore || { capabilities: [] },
          afterSnapshot,
          goal.capabilityTarget.id
        );

        cycle.bodyAwareness.afterSnapshot = afterSnapshot;
        cycle.bodyAwareness.capabilityTransition = {
          ...transition,
          currentCycleVerificationEvidence: capabilityEvidencePropagation.propagatedEvidence
            ? capabilityEvidencePropagation.propagatedEvidence.details
            : null
        };

        const sameStatus = transition.beforeStatus === transition.afterStatus;
        const evidenceBackedSurfaceImprovement = sameStatus && hasCapabilitySurfaceEvidenceImproved(
          bodySnapshotBefore || { capabilities: [] },
          afterSnapshot,
          goal.capabilityTarget.id,
          engineeringEvidence
        );

        if (!transition.improved && evidenceBackedSurfaceImprovement) {
          cycle.bodyAwareness.capabilityTransition = {
            ...transition,
            improved: true,
            improvementBasis: "verified_target_surface_change",
            note: `Capability status remained ${transition.afterStatus}, but target implementation surface was patched and verified.`
          };
        }

        if (!cycle.bodyAwareness.capabilityTransition.improved) {
          cycle.validation.passed = false;
          cycle.validation.status = "FAILED";
          cycle.validation.issues = [
            ...(Array.isArray(cycle.validation.issues) ? cycle.validation.issues : []),
            `Self-development capability target '${goal.capabilityTarget.id}' did not improve (${transition.beforeStatus} -> ${transition.afterStatus}).`
          ];
          cycle.nextAction = "self_development_capability_not_improved";
        }
      }

      const executionPassedAfterEvidence = Boolean(cycle.validation && cycle.validation.passed) && !executionBlocked;

      cycle.governance.status = executionBlocked
        ? "approval_required"
        : (executionPassedAfterEvidence ? "approved_for_safe_execution" : "blocked_by_validation");
      cycle.nextAction = executionPassedAfterEvidence ? "execution_completed" : "fix_execution_issues";
      cycle.workforce.validationStatus = executionBlocked
        ? "BLOCKED_BY_APPROVAL"
        : (executionPassedAfterEvidence ? "PASSED" : "FAILED");
      cycle.workforce.approvalStatus = "APPROVED";
      cycle.workforce.writeStopped = executionBlocked;

      if (executionPassedAfterEvidence) {
        build();
        cycle.multiBrain.workflow = {
          status: "Completed (3/3)",
          completedSteps: 3,
          totalSteps: 3
        };
        cycle.multiBrain.writeStopped = false;
        cycle.multiBrain.stopReason = null;
        cycle.multiBrain.validation = {
          status: "PASSED",
          approvalStatus: "APPROVED"
        };
      }
    } else if (preflight.passed && !executionApproved) {
      cycle.validation = {
        ...cycle.validation,
        status: "BLOCKED_BY_APPROVAL",
        issues: [approvalResult.blockedReason]
      };
      cycle.governance = {
        status: "approval_required",
        reason: approvalResult.reason
      };
      cycle.workforce.validationStatus = "BLOCKED_BY_APPROVAL";
    }

    const memorySave = memoryEngine.saveRecord({
      goal: goalInput,
      createdAt: new Date().toISOString(),
      completedAt:
        cycle.multiBrain.workflow.status === "Completed (3/3)" &&
        cycle.workforce.approvalStatus === "APPROVED" &&
        cycle.workforce.validationStatus === "PASSED" &&
        cycle.multiBrain.writeStopped === false
          ? new Date().toISOString()
          : null,
      selectedBrains: multiBrainCoordination.selectedBrains,
      taskPlan: {
        tasks: multiBrainCoordination.tasks,
        dependencyOrder: multiBrainPlan.dependencyOrder
      },
      validationStatus: cycle.workforce.validationStatus,
      workflowStatus: cycle.multiBrain.workflow.status,
      approvalStatus: cycle.workforce.approvalStatus,
      filesCreated: multiBrainCoordination.filesCreated || [],
      filesModified: multiBrainCoordination.filesModified || [],
      failures: multiBrainCoordination.failures || [],
      nextAction: cycle.nextAction
    });

    cycle.memory = {
      status: memorySave.status,
      recordFingerprint: memorySave.planFingerprint,
      filePath: memoryEngine.memoryFilePath
    };

    report(cycle);

    console.log("\n🦅 GARUDA Mother Cycle Finished");
    return cycle;
  }

  async runMissionToCompletion(overrideGoal = null, options = {}) {
    const maxCycles = Math.min(10, Math.max(1, Number(options.maxCycles) || 5));
    let cyclesExecuted = 0;
    let currentGoal = overrideGoal;
    const parentObjective = String(overrideGoal || process.env.GARUDA_GOAL || "").trim();
    let lastCycleResult = null;
    const history = [];
    let priorFailureSignature = null;
    let repeatFailureCount = 0;
    let replanAttempted = false;

    for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
      cyclesExecuted += 1;
      console.log(`\n🦅 GARUDA Bounded Mission Continuation Loop — Cycle ${cycle} of ${maxCycles}`);
      
      const cycleResult = await this.start(currentGoal, { ...options, singleCycle: true });
      lastCycleResult = cycleResult;
      history.push(cycleResult);

      if (cycleResult && cycleResult.governance) {
        if (cycleResult.governance.status === "BLOCKED_BY_CONSTITUTION") {
          console.log("\n🛑 Terminal State Reached: CONSTITUTIONAL_BLOCK");
          return { status: "CONSTITUTIONAL_BLOCK", cyclesExecuted, lastCycleResult, history };
        }
        if (cycleResult.governance.status === "approval_required" || cycleResult.governance.status === "BLOCKED_BY_APPROVAL") {
          console.log("\n🛑 Terminal State Reached: FOUNDER_ACTION_REQUIRED");
          return { status: "FOUNDER_ACTION_REQUIRED", cyclesExecuted, lastCycleResult, history };
        }
      }

      if (cycleResult && cycleResult.validation && cycleResult.validation.status === "FAILED" && cycle >= maxCycles) {
        console.log("\n🛑 Terminal State Reached: SAFE_RETRY_LIMIT_REACHED");
        return { status: "SAFE_RETRY_LIMIT_REACHED", cyclesExecuted, lastCycleResult, history };
      }

      if (!cycleResult) {
        console.log("\n🛑 Terminal State Reached: UNKNOWN_EXECUTION_FAILURE");
        return { status: "FAILED", cyclesExecuted, lastCycleResult, history };
      }

      const nextAction = cycleResult.nextAction || "execution_completed";

      if (nextAction === "NO_ELIGIBLE_SELF_DEVELOPMENT_TARGET") {
        console.log("\n🛑 Terminal State Reached: NO_ELIGIBLE_SELF_DEVELOPMENT_TARGET");
        return { status: "NO_ELIGIBLE_SELF_DEVELOPMENT_TARGET", cyclesExecuted, lastCycleResult, history };
      }

      if (cycleResult && cycleResult.validation && cycleResult.validation.passed === false) {
        const failureSignature = JSON.stringify({
          nextAction,
          issues: Array.isArray(cycleResult.validation.issues) ? cycleResult.validation.issues : [],
          governance: cycleResult.governance && cycleResult.governance.status ? cycleResult.governance.status : "unknown"
        });

        if (failureSignature === priorFailureSignature) {
          repeatFailureCount += 1;
        } else {
          repeatFailureCount = 0;
          replanAttempted = false;
        }
        priorFailureSignature = failureSignature;

        if (repeatFailureCount >= 1 && !replanAttempted) {
          replanAttempted = true;
          currentGoal = `Diagnose previous engineering failure and change execution strategy for parent objective \"${parentObjective || (cycleResult.goal && cycleResult.goal.rawGoal ? cycleResult.goal.rawGoal : "mission") }\"`;
          continue;
        }

        if (repeatFailureCount >= 2) {
          console.log("\n🛑 Terminal State Reached: BLOCKED_BY_REPEATED_FAILURE");
          return { status: "BLOCKED_BY_REPEATED_FAILURE", cyclesExecuted, lastCycleResult, history };
        }
      } else {
        priorFailureSignature = null;
        repeatFailureCount = 0;
        replanAttempted = false;
      }

      if (!nextAction || nextAction === "execution_completed" || nextAction === "none" || (cycleResult && cycleResult.validation && cycleResult.validation.status === "ALREADY_COMPLETED")) {
        if (
          cycleResult &&
          cycleResult.goal &&
          cycleResult.goal.targetName &&
          cycleResult.goal.targetSource !== SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET
        ) {
          const targetSlug = cycleResult.goal.targetName.replace(/\.(js|ts|json)$/i, "");
          const isExistingService = fs.existsSync(path.join(process.cwd(), `src/services/${targetSlug}.js`));
          const modulePath = isExistingService
            ? path.join(process.cwd(), `src/services/${targetSlug}.js`)
            : path.join(process.cwd(), `src/generated/${targetSlug}.js`);
          const testPath = isExistingService
            ? path.join(process.cwd(), `src/services/${targetSlug}.test.js`)
            : path.join(process.cwd(), `src/generated/${targetSlug}.test.js`);
          
          const moduleExists = fs.existsSync(modulePath);
          const testExists = fs.existsSync(testPath);

          if (!moduleExists || !testExists) {
            console.log(`\n⚠️ Observable Outcome Verification: Created files missing (${targetSlug}.js: ${moduleExists}, ${targetSlug}.test.js: ${testExists}). Continuing loop...`);
            currentGoal = `Implement required module ${cycleResult.goal.targetName}`;
            continue;
          }

          const executedTasks = cycleResult.executedTasks || (cycleResult.multiBrain ? cycleResult.multiBrain.executedTasks : []);
          const testTask = executedTasks.find((t) => t.route === "test" || (t.task && /unit tests|run test/i.test(t.task)));
          const testPassed = testTask && testTask.status === "SUCCESS" && testTask.result && testTask.result.output && testTask.result.output.status === "PASSED";

          if (!testPassed) {
            const testReason = testTask ? (testTask.status === "SKIPPED" ? (testTask.reason || "SKIPPED") : testTask.status) : "not_executed";
            console.log(`\n⚠️ Observable Outcome Verification: Test task verification failed (status: ${testReason}). Continuing loop to run unit tests...`);
            currentGoal = `Run unit tests for ${cycleResult.goal.targetName || "requested artifact"}`;
            continue;
          }
        }

        console.log("\n✅ Terminal State Reached: MISSION_COMPLETED");
        return { status: "MISSION_COMPLETED", cyclesExecuted, lastCycleResult, history };
      }

      currentGoal = nextAction;
      currentGoal = parentObjective
        ? `${nextAction} (parent objective: ${parentObjective})`
        : nextAction;
    }

    console.log("\n🛑 Terminal State Reached: SAFE_RETRY_LIMIT_REACHED");
    return { status: "SAFE_RETRY_LIMIT_REACHED", cyclesExecuted, lastCycleResult, history };
  }

  _initializeCoreComponents(overrideGoal = null, options = {}) {
    const cliGoal = process.argv.slice(2).join(" ").trim();
    const goalInput = overrideGoal || process.env.GARUDA_GOAL || cliGoal || "make mother brain more autonomous";
    const constitution = loadConstitution();
    const context = getContext();
    const founderApprovalToken = process.env.GARUDA_FOUNDER_APPROVAL_TOKEN || "";
    const founderApproved = process.env.GARUDA_FOUNDER_APPROVED === "true" || Boolean(options && options.founderApproved) || Boolean(founderApprovalToken);
    return { goalInput, constitution, context, founderApprovalToken, founderApproved };
  }
}

if (require.main === module) {
  const mother = new Mother();
  if (process.env.GARUDA_CONTINUOUS === "true" || process.env.GARUDA_RUN_MISSION === "true") {
    mother.runMissionToCompletion().then((res) => {
      console.log(`\nMission Terminal Outcome: ${res.status} (${res.cyclesExecuted} cycles executed)`);
    });
  } else {
    mother.start();
  }
}

module.exports = {
  Mother,
  summarizeEngineeringEvidence,
  propagateVerificationEvidenceToCapability
};


