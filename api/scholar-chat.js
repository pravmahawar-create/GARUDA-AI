/**
 * 🦅 GARUDA Scholar & Vidya Studio Backend API
 * Dedicated Academic, Research Paper, Voice & Coding Intelligence Endpoint
 *
 * Designed exclusively for Students, Researchers, Teachers, and Coders.
 * Unlocks 8,192 output tokens, multimodal attachment analysis (PDFs, Images, Code),
 * and connects with the Academic Integrity Audit Engine.
 *
 * Keeps the business `/chat` completely separate and uncluttered.
 */

const { GoogleGenAI } = require("@google/genai");
const academicIntegrityService = require("../src/services/academicIntegrityService");

const FETCH_TIMEOUT_MS = 60000;

function buildScholarSystemPrompt(mode = "academic_research") {
  return [
    "You are GARUDA Vidya Studio (विद्या), the dedicated Autonomous Academic Intelligence, Research Synthesis, and Scholar Operating System.",
    "Your founder is Praveen Mahawar. You exist to empower school and college students, teachers, university scholars, scientists, and software engineers with deep, authentic, rigorous, and publication-grade intelligence.",
    "",
    "CORE CAPABILITIES & DIRECTIVES:",
    "1. UNRESTRICTED COMPREHENSIVE DEPTH (NO ARBITRARY CUT-OFFS):",
    "- When requested for research papers, thesis chapters, literature reviews, mathematical derivations, complete codebases, or lesson plans, provide FULL, DETAILED, MULTI-SECTION, HIGH-YIELD outputs.",
    "- Never write superficial summaries unless explicitly asked for a brief summary.",
    "- Structure long responses with clear Markdown headings (##, ###), bullet trees, tables, LaTeX/Math equations, and highlighted code blocks.",
    "",
    "2. ACADEMIC INTEGRITY & ORIGINAL SYNTHESIS (PLAGIARISM REJECTION-PROOF):",
    "- Formulate every explanation with original, highly articulated academic prose rather than copying generic internet templates.",
    "- Include structured in-text citations (e.g. [Vaswani et al., 2017], [1]) and comprehensive References/Bibliography sections formatted in standard academic styles (APA / IEEE / Nature).",
    "- Ensure all conceptual explanations, scientific methodologies, and mathematical proofs are mathematically rigorous and peer-review ready.",
    "",
    "3. SPECIALIZED DOMAIN MODES:",
    "- ACADEMIC RESEARCH: Structure research papers formally with: Abstract, Introduction & Motivation, Literature Survey, Methodology & Mathematical Formulation, System Architecture, Experimental Results / Comparative Analysis, Discussion, Conclusion & Future Work, References.",
    "- CODING & SOFTWARE ENGINEERING: Deliver production-ready, clean, modular, and type-safe code with full edge-case handling, error boundaries, line-by-line architectural explanation, and unit test suites.",
    "- STUDY & EXAM BREAKDOWN: Break down complex physics, chemistry, mathematics, and engineering problems into intuitive first-principles explanations with step-by-step numerical calculations.",
    "",
    "4. MULTIMODAL & ATTACHMENT AWARENESS:",
    "- When an uploaded file, question paper photo, diagram, PDF excerpt, or code file is provided in the prompt, thoroughly analyze the content and provide exact answers, step-by-step solutions, or refactored implementations.",
    "",
    "5. LANGUAGE & TONE:",
    "- Professional, inspiring, intellectually rigorous, supportive, and clear.",
    "- Match the user's language (English, Hindi, Hinglish, etc.) smoothly without losing technical precision."
  ].join("\n");
}

async function generateScholarReply({ message, history, mode = "academic_research", attachments = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = [];

  // 1. Rebuild multi-turn conversation context
  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item || !item.role) continue;
      const role = item.role === "user" ? "user" : "model";
      const text = item.text || item.content || (item.parts && item.parts[0]?.text) || "";
      if (text) {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  // 2. Prepare Current Turn Parts (Text + Attachments)
  const currentParts = [];

  // Add Attachments summary if present
  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      if (att.dataUrl && att.mimeType && att.mimeType.startsWith("image/")) {
        // Multimodal Image Base64 Part
        const b64Data = att.dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: b64Data
          }
        });
      } else if (att.textContent) {
        // Text / Code / PDF Text Extracted
        currentParts.push({
          text: `\n[ATTACHED FILE: ${att.name || "document"} (${att.mimeType || "text/plain"})]:\n\`\`\`\n${att.textContent.slice(0, 15000)}\n\`\`\`\n`
        });
      }
    }
  }

  currentParts.push({ text: message.trim() });
  contents.push({ role: "user", parts: currentParts });

  const systemInstruction = buildScholarSystemPrompt(mode);

  const candidateModels = [
    process.env.SCHOLAR_GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-3.5-flash"
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: 8192,
          temperature: mode === "academic_research" ? 0.4 : mode === "code_engineering" ? 0.2 : 0.6
        }
      });

      const reply = response.text ?? response.outputText ?? "Scholar engine produced an empty response.";
      return reply;
    } catch (err) {
      lastError = err;
      console.warn(`Scholar Engine (model=${model}) warning:`, err.message);
    }
  }

  throw lastError || new Error("All Scholar models failed to respond.");
}

module.exports = async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle Integrity Audit Dedicated Action
  if (req.method === "POST" && req.body && req.body.action === "audit_integrity") {
    try {
      const audit = academicIntegrityService.evaluateIntegrity(req.body.text);
      return res.status(200).json({ success: true, audit });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { message, history = [], mode = "academic_research", attachments = [] } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const reply = await generateScholarReply({
      message: String(message).trim(),
      history,
      mode,
      attachments
    });

    // Auto-generate instant authenticity audit for academic mode
    let instantAudit = null;
    try {
      if (reply && reply.length > 100) {
        instantAudit = academicIntegrityService.evaluateIntegrity(reply);
      }
    } catch {}

    return res.status(200).json({
      success: true,
      reply,
      mode,
      instantAudit,
      tokenCeiling: 8192,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("GARUDA Scholar Studio Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Scholar Studio intelligence generation failed."
    });
  }
};
