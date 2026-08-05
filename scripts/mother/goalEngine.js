function understandGoal(goal = "") {
  const rawGoal = String(goal || "").trim();
  const text = rawGoal.toLowerCase();

  const hasNegativeWriteConstraint =
    /\b(do not|don't|dont|no|without|zero|never|stop)\s+([a-z\s,]+)?\b(modify|modifying|edit|editing|write|writes|writing|change|changes|changing|patch|patching|create|creating|delete|deleting|commit|committing|push|pushing|file|files|anything|code)\b/i.test(text) ||
    /\b(read-only|read only|no writes|no write|without changing|without modifying|don't commit|don't push|don't modify|don't write|dont commit|dont push|dont modify|dont write)\b/i.test(text);

  const selfDevelopmentSignal = !hasNegativeWriteConstraint && /\b(capability|weakness|self-development|self development|improvement|weaknesses)\b/i.test(text);
  const selfDevelopmentMetaSignal = !hasNegativeWriteConstraint && /\b(inspect\s+your(?:self|\s+currently\s+available\s+runtime\s+capabilities)|choose\s+the\s+target\s+yourself|identify\s+one\s+highest-value\s+capability|self-development\s+engineering\s+mission)\b/i.test(text);

  const isReadOnlyInspection = /\b(inspect|audit|analyze|determine\s+whether|check\s+whether|verify\s+whether|find\s+whether|read)\b/i.test(text);
  const hasAffirmativeWriteCommand = !hasNegativeWriteConstraint && (
    /\b(create|build|implement|add|write|generate|fix|repair|modify|update|patch|refactor)\s+([a-z0-9_\-\.\/]+)\b/i.test(text) ||
    /^\s*(create|build|implement|add|write|generate|fix|repair|modify|update|patch|refactor)\b/i.test(text)
  );

  let actionType = "analysis";

  if (hasNegativeWriteConstraint || (isReadOnlyInspection && !hasAffirmativeWriteCommand)) {
    actionType = "analysis";
  } else if (/\b(create|build|add|write|generate)\b/i.test(text) || /\bimplement\b(?!(\s+is|\s+was|\s+has|\s+actually))/i.test(text)) {
    actionType = "creation";
  } else if (/\b(fix|repair|modify|update|patch|refactor)\b/i.test(text)) {
    actionType = "modification";
  } else if (/\b(test|verify|check|validate)\b/i.test(text)) {
    actionType = "verification";
  } else if (/\b(revenue|income|payout|settlement|earning|earnings)\b/i.test(text)) {
    actionType = "revenue";
  } else if (selfDevelopmentSignal) {
    actionType = "creation";
  }

  const explicitArtifactRequest = /\b(named\s+|module\s+|file\s+|\.(?:js|json|ts|jsx|tsx)\b)/i.test(rawGoal);

  const nameMatch = selfDevelopmentMetaSignal
    ? null
    : (rawGoal.match(/\bnamed\s+([a-zA-Z0-9_\-]+)\b/i) ||
      rawGoal.match(/\bmodule\s+([a-zA-Z0-9_\-]+)\b/i) ||
      rawGoal.match(/\bfile\s+([a-zA-Z0-9_\-\.\/]+)\b/i) ||
      rawGoal.match(/\bfor\s+([a-zA-Z0-9_\-]+)\b/i) ||
      rawGoal.match(/\b([a-zA-Z0-9_\-]+\.(?:js|json|ts|jsx|tsx))\b/i));
  let targetName = nameMatch ? nameMatch[1] : null;

  if (text.includes("existing") && (text.includes("subsystem") || text.includes("passive") || text.includes("partially-connected"))) {
    targetName = "continuousRevenueAttemptService";
    if (!hasNegativeWriteConstraint) actionType = "modification";
  } else if (!targetName && selfDevelopmentSignal && !selfDevelopmentMetaSignal) {
    targetName = "motherSelfDevelopmentBridge";
    if (!hasNegativeWriteConstraint) actionType = "modification";
  }

  let domain = "general";
  let intent = "unknown";
  let priority = "medium";

  if (hasNegativeWriteConstraint) {
    domain = "engineering";
    intent = "read_only_audit";
    priority = "medium";
  } else if (selfDevelopmentMetaSignal) {
    domain = "mother";
    intent = "self_development_meta";
    priority = "high";
    targetName = null;
  } else if (selfDevelopmentSignal) {
    domain = "mother";
    intent = "self_development_improvement";
    priority = "high";
  } else if (actionType === "revenue") {
    domain = "revenue";
    intent = "develop_revenue_model";
    priority = "critical";
  } else if (actionType === "creation") {
    domain = "engineering";
    intent = "create_code_artifact";
    priority = "high";
  } else if (actionType === "modification") {
    domain = "engineering";
    intent = "modify_code_artifact";
    priority = "high";
  } else if (actionType === "verification") {
    domain = "engineering";
    intent = "verify_code_artifact";
    priority = "medium";
  } else if (actionType === "analysis") {
    if (text.includes("mother") && (text.includes("brain") || text.includes("architecture") || text.includes("missing"))) {
      domain = "mother";
      intent = "improve_autonomy";
      priority = "critical";
    } else if (isReadOnlyInspection || hasNegativeWriteConstraint || /\b(repository|code|implemented|implementation)\b/i.test(text)) {
      domain = "engineering";
      intent = "read_only_audit";
      priority = "medium";
    } else if (text.includes("frontend") || text.includes("ui") || text.includes("kingdom")) {
      domain = "frontend";
      intent = "improve_visible_experience";
      priority = "high";
    } else if (text.includes("backend") || text.includes("api") || text.includes("rag")) {
      domain = "backend";
      intent = "improve_system_intelligence";
      priority = "high";
    } else if (text.includes("mother") || text.includes("autonomous") || text.includes("brain")) {
      domain = "mother";
      intent = "improve_autonomy";
      priority = "critical";
    }
  } else if (text.includes("frontend") || text.includes("ui") || text.includes("kingdom")) {
    domain = "frontend";
    intent = "improve_visible_experience";
    priority = "high";
  } else if (text.includes("backend") || text.includes("api") || text.includes("rag")) {
    domain = "backend";
    intent = "improve_system_intelligence";
    priority = "high";
  } else if (text.includes("mother") || text.includes("autonomous") || text.includes("brain")) {
    domain = "mother";
    intent = "improve_autonomy";
    priority = "critical";
  }

  return {
    rawGoal,
    domain,
    intent,
    actionType,
    targetName,
    priority,
    explicitArtifactRequest,
    targetSource: explicitArtifactRequest ? "FOUNDER_EXPLICIT_TARGET" : null,
    requiresFounderApproval: false
  };
}

module.exports = { understandGoal };
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.goal_target_grounding timestamp=2026-08-02T08:27:19.545Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.goal_target_grounding
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.goal_target_grounding timestamp=2026-08-02T08:41:43.786Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.goal_target_grounding
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.goal_target_grounding timestamp=2026-08-02T10:59:53.425Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.goal_target_grounding
