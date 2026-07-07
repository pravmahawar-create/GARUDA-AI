class TaskCoordinator {
  constructor() {
    this.runningTasks = [];
    this.globalTasks = [];
  }

  addTask(task) {
    this.runningTasks.push(task);
    this.globalTasks.push(task);
    return task;
  }

  getTasks() {
    return {
      runningTasks: this.runningTasks,
      globalTasks: this.globalTasks
    };
  }
}

const taskCoordinator = new TaskCoordinator();

export { TaskCoordinator, taskCoordinator };
export default taskCoordinator;
