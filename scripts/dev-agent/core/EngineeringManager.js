const EngineeringDirector = require("./EngineeringDirector");

class EngineeringManager {
  /**
   * Constructs an EngineeringManager instance.
   *
   * @param {object} dependencies
   * @param {object} dependencies.scanner
   * @param {object} dependencies.planner
   * @param {object} dependencies.dispatcher
   * @param {object} dependencies.validator
   * @param {object} dependencies.reporter
   * @param {object} dependencies.multiBrainPlanner
   * @param {object} dependencies.brainCoordinator
   * @param {object} dependencies.approvalGate
   * @param {object} dependencies.workforceRouter
   * @param {object} dependencies.externalWorkerAdapter
   * @param {object} dependencies.engineeringDirector
   */
  constructor({
    scanner,
    planner,
    dispatcher,
    validator,
    reporter,
    multiBrainPlanner,
    brainCoordinator,
    approvalGate,
    workforceRouter,
    externalWorkerAdapter,
    engineeringDirector
  }) {
    if (!scanner || !planner || !validator) {
      throw new Error(
        "EngineeringManager requires scanner, planner, and validator dependencies."
      );
    }

    this.scanner = scanner;
    this.planner = planner;
    this.dispatcher = dispatcher || null;
    this.validator = validator;
    this.reporter = reporter || null;
    this.multiBrainPlanner = multiBrainPlanner || null;
    this.brainCoordinator = brainCoordinator || null;
    this.approvalGate = approvalGate || null;
    this.workforceRouter = workforceRouter || null;
    this.externalWorkerAdapter = externalWorkerAdapter || null;
    this.engineeringDirector =
      engineeringDirector || new EngineeringDirector();
  }

  /**
   * Selects a worker using WorkforceRouter.
   *
   * @param {object} taskProfile
   * @param {object} options
   * @returns {object}
   */
  selectWorker(taskProfile = {}, options = {}) {
    if (
      !this.workforceRouter ||
      typeof this.workforceRouter.route !== "function"
    ) {
      throw new Error(
        "WorkforceRouter is not configured on EngineeringManager."
      );
    }

    return this.workforceRouter.route(taskProfile, options);
  }

  /**
   * Builds an adapter request without executing it.
   *
   * @param {object} input
   * @returns {object}
   */
  requestAdapterPayload(input = {}) {
    if (
      !this.externalWorkerAdapter ||
      typeof this.externalWorkerAdapter.buildRequest !== "function"
    ) {
      throw new Error(
        "ExternalWorkerAdapter is not configured on EngineeringManager."
      );
    }

    return this.externalWorkerAdapter.buildRequest(
      input.worker,
      input.goal,
      {
        ...(input.context || {}),
        prompt: input.prompt,
        promptFingerprint: input.promptFingerprint,
        estimatedCost: input.estimatedCost,
        requiresApproval: input.requiresApproval,
        founderApproved: input.founderApproved,
        approvalState: input.approvalState,
        localWorkerHandler: input.localWorkerHandler,
        timeoutMs: input.timeoutMs,
        workerCommands: input.workerCommands,
        environment: input.environment,
        rootDir: input.rootDir
      }
    );
  }

