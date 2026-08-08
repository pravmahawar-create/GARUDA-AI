const { GoogleGenAI } = require("@google/genai");

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

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not configured.");
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured" });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message string is required" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents = [];
    const systemPrompt = "You are GARUDA, an advanced AI system for garudaos.in. You provide helpful, clear, intelligent, and accurate responses.";

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
          contents.push({
            role,
            parts: [{ text }]
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message.trim() }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt
      }
    });

    const reply = response.text || "No response text generated.";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Public Chat API Error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error processing AI chat request"
    });
  }
};
