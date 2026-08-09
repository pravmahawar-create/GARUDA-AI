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
 * - nvidia
 * - openai
 * - gemini
 * - ollama
 */

const DEFAULT_PROVIDER = "fallback";

function getConfiguredProvider() {
  const explicit = (process.env.GARUDA_LLM_PROVIDER || "")
    .trim()
    .toLowerCase();

  if (explicit && explicit !== "fallback") {
    return explicit;
  }

  if (getNvidiaApiKey()) {
    return "nvidia";
  }

  if (getGeminiApiKey()) {
    return "gemini";
  }

  if (getOpenAIApiKey()) {
    return "openai";
  }

  return DEFAULT_PROVIDER;
}

function getLLMApiKey() {
  return process.env.GARUDA_LLM_API_KEY || null;
}

function getNvidiaApiKey() {
  return (
    process.env.NVIDIA_API_KEY ||
    process.env.GARUDA_NVIDIA_API_KEY ||
    null
  );
}

function getNvidiaModel() {
  return (
    process.env.NVIDIA_MODEL ||
    process.env.GARUDA_NVIDIA_MODEL ||
    "nvidia/llama-3.3-nemotron-super-49b-v1"
  );
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

  if (provider === "nvidia") {
    return Boolean(getNvidiaApiKey());
  }

  if (provider === "ollama") {
    return true;
  }

  return false;
}

