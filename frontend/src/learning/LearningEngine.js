import ExperienceEngine from "./ExperienceEngine";

class LearningEngine {
  constructor(options = {}) {
    this.options = options;
    this.experienceEngine = new ExperienceEngine(options.experience || {});
    this.learningScore = 0;
    this.confidenceScore = 0;
    this.lessons = [];
  }

  learn(payload = {}) {
    const experience = this.experienceEngine.recordExperience(payload);
    const successScore = payload.successScore ?? 0;
    this.learningScore = Math.min(100, this.learningScore + successScore * 0.5);
    this.confidenceScore = Math.min(100, Math.max(0, this.confidenceScore + (payload.confidenceChange || 0)));

    if (payload.lessonsLearned?.length) {
      this.lessons = [...this.lessons, ...payload.lessonsLearned].slice(-5);
    }

    return {
      experience,
      learningScore: this.learningScore,
      confidenceScore: this.confidenceScore,
      lessons: this.lessons
    };
  }

  remember() {
    return this.experienceEngine.getRecentExperiences();
  }

  evaluate(payload = {}) {
    return {
      successScore: payload.successScore ?? 0,
      confidenceScore: this.confidenceScore,
      recommendation: payload.recommendation || "Recommend a safer strategy for the next cycle."
    };
  }

  compare(prediction = {}, actual = {}) {
    return {
      predicted: prediction,
      actual,
      delta: (actual.successScore || 0) - (prediction.successScore || 0)
    };
  }

  updateConfidence(change = 0) {
    this.confidenceScore = Math.min(100, Math.max(0, this.confidenceScore + change));
    return this.confidenceScore;
  }

  recordExperience(payload = {}) {
    return this.learn(payload);
  }

  generateLessons() {
    return this.lessons; 
  }
}

const learningEngine = new LearningEngine();

export { LearningEngine, learningEngine };
export default learningEngine;
