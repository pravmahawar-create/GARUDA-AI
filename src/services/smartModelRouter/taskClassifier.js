/**
 * GARUDA Smart Model Router - Task Classifier
 *
 * Classifies incoming tasks into categories:
 * - code: writing, debugging, reviewing code
 * - reasoning: analysis, planning, decision-making
 * - general: chat, Q&A, explanation
 * - creative: writing, brainstorming
 * - system: GARUDA internal operations
 *
 * Returns recommended provider tier and model preferences.
 */

const CODE_KEYWORDS = [
  "code", "function", "class", "module", "api", "endpoint", "route",
  "debug", "error", "bug", "fix", "refactor", "implement", "write",
  "javascript", "python", "node", "react", "express", "database",
  "sql", "html", "css", "typescript", "json", "yaml", "config",
  "test", "unit test", "integration", "deploy", "build", "compile",
  "import", "export", "require", "async", "await", "promise",
  "algorithm", "data structure", "array", "object", "string",
  "frontend", "backend", "fullstack", "devops", "docker", "git",
];

const REASONING_KEYWORDS = [
  "analyze", "analyze", "plan", "strategy", "decision", "evaluate",
  "compare", "pros", "cons", "trade-off", "architect", "design",
  "why", "explain", "reason", "logic", "approach", "solution",
  "problem", "solve", "think", "consider", "assess", "review",
  "optimize", "improve", "performance", "efficiency", "scale",
];

const CREATIVE_KEYWORDS = [
  "write", "create", "draft", "compose", "story", "poem",
  "brainstorm", "idea", "concept", "name", "tagline", "slogan",
  "marketing", "content", "blog", "article", "copy", "文案",
  "design", "ui", "ux", "mockup", "wireframe", "layout",
];

const SYSTEM_KEYWORDS = [
  "garuda", "system", "health", "status", "self-heal", "self-modify",
  "self-expand", "self-aware", "capability", "universe", "checkpoint",
  "backup", "restore", "migrate", "railway", "server",
];

const SECURITY_KEYWORDS = [
  "bounty", "vulnerability", "cwe-", "cwe", "cors", "sensitive path", "security scan", "bug hunter", "penetration test", "penetration", "exploit poc", "exploit", "hackerone", "bugcrowd", "actuator/env", "actuator", "heapdump", "security audit", "vuln", "xss", "sqli", "ssrf", "idor", "rce", "lfi", "open redirect", "clickjacking", "hsts", "csp bypass", "introspection", "graphql", "swagger", ".env", ".git", "leak", "secret exposure",
];

const SECURITY_PATTERNS = [
  /\bcwe-\d+/i,
  /\bactuator\/env\b/i,
  /\bactuator\/heapdump\b/i,
  /\b\.env\b/i,
  /\b\.git\/head\b/i,
  /\bpenetration\s*test\b/i,
  /\bsecurity\s*scan\b/i,
  /\bbug\s*hunter\b/i,
  /\bbug\s*bounty\b/i,
  /\bhackerone\b/i,
  /\bbugcrowd\b/i,
  /\bintigriti\b/i,
  /\bexploit\s*poc\b/i,
];

function classifyTask(input) {
  const text = (typeof input === "string" ? input : input?.text || input?.problem || "").toLowerCase();

  // High-priority security audit bypass — checked before any other scoring
  const securityHits = SECURITY_KEYWORDS.filter(kw => text.includes(kw)).length;
  const securityPatternHit = SECURITY_PATTERNS.some(re => re.test(text));
  const isSecurityAudit = securityHits >= 1 || securityPatternHit;

  if (isSecurityAudit) {
    return {
      category: "security_audit",
      scores: { code: 0, reasoning: 0, general: 0, creative: 0, system: 0, security_audit: 10 },
      confidence: 0.98,
      needsCodeModel: false,
      needsReasoningModel: false,
      needsUncensoredSecurityEngine: true,
      bypassGemini: true,
      complexity: estimateComplexity(text),
      estimatedTokens: Math.ceil(text.length / 4) + 800,
      matchedSecurityKeywords: SECURITY_KEYWORDS.filter(kw => text.includes(kw)),
      securityPatternHit,
    };
  }

  const scores = {
    code: 0,
    reasoning: 0,
    general: 0,
    creative: 0,
    system: 0,
  };

  for (const kw of CODE_KEYWORDS) {
    if (text.includes(kw)) scores.code += 2;
  }
  for (const kw of REASONING_KEYWORDS) {
    if (text.includes(kw)) scores.reasoning += 2;
  }
  for (const kw of CREATIVE_KEYWORDS) {
    if (text.includes(kw)) scores.creative += 1.5;
  }
  for (const kw of SYSTEM_KEYWORDS) {
    if (text.includes(kw)) scores.system += 3;
  }

  if (text.includes("```") || text.includes("function ") || text.includes("class ") || text.includes("const ") || text.includes("import ")) {
    scores.code += 5;
  }
  if (text.includes("?") && (text.includes("why") || text.includes("how") || text.includes("what"))) {
    scores.reasoning += 3;
  }

  const maxCategory = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxCategory[1] / totalScore : 0;

  const needsCodeModel = scores.code >= scores.reasoning && scores.code >= scores.general;
  const needsReasoningModel = scores.reasoning > scores.code && scores.reasoning > scores.general;

  return {
    category: maxCategory[1] > 0 ? maxCategory[0] : "general",
    scores,
    confidence: Math.min(confidence, 1),
    needsCodeModel,
    needsReasoningModel,
    needsUncensoredSecurityEngine: false,
    bypassGemini: false,
    complexity: estimateComplexity(text),
    estimatedTokens: Math.ceil(text.length / 4) + 500,
  };
}

function estimateComplexity(text) {
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 20) return "trivial";
  if (wordCount < 100) return "simple";
  if (wordCount < 500) return "moderate";
  return "complex";
}

module.exports = { classifyTask, estimateComplexity };
