const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

const PARSE_OPTIONS = {
  sourceType: "unambiguous",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  errorRecovery: true,
  plugins: ["dynamicImport"]
};

const patterns = [];

function addPattern(pattern) {
  const p = {
    id: pattern.id || `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: pattern.name || "Unnamed Pattern",
    category: pattern.category || "general",
    detect: typeof pattern.detect === "function" ? pattern.detect : () => [],
    suggestion: pattern.suggestion || "",
    severity: pattern.severity || "info"
  };
  patterns.push(p);
  return p;
}

function matchPatterns(code, filePath) {
  let ast;
  try { ast = parser.parse(code, PARSE_OPTIONS); } catch { return []; }

  const matches = [];
  for (const pattern of patterns) {
    try {
      const findings = pattern.detect(ast, code, filePath);
      if (findings.length > 0) {
        matches.push({ patternId: pattern.id, patternName: pattern.name, category: pattern.category, severity: pattern.severity, suggestion: pattern.suggestion, findings });
      }
    } catch {}
  }
  return matches;
}

function detectSecurityIssues(ast, code) {
  const issues = [];
  traverse(ast, {
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee, { name: "eval" })) issues.push({ line: path.node.loc?.start.line, message: "eval() detected — security risk" });
      if (t.isIdentifier(path.node.callee, { name: "Function" })) issues.push({ line: path.node.loc?.start.line, message: "new Function() detected — security risk" });
    },
    StringLiteral(path) {
      const val = path.node.value;
      if (/password|secret|api.?key|token/i.test(val) && !val.includes("process.env")) issues.push({ line: path.node.loc?.start.line, message: `Potential hardcoded secret: "${val.substring(0, 30)}..."` });
    }
  });
  return issues;
}

function detectCodeSmells(ast, code) {
  const smells = [];
  const lines = code.split("\n");
  let maxDepth = 0;
  for (const line of lines) {
    const match = line.match(/^(\s*)/);
    if (match) {
      const depth = Math.floor(match[1].length / 2);
      if (depth > maxDepth) maxDepth = depth;
    }
  }
  if (maxDepth > 5) smells.push({ message: `Deep nesting (depth: ${maxDepth})`, suggestion: "Extract nested logic" });

  if (lines.length > 300) smells.push({ message: `Long file (${lines.length} lines)`, suggestion: "Split into modules" });

  const funcCount = (code.match(/function\s+\w+/g) || []).length;
  if (funcCount > 20) smells.push({ message: `Too many functions (${funcCount})`, suggestion: "Split into modules" });

  return smells;
}

function detectPatterns(ast, code) {
  const detected = [];
  if (code.includes("module.exports")) detected.push("CommonJS");
  if (code.match(/^import\s+.*from\s+/m)) detected.push("ESM");
  if (code.includes("async ")) detected.push("async/await");
  if (code.includes(".then(")) detected.push("promises");
  if (code.includes("try {")) detected.push("error-handling");
  if (code.includes("describe(") || code.includes("test(")) detected.push("testing");
  return detected;
}

module.exports = { addPattern, matchPatterns, detectSecurityIssues, detectCodeSmells, detectPatterns };
