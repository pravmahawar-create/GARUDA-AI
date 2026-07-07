class DependencyAnalyzer {
  constructor(options = {}) {
    this.options = options;
  }

  analyzeDependencies(project = {}) {
    return {
      dependencies: project.dependencies || ["react", "vite", "express", "mongoose", "framer-motion"],
      risk: project.dependencyRisk || "moderate",
      notes: project.notes || ["core dependencies are stable", "new planner modules should stay decoupled"]
    };
  }
}

export { DependencyAnalyzer };
export default DependencyAnalyzer;
