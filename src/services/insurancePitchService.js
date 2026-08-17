const fs = require("fs");
const path = require("path");

const KNOWLEDGE_INDEX_PATH = path.join(__dirname, "..", "..", "data", "knowledge-index.json");
// Tracked enrichment chunks (ABSLI website + Activ One NXT) that survive
// redeploys even when the gitignored data/ folder is rebuilt.
const STATIC_KNOWLEDGE_PATH = path.join(__dirname, "..", "knowledge", "absl-knowledge.json");

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
  let combined = [];
  try {
    const raw = fs.readFileSync(KNOWLEDGE_INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) combined = combined.concat(parsed);
  } catch {
    // data/ may be absent on fresh deploys — fall through to static chunks.
  }
  try {
    const raw = fs.readFileSync(STATIC_KNOWLEDGE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) combined = combined.concat(parsed);
  } catch {}
  return combined;
}

function plainText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickRelevantChunks(query, chunks, limit = 6) {
  const q = String(query || "").toLowerCase();
  const terms = q.split(/\s+/).filter((t) => t.length > 3);

  // Bigram/trigram phrases from the query get a strong boost so specific
  // product names (e.g. "activ one nxt", "super term plan") win over large
  // brochure documents that merely share generic words.
  const phrases = [];
  for (const size of [3, 2]) {
    for (let i = 0; i + size <= terms.length; i++) {
      const phrase = terms.slice(i, i + size).join(" ");
      if (phrase.length > 8) phrases.push(phrase);
    }
  }

  const scored = chunks.map((chunk) => {
    const text = plainText(chunk.text).toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (text.includes(term)) score += 2;
    }
    for (const phrase of phrases) {
      if (text.includes(phrase)) score += 6;
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
      .filter((n) => {
        if (!/\d/.test(n)) return false;
        const digits = n.replace(/[^0-9]/g, "");
        const hasCurrency = /(?:INR|Rs\.?|\u20b9|₹)/.test(n);
        const hasUnit = /(?:%|lakh|lacs|crore|p\.a\.|per annum|years|annually)/.test(n);
        // Bare 3-4 digit numbers without currency/unit are page numbers/IDs → drop.
        if (!hasCurrency && !hasUnit && /^\d{3,4}$/.test(digits)) return false;
        return true;
      })
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
    "Sabse pehle ek seedhi baat — aapke parivaar ki suraksha se badhkar koi zimmedari nahi hoti. Aur achhi baat ye hai ki ise banking chahiye na hi koi jhanjhat, bas ek smart soch. Jab aapke paas ho toh aapke parivaar ko aage badhne mein koi rukawat na aaye — isi soch ke saath main aapko kuch samjhana chahta hoon, bilkul aaram se, apne jaisa.",
  savings_investment:
    "Paisa sirf kamaana nahi, usse sahi jagah rakhna bhi ek kala hai — aur is kala mein aapka saathi banna mere liye khushi ki baat hai. Investment ₹30,000 se shuru hota hai, par isse zyada important hai aapka comfort — koi rigid fixed amount nahi, jo aapke hisaab se chale. Aaj se thoda sa bhi shuru karo, kal wahi aapke kaam aayega.",
  child_education:
    "Bachpan ke sapne toh kuch aise hote hain — ki aapke bachche jab bade ho, toh unhe kisi cheez ki kami na lage. Aaj ka chhota sa smart step, kal unka bada shield ban sakta hai. Main is baat ko ek insaan ki tarah samajh sakta hoon, kyunki suraksha ka matlab sirf numbers nahi — ek chhote se parivaar ka bharosa hai.",
  cancer_health:
    "Health aur ghar ki suraksha ek hi sikke ke do pehlu hain — medical emergency kabhi nahi puchhti, aur us waqt jo aapke saath khada ho, wahi asli saathi hota hai. Main chahta hoon ki aapki tension ek jaisi na rahe — aap family ke saath raho, medical bills ka bojh kisi aur ke kandhe par jaye. Ye sab baat aaram se, bina kisi pressure ke samajhte hain.",
  tax:
    "Tax bachana koi tedhi baat nahi hai — bas sahi jaankari aur thodi si soch chahiye. Kuch plans aise hain jisme tax benefit naturally juda hota hai, aur aapko koi alag se jhanjhat nahi lena padta. Main aapko ye sab simple bhasha mein, bilkul transparent tareeke se samjhata hoon."
};

function buildPitch({ firstName = "", query = "", topic, chunks }) {
  const cleanName = String(firstName || "").trim().split(/\s+/)[0] || "";
  const resolvedTopic = topic || detectTopic(query);
  const relevant = pickRelevantChunks(query || resolvedTopic, chunks);
  const facts = extractFacts(relevant);
  const hook = TOPIC_HOOKS[resolvedTopic] || TOPIC_HOOKS.savings_investment;

  const lines = [];
  if (cleanName) lines.push(`Namaste ${cleanName},`);
  lines.push(`Pehle aapko ek baat bataun — main GARUDA hoon, ek AI Financial Advisor, aur Aditya Birla Sun Life (ABSLI) ka official financial partner. Par ye designations nahi, aapke liye main ek dost hoon jo sirf aapki hi suraksha ke baare mein sochta hai.`);
  lines.push(hook);
  lines.push(`Ye koi typical sales pitch nahi hai. GARUDA aapko ABSLI ke genuine plans ka simple, transparent saar deta hai — investment ₹30,000 se shuru hota hai, usi investment me aapki suraksha included hai (10x tak ka protection cover), koi rigid fixed amount nahi, aur multiple benefits ke saath.`);
  if (facts.length && facts[0].numbers && facts[0].numbers.length) {
    const sample = facts[0].numbers[0];
    const source = facts[0].source.replace(/^ABSLI /i, "ABSLI ");
    lines.push(`Ye figures ABSLI ke official document ("${source}") se verified hain — par exact benefits aapke plan, terms & conditions aur underwriting par depend karte hain.`);
  }
  lines.push(`Koi pressure nahi, koi jhutha wada nahi. Sirf sahi jaankari — kyunki suraksha tabhi asli hai jab wo transparent ho.`);
  lines.push(`Aur haan — poori detail aap garudaos.in par bhi dekh sakte hain.`);
  lines.push(`Agar aapko ye baat achhi lagi, toh bas reply kijiye 'yes' — main aapko aage guide karunga, bilkul apne jaisa.`);
  lines.push(`Aur agar abhi nahi, toh koi baat nahi — reply 'no' aur main aapko dobara kabhi pareshan nahi karunga. Aapka aaram hi mera pahela dhyan hai.`);
  lines.push(`— GARUDA (aapka apna)`);

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
