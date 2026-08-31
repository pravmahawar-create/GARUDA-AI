const models = [];

function registerModel(config) {
  const model = {
    id: config.id || `model-${Date.now()}`,
    name: config.name || "Unknown Model",
    provider: config.provider || "unknown",
    capabilities: config.capabilities || [],
    costPer1kTokens: typeof config.costPer1kTokens === "number" ? config.costPer1kTokens : 0.01,
    maxTokens: config.maxTokens || 4096,
    avgLatencyMs: config.avgLatencyMs || 1000,
    quality: typeof config.quality === "number" ? config.quality : 0.7,
    available: config.available !== false,
    tags: Array.isArray(config.tags) ? config.tags : []
  };
  models.push(model);
  return model;
}

function getModel(modelId) {
  return models.find((m) => m.id === modelId) || null;
}

function listModels() {
  return [...models];
}

function getAvailableModels() {
  return models.filter((m) => m.available);
}

function getModelsByCapability(capability) {
  return models.filter((m) => m.available && m.capabilities.includes(capability));
}

function getModelsByProvider(provider) {
  return models.filter((m) => m.provider === provider);
}

function updateModel(modelId, updates) {
  const model = models.find((m) => m.id === modelId);
  if (!model) return null;
  Object.assign(model, updates);
  return model;
}

function removeModel(modelId) {
  const idx = models.findIndex((m) => m.id === modelId);
  if (idx === -1) return false;
  models.splice(idx, 1);
  return true;
}

function clearModels() {
  models.length = 0;
}

function registerDefaults() {
  clearModels();
  registerModel({ id: "gpt-4o", name: "GPT-4o", provider: "openai", capabilities: ["code", "reasoning", "analysis", "creative", "review"], costPer1kTokens: 0.005, maxTokens: 128000, avgLatencyMs: 2000, quality: 0.9, tags: ["frontier", "versatile"] });
  registerModel({ id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", capabilities: ["code", "analysis", "simple"], costPer1kTokens: 0.00015, maxTokens: 128000, avgLatencyMs: 800, quality: 0.7, tags: ["fast", "cheap"] });
  registerModel({ id: "claude-sonnet", name: "Claude Sonnet", provider: "anthropic", capabilities: ["code", "reasoning", "analysis", "review"], costPer1kTokens: 0.003, maxTokens: 200000, avgLatencyMs: 1500, quality: 0.85, tags: ["balanced"] });
  registerModel({ id: "claude-haiku", name: "Claude Haiku", provider: "anthropic", capabilities: ["simple", "analysis", "code"], costPer1kTokens: 0.00025, maxTokens: 200000, avgLatencyMs: 500, quality: 0.65, tags: ["fast", "cheap"] });
  registerModel({ id: "local-garuda", name: "Garuda Local", provider: "local", capabilities: ["code", "simple", "analysis"], costPer1kTokens: 0, maxTokens: 8192, avgLatencyMs: 200, quality: 0.5, tags: ["free", "fast", "local"] });
}

module.exports = {
  registerModel, getModel, listModels, getAvailableModels,
  getModelsByCapability, getModelsByProvider, updateModel,
  removeModel, clearModels, registerDefaults
};
