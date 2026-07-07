class FeedbackEngine {
  constructor(options = {}) {
    this.options = options;
  }

  evaluateOutcome(result = {}) {
    return {
      success: result.success ?? false,
      score: result.score ?? 0,
      feedback: result.feedback || "No feedback captured yet."
    };
  }
}

export { FeedbackEngine };
export default FeedbackEngine;
