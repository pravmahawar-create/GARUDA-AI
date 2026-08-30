export const RINGS = [
  { id: 1, name: "Core Intelligence", blurb: "These universes make GARUDA alive, aware, and capable." },
  { id: 2, name: "Human Empowerment", blurb: "These universes make GARUDA useful in real life." },
  { id: 3, name: "Creative & Digital", blurb: "Flagship creator studios and digital identity systems." },
  { id: 4, name: "Civilization & Future", blurb: "The far-future vision of the GARUDA civilization." }
];

export const STATUS = {
  PRODUCTION_VERIFIED: { label: "VERIFIED & LIVE", color: "#75f4ab" },
  USER_EXECUTABLE: { label: "STUDIO EXECUTABLE", color: "#38bdf8" },
  BACKEND_READY: { label: "BACKEND WIRED", color: "#f5d76e" },
  PLANNED: { label: "ROADMAP", color: "#8d95a7" },
  // Backward-compatibility aliases
  ACTIVE: { label: "VERIFIED & LIVE", color: "#75f4ab" },
  LIVE: { label: "STUDIO EXECUTABLE", color: "#38bdf8" },
  PRIMARY: { label: "CORE OPERATING", color: "#f5d76e" },
  MANDATORY: { label: "GOVERNANCE LOCKED", color: "#f87171" },
  ROADMAP: { label: "ROADMAP", color: "#8d95a7" }
};

function ringOf(num) {
  if (num >= 1 && num <= 9) return 1;
  if (num >= 10 && num <= 18) return 2;
  if (num >= 19 && num <= 23) return 3;
  return 4;
}

const U = (num, name, tagline, icon, modules, opts = {}) => ({
  num,
  name,
  tagline,
  icon,
  modules,
  ring: ringOf(num),
  status: opts.status || "PLANNED",
  flagship: opts.flagship || null,
  note: opts.note || null,
  scope: opts.scope || "founder",
  group: opts.group || null,
  hub: opts.hub || false,
  reportsToRevenue: opts.reportsToRevenue !== false
});

