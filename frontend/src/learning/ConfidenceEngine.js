class ConfidenceEngine {
  constructor(options = {}) {
    this.options = options;
  }

  calculateConfidence(records = []) {
    if (!records.length) return 0;
    const average = records.reduce((sum, record) => sum + (record.successScore || 0), 0) / records.length;
    return Math.round(average);
  }
}

export { ConfidenceEngine };
export default ConfidenceEngine;
