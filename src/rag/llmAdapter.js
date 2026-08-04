/**
 * GARUDA RAG - Production LLM Adapter
 *
 * Purpose:
 * - Provider-agnostic interface for cloud LLM integrations.
 * - Keep GARUDA stable when no external provider is configured.
 * - Never expose provider API keys in returned responses.
 *
 * Supported providers:
 * - fallback
 * - openai
 * - gemini
 * - ollama
 */

const DEFAULT_PROVIDER = "fallback";

function getConfiguredProvider() {
  return (process.env.GARUDA_LLM_PROVIDER || DEFAULT_PROVIDER)
    .trim()
    .toLowerCase();
}

function getLLMApiKey() {
  return process.env.GARUDA_LLM_API_KEY || null;
}

function getOpenAIApiKey() {
  return (
    process.env.GARUDA_LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    null
  );
}

function getGeminiApiKey() {
  return (
    process.env.GARUDA_LLM_API_KEY ||
    process.env.GEMINI_API_KEY ||
    null
  );
}

function isLLMConfigured() {
  const provider = getConfiguredProvider();

  if (provider === "fallback") {
    return false;
  }

  if (provider === "openai") {
    return Boolean(getOpenAIApiKey());
  }

  if (provider === "gemini") {
    return Boolean(getGeminiApiKey());
  }

  if (provider === "ollama") {
    return true;
  }

  return false;
}

