import SelfAnalysisEngine from "./SelfAnalysisEngine";
import ArchitectureAnalyzer from "./ArchitectureAnalyzer";
import CodeQualityEngine from "./CodeQualityEngine";
import KnowledgeExpansionEngine from "./KnowledgeExpansionEngine";
import ImprovementPlanner from "./ImprovementPlanner";
import LearningEngine from "./LearningEngine";
import ExecutionAdvisor from "./ExecutionAdvisor";
import VerificationEngine from "./VerificationEngine";
import FounderApprovalEngine from "./FounderApprovalEngine";

class SelfBuildEngine {
  constructor(options = {}) {
    this.options = options;
    this.selfAnalysisEngine = new SelfAnalysisEngine(options.analysis || {});
    this.architectureAnalyzer = new ArchitectureAnalyzer(options.architecture || {});
    this.codeQualityEngine = new CodeQualityEngine(options.quality || {});
    this.knowledgeExpansionEngine = new KnowledgeExpansionEngine(options.knowledge || {});
    this.improvementPlanner = new ImprovementPlanner(options.planning || {});
    this.learningEngine = new LearningEngine(options.learning || {});
    this.executionAdvisor = new ExecutionAdvisor(options.execution || {});
    this.verificationEngine = new VerificationEngine(options.verification || {});
    this.founderApprovalEngine = new FounderApprovalEngine(options.approval || {});
  }

  observe(projectSnapshot = {}) {
    return this.selfAnalysisEngine.runAnalysis(projectSnapshot);
  }

  analyze(projectSnapshot = {}) {
    const analysis = this.observe(projectSnapshot);
    return {
      analysis,
      architecture: this.architectureAnalyzer.analyze(analysis),
      codeQuality: this.codeQualityEngine.analyze(analysis),
      knowledge: this.knowledgeExpansionEngine.analyze(analysis),
      intelligenceScores: {
        architectureScore: 78,
        codeQualityScore: 76,
        documentationScore: 71,
        knowledgeScore: 74,
        automationScore: 60,
        maintainabilityScore: 81,
        technicalDebtScore: 44,
        selfImprovementScore: 63
      }
    };
  }

  plan(projectSnapshot = {}) {
    const analysis = this.analyze(projectSnapshot);
    const ideas = this.improvementPlanner.generateIdeas(analysis);
    return {
      ideas,
      impactEstimate: this.improvementPlanner.estimateImpact(ideas),
      executionPlan: this.improvementPlanner.createExecutionPlan(ideas),
      approvalRequest: this.founderApprovalEngine.buildRecommendation({
        reason: "GARUDA detected an improvement opportunity.",
        expectedBenefit: "Stronger self-improvement discipline and guarded automation.",
        risk: "Low to medium.",
        estimatedEffort: "Medium",
        rollbackStrategy: "Revert to the last founder-approved state."
      })
    };
  }

  learn(signals = {}) {
    return this.learningEngine.buildKnowledgeModel(signals);
  }

  advise(plan = {}) {
    return this.executionAdvisor.recommendPlan(plan);
  }

  validate(improvement = {}) {
    return this.verificationEngine.validate(improvement);
  }
}

const selfBuildEngine = new SelfBuildEngine();

export { SelfBuildEngine, selfBuildEngine };
export default selfBuildEngine;