  /**
   * Executes the selected worker through ExternalWorkerAdapter.
   *
   * External workers remain preview-only unless:
   * 1. Founder approval is present.
   * 2. GARUDA_EXTERNAL_WORKER_EXECUTION=true.
   *
   * @param {object} input
   * @returns {object}
   */
  executeWorker(input = {}) {
    if (
      !this.externalWorkerAdapter ||
      typeof this.externalWorkerAdapter.execute !== "function"
    ) {
      throw new Error(
        "ExternalWorkerAdapter execution is not configured on EngineeringManager."
      );
    }

    const worker = String(input.worker || "").trim();

    if (!worker) {
      throw new Error("A worker must be selected before execution.");
    }

    const executionContext = {
      ...(input.context || {}),
      prompt: input.prompt || "",
      promptFingerprint: input.promptFingerprint,
      estimatedCost: input.estimatedCost,
      requiresApproval: input.requiresApproval !== false,
      founderApproved: input.founderApproved === true,
      approvalState: {
        ...((input.context && input.context.approvalState) || {}),
        ...(input.approvalState || {}),
        founderApproved:
          input.founderApproved === true ||
          Boolean(
            input.approvalState &&
            input.approvalState.founderApproved
          )
      },
      localWorkerHandler: input.localWorkerHandler,
      timeoutMs: input.timeoutMs,
      workerCommands: input.workerCommands,
      environment: input.environment,
      rootDir:
        input.rootDir ||
        (input.context && input.context.rootDir) ||
        process.cwd()
    };

    const result = this.externalWorkerAdapter.execute(
      worker,
      input.goal || "",
      executionContext
    );

    return {
      worker,
      goal: input.goal || "",
      success: Boolean(result && result.success),
      executed: Boolean(result && result.executed),
      skipped: Boolean(result && result.skipped),
      reason:
        result && result.reason
          ? result.reason
          : "unknown_execution_result",
      result
    };
  }

  /**
   * Selects a worker and prepares a request without execution.
   *
   * @param {object} taskProfile
   * @param {object} options
   * @returns {{ routingDecision: object, adapterPayload: object }}
   */
  selectWorkerAndPrepareAdapter(taskProfile = {}, options = {}) {
    const routingDecision = this.selectWorker(taskProfile, {
      ...options,
      cost: options.cost || {}
    });

    const adapterPayload = this.requestAdapterPayload({
      worker: routingDecision.selectedWorker,
      goal: options.goal || "",
      prompt: options.prompt,
      promptFingerprint: options.promptFingerprint,
      context: options.context || {},
      estimatedCost: routingDecision.estimatedCostLevel,
      requiresApproval: options.requiresApproval !== false,
      founderApproved:
        options.founderApproved === true ||
        routingDecision.founderApproved === true,
      approvalState: options.approvalState,
      localWorkerHandler: options.localWorkerHandler,
      timeoutMs: options.timeoutMs,
      workerCommands: options.workerCommands,
      environment: options.environment,
      rootDir: options.rootDir
    });

    return {
      routingDecision,
      adapterPayload
    };
  }

  /**
   * Selects and executes a worker in one managed flow.
   *
   * @param {object} taskProfile
   * @param {object} options
   * @returns {{
   *   routingDecision: object,
   *   adapterPayload: object,
   *   executionResult: object
   * }}
   */
  selectWorkerAndExecute(taskProfile = {}, options = {}) {
    const routingDecision = this.selectWorker(taskProfile, {
      ...options,
      cost: options.cost || {}
    });

    const commonInput = {
      worker: routingDecision.selectedWorker,
      goal: options.goal || "",
      prompt: options.prompt,
      promptFingerprint: options.promptFingerprint,
      context: options.context || {},
      estimatedCost: routingDecision.estimatedCostLevel,
      requiresApproval: routingDecision.approvalRequired !== false,
      founderApproved:
        options.founderApproved === true ||
        routingDecision.founderApproved === true,
      approvalState: options.approvalState,
      localWorkerHandler: options.localWorkerHandler,
      timeoutMs: options.timeoutMs,
      workerCommands: options.workerCommands,
      environment: options.environment,
      rootDir: options.rootDir
    };

    const adapterPayload = this.requestAdapterPayload(commonInput);
    const executionResult = this.executeWorker(commonInput);

    return {
      routingDecision,
      adapterPayload,
      executionResult
    };
  }

