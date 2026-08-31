const TASK_TYPES = {
  code_generation: { requiredCapabilities: ["code"], complexity: "high" },
  code_review: { requiredCapabilities: ["review", "code"], complexity: "medium" },
  bug_fix: { requiredCapabilities: ["code", "reasoning"], complexity: "high" },
  refactoring: { requiredCapabilities: ["code", "reasoning"], complexity: "medium" },
  analysis: { requiredCapabilities: ["analysis"], complexity: "medium" },
  simple_query: { requiredCapabilities: ["simple"], complexity: "low" },
  documentation: { requiredCapabilities: ["creative"], complexity: "low" },
  testing: { requiredCapabilities: ["code"], complexity: "medium" },
  architecture: { requiredCapabilities: ["reasoning", "analysis"], complexity: "high" },
  general: { requiredCapabilities: [], complexity: "medium" }
};

function classifyTask(input) {
  const text = (input.text || input.query || "").toLowerCase();
  const explicitType = input.type;

  if (explicitType && TASK_TYPES[explicitType]) {
    return { type: explicitType, ...TASK_TYPES[explicitType], confidence: 1.0 };
  }

  const patterns = [
    { type: "code_generation", keywords: ["write", "create", "implement", "add function", "build", "generate code"] },
    { type: "code_review", keywords: ["review", "check code", "audit", "evaluate", "assess"] },
    { type: "bug_fix", keywords: ["fix", "bug", "error", "broken", "issue", "crash", "failing"] },
    { type: "refactoring", keywords: ["refactor", "reorganize", "clean up", "optimize", "improve"] },
    { type: "analysis", keywords: ["analyze", "explain", "understand", "how does", "why", "what is"] },
    { type: "testing", keywords: ["test", "spec", "assert", "coverage", "unit test"] },
    { type: "documentation", keywords: ["document", "readme", "comment", "docs", "describe"] },
    { type: "architecture", keywords: ["architecture", "design", "structure", "pattern", "system"] },
    { type: "simple_query", keywords: ["hello", "hi", "thanks", "yes", "no", "ok"] }
  ];

  let bestMatch = { type: "general", confidence: 0.3 };
  for (const pattern of patterns) {
    const matches = pattern.keywords.filter((kw) => text.includes(kw));
    const confidence = Math.min(0.95, 0.4 + matches.length * 0.2);
    if (matches.length > 0 && confidence > bestMatch.confidence) {
      bestMatch = { type: pattern.type, confidence };
    }
  }

  return { type: bestMatch.type, ...TASK_TYPES[bestMatch.type], confidence: bestMatch.confidence };
}

function estimateComplexity(input) {
  const text = (input.text || input.query || "").toLowerCase();
  let score = 50;

  if (text.length > 500) score += 15;
  if (text.length > 1000) score += 15;
  if (text.includes("multi-step") || text.includes("step by step")) score += 10;
  if (text.includes("complex") || text.includes("advanced")) score += 10;
  if (text.includes("simple") || text.includes("quick")) score -= 15;
  if (text.includes("hello") || text.includes("thanks")) score -= 30;

  const wordCount = text.split(/\s+/).length;
  if (wordCount > 50) score += 10;
  if (wordCount > 100) score += 10;

  const complexity = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return { score: Math.max(0, Math.min(100, score)), complexity };
}

module.exports = { classifyTask, estimateComplexity, TASK_TYPES };
