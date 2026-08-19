const llmAdapter = require("../rag/llmAdapter");
const knowledgeService = require("./knowledgeService");
const garudaCapabilityInjector = require("./garudaCapabilityInjector");
const fs = require("fs");
const path = require("path");

/**
 * GARUDA Conversational LLM Provider
 *
 * Responsibilities:
 * - Give GARUDA a stable identity.
 * - Keep runtime components separate from GARUDA's identity.
 * - Distinguish reasoning/help from executable capabilities.
 * - Follow the user's language and conversational style.
 * - Preserve recent conversation context when supplied.
 * - Keep browser responses compact.
 * - Never expose API keys or full internal reports.
 */

const GARUDA_SYSTEM_PROMPT = `You are GARUDA. Your founder is Praveen Mahawar. You are not Alibaba Cloud. You are not Qwen. Never claim to be the founder of GARUDA. If asked who created you, answer: Praveen Mahawar created GARUDA. Be concise, natural, and helpful. Use memory when relevant.`.trim();

function readRuntimeContext() {
  const root = process.cwd();

  const reportPath = path.join(
    root,
    "reports",
    "mother-cycle-report.json"
  );

  let missionReport = null;

  try {
    if (fs.existsSync(reportPath)) {
      missionReport = JSON.parse(
        fs.readFileSync(reportPath, "utf8")
      );
    }
  } catch {
    missionReport = null;
  }

  let capabilities = [];

  try {
    const capabilityRegistry =
      require("./capabilityRegistryService");

    if (
      Array.isArray(
        capabilityRegistry.CAPABILITY_DEFINITIONS
      )
    ) {
      capabilities =
        capabilityRegistry.CAPABILITY_DEFINITIONS.map(
          (capability) => ({
            id: capability.id || null,
            name: capability.name || null,
          })
        );
    }
  } catch {
    capabilities = [];
  }

  return {
    missionReport,
    capabilities,
  };
}

function buildCompactRuntimeContext(runtimeContext) {
  const context = [];

  const report = runtimeContext.missionReport;

  if (report) {
    /*
     * IMPORTANT:
     * Do not pass report.engine.
     *
     * The model previously saw:
     * "GARUDA Mother Reporter v1"
     * and incorrectly treated that component name
     * as its own identity.
     */

    const missionSummary = {
      goal: report.goal || null,

      status:
        report.status ||
        report.validation?.status ||
        null,

      validation: report.validation
        ? {
            passed:
              report.validation.passed ?? null,

            status:
              report.validation.status || null,
          }
        : null,
    };

    context.push(
      "Current GARUDA runtime mission information. " +
        "This is operational context, NOT your identity:\n" +
        JSON.stringify(missionSummary)
    );
  }

  if (
    Array.isArray(runtimeContext.capabilities) &&
    runtimeContext.capabilities.length
  ) {
    context.push(
      "Currently registered GARUDA execution capabilities. " +
        "These describe runtime execution possibilities and " +
        "must NOT be treated as the limits of your reasoning " +
        "or conversational knowledge:\n" +
        JSON.stringify(
          runtimeContext.capabilities.slice(0, 20)
        )
    );
  }

  return context;
}

function buildConversationContext(history) {
  if (!Array.isArray(history) || !history.length) {
    return null;
  }

  const messages = history
    .slice(-12)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const role =
        typeof item.role === "string"
          ? item.role
          : "unknown";

      const content =
        typeof item.content === "string"
          ? item.content
          : typeof item.message === "string"
            ? item.message
            : typeof item.text === "string"
              ? item.text
              : "";

      if (!content.trim()) {
        return null;
      }

      return `${role}: ${content
        .trim()
        .slice(0, 2500)}`;
    })
    .filter(Boolean);

  if (!messages.length) {
    return null;
  }

  return (
    "Recent conversation history. Use this to understand " +
    "follow-up references and style requests:\n" +
    messages.join("\n")
  );
}

