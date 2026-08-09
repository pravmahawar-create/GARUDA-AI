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

function detectPreferredProvider() {
  const explicit = (process.env.GARUDA_LLM_PROVIDER || "")
    .trim()
    .toLowerCase();

  if (explicit && explicit !== "fallback") {
    return explicit;
  }

  if (process.env.NVIDIA_API_KEY || process.env.GARUDA_NVIDIA_API_KEY) {
    return "nvidia";
  }

  if (process.env.GARUDA_LLM_API_KEY || process.env.GEMINI_API_KEY) {
    return "gemini";
  }

  if (process.env.GARUDA_LLM_API_KEY || process.env.OPENAI_API_KEY) {
    return "openai";
  }

  return "ollama";
}

function defaultModelForProvider(provider) {
  if (provider === "nvidia") {
    return process.env.GARUDA_NVIDIA_MODEL || process.env.NVIDIA_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1";
  }
  if (provider === "gemini") {
    return process.env.GARUDA_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }
  if (provider === "openai") {
    return process.env.GARUDA_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  }
  return process.env.GARUDA_LLM_MODEL || "qwen2.5-coder:3b";
}

const CAPABILITY_MAPPINGS = {
  GENERAL_REASONING: {
    provider: detectPreferredProvider(),
    model: null
  },
  CONVERSATION: {
    provider: detectPreferredProvider(),
    model: null
  },
  CODE_REASONING: {
    provider: detectPreferredProvider(),
    model: null
  },
  STRUCTURED_SYNTHESIS: {
    provider: detectPreferredProvider(),
    model: null
  }
};

function resolveCognitiveResource(capability = "CONVERSATION") {
  const capKey = String(capability || "CONVERSATION").toUpperCase().trim();
  const mapping = CAPABILITY_MAPPINGS[capKey] || CAPABILITY_MAPPINGS.CONVERSATION;

  const activeProvider = (process.env.GARUDA_LLM_PROVIDER || mapping.provider || "ollama")
    .trim()
    .toLowerCase();

  const activeModel = (activeProvider === "ollama"
    ? process.env.GARUDA_LLM_MODEL
    : null) || defaultModelForProvider(activeProvider)
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
