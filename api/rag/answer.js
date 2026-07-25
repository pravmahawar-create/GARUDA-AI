module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const question = String(req.body?.question || req.query?.question || "").trim();
  if (!question) {
    return res.status(400).json({ success: false, message: "Question is required" });
  }

  try {
    const systemPrompt = `You are GARUDA AI, a highly intelligent, natural, conversational AI assistant for commercial operations. Respond naturally, contextually, and intelligently in whichever language or style the user speaks (Hindi, Hinglish, Marathi, English, etc.). Be direct, helpful, and engage in genuine human-like conversation without rigid templates or canned speeches.`;

    const aiRes = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (aiRes.ok) {
      const aiText = await aiRes.text();
      if (aiText && aiText.trim()) {
        return res.status(200).json({
          success: true,
          answer: aiText.trim()
        });
      }
    }
  } catch (err) {
    console.error("AI Serverless error:", err);
  }

  return res.status(200).json({
    success: true,
    answer: "GARUDA AI Console is online."
  });
};
