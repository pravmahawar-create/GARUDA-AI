class EngineeringManager {
  /**
   * Constructs an EngineeringManager instance.
   * @param {object} dependencies - Injected dependencies.
   * @param {object} dependencies.scanner - Component responsible for scanning project aspects.
   * @param {object} dependencies.planner - Component responsible for generating engineering plans.
   * @param {object} dependencies.dispatcher - Component related to dispatching tasks (not used for direct execution here).
   * @param {object} dependencies.validator - Component responsible for validating development goals.
   * @param {object} dependencies.reporter - Component related to reporting (not used for direct reporting here).
   */
  constructor({ scanner, planner, dispatcher, validator, reporter, multiBrainPlanner, brainCoordinator, approvalGate, workforceRouter, externalWorkerAdapter }) {
    if (!scanner || !planner || !validator) {
      throw new Error('EngineeringManager requires scanner, planner, and validator dependencies.');
    }
    this.scanner = scanner;
    this.planner = planner;
    this.dispatcher = dispatcher;
    this.validator = validator;
    this.reporter = reporter;
    this.multiBrainPlanner = multiBrainPlanner || null;
    this.brainCoordinator = brainCoordinator || null;
    this.approvalGate = approvalGate || null;
    this.workforceRouter = workforceRouter || null;
    this.externalWorkerAdapter = externalWorkerAdapter || null;
  }

  /**
   * Selects worker routing using the injected WorkforceRouter.
   * This is routing/configuration only and does not execute external workers.
   *
   * @param {object} taskProfile
   * @param {object} options
   * @param {object} options.cost
   * @returns {object}
   */
  selectWorker(taskProfile = {}, options = {}) {
    if (!this.workforceRouter || typeof this.workforceRouter.route !== 'function') {
      throw new Error('WorkforceRouter is not configured on EngineeringManager.');
    }

    return this.workforceRouter.route(taskProfile, options);
  }

  /**
   * Builds a preview-only adapter request payload for the selected worker.
   * This does not execute workers and never performs networking.
   *
   * @param {object} input
   * @param {string} input.worker
   * @param {string} input.goal
   * @param {object|string} input.prompt
   * @param {object} input.context
   * @returns {object}
   */
  requestAdapterPayload(input = {}) {
    if (!this.externalWorkerAdapter || typeof this.externalWorkerAdapter.buildRequest !== 'function') {
      throw new Error('ExternalWorkerAdapter is not configured on EngineeringManager.');
    }

    return this.externalWorkerAdapter.buildRequest(input.worker, input.goal, {
      ...(input.context || {}),
      prompt: input.prompt,
      promptFingerprint: input.promptFingerprint,
      estimatedCost: input.estimatedCost,
      requiresApproval: input.requiresApproval
    });
  }

  /**
   * Runs worker selection and prepares a preview-only adapter payload in one managed flow.
   *
   * @param {object} taskProfile
   * @param {object} options
   * @returns {{ routingDecision: object, adapterPayload: object }}
   */
  selectWorkerAndPrepareAdapter(taskProfile = {}, options = {}) {
    const routingDecision = this.selectWorker(taskProfile, { cost: options.cost || {} });
    const adapterPayload = this.requestAdapterPayload({
      worker: routingDecision.selectedWorker,
      goal: options.goal || "",
      prompt: options.prompt,
      promptFingerprint: options.promptFingerprint,
      context: options.context || {},
      estimatedCost: routingDecision.estimatedCostLevel,
      requiresApproval: options.requiresApproval !== false
    });

    return { routingDecision, adapterPayload };
  }

  /**
   * Accepts a development goal, validates it, and coordinates the planning process
   * to build and return an execution plan.
   *
   * @param {object} developmentGoal - The goal for development, e.g., { type: 'feature', description: 'Implement user authentication' }.
   * @returns {object} An execution object (plan) detailing the steps required to achieve the goal.
   * @throws {Error} If the development goal is invalid or if planning fails.
   */
  async manageDevelopmentGoal(developmentGoal) {
    if (!developmentGoal || typeof developmentGoal !== 'object') {
      throw new Error('A valid development goal object must be provided.');
    }

    if (!this.validator.validateGoal(developmentGoal)) {
      throw new Error('Invalid development goal provided by the validator.');
    }

    const projectAnalysis = await this.scanner.scan(developmentGoal);
    if (!projectAnalysis) {
      throw new Error('Failed to perform project analysis during scanning.');
    }

    const engineeringPlan = await this.planner.plan(projectAnalysis, developmentGoal);
    if (!engineeringPlan) {
      throw new Error('Failed to generate engineering plan.');
    }

    const executionObject = {
      goal: developmentGoal,
      analysis: projectAnalysis,
      plan: engineeringPlan,
    };

    return executionObject;
  }

  /**
   * Coordinates a founder-approved multibrain planning workflow in read-only mode.
   * It generates a task plan, dispatches tasks to local worker brains, validates proposals,
   * and stops before any write operation unless explicit founder approval is present.
   *
   * @param {string|object} founderGoal
   * @param {object} options
   * @param {object} options.context - Additional context for planning.
   * @param {object} options.approval - Approval context passed to the approval gate.
   * @returns {object}
   */
  async manageMultiBrainGoal(founderGoal, options = {}) {
    if (!this.multiBrainPlanner || !this.brainCoordinator || !this.approvalGate) {
      throw new Error('Multi-brain orchestration dependencies are not configured.');
    }

    const goalText = typeof founderGoal === 'string'
      ? founderGoal.trim()
      : String(founderGoal && founderGoal.rawGoal ? founderGoal.rawGoal : '').trim();

    if (!goalText) {
      throw new Error('A founder-approved multibrain goal must be provided.');
    }

    const scanResult = this.scanner && typeof this.scanner.scan === 'function'
      ? await this.scanner.scan({ goal: goalText, mode: 'multibrain_readonly' })
      : null;

    const plan = this.multiBrainPlanner.plan(goalText, {
      ...(options.context || {}),
      scan: scanResult || {}
    });

    const approval = this.approvalGate.evaluate(options.approval || {});
    const coordination = this.brainCoordinator.coordinate(plan, options.approval || {});

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
   * Development Director mode wrapper.
   * Keeps multibrain orchestration in read-only director mode and never assumes write execution.
   *
   * @param {string|object} founderGoal
   * @param {object} options
   * @returns {object}
   */
  async manageDevelopmentDirectorGoal(founderGoal, options = {}) {
    const orchestration = await this.manageMultiBrainGoal(founderGoal, {
      ...options,
      context: {
        ...(options.context || {}),
        mode: 'development_director',
        readOnly: true
      },
      approval: {
        ...(options.approval || {}),
        intendedOperation: options.approval && options.approval.intendedOperation
          ? options.approval.intendedOperation
          : 'development_director_readonly'
      }
    });

    return {
      ...orchestration,
      mode: 'development_director',
      readOnly: true
    };
  }
}

module.exports = EngineeringManager;
