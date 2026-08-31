const fs = require("fs");
const path = require("path");

const CASES_FILE = path.join(process.cwd(), "data", "smart", "cases.json");

function ensureDir() {
  const dir = path.dirname(CASES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadCases() {
  ensureDir();
  if (!fs.existsSync(CASES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CASES_FILE, "utf8")); } catch { return []; }
}

function saveCases(cases) {
  ensureDir();
  fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2));
}

function addCase(input) {
  const cases = loadCases();
  const newCase = {
    id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    problem: input.problem || "",
    category: input.category || "general",
    keywords: extractKeywords(input.problem || ""),
    solution: input.solution || "",
    outcome: input.outcome || "success",
    files: Array.isArray(input.files) ? input.files : [],
    tags: Array.isArray(input.tags) ? input.tags : [],
    timesMatched: 0
  };
  cases.push(newCase);
  saveCases(cases);
  return newCase;
}

function findSimilarCases(problem, limit = 5) {
  const cases = loadCases();
  const keywords = extractKeywords(problem);
  if (keywords.length === 0) return [];

  const scored = cases.map((c) => {
    const caseKeywords = new Set(c.keywords);
    const matchCount = keywords.filter((k) => caseKeywords.has(k)).length;
    const similarity = matchCount / Math.max(1, Math.max(keywords.length, c.keywords.length));
    return { case: c, similarity };
  });

  return scored.filter((s) => s.similarity > 0.2).sort((a, b) => b.similarity - a.similarity).slice(0, limit).map((s) => ({ ...s.case, matchScore: s.similarity }));
}

function extractKeywords(text) {
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "with", "by", "and", "or", "not", "it", "this", "that", "me", "my", "we", "you", "your", "kya", "hai", "ka", "ki", "ke", "ko", "se", "ne", "aur", "ya", "jo", "ye", "wo", "mein", "par", "kaa"]);
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
}

function updateCaseStats(caseId) {
  const cases = loadCases();
  const c = cases.find((x) => x.id === caseId);
  if (c) { c.timesMatched++; saveCases(cases); }
}

function getCaseStats() {
  const cases = loadCases();
  const byCategory = {};
  const byOutcome = {};
  for (const c of cases) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    byOutcome[c.outcome] = (byOutcome[c.outcome] || 0) + 1;
  }
  return { total: cases.length, byCategory, byOutcome };
}

function clearCases() {
  ensureDir();
  fs.writeFileSync(CASES_FILE, "[]", "utf8");
}

module.exports = { addCase, findSimilarCases, loadCases, getCaseStats, clearCases, extractKeywords, updateCaseStats };