function buildFallbackAnswer({ query, context } = {}) {
  const safeQuery =
    typeof query === "string" ? query.trim() : "";

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
    sourceFile:
      chunk && typeof chunk === "object"
        ? chunk.sourceFile || "Unknown source"
        : "Unknown source",
    page:
      chunk && typeof chunk === "object"
        ? chunk.page || null
        : null,
    category:
      chunk && typeof chunk === "object"
        ? chunk.category || null
        : null,
    score:
      chunk &&
      typeof chunk === "object" &&
      typeof chunk.score === "number"
        ? chunk.score
        : null,
  }));

  const topContext = chunks
    .slice(0, 3)
    .map((chunk, index) => {
      let text = "";

      if (
        chunk &&
        typeof chunk === "object" &&
        typeof chunk.text === "string"
      ) {
        text = chunk.text.trim();
      } else {
        text = String(chunk || "").trim();
      }

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

function normalizeContext(context) {
  if (!Array.isArray(context)) {
    return String(context || "");
  }

  return context
    .slice(0, 10)
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (
        item &&
        typeof item === "object" &&
        typeof item.text === "string"
      ) {
        return item.text;
      }

      try {
        return JSON.stringify(item);
      } catch {
        return String(item || "");
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

function extractOpenAIResponseText(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (
    typeof payload.output_text === "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload.output_text)) {
    const text = payload.output_text
      .filter((item) => typeof item === "string")
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  if (Array.isArray(payload.output)) {
    const parts = [];

    for (const outputItem of payload.output) {
      if (!outputItem) {
        continue;
      }

      if (typeof outputItem.text === "string") {
        parts.push(outputItem.text);
      }

      if (Array.isArray(outputItem.content)) {
        for (const contentItem of outputItem.content) {
          if (!contentItem) {
            continue;
          }

          if (typeof contentItem === "string") {
            parts.push(contentItem);
          } else if (
            typeof contentItem.text === "string"
          ) {
            parts.push(contentItem.text);
          }
        }
      }
    }

    const text = parts.join("\n").trim();

    if (text) {
      return text;
    }
  }

  if (Array.isArray(payload.choices)) {
    const text = payload.choices
      .map((choice) => {
        if (
          choice &&
          choice.message &&
          typeof choice.message.content === "string"
        ) {
          return choice.message.content;
        }

        if (
          choice &&
          typeof choice.text === "string"
        ) {
          return choice.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return null;
}

function extractGeminiResponseText(payload) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray(payload.candidates)
  ) {
    return null;
  }

  const textParts = [];

  for (const candidate of payload.candidates) {
    const parts =
      candidate &&
      candidate.content &&
      Array.isArray(candidate.content.parts)
        ? candidate.content.parts
        : [];

    for (const part of parts) {
      if (
        part &&
        typeof part.text === "string" &&
        part.text.trim()
      ) {
        textParts.push(part.text.trim());
      }
    }
  }

  const answer = textParts.join("\n").trim();

  return answer || null;
}

function extractOllamaResponseText(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (typeof payload.response === "string") {
    const text = payload.response.trim();
    return text || null;
  }

  return null;
}

async function generateOpenAIAnswer({
  query,
  context,
  systemPrompt,
} = {}) {
  const apiKey = getOpenAIApiKey();

  const model =
    process.env.GARUDA_LLM_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    const fallback = buildFallbackAnswer({ query, context });
    return {
      ...fallback,
      provider: "openai",
      answer: null,
      warnings: ["LLM_PROVIDER_NOT_CONFIGURED"],
    };
  }

  const endpoint =
    "https://api.openai.com/v1/responses";

  const safeContext = normalizeContext(context);

  const input = [
    systemPrompt || "",
    safeContext || "",
    query || "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });

    if (!res.ok) {
      return {
        answer: null,
        provider: "openai",
        model,
        grounded: false,
        citations: [],
        warnings: ["OPENAI_API_ERROR"],
        error: `openai_http_${res.status}`,
      };
    }

    let payload;

    try {
      payload = await res.json();
    } catch {
      return {
        answer: null,
        provider: "openai",
        model,
        grounded: false,
        citations: [],
        warnings: ["OPENAI_INVALID_RESPONSE"],
        error: "openai_invalid_json",
      };
    }

    const answer =
      extractOpenAIResponseText(payload);

    if (!answer) {
      return {
        answer: null,
        provider: "openai",
        model,
        grounded: false,
        citations: [],
        warnings: ["OPENAI_EMPTY_RESPONSE"],
        error: "openai_empty_response",
      };
    }

    return {
      answer,
      provider: "openai",
      model,
      grounded: Boolean(safeContext),
      citations: [],
      warnings: [],
      rawMetadata: {
        id: payload.id || null,
      },
    };
  } catch (error) {
    return {
      answer: null,
      provider: "openai",
      model,
      grounded: false,
      citations: [],
      warnings: ["OPENAI_NETWORK_ERROR"],
      error:
        error && error.message
          ? String(error.message)
          : "openai_network_error",
    };
  }
}

async function generateOllamaAnswer({
  query,
  context,
  systemPrompt,
} = {}) {
  const model =
    process.env.GARUDA_LLM_MODEL ||
    "qwen2.5-coder:3b";

  const baseUrl =
    process.env.GARUDA_OLLAMA_URL ||
    "http://127.0.0.1:11434";

  const normalizedBaseUrl = String(baseUrl).replace(
    /\/$/,
    ""
  );

  const endpoint = `${normalizedBaseUrl}/api/generate`;
  const safeContext = normalizeContext(context);

  const promptParts = [];

  if (typeof systemPrompt === "string" && systemPrompt.trim()) {
    promptParts.push(systemPrompt.trim());
  }

  if (safeContext) {
    promptParts.push(
      `GARUDA verified context:\n${safeContext}`
    );
  }

  if (typeof query === "string" && query.trim()) {
    promptParts.push(query.trim());
  }

  const prompt = promptParts.join("\n\n");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      return {
        answer: null,
        provider: "ollama",
        model,
        grounded: false,
        citations: [],
        warnings: ["OLLAMA_API_ERROR"],
        error: `ollama_http_${res.status}`,
      };
    }

    let payload;

    try {
      payload = await res.json();
    } catch {
      return {
        answer: null,
        provider: "ollama",
        model,
        grounded: false,
        citations: [],
        warnings: ["OLLAMA_INVALID_RESPONSE"],
        error: "ollama_invalid_json",
      };
    }

    const answer = extractOllamaResponseText(payload);

    if (!answer) {
      return {
        answer: null,
        provider: "ollama",
        model,
        grounded: false,
        citations: [],
        warnings: ["OLLAMA_EMPTY_RESPONSE"],
        error: "ollama_empty_response",
      };
    }

    return {
      answer,
      provider: "ollama",
      model,
      grounded: Boolean(safeContext),
      citations: [],
      warnings: [],
      rawMetadata: {
        responseLength: answer.length,
      },
    };
  } catch (error) {
    return {
      answer: null,
      provider: "ollama",
      model,
      grounded: false,
      citations: [],
      warnings: ["OLLAMA_NETWORK_ERROR"],
      error:
        error && error.message
          ? String(error.message)
          : "ollama_network_error",
    };
  }
}

async function generateGeminiAnswer({
  query,
  context,
  systemPrompt,
} = {}) {
  const apiKey = getGeminiApiKey();

  const model =
    process.env.GARUDA_LLM_MODEL ||
    "gemini-2.5-flash";

  if (!apiKey) {
    const fallback = buildFallbackAnswer({ query, context });
    return {
      ...fallback,
      provider: "gemini",
      answer: null,
      warnings: ["LLM_PROVIDER_NOT_CONFIGURED"],
    };
  }

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    `${encodeURIComponent(model)}:generateContent`;

  const safeContext = normalizeContext(context);

  const userText = [
    safeContext
      ? `GARUDA verified context:\n${safeContext}`
      : "",
    query || "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: userText,
          },
        ],
      },
    ],
  };

  if (
    typeof systemPrompt === "string" &&
    systemPrompt.trim()
  ) {
    requestBody.systemInstruction = {
      parts: [
        {
          text: systemPrompt.trim(),
        },
      ],
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      let errorMessage =
        `gemini_http_${res.status}`;

      try {
        const errorPayload = await res.json();

        if (
          errorPayload &&
          errorPayload.error &&
          typeof errorPayload.error.message ===
            "string"
        ) {
          errorMessage +=
            `: ${errorPayload.error.message}`;
        }
      } catch {
        // Keep status-only error.
      }

      return {
        answer: null,
        provider: "gemini",
        model,
        grounded: false,
        citations: [],
        warnings: ["GEMINI_API_ERROR"],
        error: errorMessage,
      };
    }

    let payload;

    try {
      payload = await res.json();
    } catch {
      return {
        answer: null,
        provider: "gemini",
        model,
        grounded: false,
        citations: [],
        warnings: ["GEMINI_INVALID_RESPONSE"],
        error: "gemini_invalid_json",
      };
    }

    const answer =
      extractGeminiResponseText(payload);

    if (!answer) {
      const blockReason =
        payload &&
        payload.promptFeedback &&
        payload.promptFeedback.blockReason
          ? String(
              payload.promptFeedback.blockReason
            )
          : null;

      return {
        answer: null,
        provider: "gemini",
        model,
        grounded: false,
        citations: [],
        warnings: ["GEMINI_EMPTY_RESPONSE"],
        error: blockReason
          ? `gemini_empty_response:${blockReason}`
          : "gemini_empty_response",
      };
    }

    return {
      answer,
      provider: "gemini",
      model,
      grounded: Boolean(safeContext),
      citations: [],
      warnings: [],
      rawMetadata: {
        finishReason:
          payload &&
          payload.candidates &&
          payload.candidates[0]
            ? payload.candidates[0]
                .finishReason || null
            : null,
      },
    };
  } catch (error) {
    return {
      answer: null,
      provider: "gemini",
      model,
      grounded: false,
      citations: [],
      warnings: ["GEMINI_NETWORK_ERROR"],
      error:
        error && error.message
          ? String(error.message)
          : "gemini_network_error",
    };
  }
}

async function generateAnswer({
  query,
  context,
  systemPrompt,
  metadata,
} = {}) {
  const provider = getConfiguredProvider();

  if (provider === "openai") {
    return generateOpenAIAnswer({
      query,
      context,
      systemPrompt,
      metadata,
    });
  }

  if (provider === "gemini") {
    return generateGeminiAnswer({
      query,
      context,
      systemPrompt,
      metadata,
    });
  }

  if (provider === "ollama") {
    return generateOllamaAnswer({
      query,
      context,
      systemPrompt,
      metadata,
    });
  }

  return buildFallbackAnswer({
    query,
    context,
    systemPrompt,
    metadata,
  });
}

module.exports = {
  generateAnswer,
  isLLMConfigured,
  getConfiguredProvider,
};