  /**
   * Accepts a development goal, validates it, scans the project,
   * and returns a planning object.
   *
   * @param {object} developmentGoal
   * @returns {Promise<object>}
   */
  async manageDevelopmentGoal(developmentGoal) {
    if (!developmentGoal || typeof developmentGoal !== "object") {
      throw new Error(
        "A valid development goal object must be provided."
      );
    }

    if (!this.validator.validateGoal(developmentGoal)) {
      throw new Error(
        "Invalid development goal provided by the validator."
      );
    }

    const projectAnalysis = await this.scanner.scan(
      developmentGoal
    );

    if (!projectAnalysis) {
      throw new Error(
        "Failed to perform project analysis during scanning."
      );
    }

    const engineeringPlan = await this.planner.plan(
      projectAnalysis,
      developmentGoal
    );

    if (!engineeringPlan) {
      throw new Error(
        "Failed to generate engineering plan."
      );
    }

    return {
      goal: developmentGoal,
      analysis: projectAnalysis,
      plan: engineeringPlan
    };
  }

  /**
   * Coordinates a founder-approved multi-brain planning workflow.
   *
   * @param {string|object} founderGoal
   * @param {object} options
   * @returns {Promise<object>}
   */
  async manageMultiBrainGoal(founderGoal, options = {}) {
    if (
      !this.multiBrainPlanner ||
      !this.brainCoordinator ||
      !this.approvalGate
    ) {
      throw new Error(
        "Multi-brain orchestration dependencies are not configured."
      );
    }

    const goalText =
      typeof founderGoal === "string"
        ? founderGoal.trim()
        : String(
            founderGoal && founderGoal.rawGoal
              ? founderGoal.rawGoal
              : ""
          ).trim();

    if (!goalText) {
      throw new Error(
        "A founder-approved multibrain goal must be provided."
      );
    }

    const scanResult =
      this.scanner &&
      typeof this.scanner.scan === "function"
        ? await this.scanner.scan({
            goal: goalText,
            mode: "multibrain_readonly"
          })
        : null;

    const plan = this.multiBrainPlanner.plan(goalText, {
      ...(options.context || {}),
      scan: scanResult || {}
    });

    const approval = this.approvalGate.evaluate(
      options.approval || {}
    );

    const coordination = this.brainCoordinator.coordinate(
      plan,
      options.approval || {}
    );

    return {
      goal: goalText,
      scanResult: scanResult || {},
      plan,
      coordination,
      approval,
      founderApprovalRequired: true,
      writeStopped: coordination.writeStopped
    };
  }

  /**
   * Development Director wrapper.
   *
   * Builds the engineering roadmap first, then passes it into the
   * multi-brain planning and coordination workflow.
   *
   * @param {string|object} founderGoal
   * @param {object} options
   * @returns {Promise<object>}
   */
  async manageDevelopmentDirectorGoal(
    founderGoal,
    options = {}
  ) {
    if (
      !this.engineeringDirector ||
      typeof this.engineeringDirector.plan !== "function"
    ) {
      throw new Error(
        "EngineeringDirector is not configured on EngineeringManager."
      );
    }

    const directorContext = {
      ...(options.context || {}),
      mode: "development_director",
      readOnly: true
    };

    const roadmap = this.engineeringDirector.plan(
      founderGoal,
      directorContext
    );

    if (!roadmap) {
      throw new Error(
        "EngineeringDirector failed to generate an engineering roadmap."
      );
    }

    const orchestration = await this.manageMultiBrainGoal(
      founderGoal,
      {
        ...options,
        context: {
          ...directorContext,
          engineeringRoadmap: roadmap,
          directorFingerprint: roadmap.fingerprint || null
        },
        approval: {
          ...(options.approval || {}),
          intendedOperation:
            options.approval &&
            options.approval.intendedOperation
              ? options.approval.intendedOperation
              : "development_director_readonly"
        }
      }
    );

    return {
      ...orchestration,
      roadmap,
      engineeringRoadmap: roadmap,
      mode: "development_director",
      readOnly: true
    };
  }
}

module.exports = EngineeringManager;