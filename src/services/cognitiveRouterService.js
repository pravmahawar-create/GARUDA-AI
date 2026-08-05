/**
 * GARUDA Sovereign Cognitive Router Service
 *
 * Responsibilities:
 * - Provider-neutral selection layer for cognitive capabilities.
 * - Higher GARUDA layers request CAPABILITIES (not brand names).
 * - Configuration maps capabilities to concrete model providers.
 *
 * Capability Classes:
 * - GENERAL_REASONING
 * - CONVERSATION
 * - CODE_REASONING
 * - STRUCTURED_SYNTHESIS
 */

const CAPABILITY_MAPPINGS = {
  GENERAL_REASONING: {
    provider: process.env.GARUDA_LLM_PROVIDER || "ollama",
    model: process.env.GARUDA_LLM_MODEL || "qwen2.5-coder:3b"
  },
  CONVERSATION: {
    provider: process.env.GARUDA_LLM_PROVIDER || "ollama",
    model: process.env.GARUDA_LLM_MODEL || "qwen2.5-coder:3b"
  },
  CODE_REASONING: {
    provider: process.env.GARUDA_LLM_PROVIDER || "ollama",
    model: process.env.GARUDA_LLM_MODEL || "qwen2.5-coder:3b"
  },
  STRUCTURED_SYNTHESIS: {
    provider: process.env.GARUDA_LLM_PROVIDER || "ollama",
    model: process.env.GARUDA_LLM_MODEL || "qwen2.5-coder:3b"
  }
};

function resolveCognitiveResource(capability = "CONVERSATION") {
  const capKey = String(capability || "CONVERSATION").toUpperCase().trim();
  const mapping = CAPABILITY_MAPPINGS[capKey] || CAPABILITY_MAPPINGS.CONVERSATION;

  const activeProvider = (process.env.GARUDA_LLM_PROVIDER || mapping.provider || "ollama")
    .trim()
    .toLowerCase();

  const activeModel = (process.env.GARUDA_LLM_MODEL || mapping.model || "qwen2.5-coder:3b")
    .trim();

  return {
    capability: capKey,
    provider: activeProvider,
    model: activeModel
  };
}

async function checkCognitiveHealth() {
  const resource = resolveCognitiveResource("CONVERSATION");
  const baseUrl = process.env.GARUDA_OLLAMA_URL || "http://127.0.0.1:11434";

  if (resource.provider === "ollama") {
    try {
      const nodeKey = process.env.GARUDA_NODE_KEY || null;
      const headers = {};
      if (nodeKey) {
        headers["X-GARUDA-NODE-KEY"] = nodeKey;
      }
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, { headers });
      if (res.ok) {
        const data = await res.json();
        const models = Array.isArray(data.models) ? data.models.map((m) => m.name || m.model) : [];
        const hasModel = models.some((m) => m.includes(resource.model));
        return {
          status: hasModel ? "ONLINE" : "DEGRADED",
          provider: "ollama",
          configuredModel: resource.model,
          endpoint: baseUrl,
          availableModels: models
        };
      }
    } catch {
      return {
        status: "OFFLINE",
        provider: "ollama",
        configuredModel: resource.model,
        endpoint: baseUrl,
        error: "ollama_unreachable"
      };
    }
  }

  return {
    status: resource.provider === "fallback" ? "DEGRADED" : "ONLINE",
    provider: resource.provider,
    configuredModel: resource.model
  };
}

module.exports = {
  resolveCognitiveResource,
  checkCognitiveHealth
};
