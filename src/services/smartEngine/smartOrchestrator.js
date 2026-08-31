const speedEngine = require("./speedEngine");
const caseMemory = require("./caseMemory");
const knowledgeGraph = require("./knowledgeGraph");
const statisticalLearner = require("./statisticalLearner");
const decisionTree = require("./decisionTree");

function init() {
  speedEngine.initialize();
  return { status: "initialized", stats: speedEngine.getStats() };
}

function solve(problem, context = {}, category = "general") {
  return speedEngine.solve({ problem, context, category });
}

function learnFromProblem(problem, solution, category = "general") {
  const newCase = caseMemory.addCase({ problem, solution, category, outcome: "success" });
  speedEngine.learnFromResult({ problem, category }, { source: "case_memory" });
  return newCase;
}

function learnFromFailure(problem, error, category = "general") {
  const newCase = caseMemory.addCase({ problem, solution: error, category, outcome: "failure" });
  return newCase;
}

function addKnowledge(concept, data = {}) {
  knowledgeGraph.addNode(concept, data);
}

function addRelationship(from, to, relationship = "related") {
  knowledgeGraph.addEdge(from, to, relationship);
}

function findKnowledge(concept) {
  return knowledgeGraph.getNeighbors(concept);
}

function findKnowledgePath(from, to) {
  return knowledgeGraph.findPath(from, to);
}

function recordEvent(category, event, outcome) {
  statisticalLearner.recordObservation(category, event, outcome);
}

function predict(category, event) {
  return statisticalLearner.predict(category, event);
}

function getStats() {
  const engineStats = speedEngine.getStats();
  const caseStats = caseMemory.getCaseStats();
  const graphStats = knowledgeGraph.getStats();
  const statsData = statisticalLearner.getStats();
  const treeList = decisionTree.listTrees();

  return {
    speed: { cacheSize: engineStats.cacheSize },
    memory: { totalCases: caseStats.total, byCategory: caseStats.byCategory },
    knowledge: { nodes: graphStats.nodes, edges: graphStats.edges },
    statistics: { patterns: statsData.totalPatterns, observations: statsData.totalObservations },
    intelligence: { decisionTrees: treeList.length }
  };
}

function diagnoseProblem(errorMsg) {
  const similarCases = caseMemory.findSimilarCases(errorMsg, 3);
  const graphHits = knowledgeGraph.searchNodes(errorMsg);
  const statsPred = statisticalLearner.predict("error", errorMsg);

  return {
    fromCases: similarCases.map((c) => ({ problem: c.problem, solution: c.solution, score: c.matchScore })),
    fromGraph: graphHits.map((n) => ({ id: n.id, description: n.description })),
    fromStats: statsPred,
    recommendation: similarCases.length > 0 ? similarCases[0].solution : "No prior solution found"
  };
}

module.exports = { init, solve, learnFromProblem, learnFromFailure, addKnowledge, addRelationship, findKnowledge, findKnowledgePath, recordEvent, predict, getStats, diagnoseProblem };
