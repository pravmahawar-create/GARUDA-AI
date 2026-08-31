/**
 * GARUDA Smart Model Router - Tests
 */

const classifier = require("./taskClassifier");
const detector = require("./providerDetector");
const router = require("./smartRouter");
const service = require("./smartModelRouterService");

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.log(`  FAIL: ${name}`);
  }
}

async function testClassifier() {
  console.log("\n--- Task Classifier ---");

  const codeTask = classifier.classifyTask("Write a function to sort an array in JavaScript");
  assert(codeTask.category === "code", "Classifies code task");
  assert(codeTask.needsCodeModel === true, "Marks needsCodeModel for code");
  assert(codeTask.confidence > 0, "Has confidence score");

  const reasonTask = classifier.classifyTask("Why should we use microservices over monolith for this project?");
  assert(reasonTask.category === "reasoning", "Classifies reasoning task");
  assert(reasonTask.needsReasoningModel === true, "Marks needsReasoningModel for reasoning");

  const generalTask = classifier.classifyTask("Good morning, thanks for the update");
  assert(generalTask.category === "general", "Classifies general task");

  const systemTask = classifier.classifyTask("Run health check on GARUDA system");
  assert(systemTask.category === "system", "Classifies system task");

  const complexCode = classifier.classifyTask("Write a complete function implementing binary search algorithm with error handling, edge cases, unit tests, and refactoring for performance optimization");
  assert(complexCode.complexity !== "trivial", "Detects non-trivial code task");

  const trivialTask = classifier.classifyTask("Hi");
  assert(trivialTask.complexity === "trivial", "Detects trivial task");
}

async function testDetector() {
  console.log("\n--- Provider Detector ---");

  const result = await detector.detectAll();
  assert(typeof result.ollama === "object", "Detects Ollama status");
  assert(typeof result.cloud === "object", "Detects cloud providers");
  assert(typeof result.totalProviders === "number", "Counts providers");
  assert(typeof result.hasLocalLLM === "boolean", "Reports hasLocalLLM");

  if (result.ollama.available) {
    assert(result.ollama.models.length > 0, "Ollama has models");
    assert(result.ollama.bestModel !== null, "Ollama has best model selected");
    console.log(`  INFO: Ollama models: ${result.ollama.models.map((m) => m.id).join(", ")}`);
    console.log(`  INFO: Best model: ${result.ollama.bestModel}`);
  } else {
    console.log("  INFO: Ollama not running (expected in some environments)");
  }

  console.log(`  INFO: Cloud providers: ${result.cloud.map((p) => p.name).join(", ") || "none (no API keys set)"}`);
}

async function testRouter() {
  console.log("\n--- Smart Router ---");

  const codeRoute = await router.route("Write a Python function to parse JSON");
  assert(codeRoute.selected.provider !== undefined, "Routes code task to a provider");
  assert(codeRoute.classification === "code", "Reports classification");
  assert(codeRoute.timeMs >= 0, "Reports routing time");
  assert(codeRoute.selected.reason !== undefined, "Provides routing reason");

  const reasonRoute = await router.route("Analyze the pros and cons of using Redis vs MongoDB");
  assert(reasonRoute.selected.provider !== undefined, "Routes reasoning task");

  const generalRoute = await router.route("What is the weather?");
  assert(generalRoute.selected.provider !== undefined, "Routes general task");

  console.log(`  INFO: Code route → ${codeRoute.selected.provider}/${codeRoute.selected.model} (${codeRoute.selected.tier})`);
  console.log(`  INFO: Reason route → ${reasonRoute.selected.provider}/${reasonRoute.selected.model}`);
}

async function testService() {
  console.log("\n--- Service Facade ---");

  const initResult = await service.init();
  assert(initResult.initialized === true, "Service initializes");

  const classifyResult = service.classify("Write code for a REST API");
  assert(classifyResult.category === "code", "Service classifies tasks");

  const routeResult = await service.route("Debug this JavaScript error");
  assert(routeResult.selected.provider !== undefined, "Service routes tasks");

  const logResult = service.log();
  assert(Array.isArray(logResult), "Service returns routing log");

  const statsResult = service.stats();
  assert(typeof statsResult.total === "number", "Service returns stats");
}

async function runTests() {
  console.log("=== GARUDA Smart Model Router Tests ===");

  await testClassifier();
  await testDetector();
  await testRouter();
  await testService();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
