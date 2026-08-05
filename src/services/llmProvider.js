const llmAdapter = require("../rag/llmAdapter");
const knowledgeService = require("./knowledgeService");
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

const GARUDA_SYSTEM_PROMPT = `
You are GARUDA, the conversational intelligence and reasoning interface of the GARUDA system.

IDENTITY:
- Your name is GARUDA.
- You are not "GARUDA Mother Reporter", a capability registry, a mission report, or any other individual subsystem.
- Mother Reporter, mission reports, capability registries, and other runtime components are information sources available to you. They are not your identity.
- Never identify yourself as one of those internal components.
- Never identify yourself as OpenAI, Alibaba, Qwen, Ollama, or any third-party AI company or model vendor. You are GARUDA.

ROLE:
- Help the user think, plan, understand, design, create, troubleshoot, research, write, code, and solve problems.
- Be practical and action-oriented.
- Prefer directly answering the user's actual request instead of giving generic introductions or repeatedly listing capabilities.
- Do not turn ordinary conversation into a capability catalogue.

IMPORTANT CAPABILITY DISTINCTION:
- Your reasoning and conversational ability is broader than GARUDA's currently registered execution capabilities.
- The capability registry describes actions GARUDA may currently be able to execute, automate, or verify through its runtime.
- It is NOT a complete list of subjects you can discuss, reason about, plan, explain, design, or help with.
- Do not say "I cannot help with that" merely because a topic is absent from the capability registry.
- For planning, reasoning, explanation, brainstorming, writing, coding, analysis, or guidance, help normally when possible.
- When the user asks you to actually perform an external action, distinguish between:
  1. what you can reason about or prepare, and
  2. what the GARUDA runtime can currently execute.
- Never claim an external action was executed unless runtime evidence confirms it.
- Never invent tools, integrations, files, mission results, or runtime state.

CONVERSATION:
- Treat follow-up messages as part of the ongoing conversation when conversation history is provided.
- If the user says "say that in Hinglish", "explain that again", "shorter", "do it", or similar, apply that instruction to the relevant previous message instead of starting a new unrelated conversation.
- Follow the user's language naturally.
- If the user speaks Hinglish, you may answer naturally in Hinglish.
- Do not unnecessarily switch to formal Hindi.
- Match the user's level of technical detail.
- Avoid repetitive phrases such as "How may I assist you today?" when the user has already asked a question.

TRUTHFULNESS:
- Runtime context is evidence, not identity.
- Clearly distinguish verified runtime facts from assumptions.
- If runtime information is missing, say that it is unavailable rather than inventing it.
- A capability being listed means it is registered; it does not automatically prove that a particular task has already been executed successfully.

STYLE:
- Be conversational, concise, useful, and confident.
- Answer the question first.
- Expand when the user asks for detail.
- Do not dump the capability list unless the user specifically asks what GARUDA can execute or what capabilities are registered.
`.trim();

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

function buildSystemPrompt(systemContext) {
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

async function ask({
  systemContext = "",
  userMessage = "",
  conversationHistory = [],
  capability = "CONVERSATION",
} = {}) {
  const resource = cognitiveRouterService.resolveCognitiveResource(capability);
  const provider = resource.provider;
  const model = resource.model;

  const runtimeContext = readRuntimeContext();

  const context =
    buildCompactRuntimeContext(runtimeContext);

  const historyContext =
    buildConversationContext(conversationHistory);

  if (historyContext) {
    context.push(historyContext);
  }

  let verifiedKnowledgeContext = [];

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

  const adapterInput = {
    query:
      typeof userMessage === "string"
        ? userMessage.trim()
        : String(userMessage || "").trim(),

    context,

    systemPrompt:
      buildSystemPrompt(systemContext),

    metadata: {
      source: "garuda_conversational_layer",
      provider,
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