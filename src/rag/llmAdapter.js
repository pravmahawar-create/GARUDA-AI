/**
 * GARUDA RAG - Production LLM Adapter
 *
 * Purpose:
 * - Provide a provider-agnostic interface for future LLM integrations.
 * - Keep GARUDA stable even when no external LLM provider is configured.
 * - Prevent server crashes caused by missing API keys or provider failures.
 *
 * Current mode:
 * - Safe fallback adapter only.
 * - Real provider integrations will be plugged in later without changing RAG engine contracts.
 */

const DEFAULT_PROVIDER = "fallback";

function getConfiguredProvider() {
  return (process.env.GARUDA_LLM_PROVIDER || DEFAULT_PROVIDER).trim().toLowerCase();
}

function isLLMConfigured() {
  const provider = getConfiguredProvider();

  if (provider === "fallback") {
    return false;
  }

  if (provider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  return false;
}

function buildFallbackAnswer({ query, context }) {
  const safeQuery = typeof query === "string" ? query.trim() : "";
  const chunks = Array.isArray(context) ? context : [];

  if (!chunks.length) {
    return {
      answer:
        "I could not find enough verified knowledge context to answer this question confidently.",
      provider: "fallback",
      model: "none",
      grounded: false,
      citations: [],
      warnings: ["NO_CONTEXT_AVAILABLE"],
    };
  }

  const citations = chunks.slice(0, 5).map((chunk, index) => ({
    id: index + 1,
    sourceFile: chunk.sourceFile || "Unknown source",
    page: chunk.page || null,
    category: chunk.category || null,
    score: typeof chunk.score === "number" ? chunk.score : null,
  }));

  const topContext = chunks
    .slice(0, 3)
    .map((chunk, index) => {
      const text = typeof chunk.text === "string" ? chunk.text.trim() : "";
      return `[${index + 1}] ${text}`;
    })
    .join("\n\n");

  return {
    answer:
      "LLM provider is not configured yet. GARUDA has retrieved relevant verified context, but final AI answer generation is currently running in safe fallback mode.\n\n" +
      `Question: ${safeQuery || "Not provided"}\n\n` +
      `Top retrieved context:\n\n${topContext}`,
    provider: "fallback",
    model: "none",
    grounded: true,
    citations,
    warnings: ["LLM_PROVIDER_NOT_CONFIGURED"],
  };
}

async function generateAnswer({ query, context, systemPrompt, metadata } = {}) {
  const provider = getConfiguredProvider();

  if (!isLLMConfigured()) {
    return buildFallbackAnswer({ query, context, systemPrompt, metadata });
  }

  if (provider === "openai") {
    throw new Error(
      "OPENAI_PROVIDER_NOT_IMPLEMENTED: OpenAI adapter will be added in the provider integration step."
    );
  }

  return buildFallbackAnswer({ query, context, systemPrompt, metadata });
}

module.exports = {
  generateAnswer,
  isLLMConfigured,
  getConfiguredProvider,
};
