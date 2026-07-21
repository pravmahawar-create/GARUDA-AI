class EngineeringIntelligenceProvider {
  constructor({ id, mode = "local" } = {}) {
    if (!id || typeof id !== "string") throw new Error("Engineering intelligence provider requires an id");
    if (!new Set(["local", "external"]).has(mode)) throw new Error("Engineering intelligence provider mode is invalid");
    this.id = id;
    this.mode = mode;
  }

  getMetadata() {
    return { id: this.id, mode: this.mode, directWriteAllowed: false, commandExecutionAllowed: false, gitActionsAllowed: false };
  }

  propose() {
    throw new Error("Engineering intelligence provider must implement propose(request)");
  }
}

module.exports = EngineeringIntelligenceProvider;
module.exports.EngineeringIntelligenceProvider = EngineeringIntelligenceProvider;
