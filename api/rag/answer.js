module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const question = String(req.body?.question || req.query?.question || "").trim();
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const systemPrompt = `You are GARUDA AI, an intelligent, respectful, multi-lingual AI operating system created for commercial operations. Answer the user's question clearly, intelligently, and directly in whichever language they speak (Hindi, Hinglish, Marathi, Kannada, Tamil, Spanish, French, German, English, etc.). Be respectful, helpful, and never make fake claims.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || "free-tier"}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiAnswer = data?.choices?.[0]?.message?.content;
      if (aiAnswer) {
        return res.status(200).json({
          success: true,
          answer: aiAnswer,
          model: "garuda-live-ai"
        });
      }
    }
  } catch (err) {
    console.error("Serverless AI error:", err);
  }

  return res.status(200).json({
    success: true,
    answer: `GARUDA AI Console received "${req.body?.question || "query"}". Interface is active, while full autonomous modules remain under active development.`
  });
};
