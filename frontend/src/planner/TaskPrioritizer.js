class TaskPrioritizer {
  constructor(options = {}) {
    this.options = options;
  }

  prioritizeTasks(tasks = []) {
    return tasks
      .map((task) => ({
        ...task,
        priority: task.priority || this.estimatePriority(task)
      }))
      .sort((a, b) => this.scoreTask(b) - this.scoreTask(a));
  }

  estimatePriority(task = {}) {
    const businessValue = task.businessValue || 3;
    const engineeringValue = task.engineeringValue || 3;
    const difficulty = task.difficulty || 2;
    const risk = task.risk || 1;
    return businessValue + engineeringValue + difficulty + risk;
  }

  scoreTask(task = {}) {
    return (task.priority || this.estimatePriority(task)) + (task.approvalRequired ? 1 : 0);
  }
}

export { TaskPrioritizer };
export default TaskPrioritizer;
