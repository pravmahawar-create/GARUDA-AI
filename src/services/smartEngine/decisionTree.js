const trees = new Map();

function createDecisionTree(id, definition) {
  const tree = { id, ...definition, createdAt: new Date().toISOString() };
  trees.set(id, tree);
  return tree;
}

function evaluateTree(treeId, context) {
  const tree = trees.get(treeId);
  if (!tree) return { error: "Tree not found" };
  return traverseNode(tree.root, context);
}

function traverseNode(node, context) {
  if (!node) return null;

  if (node.type === "leaf") {
    return { result: node.result, confidence: node.confidence || 1.0, path: [] };
  }

  if (node.type === "condition") {
    const value = resolveValue(node.field, context);
    const matched = matchCondition(value, node.operator, node.value);

    if (matched) {
      const childResult = traverseNode(node.then, context);
      if (childResult) return { ...childResult, path: [...childResult.path, { condition: node.field + " " + node.operator + " " + node.value, matched: true }] };
    } else {
      const childResult = traverseNode(node.else, context);
      if (childResult) return { ...childResult, path: [...childResult.path, { condition: node.field + " " + node.operator + " " + node.value, matched: false }] };
    }
  }

  if (node.type === "multi") {
    for (const branch of node.branches || []) {
      const value = resolveValue(branch.field, context);
      if (matchCondition(value, branch.operator, branch.value)) {
        const childResult = traverseNode(branch.next, context);
        if (childResult) return { ...childResult, path: [...childResult.path, { field: branch.field, matched: true }] };
      }
    }
    if (node.default) {
      const childResult = traverseNode(node.default, context);
      if (childResult) return childResult;
    }
  }

  return null;
}

function resolveValue(field, context) {
  if (!field) return undefined;
  const parts = field.split(".");
  let current = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

function matchCondition(actual, operator, expected) {
  switch (operator) {
    case "===": return actual === expected;
    case "!==": return actual !== expected;
    case ">": return actual > expected;
    case "<": return actual < expected;
    case ">=": return actual >= expected;
    case "<=": return actual <= expected;
    case "includes": return typeof actual === "string" && actual.includes(expected);
    case "matches": return typeof actual === "string" && new RegExp(expected).test(actual);
    default: return actual === expected;
  }
}

function buildErrorTree() {
  return createDecisionTree("error-handler", {
    name: "Error Resolution Tree",
    root: {
      type: "multi",
      branches: [
        { field: "errorType", operator: "includes", value: "undefined", next: {
          type: "multi",
          branches: [
            { field: "context", operator: "includes", value: "import", next: { type: "leaf", result: { action: "fix_import", message: "Import statement missing or incorrect" }, confidence: 0.85 } },
            { field: "context", operator: "includes", value: "function", next: { type: "leaf", result: { action: "fix_param", message: "Function parameter not provided" }, confidence: 0.75 } }
          ],
          default: { type: "leaf", result: { action: "check_scope", message: "Variable not in scope" }, confidence: 0.6 }
        }},
        { field: "errorType", operator: "includes", value: "permission", next: { type: "leaf", result: { action: "fix_permissions", message: "Check file permissions" }, confidence: 0.9 } },
        { field: "errorType", operator: "includes", value: "timeout", next: { type: "leaf", result: { action: "check_server", message: "Server may be down or slow" }, confidence: 0.8 } },
        { field: "errorType", operator: "includes", value: "ECONNREFUSED", next: { type: "leaf", result: { action: "start_server", message: "Server not running" }, confidence: 0.95 } }
      ],
      default: { type: "leaf", result: { action: "manual_review", message: "Unknown error — manual review needed" }, confidence: 0.3 }
    }
  });
}

function buildCodeReviewTree() {
  return createDecisionTree("code-review", {
    name: "Code Review Decision Tree",
    root: {
      type: "multi",
      branches: [
        { field: "hasEval", operator: "===" , value: true, next: { type: "leaf", result: { verdict: "REJECT", reason: "eval() detected — security risk" }, confidence: 0.95 } },
        { field: "hasSecret", operator: "===", value: true, next: { type: "leaf", result: { verdict: "REJECT", reason: "Hardcoded secret detected" }, confidence: 0.95 } },
        { field: "lineCount", operator: ">", value: 300, next: { type: "leaf", result: { verdict: "REQUEST_CHANGES", reason: "File too long — split recommended" }, confidence: 0.8 } },
        { field: "nestingDepth", operator: ">", value: 5, next: { type: "leaf", result: { verdict: "REQUEST_CHANGES", reason: "Deep nesting — refactor recommended" }, confidence: 0.75 } },
        { field: "hasTests", operator: "===", value: false, next: { type: "leaf", result: { verdict: "REQUEST_CHANGES", reason: "No tests found" }, confidence: 0.6 } }
      ],
      default: { type: "leaf", result: { verdict: "APPROVE", reason: "Code looks good" }, confidence: 0.7 }
    }
  });
}

function listTrees() {
  return [...trees.values()].map((t) => ({ id: t.id, name: t.name }));
}

module.exports = { createDecisionTree, evaluateTree, buildErrorTree, buildCodeReviewTree, listTrees };
