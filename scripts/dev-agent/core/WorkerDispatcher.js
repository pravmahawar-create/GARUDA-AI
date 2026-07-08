class WorkerDispatcher {
  constructor() {
    this.VALID_TASK_TYPES = ['feature', 'bugfix', 'refactor', 'security', 'architecture', 'core', 'documentation'];
    this.VALID_RISK_LEVELS = ['low', 'medium', 'high'];
  }

  /**
   * Validates the incoming task object.
   * @param {object} task - The task object to validate.
   * @returns {boolean} True if the task is valid, false otherwise.
   */
  _validateTask(task) {
    if (!task || typeof task !== 'object') {
      return false;
    }
    if (!this.VALID_TASK_TYPES.includes(task.type)) {
      return false;
    }
    if (!this.VALID_RISK_LEVELS.includes(task.risk)) {
      return false;
    }
    if (!Array.isArray(task.files)) {
      return false;
    }
    if (task.budget === undefined || task.budget === null) {
      // Assuming budget must be explicitly provided, even if 0 or an object.
      return false;
    }
    return true;
  }

  /**
   * Dispatches a task to the most suitable worker based on predefined rules.
   * @param {object} task - The task object containing type, risk, files, and budget.
   * @returns {object} An object detailing the selected worker and plan.
   * @throws {Error} If the task is invalid.
   */
  dispatch(task) {
    if (!this._validateTask(task)) {
      throw new Error('Invalid task object provided to WorkerDispatcher. Please ensure type, risk, files (array), and budget are present and valid.');
    }

    let selectedWorker = 'manual';
    let reason = 'Defaulting to manual worker due to task complexity or unspecified criteria.';
    let confidence = 'low';
    let approvalRequired = true;
    let estimatedCostRisk = 'medium';
    let allowedActions = ['read', 'comment', 'discuss'];
    let blockedActions = ['write_code', 'deploy', 'merge', 'final_commit'];

    const numFiles = task.files.length;

    // Rule 1: Prefer manual for high-risk/core/security tasks
    if (task.risk === 'high' || task.type === 'core' || task.type === 'security') {
      selectedWorker = 'manual';
      reason = `Task identified as high risk (${task.risk}), a core system change (${task.type}), or security related. Manual intervention is preferred to ensure safety and quality.`;
      confidence = 'low';
      approvalRequired = true;
      estimatedCostRisk = 'high';
      allowedActions = ['read', 'discuss', 'propose_plan'];
      blockedActions = ['write_code', 'deploy', 'merge', 'final_commit'];
    }
    // Rule 3: Prefer cline for large multi-file architecture tasks
    else if (task.type === 'architecture' && numFiles > 3) {
      selectedWorker = 'cline';
      reason = `Task involves significant architectural changes affecting ${numFiles} files. Cline worker is selected for its capability in large-scale architectural planning.`;
      confidence = 'medium';
      approvalRequired = true; // Large architectural changes typically require approval.
      estimatedCostRisk = 'medium';
      allowedActions = ['read', 'propose_architecture', 'generate_skeletons', 'design_review'];
      blockedActions = ['write_code', 'deploy', 'merge', 'final_commit', 'deploy_code'];
    }
    // Rule 2: Prefer aider for focused single-file or small multi-file code edits
    else if (numFiles > 0 && numFiles <= 3) {
      selectedWorker = 'aider';
      reason = `Task involves focused code edits on a small number of files (${numFiles} file(s)). Aider worker is selected for efficient, targeted changes.`;
      confidence = 'high';
      approvalRequired = true;
      estimatedCostRisk = (task.risk === 'low' ? 'low' : 'medium');
      allowedActions = ['read', 'run_tests', 'refactor_small'];
      blockedActions = ['write_code', 'deploy', 'merge', 'final_commit', 'deploy_to_production'];
    }
    // Fallback: If no specific automated worker rule matches, revert to manual.
    else {
        selectedWorker = 'manual';
        reason = `No automated worker perfectly matched the task criteria (Type: ${task.type}, Risk: ${task.risk}, Files: ${numFiles}). Defaulting to manual for careful review and decision.`;
        confidence = 'low';
        approvalRequired = true;
        estimatedCostRisk = 'medium';
        allowedActions = ['read', 'comment', 'discuss', 'request_clarification'];
        blockedActions = ['write_code', 'deploy', 'merge', 'final_commit'];
    }


    return {
      selectedWorker,
      reason,
      confidence,
      approvalRequired,
      estimatedCostRisk,
      allowedActions,
      blockedActions,
    };
  }
}

module.exports = WorkerDispatcher;
