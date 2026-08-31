const { getAvailableModels, getModelsByCapability } = require("./modelRegistry");
const { classifyTask, estimateComplexity } = require("./taskClassifier");

function selectModel(input, constraints = {}) {
  const { maxCost = Infinity, maxLatencyMs = Infinity, preferLocal = false, requiredCapabilities = [] } = constraints;

  const classification = classifyTask(input);
  const complexity = estimateComplexity(input);
  const neededCaps = [...(classification.requiredCapabilities || []), ...requiredCapabilities];

  let candidates = getAvailableModels();
  if (candidates.length === 0) return { error: "No models available" };

  if (preferLocal) {
    const local = candidates.filter((m) => m.provider === "local");
    if (local.length > 0) candidates = local;
  }

  if (neededCaps.length > 0) {
    candidates = candidates.filter((m) =>
      neededCaps.some((cap) => m.capabilities.includes(cap))
    );
  }

  candidates = candidates.filter((m) => m.costPer1kTokens <= maxCost);
  candidates = candidates.filter((m) => m.avgLatencyMs <= maxLatencyMs);

  if (candidates.length === 0) {
    candidates = getAvailableModels();
    if (neededCaps.length > 0) {
      candidates = candidates.filter((m) =>
        neededCaps.some((cap) => m.capabilities.includes(cap))
      );
    }
  }

  if (candidates.length === 0) return { error: "No suitable model found" };

  const scored = candidates.map((model) => {
    const qualityScore = model.quality * 40;
    const costScore = Math.max(0, 30 - model.costPer1kTokens * 1000);
    const latencyScore = Math.max(0, 20 - (model.avgLatencyMs / 1000) * 5);
    const capabilityScore = neededCaps.filter((c) => model.capabilities.includes(c)).length / Math.max(1, neededCaps.length) * 10;

    let total = qualityScore + costScore + latencyScore + capabilityScore;

    if (complexity.complexity === "high") total += model.quality * 20;
    if (complexity.complexity === "low") {
      total += (1 - model.costPer1kTokens * 100) * 15;
      total += Math.max(0, 10 - model.avgLatencyMs / 200);
    }

    return { model, score: total };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    model: best.model,
    score: best.score,
    classification,
    complexity,
    alternatives: scored.slice(1, 4).map((s) => ({ model: s.model, score: s.score }))
  };
}

function selectModelForGoal(goal) {
  const allSteps = goal.steps || [];
  const selections = [];

  for (const step of allSteps) {
    const input = { text: step.description, type: step.type };
    const selection = selectModel(input);
    selections.push({ stepId: step.id, stepType: step.type, ...selection });
  }

  const uniqueModels = [...new Set(selections.map((s) => s.model?.id).filter(Boolean))];
  return { selections, uniqueModels, totalSteps: selections.length };
}

module.exports = { selectModel, selectModelForGoal };
