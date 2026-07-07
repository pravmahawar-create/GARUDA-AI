class FailureAnalyzer {
  constructor(options = {}) {
    this.options = options;
  }

  analyzeFailures(records = []) {
    return records.filter((record) => (record.successScore || 0) < 50);
  }
}

export { FailureAnalyzer };
export default FailureAnalyzer;
