const ruleEngine = require("./ruleEngine");
const patternMatcher = require("./patternMatcher");
const planner = require("./ruleBasedPlanner");
const fs = require("fs");
const path = require("path");

function decide(input) {
  const { task, code, filePath, context } = input;
  const decisions = [];

  if (code && filePath) {
    const codeMatches = patternMatcher.matchPatterns(code, filePath);
    for (const match of codeMatches) {
      decisions.push({
        type: "code_analysis",
        pattern: match.patternName,
        severity: match.severity,
        suggestion: match.suggestion,
        findings: match.findings
      });
    }

    const ast = parseCode(code);
    if (ast) {
      const securityIssues = patternMatcher.detectSecurityIssues(ast, code);
      for (const issue of securityIssues) {
        decisions.push({ type: "security", severity: "critical", message: issue.message, line: issue.line });
      }
      const codeSmells = patternMatcher.detectCodeSmells(ast, code);
      for (const smell of codeSmells) {
        decisions.push({ type: "quality", severity: "warning", message: smell.message, suggestion: smell.suggestion });
      }
    }
  }

  if (task) {
    const ruleResults = ruleEngine.evaluate({ task, context });
    for (const r of ruleResults) {
      decisions.push({ type: "rule", rule: r.ruleName, result: r.result });
    }
  }

  return decisions;
}

function planAndDecide(goal, codebase) {
  const plan = planner.planGoal(goal, codebase);
  const decisions = [];

  for (const step of plan.steps) {
    if (step.type === "analyze" || step.type === "review") {
      const stepDecisions = decide({ task: step.description, context: { goal, step } });
      decisions.push({ step: step.type, decisions: stepDecisions });
    }
  }

  return { plan, decisions, reasoning: plan.reasoning };
}

function reviewCode(code, filePath) {
  const ast = parseCode(code);
  const issues = [];
  let score = 100;

  if (code.includes("eval(") || code.includes("new Function(")) {
    issues.push({ severity: "critical", message: "eval() detected — security risk" });
    score -= 55;
  }

  if (code.match(/(?:password|secret|api.?key|token)\s*[=:]\s*["'][^"']+["']/i)) {
    issues.push({ severity: "critical", message: "Hardcoded secret detected" });
    score -= 50;
  }

  if (ast) {
    const codeSmells = patternMatcher.detectCodeSmells(ast, code);
    for (const smell of codeSmells) {
      issues.push({ severity: "warning", message: smell.message, suggestion: smell.suggestion });
      score -= 10;
    }
    const patterns = patternMatcher.detectPatterns(ast, code);
    issues.push({ severity: "info", message: `Patterns: ${patterns.join(", ") || "none detected"}` });
  }

  const codeMatches = patternMatcher.matchPatterns(code, filePath);
  for (const match of codeMatches) {
    for (const finding of match.findings) {
      issues.push({ severity: match.severity, message: finding.message || finding, suggestion: match.suggestion });
    }
  }

  const verdict = score >= 80 ? "APPROVE" : score >= 50 ? "REQUEST_CHANGES" : "REJECT";
  return { verdict, score: Math.max(0, score), issues, method: "rule_based", llm: false };
}

function parseCode(code) {
  try {
    return require("@babel/parser").parse(code, {
      sourceType: "unambiguous",
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      errorRecovery: true,
      plugins: ["dynamicImport"]
    });
  } catch { return null; }
}

function init() {
  ruleEngine.clearRules();

  ruleEngine.addRule({ id: "bugfix-auto", name: "Bugfix Analysis Rule", category: "bugfix", priority: 10,
    condition: (input) => input.goal && input.goal.type === "bugfix",
    action: (input) => ({ steps: [{ type: "analyze", description: "Analyze error logs" }, { type: "modify", description: "Apply targeted fix" }, { type: "test", description: "Verify fix" }], reasoning: "Bugfix rule triggered" })
  });

  ruleEngine.addRule({ id: "feature-auto", name: "Feature Implementation Rule", category: "feature", priority: 10,
    condition: (input) => input.goal && input.goal.type === "feature",
    action: (input) => ({ steps: [{ type: "analyze", description: "Analyze requirements" }, { type: "plan", description: "Design solution" }, { type: "modify", description: "Implement" }, { type: "test", description: "Test" }], reasoning: "Feature rule triggered" })
  });

  ruleEngine.addRule({ id: "refactor-auto", name: "Refactoring Rule", category: "refactor", priority: 10,
    condition: (input) => input.goal && input.goal.type === "refactor",
    action: (input) => ({ steps: [{ type: "analyze", description: "Analyze structure" }, { type: "modify", description: "Refactor" }, { type: "test", description: "Verify" }], reasoning: "Refactor rule triggered" })
  });

  ruleEngine.addRule({ id: "security-review", name: "Security Review Rule", category: "review", priority: 15,
    condition: (input) => input.code && (input.code.includes("eval(") || input.code.includes("process.env")),
    action: (input) => ({ steps: [{ type: "review", description: "Security review required" }], reasoning: "Security patterns detected" })
  });

  ruleEngine.addRule({ id: "complex-task", name: "Complex Task Rule", category: "planning", priority: 8,
    condition: (input) => input.analysis && input.analysis.complexity === "high",
    action: (input) => ({ steps: [{ type: "analyze", description: "Deep analysis" }, { type: "plan", description: "Detailed planning" }], reasoning: "High complexity detected — added planning step" })
  });

  patternMatcher.addPattern({ id: "eval-detect", name: "eval Detection", category: "security", severity: "critical",
    detect: (ast, code) => {
      const findings = [];
      if (code.includes("eval(")) findings.push({ message: "eval() usage detected" });
      if (code.includes("new Function(")) findings.push({ message: "new Function() usage detected" });
      return findings;
    },
    suggestion: "Remove eval() — use safer alternatives"
  });

  patternMatcher.addPattern({ id: "secret-detect", name: "Secret Detection", category: "security", severity: "critical",
    detect: (ast, code) => {
      const matches = code.match(/(?:password|secret|api.?key|token)\s*[=:]\s*["'][^"']+["']/gi);
      return matches ? matches.map((m) => ({ message: `Potential secret: ${m.substring(0, 40)}` })) : [];
    },
    suggestion: "Use environment variables, never hardcode secrets"
  });

  patternMatcher.addPattern({ id: "console-detect", name: "Console Log Detection", category: "quality", severity: "info",
    detect: (ast, code) => {
      const count = (code.match(/console\.(log|warn|error)/g) || []).length;
      return count > 3 ? [{ message: `${count} console statements found` }] : [];
    },
    suggestion: "Consider using structured logger"
  });

  patternMatcher.addPattern({ id: "todo-detect", name: "TODO Detection", category: "maintenance", severity: "info",
    detect: (ast, code) => {
      const todos = code.match(/(?:TODO|FIXME|HACK|XXX)/g);
      return todos ? [{ message: `${todos.length} TODO/FIXME comments found` }] : [];
    },
    suggestion: "Address TODO items"
  });

  return { rules: ruleEngine.listRules().length, patterns: "registered" };
}

module.exports = { decide, planAndDecide, reviewCode, init };
