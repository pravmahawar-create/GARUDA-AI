import continuousThinkingEngine from "./ContinuousThinkingEngine";

class ThinkingScheduler {
  constructor(options = {}) {
    this.options = options;
    this.intervalMs = options.intervalMs || 45000;
    this.isRunning = false;
    this.timer = null;
    this.thinkingQueue = [];
    this.processingQueue = [];
    this.completedIdeas = [];
    this.pendingApproval = [];
    this.lastCycle = null;
    this.status = "idle";
    this.currentObservation = null;
    this.currentRecommendation = null;
    this.currentOpportunity = null;
    this.intelligenceScores = {
      observationScore: 0,
      learningScore: 0,
      predictionScore: 0,
      innovationScore: 0,
      planningScore: 0,
      architectureScore: 0,
      opportunityScore: 0,
      overallIntelligenceScore: 0
    };
  }

  startThinking() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.status = "thinking";
    this.timer = window.setInterval(() => {
      this.runThinkingCycle();
    }, this.intervalMs);
    this.runThinkingCycle();
  }

  stopThinking() {
    this.isRunning = false;
    this.status = "idle";
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runThinkingCycle() {
    this.status = "thinking";
    this.processingQueue = [...this.thinkingQueue];
    this.currentObservation = continuousThinkingEngine.observe({
      projectArchitecture: "modular frontend and service layers",
      revenueOpportunities: ["premium workflow automation"],
      userExperience: "stable"
    });

    const reasoning = continuousThinkingEngine.think({
      projectArchitecture: this.currentObservation.projectArchitecture,
      revenueOpportunities: this.currentObservation.revenueOpportunities,
      userExperience: this.currentObservation.userExperience
    });

    const recommendation = {
      title: reasoning.idea?.title || "Prepare a future intelligence improvement",
      description: reasoning.idea?.benefit || "A recommendation is ready for founder review.",
      category: reasoning.idea?.category || "small-improvement",
      priority: reasoning.idea?.risk === "Low" ? "medium" : "high",
      benefit: reasoning.idea?.benefit || "Improves visibility and planning.",
      risk: reasoning.idea?.risk || "Low",
      difficulty: reasoning.idea?.difficulty || "Medium",
      estimatedTime: reasoning.idea?.estimatedTime || "2-5 days",
      dependencies: reasoning.idea?.dependencies || ["approval workflow"],
      confidenceScore: this.calculateConfidence(reasoning),
      createdAt: new Date().toISOString()
    };

    this.currentRecommendation = recommendation;
    this.currentOpportunity = reasoning.opportunities?.businessOpportunities?.[0] || "No new opportunities";
    this.updateScores(reasoning);
    this.storeRecommendation(recommendation);

    this.lastCycle = new Date().toISOString();
    this.status = "awaiting-approval";
    return recommendation;
  }

  updateScores(reasoning = {}) {
    const scores = reasoning.intelligenceScores || {};
    this.intelligenceScores = {
      observationScore: scores.observationScore || 78,
      learningScore: scores.learningScore || 72,
      predictionScore: scores.predictionScore || 74,
      innovationScore: scores.innovationScore || 69,
      planningScore: scores.planningScore || 75,
      architectureScore: scores.architectureScore || 80,
      opportunityScore: Math.min(100, (scores.overallIntelligenceScore || 74) + 2),
      overallIntelligenceScore: scores.overallIntelligenceScore || 74
    };
    return this.intelligenceScores;
  }

  storeRecommendation(recommendation) {
    const entry = {
      ...recommendation,
      id: `recommendation-${Date.now()}`
    };
    this.thinkingQueue.push(entry);
    this.pendingApproval.push(entry);
    this.completedIdeas.push(entry);
    return entry;
  }

  getLatestIdeas() {
    return this.completedIdeas.slice(-5).reverse();
  }

  getThinkingStatus() {
    return {
      isRunning: this.isRunning,
      status: this.status,
      lastCycle: this.lastCycle,
      thinkingQueueSize: this.thinkingQueue.length,
      pendingFounderApprovals: this.pendingApproval.length,
      intelligenceScores: this.intelligenceScores,
      currentObservation: this.currentObservation,
      currentRecommendation: this.currentRecommendation,
      currentOpportunity: this.currentOpportunity
    };
  }

  calculateConfidence(reasoning = {}) {
    const base = reasoning.intelligenceScores?.overallIntelligenceScore || 74;
    return Math.min(100, Math.max(40, Math.round(base + 8)));
  }
}

const thinkingScheduler = new ThinkingScheduler();

export { ThinkingScheduler, thinkingScheduler };
export default thinkingScheduler;
