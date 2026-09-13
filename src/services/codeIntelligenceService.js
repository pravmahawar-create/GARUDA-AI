/**
 * GARUDA Code Intelligence Service
 *
 * Phase 4: Code samajhta hai, likhta hai, debug karta hai, review karta hai.
 *
 * Capabilities:
 * - Code Explanation: Code ka matlab samjhao
 * - Code Generation: Naya code likho
 * - Code Review: Code mein bugs dhundho
 * - Code Debug: Error fix karo
 * - Refactor: Code ko better banao
 * - Test Generation: Tests likho
 */

const brain = require("./garudaBrain");

// ──────────────────────────────────────────────────────────────────────────────
// 1. EXPLAIN CODE — Code samjhao
// ──────────────────────────────────────────────────────────────────────────────

async function explainCode(code, { language, level = "intermediate" } = {}) {
  const systemPrompt = `You are GARUDA's code expert. Explain this code clearly at ${level} level.
${language ? `Language: ${language}` : ""}

Explain:
1. What this code does (one line summary)
2. Line-by-line breakdown of key parts
3. Input/output flow
4. Any patterns or conventions used

Be concise but thorough. Use examples if helpful.`;

  const result = await brain.think(code, { systemPrompt, temperature: 0.3 });
  return { explanation: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. GENERATE CODE — Naya code likho
// ──────────────────────────────────────────────────────────────────────────────

async function generateCode({ description, language, framework, style }) {
  const systemPrompt = `You are GARUDA's code generator. Write clean, production-ready code.

Language: ${language || "JavaScript"}
Framework: ${framework || "Node.js"}
Style: ${style || "modern, functional"}

Rules:
- Write complete, runnable code
- Include error handling
- Follow best practices
- No placeholder comments
- Use meaningful variable names`;

  const result = await brain.think(description, { systemPrompt, temperature: 0.4 });
  return { code: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. REVIEW CODE — Code review karo
// ──────────────────────────────────────────────────────────────────────────────

async function reviewCode(code, { language, focus } = {}) {
  const systemPrompt = `You are GARUDA's code reviewer. Review this code thoroughly.

${language ? `Language: ${language}` : ""}
Focus: ${focus || "bugs, performance, security, readability"}

Return JSON:
{
  "score": 0-100,
  "issues": [
    { "severity": "critical/warning/info", "line": "approximate", "message": "what's wrong", "fix": "how to fix" }
  ],
  "strengths": ["what's good about this code"],
  "suggestions": ["improvement ideas"],
  "summary": "overall assessment"
}`;

  const result = await brain.think(code, { systemPrompt, temperature: 0.2 });
  try {
    return { review: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { review: { summary: result.content, score: 50 }, provider: result.provider };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. DEBUG CODE — Error fix karo
// ──────────────────────────────────────────────────────────────────────────────

async function debugCode(code, error, { language, context } = {}) {
  const systemPrompt = `You are GARUDA's debugger. Find the root cause and provide a fix.

${language ? `Language: ${language}` : ""}
${context ? `Context: ${context}` : ""}

Return JSON:
{
  "rootCause": "what's actually wrong",
  "line": "where the bug is",
  "fix": "exact code to fix it",
  "explanation": "why this fixes it",
  "prevention": "how to prevent this in future",
  "relatedIssues": ["other potential problems in this code"]
}`;

  const prompt = `CODE:\n\`\`\`\n${code}\n\`\`\`\n\nERROR:\n${error}`;
  const result = await brain.think(prompt, { systemPrompt, temperature: 0.2 });
  try {
    return { debug: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { debug: { rootCause: result.content, fix: "See explanation" }, provider: result.provider };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. REFACTOR CODE — Code ko better banao
// ──────────────────────────────────────────────────────────────────────────────

async function refactorCode(code, { language, goals } = {}) {
  const systemPrompt = `You are GARUDA's refactor expert. Improve this code.

${language ? `Language: ${language}` : ""}
Goals: ${goals || "readability, performance, maintainability"}

Return JSON:
{
  "refactoredCode": "the improved code",
  "changes": ["list of changes made"],
  "improvements": "what got better",
  "tradeoffs": "any downsides"
}`;

  const result = await brain.think(code, { systemPrompt, temperature: 0.3 });
  try {
    return { refactor: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { refactor: { refactoredCode: result.content }, provider: result.provider };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. GENERATE TESTS — Tests likho
// ──────────────────────────────────────────────────────────────────────────────

async function generateTests(code, { language, framework, coverage } = {}) {
  const systemPrompt = `You are GARUDA's test generator. Write comprehensive tests for this code.

Language: ${language || "JavaScript"}
Framework: ${framework || "Jest"}
Coverage: ${coverage || "unit tests for all public functions"}

Rules:
- Test happy paths AND edge cases
- Include error scenarios
- Use descriptive test names
- Mock external dependencies
- Aim for high coverage`;

  const result = await brain.think(code, { systemPrompt, temperature: 0.3 });
  return { tests: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. CONVERT CODE — Language/framework convert
// ──────────────────────────────────────────────────────────────────────────────

async function convertCode(code, { fromLanguage, toLanguage, toFramework } = {}) {
  const systemPrompt = `You are GARUDA's code converter. Convert this code.

From: ${fromLanguage || "auto-detect"}
To: ${toLanguage || "JavaScript"}${toFramework ? ` with ${toFramework}` : ""}

Rules:
- Maintain same functionality
- Use idiomatic patterns in target language
- Include necessary imports/dependencies
- Keep the same logic flow`;

  const result = await brain.think(code, { systemPrompt, temperature: 0.3 });
  return { convertedCode: result.content, provider: result.provider };
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. ANALYZE COMPLEXITY — Code complexity check
// ──────────────────────────────────────────────────────────────────────────────

async function analyzeComplexity(code, { language } = {}) {
  const systemPrompt = `You are GARUDA's complexity analyzer. Analyze this code's complexity.

Return JSON:
{
  "cyclomaticComplexity": "low/medium/high/very-high",
  "readabilityScore": 0-100,
  "maintainabilityScore": 0-100,
  "linesOfCode": "approximate",
  "suggestedImprovements": ["list of improvements"],
  "overallAssessment": "one paragraph summary"
}`;

  const result = await brain.think(code, { systemPrompt, temperature: 0.2 });
  try {
    return { analysis: JSON.parse(result.content), provider: result.provider };
  } catch {
    return { analysis: { summary: result.content }, provider: result.provider };
  }
}

module.exports = {
  explainCode,
  generateCode,
  reviewCode,
  debugCode,
  refactorCode,
  generateTests,
  convertCode,
  analyzeComplexity
};
