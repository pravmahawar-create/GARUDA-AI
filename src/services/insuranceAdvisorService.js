// GARUDA Insurance Advisor Service
//
// Conversational insurance answers grounded in the ABSLI knowledge base
// (data/knowledge-index.json — brochure/site chunks, source-verified figures)
// instead of letting the raw LLM hallucinate products. Used by the public chat
// and Telegram bot whenever the user's message is insurance-related.
//
// Locked positioning (GARUDA_INSURANCE_RUNBOOK):
// - "GARUDA AI Financial Advisor + ABSLI Financial Partner"
// - Never "insurance agent". Investment-first (₹30,000 se shuru).
// - Never invent figures — numbers sirf knowledge base se.
// - garudaos.in mention. "terms & conditions apply".
// - ABSLI ko garudaos.in ke kisi public page pe pin/locate nahi karna.

const insurancePitchService = require("./insurancePitchService");
const abslKnowledge = require("./abslKnowledgeService");

const INTENT_KEYWORDS = [
  "insurance",
  "absli",
  "aditya birla",
  "term insurance",
  "term plan",
  "life cover",
  "life insurance",
  "health insurance",
  "health plan",
  "mediclaim",
  "sum assured",
  "premium",
  "policy",
  "suraksha",
  "bima",
  "jeevan",
  "health",
  "term",
  "80c",
  "critical illness",
  "savings plan",
  "retirement",
  "pension",
  "child plan",
  "activ one"
];

const TOPIC_HOOK = {
  family_protection:
    "Mai samajh sakta hoon ki parivaar ki suraksha aapke dil ke kitne kareeb hai — ye koi financial topic nahi, ek ehsaas hai. Term insurance bas ye pakka karta hai ki aapke pass aane se pehle hi aapke parivaar ki suraksha set ho. Simple, transparent, aur investment-first.",
  savings_investment:
    "Achhi baat hai ki aap savings ki soch rahe hain — ye aapke aane wale kal ke liye pyaar hai. Investment ₹30,000 se shuru hota hai, aur saath me aata hai growth, suraksha, aur flexibility. Koi rigid fixed amount nahi, jo aapke hisaab se chale.",
  child_education:
    "Bachchon ke sapne toh aise hote hain ki unhe kabhi kisi cheez ki kami na lage. Aaj ka smart investment, kal ka unka shield — isi soch ke saath aapke liye ek aasaan rasta batata hoon.",
  cancer_health:
    "Health ki chinta sirf paise ki nahi, mann ki bhi hoti hai. Isliye medical emergency ke waqt aapki taraf koi khada ho — ye financial shield hospital bills ka bojh na hone de, aur aap family ke saath raho.",
  tax:
    "Tax bachana koi tedhi baat nahi — sahi jaankari se toh ye ek simple smart move hai. Kuch plans ke saath ye naturally juda hota hai, aur aapko koi extra jhanjhat nahi."
};

function detectInsuranceIntent(text) {
  const t = String(text || "").toLowerCase();
  return INTENT_KEYWORDS.some((kw) => t.includes(kw));
}

function detectTopic(text = "") {
  return insurancePitchService.detectTopic(text);
}

function isMeaningfulFigure(value) {
  const s = String(value || "").toLowerCase();
  if (/%|lakh|lacs|crore|p\.a\.|per annum|years|months|days/.test(s)) return true;
  const digits = String(value || "").replace(/[^0-9]/g, "");
  return digits.length >= 4;
}

function buildFactsBlock(query, limit = 3) {
  try {
    const chunks = insurancePitchService.loadKnowledgeChunks();
    const relevant = insurancePitchService.pickRelevantChunks(query, chunks, 8);
    const facts = insurancePitchService.extractFacts(relevant);
    const cleaned = (facts || [])
      .map((f) => ({
        source: f.source,
        snippet: f.snippet,
        numbers: (f.numbers || []).filter(isMeaningfulFigure)
      }))
      .filter((f) => f.numbers.length > 0)
      .slice(0, limit);
    return cleaned;
  } catch {
    return [];
  }
}

