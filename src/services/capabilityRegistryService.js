const fs = require("fs");
const path = require("path");

const CAPABILITY_READINESS = Object.freeze(["verified", "partial", "planned"]);

const CAPABILITY_DEFINITIONS = Object.freeze([
  {
    id: "engineering.repository-audit",
    universe: "engineering",
    name: "Repository architecture and quality audit",
    description: "Inspect a software repository and produce an evidence-backed architecture, risk, and validation report.",
    tags: ["repository", "code", "audit", "architecture", "quality", "javascript", "node", "react"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: [
      "scripts/mother/scanner.js",
      "scripts/dev-agent/core/ArchitectureAnalyzer.js",
      "scripts/mother/validator.js",
      "scripts/mother/reporter.js"
    ]
  },
  {
    id: "engineering.software-implementation",
    universe: "engineering",
    name: "Governed software implementation",
    description: "Plan, implement, test, and package scoped software changes under founder approval.",
    tags: ["software", "development", "implementation", "automation", "api", "backend", "frontend", "testing"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: [
      "scripts/mother/planner.js",
      "scripts/mother/executor.js",
      "scripts/mother/builder.js",
      "scripts/mother/validator.js"
    ]
  },
  {
    id: "knowledge.research-synthesis",
    universe: "knowledge",
    name: "Research and knowledge synthesis",
    description: "Retrieve approved knowledge and produce structured research summaries with source-aware output.",
    tags: ["research", "analysis", "report", "knowledge", "summary", "documentation"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: [
      "src/services/knowledgeService.js",
      "src/services/documentService.js",
      "src/routes/knowledgeRoutes.js"
    ]
  },
  {
    id: "revenue.opportunity-analysis",
    universe: "revenue",
    name: "Commercial opportunity analysis",
    description: "Filter, score, rank, and track lawful commercial opportunities without applying automatically.",
    tags: ["opportunity", "commercial", "market", "ranking", "risk", "revenue", "analysis"],
    commercializable: false,
    executionMode: "internal_enablement",
    humanIdentityRequired: false,
    evidenceFiles: [
      "src/services/opportunityDiscoveryService.js",
      "src/services/opportunityService.js",
      "src/models/DiscoveryCandidate.js"
    ]
  },
  {
    id: "revenue.settlement-governance",
    universe: "revenue",
    name: "Revenue and settlement governance",
    description: "Verify revenue state and track gross, fees, net, payout eligibility, receipts, and audit events.",
    tags: ["revenue", "settlement", "ledger", "payout", "fees", "audit", "verification"],
    commercializable: false,
    executionMode: "internal_enablement",
    humanIdentityRequired: false,
    evidenceFiles: [
      "src/services/revenueService.js",
      "src/services/settlementService.js",
      "src/models/SettlementLedger.js"
    ]
  },
  {
    id: "creative.multimodal-production",
    universe: "creative",
    name: "Multimodal creative production",
    description: "Produce governed visual, audio, video, and narrative deliverables.",
    tags: ["creative", "image", "video", "audio", "story", "design", "content"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["docs/CREATIVE_STUDIO.md"],
    minimumEvidenceCount: 2
  }
]);

function inspectCapability(definition, rootDir = process.cwd()) {
  const evidence = definition.evidenceFiles.map((file) => ({
    file,
    exists: fs.existsSync(path.join(rootDir, file))
  }));
  const evidenceCount = evidence.filter((item) => item.exists).length;
  const minimumEvidenceCount = definition.minimumEvidenceCount || definition.evidenceFiles.length;
  const readiness = evidenceCount >= minimumEvidenceCount
    ? "verified"
    : evidenceCount > 0
      ? "partial"
      : "planned";

  return {
    ...definition,
    readiness,
    eligibleForMatching: readiness === "verified" && definition.commercializable,
    evidence
  };
}

function listCapabilities(filters = {}, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  return CAPABILITY_DEFINITIONS
    .map((definition) => inspectCapability(definition, rootDir))
    .filter((capability) => !filters.universe || capability.universe === String(filters.universe).toLowerCase())
    .filter((capability) => !filters.readiness || capability.readiness === filters.readiness)
    .filter((capability) => filters.eligible === undefined || capability.eligibleForMatching === filters.eligible);
}

function getCapability(id, options = {}) {
  return listCapabilities({}, options).find((capability) => capability.id === id) || null;
}

function getRegistrySummary(options = {}) {
  const capabilities = listCapabilities({}, options);
  return {
    total: capabilities.length,
    verified: capabilities.filter((item) => item.readiness === "verified").length,
    partial: capabilities.filter((item) => item.readiness === "partial").length,
    planned: capabilities.filter((item) => item.readiness === "planned").length,
    eligibleForMatching: capabilities.filter((item) => item.eligibleForMatching).length,
    universes: [...new Set(capabilities.map((item) => item.universe))].sort()
  };
}

module.exports = {
  CAPABILITY_DEFINITIONS,
  CAPABILITY_READINESS,
  getCapability,
  getRegistrySummary,
  inspectCapability,
  listCapabilities
};
