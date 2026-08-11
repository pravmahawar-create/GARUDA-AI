// GARUDA GENERIC LEAD-GEN ENGINE (multi-domain).
// FD-107: config-driven scoring / dedup / opt-out / CSV generation.
// The original insurance services are untouched; this engine is the reusable
// backbone any domain config can drive. Paths are injected per domain so
// every industry keeps its own namespace (data/<domain>-prospects.json etc.).

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getDomain, buildBusinessProfile } = require("./domainConfig");

function resolvePaths(domain, overrides = {}) {
  const ns = domain.namespace || "leads";
  return {
    prospectsPath: overrides.prospectsPath || path.join(__dirname, "..", "..", "..", "data", `${ns}-prospects.json`),
    contactsPath: overrides.contactsPath || path.join(__dirname, "..", "..", "..", "data", `${ns}-contacts.csv`),
    ledgerPath: overrides.ledgerPath || path.join(__dirname, "..", "..", "..", "data", `${ns}-outreach-ledger.json`)
  };
}

function loadJson(file) {
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      return parsed;
    }
  } catch {}
  return null;
}

function saveJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value = "") {
  let digits = String(value || "").replace(/[^0-9]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return digits;
}

function detectSegments(prospect, domain) {
  const haystack = [prospect.businessName, prospect.businessType, prospect.industry, prospect.notes, prospect.name, prospect.firstName, prospect.lastName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const detected = [];
  for (const [segment, def] of Object.entries(domain.segments || {})) {
    let hits = 0;
    for (const signal of def.signals || []) {
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

const GRADES = [
  { min: 80, grade: "HOT", action: "generate_now" },
  { min: 60, grade: "STRONG", action: "generate_now" },
  { min: 40, grade: "POTENTIAL", action: "can_generate" },
  { min: 0, grade: "LOW", action: "review_first" }
];

function scoreProspect(prospect = {}, domain) {
  const email = extractEmail(prospect);
  const segments = detectSegments(prospect, domain);
  let score = 0;
  const signals = [];

  for (const { segment, hits } of segments) {
    const weight = (domain.segments[segment] || {}).weight || 10;
    score += Math.min(weight, hits * 14);
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

  const query = (domain.inferQuery || (() => domain.defaultTopic || ""))(segments);
  const gradeInfo = GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1];
  return {
    id: prospect.id || `PL_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    firstName: String(prospect.firstName || prospect.name || "").trim().split(/\s+/)[0] || "",
    lastName: String(prospect.lastName || "").trim(),
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
  const domain = getDomain(options.domain);
  const paths = resolvePaths(domain, options);
  const store = loadJson(paths.prospectsPath) || { prospects: [] };
  const ledger = loadJson(paths.ledgerPath) || { leads: [] };
  const optedOut = new Set(ledger.leads.filter((l) => l.optedOut).map((l) => l.email));
  const emails = new Set((store.prospects || []).map((p) => p.email));
  const added = [];
  const skipped = [];

  for (const raw of Array.isArray(prospects) ? prospects : [prospects]) {
    const scored = scoreProspect(raw, domain);
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
    const stored = { ...scored, createdAt: new Date().toISOString() };
    store.prospects.push(stored);
    emails.add(scored.email);
    added.push(stored);
  }
  saveJson(paths.prospectsPath, store);
  return { added, skipped, total: store.prospects.length, prospectsPath: paths.prospectsPath };
}

function listProspects(options = {}) {
  const domain = getDomain(options.domain);
  const paths = resolvePaths(domain, options);
  const store = loadJson(paths.prospectsPath) || { prospects: [] };
  let list = (store.prospects || []).slice();
  if (options.minScore !== undefined) list = list.filter((p) => p.score >= Number(options.minScore));
  if (options.status) list = list.filter((p) => p.status === options.status);
  if (options.query) list = list.filter((p) => p.query === options.query);
  list.sort((a, b) => b.score - a.score);
  return list;
}

function generateContactsCsv(options = {}) {
  const domain = getDomain(options.domain);
  const paths = resolvePaths(domain, options);
  const candidates = listProspects({
    minScore: options.minScore !== undefined ? options.minScore : 40,
    domain: domain.id,
    prospectsPath: paths.prospectsPath,
    contactsPath: paths.contactsPath,
    ledgerPath: paths.ledgerPath
  }).filter((p) => p.status === "scored");
  if (!candidates.length) {
    return { generated: 0, candidates: 0, rows: [], contactsPath: paths.contactsPath, reasons: { no_candidates: true } };
  }
  const rows = candidates.map((p) => ({ email: p.email, firstName: p.firstName, lastName: p.lastName, phone: p.phone, query: p.query }));
  const lines = ["email,firstName,lastName,phone,query"];
  for (const row of rows) {
    lines.push([row.email, row.firstName, row.lastName, row.phone, row.query].join(","));
  }
  const csv = lines.join("\n") + "\n";
  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(paths.contactsPath), { recursive: true });
    fs.writeFileSync(paths.contactsPath, csv, "utf8");
    const store = loadJson(paths.prospectsPath) || { prospects: [] };
    for (const email of new Set(rows.map((r) => r.email))) {
      const p = store.prospects.find((x) => x.email === email);
      if (p) p.status = "queued_for_outreach";
    }
    saveJson(paths.prospectsPath, store);
  }
  return { generated: rows.length, candidates: candidates.length, rows, contactsPath: paths.contactsPath, dryRun: options.dryRun === true };
}

function getPipeline(options = {}) {
  const domain = getDomain(options.domain);
  const store = loadJson(resolvePaths(domain, options).prospectsPath) || { prospects: [] };
  const byGrade = {};
  const byQuery = {};
  for (const p of store.prospects || []) {
    byGrade[p.grade] = (byGrade[p.grade] || 0) + 1;
    byQuery[p.query] = (byQuery[p.query] || 0) + 1;
  }
  return {
    total: (store.prospects || []).length,
    hot: (store.prospects || []).filter((p) => p.grade === "HOT").length,
    strong: (store.prospects || []).filter((p) => p.grade === "STRONG").length,
    byGrade,
    byQuery,
    domain: domain.id,
    label: domain.label
  };
}

module.exports = {
  GRADES,
  addProspects,
  buildBusinessProfile,
  detectSegments,
  extractEmail,
  generateContactsCsv,
  getDomain,
  getPipeline,
  listProspects,
  normalizeEmail,
  normalizePhone,
  scoreProspect
};
