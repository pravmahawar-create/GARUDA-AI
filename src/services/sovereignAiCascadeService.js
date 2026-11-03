/**
 * 🦅 GARUDA Sovereign Multi-Provider AI Cascade Engine
 * 
 * Line-Up & Auto-Failover Architecture:
 * - Groq (Key 1, Key 2...) -> NVIDIA NIM (Key 1, Key 2...) -> Gemini (Key 1, Key 2...) -> Core Deterministic
 * - When any key's credits/quota are exhausted, hits 429, or errors:
 *   Instantly cascades to the next available key/provider with 0ms interruption.
 * - Dynamic Cooldown: Automatically rests exhausted keys and restores them when ready.
 */

try { require("dotenv").config({ override: true }); } catch {}

class SovereignAiCascadeService {
  constructor() {
    this.keyCooldowns = new Map(); // keyId -> { until: timestamp, reason: string }
    this.runtimeKeys = new Map();  // provider -> array of keys
    this._lastVaultSync = 0;
    this._lastVaultSyncSucceeded = false;
    this.stats = {
      totalRequests: 0,
      failoversTriggered: 0,
      providerSuccesses: {}
    };
  }

  /**
   * Automatically fetch active keys from Supabase Cloud Vault if environment variables are missing
   */
  async syncKeysFromVault() {
    const retryAfterMs = this._lastVaultSyncSucceeded ? 180000 : 5000;
    if (this._lastVaultSync && Date.now() - this._lastVaultSync < retryAfterMs) return false;
    this._lastVaultSync = Date.now();
    try {
      const { createClient } = require("@supabase/supabase-js");
      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!SUPABASE_URL || !SUPABASE_KEY) return false;
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      const { data, error } = await supabase.from("leads")
        .select("message")
        .eq("email", "system-ai-keys-sync@garudaos.in")
        .order("id", { ascending: false })
        .limit(1)
        .abortSignal(AbortSignal.timeout(1800));
      if (error) throw error;

      if (data && data[0] && data[0].message) {
        const vault = JSON.parse(data[0].message);
        for (const provider of ["gemini", "groq", "cerebras", "nvidia"]) {
          const singular = vault[`${provider}Key`];
          const plural = vault[`${provider}Keys`];
          const values = [...(Array.isArray(plural) ? plural : (typeof plural === "string" ? plural.split(/[,;\s]+/) : [])), singular]
            .filter((value) => typeof value === "string" && value.trim());
          const list = this.runtimeKeys.get(provider) || [];
          for (const value of values) if (!list.includes(value.trim())) list.push(value.trim());
          if (list.length) this.runtimeKeys.set(provider, list);
        }
      }
      this._lastVaultSyncSucceeded = true;
      return true;
    } catch (e) {}
    this._lastVaultSyncSucceeded = false;
    return false;
  }

  /**
   * Gather all configured keys from env and runtime additions
   */
  getAllKeys() {
    const parseKeys = (single, numberedPrefix, listStr) => {
      const keys = [];
      if (single) keys.push(single.trim());
      for (let i = 1; i <= 5; i++) {
        const val = process.env[`${numberedPrefix}_${i}`];
        if (val && !keys.includes(val.trim())) keys.push(val.trim());
      }
      if (listStr) {
        listStr.split(/[,;\s]+/).filter(Boolean).forEach(k => {
          if (!keys.includes(k.trim())) keys.push(k.trim());
        });
      }
      return keys.filter(Boolean);
    };

    const cerebrasKeys = parseKeys(process.env.CEREBRAS_API_KEY, "CEREBRAS_API_KEY", process.env.CEREBRAS_API_KEYS);
    const groqKeys = parseKeys(process.env.GROQ_API_KEY, "GROQ_API_KEY", process.env.GROQ_API_KEYS);
    const nvidiaKeys = parseKeys(process.env.NVIDIA_API_KEY, "NVIDIA_API_KEY", process.env.NVIDIA_API_KEYS);
    let geminiKeys = parseKeys(process.env.GEMINI_API_KEY, "GEMINI_API_KEY", process.env.GEMINI_API_KEYS);

    // Add fallback keys from env if present
    if (process.env.GEMINI_API_KEY_1 && !geminiKeys.includes(process.env.GEMINI_API_KEY_1.trim())) {
      geminiKeys.push(process.env.GEMINI_API_KEY_1.trim());
    }
    if (process.env.GEMINI_API_KEY_2 && !geminiKeys.includes(process.env.GEMINI_API_KEY_2.trim())) {
      geminiKeys.push(process.env.GEMINI_API_KEY_2.trim());
    }

    // Runtime injected keys
    (this.runtimeKeys.get("cerebras") || []).forEach(k => { if (!cerebrasKeys.includes(k)) cerebrasKeys.push(k); });
    (this.runtimeKeys.get("groq") || []).forEach(k => { if (!groqKeys.includes(k)) groqKeys.push(k); });
    (this.runtimeKeys.get("nvidia") || []).forEach(k => { if (!nvidiaKeys.includes(k)) nvidiaKeys.push(k); });
    (this.runtimeKeys.get("gemini") || []).forEach(k => { if (!geminiKeys.includes(k)) geminiKeys.push(k); });

    // Prioritize genuine Google AI keys (starting with AIzaSy) as Primary
    geminiKeys = geminiKeys.sort((a, b) => {
      const aValid = a.startsWith("AIzaSy");
      const bValid = b.startsWith("AIzaSy");
      if (aValid && !bValid) return -1;
      if (!aValid && bValid) return 1;
      return 0;
    });

    return { cerebrasKeys, groqKeys, nvidiaKeys, geminiKeys };
  }

  isKeyOnCooldown(keyId) {
    const cd = this.keyCooldowns.get(keyId);
    if (!cd) return false;
    if (Date.now() > cd.until) {
      this.keyCooldowns.delete(keyId);
      return false;
    }
    return true;
  }

  setKeyCooldown(keyId, reason, cooldownSeconds = 180) {
    this.keyCooldowns.set(keyId, {
      until: Date.now() + cooldownSeconds * 1000,
      reason,
      setAt: new Date().toISOString()
    });
    console.warn(`[CASCADE] Provider Key [${keyId.slice(0, 10)}...] put on cooldown for ${cooldownSeconds}s: ${reason}`);
  }

  /**
   * 1-Tap Cascade Completion Engine
   */
  async generateCompletion({ messages, prompt, systemPrompt, temperature = 0.3, maxTokens = 800, maxDurationMs = 30000 }) {
    this.stats.totalRequests++;
    const startTime = Date.now();
    const cascadeAttempts = [];

    // Format uniform messages
    let uniformMessages = [];
    if (Array.isArray(messages) && messages.length > 0) {
      uniformMessages = [...messages];
    } else {
      if (systemPrompt) uniformMessages.push({ role: "system", content: systemPrompt });
      if (prompt) uniformMessages.push({ role: "user", content: prompt });
    }

    let { cerebrasKeys, groqKeys, nvidiaKeys, geminiKeys } = this.getAllKeys();
    // The vault is a fallback source for any missing provider, even when another
    // provider is already configured locally.
    if (groqKeys.length === 0 || cerebrasKeys.length === 0 || nvidiaKeys.length === 0 || geminiKeys.length === 0) {
      await this.syncKeysFromVault();
      const updated = this.getAllKeys();
      cerebrasKeys = updated.cerebrasKeys;
      groqKeys = updated.groqKeys;
      nvidiaKeys = updated.nvidiaKeys;
      geminiKeys = updated.geminiKeys;
    }

    const overallDeadline = startTime + maxDurationMs;

    // Each provider gets a bounded slice so a slow primary cannot consume the
    // whole request budget before Groq, Cerebras, and NVIDIA get a failover try.
    const geminiDeadline = Math.min(overallDeadline, Date.now() + 14000);
    // ── TIER 0: GOOGLE GEMINI (PRIMARY SOVEREIGN ENGINE) ──
    for (let kIdx = 0; kIdx < geminiKeys.length; kIdx++) {
      const key = geminiKeys[kIdx];
      const keyId = `gemini_${kIdx}_${key.slice(-6)}`;
      if (this.isKeyOnCooldown(keyId)) continue;

      const geminiModels = [...new Set([process.env.GARUDA_GEMINI_MODEL || "gemini-2.5-flash"])];
      const promptText = uniformMessages.map(m => `${m.role}: ${m.content}`).join("\n\n");
      const geminiMaxTokens = Math.min(Math.max(Number(maxTokens) || 800, 64), 8192);

      for (const model of geminiModels) {
        if (Date.now() >= geminiDeadline) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), Math.min(12000, geminiDeadline - Date.now()));

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: { temperature, maxOutputTokens: geminiMaxTokens }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const candidate = data.candidates?.[0];
            const finishReason = candidate?.finishReason;

            // Strict Anti-Truncation Law: If token limit was exceeded, do not treat as success!
            if (finishReason === "MAX_TOKENS") {
              cascadeAttempts.push({ tier: "gemini", keyId, model, error: "OUTPUT_TRUNCATED_MAX_TOKENS" });
              this.stats.failoversTriggered++;
              continue; // Cascade to next model/key
            }

            const parts = candidate?.content?.parts || [];
            const text = parts.map(p => p.text || "").join("").trim();
            if (text && text.trim()) {
              const providerName = `gemini:${model}[k${kIdx + 1}]`;
              const usage = data.usageMetadata;
              const tokens = usage ? {
                promptTokens: typeof usage.promptTokenCount === "number" ? usage.promptTokenCount : "UNKNOWN",
                completionTokens: typeof usage.candidatesTokenCount === "number" ? usage.candidatesTokenCount : "UNKNOWN",
                totalTokens: typeof usage.totalTokenCount === "number" ? usage.totalTokenCount : "UNKNOWN"
              } : "UNKNOWN";

              this.stats.providerSuccesses[providerName] = (this.stats.providerSuccesses[providerName] || 0) + 1;
              return {
                success: true,
                text: text.trim(),
                provider: "google-gemini",
                providerKeyId: providerName,
                model,
                tokens,
                latencyMs: Date.now() - startTime,
                cascadeAttempts
              };
            }
          }

          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          cascadeAttempts.push({ tier: "gemini", keyId, model, error: errMsg });
          this.stats.failoversTriggered++;

          if (res.status === 429 || res.status === 401 || errMsg.includes("quota") || errMsg.includes("rate limit")) {
            this.setKeyCooldown(keyId, errMsg, 180);
            break;
          }
        } catch (err) {
          cascadeAttempts.push({ tier: "gemini", keyId, model, error: err.message });
          this.stats.failoversTriggered++;
        }
      }
    }

    const groqDeadline = Math.min(overallDeadline, Date.now() + 7000);
    // ── TIER 1: GROQ HIGH-SPEED CLOUD ──
    for (let kIdx = 0; kIdx < groqKeys.length; kIdx++) {
      const key = groqKeys[kIdx];
      const keyId = `groq_${kIdx}_${key.slice(-6)}`;
      if (this.isKeyOnCooldown(keyId)) continue;

      const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
      const groqMaxTokens = Math.min(maxTokens || 4096, 4096);
      for (const model of groqModels) {
        if (Date.now() >= groqDeadline) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), Math.min(6000, groqDeadline - Date.now()));

          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: uniformMessages,
              temperature,
              max_tokens: groqMaxTokens
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const choice = data.choices?.[0];
            const finishReason = choice?.finish_reason;

            // Strict Anti-Truncation Law
            if (finishReason === "length") {
              cascadeAttempts.push({ tier: "groq", keyId, model, error: "OUTPUT_TRUNCATED_MAX_TOKENS" });
              this.stats.failoversTriggered++;
              continue;
            }

            const text = choice?.message?.content;
            if (text && text.trim()) {
              const providerName = `groq:${model}[k${kIdx + 1}]`;
              const usage = data.usage;
              const tokens = usage ? {
                promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : "UNKNOWN",
                completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : "UNKNOWN",
                totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : "UNKNOWN"
              } : "UNKNOWN";

              this.stats.providerSuccesses[providerName] = (this.stats.providerSuccesses[providerName] || 0) + 1;
              return {
                success: true,
                text: text.trim(),
                provider: "groq",
                providerKeyId: providerName,
                model,
                tokens,
                latencyMs: Date.now() - startTime,
                cascadeAttempts
              };
            }
          }

          // Error handling & failover trigger
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          cascadeAttempts.push({ tier: "groq", keyId, model, error: errMsg });
          this.stats.failoversTriggered++;

          // If rate limit or quota exceeded, cool down this key
          if (res.status === 429 || res.status === 401 || errMsg.includes("rate limit") || errMsg.includes("quota")) {
            this.setKeyCooldown(keyId, errMsg, 180);
            break; // Skip to next key
          }
        } catch (err) {
          cascadeAttempts.push({ tier: "groq", keyId, model, error: err.message });
          this.stats.failoversTriggered++;
        }
      }
    }

    const cerebrasDeadline = Math.min(overallDeadline, Date.now() + 6000);
    // ── TIER 2: CEREBRAS ULTRA-SPEED ENGINE ──
    for (let kIdx = 0; kIdx < (cerebrasKeys || []).length; kIdx++) {
      const key = cerebrasKeys[kIdx];
      const keyId = `cerebras_${kIdx}_${key.slice(-6)}`;
      if (this.isKeyOnCooldown(keyId)) continue;

      const cerebrasModels = ["qwen-3.8-27b", "gpt-oss-120b"];
      for (const model of cerebrasModels) {
        if (Date.now() >= cerebrasDeadline) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), Math.min(5000, cerebrasDeadline - Date.now()));

          const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: uniformMessages,
              temperature,
              max_tokens: maxTokens
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const choice = data.choices?.[0];
            const finishReason = choice?.finish_reason;

            // Strict Anti-Truncation Law
            if (finishReason === "length") {
              cascadeAttempts.push({ tier: "cerebras", keyId, model, error: "OUTPUT_TRUNCATED_MAX_TOKENS" });
              this.stats.failoversTriggered++;
              continue;
            }

            const text = choice?.message?.content;
            if (text && text.trim()) {
              const providerName = `cerebras:${model}[k${kIdx + 1}]`;
              const usage = data.usage;
              const tokens = usage ? {
                promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : "UNKNOWN",
                completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : "UNKNOWN",
                totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : "UNKNOWN"
              } : "UNKNOWN";

              this.stats.providerSuccesses[providerName] = (this.stats.providerSuccesses[providerName] || 0) + 1;
              return {
                success: true,
                text: text.trim(),
                provider: "cerebras",
                providerKeyId: providerName,
                model,
                tokens,
                latencyMs: Date.now() - startTime,
                cascadeAttempts
              };
            }
          }

          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          cascadeAttempts.push({ tier: "cerebras", keyId, model, error: errMsg });
          this.stats.failoversTriggered++;

          if (res.status === 429 || res.status === 401 || errMsg.includes("quota") || errMsg.includes("rate limit")) {
            this.setKeyCooldown(keyId, errMsg, 180);
            break;
          }
        } catch (err) {
          cascadeAttempts.push({ tier: "cerebras", keyId, model, error: err.message });
          this.stats.failoversTriggered++;
        }
      }
    }

    const nvidiaDeadline = Math.min(overallDeadline, Date.now() + 5000);
    // ── TIER 3: NVIDIA NIM DEEP-REASONING FALLBACK ──
    for (let kIdx = 0; kIdx < nvidiaKeys.length; kIdx++) {
      const key = nvidiaKeys[kIdx];
      const keyId = `nvidia_${kIdx}_${key.slice(-6)}`;
      if (this.isKeyOnCooldown(keyId)) continue;

      const nvidiaModels = ["deepseek-ai/deepseek-v4-flash", "meta/llama-3.3-70b-instruct", "mistralai/mistral-large-3-675b-instruct-2512"];

      for (const model of nvidiaModels) {
        if (Date.now() >= nvidiaDeadline) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), Math.min(4000, nvidiaDeadline - Date.now()));

          const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: uniformMessages,
              temperature,
              max_tokens: maxTokens
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const choice = data.choices?.[0];
            const finishReason = choice?.finish_reason;

            // Strict Anti-Truncation Law
            if (finishReason === "length") {
              cascadeAttempts.push({ tier: "nvidia", keyId, model, error: "OUTPUT_TRUNCATED_MAX_TOKENS" });
              this.stats.failoversTriggered++;
              continue;
            }

            const text = choice?.message?.content;
            if (text && text.trim()) {
              const providerName = `nvidia:${model}[k${kIdx + 1}]`;
              const usage = data.usage;
              const tokens = usage ? {
                promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : "UNKNOWN",
                completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : "UNKNOWN",
                totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : "UNKNOWN"
              } : "UNKNOWN";

              this.stats.providerSuccesses[providerName] = (this.stats.providerSuccesses[providerName] || 0) + 1;
              return {
                success: true,
                text: text.trim(),
                provider: "nvidia",
                providerKeyId: providerName,
                model,
                tokens,
                latencyMs: Date.now() - startTime,
                cascadeAttempts
              };
            }
          }

          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.detail || errData.title || `HTTP ${res.status}`;
          cascadeAttempts.push({ tier: "nvidia", keyId, model, error: errMsg });
          this.stats.failoversTriggered++;

          if (res.status === 403 || res.status === 429 || res.status === 401) {
            this.setKeyCooldown(keyId, errMsg, 300);
            break;
          }
        } catch (err) {
          cascadeAttempts.push({ tier: "nvidia", keyId, model, error: err.message });
          this.stats.failoversTriggered++;
        }
      }
    }

    // ── TIER 4: DETERMINISTIC SOVEREIGN FALLBACK CORE ──
    const fallbackText = "Praveen ji, sabhi cloud APIs failover mode me hain. Antigravity Sovereign Core active hai aur saari leads Supabase me 100% safe hain.";
    return {
      success: false, // Invariant: deterministic fallback is never reported as successful AI task execution
      isFallback: true,
      text: fallbackText,
      provider: "deterministic_core_resilience",
      latencyMs: Date.now() - startTime,
      cascadeAttempts
    };
  }

  /**
   * Inject a new key dynamically at runtime
   */
  registerKey({ provider, key }) {
    if (!provider || !key) return { success: false, error: "provider and key are required" };
    const p = provider.toLowerCase();
    const current = this.runtimeKeys.get(p) || [];
    if (!current.includes(key.trim())) {
      current.push(key.trim());
      this.runtimeKeys.set(p, current);
    }
    // The current Supabase leads.message vault format is plain JSON. Keep new
    // keys in memory rather than silently persisting credentials unencrypted.
    return { success: true, provider: p, totalKeys: current.length };
  }

  /**
   * Health report of all configured and runtime keys
   */
  getHealthReport() {
    const { groqKeys, cerebrasKeys, nvidiaKeys, geminiKeys } = this.getAllKeys();

    const checkStatus = (keys, prefix) => keys.map((k, i) => {
      const keyId = `${prefix}_${i}_${k.slice(-6)}`;
      const cd = this.keyCooldowns.get(keyId);
      const isCool = cd && Date.now() < cd.until;
      return {
        id: keyId,
        provider: prefix,
        index: i + 1,
        masked: `${k.slice(0, 6)}...${k.slice(-4)}`,
        status: isCool ? "COOLDOWN" : "CONFIGURED",
        reachability: "NOT_PROBED",
        reason: isCool ? cd.reason : "Configured; provider reachability has not been tested",
        cooldownRemainingSeconds: isCool ? Math.round((cd.until - Date.now()) / 1000) : 0
      };
    });

    return {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      lineup: {
        groq: checkStatus(groqKeys, "groq"),
        cerebras: checkStatus(cerebrasKeys, "cerebras"),
        nvidia: checkStatus(nvidiaKeys, "nvidia"),
        gemini: checkStatus(geminiKeys, "gemini")
      }
    };
  }
}

module.exports = new SovereignAiCascadeService();
