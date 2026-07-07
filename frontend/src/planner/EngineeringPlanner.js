import ArchitectureAnalyzer from "./ArchitectureAnalyzer";
import DependencyAnalyzer from "./DependencyAnalyzer";
import CapabilityScanner from "./CapabilityScanner";
import TaskPrioritizer from "./TaskPrioritizer";
import ExecutionRoadmap from "./ExecutionRoadmap";
import ProgressTracker from "./ProgressTracker";
import RiskAssessment from "./RiskAssessment";

class EngineeringPlanner {
  constructor(options = {}) {
    this.options = options;
    this.architectureAnalyzer = new ArchitectureAnalyzer(options.architecture || {});
    this.dependencyAnalyzer = new DependencyAnalyzer(options.dependencies || {});
    this.capabilityScanner = new CapabilityScanner(options.capabilities || {});
    this.taskPrioritizer = new TaskPrioritizer(options.tasks || {});
    this.executionRoadmap = new ExecutionRoadmap(options.roadmap || {});
    this.progressTracker = new ProgressTracker(options.progress || {});
    this.riskAssessment = new RiskAssessment(options.risk || {});
  }

  scanArchitecture(project = {}) {
    return this.architectureAnalyzer.analyzeArchitecture(project);
  }

  analyzeDependencies(project = {}) {
    return this.dependencyAnalyzer.analyzeDependencies(project);
  }

  scanCapabilities(project = {}) {
    return this.capabilityScanner.scanCapabilities(project);
  }

  generateRoadmap(project = {}) {
    const tasks = [
      {
        title: "Expand planner telemetry",
        description: "Add richer roadmap planning signals and approval-aware planning state.",
        businessValue: 4,
        engineeringValue: 4,
        difficulty: 2,
        risk: "Medium",
        dependencies: ["planner layer"],
        estimatedTime: "3-5 days",
        category: "High",
        approvalRequired: true,
        recommendedSprint: "Sprint 1"
      },
      {
        title: "Strengthen self-build feedback loop",
        description: "Connect self-build intelligence to richer planning and reporting pathways.",
        businessValue: 4,
        engineeringValue: 5,
        difficulty: 3,
        risk: "High",
        dependencies: ["self-build", "continuous intelligence"],
        estimatedTime: "5-7 days",
        category: "Critical",
        approvalRequired: true,
        recommendedSprint: "Sprint 2"
      },
      {
        title: "Research revenue intelligence foundations",
        description: "Prepare a future roadmap for revenue-oriented automation and insight generation.",
        businessValue: 3,
        engineeringValue: 4,
        difficulty: 2,
        risk: "Medium",
        dependencies: ["revenue universe"],
        estimatedTime: "4-6 days",
        category: "Future Vision",
        approvalRequired: true,
        recommendedSprint: "Research"
      }
    ];

    const prioritized = this.prioritizeTasks(tasks);
    const roadmap = this.executionRoadmap.generateRoadmap(prioritized);
    const progress = this.trackProgress(prioritized);

    return {
      architecture: this.scanArchitecture(project),
      dependencies: this.analyzeDependencies(project),
      capabilities: this.scanCapabilities(project),
      tasks: prioritized,
      roadmap,
      progress,
      planningStatus: "ready-for-founder-review"
    };
  }

  prioritizeTasks(tasks = []) {
    return this.taskPrioritizer.prioritizeTasks(tasks);
  }

  estimateComplexity(task = {}) {
    return {
      complexity: task.difficulty || "Medium",
      estimatedTime: task.estimatedTime || "2-4 days"
    };
  }

  trackProgress(tasks = []) {
    return this.progressTracker.trackProgress(tasks.map((task, index) => ({
      title: task.title,
      completed: index < 1
    })));
  }
}

const engineeringPlanner = new EngineeringPlanner();

export { EngineeringPlanner, engineeringPlanner };
export default engineeringPlanner;