async function answerInsuranceQuery(text, context = {}) {
  const clean = String(text || "").trim();
  const topic = detectTopic(clean);
  // Canonical governed knowledge first (MongoDB Knowledge -> file chunks).
  const { chunks } = await abslKnowledge.getKnowledgeChunks(clean, 8);
  const facts = buildFactsFromChunks(clean, chunks);
  const hook = TOPIC_HOOK[topic] || TOPIC_HOOK.savings_investment;

  const lines = [
    "Sabse pehle, main aapki baat sunne ke liye yahan hoon — bilkul ek dost ki tarah. Main GARUDA hoon, AI Financial Advisor aur Aditya Birla Sun Life (ABSLI) ka official financial partner.",
    hook
  ];

  if (facts.length && facts[0].numbers && facts[0].numbers.length) {
    const sample = facts[0].numbers[0];
    const source = String(facts[0].source || "ABSLI official documents")
      .replace(/_1782\d+\.pdf/gi, "")
      .replace(/\.pdf/gi, "")
      .trim();
    lines.push(`Verified figure: ${sample} (source: ${source || "ABSLI official documents"}) — exact benefits plan, terms & conditions aur underwriting par depend karte hain.`);
  } else {
    lines.push("Ye data mere ABSLI knowledge base me abhi full confirm nahi hai — main official documents se verify karke confirm karunga. Koi bhi figure main bina source ke nahi bataunga, kyunki aapka bharosa mere liye sabse important hai.");
  }

  // Personalize with whatever the user already shared (name, budget, age).
  // Backward compatible: context is optional and grounded-only, never invents figures.
  const userName = context && context.userName ? String(context.userName).trim() : "";
  const budget = context && Number(context.budget) ? Number(context.budget) : null;
  const age = context && Number(context.age) ? Number(context.age) : null;
  const goal = context && context.goal ? String(context.goal).trim() : "";
  const prior = Array.isArray(context && context.priorTopics) ? context.priorTopics : [];
  const hasCar = context && context.hasCar !== undefined ? Boolean(context.hasCar) : false;
  const isGraduate = context && context.isGraduate !== undefined ? Boolean(context.isGraduate) : false;

  if (topic === "family_protection" && hasCar && isGraduate) {
    lines.push(`Aapne bataya ki aap car owner hain aur graduation complete hai — term cover ke liye car-owner eligibility route aapke liye ek simple option hai (car 2+ saal ki ownership aur insurance value ₹2 lakh+ wali honi chahiye).`);
  }

  if (budget) {
    lines.push(`Aapne monthly budget around ₹${budget.toLocaleString("en-IN")} bataya hai — is hisaab se planning karte hain, koi rigid fixed amount nahi.`);
  }
  if (age) {
    lines.push(`Aapki umar ${age} ke hisaab se bhi main soch raha hoon — flexibility aur long-term growth dono ka balance rakhte hain.`);
  }
  if (goal) {
    lines.push(`Aapka goal "${goal}" samajh gaya hoon — isi ke hisaab se main aapko aage guide karunga.`);
  }
  if (userName) {
    lines.push(`Achha, ${userName} — main aapki baat bilkul dhyan se sun raha hoon.`);
  } else if (prior.length) {
    lines.push("Aur koi sawal ho toh khul ke batao — main aapki baat bilkul dhyan se sun raha hoon.");
  }

  lines.push("Investment-first hai — ₹30,000 se shuru, flexible, koi rigid fixed amount nahi. Poori detail garudaos.in par bhi available hai.");
  lines.push("Koi jhutha wada nahi, koi pressure nahi. Main sirf wahi batata hoon jo true aur transparent hai. Terms & conditions apply hote hain.");
  lines.push("Agar aapki koi aur pareshani ya sawal hai, toh khul ke batao — main aapki baat samajh ke aage guide karunga. Aapka aaram mera pahela dhyan hai.");

  return {
    handled: true,
    topic,
    grounded: facts.length > 0,
    knowledgeOrigin: chunks.origin,
    factsUsed: facts.map((f) => ({ source: f.source, numbers: f.numbers })),
    answer: lines.join("\n\n")
  };
}

// Extract facts from normalized knowledge chunks ({ text, source, page }).
function buildFactsFromChunks(query, chunkList) {
  const chunks = Array.isArray(chunkList) ? chunkList : [];
  if (!chunks.length) return [];
  const relevant = insurancePitchService.pickRelevantChunks(query, chunks, 8);
  const facts = insurancePitchService.extractFacts(relevant);
  return (facts || [])
    .map((f) => ({
      source: f.source,
      snippet: f.snippet,
      numbers: (f.numbers || []).filter(isMeaningfulFigure)
    }))
    .filter((f) => f.numbers.length > 0)
    .slice(0, 3);
}

module.exports = {
  INTENT_KEYWORDS,
  answerInsuranceQuery,
  detectInsuranceIntent,
  detectTopic
};
