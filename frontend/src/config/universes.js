/**
 * 🦅 GARUDA — The 27 Foundational Universes Configuration
 * Canonical Authority: universes.md & GARUDA Constitution
 * 
 * Strict Hierarchy:
 * GARUDA OS
 * ├── FOUNDER COMMAND / KINGDOM ACCESS (/founder/access)
 * ├── 27 CANONICAL UNIVERSES (Rings 1-4)
 * ├── PROJECTS / CLIENT WORKSPACES (/app)
 * ├── DEMOS & CASE STUDIES (/kudos, /demo)
 * └── SHARED CORE ENGINES
 */

export const RINGS = [
  { id: 1, name: "Core Intelligence", blurb: "The foundational mind, reasoning, memory, and governance of GARUDA OS." },
  { id: 2, name: "Human Empowerment", blurb: "Direct real-world execution across revenue, business, finance, education, and life." },
  { id: 3, name: "Creative & Digital", blurb: "Multimodal creation, content factory, brand governance, web presence, and entertainment." },
  { id: 4, name: "Civilization & Future", blurb: "Long-horizon wealth compounding, autonomous engineering innovation, and collective intelligence." }
];

export const STATUS = {
  PRODUCTION_VERIFIED: { label: "VERIFIED & LIVE", color: "#75f4ab", bg: "rgba(117, 244, 171, 0.1)" },
  STUDIO_EXECUTABLE: { label: "STUDIO EXECUTABLE", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.1)" },
  BACKEND_WIRED: { label: "BACKEND WIRED", color: "#f5d76e", bg: "rgba(245, 215, 110, 0.1)" },
  BLUEPRINT_EXISTS: { label: "BLUEPRINT EXISTS", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)" },
  ROADMAP: { label: "ROADMAP", color: "#8d95a7", bg: "rgba(141, 149, 167, 0.1)" }
};

function ringOf(num) {
  if (num >= 1 && num <= 9) return 1;
  if (num >= 10 && num <= 18) return 2;
  if (num >= 19 && num <= 23) return 3;
  return 4;
}

const U = (num, name, tagline, icon, modules, opts = {}) => ({
  num,
  id: `U${String(num).padStart(2, "0")}`,
  name,
  tagline,
  icon,
  modules,
  ring: ringOf(num),
  status: opts.status || "ROADMAP",
  blueprintStatus: opts.blueprintStatus || "CANONICAL BLUEPRINT VERIFIED",
  flagship: opts.flagship || null,
  route: opts.route || null,
  connectedEngines: opts.connectedEngines || [],
  note: opts.note || null,
  scope: opts.scope || "founder",
  hub: opts.hub || false
});

