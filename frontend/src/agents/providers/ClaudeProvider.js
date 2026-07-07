import { AgentResponse } from "../models/AgentResponse";
import { CAPABILITY_TYPES } from "../models/AgentCapability";

class ClaudeProvider {
  constructor(options = {}) {
    this.name = options.name || "Claude";
    this.enabled = options.enabled ?? true;
    this.available = options.available ?? true;
    this.priority = options.priority ?? 2;
    this.supportedCapabilities = options.supportedCapabilities || [
      CAPABILITY_TYPES.RESEARCH,
      CAPABILITY_TYPES.DOCUMENT,
      CAPABILITY_TYPES.ANALYSIS,
      CAPABILITY_TYPES.BUSINESS,
      CAPABILITY_TYPES.REVENUE
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

export { ClaudeProvider };
export default ClaudeProvider;
