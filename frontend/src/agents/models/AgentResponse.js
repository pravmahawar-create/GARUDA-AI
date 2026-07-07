class AgentResponse {
  constructor(input = {}) {
    this.taskId = input.taskId || "";
    this.providerName = input.providerName || "Local";
    this.capability = input.capability || "ANALYSIS";
    this.success = input.success ?? true;
    this.status = input.status || "queued";
    this.message = input.message || "Agent task routed successfully.";
    this.data = input.data || {};
    this.metadata = input.metadata || {};
    this.timestamp = input.timestamp || new Date().toISOString();
  }
}

export { AgentResponse };
export default AgentResponse;
