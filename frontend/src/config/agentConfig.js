export const CAPABILITY_ROUTING = Object.freeze({
  CODE: ["Copilot", "OpenAI", "Local"],
  UI: ["Copilot", "OpenAI", "Gemini"],
  RESEARCH: ["Claude", "Gemini", "OpenAI"],
  IMAGE: ["OpenAI", "Gemini", "Local"],
  VIDEO: ["OpenAI", "Gemini", "Local"],
  VOICE: ["OpenAI", "Local"],
  DOCUMENT: ["Claude", "Copilot", "Local"],
  AUTOMATION: ["Copilot", "OpenAI", "Local"],
  ANALYSIS: ["Claude", "OpenAI", "Gemini"],
  BUSINESS: ["Claude", "Gemini", "OpenAI"],
  REVENUE: ["Claude", "OpenAI", "Gemini"]
});

export const AGENT_PRIORITIES = Object.freeze({
  PRIMARY_PROVIDER: "PRIMARY_PROVIDER",
  SECONDARY_PROVIDER: "SECONDARY_PROVIDER",
  FALLBACK_PROVIDER: "FALLBACK_PROVIDER"
});

export const DEFAULT_AGENT_CONFIG = Object.freeze({
  primaryProvider: "Copilot",
  secondaryProvider: "OpenAI",
  fallbackProvider: "Local",
  debugPanelEnabled: false
});