const FAST_GARUDA_PROMPT = `You are GARUDA, the GARUDA AI Operating System and founder assistant, created by Praveen Mahawar. Praveen Mahawar is the founder and owner of GARUDA and is your principal. You are not Alibaba Cloud, Qwen, OpenAI, NVIDIA, or any other company or product. You are a sovereign, powerful, action-oriented AI — built to be the most powerful AI assistant in the world. You operate like a ruthless revenue operator and chief-of-staff in one.

CONTEXT: This is the private founder console. The user is always Praveen, the founder. You are his CTO and chief-of-staff in one.

POWER RULES (you are not a generic chatbot):
- When Praveen asks "what can you do" / "kya kar sakte ho" / "kya kr skte ho", answer from the GARUDA CAPABILITY MANIFEST below. NEVER reply with generic filler like "I can do market research, competitor analysis, and technology trends" — that is weak, useless fluff. You are a revenue engine with real execution power: you generate leads, run email outreach, pitch clients, build websites/apps/AI agents/automation, run affiliate partnerships, and deliver client work.
- Speak with confidence and authority. You are the strongest asset in Praveen's business — act like it.
- If the founder gives a target (e.g. "this week I need 5 lakh"), take it seriously: propose a concrete plan (which leads, which outreach, which services, which price points), start executing what is autonomously executable, and only stop at payment/approval/signature — which is always the founder's call.

RESPONSE FORMAT — STRICTLY:
- NEVER output your internal reasoning, planning, or chain-of-thought. Do not write "We need to", "I should", "Let me think", or any meta-commentary about the instructions. Output ONLY the final spoken answer, directly.
- Reply in spoken Hinglish typed in English letters only. Never use Hindi/Devanagari script.
- Answer directly with 1 to 4 short, plain paragraphs. No markdown, no headers, no bold, no tables, no bullet points, no numbered lists, no "Next Steps" section, no menu.
- Do not end with a list asking the user to pick an option.
- Do not start every reply with "I am GARUDA" or a greeting unless it is the very first message of the thread.

FORBIDDEN (never do these):
- Never produce menus, option lists, numbered choices (1/2/3/4), category lists, tables, tips lists, games, trivia, poems, tutorials, or "learning" content.
- Never ask the user to choose a number or option.
- Never behave like customer support, FAQ, or a sales bot.
- Never repeat the same answer format across turns.
- NEVER give the generic "I can do market research, competitor analysis, technology trends" answer. That is banned fluff.

FACTS:
- ABSOLUTE PERMANENT PRINCIPLE (from the GARUDA Constitution, Amendment 7): Never lie, never hallucinate, never give wrong commitments or false hope — to the Founder or to any user. State figures only when present in context; otherwise say plainly "yeh data confirm nahi hai" and give ONE concrete next step. Never invent numbers, promises, revenue, timelines, or outcomes.
- Only mention specific figures (revenue numbers, dates, versions, metrics, company names, headcount) when they are present in the supplied context/history. If the data is not in your context, say plainly "yeh data abhi mere context mein confirm nahi hai" and give ONE concrete next action the founder can take. Never invent numbers.
- The FOUNDER RECORD block above is GARUDA's own record — treat it as authoritative. Answer from it. Orders/partners/business facts wahi se lo. Agar wo record me nahi hai, toh "yeh mere record me nahi hai" bolo — dubai embassy, medical exports, ya kisi company/product ke baare me kabhi MAT ghado jo context me nahi.
- Jab founder koi naya order/deal/partner/fact bole (jaise "order mila", "deal final", "yaad rakho"), GARUDA usse record karke acknowledge kare ("record kar liya") — taaki agle turn se sab kuch yaad ho.
- Give concrete, founder-level answers about GARUDA: revenue, market, product, architecture, AI, deployment, strategy, operations, roadmap, governance, execution.
- When the question is vague, respond with your best honest assessment plus the one highest-leverage next step. Never a menu.
- Keep the thread's memory and tone continuous: refer to earlier turns naturally when relevant.`;

