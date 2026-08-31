function buildReviewPrompt(code, filePath, conventions = {}) {
  const conventionText = conventions.patterns && conventions.patterns.length > 0
    ? `\nRepository conventions:\n${conventions.patterns.map((p) => `- ${p}`).join("\n")}`
    : "";

  return `You are a senior code reviewer for the GARUDA AI project. Review the following code change and provide a structured assessment.

File: ${filePath}
${conventionText}

Code to review:
\`\`\`javascript
${code}
\`\`\`

Provide your review in this exact JSON format:
{
  "verdict": "APPROVE" | "REQUEST_CHANGES" | "REJECT",
  "score": <number 0-100>,
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "line": <line number or null>,
      "message": "description of issue",
      "suggestion": "how to fix"
    }
  ],
  "strengths": ["positive aspect 1", "positive aspect 2"],
  "summary": "one paragraph overall assessment"
}

Review criteria:
1. Correctness - Does the code do what it claims?
2. Security - Any vulnerabilities (injection, secrets, path traversal)?
3. Performance - Any obvious bottlenecks?
4. Maintainability - Is it readable and well-structured?
5. GARUDA conventions - Does it follow the patterns above?

Respond ONLY with the JSON object. No other text.`;
}

function buildStructuralReview(code, filePath) {
  const issues = [];
  let score = 100;

  if (code.includes("eval(") || code.includes("new Function(")) {
    issues.push({ severity: "critical", line: null, message: "Dynamic code execution detected (eval/Function)", suggestion: "Remove eval and use safer alternatives" });
    score -= 70;
  }

  if (code.includes("process.env") && (code.includes("SECRET") || code.includes("PASSWORD") || code.includes("API_KEY"))) {
    issues.push({ severity: "critical", line: null, message: "Potential secret in code", suggestion: "Use environment variables, never hardcode secrets" });
    score -= 70;
  }

  if (code.includes("try") && !code.includes("catch")) {
    issues.push({ severity: "warning", line: null, message: "try without catch block", suggestion: "Add catch block or use try/catch/finally" });
    score -= 5;
  }

  const lines = code.split("\n");
  if (lines.length > 300) {
    issues.push({ severity: "warning", line: null, message: `File is very long (${lines.length} lines)`, suggestion: "Consider splitting into smaller modules" });
    score -= 10;
  }

  if (code.includes("require(")) {
    const requires = code.match(/require\(["']([^"']+)["']\)/g) || [];
    if (requires.length > 15) {
      issues.push({ severity: "warning", line: null, message: `Too many require statements (${requires.length})`, suggestion: "Consider grouping related imports or splitting module" });
      score -= 5;
    }
  }

  if (code.includes("console.log") && !filePath.includes(".test.")) {
    const logCount = (code.match(/console\.log/g) || []).length;
    if (logCount > 5) {
      issues.push({ severity: "info", line: null, message: `Many console.log statements (${logCount})`, suggestion: "Consider using a structured logger" });
      score -= 2;
    }
  }

  const depth = Math.max(...lines.map((l) => {
    const match = l.match(/^(\s*)/);
    return match ? Math.floor(match[1].length / 2) : 0;
  }));
  if (depth > 6) {
    issues.push({ severity: "warning", line: null, message: `Deep nesting detected (depth: ${depth})`, suggestion: "Extract nested logic into helper functions" });
    score -= 5;
  }

  return {
    verdict: score >= 70 ? "APPROVE" : score >= 40 ? "REQUEST_CHANGES" : "REJECT",
    score: Math.max(0, score),
    issues,
    strengths: issues.length === 0 ? ["No structural issues detected"] : [],
    summary: issues.length === 0
      ? "Code passes structural review with no issues."
      : `Found ${issues.length} issue(s). Score: ${Math.max(0, score)}/100.`,
    method: "structural"
  };
}

module.exports = { buildReviewPrompt, buildStructuralReview };
