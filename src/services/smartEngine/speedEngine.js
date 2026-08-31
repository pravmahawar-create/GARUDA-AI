const caseMemory = require("./caseMemory");
const knowledgeGraph = require("./knowledgeGraph");
const statisticalLearner = require("./statisticalLearner");
const decisionTree = require("./decisionTree");

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(input) {
  return JSON.stringify(input).toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 100);
}

function cacheGet(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) { cache.delete(key); return null; }
  return item.value;
}

function cacheSet(key, value, ttlMs = CACHE_TTL) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function solve(input) {
  const startTime = Date.now();
  const { problem, context = {}, category = "general" } = input;
  const result = { solution: null, source: null, confidence: 0, timeMs: 0, layers: [] };

  // Layer 1: Cache check (instant)
  const cacheKey = getCacheKey({ problem, category });
  const cached = cacheGet(cacheKey);
  if (cached) {
    result.solution = cached;
    result.source = "cache";
    result.confidence = cached.confidence || 0.9;
    result.timeMs = Date.now() - startTime;
    result.layers.push("cache");
    return result;
  }
  result.layers.push("cache_miss");

  // Layer 2: Decision Tree (instant)
  const treeResult = tryDecisionTree(category, context);
  if (treeResult && treeResult.confidence > 0.7) {
    result.solution = treeResult.result || treeResult;
    result.source = "decision_tree";
    result.confidence = treeResult.confidence;
    result.timeMs = Date.now() - startTime;
    result.layers.push("decision_tree");
    cacheSet(cacheKey, result.solution);
    return result;
  }
  result.layers.push("no_tree_match");

  // Layer 3: Statistical Prediction (instant)
  const statsPrediction = statisticalLearner.predict(category, problem);
  if (statsPrediction && statsPrediction.confidence > 0.6) {
    result.solution = { prediction: statsPrediction.prediction, confidence: statsPrediction.confidence };
    result.source = "statistical";
    result.confidence = statsPrediction.confidence;
    result.timeMs = Date.now() - startTime;
    result.layers.push("statistical");
    cacheSet(cacheKey, result.solution);
    return result;
  }
  result.layers.push("no_stats_match");

  // Layer 4: Case Memory (fast)
  const similarCases = caseMemory.findSimilarCases(problem, 1);
  if (similarCases.length > 0 && similarCases[0].matchScore > 0.5) {
    result.solution = { solution: similarCases[0].solution, fromCase: similarCases[0].id };
    result.source = "case_memory";
    result.confidence = similarCases[0].matchScore;
    result.timeMs = Date.now() - startTime;
    result.layers.push("case_memory");
    statisticalLearner.recordObservation(category, problem, "case_matched");
    cacheSet(cacheKey, result.solution);
    return result;
  }
  result.layers.push("no_case_match");

  // Layer 5: Knowledge Graph (fast)
  const graphRelated = knowledgeGraph.searchNodes(problem);
  if (graphRelated.length > 0) {
    const neighbors = knowledgeGraph.getNeighbors(graphRelated[0].id);
    result.solution = { related: neighbors.map((n) => n.id).slice(0, 5), graphHint: graphRelated[0].description };
    result.source = "knowledge_graph";
    result.confidence = 0.4;
    result.timeMs = Date.now() - startTime;
    result.layers.push("knowledge_graph");
    return result;
  }

  // Layer 6: Fallback
  result.solution = { message: "No solution found. Manual review needed." };
  result.source = "fallback";
  result.confidence = 0;
  result.timeMs = Date.now() - startTime;
  result.layers.push("fallback");
  return result;
}

function tryDecisionTree(category, context) {
  if (context.errorType) {
    return decisionTree.evaluateTree("error-handler", context);
  }
  if (context.hasEval !== undefined || context.hasSecret !== undefined) {
    return decisionTree.evaluateTree("code-review", context);
  }
  return null;
}

function learnFromResult(input, result) {
  const { problem, category = "general" } = input;
  if (result.source === "case_memory" || result.source === "decision_tree") {
    statisticalLearner.recordObservation(category, problem, "solved");
  }
  if (result.source === "fallback") {
    statisticalLearner.recordObservation(category, problem, "unsolved");
  }
}

function getStats() {
  return {
    cacheSize: cache.size,
    cases: caseMemory.getCaseStats(),
    knowledge: knowledgeGraph.getStats(),
    statistics: statisticalLearner.getStats(),
    trees: decisionTree.listTrees()
  };
}

function initialize() {
  knowledgeGraph.initializeDefaultGraph();
  decisionTree.buildErrorTree();
  decisionTree.buildCodeReviewTree();
}

module.exports = { solve, learnFromResult, getStats, initialize, cache };
