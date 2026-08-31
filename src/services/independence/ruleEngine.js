const rules = [];

function addRule(rule) {
  const r = {
    id: rule.id || `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: rule.name || "Unnamed Rule",
    category: rule.category || "general",
    priority: typeof rule.priority === "number" ? rule.priority : 5,
    condition: typeof rule.condition === "function" ? rule.condition : () => false,
    action: typeof rule.action === "function" ? rule.action : () => ({}),
    description: rule.description || "",
    enabled: rule.enabled !== false
  };
  rules.push(r);
  return r;
}

function evaluate(input, context = {}) {
  const enabledRules = rules.filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);
  const results = [];

  for (const rule of enabledRules) {
    try {
      if (rule.condition(input, context)) {
        const actionResult = rule.action(input, context);
        results.push({ ruleId: rule.id, ruleName: rule.name, result: actionResult });
      }
    } catch (err) {
      results.push({ ruleId: rule.id, ruleName: rule.name, error: err.message });
    }
  }

  return results;
}

function evaluateFirst(input, context = {}) {
  const enabledRules = rules.filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);
  for (const rule of enabledRules) {
    try {
      if (rule.condition(input, context)) {
        return { ruleId: rule.id, ruleName: rule.name, result: rule.action(input, context) };
      }
    } catch {}
  }
  return null;
}

function listRules() {
  return rules.map((r) => ({ id: r.id, name: r.name, category: r.category, priority: r.priority, enabled: r.enabled, description: r.description }));
}

function enableRule(ruleId) {
  const rule = rules.find((r) => r.id === ruleId);
  if (rule) { rule.enabled = true; return true; }
  return false;
}

function disableRule(ruleId) {
  const rule = rules.find((r) => r.id === ruleId);
  if (rule) { rule.enabled = false; return true; }
  return false;
}

function removeRule(ruleId) {
  const idx = rules.findIndex((r) => r.id === ruleId);
  if (idx === -1) return false;
  rules.splice(idx, 1);
  return true;
}

function clearRules() {
  rules.length = 0;
}

function getRulesByCategory(category) {
  return rules.filter((r) => r.category === category);
}

module.exports = { addRule, evaluate, evaluateFirst, listRules, enableRule, disableRule, removeRule, clearRules, getRulesByCategory };
