class DecisionMemory {
  constructor(options = {}) {
    this.options = options;
    this.entries = [];
  }

  store(entry = {}) {
    const normalized = {
      id: entry.id || `memory-${Date.now()}`,
      summary: entry.summary || "Recommendation stored for founder review.",
      createdAt: entry.createdAt || new Date().toISOString(),
      approved: entry.approved ?? false
    };

    this.entries.push(normalized);
    return normalized;
  }

  getRecent() {
    return this.entries.slice(-5);
  }
}

export { DecisionMemory };
export default DecisionMemory;