function buildFallbackAnswer({ query, context, metadata = {} } = {}) {
  const safeQuery = typeof query === "string" ? query.trim() : "";
  const chunks = Array.isArray(context) ? context : [];

  // Extract pure knowledge text entries (exclude raw JSON context blocks)
  const knowledgeTexts = chunks
    .map((chunk) => {
      let t = "";
      if (chunk && typeof chunk === "object" && typeof chunk.text === "string") {
        t = chunk.text;
      } else {
        t = String(chunk || "");
      }
      if (t.startsWith("Current GARUDA runtime") || t.startsWith("Currently registered GARUDA") || t.startsWith("Recent conversation history")) {
        return null;
      }
      return t.replace(/^\[GARUDA_SYSTEM_KNOWLEDGE \d+\] Source: [^\n]+\n?/, "").trim();
    })
    .filter(Boolean);

  const citations = chunks
    .filter((c) => c && typeof c === "object" && c.sourceFile)
    .slice(0, 5)
    .map((chunk, index) => ({
      id: index + 1,
      sourceFile: chunk.sourceFile || "GARUDA System Knowledge",
      page: chunk.page || null,
      category: chunk.category || "GARUDA_SYSTEM",
      score: typeof chunk.score === "number" ? chunk.score : null,
    }));

  // If retrieved knowledge text is available, synthesize it
  if (knowledgeTexts.length > 0) {
    const contextBody = knowledgeTexts.slice(0, 3).join("\n\n");
    return {
      answer: contextBody,
      provider: "fallback",
      model: "none",
      grounded: true,
      citations,
      warnings: ["LLM_PROVIDER_NOT_CONFIGURED"],
    };
  }

  // If query is empty/whitespace, return a minimal prompt
  if (!safeQuery) {
    return {
      answer: "Please type something so I can help.",
      provider: "fallback",
      model: "none",
      grounded: false,
      citations: [],
      warnings: ["LLM_PROVIDER_NOT_CONFIGURED"],
    };
  }

  // All other non-empty inputs: LLM is unavailable
  return {
    answer: "I'm here — but the AI engine isn't responding right now. Please try again in a moment.",
    provider: "fallback",
    model: "none",
    grounded: false,
    citations: [],
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

function logOllamaDiagnostic(event, details = {}) {
  console.error("[GARUDA_OLLAMA_DIAGNOSTIC]", {
    event,
    ...details,
  });
}

function logRouterEvent(event, details = {}) {
  console.log("[GARUDA_LLM_ROUTER]", {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

function isUsableAnswer(result) {
  return Boolean(
    result &&
      typeof result.answer === "string" &&
      result.answer.trim() &&
      !result.error
  );
}function getSafeOllamaErrorDetails(error) {
  const cause = error && error.cause && typeof error.cause === "object"
    ? error.cause
    : null;

  return {
    errorName: error && error.name ? String(error.name) : "UnknownError",
    errorMessage: error && error.message
      ? String(error.message).slice(0, 300)
      : "ollama_network_error",
    causeName: cause && cause.name ? String(cause.name) : null,
    causeCode: cause && cause.code ? String(cause.code) : null,
    causeMessage: cause && cause.message
      ? String(cause.message).slice(0, 300)
      : null,
    causeErrno: cause && cause.errno ? String(cause.errno) : null,
    causeSyscall: cause && cause.syscall ? String(cause.syscall) : null,
    causeHostname: cause && cause.hostname ? String(cause.hostname) : null,
  };
}

async function generateOpenAIAnswer({
  query,
  context,
  systemPrompt,
} = {}) {
  const apiKey = getOpenAIApiKey();

  const model =
    process.env.GARUDA_OPENAI_MODEL ||
    process.env.OPENAI_MODEL ||
    process.env.GARUDA_LLM_MODEL ||
    "gpt-4o-mini";

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
  conversationHistory,
  metadata = {},
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

  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const formattedHistory = conversationHistory
      .slice(-6)
      .map((msg) => {
        const roleStr = (msg.role === "user") ? "User" : "GARUDA";
        const contentStr = msg.content || msg.text || msg.message || "";
        return `${roleStr}: ${contentStr}`;
      })
      .filter((s) => s.trim())
      .join("\n");

    if (formattedHistory) {
      promptParts.push(`Recent Conversation Context:\n${formattedHistory}`);
    }
  }

  if (typeof query === "string" && query.trim()) {
    promptParts.push(`User Question: ${query.trim()}`);
  }

  const prompt = promptParts.join("\n\n");

  try {
    const nodeKey = process.env.GARUDA_NODE_KEY || null;
    const requestHeaders = {
      "Content-Type": "application/json",
    };
    if (nodeKey) {
      requestHeaders["X-GARUDA-NODE-KEY"] = nodeKey;
    }

    const isFastLane = metadata && metadata.fastLane === true;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { num_predict: isFastLane ? 200 : 250 }
      }),
    });

    if (!res.ok) {
      logOllamaDiagnostic("http_error", {
        status: res.status,
        authenticationRejected: res.status === 401 || res.status === 403,
        nodeKeyConfigured: Boolean(nodeKey),
      });
      const fallback = buildFallbackAnswer({ query, context });
      return {
        ...fallback,
        provider: "ollama",
        model,
        warnings: ["OLLAMA_API_ERROR", "GENERATIVE_ENGINE_UNAVAILABLE"],
        error: `ollama_http_${res.status}`,
      };
    }

    let payload;

    try {
      payload = await res.json();
    } catch (error) {
      logOllamaDiagnostic("json_parse_failure", {
        status: res.status,
        errorName: error && error.name ? String(error.name) : "UnknownError",
        errorMessage: error && error.message ? String(error.message).slice(0, 300) : "ollama_invalid_json",
      });
      const fallback = buildFallbackAnswer({ query, context });
      return {
        ...fallback,
        provider: "ollama",
        model,
        warnings: ["OLLAMA_INVALID_RESPONSE", "GENERATIVE_ENGINE_UNAVAILABLE"],
        error: "ollama_invalid_json",
      };
    }

    const answer = extractOllamaResponseText(payload);

    if (!answer) {
      const responseIsString = payload && typeof payload.response === "string";
      logOllamaDiagnostic(
        responseIsString ? "empty_model_response" : "malformed_response",
        {
          payloadType: payload === null ? "null" : typeof payload,
          responseFieldType: payload && Object.prototype.hasOwnProperty.call(payload, "response")
            ? typeof payload.response
            : "missing",
        }
      );
      const fallback = buildFallbackAnswer({ query, context });
      return {
        ...fallback,
        provider: "ollama",
        model,
        warnings: ["OLLAMA_EMPTY_RESPONSE", "GENERATIVE_ENGINE_UNAVAILABLE"],
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
    const errorDetails = getSafeOllamaErrorDetails(error);
    const errorCategory =
      errorDetails.errorName === "AbortError" ||
      /timeout|timed out/i.test(errorDetails.errorMessage) ||
      /timeout|timed out/i.test(errorDetails.causeMessage || "")
        ? "timeout_or_connectivity_failure"
        : "network_or_fetch_failure";
    logOllamaDiagnostic(errorCategory, {
      ...errorDetails,
      nodeKeyConfigured: Boolean(process.env.GARUDA_NODE_KEY),
    });
    const fallback = buildFallbackAnswer({ query, context });
    return {
      ...fallback,
      provider: "ollama",
      model,
      warnings: ["OLLAMA_NETWORK_ERROR", "GENERATIVE_ENGINE_UNAVAILABLE"],
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

  const configuredModel =
    process.env.GARUDA_GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
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

  const candidateModels = [
    configuredModel,
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ].filter(Boolean);

  let lastResult = null;

  for (const model of candidateModels) {
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${encodeURIComponent(model)}:generateContent`;

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
        let errorMessage = `gemini_http_${res.status}`;

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

        lastResult = {
          answer: null,
          provider: "gemini",
          model,
          grounded: false,
          citations: [],
          warnings: ["GEMINI_API_ERROR"],
          error: errorMessage,
        };

        // Model availability errors (404/NOT_FOUND, 400 for retired
        // models) are retryable against a newer candidate model.
        if (res.status === 404 || res.status === 400 || res.status === 429) {
          continue;
        }

        return lastResult;
      }

      let payload;

      try {
        payload = await res.json();
      } catch {
        lastResult = {
          answer: null,
          provider: "gemini",
          model,
          grounded: false,
          citations: [],
          warnings: ["GEMINI_INVALID_RESPONSE"],
          error: "gemini_invalid_json",
        };
        continue;
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

        lastResult = {
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
        continue;
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
      lastResult = {
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

  return (
    lastResult || {
      answer: null,
      provider: "gemini",
      model: configuredModel,
      grounded: false,
      citations: [],
      warnings: ["GEMINI_EMPTY_RESPONSE"],
      error: "gemini_empty_response",
    }
  );
}

async function generateNvidiaAnswer({
  query,
  context,
  systemPrompt,
  conversationHistory,
  metadata = {},
} = {}) {
  const apiKey = getNvidiaApiKey();

  const model = getNvidiaModel();

  if (!apiKey) {
    const fallback = buildFallbackAnswer({ query, context });
    return {
      ...fallback,
      provider: "nvidia",
      answer: null,
      warnings: ["LLM_PROVIDER_NOT_CONFIGURED"],
    };
  }

  const messages = [];

  if (
    typeof systemPrompt === "string" &&
    systemPrompt.trim()
  ) {
    messages.push({
      role: "system",
      content: systemPrompt.trim(),
    });
  }

  if (
    Array.isArray(conversationHistory) &&
    conversationHistory.length
  ) {
    for (const item of conversationHistory.slice(-12)) {
      const role =
        item && item.role === "user" ? "user" : "assistant";

      const content = item
        ? item.content ||
          item.text ||
          item.message ||
          ""
        : "";

      if (content && String(content).trim()) {
        messages.push({
          role,
          content: String(content).trim().slice(0, 4000),
        });
      }
    }
  }

  // Multi-turn history is carried in role-based messages above, so drop the
  // "Recent conversation history" context block to avoid duplication.
  const contextItems = Array.isArray(context) ? context : [];

  const nonHistoryContext = contextItems.filter((item) => {
    const text =
      typeof item === "string"
        ? item
        : item &&
            typeof item === "object" &&
            typeof item.text === "string"
          ? item.text
          : "";

    return !text.startsWith("Recent conversation history");
  });

  const nonHistoryText = normalizeContext(nonHistoryContext);

  const userText = [
    nonHistoryText
      ? `GARUDA verified context:\n${nonHistoryText}`
      : "",
    typeof query === "string" ? query.trim() : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  if (userText) {
    messages.push({ role: "user", content: userText });
  }

  const isFastLane = metadata && metadata.fastLane === true;

  logRouterEvent("nvidia_messages_debug", {
    model,
    messageCount: messages.length,
    roles: messages.map((m) => m.role),
    lastRole: messages.length
      ? messages[messages.length - 1].role
      : null,
    systemPromptOnce: messages.filter((m) => m.role === "system").length === 1,
    historyCount: Array.isArray(conversationHistory)
      ? conversationHistory.length
      : 0,
    contextChars: userText.length,
  });

  const endpoint =
    "https://integrate.api.nvidia.com/v1/chat/completions";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: isFastLane ? 800 : 1000,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      return {
        answer: null,
        provider: "nvidia",
        model,
        grounded: false,
        citations: [],
        warnings: ["NVIDIA_API_ERROR"],
        error: `nvidia_http_${res.status}`,
      };
    }

    let payload;

    try {
      payload = await res.json();
    } catch {
      return {
        answer: null,
        provider: "nvidia",
        model,
        grounded: false,
        citations: [],
        warnings: ["NVIDIA_INVALID_RESPONSE"],
        error: "nvidia_invalid_json",
      };
    }

    const answer =
      payload &&
      payload.choices &&
      payload.choices[0] &&
      payload.choices[0].message &&
      typeof payload.choices[0].message.content === "string"
        ? payload.choices[0].message.content.trim()
        : null;

    if (!answer) {
      return {
        answer: null,
        provider: "nvidia",
        model,
        grounded: false,
        citations: [],
        warnings: ["NVIDIA_EMPTY_RESPONSE"],
        error: "nvidia_empty_response",
      };
    }

    return {
      answer,
      provider: "nvidia",
      model,
      grounded: Boolean(nonHistoryText),
      citations: [],
      warnings: [],
      rawMetadata: {
        id: payload.id || null,
        finishReason:
          payload.choices && payload.choices[0]
            ? payload.choices[0].finish_reason || null
            : null,
      },
    };
  } catch (error) {
    return {
      answer: null,
      provider: "nvidia",
      model,
      grounded: false,
      citations: [],
      warnings: ["NVIDIA_NETWORK_ERROR"],
      error:
        error && error.message
          ? String(error.message)
          : "nvidia_network_error",
    };
  }
}

async function generateAnswer({
  query,
  context,
  systemPrompt,
  conversationHistory,
  metadata,
} = {}) {
  const provider = getConfiguredProvider();

  const adapterArgs = {
    query,
    context,
    systemPrompt,
    conversationHistory,
    metadata,
  };

  logRouterEvent("provider_selected", {
    provider,
    model: provider === "nvidia"
      ? getNvidiaModel()
      : (process.env.GARUDA_LLM_MODEL || null),
    hasGeminiKey: Boolean(getGeminiApiKey()),
    hasOpenAIKey: Boolean(getOpenAIApiKey()),
    hasNvidiaKey: Boolean(getNvidiaApiKey()),
    capability: metadata && metadata.capability ? metadata.capability : null,
  });

  let result;

  if (provider === "openai") {
    result = await generateOpenAIAnswer(adapterArgs);
  } else if (provider === "gemini") {
    result = await generateGeminiAnswer(adapterArgs);
  } else if (provider === "nvidia") {
    result = await generateNvidiaAnswer(adapterArgs);
  } else if (provider === "ollama") {
    result = await generateOllamaAnswer(adapterArgs);
  } else {
    logRouterEvent("fallback_used", { reason: "no_provider_configured" });
    const fallback = buildFallbackAnswer(adapterArgs);
    return {
      ...fallback,
      answer: fallback.answer && /isn't responding|not responding/i.test(fallback.answer)
        ? null
        : fallback.answer,
    };
  }

  // Graceful fallback chain: if the primary provider did not produce a
  // usable answer, automatically retry with a configured cloud provider.
  if (!isUsableAnswer(result)) {
    logRouterEvent("primary_failed", {
      provider,
      model: result && result.model ? result.model : null,
      warnings: result && Array.isArray(result.warnings) ? result.warnings : [],
      error: result && result.error ? result.error : null,
    });

    if (getNvidiaApiKey() && provider !== "nvidia") {
      logRouterEvent("fallback_attempt", { from: provider, to: "nvidia" });
      const nvidiaResult = await generateNvidiaAnswer(adapterArgs);
      if (isUsableAnswer(nvidiaResult)) {
        logRouterEvent("fallback_success", {
          from: provider,
          to: "nvidia",
          model: nvidiaResult.model,
        });
        return {
          ...nvidiaResult,
          fallbackFrom: provider,
        };
      }
      logRouterEvent("fallback_failed", {
        from: provider,
        to: "nvidia",
        error: nvidiaResult && nvidiaResult.error ? nvidiaResult.error : null,
      });
    }

    if (getGeminiApiKey() && provider !== "gemini") {
      logRouterEvent("fallback_attempt", { from: provider, to: "gemini" });
      const geminiResult = await generateGeminiAnswer(adapterArgs);
      if (isUsableAnswer(geminiResult)) {
        logRouterEvent("fallback_success", {
          from: provider,
          to: "gemini",
          model: geminiResult.model,
        });
        return {
          ...geminiResult,
          fallbackFrom: provider,
        };
      }
      logRouterEvent("fallback_failed", {
        from: provider,
        to: "gemini",
        error: geminiResult && geminiResult.error ? geminiResult.error : null,
      });
    }

    if (getOpenAIApiKey() && provider !== "openai") {
      logRouterEvent("fallback_attempt", { from: provider, to: "openai" });
      const openaiResult = await generateOpenAIAnswer(adapterArgs);
      if (isUsableAnswer(openaiResult)) {
        logRouterEvent("fallback_success", {
          from: provider,
          to: "openai",
          model: openaiResult.model,
        });
        return {
          ...openaiResult,
          fallbackFrom: provider,
        };
      }
      logRouterEvent("fallback_failed", {
        from: provider,
        to: "openai",
        error: openaiResult && openaiResult.error ? openaiResult.error : null,
      });
    }

    logRouterEvent("all_providers_failed", {
      primaryProvider: provider,
      lastWarnings: result && Array.isArray(result.warnings) ? result.warnings : [],
      lastError: result && result.error ? result.error : null,
    });

    // Never surface the dead-end message to the founder console.
    const safeFallback = buildFallbackAnswer(adapterArgs);
    return {
      ...safeFallback,
      answer: null,
      provider: result && result.provider ? result.provider : provider,
      warnings: ["GENERATIVE_ENGINE_UNAVAILABLE", "ALL_PROVIDERS_FAILED"],
      error: result && result.error ? result.error : "all_providers_failed",
    };
  }

  return result || buildFallbackAnswer(adapterArgs);
}

module.exports = {
  generateAnswer,
  isLLMConfigured,
  getConfiguredProvider,
};
