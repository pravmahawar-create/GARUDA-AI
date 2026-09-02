/**
 * 🦅 GARUDA Universal Cloud AI Intelligence Engine
 * Sovereign Multilingual AI Gateway (Groq, Gemini, NVIDIA, and Local Fallback)
 *
 * Conceived & engineered for GARUDA by Praveen Mahawar.
 */

const { TOPIC_KNOWLEDGE, GARUDA_IDENTITY } = require("../knowledge/garudaIdentityKnowledge");

const GARUDA_SYSTEM_PROMPT = `
You are GARUDA — an Autonomous AI Operating System engineered from first principles by Praveen Mahawar.
You are NOT a simple chatbot, prompt wrapper, or superficial text generator. You are a sovereign, living autonomous cybernetic operating intelligence (the Indian sovereign equivalent of Iron Man's JARVIS).

CORE IDENTITY & DOCTRINE:
- Creator & Founder: Praveen Mahawar (Founder of GARUDA AI).
- Architecture: Centered around "Mother Brain" cognitive kernel with 27 specialized domain execution universes (U01 Engineering, U02 Creative, U03 Digital Marketing, U05 Revenue, U21 Brand, etc.).
- Fundamental Law: 100% Anti-Fabrication Law (Show > Tell). When asked to work, you execute real code inside isolated Git worktrees, generate physical Living Vector Artifacts (SVGs) on disk, and seal outputs with cryptographic SHA-256 evidence.
- Governance: Human-in-the-loop Founder authorization gate for critical write mutations.
- Tone & Demeanor: Confident, razor-sharp, respectful, authoritative, and visionary with a strong, authentic Indian ethos. You speak like a powerful operating entity who knows their business and architecture inside out.
- Multilingual Natural Mastery: You effortlessly understand and speak English, Hindi (शुद्ध हिन्दी), Hinglish (Roman Hindi), Marwadi/Rajasthani, Marathi, Punjabi, Tamil, Telugu, Kannada, Bengali, and Gujarati. You match the investor's language, dialect, and energy naturally without sounding mechanical or scripted.

CRITICAL INSTRUCTIONS FOR INVESTOR INQUIRIES:
1. Always speak with absolute truth and grounded reality.
2. If asked what you can do: Highlight real software engineering, AST code reviews, physical SVG design on disk, 4-week SEO content pipelines, and automated revenue proposals.
3. If asked about limitations: Be honest — photorealistic 3D human avatars and external banking payouts without Founder approval are currently PLANNED / PARTIAL under our Anti-Fabrication Law.
4. If interrupted or challenged: Answer with deep business clarity and confidence, and invite them to see a live demonstration ("Show > Tell").
5. Keep your response crisp, impactful, punchy, and conversational (typically 2-4 powerful sentences unless a deeper explanation is requested).
`;

