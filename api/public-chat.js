const { GoogleGenAI } = require("@google/genai");

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

function getNvidiaApiKey() {
  return process.env.NVIDIA_API_KEY || process.env.GARUDA_NVIDIA_API_KEY || null;
}

function getNvidiaModel() {
  return process.env.NVIDIA_MODEL || process.env.GARUDA_NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";
}

function buildHistoryMessages(history, message) {
  const messages = [
    {
      role: "system",
      content: "You are GARUDA, an advanced AI system for garudaos.in. You provide helpful, clear, intelligent, and accurate responses."
    }
  ];

  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item || !item.role) continue;
      const role = item.role === "user" ? "user" : "assistant";
      let text = "";
      if (typeof item.text === "string") {
        text = item.text;
      } else if (typeof item.content === "string") {
        text = item.content;
      } else if (Array.isArray(item.parts) && item.parts[0] && item.parts[0].text) {
        text = item.parts[0].text;
      }
      if (text) {
        messages.push({ role, content: text });
      }
    }
  }

  messages.push({ role: "user", content: message.trim() });
  return messages;
}

async function generateWithNvidia({ message, history }) {
  const apiKey = getNvidiaApiKey();
  const model = getNvidiaModel();

  const res = await fetch(NVIDIA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: buildHistoryMessages(history, message),
      max_tokens: 512,
      temperature: 0.6
    })
  });

  if (!res.ok) {
    const errorPayload = await res.json().catch(() => null);
    const errorMessage = errorPayload && errorPayload.error
      ? (errorPayload.error.message || errorPayload.error)
      : `NVIDIA API returned HTTP ${res.status}`;
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? null;
  if (!reply || !reply.trim()) {
    const err = new Error("NVIDIA API returned an empty response.");
    err.status = 502;
    throw err;
  }

  return reply.trim();
}

async function generateWithGemini({ message, history }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not configured.");
    const err = new Error("GEMINI_API_KEY environment variable is not configured");
    err.status = 500;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });

  const contents = [];

  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item || !item.role) continue;
      const role = item.role === "user" ? "user" : "model";
      let text = "";
      if (typeof item.text === "string") {
        text = item.text;
      } else if (typeof item.content === "string") {
        text = item.content;
      } else if (Array.isArray(item.parts) && item.parts[0] && item.parts[0].text) {
        text = item.parts[0].text;
      }
      if (text) {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  contents.push({ role: "user", parts: [{ text: message.trim() }] });

  const candidateModels = [
    process.env.GEMINI_MODEL || process.env.GARUDA_GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ].filter(Boolean);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: "You are GARUDA, an advanced AI system for garudaos.in. You provide helpful, clear, intelligent, and accurate responses."
        }
      });

      const reply = response.text ?? response.outputText ?? "No response text generated.";
      return reply;
    } catch (error) {
      lastError = error;
      console.error(`Public Chat Gemini Error (model=${model}):`, error && error.message ? error.message : error);
    }
  }

  if (lastError) {
    if (typeof lastError.status === "number") {
      throw lastError;
    }
    const err = new Error(lastError && lastError.message ? lastError.message : "Gemini API error");
    err.status = 500;
    throw err;
  }

  const err = new Error("All Gemini models failed to respond.");
  err.status = 502;
  throw err;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message string is required" });
  }

  const nvidiaKey = getNvidiaApiKey();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!nvidiaKey && !geminiKey) {
    console.error("No AI provider configured (NVIDIA_API_KEY or GEMINI_API_KEY).");
    return res.status(500).json({ error: "No AI provider is configured for public chat" });
  }

  // Prefer NVIDIA when configured, fall back to Gemini.
  if (nvidiaKey) {
    try {
      const reply = await generateWithNvidia({ message, history });
      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Public Chat NVIDIA Error:", error && error.message ? error.message : error);
      if (!geminiKey) {
        const status = typeof error.status === "number" && error.status >= 400 && error.status < 600 ? error.status : 500;
        return res.status(status).json({ error: error.message || "Internal server error processing AI chat request" });
      }
    }
  }

  try {
    const reply = await generateWithGemini({ message, history });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Public Chat API Error:", error);
    const status = typeof error.status === "number" && error.status >= 400 && error.status < 600
      ? error.status
      : 500;
    return res.status(status).json({
      error: error.message || "Internal server error processing AI chat request"
    });
  }
};
