class ExecutionRoadmap {
  constructor(options = {}) {
    this.options = options;
  }

  generateRoadmap(tasks = []) {
    return {
      critical: tasks.filter((task) => task.category === "Critical"),
      high: tasks.filter((task) => task.category === "High"),
      medium: tasks.filter((task) => task.category === "Medium"),
      low: tasks.filter((task) => task.category === "Low"),
      futureVision: tasks.filter((task) => task.category === "Future Vision"),
      research: tasks.filter((task) => task.category === "Research"),
      experimental: tasks.filter((task) => task.category === "Experimental")
    };
  }
}

export { ExecutionRoadmap };
export default ExecutionRoadmap;
