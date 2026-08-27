/**
 * GARUDA Task State Tracker
 * Manages explicit lifecycle states for Mother Brain tasks.
 */
const TASK_STATES = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  VERIFIED_SUCCESS: 'VERIFIED_SUCCESS',
  VERIFIED_FAILURE: 'VERIFIED_FAILURE',
  RECOVERY: 'RECOVERY',
  BLOCKED: 'BLOCKED',
  STOPPED: 'STOPPED'
});

class TaskStateTracker {
  constructor(initialTasks = []) {
    this.tasks = (Array.isArray(initialTasks) ? initialTasks : []).map((task, index) => ({
      id: String(task.id || task.taskId || `task_${index + 1}`),
      taskType: task.taskType || task.type || 'unknown',
      targetPath: task.targetPath || task.path || task.file || null,
      command: task.command || task.cmd || null,
      content: task.content || '',
      cwd: task.cwd || null,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      status: task.status || TASK_STATES.PENDING,
      history: [],
      rawTask: task
    }));
  }

  getTask(taskId) {
    return this.tasks.find((t) => t.id === taskId) || null;
  }

  updateState(taskId, newStatus, details = {}) {
    const task = this.getTask(taskId);
    if (!task) return null;

    if (Object.values(TASK_STATES).includes(newStatus)) {
      const timestamp = new Date().toISOString();
      task.history.push({ from: task.status, to: newStatus, timestamp, details });
      task.status = newStatus;
    }

    return task;
  }

  getAllTasks() {
    return this.tasks.map((t) => ({ ...t }));
  }

  isMissionComplete() {
    return this.tasks.length > 0 && this.tasks.every((t) => t.status === TASK_STATES.VERIFIED_SUCCESS);
  }
}

module.exports = {
  TASK_STATES,
  TaskStateTracker
};