export const UNIVERSES = [
  /* ========================================================================= */
  /* RING 1 — CORE INTELLIGENCE (U01–U09)                                      */
  /* ========================================================================= */
  U(1, "Knowledge Universe", "Acquires, organizes, and grounds all truth & domain intelligence.", "⬢", [
    "Semantic RAG Core", "Vector Knowledge Graph", "Document Intelligence", "Category Sourcing"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/chat",
    flagship: "GARUDA Semantic RAG & Grounding Core",
    connectedEngines: ["knowledgeService.js", "abslKnowledgeService.js", "llmProvider.js"],
    scope: "public"
  }),

  U(2, "Reasoning Universe", "Multi-step cognitive planning, threat analysis, and inference.", "◎", [
    "Cognitive Router", "Multi-LLM Arbiter", "Task Decomposition", "Defensive Reasoning"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/chat",
    flagship: "Cognitive Router & Multi-Brain Inference",
    connectedEngines: ["cognitiveRouterService.js", "localInferenceGateway.js"],
    scope: "public"
  }),

  U(3, "Memory Universe", "Session continuity, durable founder memory, and project recall.", "◌", [
    "Durable Memory Manager", "Founder Context Graph", "Thread Persistence", "Compaction Engine"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/founder",
    flagship: "Founder Memory & Tenancy Isolation Store",
    connectedEngines: ["founderMemoryService.js", "conversationService.js"],
    scope: "founder"
  }),

  U(4, "Learning Universe", "Autonomous strategy evolution and continuous improvement.", "◈", [
    "Failure Intelligence", "Pattern Extractor", "Prompt Evolver", "Outcome Feedback Loop"
  ], {
    status: "BACKEND_WIRED",
    route: "/command-center",
    flagship: "Autonomous Outcome Learning & Failure Intelligence",
    connectedEngines: ["outcomeLearningService.js", "conversionFailureIntelligenceService.js"],
    scope: "founder"
  }),

  U(5, "Decision Universe", "Evaluates risk, prioritizes missions, and scores opportunities.", "✦", [
    "Mission Decisioning", "Global Lead Scoring", "Confidence Thresholds", "Risk Governance"
  ], {
    status: "BACKEND_WIRED",
    route: "/command-center",
    flagship: "Global Lead Scoring & Opportunity Arbiter",
    connectedEngines: ["revenueMissionDecisionService.js", "globalLeadScoringEngineService.js"],
    scope: "founder"
  }),

  U(6, "Automation Universe", "Deterministic multi-agent orchestration and task execution.", "⚙", [
    "Autonomous Task Runner", "Mission Orchestrator", "Worker Queue", "Cron Schedulers"
  ], {
    status: "BACKEND_WIRED",
    route: "/command-center",
    flagship: "Autonomous Revenue Task Runner & Worker Queue",
    connectedEngines: ["autonomousRevenueTaskRunnerService.js", "revenueMissionOrchestratorService.js"],
    scope: "founder"
  }),

  U(7, "Communication Universe", "Multi-channel voice, email, Telegram, and conversational bots.", "✉", [
    "Public Chat Agent", "Outbound Email Relay", "Telegram Bot Core", "Speech & Voice Core"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/chat",
    flagship: "Multi-Channel Outbound Relay & Telegram Worker",
    connectedEngines: ["outboundCommunicationService.js", "emailRelayService.js", "telegramBotService.js"],
    scope: "public"
  }),

  U(8, "Security Universe", "Tenancy isolation, threat list defense, and cryptographic seals.", "🛡", [
    "Attack List Blocker", "Permission Reviewer", "Cryptographic Hashing", "Credential Enclave"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/command-center",
    flagship: "Sovereign Tenancy Isolation & Attack List Sentinel",
    connectedEngines: ["attackListService.js", "revenuePermissionReviewService.js"],
    scope: "founder"
  }),

  U(9, "Governance Universe", "Founder sovereignty gates, constitutional locks, and approval audits.", "⛔", [
    "Founder Approval Gate", "Governed Project Delivery", "Audit Trail", "Truth Law Sentinel"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/command-center",
    flagship: "Governed Project Delivery & SHA-256 Sealing Engine",
    connectedEngines: ["governedProjectDeliveryService.js", "founderCommandService.js"],
    scope: "founder"
  }),

  /* ========================================================================= */
  /* RING 2 — HUMAN EMPOWERMENT (U10–U18)                                      */
  /* ========================================================================= */
  U(10, "Revenue Universe", "Generates income, converts commercial proposals, and verifies payments.", "⟡", [
    "Persistent Proposals", "Razorpay Escrow Verification", "Settlement Ledger", "Commercial Closer"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/revenue",
    flagship: "Commercial Proposal Engine & Razorpay Payment Verifier",
    connectedEngines: ["persistentProposalService.js", "razorpayPaymentLinkService.js", "revenueClosingSystemService.js"],
    scope: "founder",
    hub: true
  }),

  U(11, "Business Universe", "Client intake pipelines, CRM deal tracking, and enterprise operations.", "▣", [
    "Work Intake Engine", "Client Intelligence Hub", "Deal Pipeline Tracker", "SOP Orchestration"
  ], {
    status: "BACKEND_WIRED",
    route: "/founder/acquisition",
    flagship: "Real Commercial Prospect Queue & Deal Tracker",
    connectedEngines: ["revenueWorkIntakeService.js", "dealTrackerService.js", "clientIntelligenceEngineService.js"],
    scope: "founder"
  }),

  U(12, "Finance Universe", "Automated settlements, escrow verification, and financial reconciliation.", "▤", [
    "Settlement Fee Engine", "Payment Webhooks", "Reconciliation Ledger", "P&L Integrity"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/revenue",
    flagship: "Settlement Fee Config & Signed Webhook Reconciliation",
    connectedEngines: ["settlementService.js", "paymentWebhookService.js", "paymentReconciliationService.js"],
    scope: "founder"
  }),

  U(13, "Career Universe", "Executive positioning, skill progression roadmaps, and career leverage.", "☰", [
    "Executive Dossier", "Interview Prep Engine", "Skill Matrix Graph", "Network Positioning"
  ], {
    status: "BLUEPRINT_EXISTS",
    blueprintStatus: "CANONICAL BLUEPRINT VERIFIED",
    route: null,
    connectedEngines: [],
    scope: "public"
  }),

  U(14, "Education Universe", "Academic research intelligence, thesis derivations, and integrity audits.", "◎", [
    "GARUDA Vidya Studio", "Formal Derivations", "Turnitin Integrity Audit", "Executive White PDF"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/scholar",
    flagship: "GARUDA Vidya Studio (8,192 Tokens + White PDF)",
    connectedEngines: ["academicIntegrityService.js"],
    scope: "public"
  }),

  U(15, "Health Universe", "Personal vitality tracking, wellness protocols, and routine optimization.", "◈", [
    "Wellness Protocol", "Vitality Metrics", "Routine Optimization", "Medical Knowledge Sourcing"
  ], {
    status: "BLUEPRINT_EXISTS",
    blueprintStatus: "CANONICAL BLUEPRINT VERIFIED",
    route: null,
    connectedEngines: ["healthService.js"],
    scope: "founder"
  }),

  U(16, "Relationship Universe", "Relationship memory, milestone tracking, and executive follow-up prompts.", "✦", [
    "Relationship Capital Graph", "Milestone Sentinel", "Executive Drafts", "Etiquette Intelligence"
  ], {
    status: "BLUEPRINT_EXISTS",
    blueprintStatus: "CANONICAL BLUEPRINT VERIFIED",
    route: null,
    connectedEngines: [],
    scope: "founder"
  }),

  U(17, "Travel Universe", "Autonomous itinerary planning, destination briefings, and logistics handling.", "◈", [
    "Itinerary Synthesizer", "Destination Intelligence", "Flight/Stay Briefs", "Disruption Manager"
  ], {
    status: "BLUEPRINT_EXISTS",
    blueprintStatus: "CANONICAL BLUEPRINT VERIFIED",
    route: null,
    connectedEngines: [],
    scope: "founder"
  }),

  U(18, "Lifestyle Universe", "Daily habit architectures, home operations, and personal systems.", "◈", [
    "Habit Architecture", "Personal Operations", "Executive Balance", "Daily Rhythm Sync"
  ], {
    status: "BLUEPRINT_EXISTS",
    blueprintStatus: "CANONICAL BLUEPRINT VERIFIED",
    route: null,
    connectedEngines: [],
    scope: "founder"
  }),

  /* ========================================================================= */
  /* RING 3 — CREATIVE & DIGITAL (U19–U23)                                     */
  /* ========================================================================= */
  U(19, "Creative Universe", "Multimodal Creative Operating System & One-Tap Music, Film and Visual Studio.", "✦", [
    "One-Tap Composer", "Audio & Music Brain", "Visual Storyboard", "Character Consistency", "Cinematic Timeline"
  ], {
    status: "STUDIO_EXECUTABLE",
    route: "/creative",
    flagship: "GARUDA Creative Studio — One-Tap Music & Cinematic OS",
    connectedEngines: ["creativeStudioService.js", "imageGenerationRouter.js", "videoGenerationRouter.js", "creativeQualityService.js"],
    scope: "public"
  }),

  U(20, "Content Universe", "High-velocity content factory, editorial calendars, and multi-channel publishing.", "✎", [
    "4-Week Editorial Calendar", "Shorts/Reels Scripts", "Multi-Angle Hooks", "Repurposing Engine"
  ], {
    status: "STUDIO_EXECUTABLE",
    route: "/content",
    flagship: "GARUDA Content Factory Studio",
    connectedEngines: ["digitalMarketingOsService.js"],
    scope: "public"
  }),

  U(21, "Brand Universe", "Sovereign IdentityLock™, typography, color systems, and brand voice governance.", "◈", [
    "IdentityLock™ Governance", "Typography Systems", "Color Palette Architect", "Executive White PDF"
  ], {
    status: "STUDIO_EXECUTABLE",
    route: "/brand",
    flagship: "Sovereign IdentityLock™ Brand Studio",
    connectedEngines: ["identityLockService.js"],
    scope: "public"
  }),

  U(22, "Digital Presence Universe", "Living web presence, service portfolios, landing pages, and SEO topic clusters.", "☰", [
    "Living Web Presences", "Service Landing Engine", "SEO Cluster Architect", "Conversion CRO"
  ], {
    status: "PRODUCTION_VERIFIED",
    route: "/digital-presence",
    flagship: "Digital Presence & SEO Topic Cluster Engine",
    connectedEngines: ["garudaCroService.js"],
    scope: "public"
  }),

  U(23, "Entertainment Universe", "Interactive experiences, live event spectacles, and war room engines.", "◈", [
    "Event Campaign War Rooms", "Celebrity Hype Blueprints", "Interactive Experiences", "Ticketing & Concierge"
  ], {
    status: "STUDIO_EXECUTABLE",
    route: "/entertainment",
    flagship: "Entertainment & Event Experience War Room Engine",
    connectedEngines: ["kudosEntertainmentService.js"],
    scope: "public",
    note: "KUDOS Face of India 2026 is an active project case study under this domain."
  }),

  /* ========================================================================= */
  /* RING 4 — CIVILIZATION & FUTURE (U24–U27)                                  */
  /* ========================================================================= */
  U(24, "Wealth & Real Estate Universe", "Long-horizon wealth compounding, corridor analytics, and builder dossiers.", "◈", [
    "Corridor Analytics", "Builder Dossiers", "Deal Scoring", "WhatsApp Investor Concierge"
  ], {
    status: "STUDIO_EXECUTABLE",
    route: "/command-center",
    flagship: "Real Estate Growth OS & Corridor Intelligence",
    connectedEngines: ["realEstateGrowthService.js", "realEstateProspectIntelligenceService.js"],
    scope: "founder"
  }),

  U(25, "Innovation Universe", "Autonomous engineering R&D, patentable ideation, and frontier discovery.", "◎", [
    "Autonomous R&D", "Emergent Discovery Engine", "Self-Build Engine", "Prototype Reasoning"
  ], {
    status: "BACKEND_WIRED",
    route: "/command-center",
    flagship: "Scout Emergent Discovery & Self-Build Engine",
    connectedEngines: ["scoutEmergentBridgeService.js", "opportunityDiscoveryService.js"],
    scope: "founder"
  }),

  U(26, "Collective Intelligence Universe", "30-agent workforce, multi-brain swarm, and consensus coordination.", "◌", [
    "30-Agent Workforce", "Workforce Router", "Deterministic Workers", "Swarm Consensus"
  ], {
    status: "STUDIO_EXECUTABLE",
    route: "/command-center",
    flagship: "30-Agent Workforce Router & Swarm Coordinator",
    connectedEngines: ["workforceRouterService.js"],
    scope: "founder"
  }),

  U(27, "Consciousness & Future Universe", "Existential awareness, ethical boundaries, and human-AI coexistence.", "◈", [
    "Self-Knowledge Truth", "Constitutional Guardrails", "Existential Risk Sensing", "Far-Horizon Maps"
  ], {
    status: "BLUEPRINT_EXISTS",
    blueprintStatus: "CANONICAL BLUEPRINT VERIFIED",
    route: null,
    connectedEngines: [],
    scope: "founder"
  })
];

export const LOCKED_UNIVERSE_COUNT = 27;

export const getUniverseByNum = (num) => UNIVERSES.find((u) => u.num === num);
export const getUniverseById = (id) => UNIVERSES.find((u) => u.id === id || u.num === Number(id.replace("U", "")));
export const getUniversesByRing = (ringId) => UNIVERSES.filter((u) => u.ring === ringId);
export const getUniversesByScope = (scope) => UNIVERSES.filter((u) => u.scope === scope);
export const getFounderUniverses = () => UNIVERSES.filter((u) => u.scope === "founder");
export const getPublicUniverses = () => UNIVERSES.filter((u) => u.scope === "public");
export const getRevenueHub = () => UNIVERSES.find((u) => u.hub === true) || null;
export const ALL_UNIVERSES = UNIVERSES;