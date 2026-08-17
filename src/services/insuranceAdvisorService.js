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
    "Term insurance ka matlab hai — aapke pass aane se pehle aapke parivaar ki financial suraksha already set ho. Simple, transparent, aur investment-first.",
  savings_investment:
    "Investment ₹30,000 se shuru hota hai — growth, suraksha, aur flexibility sab saath me.",
  child_education:
    "Bachpan ke sapne aapke saath aur aapke baad bhi pura ho sakein — aaj ka smart investment, kal ka shield.",
  cancer_health:
    "Health insurance matlab medical emergency ke waqt aapki taraf koi khada ho — financial shield jo hospital bills ka bojh na hone de.",
  tax:
    "Tax bachana ek smart financial move hai — kuch plans ke saath naturally juda hua hai."
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

async function answerInsuranceQuery(text) {
  const clean = String(text || "").trim();
  const topic = detectTopic(clean);
  // Canonical governed knowledge first (MongoDB Knowledge -> file chunks).
  const { chunks } = await abslKnowledge.getKnowledgeChunks(clean, 8);
  const facts = buildFactsFromChunks(clean, chunks);
  const hook = TOPIC_HOOK[topic] || TOPIC_HOOK.savings_investment;

  const lines = [
    "Mai GARUDA hoon — AI Financial Advisor aur Aditya Birla Sun Life (ABSLI) ka official financial partner.",
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
    lines.push("Ye data mere ABSLI knowledge base me abhi full confirm nahi hai — main official documents se verify karke confirm karunga. Koi bhi figure main bina source ke nahi bataunga.");
  }

  lines.push("Investment-first hai — ₹30,000 se shuru, flexible, koi rigid fixed amount nahi. Poori detail garudaos.in par bhi available hai.");
  lines.push("Koi jhutha wada nahi, koi pressure nahi. Terms & conditions apply hote hain.");
  lines.push("Agar aage baat karni hai toh bas batao — main plan details me guide karunga.");

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
