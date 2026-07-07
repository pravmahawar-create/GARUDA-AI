class EngineRegistry {
  constructor() {
    this.engines = new Map();
  }

  registerEngine(name, engine) {
    this.engines.set(name, engine);
    return engine;
  }

  unregisterEngine(name) {
    const engine = this.engines.get(name);
    this.engines.delete(name);
    return engine;
  }

  getRegisteredEngines() {
    return Array.from(this.engines.entries()).map(([name, engine]) => ({
      name,
      status: engine?.status || "ready"
    }));
  }
}

const engineRegistry = new EngineRegistry();

export { EngineRegistry, engineRegistry };
export default engineRegistry;