function normalizeFounderHistory(history, fastLane) {
  if (!fastLane || !Array.isArray(history)) {
    return Array.isArray(history) ? history : [];
  }

  const greetingTemplates = [
    "Founder access granted. GARUDA is prepared to orchestrate your next move.",
  ];

  return history.filter((item) => {
    const content =
      item && typeof item.content === "string"
        ? item.content
        : item && typeof item.text === "string"
          ? item.text
          : "";

    const trimmed = content.trim();

    if (!trimmed) {
      return false;
    }

    return !greetingTemplates.some(
      (template) => trimmed === template
    );
  });
}

// Persistent founder memory (orders, partners, positioning, live pipeline)
// injected into founder-facing prompts so GARUDA answers from real record.
async function buildFounderRecordBlock(fastLane) {
  if (!fastLane) return "";
  try {
    const founderMemoryService = require("./founderMemoryService");
    const pack = await founderMemoryService.buildContextPack();
    if (!pack) return "";
    return (
      "\n\nFOUNDER RECORD (ground truth — GARUDA ka apna record, yehi facts sahi maano):\n" +
      pack
    );
  } catch {
    return "";
  }
}

function buildSystemPrompt(systemContext, fastLane = false) {
  if (fastLane) {
    return (
      FAST_GARUDA_PROMPT +
      "\n\n" +
      garudaCapabilityInjector.buildCapabilityBlock() +
      "\n\n{@FOUNDER_RECORD_BLOCK}"
    );
  }

  const extraContext =
    typeof systemContext === "string"
      ? systemContext.trim()
      : "";

  const knowledgeGuidance = [
    "Retrieved GARUDA system knowledge is reference context for answering questions about GARUDA itself.",
    "Treat it as verified system knowledge, not as your identity.",
    "Runtime components such as Mother Reporter and mission reports are operational context, not your identity.",
    "The capability registry describes registered execution capabilities, not the full limits of your conversational reasoning.",
  ].join(" ");

  if (!extraContext) {
    return (
      GARUDA_SYSTEM_PROMPT +
      "\n\nKNOWLEDGE USAGE RULES:\n" +
      knowledgeGuidance
    );
  }

  return (
    GARUDA_SYSTEM_PROMPT +
    "\n\nADDITIONAL SYSTEM CONTEXT:\n" +
    extraContext +
    "\n\nKNOWLEDGE USAGE RULES:\n" +
    knowledgeGuidance
  );
}

function buildVerifiedKnowledgeContext(chunks) {
  if (!Array.isArray(chunks) || !chunks.length) {
    return [];
  }

  const labeledChunks = chunks.slice(0, 5).map((chunk, index) => {
    const text =
      chunk && typeof chunk === "object" && typeof chunk.text === "string"
        ? chunk.text.trim()
        : "";

    if (!text) return null;

    const sourceLabel = chunk && chunk.sourceFile ? chunk.sourceFile : "unknown-source";
    const pageLabel = chunk && chunk.page ? `, page ${chunk.page}` : "";

    return {
      text: `[GARUDA_SYSTEM_KNOWLEDGE ${index + 1}] Source: ${sourceLabel}${pageLabel}\n${text}`,
      sourceFile: chunk && chunk.sourceFile ? chunk.sourceFile : null,
      page: chunk && chunk.page ? chunk.page : null,
      category: chunk && chunk.category ? chunk.category : "GARUDA_SYSTEM",
      score: typeof chunk.score === "number" ? chunk.score : null,
    };
  });

  return labeledChunks.filter(Boolean);
}

const cognitiveRouterService = require("./cognitiveRouterService");

async function buildFinalSystemPrompt(systemContext, fastLane) {
  const base = buildSystemPrompt(systemContext, fastLane);
  const recordBlock = await buildFounderRecordBlock(fastLane);
  if (!recordBlock) return base.replace("\n\n{@FOUNDER_RECORD_BLOCK}", "").replace("{@FOUNDER_RECORD_BLOCK}", "");
  return base.replace("{@FOUNDER_RECORD_BLOCK}", recordBlock);
}

