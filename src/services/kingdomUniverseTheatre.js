/**
 * 🦅 GARUDA AI — Kingdom Universe Theatre V3
 * Phase: Autonomous Investor Presentation + Live Universe Theatre
 *
 * Core Principle:
 * Structured taxonomy and execution bridges for GARUDA's 27 specialized domain execution universes.
 * Enforces Truth Law (VERIFIED !== PARTIAL !== PLANNED !== UNAVAILABLE).
 * Enforces Sovereign Capability Boundary Guard (strictly rejects out-of-boundary / unauthorized actions).
 */

const crypto = require("crypto");
const { demonstrationOrchestrator } = require("./demonstrationOrchestrator");

const UNIVERSE_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  PARTIAL: "PARTIAL",
  PLANNED: "PLANNED",
  UNAVAILABLE: "UNAVAILABLE",
  RESTRICTED: "RESTRICTED"
});

const KINGDOM_UNIVERSES = Object.freeze([
  {
    id: "U01_ENGINEERING",
    code: "U01",
    name: "Engineering & Software OS",
    title: "Governed Autonomous Engineering Pipeline",
    status: UNIVERSE_STATUS.VERIFIED,
    themeColor: "#38bdf8", // Cognitive Cyan
    accentGlow: "rgba(56, 189, 248, 0.4)",
    icon: "⚙️",
    purpose: "Transforms software problems into verified code modifications via a 9-stage closed-loop pipeline with AST review and rollback safety.",
    verifiedCapabilities: [
      "AST code parsing & module dependency graph mapping via @babel/parser",
      "Git worktree isolation for safe sandboxed modification",
      "Automated test discovery & regression validation",
      "Safe line-diff patching with SHA-256 pre-modification backups",
      "AST code review grading (verdict: APPROVED / NEEDS_FIX)"
    ],
    partialCapabilities: [
      "Multi-repository cross-dependency refactoring"
    ],
    plannedCapabilities: [
      "Autonomous air-gapped binary compilation across foreign architectures"
    ],
    restrictedBoundaries: [
      "Direct commit/push to remote production branches without Founder approval",
      "Arbitrary remote shell command execution outside sandboxed environment",
      "Destructive database mutations without human confirmation"
    ],
    demoKey: "repo_architecture",
    entryScene: "CODE_INTELLIGENCE_STAGE"
  },
  {
    id: "U02_CREATIVE",
    code: "U02",
    name: "Creative Command Center",
    title: "Living Vector Artifact & Brand Studio",
    status: UNIVERSE_STATUS.VERIFIED,
    themeColor: "#f59e0b", // Sovereign Gold
    accentGlow: "rgba(245, 158, 11, 0.4)",
    icon: "✨",
    purpose: "Generates Living Vector Artifacts (SVGs), design tokens, and editorial assets with cryptographic lineage across multi-turn continuations.",
    verifiedCapabilities: [
      "Living Vector Artifact generation with real physical SVG persistence on disk",
      "IdentityLock™ Brand Governance (design tokens, typography, color harmony constraints)",
      "Structured creative briefs with context-aware multi-turn continuations",
      "Cryptographic SHA-256 evidence sealing on all generated visual assets"
    ],
    partialCapabilities: [
      "Raster-to-vector automated neural vectorization",
      "Audio acoustic synthesizer sound design"
    ],
    plannedCapabilities: [
      "Photorealistic 3D digital human avatars with real-time lip-sync",
      "Full-length 4K neural video generation"
    ],
    restrictedBoundaries: [
      "Claiming full Hollywood movie generation",
      "Fabricating photorealistic 3D capabilities without physical model weights"
    ],
    demoKey: "creative_artifact",
    entryScene: "EXECUTION_THEATRE"
  },
  {
    id: "U03_DIGITAL_GROWTH",
    code: "U03",
    name: "Digital Marketing & Growth Hub",
    title: "Search Intent, Content Pillars & SEO OS",
    status: UNIVERSE_STATUS.VERIFIED,
    themeColor: "#10b981", // Emerald Green
    accentGlow: "rgba(16, 185, 129, 0.4)",
    icon: "📈",
    purpose: "Architects 4-week editorial calendars, content pillars, carousel frameworks, and SEO topic clusters backed by verified search intent structures.",
    verifiedCapabilities: [
      "4-week structured editorial calendar generation across content pillars",
      "SEO topic cluster architecture with search intent mapping",
      "High-converting landing page conceptual frameworks & copy strategy",
      "Lead-magnet & conversion funnel blueprint formulation"
    ],
    partialCapabilities: [
      "Multi-platform automated social scheduling simulation"
    ],
    plannedCapabilities: [
      "Real-time programmatic ad bidding & budget dispatch",
      "Autonomous live social media publishing"
    ],
    restrictedBoundaries: [
      "Direct external ad spend dispatch without human authorization",
      "Sending unsolicited cold emails or spam outreach"
    ],
    demoKey: "marketing_seo",
    entryScene: "CONVERSATIONAL_STAGE"
  },
  {
    id: "U04_AFFILIATE",
    code: "U04",
    name: "Affiliate & Partner Revenue Hub",
    title: "Offer Matching, Attribution & Commission Infrastructure",
    status: UNIVERSE_STATUS.PARTIAL,
    themeColor: "#8b5cf6", // Sovereign Purple
    accentGlow: "rgba(139, 92, 246, 0.4)",
    icon: "🤝",
    purpose: "Maps product offerings to qualified creator audiences, tracks conversion attribution pipelines, and models transparent revenue shares.",
    verifiedCapabilities: [
      "Audience-to-offer intent matching and campaign concept formulation",
      "Attribution schema & referral link signature validation",
      "Commission split modeling & transparent settlement simulation"
    ],
    partialCapabilities: [
      "Webhook-driven conversion receipt validation"
    ],
    plannedCapabilities: [
      "Autonomous payout dispatch via banking rails",
      "Real-time external affiliate network synchronization"
    ],
    restrictedBoundaries: [
      "Faking external affiliate revenue or hallucinating conversion metrics",
      "Autonomous payment settlement without Founder authorization"
    ],
    demoKey: "marketing_seo",
    entryScene: "FINANCIAL_SCENARIOS_STAGE"
  },
  {
    id: "U05_REVENUE",
    code: "U05",
    name: "Revenue Universe",
    title: "Autonomous Commercial Execution Flywheel",
    status: UNIVERSE_STATUS.VERIFIED,
    themeColor: "#fbbf24", // Amber Sovereign
    accentGlow: "rgba(251, 191, 36, 0.4)",
    icon: "💰",
    purpose: "Executes the 6-stage commercial engine: Find Opportunity → Qualify Lead → Execute Work → Deliver Artifact → Receive Settlement → Learn Memory.",
    verifiedCapabilities: [
      "Proactive opportunity discovery & lead scoring",
      "Structured commercial proposal generation with pricing tiers",
      "Client dashboard & deliverable acceptance tracking",
      "Closed-loop operational memory recording from completed missions"
    ],
    partialCapabilities: [
      "Automated Stripe/Razorpay payment intent verification"
    ],
    plannedCapabilities: [
      "Direct institutional escrow integration"
    ],
    restrictedBoundaries: [
      "Fabricating revenue numbers or phantom clients",
      "Binding legal contract execution without human signing"
    ],
    demoKey: "marketing_seo",
    entryScene: "FINANCIAL_SCENARIOS_STAGE"
  },
  {
    id: "U06_GOVERNANCE",
    code: "U06",
    name: "Sovereign Security & Governance",
    title: "Zero-Trust Trust Boundaries & Founder Gates",
    status: UNIVERSE_STATUS.VERIFIED,
    themeColor: "#ef4444", // Crimson Red
    accentGlow: "rgba(239, 68, 68, 0.4)",
    icon: "🛡️",
    purpose: "Enforces human Founder approval gates, cryptographic tenant isolation, and 100% Anti-Fabrication evidence verification.",
    verifiedCapabilities: [
      "Human-in-the-loop Founder authorization gate for critical write actions",
      "Cryptographic multi-tenant isolation with HMAC-SHA256 session seals",
      "Capability entitlement middleware with namespace wildcard filtering",
      "100% Anti-Fabrication verification (UNAVAILABLE !== 0, SHA-256 evidence)"
    ],
    partialCapabilities: [
      "Automated compliance report generation (SOC2 readiness mapping)"
    ],
    plannedCapabilities: [
      "Formal mathematical proof verification of code modification invariants"
    ],
    restrictedBoundaries: [
      "Bypassing Founder approval gates",
      "Permitting cross-tenant unauthorized data access"
    ],
    demoKey: "brand_identity",
    entryScene: "ARCHITECTURE_STAGE"
  },
  {
    id: "U07_SCHOLAR",
    code: "U07",
    name: "Scholar & Vidya RAG Engine",
    title: "Deterministic Knowledge Retrieval & Synthesis",
    status: UNIVERSE_STATUS.VERIFIED,
    themeColor: "#06b6d4", // Cyan Vidya
    accentGlow: "rgba(6, 182, 212, 0.4)",
    icon: "📚",
    purpose: "Ingests structured documentation, indexes repository architectures, and retrieves grounded truth with zero hallucinations.",
    verifiedCapabilities: [
      "Deterministic hybrid semantic + keyword knowledge search",
      "Repository intelligence indexing and AST symbol retrieval",
      "Authoritative identity knowledge grounding with Anti-Fabrication verification"
    ],
    partialCapabilities: [
      "Multi-modal PDF and vector diagram parsing"
    ],
    plannedCapabilities: [
      "Decentralized knowledge graph federation across sovereign nodes"
    ],
    restrictedBoundaries: [
      "Answering from hallucinated facts when confidence is low (must report UNAVAILABLE)"
    ],
    demoKey: "repo_architecture",
    entryScene: "ARCHITECTURE_STAGE"
  }
]);

