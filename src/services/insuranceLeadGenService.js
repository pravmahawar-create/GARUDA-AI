const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let PROSPECTS_PATH = path.join(__dirname, "..", "..", "data", "insurance-prospects.json");
let CONTACTS_PATH = path.join(__dirname, "..", "..", "data", "insurance-contacts.csv");
let LEDGER_PATH = path.join(__dirname, "..", "..", "data", "insurance-outreach-ledger.json");

const QUERIES = ["family_protection", "savings_investment", "child_education", "cancer_health", "tax"];

const SEGMENT_SIGNALS = {
  business_owner: [
    "shop", "store", "business", "owner", "propriet", "trader", "dealer", "enterprise",
    "manufacturer", "exporter", "importer", "wholesale", "retail", "gst", "msme",
    "sole", "partnership", "private limited", "pvt ltd", "llp", "founder", "director",
    "clinic", "studio", "salon", "parlour", "cold stor", "godown", "workshop",
    "restaurant", "cafe", "contractor", "builder", "auto", "garage", "trading",
    "traders", "textile", "garment", "handloom", "pharma", "distribution", "distributor",
    "agency", "firm", "industries", "industries", "processors", "mills", "agencies"
  ],
  parent: [
    "children", "child", "kids", "son", "daughter", "family", "school", "college"
  ],
  salaried: [
    "employee", "salaried", "professional", "engineer", "manager", "officer", "bank",
    "pvt ltd employee", "mnc", "it", "consultant", "chartered", "doctor", "lawyer"
  ],
  retiree: ["retired", "pension", "senior citizen"]
};

const SEGMENT_WEIGHTS = {
  business_owner: 28,
  parent: 18,
  salaried: 12,
  retiree: 8
};

const GRADES = [
  { min: 80, grade: "HOT", action: "generate_now" },
  { min: 60, grade: "STRONG", action: "generate_now" },
  { min: 40, grade: "POTENTIAL", action: "can_generate" },
  { min: 0, grade: "LOW", action: "review_first" }
];

function setPaths({ prospectsPath, contactsPath, ledgerPath } = {}) {
  if (prospectsPath) PROSPECTS_PATH = prospectsPath;
  if (contactsPath) CONTACTS_PATH = contactsPath;
  if (ledgerPath) LEDGER_PATH = ledgerPath;
}

function loadProspects() {
  try {
    if (fs.existsSync(PROSPECTS_PATH)) {
      const raw = fs.readFileSync(PROSPECTS_PATH, "utf8");
      const parsed = JSON.parse(raw);
      return { prospects: Array.isArray(parsed.prospects) ? parsed.prospects : [] };
    }
  } catch {}
  return { prospects: [] };
}

function saveProspects(store) {
  fs.mkdirSync(path.dirname(PROSPECTS_PATH), { recursive: true });
  fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(store, null, 2), "utf8");
}