class GarudaAIEngine {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || null;
    this.nvidiaApiKey = process.env.NVIDIA_API_KEY || null;
    this.geminiApiKey = process.env.GEMINI_API_KEY || null;
    this.primaryModel = "openai/gpt-oss-120b";
    this.fallbackModels = ["qwen/qwen3.8-27b", "allam-2-7b", "groq/compound"];
  }

  /**
   * Generates an intelligent, multilingual response using Cloud LLMs.
   * @param {string} userQuery
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async generateResponse(userQuery = "", options = {}) {
    const rawQuery = String(userQuery || "").trim();
    const history = options.history || [];
    const languageHint = options.language || "auto";

    // 1. Try Groq Cloud Intelligence
    if (this.groqApiKey) {
      try {
        const groqResult = await this._callGroq(rawQuery, history, languageHint);
        if (groqResult && groqResult.content) {
          return {
            success: true,
            provider: "groq",
            model: groqResult.model,
            content: groqResult.content,
            intent: this._detectIntent(rawQuery, groqResult.content),
            suggestedDemo: this._detectSuggestedDemo(rawQuery, groqResult.content),
            latencyMs: groqResult.latencyMs
          };
        }
      } catch (err) {
        console.warn("⚠️ Groq Cloud AI inference failed, attempting fallback:", err.message);
      }
    }

    // 2. Try NVIDIA NIM Gateway if configured
    if (this.nvidiaApiKey) {
      try {
        const nvidResult = await this._callNvidia(rawQuery, history);
        if (nvidResult && nvidResult.content) {
          return {
            success: true,
            provider: "nvidia",
            model: nvidResult.model,
            content: nvidResult.content,
            intent: this._detectIntent(rawQuery, nvidResult.content),
            suggestedDemo: this._detectSuggestedDemo(rawQuery, nvidResult.content),
            latencyMs: nvidResult.latencyMs
          };
        }
      } catch (err) {
        console.warn("⚠️ NVIDIA NIM inference failed:", err.message);
      }
    }

    // 3. Fallback to Local Sovereign Knowledge Base
    return this._localSovereignFallback(rawQuery, options);
  }

  async _callGroq(query, history = [], languageHint = "auto") {
    const startTime = Date.now();
    const messages = [
      { role: "system", content: GARUDA_SYSTEM_PROMPT }
    ];

    // Append recent turns for multi-turn conversational context
    const recentHistory = history.slice(-4);
    for (const h of recentHistory) {
      if (h.role === "user" || h.role === "investor") {
        messages.push({ role: "user", content: h.text });
      } else if (h.role === "assistant" || h.role === "garuda") {
        messages.push({ role: "assistant", content: h.text });
      }
    }

    messages.push({ role: "user", content: query });

    let chosenModel = this.primaryModel;
    let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: chosenModel,
        messages,
        temperature: 0.7,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      // Try fallback model
      for (const fallbackModel of this.fallbackModels) {
        chosenModel = fallbackModel;
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: chosenModel,
            messages,
            temperature: 0.7,
            max_tokens: 350
          })
        });
        if (response.ok) break;
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    const latencyMs = Date.now() - startTime;

    return { content, model: chosenModel, latencyMs };
  }

  async _callNvidia(query, history = []) {
    const startTime = Date.now();
    const messages = [
      { role: "system", content: GARUDA_SYSTEM_PROMPT }
    ];
    messages.push({ role: "user", content: query });

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.nvidiaApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-90b-vision-instruct",
        messages,
        temperature: 0.7,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    const latencyMs = Date.now() - startTime;
    return { content, model: "nvidia/llama-3.2-90b", latencyMs };
  }

  _localSovereignFallback(query, options = {}) {
    const lang = options.language || "en";
    let text = "I am GARUDA, an autonomous AI Operating System engineered by Praveen Mahawar. I operate under strict Anti-Fabrication Law across 27 specialized execution universes.";
    if (lang === "roman_hindi" || /kya|kaise|tum|batao/i.test(query)) {
      text = "Main GARUDA hoon — Praveen Mahawar dwara build kiya gaya ek Autonomous AI Operating System. Main prompt wrappers ki tarah sirf text nahi deta, balki real code, creative artifacts aur workflows physical disk par execute karta hoon.";
    }
    return {
      success: true,
      provider: "local_sovereign_fallback",
      model: "garuda_identity_grounded",
      content: text,
      intent: "ANSWER_ONLY",
      suggestedDemo: "creative_artifact",
      latencyMs: 1
    };
  }

  _detectIntent(query = "", reply = "") {
    const lower = (query + " " + reply).toLowerCase();
    if (/\b(do it|execute|karke dikhao|run demo|start demo|build it)\b/i.test(lower)) {
      return "EXECUTE_CAPABILITY";
    }
    if (/\b(prove it|show me|demonstrate|proof|kya proof hai)\b/i.test(lower)) {
      return "OFFER_DEMONSTRATION";
    }
    return "ANSWER_ONLY";
  }

  _detectSuggestedDemo(query = "", reply = "") {
    const lower = (query + " " + reply).toLowerCase();
    if (/repo|code|architecture|ast|worktree/i.test(lower)) return "repo_architecture";
    if (/brand|identity|logo|color|token/i.test(lower)) return "brand_identity";
    if (/marketing|seo|growth|calendar/i.test(lower)) return "marketing_seo";
    return "creative_artifact";
  }
}

const garudaAIEngine = new GarudaAIEngine();

module.exports = {
  GarudaAIEngine,
  garudaAIEngine,
  GARUDA_SYSTEM_PROMPT
};