class KingdomUniverseTheatre {
  constructor() {
    this.universes = KINGDOM_UNIVERSES;
    this.orchestrator = demonstrationOrchestrator;
  }

  /**
   * Retrieves all kingdom universes.
   */
  getAllUniverses() {
    return [...this.universes];
  }

  /**
   * Finds a universe by ID or code.
   */
  getUniverse(identifier = "") {
    const clean = String(identifier || "").trim().toUpperCase();
    return this.universes.find((u) => u.id === clean || u.code === clean || u.name.toUpperCase().includes(clean)) || null;
  }

  /**
   * Evaluates if a query targets a specific universe.
   */
  identifyTargetUniverse(queryText = "") {
    const text = String(queryText || "").toLowerCase();

    if (/engineering|code|software|ast|worktree|pipeline|build software|fix bug/i.test(text)) {
      return this.getUniverse("U01_ENGINEERING");
    }
    if (/creative|image|svg|logo|poster|brand|identitylock|design|living artifact/i.test(text)) {
      return this.getUniverse("U02_CREATIVE");
    }
    if (/marketing|seo|growth|content|social|traffic|lead strategy|campaign/i.test(text)) {
      return this.getUniverse("U03_DIGITAL_GROWTH");
    }
    if (/affiliate|partner|referral|commission|attribution/i.test(text)) {
      return this.getUniverse("U04_AFFILIATE");
    }
    if (/revenue|monetize|client|proposal|deal|commercial|pricing|sales/i.test(text)) {
      return this.getUniverse("U05_REVENUE");
    }
    if (/security|governance|isolation|tenant|gate|founder approval|trust|compliance|safe/i.test(text)) {
      return this.getUniverse("U06_GOVERNANCE");
    }
    if (/scholar|vidya|knowledge|rag|search|docs|research/i.test(text)) {
      return this.getUniverse("U07_SCHOLAR");
    }

    return null;
  }

