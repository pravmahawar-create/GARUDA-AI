import { eventBus } from "./EventBus";
import { engineRegistry } from "./EngineRegistry";
import { contextManager } from "./ContextManager";
import { memoryCoordinator } from "./MemoryCoordinator";
import { taskCoordinator } from "./TaskCoordinator";
import { engineHealthMonitor } from "./EngineHealthMonitor";

class MotherBrain {
  constructor() {
    this.eventBus = eventBus;
    this.engineRegistry = engineRegistry;
    this.contextManager = contextManager;
    this.memoryCoordinator = memoryCoordinator;
    this.taskCoordinator = taskCoordinator;
    this.engineHealthMonitor = engineHealthMonitor;
    this.status = "ready";
  }

  registerEngine(name, engine) {
    this.engineRegistry.registerEngine(name, engine);
    this.engineHealthMonitor.reportHealth(name, engine?.status || "ready");
    this.eventBus.publish("engine:registered", { name, status: engine?.status || "ready" });
    return engine;
  }

  unregisterEngine(name) {
    const engine = this.engineRegistry.unregisterEngine(name);
    this.eventBus.publish("engine:unregistered", { name, engine });
    return engine;
  }

  broadcast(eventName, payload) {
    this.eventBus.publish(eventName, payload);
    return payload;
  }

  synchronize() {
    const context = this.contextManager.getContext();
    this.contextManager.setContext({ synchronizationStatus: "synchronized" });
    this.eventBus.publish("motherbrain:synchronized", context);
    return context;
  }

  shareMemory(key, value) {
    return this.memoryCoordinator.shareMemory(key, value);
  }

  resolveConflict(conflict) {
    this.eventBus.publish("motherbrain:conflict", conflict);
    return { resolved: true, conflict };
  }

  generateMasterPlan() {
    const registered = this.engineRegistry.getRegisteredEngines();
    return {
      registeredEngines: registered,
      globalGoal: this.contextManager.getContext().globalGoal,
      planningStatus: "ready-for-founder-review",
      thinkingStatus: "ready",
      synchronizationStatus: "synchronized",
      overallHealth: "stable"
    };
  }
}

const motherBrain = new MotherBrain();

export { MotherBrain, motherBrain };
export default motherBrain;
