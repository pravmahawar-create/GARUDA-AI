/**
 * GARUDA Smart Model Router - Core Router
 *
 * The brain that selects the BEST FREE AI provider for each task.
 * Decision hierarchy:
 * 1. Local Ollama (Phi-3 for reasoning, Qwen/DeepSeek for code)
 * 2. Free cloud APIs (DeepSeek, NVIDIA, Gemini, OpenRouter)
 * 3. HuggingFace free inference
 * 4. GARUDA's own smart engine (rules, cache, cases)
 *
 * NEVER asks user for API keys. Auto-discovers and uses what's available.
 * Logs every routing decision for transparency.
 */

const { detectAll } = require("./providerDetector");
const { classifyTask } = require("./taskClassifier");

const routingLog = [];
const MAX_LOG_SIZE = 1000;

let cachedProviders = null;
let lastDetection = 0;
const DETECTION_CACHE_MS = 30000;

async function getProviders() {
  const now = Date.now();
  if (cachedProviders && (now - lastDetection) < DETECTION_CACHE_MS) {
    return cachedProviders;
  }
  cachedProviders = await detectAll();
  lastDetection = now;
  return cachedProviders;
}

function selectLocalModel(classification, providers) {
  if (!providers.ollama?.available) return null;

  const models = providers.ollama.models;
  if (!models.length) return null;

  if (classification.category === "code" || classification.needsCodeModel) {
    const codeModel = models.find((m) => m.specialty === "code");
    if (codeModel) return { provider: "ollama", model: codeModel.id, reason: "Code task → local code model" };
  }

  if (classification.category === "reasoning" || classification.needsReasoningModel) {
    const reasonModel = models.find((m) => m.specialty === "reasoning");
    if (reasonModel) return { provider: "ollama", model: reasonModel.id, reason: "Reasoning task → local reasoning model" };
  }

  return { provider: "ollama", model: providers.ollama.bestModel, reason: "Default → best available local model" };
}

function selectCloudModel(classification, providers) {
  if (!providers.cloud.length) return null;

  const prefersCode = classification.category === "code" || classification.needsCodeModel;
  const prefersReasoning = classification.category === "reasoning" || classification.needsReasoningModel;

  for (const provider of providers.cloud) {
    if (prefersCode && provider.specialty.includes("code")) {
      const model = provider.models.find((m) => m.includes("code") || m.includes("coder")) || provider.models[0];
      return { provider: provider.name, model, reason: `Cloud code model → ${provider.name}` };
    }
    if (prefersReasoning && provider.specialty.includes("reasoning")) {
      const model = provider.models[0];
      return { provider: provider.name, model, reason: `Cloud reasoning model → ${provider.name}` };
    }
  }

  const generalProvider = providers.cloud.find((p) => p.specialty.includes("general"));
  if (generalProvider) {
    return { provider: generalProvider.name, model: generalProvider.models[0], reason: `General cloud model → ${generalProvider.name}` };
  }

  return null;
}

function selectBestProvider(classification, providers) {
  const local = selectLocalModel(classification, providers);
  if (local) return { ...local, tier: "local" };

  const cloud = selectCloudModel(classification, providers);
  if (cloud) return { ...cloud, tier: "cloud" };

  return {
    provider: "smart_engine",
    model: "rules+cache+cases",
    reason: "No LLM available → GARUDA smart engine fallback",
    tier: "internal",
  };
}

async function route(input) {
  const startTime = Date.now();
  const text = typeof input === "string" ? input : input?.text || input?.problem || JSON.stringify(input);

  const classification = classifyTask(text);
  const providers = await getProviders();

  const decision = selectBestProvider(classification, providers);

  const result = {
    input: text.substring(0, 200),
    classification: classification.category,
    confidence: classification.confidence,
    complexity: classification.complexity,
    selected: {
      provider: decision.provider,
      model: decision.model,
      tier: decision.tier,
      reason: decision.reason,
    },
    availableProviders: {
      local: providers.hasLocalLLM,
      cloud: providers.cloud.map((p) => p.name),
    },
    timeMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };

  routingLog.unshift(result);
  if (routingLog.length > MAX_LOG_SIZE) routingLog.pop();

  return result;
}

async function routeAndExecute(input, executeFn) {
  const routing = await route(input);

  if (routing.selected.provider === "smart_engine") {
    return {
      routing,
      result: null,
      executed: false,
      message: "Using GARUDA internal intelligence (no external LLM needed)",
    };
  }

  if (routing.selected.provider === "ollama") {
    try {
      const response = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: routing.selected.model,
          prompt: typeof input === "string" ? input : input?.text || input?.problem || "",
          stream: false,
        }),
      });
      const data = await response.json();
      return {
        routing,
        result: data.response,
        executed: true,
        provider: "ollama",
        model: routing.selected.model,
      };
    } catch (err) {
      return {
        routing,
        result: null,
        executed: false,
        error: `Ollama error: ${err.message}`,
        fallback: "smart_engine",
      };
    }
  }

  if (executeFn) {
    try {
      const result = await executeFn(routing);
      return { routing, result, executed: true };
    } catch (err) {
      return { routing, result: null, executed: false, error: err.message };
    }
  }

  return {
    routing,
    result: null,
    executed: false,
    message: `Provider ${routing.selected.provider} selected but no executor provided`,
  };
}

function getRoutingLog() {
  return routingLog.slice(0, 50);
}

function getRoutingStats() {
  const stats = { total: routingLog.length, byProvider: {}, byCategory: {}, avgTimeMs: 0 };
  let totalTime = 0;
  for (const entry of routingLog) {
    stats.byProvider[entry.selected.provider] = (stats.byProvider[entry.selected.provider] || 0) + 1;
    stats.byCategory[entry.classification] = (stats.byCategory[entry.classification] || 0) + 1;
    totalTime += entry.timeMs;
  }
  stats.avgTimeMs = routingLog.length > 0 ? Math.round(totalTime / routingLog.length) : 0;
  return stats;
}

module.exports = { route, routeAndExecute, getProviders, getRoutingLog, getRoutingStats, classifyTask };
