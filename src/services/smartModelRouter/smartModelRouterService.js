/**
 * GARUDA Smart Model Router - Service Facade
 *
 * Single entry point for all smart routing operations.
 * Connects provider detection, task classification, and routing.
 */

const router = require("./smartRouter");
const detector = require("./providerDetector");
const classifier = require("./taskClassifier");

async function init() {
  const providers = await detector.detectAll();
  return {
    initialized: true,
    providers: {
      local: providers.hasLocalLLM,
      cloud: providers.cloud.map((p) => p.name),
      total: providers.totalProviders,
    },
    timestamp: new Date().toISOString(),
  };
}

async function ask(text) {
  return router.routeAndExecute(text);
}

async function route(text) {
  return router.route(text);
}

async function providers() {
  return detector.detectAll();
}

function classify(text) {
  return classifier.classifyTask(text);
}

function log() {
  return router.getRoutingLog();
}

function stats() {
  return router.getRoutingStats();
}

module.exports = { init, ask, route, providers, classify, log, stats };
