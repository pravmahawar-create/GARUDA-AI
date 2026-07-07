import { CAPABILITY_TYPES } from "./AgentCapability";

class AgentTask {
  constructor(input = {}) {
    const taskInput = typeof input === "string" ? { description: input } : input;

    this.id = taskInput.id || `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.description = taskInput.description || "Placeholder task";
    this.capability = taskInput.capability || CAPABILITY_TYPES.ANALYSIS;
    this.payload = taskInput.payload || {};
    this.metadata = taskInput.metadata || {};
    this.priority = taskInput.priority || 1;
    this.createdAt = taskInput.createdAt || new Date().toISOString();
    this.status = taskInput.status || "queued";
    this.attempts = taskInput.attempts || 0;
  }
}

export { AgentTask };
export default AgentTask;
