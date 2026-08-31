const services = {};

function registerService(name, service) {
  services[name] = service;
}

function getService(name) {
  return services[name] || null;
}

function listServices() {
  return Object.keys(services).map((name) => ({
    name,
    available: !!services[name],
    methods: services[name] ? Object.keys(services[name]).filter((k) => typeof services[name][k] === "function") : []
  }));
}

function initAll() {
  try { registerService("repoIntel", require("../repositoryIntelligence/repositoryIntelligenceService")); } catch {}
  try { registerService("safeMod", require("../safeModification/safeModificationService")); } catch {}
  try { registerService("testDiscovery", require("../testDiscovery/testDiscoveryService")); } catch {}
  try { registerService("gitIsolation", require("../gitIsolation/gitIsolationService")); } catch {}
  try { registerService("codeReview", require("../codeReview/codeReviewService")); } catch {}
  try { registerService("goalEngine", require("../goalEngine/goalEngineService")); } catch {}
  try { registerService("memory", require("../persistentMemory/memoryService")); } catch {}
  try { registerService("selfAwareness", require("../selfAwareness/selfAwarenessService")); } catch {}
  try { registerService("independence", require("../independence/localDecisionEngine")); } catch {}
  try { registerService("codeGen", require("../codeGeneration/codeGenerationService")); } catch {}
  try { registerService("router", require("../adaptiveRouter/adaptiveRouterService")); } catch {}
  return listServices();
}

module.exports = { registerService, getService, listServices, initAll };
