class EngineHealthMonitor {
  constructor() {
    this.health = new Map();
  }

  reportHealth(engineName, status) {
    this.health.set(engineName, status);
    return status;
  }

  getHealth() {
    return Object.fromEntries(this.health.entries());
  }
}

const engineHealthMonitor = new EngineHealthMonitor();

export { EngineHealthMonitor, engineHealthMonitor };
export default engineHealthMonitor;
