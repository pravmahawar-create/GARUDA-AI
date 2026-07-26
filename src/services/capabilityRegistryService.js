const fs = require("fs");
const path = require("path");

const CAPABILITY_READINESS = Object.freeze(["verified", "partial", "planned"]);

const CAPABILITY_DEFINITIONS = Object.freeze([
  // 1. Software Engineering & Architecture
  {
    id: "engineering.software-implementation",
    category: "Software Engineering",
    universe: "engineering",
    name: "Governed software implementation",
    description: "Plan, implement, test, and package scoped software backend, frontend, and API microservices.",
    confidenceScore: 95,
    requiredSkills: ["Node.js", "JavaScript", "TypeScript", "REST APIs", "Automated Testing"],
    requiredTools: ["node", "npm", "git"],
    estimatedDeliveryTime: "4-24 hours",
    pricingGuidance: { minimumFeeUSD: 250, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["engineering.repository-audit", "testing.quality-assurance"],
    tags: [
      "software", "development", "implementation", "automation", "api", "backend", "frontend",
      "testing", "javascript", "node", "docker", "container", "kubernetes", "python", "react",
      "nextjs", "oauth", "auth0", "jwt", "scraping", "database migration", "schema migration",
      "sql migration", "migration", "iam", "aws", "policy", "permission", "smart contract",
      "ethereum", "solidity", "crypto", "contract deployment", "token contract", "presale contract",
      "crypto token", "html", "css", "flexbox", "layout fix", "landing page", "frontend styling",
      "full-stack", "online store", "e-commerce", "e-commerce web app", "payment gateway",
      "react native", "mobile app", "fitness tracking", "prototype", "database schema",
      "schema refactoring", "tenant isolation", "relational database"
    ],
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
    id: "engineering.repository-audit",
    category: "Software Engineering",
    universe: "engineering",
    name: "Repository architecture and quality audit",
    description: "Inspect a software repository and produce an evidence-backed architecture, risk, and validation report.",
    confidenceScore: 90,
    requiredSkills: ["Architecture Analysis", "Code Review", "Security Audit", "Linting"],
    requiredTools: ["ripgrep", "node", "git"],
    estimatedDeliveryTime: "2-6 hours",
    pricingGuidance: { minimumFeeUSD: 150, billingModel: "fixed_report" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["engineering.software-implementation"],
    tags: [
      "repository", "code", "audit", "architecture", "quality", "javascript", "node", "react",
      "database", "sql", "postgres", "mysql", "query", "optimization", "performance", "review",
      "schema", "migration", "queries", "query optimization", "performance audit", "database audit",
      "dependencies", "copyleft", "npm dependencies", "license audit", "seo audit", "website audit",
      "technical audit", "security review", "code security review", "vulnerability assessment",
      "threat modeling", "secure code review", "security assessment", "vulnerability scan", "authorized penetration test",
      "security audit", "web security", "application security", "code audit"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: [
      "scripts/mother/scanner.js",
      "src/motherCore/scanner/scannerEngine.js",
      "scripts/mother/validator.js"
    ]
  },
  {
    id: "engineering.api-integration",
    category: "API Integration",
    universe: "engineering",
    name: "REST & GraphQL API Integration & Microservices",
    description: "Connect third-party APIs, webhooks, authentication flows, and data transformers with zero placeholder data.",
    confidenceScore: 92,
    requiredSkills: ["REST API", "GraphQL", "Webhooks", "JSON/XML Transformers"],
    requiredTools: ["fetch", "node", "express"],
    estimatedDeliveryTime: "3-12 hours",
    pricingGuidance: { minimumFeeUSD: 200, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: ["engineering.software-implementation"],
    relatedCapabilities: ["automation.workflow-automation"],
    tags: [
      "api", "integration", "webhook", "graphql", "rest", "microservice",
      "sync", "pii sync", "medical records", "data sync", "api security",
      "authentication review", "authorization review", "access control review"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/opportunityDiscoveryService.js"]
  },

  // 2. Workflow & Process Automation
  {
    id: "automation.workflow-automation",
    category: "Workflow Automation",
    universe: "automation",
    name: "Business Workflow & Process Automation",
    description: "Automate repetitive data pipelines, webhooks, spreadsheet updates, and email/CRM triggers.",
    confidenceScore: 88,
    requiredSkills: ["Workflow Orchestration", "Node.js Scripts", "JSON Schema", "Queue Management"],
    requiredTools: ["node", "fs", "express"],
    estimatedDeliveryTime: "2-8 hours",
    pricingGuidance: { minimumFeeUSD: 150, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["automation.spreadsheet-automation", "engineering.api-integration"],
    tags: [
      "automation", "workflow", "zapier", "n8n", "pipeline", "trigger", "process",
      "routing", "escalation", "alert", "deduplication", "enrichment", "monitoring",
      "notice", "extraction", "ocr", "flow", "tree", "crm", "hubspot", "zendesk",
      "intercom", "freshdesk", "sla", "email", "document", "approval", "orchestration",
      "make.com", "business process automation", "multi-step automation", "api workflow", "task orchestration",
      "lead distribution", "agent portal", "sales agents", "zipcode", "receipt expense", "receipt entry", "quickbooks csv"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/revenueOutreachService.js"]
  },
  {
    id: "automation.spreadsheet-automation",
    category: "Spreadsheet Automation",
    universe: "automation",
    name: "Excel & Google Sheets Data Automation",
    description: "Build automated CSV/Excel generators, formula validators, data cleaning pipelines, and financial sheets.",
    confidenceScore: 90,
    requiredSkills: ["CSV Parsing", "Spreadsheet Formulas", "Data Formatting", "Excel Automation"],
    requiredTools: ["node", "fs"],
    estimatedDeliveryTime: "1-4 hours",
    pricingGuidance: { minimumFeeUSD: 100, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["data.data-analysis"],
    tags: [
      "spreadsheet", "excel", "csv", "sheets", "data", "finance", "table",
      "nps survey", "survey analysis", "sentiment report", "customer feedback comments"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/revenueCommandCenterService.js"]
  },

  // 3. Knowledge, Research & Documentation
  {
    id: "knowledge.research-synthesis",
    category: "Research",
    universe: "knowledge",
    name: "Research and knowledge synthesis",
    description: "Retrieve verified web and document sources to produce structured analytical research reports.",
    confidenceScore: 94,
    requiredSkills: ["Information Retrieval", "Source Verification", "Executive Summarization", "Markdown Formatting"],
    requiredTools: ["ripgrep", "fetch", "node"],
    estimatedDeliveryTime: "2-6 hours",
    pricingGuidance: { minimumFeeUSD: 150, billingModel: "fixed_report" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["documentation.technical-documentation"],
    tags: [
      "research", "analysis", "report", "knowledge", "summary", "documentation",
      "market", "seo", "marketing", "content", "translation", "localization",
      "spanish", "german", "french", "legal", "legal research", "case law",
      "statute", "uspto", "trademark", "copyright", "patent", "patent search",
      "prior art", "privacy", "policy", "gdpr", "compliance", "regulatory", "synthesis", "literature",
      "outbound sequence", "cold email sequence", "outreach drafting", "lead magnet", "whitepaper guide", "e-book writing", "feasibility study", "smart city", "iot study"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: [
      "src/services/knowledgeService.js",
      "src/services/documentService.js"
    ]
  },
  {
    id: "documentation.technical-documentation",
    category: "Technical Documentation",
    universe: "knowledge",
    name: "Technical Documentation & API Specs",
    description: "Produce comprehensive API specifications, architectural sitemaps, system diagrams, and developer manuals.",
    confidenceScore: 92,
    requiredSkills: ["OpenAPI/Swagger", "Markdown", "Mermaid Diagrams", "System Architecture"],
    requiredTools: ["fs", "node"],
    estimatedDeliveryTime: "2-8 hours",
    pricingGuidance: { minimumFeeUSD: 150, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["knowledge.research-synthesis", "writing.proposal-writing"],
    tags: [
      "documentation", "api", "spec", "manual", "technical", "diagram", "architecture",
      "readme", "license", "boilerplate", "setup", "guidelines", "help", "articles", "troubleshooting", "knowledge base",
      "lead magnet", "whitepaper guide", "e-book writing"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["scripts/mother/reporter.js"]
  },
  {
    id: "writing.proposal-writing",
    category: "Proposal Writing",
    universe: "revenue",
    name: "Technical Proposal & Quotation Package Writing",
    description: "Synthesize source-grounded technical proposals, milestone briefs, acceptance criteria, and commercial offer packages.",
    confidenceScore: 96,
    requiredSkills: ["Proposal Drafting", "Scope Boundary Analysis", "Commercial Structuring", "SHA-256 Verification"],
    requiredTools: ["node", "crypto"],
    estimatedDeliveryTime: "1-2 hours",
    pricingGuidance: { minimumFeeUSD: 100, billingModel: "fixed_package" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["documentation.technical-documentation"],
    tags: [
      "proposal", "quotation", "rfp", "bid", "commercial", "writing", "intake",
      "terms of service", "privacy policy", "contract", "clause", "legal drafting", "copy", "outreach", "email",
      "content strategy", "blog article", "article package", "blog post"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/revenueAcquisitionService.js"]
  },

  // 4. AI & Agent Engineering
  {
    id: "ai.agent-engineering",
    category: "AI Agents",
    universe: "engineering",
    name: "Custom AI Agents & RAG Pipeline Engineering",
    description: "Design autonomous AI agent workflows, tool-calling interfaces, vector search, and structured prompt pipelines.",
    confidenceScore: 90,
    requiredSkills: ["LLM Orchestration", "Tool Calling", "RAG Retrieval", "Prompt Engineering"],
    requiredTools: ["node", "fs"],
    estimatedDeliveryTime: "4-16 hours",
    pricingGuidance: { minimumFeeUSD: 300, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: ["engineering.software-implementation"],
    relatedCapabilities: ["engineering.api-integration"],
    tags: [
      "ai", "agent", "rag", "llm", "prompt", "vector", "search", "automation",
      "claims photo", "damage categorization", "photo categorization", "auto-responder",
      "ticket categorization", "zendesk auto-reply", "chatbot", "decision tree",
      "qualification chatbot", "intercom chatbot", "response bot", "whatsapp bot",
      "order status bot", "draft generator", "support email generator", "ai draft"
    ],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["scripts/mother/planner.js"]
  },

  // 5. Testing & Quality Assurance
  {
    id: "testing.quality-assurance",
    category: "Quality Assurance",
    universe: "engineering",
    name: "Automated QA Test Suite & Validation",
    description: "Write automated unit tests, integration tests, API contract assertions, and validation reports.",
    confidenceScore: 95,
    requiredSkills: ["Unit Testing", "Integration Testing", "Node.js Assertions", "Test Suite Design"],
    requiredTools: ["node", "assert"],
    estimatedDeliveryTime: "2-6 hours",
    pricingGuidance: { minimumFeeUSD: 120, billingModel: "fixed_test_suite" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["engineering.software-implementation"],
    tags: ["qa", "testing", "unit", "integration", "assert", "quality", "validation"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/opportunityDiscoveryVerticalSlice.test.js"]
  },

  // 6. Creative & Design Services
  {
    id: "creative.vector-design",
    category: "Creative Services",
    universe: "creative",
    name: "Vector Graphics, Logo & Layout Design",
    description: "Produce scalable vector graphic assets, SVG icons, logos, branding kits, and UI layout mockups.",
    confidenceScore: 88,
    requiredSkills: ["Vector Illustration", "SVG Optimization", "Logo Design", "Figma/Illustrator"],
    requiredTools: ["node", "fs"],
    estimatedDeliveryTime: "2-8 hours",
    pricingGuidance: { minimumFeeUSD: 100, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["documentation.technical-documentation"],
    tags: ["design", "logo", "vector", "svg", "branding", "graphics", "figma", "illustrator", "creative", "banner", "ebook", "layout"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/documentService.js"]
  },
  {
    id: "creative.motion-graphics",
    category: "Creative Services",
    universe: "creative",
    name: "Motion Graphics, Video & Audio Editing",
    description: "Create animated explainer videos, promo clips, podcast audio editing, and video post-production.",
    confidenceScore: 85,
    requiredSkills: ["Video Editing", "Motion Animation", "Audio Processing", "Subtitle Sync"],
    requiredTools: ["node", "fs"],
    estimatedDeliveryTime: "4-12 hours",
    pricingGuidance: { minimumFeeUSD: 200, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["creative.vector-design"],
    tags: ["video", "motion", "animation", "graphics", "editing", "podcast", "explainer", "creative", "audio"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/documentService.js"]
  },
  {
    id: "creative.3d-rendering",
    category: "Creative Services",
    universe: "creative",
    name: "3D Product Modeling & CAD Rendering",
    description: "Produce photorealistic 3D product renders, CAD geometry visualizations, and spatial mockups.",
    confidenceScore: 82,
    requiredSkills: ["3D Modeling", "Photorealistic Rendering", "CAD Geometry", "Blender/CAD"],
    requiredTools: ["node", "fs"],
    estimatedDeliveryTime: "6-24 hours",
    pricingGuidance: { minimumFeeUSD: 250, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["creative.vector-design"],
    tags: ["3d", "rendering", "visualization", "cad", "blender", "product", "creative", "model"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/documentService.js"]
  },

  // 7. Localization & Translation
  {
    id: "localization.translation-services",
    category: "Translation",
    universe: "localization",
    name: "Multi-Language Document & UI Translation",
    description: "Translate technical documents, software UI strings, marketing assets, and legal disclaimers into multiple languages.",
    confidenceScore: 92,
    requiredSkills: ["Technical Translation", "i18n Localization", "Cultural Adaptation", "Multilingual Proofreading"],
    requiredTools: ["node", "fs"],
    estimatedDeliveryTime: "1-6 hours",
    pricingGuidance: { minimumFeeUSD: 80, billingModel: "fixed_deliverable" },
    humanApprovalRequired: true,
    canMotherExecuteAutonomously: true,
    dependencies: [],
    relatedCapabilities: ["knowledge.research-synthesis", "documentation.technical-documentation"],
    tags: ["translation", "translate", "localization", "language", "spanish", "german", "french", "japanese", "arabic", "mandarin", "i18n", "multilingual"],
    commercializable: true,
    executionMode: "founder_authorized_supervised",
    humanIdentityRequired: false,
    evidenceFiles: ["src/services/knowledgeService.js"]
  }
]);

function inspectCapability(definition, rootDir = process.cwd()) {
  const evidence = (definition.evidenceFiles || []).map((file) => ({
    file,
    exists: fs.existsSync(path.join(rootDir, file))
  }));
  const evidenceCount = evidence.filter((item) => item.exists).length;
  const minimumEvidenceCount = definition.minimumEvidenceCount || (definition.evidenceFiles ? definition.evidenceFiles.length : 0);
  const readiness = evidenceCount >= minimumEvidenceCount ? "verified" : evidenceCount > 0 ? "partial" : "planned";

  return {
    ...definition,
    capabilityId: definition.id,
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
    .filter((capability) => !filters.category || capability.category.toLowerCase().includes(String(filters.category).toLowerCase()))
    .filter((capability) => !filters.readiness || capability.readiness === filters.readiness)
    .filter((capability) => filters.eligible === undefined || capability.eligibleForMatching === filters.eligible);
}

function getCapability(id, options = {}) {
  return listCapabilities({}, options).find((capability) => capability.id === id || capability.capabilityId === id) || null;
}

function matchDemandUniversal(opportunity = {}, options = {}) {
  const textToScan = `${opportunity.title || ""} ${opportunity.description || ""} ${(opportunity.tags || []).join(" ")}`.toLowerCase();
  const allCapabilities = listCapabilities({ eligible: true }, options);

  let bestMatch = null;
  let bestScore = 0;

  const matches = allCapabilities.map((cap) => {
    let score = 20;
    cap.tags.forEach((tag) => {
      if (textToScan.includes(tag.toLowerCase())) score += 15;
    });

    const categoryWords = cap.category.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    categoryWords.forEach((word) => {
      if (textToScan.includes(word)) score += 15;
    });

    const finalScore = Math.min(99, Math.max(20, score));
    return {
      capabilityId: cap.id,
      category: cap.category,
      name: cap.name,
      universe: cap.universe,
      confidenceScore: cap.confidenceScore,
      score: finalScore,
      canMotherExecuteAutonomously: cap.canMotherExecuteAutonomously,
      estimatedDeliveryTime: cap.estimatedDeliveryTime
    };
  }).filter((m) => m.score >= 30).sort((a, b) => b.score - a.score);

  if (matches.length > 0) {
    bestMatch = matches[0];
    bestScore = matches[0].score;
  }

  const parseVal = require("./revenueCommandCenterService").parseMonetaryValue;
  const commercialValueNum = parseVal(opportunity.salaryText || opportunity.salary || 0);

  return {
    opportunityId: String(opportunity.externalId || opportunity.id || ""),
    title: String(opportunity.title || ""),
    capabilityMatchScore: bestScore,
    bestCapability: bestMatch,
    matches,
    commercialValue: `$${commercialValueNum.toLocaleString()} USD`,
    executionRisk: opportunity.humanIdentityRequired ? "HIGH" : bestScore >= 70 ? "LOW" : "MEDIUM",
    legalRisk: opportunity.prohibitedContent ? "PROHIBITED" : "CLEAR",
    estimatedDelivery: bestMatch ? bestMatch.estimatedDeliveryTime : "1-3 days",
    confidence: bestMatch ? bestMatch.confidenceScore : 70,
    expectedProfitability: "90%",
    founderApprovalNeeded: true,
    garudaIdentityStatement: getGarudaIdentityStatement()
  };
}

function getGarudaIdentityStatement() {
  return "I am GARUDA, Praveen's AI representative. I assist client project delivery on behalf of the Founder. Actions requiring commercial authorization are always confirmed by the Founder.";
}

function getRegistrySummary(options = {}) {
  const capabilities = listCapabilities({}, options);
  return {
    total: capabilities.length,
    verified: capabilities.filter((item) => item.readiness === "verified").length,
    partial: capabilities.filter((item) => item.readiness === "partial").length,
    planned: capabilities.filter((item) => item.readiness === "planned").length,
    eligibleForMatching: capabilities.filter((item) => item.eligibleForMatching).length,
    categories: [...new Set(capabilities.map((item) => item.category))].sort(),
    universes: [...new Set(capabilities.map((item) => item.universe))].sort()
  };
}

module.exports = {
  CAPABILITY_DEFINITIONS,
  CAPABILITY_READINESS,
  getCapability,
  getGarudaIdentityStatement,
  getRegistrySummary,
  inspectCapability,
  listCapabilities,
  matchDemandUniversal
};
