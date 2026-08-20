// GARUDA GENERIC PITCH ENGINE (multi-domain).
// FD-107: config-driven pitch assembly. Replaces hardcoded ABSLI-only text with
// domain config (topics -> keywords -> hooks, brand lines). The original
// insurancePitchService stays untouched; this engine is the reusable layer.
// Knowledge chunks (facts/numbers) are still pulled from the domain's knowledge
// namespace and degrade gracefully when no index exists.

const fs = require("fs");
const path = require("path");

const { getDomain } = require("./domainConfig");

function plainText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadKnowledgeChunks(domain, overrides = {}) {
  const indexPath =
    overrides.knowledgeIndexPath || domain.knowledgeIndexPath || "data/knowledge-index.json";
  const resolved = path.isAbsolute(indexPath)
    ? indexPath
    : path.join(__dirname, "..", "..", "..", indexPath);
  try {
    const raw = fs.readFileSync(resolved, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pickRelevantChunks(query, chunks, domain, limit = 6) {
  const q = String(query || "").toLowerCase();
  const keywords = domain.topicKeywords || {};
  const scored = chunks.map((chunk) => {
    const text = plainText(chunk.text).toLowerCase();
    let score = 0;
    const terms = q.split(/\s+/).filter((t) => t.length > 3);
    for (const term of terms) {
      if (text.includes(term)) score += 2;
    }
    for (const topic of Object.keys(keywords)) {
      if (q.includes(topic)) {
        for (const kw of keywords[topic] || []) {
          if (text.includes(kw)) score += 1;
        }
      }
    }
    return { chunk, score };
  });
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunk);
}

function extractFacts(chunks) {
  const facts = [];
  const moneyPattern = /(?:INR|Rs\.?|\u20b9|₹)\s?[\d,]+(?:\.[\d]+)?|\d[\d,]*(?:\.\d+)?\s*(?:%|lakh|lacs|crore|p\.a\.|per annum|years? of|annually)/gi;
  for (const chunk of chunks) {
    const text = plainText(chunk.text);
    const numbers = text.match(moneyPattern) || [];
    const cleanNumbers = numbers
      .map((n) => n.trim())
      .filter((n) => /\d/.test(n) && !/^\d{3,4}$/.test(n.replace(/[^0-9]/g, "")))
      .slice(0, 3);
    const snippet = text.slice(0, 320);
    if (cleanNumbers.length) {
      facts.push({
        source: String(chunk.source || "").replace(/_1782\d+\.pdf/gi, "").replace(/\.pdf/gi, ""),
        snippet,
        numbers: cleanNumbers
      });
    }
  }
  return facts.slice(0, 4);
}

function detectTopic(query = "", domain) {
  const q = String(query || "").toLowerCase();
  const keywords = domain.topicKeywords || {};
  for (const topic of Object.keys(keywords)) {
    if ((keywords[topic] || []).some((kw) => q.includes(kw))) return topic;
  }
  return domain.defaultTopic || (domain.topics && domain.topics[0]) || "general";
}

function buildPitch({ firstName = "", query = "", topic, domainId, chunks, knowledgeIndexPath, locale = "hi" }) {
  const domain = getDomain(domainId);
  const cleanName = String(firstName || "").trim().split(/\s+/)[0] || "";
  const resolvedTopic = topic || detectTopic(query, domain);
  const relevant = pickRelevantChunks(query || resolvedTopic, chunks, domain);
  const facts = extractFacts(relevant);
  const isEn = locale === "en";
  const hooks = isEn ? domain.hooksEn || domain.hooks : domain.hooks;
  const brandLines = isEn ? domain.brandLinesEn || domain.brandLines : domain.brandLines || [];
  const hook = (hooks && hooks[resolvedTopic]) || (hooks && hooks[domain.defaultTopic]);
  const website = domain.website || "garudaos.in";

  const lines = [];
  if (cleanName) lines.push(isEn ? `Hello ${cleanName},` : `Namaste ${cleanName},`);
  if (brandLines[0]) lines.push(brandLines[0]);
  if (hook) lines.push(hook);
  if (facts.length && facts[0].numbers && facts[0].numbers.length) {
    const sample = facts[0].numbers[0];
    const source = facts[0].source;
    lines.push(
      isEn
        ? `These figures are verified from ${domain.label || ""} official documents ("${source}") — exact benefits depend on your plan, terms & conditions, and underwriting.`
        : `Ye figures ${domain.label || ""} ke official document ("${source}") se verified hain — par exact benefits aapke plan, terms & conditions aur underwriting par depend karte hain.`
    );
  }
  if (brandLines[1]) lines.push(brandLines[1]);
  if (brandLines[2]) lines.push(brandLines[2].replace("garudaos.in", website));
  lines.push(
    isEn
      ? `If you're interested, just reply 'yes' and I'll guide you through the next steps.`
      : `Agar interested hain, toh bas reply kijiye 'yes' — main aapko aage guide karta hoon.`
  );
  lines.push(
    isEn
      ? `And if not, no worries — reply 'no' and I won't bother you again.`
      : `Aur agar nahi, toh koi baat nahi — reply 'no' aur main aapko dobara kabhi pareshan nahi karunga.`
  );
  if (brandLines[3]) lines.push(brandLines[3]);
  lines.push(`— GARUDA`);

  return {
    topic: resolvedTopic,
    domain: domain.id,
    body: lines.join("\n\n"),
    factsUsed: facts.map((f) => ({ source: f.source, numbers: f.numbers }))
  };
}

module.exports = {
  buildPitch,
  detectTopic,
  extractFacts,
  loadKnowledgeChunks,
  pickRelevantChunks,
  plainText
};
