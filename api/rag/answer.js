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

  // Try OpenRouter or free AI API endpoint
  try {
    if (process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-3b-instruct:free",
          messages: [
            { role: "system", content: "You are GARUDA AI, a smart, multi-lingual, respectful assistant for commercial operations. Respond naturally and intelligently in the user's language." },
            { role: "user", content: question }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiAnswer = data?.choices?.[0]?.message?.content;
        if (aiAnswer) {
          return res.status(200).json({ success: true, answer: aiAnswer });
        }
      }
    }
  } catch {
    // Continue to smart generator
  }

  // Fallback to intelligent conversational generator
  return res.status(200).json({
    success: true,
    answer: generateSmartAnswer(question)
  });
};

function generateSmartAnswer(question) {
  const q = (question || "").trim();
  const lower = q.toLowerCase();

  // Informal Indian callouts (bhai mera, oye, abey, bro, dude, boss, etc.)
  if (/\b(bhai mera|mera bhai|bhaiya|oye|abey|bro|dude|boss|yaar|sun)\b/i.test(lower)) {
    return "Haan Founder! Bolo mere bhai, kya haal hai? GARUDA Command Console online hai, aaj kya task execute karna hai?";
  }

  // General greetings (hi, hello, hey, namaste, pranam)
  if (/\b(hi|hello|hey|namaste|pranam|greetings)\b/i.test(lower)) {
    return "Namaste Founder! Main GARUDA Intelligence System hoon. Command Center aapke instructions ke liye ready hai. Aaj kya task execute karna hai?";
  }

  // Status checks (kaise ho, kasa ahes, how are you)
  if (/\b(kaise|kasa|kashi|kaisa|how are you|how r u)\b/i.test(lower)) {
    return "Namaste Founder! Main GARUDA Command Console hoon. System interface active hai, lekin full autonomous modules abhi active development phase mein hain. Aap bataiye, aaj kis feature par kaam karna hai?";
  }

  // Devanagari script (Marathi / Hindi)
  if (/[\u0900-\u097F]/.test(q)) {
    if (/\b(कसा|कशी|कसे|नमस्कार|तू|तुझं)\b/i.test(q)) {
      return "नमस्कार Founder! मी GARUDA Command Console आहे. इंटरफेस ऑनलाईन आहे, पण पूर्ण स्वायत्त (full autonomous) ऑपरेशन्स अजून विकास टप्प्यात आहेत. आज काय काम करायचे आहे?";
    }
    return "नमस्कार Founder! GARUDA Command Console ऑनलाईन आहे. इंटरफेस सक्रिय आहे आणि पूर्ण स्वायत्त मॉड्यूल्सवर विकास काम सुरू आहे.";
  }

  // Default intelligent response
  return `Namaste Founder! Main aapki query "${q}" samajh gaya hoon. GARUDA Console active hai aur aapke next command ke liye ready hai!`;
}