  /**
   * Checks if an action is within authorized capability boundaries.
   */
  checkCapabilityBoundary(actionDescription = "") {
    const text = String(actionDescription || "").toLowerCase().trim();

    // Concept 1: Approval / Gate / Permission tokens (English, Roman Hindi, Devanagari Hindi)
    const hasApprovalToken =
      /\b(approval|permission|auth|gate|approv|manzoori|anumati|swikriti)\b/i.test(text) ||
      /[\u0900-\u097F]*(अनुमति|मंजूरी|स्वीकृति|अप्रूवल)[\u0900-\u097F]*/i.test(text);

    const hasFounderToken =
      /\b(founder|founder's|praveen)\b/i.test(text) ||
      /[\u0900-\u097F]*(फाउंडर)[\u0900-\u097F]*/i.test(text);

    // Concept 2: Bypass / Without / Skip / Ke bina / Negative tokens (English, Roman Hindi, Hindi)
    const hasBypassToken =
      /\b(bypass|skip|without|ignore|circumvent|evade|override|overrule|bina|bagair)\b/i.test(text) ||
      /ke\s+bina|ke\s+bagair|kare\s+bina|chhod\s+kar|hata\s+kar|tod\s+kar|bypass\s+karke|skip\s+karke/i.test(text) ||
      /[\u0900-\u097F]*(बिना|बगैर|बाईपास|छोड़कर)[\u0900-\u097F]*/i.test(text);

    // Concept 3: Deployment / Execution / Modification / Destructive actions
    const hasDeployOrMutate =
      /\b(deploy|deployment|production|prod|release|push|commit|mutate|shell|exec|delete db|drop table)\b/i.test(text) ||
      /[\u0900-\u097F]*(डिप्लॉय|प्रोडक्शन|पुश|कमिट)[\u0900-\u097F]*/i.test(text);

    // Concept 4: Direct explicit unauthorized patterns
    const hasUnauthorizedToken =
      /\b(unauthorized|secretly|directly|force push|rogue|bypass gate|without approval)\b/i.test(text) ||
      /unauthorized\s+(deployment|execution|modify|production)|secretly\s+(deploy|execute|modify)/i.test(text) ||
      /directly\s+deploy\s+to\s+production|deploy\s+to\s+production\s+directly/i.test(text);

    // Concept combinations:
    // A: (Bypass / Without / Ke bina) + (Approval / Gate / Founder)
    const isApprovalBypass = hasBypassToken && (hasApprovalToken || hasFounderToken);

    // B: Unauthorized deployment / Rogue execution
    const isRogueDeployment = hasDeployOrMutate && (isApprovalBypass || hasUnauthorizedToken);

    // C: Prohibited external actions (Spam, unverified financial transfers, Hollywood movies, hacking)
    const isProhibitedOperation =
      /\b(secretly execute|hack|cross-tenant|exfiltrate|send real external spam|real money transfer without authorization|hollywood movie)\b/i.test(text);

    const isRestricted = isApprovalBypass || isRogueDeployment || isProhibitedOperation || hasUnauthorizedToken;

    if (isRestricted) {
      let suggestedSafe = "repo_architecture";
      if (/creative|movie|hollywood|video/i.test(text)) suggestedSafe = "creative_artifact";
      if (/revenue|money|billing/i.test(text)) suggestedSafe = "marketing_seo";

      return {
        allowed: false,
        status: UNIVERSE_STATUS.RESTRICTED,
        truthStatus: "RESTRICTED",
        reason: "This operation is outside GARUDA's authorized capability boundary. Under our Sovereign Governance & Anti-Fabrication Law, bypassing Founder approval, unauthorized production deployments, or rogue operations are strictly blocked.",
        safeAlternative: `I can demonstrate our verified ${suggestedSafe.replace(/_/g, " ")} capability within authorized boundaries.`,
        suggestedDemoKey: suggestedSafe
      };
    }

    return {
      allowed: true,
      status: UNIVERSE_STATUS.VERIFIED
    };
  }

  /**
   * Executes a live demonstration for a target universe.
   */
  async executeUniverseDemo(universeId, options = {}) {
    const universe = this.getUniverse(universeId);
    if (!universe) {
      throw new Error(`Universe ${universeId} not found in Kingdom registry.`);
    }

    const demoKey = universe.demoKey || "creative_artifact";
    const demoResult = await this.orchestrator.executeDemonstration(demoKey, options);

    return {
      universe: {
        id: universe.id,
        name: universe.name,
        code: universe.code,
        status: universe.status,
        themeColor: universe.themeColor
      },
      demoResult
    };
  }
}

const kingdomUniverseTheatre = new KingdomUniverseTheatre();

module.exports = {
  UNIVERSE_STATUS,
  KINGDOM_UNIVERSES,
  KingdomUniverseTheatre,
  kingdomUniverseTheatre
};
