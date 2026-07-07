import { AgentTask } from "./models/AgentTask";
import { AgentResponse } from "./models/AgentResponse";
import { CAPABILITY_TYPES } from "./models/AgentCapability";
import { CAPABILITY_ROUTING, DEFAULT_AGENT_CONFIG } from "../config/agentConfig";
import OpenAIProvider from "./providers/OpenAIProvider";
import ClaudeProvider from "./providers/ClaudeProvider";
import GeminiProvider from "./providers/GeminiProvider";
import CopilotProvider from "./providers/CopilotProvider";
import LocalProvider from "./providers/LocalProvider";

class AgentManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.providers = [];
    this.activeProvider = null;
    this.lastResponse = null;
    this.health = {
      status: "standby",
      message: "Agent manager ready."
    };
    this.registerDefaultProviders();
  }

  registerDefaultProviders() {
    this.registerProvider(new CopilotProvider({ priority: 0 }));
    this.registerProvider(new OpenAIProvider({ priority: 1 }));
    this.registerProvider(new ClaudeProvider({ priority: 2 }));
    this.registerProvider(new GeminiProvider({ priority: 3 }));
    this.registerProvider(new LocalProvider({ priority: 999 }));
  }

  registerProvider(provider) {
    if (!provider || typeof provider.getStatus !== "function") return null;
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);
    return provider;
  }

  getProviders() {
    return this.providers.map((provider) => provider.getStatus());
  }

  checkProviderAvailability(providerName) {
    const provider = this.providers.find((entry) => entry.name === providerName);
    return provider ? provider.available && provider.enabled : false;
  }

  checkProviderStatus(providerName) {
    const provider = this.providers.find((entry) => entry.name === providerName);
    return provider ? provider.getStatus() : null;
  }

  getCapabilityRouting(capability) {
    return CAPABILITY_ROUTING[capability] || CAPABILITY_ROUTING[CAPABILITY_TYPES.ANALYSIS];
  }

  routeTask(task) {
    const taskModel = task instanceof AgentTask ? task : new AgentTask(task);
    const capability = taskModel.capability;
    const preferredOrder = this.getCapabilityRouting(capability);

    const candidates = preferredOrder
      .map((name) => this.providers.find((provider) => provider.name === name))
      .filter(Boolean)
      .filter((provider) => provider.enabled && provider.available && provider.canHandle(capability));

    return candidates[0] || this.providers.find((provider) => provider.canHandle(capability)) || null;
  }

  async createTask(task) {
    const taskModel = task instanceof AgentTask ? task : new AgentTask(task);
    const provider = this.routeTask(taskModel);

    if (!provider) {
      const fallbackResponse = new AgentResponse({
        taskId: taskModel.id,
        providerName: this.config.fallbackProvider,
        capability: taskModel.capability,
        success: false,
        status: "unavailable",
        message: "No compatible provider available."
      });
      this.lastResponse = fallbackResponse;
      this.health = { status: "degraded", message: "No provider available for task." };
      return fallbackResponse;
    }

    this.activeProvider = provider.name;
    this.health = { status: "routing", message: `Routing to ${provider.name}` };
    const response = await provider.execute(taskModel);
    this.lastResponse = response;
    this.health = { status: "ready", message: `Completed with ${provider.name}` };
    return response;
  }

  cancelTask(taskId) {
    return { taskId, cancelled: true, message: `Task ${taskId} cancelled.` };
  }

  retryTask(task) {
    return this.createTask(task);
  }

  switchProvider(providerName) {
    const provider = this.providers.find((entry) => entry.name === providerName);
    if (!provider) return null;
    this.activeProvider = provider.name;
    this.health = { status: "ready", message: `Switched to ${provider.name}` };
    return provider.getStatus();
  }

  getAgentHealth() {
    return {
      activeProvider: this.activeProvider || this.config.primaryProvider,
      availableProviders: this.getProviders(),
      fallbackStatus: this.activeProvider ? "ready" : "pending",
      agentHealth: this.health
    };
  }
}

const agentManager = new AgentManager();

export { AgentManager, agentManager };
export default agentManager;