export const UNIVERSES = [
  /* RING 1 — CORE INTELLIGENCE (1-9) */
  U(1, "Knowledge Universe", "Stores and understands all information.", "⬢", [
    "RAG", "Memory graph", "Semantic search", "Document intelligence"
  ], { status: "PRODUCTION_VERIFIED", note: "Backed by the live GARUDA knowledge core and RAG pipeline.", scope: "public" }),

  U(2, "Reasoning Universe", "Thinks through multi-step problems.", "◎", [
    "Logic", "Causality", "Planning", "Trade-offs"
  ], { status: "PRODUCTION_VERIFIED", scope: "public" }),

  U(3, "Memory Universe", "Remembers people, projects, and decisions.", "◌", [
    "Short-term", "Long-term", "Emotional context", "Project continuity"
  ], { status: "PRODUCTION_VERIFIED", note: "Threads and chat memory are live for founder + customer sessions.", scope: "customer" }),

  U(4, "Learning Universe", "Improves from outcomes.", "◈", [
    "Feedback", "Pattern extraction", "Strategy evolution", "Skill growth"
  ], { status: "BACKEND_READY", scope: "founder" }),

  U(5, "Decision Universe", "Chooses actions and evaluates risk.", "✦", [
    "Risk scoring", "Priority engine", "Confidence model", "Approval logic"
  ], { status: "BACKEND_READY", scope: "founder" }),

  U(6, "Automation Universe", "Turns intent into execution.", "⚙", [
    "Workflows", "Schedulers", "Triggers", "Agent orchestration"
  ], { status: "BACKEND_READY", scope: "founder" }),

  U(7, "Communication Universe", "Speaks with humans and systems.", "✉", [
    "Chat", "Email", "Voice", "Multilingual"
  ], { status: "PRODUCTION_VERIFIED", note: "Live public chat, voice dictation & Telegram bot.", scope: "public" }),

  U(8, "Security Universe", "Protects identity and data.", "🛡", [
    "Permissions", "Encryption", "Audit logs", "Scope hashes"
  ], { status: "BACKEND_READY", scope: "founder" }),

  U(9, "Governance Universe", "Ensures control and ethics.", "⛔", [
    "Founder authority", "Policies", "Compliance", "Safe execution"
  ], { status: "PRODUCTION_VERIFIED", note: "Every significant action is founder-gated and audit-trailed.", scope: "founder" }),

  /* RING 2 — HUMAN EMPOWERMENT (10-18) */
  U(10, "Revenue Universe", "Generates income and handles commercial proposals.", "⟡", [
    "Lead discovery", "Proposal engine", "Delivery", "Payments"
  ], { status: "BACKEND_READY", flagship: "Milestone proposals + verified Razorpay checkout", scope: "founder", hub: true }),

  U(11, "Business Universe", "Runs companies, SOPs and intake pipelines.", "▣", [
    "CRM", "Operations", "Analytics", "SOPs"
  ], { status: "BACKEND_READY", scope: "founder", group: "GROW" }),

  U(12, "Finance Universe", "Manages money, P&L, and settlements.", "▤", [
    "Budgeting", "Cash flow", "Settlements", "Escrow verification"
  ], { status: "BACKEND_READY", scope: "founder", group: "GROW" }),

  U(13, "Career Universe", "Grows professionals.", "☰", [
    "Resume", "Interview", "Skill roadmap", "Networking"
  ], { status: "PLANNED", scope: "public", group: "GROW" }),

  U(14, "Education Universe", "Academic intelligence and student research.", "◎", [
    "Vidya Studio", "Theses", "Derivations", "Integrity Audits"
  ], { status: "PRODUCTION_VERIFIED", flagship: "GARUDA Vidya Studio (8,192 Tokens + White PDF)", scope: "public", group: "GROW" }),

  U(15, "Health Universe", "Supports wellbeing.", "◈", [
    "Habits", "Fitness", "Nutrition", "Routines"
  ], { status: "PLANNED", scope: "public", group: "GROW" }),

  U(16, "Relationship Universe", "Strengthens human connections.", "✦", [
    "Reminders", "Context", "Conflict help", "Celebrations"
  ], { status: "PLANNED", scope: "public", group: "GROW" }),

  U(17, "Travel Universe", "Intelligent movement.", "◈", [
    "Planning", "Booking", "Local guides", "Expense tracking"
  ], { status: "PLANNED", scope: "public", group: "GROW" }),

  U(18, "Lifestyle Universe", "Upgrades daily life.", "◈", [
    "Home", "Shopping", "Routines", "Personal systems"
  ], { status: "PLANNED", scope: "public", group: "GROW" }),

  /* RING 3 — CREATIVE & DIGITAL (19-23) */
  U(19, "Creative Universe", "Flagship creator operating system.", "✦", [
    "Ad Copywriting Studio", "Video Blueprints", "Presentation Decks", "White PDF Engine"
  ], { status: "USER_EXECUTABLE", flagship: "GARUDA Creative & Marketing Studio (/studio)", scope: "public", group: "CREATE" }),

  U(20, "Content Universe", "Creates multi-platform content.", "✎", [
    "4-Week Calendars", "Shorts/Reels Scripts", "Multi-Angle Hooks", "Blogs"
  ], { status: "USER_EXECUTABLE", scope: "public", group: "CREATE" }),

  U(21, "Brand Universe", "Builds brand identity.", "◈", [
    "Typography", "Color Systems", "Executive White PDF", "IdentityLock™"
  ], { status: "USER_EXECUTABLE", scope: "public", group: "CREATE" }),

  U(22, "Digital Presence Universe", "Represents the sovereign entity online.", "☰", [
    "Service Portfolios", "Interactive Decks", "SEO Cluster Engine"
  ], { status: "PRODUCTION_VERIFIED", scope: "public", group: "LIVE" }),

  U(23, "Entertainment Universe", "Creates experiences and event campaign engines.", "◈", [
    "13-Day Campaign War Rooms", "Celebrity Hype Blueprints", "RSVP Concierge"
  ], { status: "USER_EXECUTABLE", scope: "public", group: "LIVE" }),

  /* RING 4 — CIVILIZATION & FUTURE (24-27) */
  U(24, "Wealth & Real Estate Universe", "Builder growth, corridor analytics, and deal scoring.", "◈", [
    "Corridor Analysis", "Builder Dossiers", "Lead Scoring", "WhatsApp Concierge"
  ], { status: "USER_EXECUTABLE", note: "Real Estate Growth OS accessible via Founder workforce & Studio.", scope: "founder", group: "LIVE" }),

  U(25, "Innovation Universe", "Autonomous engineering R&D.", "◎", [
    "R&D", "Self-Build Engine", "Discovery engine"
  ], { status: "BACKEND_READY", scope: "founder", group: "FUTURE" }),

  U(26, "Collective Intelligence Universe", "30-Agent workforce and multi-brain swarm.", "◌", [
    "30 Sector Hunters", "Workforce Router", "Deterministic Task Handlers"
  ], { status: "USER_EXECUTABLE", note: "Controlled by Founder via High Command Center.", scope: "founder", group: "FUTURE" }),

  U(27, "Consciousness & Future Universe", "Philosophical and exploratory.", "◈", [
    "Intent understanding", "Values", "Human-AI coexistence"
  ], { status: "PLANNED", scope: "public", group: "FUTURE" })
];

export const LOCKED_UNIVERSE_COUNT = 7;

export const getUniverseByNum = (num) => UNIVERSES.find((u) => u.num === num);
export const getUniversesByRing = (ringId) => UNIVERSES.filter((u) => u.ring === ringId);
export const getUniversesByScope = (scope) => UNIVERSES.filter((u) => u.scope === scope);
export const getFounderUniverses = () => UNIVERSES.filter((u) => u.scope === "founder");
export const getPublicUniverses = () => UNIVERSES.filter((u) => u.scope === "public");
export const getRevenueHub = () => UNIVERSES.find((u) => u.hub === true) || null;
export const ALL_UNIVERSES = UNIVERSES;