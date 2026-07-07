import { AgentResponse } from "../models/AgentResponse";
import { CAPABILITY_TYPES } from "../models/AgentCapability";

class LocalProvider {
  constructor(options = {}) {
    this.name = options.name || "Local";
    this.enabled = options.enabled ?? true;
    this.available = options.available ?? true;
    this.priority = options.priority ?? 999;
    this.supportedCapabilities = options.supportedCapabilities || [
      CAPABILITY_TYPES.CODE,
      CAPABILITY_TYPES.AUTOMATION,
      CAPABILITY_TYPES.ANALYSIS,
      CAPABILITY_TYPES.DOCUMENT
    ];
  }

  getStatus() {
    return {
      name: this.name,
      enabled: this.enabled,
      available: this.available,
      priority: this.priority,
      supportedCapabilities: this.supportedCapabilities
    };
  }

  canHandle(capability) {
    return this.supportedCapabilities.includes(capability);
  }

  async execute(task) {
    return new AgentResponse({
      taskId: task.id,
      providerName: this.name,
      capability: task.capability,
      status: "placeholder",
      message: `${this.name} placeholder adapter accepted ${task.description}`,
      data: { provider: this.name, mode: "placeholder" },
      metadata: { routedBy: "AgentManager" }
    });
  }
}

export { LocalProvider };
export default LocalProvider;
