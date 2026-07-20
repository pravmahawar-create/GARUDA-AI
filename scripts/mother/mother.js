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
    requiresWrite: hasWriteIntent(goalInput, tasks),
    budget: { mode: "policy_guarded" },
    scanSummary: scanResult && scanResult.summary ? scanResult.summary : {}
  };
}

function hasWriteIntent(goalInput, plannedTasks = []) {
  const pattern = /implement|write|patch|modify|refactor|create|build|deploy|commit|push/i;
  if (pattern.test(String(goalInput || ""))) {
    return true;
  }

  return Array.isArray(plannedTasks) && plannedTasks.some((item) => {
    const taskText = typeof item === "string" ? item : (item && item.task ? item.task : "");
    return pattern.test(String(taskText || ""));
  });
}

class Mother {
  async start() {
    console.log("🦅 GARUDA Mother Started\n");

    const {
      goalInput,
      constitution,
      context,
      founderApprovalToken,
      founderApproved
    } = this._initializeCoreComponents();

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
    return;
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
      return;
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
      return;
    }

    console.log("[Constitution]", constitution.laws.length + " laws loaded");
    console.log("[Context]", context.platform, context.node);

    const memoryEngine = new ProjectMemoryEngine();
    const memoryMatches = memoryEngine.findSimilarGoal(goalInput);
    const latestExact = memoryMatches.exactMatches[0] || null;

    const scanResult = scan();
    const goal = understandGoal(goalInput);
    const tasks = prioritize(decompose(goal));
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

    const intendsWrite = hasWriteIntent(goalInput, tasks);
    const externalExecutionEnabled =
      process.env.GARUDA_EXTERNAL_WORKER_EXECUTION === "true";

    const costDecision = costOptimizer.classify({
      complexity: taskProfile.complexity,
      fileCount: taskProfile.fileCount,
      risk: taskProfile.risk,
      duplicateDetected: Boolean(latestExact),
      localCapabilities: !intendsWrite,
      requiresExternal:
        intendsWrite ||
        taskProfile.complexity >= 4 ||
        taskProfile.fileCount > 3,
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
          founderApprovalRequired: true,
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
      requiresApproval: intendsWrite,
      rootDir: process.cwd(),
      timeoutMs: 600000,
      localWorkerHandler: () => buildReadOnlyAnalysis(process.cwd())
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

    if (latestExact) {
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
        return;
      }

      if (isIncomplete && founderApproved) {
        console.log("[Memory] Founder approval detected. Resuming interrupted goal execution.");
      }

      if (
      false &&
      latestExact.workflowStatus === "Completed (3/3)" &&
      latestExact.approvalStatus !== "BLOCKED_BY_APPROVAL" &&
      latestExact.completedAt
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
        return;
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
    const executionApproved = Boolean(
      founderApproved &&
      approvalGate &&
      approvalResult.allowed === true &&
      writeApproval &&
      writeApproval.allowed === true
    );

    const decisions = think({
      projectClean: scanResult.clean,
      summary: scanResult.summary,
      buildRequired: true,
      validateRequired: true,
      tasks
    });

    const executionPlan = decide(scanResult, decisions);
    const plannedTasks = plan(executionPlan);
    const writeIntentDetected = hasWriteIntent(goalInput, plannedTasks);

    const preflight = validate(plannedTasks);
    const cycle = {
      goal,
      context,
      scanResult,
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
        : "fix_validation_issues",
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

      const executionBlocked = cycle.executedTasks.some(
        (task) => task && task.status === "BLOCKED_BY_APPROVAL"
      );
      const executionPassed = Boolean(cycle.validation && cycle.validation.passed) && !executionBlocked;

      cycle.governance.status = executionBlocked
        ? "approval_required"
        : (executionPassed ? "approved_for_safe_execution" : "blocked_by_validation");
      cycle.nextAction = executionPassed ? "execution_completed" : "fix_execution_issues";
      cycle.workforce.validationStatus = executionBlocked
        ? "BLOCKED_BY_APPROVAL"
        : (executionPassed ? "PASSED" : "FAILED");
      cycle.workforce.approvalStatus = "APPROVED";
      cycle.workforce.writeStopped = executionBlocked;

      if (executionPassed) {
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

    console.log("\n🦅 GARUDA Mother Finished");
  }

  _initializeCoreComponents() {
    const goalInput = process.argv.slice(2).join(" ").trim() || "make mother brain more autonomous";
    const constitution = loadConstitution();
    const context = getContext();
    const founderApprovalToken = process.env.GARUDA_FOUNDER_APPROVAL_TOKEN || "";
    const founderApproved = process.env.GARUDA_FOUNDER_APPROVED === "true" || Boolean(founderApprovalToken);
    return { goalInput, constitution, context, founderApprovalToken, founderApproved };
  }
}

new Mother().start();
