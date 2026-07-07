class ContextManager {
  constructor() {
    this.context = {
      globalGoal: "Protect founder authority while expanding GARUDA intelligence.",
      thinkingStatus: "ready",
      planningStatus: "ready",
      synchronizationStatus: "idle",
      overallHealth: "stable"
    };
  }

  setContext(partial) {
    this.context = { ...this.context, ...partial };
    return this.context;
  }

  getContext() {
    return this.context;
  }
}

const contextManager = new ContextManager();

export { ContextManager, contextManager };
export default contextManager;
