class ProgressTracker {
  constructor(options = {}) {
    this.options = options;
    this.completedSteps = [];
    this.totalSteps = 0;
  }

  trackProgress(items = []) {
    this.totalSteps = items.length;
    this.completedSteps = items.filter((item) => item.completed).map((item) => item.title);
    return {
      completedSteps: this.completedSteps,
      totalSteps: this.totalSteps,
      progressPercent: this.totalSteps ? Math.round((this.completedSteps.length / this.totalSteps) * 100) : 0,
      status: this.completedSteps.length === this.totalSteps ? "complete" : "in-progress"
    };
  }
}

export { ProgressTracker };
export default ProgressTracker;
