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
  note: opts.note || null
});

export const UNIVERSES = [
  /* RING 1 — CORE INTELLIGENCE (1-9) */
  U(1, "Knowledge Universe", "Stores and understands all information.", "⬢", [
    "RAG", "Memory graph", "Semantic search", "Document intelligence"
  ], { status: "ACTIVE", note: "Backed by the live GARUDA knowledge core and RAG pipeline." }),

  U(2, "Reasoning Universe", "Thinks through problems.", "◎", [
    "Logic", "Causality", "Planning", "Trade-offs"
  ], { status: "ACTIVE" }),

  U(3, "Memory Universe", "Remembers people, projects, and decisions.", "◌", [
    "Short-term", "Long-term", "Emotional context", "Project continuity"
  ], { status: "ACTIVE", note: "Threads and chat memory are live for founder + customer sessions." }),

  U(4, "Learning Universe", "Improves from outcomes.", "◈", [
    "Feedback", "Pattern extraction", "Strategy evolution", "Skill growth"
  ]),

  U(5, "Decision Universe", "Chooses actions.", "✦", [
    "Risk scoring", "Priority engine", "Confidence model", "Approval logic"
  ]),

  U(6, "Automation Universe", "Turns intent into execution.", "⚙", [
    "Workflows", "Schedulers", "Triggers", "Agent orchestration"
  ], { status: "ACTIVE", note: "Schedulers and governed workflows are being wired into delivery." }),

  U(7, "Communication Universe", "Speaks with humans and systems.", "✉", [
    "Chat", "Email", "Voice", "Multilingual"
  ], { status: "ACTIVE", note: "Live public chat + SMTP email channel verified." }),

  U(8, "Security Universe", "Protects identity and data.", "🛡", [
    "Permissions", "Encryption", "Audit logs", "Threat detection"
  ]),

  U(9, "Governance Universe", "Ensures control and ethics.", "⛔", [
    "Founder authority", "Policies", "Compliance", "Safe execution"
  ], { status: "MANDATORY", note: "Every significant action is founder-gated and audit-trailed." }),

  /* RING 2 — HUMAN EMPOWERMENT (10-18) */
  U(10, "Revenue Universe", "Generate income.", "⟡", [
    "Lead discovery", "Proposal engine", "Delivery", "Payments"
  ], { status: "PRIMARY", flagship: "Organic lead-gen + verified payment link (Razorpay)", note: "Primary growth universe — live payment page wired to the founder brand." }),

  U(11, "Business Universe", "Run companies.", "▣", [
    "CRM", "Operations", "Analytics", "SOPs"
  ]),

  U(12, "Finance Universe", "Manage money.", "▤", [
    "Budgeting", "Cash flow", "Forecasting", "Investments"
  ]),

  U(13, "Career Universe", "Grow professionally.", "☰", [
    "Resume", "Interview", "Skill roadmap", "Networking"
  ]),

  U(14, "Education Universe", "Learn anything.", "◎", [
    "Courses", "Tutoring", "Exams", "Research"
  ]),

  U(15, "Health Universe", "Support wellbeing.", "◈", [
    "Habits", "Fitness", "Nutrition", "Medical records"
  ]),

  U(16, "Relationship Universe", "Strengthen human connections.", "✦", [
    "Reminders", "Context", "Conflict help", "Celebrations"
  ]),

  U(17, "Travel Universe", "Move intelligently.", "◈", [
    "Planning", "Booking", "Local guides", "Expense tracking"
  ]),

  U(18, "Lifestyle Universe", "Upgrade daily life.", "◈", [
    "Home", "Shopping", "Routines", "Personal systems"
  ]),

  /* RING 3 — CREATIVE & DIGITAL (19-23) */
  U(19, "Creative Universe", "Flagship creator operating system.", "✦", [
    "Image Studio", "Video Studio", "Music Studio", "Voice Studio", "Writing Studio", "Design Studio"
  ], { status: "LOCKED", flagship: "One-Tap Composer + One-Tap Film Creator", note: "The most detailed universe in the original vision — architecturally locked for progressive build." }),

  U(20, "Content Universe", "Create for every platform.", "✎", [
    "YouTube", "Instagram", "LinkedIn", "Blogs", "Podcasts", "Shorts/Reels"
  ]),

  U(21, "Brand Universe", "Build identity.", "◈", [
    "Logo", "Color system", "Typography", "Brand voice", "IdentityLock™"
  ]),

  U(22, "Digital Presence Universe", "Represent the founder online.", "☰", [
    "Social management", "DM handling", "Scheduling", "Reputation monitoring"
  ]),

  U(23, "Entertainment Universe", "Create experiences.", "◈", [
    "Games", "Interactive stories", "Virtual characters", "AR/VR experiences"
  ]),

  /* RING 4 — CIVILIZATION & FUTURE (24-27) */
  U(24, "Wealth Universe", "Assets and legacy.", "◈", [
    "Real estate", "Construction", "Asset intelligence", "Generational planning"
  ], { status: "LOCKED", note: "Architecturally locked in the original vision." }),

  U(25, "Innovation Universe", "Invent new systems.", "◎", [
    "R&D", "Patents", "Experimentation", "Discovery engine"
  ]),

  U(26, "Collective Intelligence Universe", "Many minds working together.", "◌", [
    "Agent swarms", "Human collaboration", "Knowledge networks", "Shared memory"
  ]),

  U(27, "Consciousness & Future Universe", "Philosophical and exploratory.", "◈", [
    "Intent understanding", "Values", "Meaning", "Human-AI coexistence"
  ])
];

export const LOCKED_UNIVERSE_COUNT = 8;

export const getUniverseByNum = (num) => UNIVERSES.find((u) => u.num === num);
export const getUniversesByRing = (ringId) => UNIVERSES.filter((u) => u.ring === ringId);

export const ACTIVE_GATE = ["ACTIVE", "PRIMARY", "MANDATORY", "LOCKED"];

export default UNIVERSES;