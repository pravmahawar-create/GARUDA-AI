class SuccessAnalyzer {
  constructor(options = {}) {
    this.options = options;
  }

  analyzeSuccess(records = []) {
    return records.filter((record) => (record.successScore || 0) >= 70);
  }
}

export { SuccessAnalyzer };
export default SuccessAnalyzer;
