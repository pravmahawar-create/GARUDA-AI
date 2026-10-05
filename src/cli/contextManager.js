/**
 * 🦅 GARUDA CLI — CONTEXT WINDOW MANAGER
 * 
 * Provides intelligent conversation history compaction, token-aware bounds,
 * sliding-window retention of recent context, and forensic preservation of
 * critical facts (exit codes, hashes, files, errors, security decisions).
 */

const DEFAULT_CONFIG = {
  maxContextChars: 35000,
  maxMessages: 24,
  recentKeepCount: 8,
  maxToolOutputChars: 3500
};

/**
 * Truncates oversized tool outputs while preserving crucial head/tail context
 * and forensic evidence (Exit codes, SHA-256, file paths, errors).
 */
function truncateToolOutput(output, maxChars = DEFAULT_CONFIG.maxToolOutputChars) {
  if (!output || typeof output !== "string") return String(output || "");
  if (output.length <= maxChars) return output;

  const headLength = Math.floor(maxChars * 0.4);
  const tailLength = Math.floor(maxChars * 0.5);

  const head = output.slice(0, headLength);
  const tail = output.slice(-tailLength);
  const omittedCount = output.length - (headLength + tailLength);

  // Extract forensic metadata from omitted section if present
  const middle = output.slice(headLength, -tailLength);
  const extraEvidence = [];

  const explicitHash = middle.match(/(?:sha-?256|sha|commit|hash):\s*([a-f0-9]{40,64})/i);
  if (explicitHash) {
    extraEvidence.push(`Hash Evidence: ${explicitHash[1]}`);
  } else {
    const wordHex = middle.match(/\b[a-f0-9]{40,64}\b/i);
    if (wordHex) {
      extraEvidence.push(`Hash Evidence: ${wordHex[0]}`);
    }
  }
  const exitMatch = middle.match(/exit code[:\s]+(\d+)/i);
  if (exitMatch) {
    extraEvidence.push(`Exit Code: ${exitMatch[1]}`);
  }
  const fileMatches = middle.match(/(?:File|Target):\s+([a-zA-Z0-9_\-\.\/\\]+)/gi);
  if (fileMatches) {
    extraEvidence.push(...fileMatches.slice(0, 3));
  }

  const evidenceSnippet = extraEvidence.length > 0 ? `\n[Preserved Evidence: ${extraEvidence.join(" | ")}]` : "";

  return `${head}\n\n... [${omittedCount} characters truncated for context hygiene] ...${evidenceSnippet}\n\n${tail}`;
}

/**
 * Estimates token count based on standard ~4 chars per token rule.
 */
function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Summarizes older conversation turns to compact history without losing task state.
 */
function summarizeOlderTurns(messages) {
  const tasks = [];
  const filesModified = [];
  const toolsInvoked = [];
  const errors = [];
  const securityBlocks = [];

  for (const m of messages) {
    const text = m.content || "";
    if (m.role === "user" && !text.startsWith("<observation") && !text.startsWith("[SUMMARY")) {
      tasks.push(text.slice(0, 80));
    }
    if (text.includes("SHA-256") || text.includes("File written") || text.includes("File edited")) {
      const match = text.match(/(?:File written successfully|File edited successfully):\s*([^\n]+)/);
      if (match) filesModified.push(match[1].trim());
    }
    const toolMatch = text.match(/<action\s+name=["']([^"']+)["']/gi);
    if (toolMatch) {
      for (const tm of toolMatch) {
        const name = tm.replace(/<action\s+name=["']/i, "").replace(/["']/, "");
        if (!toolsInvoked.includes(name)) toolsInvoked.push(name);
      }
    }
    if (text.includes("Command failed") || text.includes("Error:")) {
      errors.push(text.slice(0, 80));
    }
    if (text.includes("🛡️ GARUDA SECURITY BLOCK") || text.includes("GARUDA SOVEREIGN GATEKEEPER")) {
      securityBlocks.push(text.slice(0, 80));
    }
  }

  const lines = [
    `[HISTORICAL CONTEXT SUMMARY (Compacted for token efficiency)]`,
    tasks.length ? `• User Directives: ${tasks.slice(-3).join(" | ")}` : null,
    toolsInvoked.length ? `• Tools Executed: ${toolsInvoked.join(", ")}` : null,
    filesModified.length ? `• Files Modified: ${[...new Set(filesModified)].join(", ")}` : null,
    errors.length ? `• Past Errors Addressed: ${errors.slice(-2).join(" | ")}` : null,
    securityBlocks.length ? `• Security Decisions: ${securityBlocks.slice(-2).join(" | ")}` : null
  ].filter(Boolean);

  return lines.join("\n");
}

class ContextManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.history = [];
  }

  addMessage(role, content) {
    let sanitizedContent = content;
    if (role === "user" && content.startsWith("<observation")) {
      sanitizedContent = truncateToolOutput(content, this.config.maxToolOutputChars);
    }
    this.history.push({ role, content: sanitizedContent, timestamp: new Date().toISOString() });
    this.compactIfNeeded();
  }

  getMessages() {
    return this.history.map(({ role, content }) => ({ role, content }));
  }

  getTotalChars() {
    return this.history.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  }

  compactIfNeeded() {
    const totalChars = this.getTotalChars();
    const totalMsgs = this.history.length;

    if (totalChars <= this.config.maxContextChars && totalMsgs <= this.config.maxMessages) {
      return false; // No compaction needed
    }

    if (totalMsgs <= this.config.recentKeepCount) {
      return false; // Cannot compact if message count is already within keep window
    }

    // Split history into older turns and recent turns
    const splitIndex = this.history.length - this.config.recentKeepCount;
    const older = this.history.slice(0, splitIndex);
    const recent = this.history.slice(splitIndex);

    const summaryText = summarizeOlderTurns(older);
    const summaryMessage = {
      role: "user",
      content: summaryText,
      timestamp: new Date().toISOString(),
      isSummary: true
    };

    this.history = [summaryMessage, ...recent];
    return true;
  }

  clear() {
    this.history = [];
  }
}

module.exports = {
  ContextManager,
  truncateToolOutput,
  estimateTokens,
  summarizeOlderTurns,
  DEFAULT_CONFIG
};
