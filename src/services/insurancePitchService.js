const fs = require("fs");
const path = require("path");

const KNOWLEDGE_INDEX_PATH = path.join(__dirname, "..", "..", "data", "knowledge-index.json");

const TOPIC_KEYWORDS = {
  family_protection: [
    "term", "protection", "death benefit", "sum assured", "family", "nominee",
    "life cover", "risk cover", "financial protection", "income protection"
  ],
  savings_investment: [
    "savings", "investment", "wealth", "guaranteed", "maturity", "returns",
    "annuity", "pension", "accumulation", "growth"
  ],
  child_education: [
    "child", "education", "school", "college", "future", "kids"
  ],
  cancer_health: [
    "cancer", "health", "critical illness", "hospital", "medical", "shield"
  ],
  tax: ["tax", "section 80c", "income tax", "10(10d)"]
};

function loadKnowledgeChunks() {
  try {
    const raw = fs.readFileSync(KNOWLEDGE_INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function plainText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickRelevantChunks(query, chunks, limit = 6) {
  const q = String(query || "").toLowerCase();
  const scored = chunks.map((chunk) => {
    const text = plainText(chunk.text).toLowerCase();
    let score = 0;
    const terms = q.split(/\s+/).filter((t) => t.length > 3);
    for (const term of terms) {
      if (text.includes(term)) score += 2;
    }
    for (const keyword of Object.keys(TOPIC_KEYWORDS)) {
      if (q.includes(keyword)) {
        for (const kw of TOPIC_KEYWORDS[keyword]) {
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

function detectTopic(query = "") {
  const q = String(query || "").toLowerCase();
  for (const topic of Object.keys(TOPIC_KEYWORDS)) {
    if (TOPIC_KEYWORDS[topic].some((kw) => q.includes(kw))) return topic;
  }
  return "family_protection";
}

const TOPIC_HOOKS = {
  family_protection:
    "Aapke parivaar ki suraksha ka matlab sirf savings nahi — jab paisa sahi jagah rakha jaye, toh wo khud aapke family ka shield ban jata hai.",
  savings_investment:
    "Investment ₹30,000 se shuru hota hai — aur saath me aata hai growth, suraksha, aur flexibility. Koi rigid fixed amount nahi.",
  child_education:
    "Bachpan ke sapne aapke saath aur aapke baad bhi pura ho sakein — isliye aaj ka smart investment kal ka shield banta hai.",
  cancer_health:
    "Health aur financial stability ek hi sikke ke do pehlu hain — medical emergency ke samay aapki taraf jo khada ho, wahi asli suraksha hai.",
  tax:
    "Tax bachana ek smart financial move hai — aur ye kuch plans ke saath naturally juda hua hai."
};

function buildPitch({ firstName = "", query = "", topic, chunks }) {
  const cleanName = String(firstName || "").trim().split(/\s+/)[0] || "";
  const resolvedTopic = topic || detectTopic(query);
  const relevant = pickRelevantChunks(query || resolvedTopic, chunks);
  const facts = extractFacts(relevant);
  const hook = TOPIC_HOOKS[resolvedTopic] || TOPIC_HOOKS.savings_investment;

  const lines = [];
  if (cleanName) lines.push(`Namaste ${cleanName},`);
  lines.push(`Mai GARUDA hoon — ek AI Financial Advisor, aur Aditya Birla Sun Life (ABSLI) ka official financial partner.`);
  lines.push(hook);
  lines.push(`Ye koi typical sales pitch nahi hai. GARUDA aapko ABSLI ke genuine plans ka simple, transparent saar deta hai — investment ₹30,000 se shuru hota hai, usi investment me aapki suraksha included hai (10x tak ka protection cover), koi rigid fixed amount nahi, aur multiple benefits ke saath.`);
  if (facts.length && facts[0].numbers && facts[0].numbers.length) {
    const sample = facts[0].numbers[0];
    const source = facts[0].source.replace(/^ABSLI /i, "ABSLI ");
    lines.push(`Ye figures ABSLI ke official document ("${source}") se verified hain — par exact benefits aapke plan, terms & conditions aur underwriting par depend karte hain.`);
  }
  lines.push(`Koi pressure nahi, koi jhutha wada nahi. Sirf sahi jaankari — kyunki suraksha tabhi asli hai jab wo transparent ho.`);
  lines.push(`Aur haan — poori detail aap garudaos.in par bhi dekh sakte hain.`);
  lines.push(`Agar interested hain, toh bas reply kijiye 'yes' — main aapko aage guide karta hoon.`);
  lines.push(`Aur agar nahi, toh koi baat nahi — reply 'no' aur main aapko dobara kabhi pareshan nahi karunga.`);
  lines.push(`— GARUDA`);

  return {
    topic: resolvedTopic,
    body: lines.join("\n\n"),
    factsUsed: facts.map((f) => ({ source: f.source, numbers: f.numbers }))
  };
}

module.exports = {
  TOPIC_KEYWORDS,
  TOPIC_HOOKS,
  buildPitch,
  detectTopic,
  extractFacts,
  loadKnowledgeChunks,
  pickRelevantChunks
};
