class EngineeringRevisionProvider {
  constructor({ id, mode = "local" } = {}) {
    if (!id || typeof id !== "string") throw new Error("Engineering revision provider requires an id");
    if (!new Set(["local", "external"]).has(mode)) throw new Error("Engineering revision provider mode is invalid");
    this.id = id;
    this.mode = mode;
  }

  getMetadata() {
    return { id: this.id, mode: this.mode, directWriteAllowed: false, commandExecutionAllowed: false, gitActionsAllowed: false };
  }

  revise() {
    throw new Error("Engineering revision provider must implement revise(context)");
  }
}

module.exports = EngineeringRevisionProvider;
module.exports.EngineeringRevisionProvider = EngineeringRevisionProvider;
