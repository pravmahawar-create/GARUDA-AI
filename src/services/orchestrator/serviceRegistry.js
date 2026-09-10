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
  try { registerService("repoIntel", require("../repositoryIntelligence/repositoryIntelligenceService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("safeMod", require("../safeModification/safeModificationService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("testDiscovery", require("../testDiscovery/testDiscoveryService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("gitIsolation", require("../gitIsolation/gitIsolationService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("codeReview", require("../codeReview/codeReviewService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("goalEngine", require("../goalEngine/goalEngineService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("memory", require("../persistentMemory/memoryService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("selfAwareness", require("../selfAwareness/selfAwarenessService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("independence", require("../independence/localDecisionEngine")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("codeGen", require("../codeGeneration/codeGenerationService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("router", require("../adaptiveRouter/adaptiveRouterService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("smartEngine", require("../smartEngine/speedEngine")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("smartRouter", require("../smartModelRouter/smartModelRouterService")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("independenceRules", require("../independence/ruleEngine")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  try { registerService("pipeline", require("../engineeringPipeline/engineeringPipeline")); } catch (err) { console.warn("[auto-recovery] suppressed error in serviceRegistry.js:", String(err.message).slice(0,80)); }
  return listServices();
}

module.exports = { registerService, getService, listServices, initAll };
