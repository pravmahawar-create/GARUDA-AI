/**
 * 🦅 GARUDA CLI — TRUE LLM STREAMING MODULE
 * 
 * Implements real-time token-by-token streaming consumption over Server-Sent Events (SSE)
 * for Groq LPUs and Google Gemini with graceful non-streaming fallbacks and AbortController.
 */

const { TextDecoder } = require("util");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Parses Server-Sent Event (SSE) buffer chunks into individual data lines.
 */
function parseSSELines(bufferText) {
  const lines = bufferText.split(/\r?\n/);
  const dataLines = [];
  let remaining = "";

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line.startsWith("data:")) {
      dataLines.push(line.replace(/^data:\s*/, ""));
    }
  }

  remaining = lines[lines.length - 1];
  return { dataLines, remaining };
}

/**
 * Streams completion tokens from Groq API via SSE.
 */
async function streamGroq(model, messages, systemPrompt, onChunk, signal) {
  if (!GROQ_API_KEY) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.2,
      stream: true
    }),
    signal
  });

  if (!res.ok) {
    throw new Error(`Groq HTTP error ${res.status}: ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { dataLines, remaining } = parseSSELines(buffer);
    buffer = remaining;

    for (const data of dataLines) {
      if (data === "[DONE]") return fullText;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          if (onChunk) onChunk(delta);
        }
      } catch (_) {
        // Skip partial JSON segments
      }
    }
  }

  return fullText;
}

/**
 * Streams completion tokens from Google Gemini API via SSE.
 */
async function streamGemini(model, messages, systemPrompt, onChunk, signal) {
  if (!GEMINI_API_KEY) return null;

  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2500
      }
    }),
    signal
  });

  if (!res.ok) {
    throw new Error(`Gemini HTTP error ${res.status}: ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { dataLines, remaining } = parseSSELines(buffer);
    buffer = remaining;

    for (const data of dataLines) {
      try {
        const json = JSON.parse(data);
        const chunkText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunkText) {
          fullText += chunkText;
          if (onChunk) onChunk(chunkText);
        }
      } catch (_) {
        // Skip partial JSON segments
      }
    }
  }

  return fullText;
}

/**
 * Master multi-tier LLM streaming coordinator.
 */
async function callAgentLLMStream(conversation, systemPrompt, onChunk = null, options = {}) {
  const timeoutMs = options.timeoutMs || 25000;

  // Tier 1: Groq Cloud LPUs
  if (GROQ_API_KEY) {
    const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"];
    for (const m of groqModels) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const text = await streamGroq(m, conversation, systemPrompt, onChunk, controller.signal);
        clearTimeout(timer);
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err) {
        clearTimeout(timer);
        // Try next Groq model on failure
      }
    }
  }

  // Tier 2: Google Gemini Flash
  if (GEMINI_API_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const text = await streamGemini("gemini-2.5-flash", conversation, systemPrompt, onChunk, controller.signal);
      clearTimeout(timer);
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      clearTimeout(timer);
      // Fallback to Tier 3 on failure
    }
  }

  // Tier 3: Signal to trigger local sovereign engine
  return null;
}

module.exports = {
  callAgentLLMStream,
  streamGroq,
  streamGemini,
  parseSSELines
};