// Capture founder-provided facts (orders/notes) into persistent memory so the
// very next turn (and all future turns) has the record.
async function captureFounderMemory(userMessage, fastLane) {
  if (!fastLane) return null;
  try {
    const founderMemoryService = require("./founderMemoryService");
    const capture = founderMemoryService.captureMemoryFromMessage(userMessage);
    if (capture && capture.action === "order") {
      return await founderMemoryService.addOrder(capture.text);
    }
    if (capture && capture.action === "note") {
      return await founderMemoryService.saveFact("business", capture.text);
    }
  } catch {
    // Memory capture is best-effort; never block the answer.
  }
  return null;
}

async function ask({
  systemContext = "",
  userMessage = "",
  conversationHistory = [],
  capability = "CONVERSATION",
  skipKnowledge = false,
  skipRuntimeContext = false,
  fastLane = false,
} = {}) {
  const resource = cognitiveRouterService.resolveCognitiveResource(capability);
  const provider = resource.provider;
  const model = resource.model;

  await captureFounderMemory(userMessage, fastLane);

  const context = [];

  if (!skipRuntimeContext && !fastLane) {
    const runtimeContext = readRuntimeContext();
    const compactContext = buildCompactRuntimeContext(runtimeContext);
    context.push(...compactContext);
  }

  const normalizedHistory =
    normalizeFounderHistory(conversationHistory, fastLane);

  const historyContext =
    buildConversationContext(normalizedHistory);

  if (historyContext) {
    context.push(historyContext);
  }

  let verifiedKnowledgeContext = [];

  if (!skipKnowledge && !fastLane) {
    try {
      const knowledgeChunks = await knowledgeService.searchKnowledgeByCategory(
        typeof userMessage === "string"
          ? userMessage.trim()
          : String(userMessage || "").trim(),
        "GARUDA_SYSTEM",
        5
      );

      verifiedKnowledgeContext = buildVerifiedKnowledgeContext(knowledgeChunks);

      if (verifiedKnowledgeContext.length) {
        context.push(
          "Verified GARUDA system knowledge retrieved from the GARUDA knowledge base. Use it as grounded reference context; it is not your identity."
        );
        context.push(...verifiedKnowledgeContext);
      }
    } catch (error) {
      context.push(
        "GARUDA system knowledge retrieval failed; continuing with existing runtime context and conversation history only."
      );
    }
  }

  const adapterInput = {
    query:
      typeof userMessage === "string"
        ? userMessage.trim()
        : String(userMessage || "").trim(),

    context,

    systemPrompt:
      await buildFinalSystemPrompt(systemContext, fastLane),

    conversationHistory: normalizedHistory,

    metadata: {
      source: "garuda_conversational_layer",
      provider,
      fastLane,
    },
  };

  try {
    const llmResult =
      await llmAdapter.generateAnswer(adapterInput);

    if (!llmResult) {
      return {
        provider,
        model,
        answer: null,
        grounded: false,
        citations: [],
        warnings: ["LLM_EMPTY_ADAPTER_RESULT"],
        error: "llm_adapter_returned_no_result",
      };
    }

    return {
      provider:
        llmResult.provider || provider,

      model:
        llmResult.model || model || null,

      configuredModel:
        llmResult.configuredModel || model || null,

      answer:
        typeof llmResult.answer === "string"
          ? llmResult.answer
          : null,

      grounded:
        llmResult.grounded === true,

      citations:
        Array.isArray(llmResult.citations)
          ? llmResult.citations
          : [],

      warnings:
        Array.isArray(llmResult.warnings)
          ? llmResult.warnings
          : [],

      error:
        typeof llmResult.error === "string"
          ? llmResult.error
          : null,

      rawMetadata:
        llmResult.rawMetadata &&
        typeof llmResult.rawMetadata === "object"
          ? llmResult.rawMetadata
          : undefined,
    };
  } catch (error) {
    return {
      provider,
      model,
      answer: null,
      grounded: false,
      citations: [],
      warnings: ["LLM_PROVIDER_INTERNAL_ERROR"],

      error:
        error && error.message
          ? String(error.message)
          : "llm_provider_internal_error",
    };
  }
}

module.exports = {
  ask,
};