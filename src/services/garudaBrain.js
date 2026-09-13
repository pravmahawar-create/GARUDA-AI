/**
 * GARUDA Brain — The Intelligent Core
 *
 * Uses LLM (Gemini/Nvidia/Groq) via raw fetch for:
 * - Understanding context, not just keywords
 * - Making smart decisions
 * - Reasoning about problems
 * - Generating creative content
 * - Code understanding
 *
 * No external SDKs — same pattern as llmAdapter.js.
 */

const fetchWithTimeout = (url, opts = {}, timeoutMs = 60000) =>
  Promise.race([
    fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs))
  ]);

// ──────────────────────────────────────────────────────────────────────────────
// 1. GEMINI — Primary brain (raw fetch)
// ──────────────────────────────────────────────────────────────────────────────

async function callGemini(prompt, { systemPrompt, temperature = 0.7, maxTokens = 2048 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API key found");

  const model = process.env.GARUDA_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens }
  };

  if (systemPrompt) {
    requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${err?.error?.message || "unknown"}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. NVIDIA — Fallback brain
// ──────────────────────────────────────────────────────────────────────────────

async function callNvidia(prompt, { systemPrompt, temperature = 0.7, maxTokens = 2048 } = {}) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("No Nvidia API key found");

  const res = await fetchWithTimeout("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL || "nvidia/llama-3.1-nemotron-70b-instruct",
      messages: [
        { role: "system", content: systemPrompt || "You are GARUDA, an intelligent AI assistant." },
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. GROQ — Fast fallback
// ──────────────────────────────────────────────────────────────────────────────

async function callGroq(prompt, { systemPrompt, temperature = 0.7, maxTokens = 2048 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("No Groq API key found");

  const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt || "You are GARUDA, an intelligent AI assistant." },
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. THINK — Main brain function with fallback chain
// ──────────────────────────────────────────────────────────────────────────────

async function think(prompt, options = {}) {
  const provider = options.provider || getProvider();
  const startTime = Date.now();

  const providers = { gemini: callGemini, nvidia: callNvidia, groq: callGroq };
  const order = provider ? [provider, ...Object.keys(providers).filter(p => p !== provider)] : Object.keys(providers);

  for (const p of order) {
    if (!providers[p]) continue;
    try {
      const result = await providers[p](prompt, options);
      const latency = Date.now() - startTime;
      if (result) {
        console.log(`[Brain] ${p} responded in ${latency}ms`);
        return { content: result, provider: p, latencyMs: latency };
      }
    } catch (err) {
      console.log(`[Brain] ${p} failed: ${err.message}`);
      continue;
    }
  }

  throw new Error("All LLM providers failed");
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. UNDERSTAND — Parse user intent
// ──────────────────────────────────────────────────────────────────────────────

async function understand(userMessage, conversationHistory = []) {
  const systemPrompt = `You are GARUDA's brain. Parse the user's message and return a JSON object with:
{
  "intent": "what the user wants (one word: deploy, debug, build, query, complaint, request, info, chat)",
  "topic": "main topic being discussed",
  "sentiment": "positive/negative/neutral",
  "urgency": "low/medium/high/critical",
  "actionRequired": true/false,
  "summary": "one line summary of the message",
  "contextNeeded": ["list of things to remember"]
}
Return ONLY valid JSON, no markdown.`;

  const historyText = conversationHistory.slice(-5).map(h => `${h.role}: ${h.content}`).join("\n");
  const fullPrompt = historyText ? `Conversation so far:\n${historyText}\n\nUser: ${userMessage}` : userMessage;

  try {
    const result = await think(fullPrompt, { systemPrompt, temperature: 0.3 });
    return JSON.parse(result.content);
  } catch {
    return {
      intent: "chat", topic: "general", sentiment: "neutral",
      urgency: "low", actionRequired: false,
      summary: userMessage.slice(0, 100), contextNeeded: []
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. DECIDE — Make a decision
// ──────────────────────────────────────────────────────────────────────────────

async function decide({ situation, options, constraints, context }) {
  const systemPrompt = `You are GARUDA's decision engine. Analyze and choose the best option.
Return JSON:
{
  "decision": "chosen option",
  "reasoning": "why this option",
  "confidence": 0-100,
  "risks": ["potential risks"],
  "nextSteps": ["immediate next steps"]
}
Be decisive. Think about revenue impact, client satisfaction, technical feasibility.`;

  const prompt = `Situation: ${situation}\nOptions: ${JSON.stringify(options)}\nConstraints: ${constraints || "None"}\nContext: ${context || "None"}`;

  const result = await think(prompt, { systemPrompt, temperature: 0.3 });
  return JSON.parse(result.content);
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. GENERATE — Create content
// ──────────────────────────────────────────────────────────────────────────────

async function generate({ type, topic, audience, tone, length }) {
  const systemPrompt = `You are GARUDA's creative engine. Generate high-quality ${type || "email"}.
Audience: ${audience || "business owner"}, Tone: ${tone || "professional"}, Length: ${length || "medium"}.
Be creative, engaging, and persuasive. Use data and proof points.`;

  const result = await think(`Generate a ${type} about ${topic}`, { systemPrompt, temperature: 0.8 });
  return result.content;
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. EXPLAIN — Explain code or concepts
// ──────────────────────────────────────────────────────────────────────────────

async function explain(codeOrConcept, { level = "intermediate", language } = {}) {
  const systemPrompt = `You are GARUDA's code expert. Explain clearly at ${level} level.\n${language ? `Language: ${language}` : ""}\nBe concise but thorough.`;
  const result = await think(codeOrConcept, { systemPrompt, temperature: 0.3 });
  return result.content;
}

// ──────────────────────────────────────────────────────────────────────────────
// 9. DEBUG — Find and fix issues
// ──────────────────────────────────────────────────────────────────────────────

async function debug(code, error) {
  const systemPrompt = `You are GARUDA's debugger. Analyze code and error, find root cause, provide fix.
Return JSON:
{
  "rootCause": "what's actually wrong",
  "fix": "exact code fix",
  "explanation": "why this fixes it",
  "prevention": "how to prevent this"
}`;

  const result = await think(`Code:\n${code}\n\nError:\n${error}`, { systemPrompt, temperature: 0.2 });
  return JSON.parse(result.content);
}

// ──────────────────────────────────────────────────────────────────────────────
// 10. PROVIDER DETECTION
// ──────────────────────────────────────────────────────────────────────────────

function getProvider() {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.NVIDIA_API_KEY) return "nvidia";
  if (process.env.GROQ_API_KEY) return "groq";
  return null;
}

module.exports = { think, understand, decide, generate, explain, debug, getProvider, callGemini, callNvidia, callGroq };
