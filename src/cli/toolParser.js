/**
 * 🦅 GARUDA CLI — MULTI-ACTION TOOL PARSER
 * 
 * Robustly parses single or multiple <action name="...">...</action> tags
 * from model outputs while preserving execution order, handling multiline JSON,
 * isolating malformed blocks, and enforcing safety limits.
 */

const MAX_ACTIONS_DEFAULT = 5;

/**
 * Resilient JSON parsing for action arguments.
 */
function parseToolParams(raw) {
  if (!raw || typeof raw !== "string") return {};
  const cleaned = raw.trim();
  if (!cleaned) return {};

  // 1. Strict parse
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // 2. Escape literal newlines/tabs inside quotes if present
    try {
      let inString = false;
      let escaped = false;
      let sanitized = "";
      for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (ch === '"' && !escaped) {
          inString = !inString;
          sanitized += ch;
        } else if (inString) {
          if (ch === '\n') {
            sanitized += '\\n';
          } else if (ch === '\r') {
            sanitized += '\\r';
          } else if (ch === '\t') {
            sanitized += '\\t';
          } else {
            sanitized += ch;
          }
          escaped = (ch === '\\' && !escaped);
        } else {
          sanitized += ch;
          escaped = false;
        }
      }
      return JSON.parse(sanitized);
    } catch (err2) {
      // 3. Fix unquoted keys, trailing commas, single quotes
      try {
        const fixed = cleaned
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"')
          .replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(fixed);
      } catch (err3) {
        return { raw: cleaned, _parseError: true };
      }
    }
  }
}

/**
 * Extracts thoughts from model output (<thought>...</thought>).
 */
function parseThoughts(text) {
  if (!text || typeof text !== "string") return [];
  const thoughts = [];
  const regex = /<thought>([\s\S]*?)<\/thought>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const content = match[1].trim();
    if (content) thoughts.push(content);
  }
  return thoughts;
}

/**
 * Parses all tool action blocks in order.
 * Returns array of { name, params, raw, isMalformed } objects.
 */
function parseActions(text, maxActions = MAX_ACTIONS_DEFAULT) {
  if (!text || typeof text !== "string") return [];

  const actions = [];
  const actionRegex = /<action\s+name=["']([^"']+)["']>([\s\S]*?)<\/action>/gi;
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    if (actions.length >= maxActions) break;

    const toolName = match[1].trim();
    const rawParams = match[2].trim();
    const params = parseToolParams(rawParams);
    const isMalformed = Boolean(params._parseError);

    actions.push({
      name: toolName,
      params,
      raw: rawParams,
      isMalformed
    });
  }

  return actions;
}

/**
 * Cleans user-facing text by stripping thoughts, actions, and special tags.
 */
function sanitizeOutput(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/<action\s+name=["'][^"']+["']>[\s\S]*?<\/action>/gi, "")
    .replace(/<analysis[\s\S]*?<\/analysis>/gi, "")
    .replace(/<\|.*?\|>/g, "")
    .replace(/^[\s\S]*?Awaiting\s+[a-z_]+\s+observation\.\.\./gi, "")
    .trim();
}

module.exports = {
  parseActions,
  parseThoughts,
  parseToolParams,
  sanitizeOutput,
  MAX_ACTIONS_DEFAULT
};
