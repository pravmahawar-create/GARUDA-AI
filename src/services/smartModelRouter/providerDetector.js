/**
 * GARUDA Smart Model Router - Provider Detector
 *
 * Auto-detects which AI providers are available:
 * - Ollama (local) - always available if running
 * - DeepSeek (free API)
 * - NVIDIA NIM (free tier)
 * - Google Gemini (free tier)
 * - HuggingFace (free inference)
 * - OpenRouter (free models)
 *
 * Never exposes API keys. Auto-discovers.
 */

const http = require("http");

const OLLAMA_BASE = "http://127.0.0.1:11434";

function httpGet(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timer = setTimeout(() => { controller.abort(); resolve(null); }, timeoutMs);
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        clearTimeout(timer);
        if (res.ok) {
          try { resolve(await res.json()); } catch { resolve({ ok: true }); }
        } else { resolve(null); }
      })
      .catch(() => { clearTimeout(timer); resolve(null); });
  });
}

async function detectOllama() {
  const status = await httpGet(`${OLLAMA_BASE}/api/tags`);
  if (!status || !status.models) return { available: false, models: [] };

  const models = status.models.map((m) => ({
    id: m.name,
    size: m.size,
    sizeGB: (m.size / (1024 * 1024 * 1024)).toFixed(1),
    modified: m.modified_at,
    family: m.details?.family || "unknown",
    parameterSize: m.details?.parameter_size || "unknown",
  }));

  const MODEL_PRIORITY = {
    "phi3:mini": { tier: 1, specialty: "reasoning", score: 95 },
    "qwen2.5-coder:3b": { tier: 2, specialty: "code", score: 90 },
    "deepseek-coder:latest": { tier: 2, specialty: "code", score: 88 },
    "qwen2:latest": { tier: 2, specialty: "general", score: 85 },
    "llama3.2:latest": { tier: 2, specialty: "general", score: 82 },
    "codellama:latest": { tier: 3, specialty: "code", score: 80 },
  };

  const ranked = models.map((m) => {
    const priority = MODEL_PRIORITY[m.id] || { tier: 4, specialty: "general", score: 50 };
    return { ...m, ...priority };
  }).sort((a, b) => a.tier - b.tier || b.score - a.score);

  return {
    available: true,
    provider: "ollama",
    models: ranked,
    bestModel: ranked[0]?.id || null,
    totalModels: models.length,
    totalSizeGB: models.reduce((sum, m) => sum + parseFloat(m.sizeGB), 0).toFixed(1),
  };
}

function detectCloudProviders() {
  const providers = [];

  if (process.env.DEEPSEEK_API_KEY || process.env.GARUDA_DEEPSEEK_API_KEY) {
    providers.push({
      name: "deepseek",
      available: true,
      tier: "free_tier",
      models: ["deepseek-chat", "deepseek-coder", "deepseek-v4-flash"],
      specialty: ["code", "reasoning", "general"],
    });
  }

  if (process.env.NVIDIA_API_KEY || process.env.GARUDA_NVIDIA_API_KEY) {
    providers.push({
      name: "nvidia",
      available: true,
      tier: "free_tier",
      models: ["meta/llama-3.1-70b-instruct", "meta/llama-3.1-8b-instruct", "mistralai/mixtral-8x7b-instruct-v0.1"],
      specialty: ["general", "reasoning"],
    });
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GARUDA_GEMINI_API_KEY) {
    providers.push({
      name: "gemini",
      available: true,
      tier: "free_tier",
      models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
      specialty: ["general", "reasoning", "code"],
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "openrouter",
      available: true,
      tier: "free_tier",
      models: ["deepseek/deepseek-chat-v3-0324:free", "meta-llama/llama-4-maverick:free", "qwen/qwen-2.5-72b-instruct:free"],
      specialty: ["general", "code", "reasoning"],
    });
  }

  if (process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY) {
    providers.push({
      name: "huggingface",
      available: true,
      tier: "free_inference",
      models: ["meta-llama/Llama-3.1-8B-Instruct", "Qwen/Qwen2.5-Coder-3B-Instruct"],
      specialty: ["general", "code"],
    });
  }

  return providers;
}

async function detectAll() {
  const ollama = await detectOllama();
  const cloud = detectCloudProviders();

  return {
    ollama,
    cloud,
    totalProviders: (ollama.available ? 1 : 0) + cloud.length,
    hasLocalLLM: ollama.available,
    hasCloudLLM: cloud.length > 0,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { detectAll, detectOllama, detectCloudProviders, OLLAMA_BASE };