function loadLedger() {
  try {
    if (fs.existsSync(LEDGER_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
      return { leads: Array.isArray(parsed.leads) ? parsed.leads : [] };
    }
  } catch {}
  return { leads: [] };
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value = "") {
  let digits = String(value || "").replace(/[^0-9]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return digits;
}

function detectSegments(prospect) {
  const haystack = [
    prospect.businessName,
    prospect.businessType,
    prospect.industry,
    prospect.notes,
    prospect.name,
    prospect.firstName,
    prospect.lastName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const detected = [];
  for (const [segment, signals] of Object.entries(SEGMENT_SIGNALS)) {
    let hits = 0;
    for (const signal of signals) {
      if (haystack.includes(signal)) hits += 1;
    }
    if (hits > 0) detected.push({ segment, hits });
  }
  detected.sort((a, b) => b.hits - a.hits);
  return detected;
}

function extractEmail(prospect) {
  const raw = normalizeEmail(prospect.email || prospect.website || "");
  const m = String(raw).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return m ? m[0] : raw;
}

function inferQuery(segments) {
  const primary = segments[0] ? segments[0].segment : "";
  const hasChildren = segments.some((s) => s.segment === "parent");
  if (primary === "business_owner" && hasChildren) return "child_education";
  if (primary === "business_owner") return "savings_investment";
  if (hasChildren) return "child_education";
  if (primary === "retiree") return "savings_investment";
  if (primary === "salaried") return "family_protection";
  return "family_protection";
}

function scoreProspect(prospect = {}) {
  const email = extractEmail(prospect);
  const segments = detectSegments(prospect);
  let score = 0;
  const signals = [];

  for (const { segment, hits } of segments) {
    score += Math.min(SEGMENT_WEIGHTS[segment] || 0, hits * 14);
    signals.push(`${segment}(${hits})`);
  }

  if (email) {
    score += 20;
    signals.push("email_found");
  }
  if (normalizePhone(prospect.phone).length >= 10) {
    score += 10;
    signals.push("phone_10+");
  }
  if (prospect.website || prospect.gstin) {
    score += 8;
    signals.push("gstin_or_website");
  }
  if (prospect.businessName && prospect.city) {
    score += 5;
    signals.push("named_business_in_city");
  }
  if (/market|main road|high street|mall|complex|industrial/i.test(String(prospect.address || prospect.city || ""))) {
    score += 6;
    signals.push("prime_location");
  }

  const query = inferQuery(segments);
  const gradeInfo = GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1];
  const firstName = String(prospect.firstName || prospect.name || "").trim().split(/\s+/)[0] || "";
  const lastName = String(prospect.lastName || "").trim();

  return {
    id: prospect.id || `PL_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    firstName,
    lastName,
    email,
    phone: normalizePhone(prospect.phone),
    businessName: String(prospect.businessName || "").trim(),
    city: String(prospect.city || "").trim(),
    segments: segments.map((s) => s.segment),
    score: Math.min(99, score),
    grade: gradeInfo.grade,
    action: gradeInfo.action,
    query,
    signals,
    source: String(prospect.source || "public_research").trim(),
    notes: String(prospect.notes || "").trim(),
    status: "scored"
  };
}

function addProspects(prospects = [], options = {}) {
  const store = loadProspects();
  const ledger = loadLedger();
  const optedOut = new Set(ledger.leads.filter((l) => l.optedOut).map((l) => l.email));
  const emails = new Set(store.prospects.map((p) => p.email));
  const added = [];
  const skipped = [];

  for (const raw of Array.isArray(prospects) ? prospects : [prospects]) {
    const scored = scoreProspect(raw);
    if (!scored.email) {
      skipped.push({ ...scored, reason: "no_email" });
      continue;
    }
    if (emails.has(scored.email)) {
      skipped.push({ ...scored, reason: "duplicate" });
      continue;
    }
    if (optedOut.has(scored.email)) {
      skipped.push({ ...scored, reason: "opted_out" });
      continue;
    }
    if (options.minScore !== undefined && scored.score < Number(options.minScore)) {
      skipped.push({ ...scored, reason: "below_min_score" });
      continue;
    }
    const stored = {
      ...scored,
      createdAt: options.now ? new Date(options.now).toISOString() : new Date().toISOString()
    };
    store.prospects.push(stored);
    emails.add(scored.email);
    added.push(stored);
  }

  saveProspects(store);
  return { added, skipped, total: store.prospects.length, prospectsPath: PROSPECTS_PATH };
}

function listProspects(options = {}) {
  const store = loadProspects();
  let list = store.prospects.slice();
  if (options.minScore !== undefined) list = list.filter((p) => p.score >= Number(options.minScore));
  if (options.status) list = list.filter((p) => p.status === options.status);
  if (options.query) list = list.filter((p) => p.query === options.query);
  list.sort((a, b) => b.score - a.score);
  return list;
}

function generateContactsCsv(options = {}) {
  const candidates = listProspects({ minScore: options.minScore !== undefined ? options.minScore : 40 })
    .filter((p) => p.status === "scored");
  if (!candidates.length) {
    return { generated: 0, candidates: 0, rows: [], contactsPath: CONTACTS_PATH, reasons: { no_candidates: true } };
  }

  const rows = candidates.map((p) => ({
    email: p.email,
    firstName: p.firstName,
    lastName: p.lastName,
    phone: p.phone,
    query: p.query
  }));

  const lines = ["email,firstName,lastName,phone,query"];
  for (const row of rows) {
    lines.push([row.email, row.firstName, row.lastName, row.phone, row.query].join(","));
  }

  const csv = lines.join("\n") + "\n";
  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(CONTACTS_PATH), { recursive: true });
    fs.writeFileSync(CONTACTS_PATH, csv, "utf8");
    const store = loadProspects();
    for (const email of new Set(rows.map((r) => r.email))) {
      const p = store.prospects.find((x) => x.email === email);
      if (p) p.status = "queued_for_outreach";
    }
    saveProspects(store);
  }

  return {
    generated: rows.length,
    candidates: candidates.length,
    rows,
    contactsPath: CONTACTS_PATH,
    dryRun: options.dryRun === true
  };
}

function getPipeline() {
  const store = loadProspects();
  const counts = {};
  for (const p of store.prospects) {
    counts[p.grade] = (counts[p.grade] || 0) + 1;
  }
  const byQuery = {};
  for (const p of store.prospects) {
    byQuery[p.query] = (byQuery[p.query] || 0) + 1;
  }
  return {
    total: store.prospects.length,
    hot: store.prospects.filter((p) => p.grade === "HOT").length,
    strong: store.prospects.filter((p) => p.grade === "STRONG").length,
    scored: store.prospects.filter((p) => p.status === "scored").length,
    queued: store.prospects.filter((p) => p.status === "queued_for_outreach").length,
    byGrade: counts,
    byQuery,
    prospectsPath: PROSPECTS_PATH
  };
}

function removeProspect(email) {
  const store = loadProspects();
  const before = store.prospects.length;
  store.prospects = store.prospects.filter((p) => p.email !== normalizeEmail(email));
  saveProspects(store);
  return { removed: before - store.prospects.length };
}

module.exports = {
  QUERIES,
  addProspects,
  extractEmail,
  generateContactsCsv,
  getPipeline,
  listProspects,
  removeProspect,
  scoreProspect,
  setPaths
};