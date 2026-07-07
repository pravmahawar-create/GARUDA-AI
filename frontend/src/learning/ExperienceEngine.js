class ExperienceEngine {
  constructor(options = {}) {
    this.options = options;
    this.records = [];
  }

  recordExperience(record = {}) {
    const entry = {
      goal: record.goal || "Unknown goal",
      action: record.action || "No action recorded",
      expectedResult: record.expectedResult || "Pending",
      actualResult: record.actualResult || "Pending",
      successScore: record.successScore ?? 0,
      failureReason: record.failureReason || "None",
      confidenceChange: record.confidenceChange || 0,
      lessonsLearned: record.lessonsLearned || [],
      createdAt: record.createdAt || new Date().toISOString()
    };

    this.records.push(entry);
    return entry;
  }

  getRecentExperiences(limit = 5) {
    return this.records.slice(-limit).reverse();
  }
}

export { ExperienceEngine };
export default ExperienceEngine;
