export const RINGS = [
  { id: 1, name: "Core Intelligence", blurb: "These universes make GARUDA alive, aware, and capable." },
  { id: 2, name: "Human Empowerment", blurb: "These universes make GARUDA useful in real life." },
  { id: 3, name: "Creative & Digital", blurb: "Flagship creator studios and digital identity systems." },
  { id: 4, name: "Civilization & Future", blurb: "The far-future vision of the GARUDA civilization." }
];

export const STATUS = {
  ACTIVE: { label: "ACTIVE", color: "#75f4ab" },
  PRIMARY: { label: "PRIMARY", color: "#f5d76e" },
  MANDATORY: { label: "MANDATORY", color: "#f87171" },
  LOCKED: { label: "ARCHITECTURALLY LOCKED", color: "#7dd3fc" },
  ROADMAP: { label: "COMING SOON", color: "#8d95a7" }
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
  status: opts.status || "ROADMAP",
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
  ], { status: "ACTIVE", note: "Backed by the live GARUDA knowledge core and RAG pipeline.", scope: "founder" }),

  U(2, "Reasoning Universe", "Thinks through problems.", "◎", [
    "Logic", "Causality", "Planning", "Trade-offs"
  ], { status: "ACTIVE", scope: "founder" }),

  U(3, "Memory Universe", "Remembers people, projects, and decisions.", "◌", [
    "Short-term", "Long-term", "Emotional context", "Project continuity"
  ], { status: "ACTIVE", note: "Threads and chat memory are live for founder + customer sessions.", scope: "founder" }),

  U(4, "Learning Universe", "Improves from outcomes.", "◈", [
    "Feedback", "Pattern extraction", "Strategy evolution", "Skill growth"
  ], { scope: "founder" }),

  U(5, "Decision Universe", "Chooses actions.", "✦", [
    "Risk scoring", "Priority engine", "Confidence model", "Approval logic"
  ], { scope: "founder" }),

  U(6, "Automation Universe", "Turns intent into execution.", "⚙", [
    "Workflows", "Schedulers", "Triggers", "Agent orchestration"
  ], { status: "ACTIVE", note: "Schedulers and governed workflows are being wired into delivery.", scope: "founder" }),

  U(7, "Communication Universe", "Speaks with humans and systems.", "✉", [
    "Chat", "Email", "Voice", "Multilingual"
  ], { status: "ACTIVE", note: "Live public chat + SMTP email channel verified.", scope: "founder" }),

  U(8, "Security Universe", "Protects identity and data.", "🛡", [
    "Permissions", "Encryption", "Audit logs", "Threat detection"
  ], { scope: "founder" }),

  U(9, "Governance Universe", "Ensures control and ethics.", "⛔", [
    "Founder authority", "Policies", "Compliance", "Safe execution"
  ], { status: "MANDATORY", note: "Every significant action is founder-gated and audit-trailed.", scope: "founder" }),

  /* RING 2 — HUMAN EMPOWERMENT (10-18) */
  U(10, "Revenue Universe", "Generate income.", "⟡", [
    "Lead discovery", "Proposal engine", "Delivery", "Payments"
  ], { status: "PRIMARY", flagship: "Organic lead-gen + verified payment link (Razorpay)", note: "Primary growth universe — live payment page wired to the founder brand.", scope: "founder", hub: true }),

  U(11, "Business Universe", "Run companies.", "▣", [
    "CRM", "Operations", "Analytics", "SOPs"
  ], { scope: "public", group: "GROW" }),

  U(12, "Finance Universe", "Manage money.", "▤", [
    "Budgeting", "Cash flow", "Forecasting", "Investments"
  ], { scope: "public", group: "GROW" }),

  U(13, "Career Universe", "Grow professionally.", "☰", [
    "Resume", "Interview", "Skill roadmap", "Networking"
  ], { scope: "public", group: "GROW" }),

  U(14, "Education Universe", "Learn anything.", "◎", [
    "Courses", "Tutoring", "Exams", "Research"
  ], { scope: "public", group: "GROW" }),

  U(15, "Health Universe", "Support wellbeing.", "◈", [
    "Habits", "Fitness", "Nutrition", "Medical records"
  ], { scope: "public", group: "GROW" }),

  U(16, "Relationship Universe", "Strengthen human connections.", "✦", [
    "Reminders", "Context", "Conflict help", "Celebrations"
  ], { scope: "public", group: "GROW" }),

  U(17, "Travel Universe", "Move intelligently.", "◈", [
    "Planning", "Booking", "Local guides", "Expense tracking"
  ], { scope: "public", group: "GROW" }),

  U(18, "Lifestyle Universe", "Upgrade daily life.", "◈", [
    "Home", "Shopping", "Routines", "Personal systems"
  ], { scope: "public", group: "GROW" }),

  /* RING 3 — CREATIVE & DIGITAL (19-23) */
  U(19, "Creative Universe", "Flagship creator operating system.", "✦", [
    "Ad Copywriting Studio", "Vector & SVG Creative Engine", "Video Blueprint Studio", "IdentityLock™ Governance", "Multi-Angle Campaign Hooks", "SEO Cluster Architecture"
  ], { status: "LIVE", flagship: "Multi-Angle Creative Studio + IdentityLock™ Engine", note: "Autonomous creative generation, multi-format ad copy, and IdentityLock brand governance.", scope: "public", group: "CREATE" }),

  U(20, "Content Universe", "Create for every platform.", "✎", [
    "YouTube", "Instagram", "LinkedIn", "Blogs", "Podcasts", "Shorts/Reels"
  ], { scope: "public", group: "LIVE" }),

  U(21, "Brand Universe", "Build identity.", "◈", [
    "Logo", "Color system", "Typography", "Brand voice", "IdentityLock™"
  ], { scope: "public", group: "LIVE" }),

  U(22, "Digital Presence Universe", "Represent the founder online.", "☰", [
    "Social management", "DM handling", "Scheduling", "Reputation monitoring"
  ], { scope: "public", group: "LIVE" }),

  U(23, "Entertainment Universe", "Create experiences.", "◈", [
    "Games", "Interactive stories", "Virtual characters", "AR/VR experiences"
  ], { scope: "public", group: "LIVE" }),

  /* RING 4 — CIVILIZATION & FUTURE (24-27) */
  U(24, "Wealth & Real Estate Universe", "Assets, developers, and growth.", "◈", [
    "Real Estate Growth OS", "Builder Acquisition Engine", "Lead Scoring & Deduplication", "Site Visit Orchestration"
  ], { status: "LIVE", note: "Real Estate Growth OS, Developer Dossiers & Conversion Intelligence.", scope: "founder", group: "LIVE" }),

  U(25, "Innovation Universe", "Invent new systems.", "◎", [
    "R&D", "Patents", "Experimentation", "Discovery engine"
  ], { scope: "public", group: "FUTURE" }),

  U(26, "Collective Intelligence Universe", "Many minds working together.", "◌", [
    "Agent swarms", "Human collaboration", "Knowledge networks", "Shared memory"
  ], { scope: "public", group: "FUTURE" }),

  U(27, "Consciousness & Future Universe", "Philosophical and exploratory.", "◈", [
    "Intent understanding", "Values", "Meaning", "Human-AI coexistence"
  ], { scope: "public", group: "FUTURE" })
];

export const LOCKED_UNIVERSE_COUNT = 8;

export const getUniverseByNum = (num) => UNIVERSES.find((u) => u.num === num);
export const getUniversesByRing = (ringId) => UNIVERSES.filter((u) => u.ring === ringId);
export const getUniversesByScope = (scope) => UNIVERSES.filter((u) => u.scope === scope);
export const getFounderUniverses = () => UNIVERSES.filter((u) => u.scope === "founder");
export const getPublicUniverses = () => UNIVERSES.filter((u) => u.scope === "public");
export const getRevenueHub = () => UNIVERSES.find((u) => u.hub === true) || null;

export const ACTIVE_GATE = ["ACTIVE", "PRIMARY", "MANDATORY", "LOCKED"];

export default UNIVERSES;