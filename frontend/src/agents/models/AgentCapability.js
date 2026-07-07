const CAPABILITY_TYPES = Object.freeze({
  CODE: "CODE",
  UI: "UI",
  RESEARCH: "RESEARCH",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  VOICE: "VOICE",
  DOCUMENT: "DOCUMENT",
  AUTOMATION: "AUTOMATION",
  ANALYSIS: "ANALYSIS",
  BUSINESS: "BUSINESS",
  REVENUE: "REVENUE"
});

class AgentCapability {
  constructor(type, description = "", priority = 1) {
    this.type = type;
    this.description = description;
    this.priority = priority;
  }
}

export { CAPABILITY_TYPES, AgentCapability };
export default AgentCapability;
