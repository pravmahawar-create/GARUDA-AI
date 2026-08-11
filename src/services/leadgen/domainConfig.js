// GARUDA Lead-gen multi-domain configuration.
// FD-107: lead-gen is NOT company-specific. Every domain defines its own topics,
// segment signals/weights, pitch hooks, brand line and data namespace. The generic
// engine in outreachEngine.js consumes these configs so ANY industry can run leads.
// Existing insurance services are intentionally NOT touched; "insurance" is the
// first domain config here and mirrors the locked ABSLI positioning.

const INSURANCE_TOPICS = [
  "family_protection",
  "savings_investment",
  "child_education",
  "cancer_health",
  "tax"
];

const INSURANCE_TOPIC_KEYWORDS = {
  family_protection: ["term", "protection", "death benefit", "sum assured", "family", "nominee", "life cover", "risk cover"],
  savings_investment: ["savings", "investment", "wealth", "guaranteed", "maturity", "returns", "annuity", "pension"],
  child_education: ["child", "education", "school", "college", "future", "kids"],
  cancer_health: ["cancer", "health", "critical illness", "hospital", "medical", "shield"],
  tax: ["tax", "section 80c", "income tax"]
};

const INSURANCE_SEGMENTS = {
  business_owner: {
    weight: 28,
    signals: [
      "shop", "store", "business", "owner", "propriet", "trader", "dealer", "enterprise",
      "manufacturer", "exporter", "importer", "wholesale", "retail", "gst", "msme",
      "sole", "partnership", "private limited", "pvt ltd", "llp", "founder", "director",
      "clinic", "studio", "salon", "parlour", "cold stor", "godown", "workshop",
      "restaurant", "cafe", "contractor", "builder", "auto", "garage", "trading",
      "traders", "textile", "garment", "handloom", "pharma", "distribution", "distributor",
      "agency", "firm", "industries", "processors", "mills", "agencies"
    ]
  },
  parent: { weight: 18, signals: ["children", "child", "kids", "son", "daughter", "family", "school", "college"] },
  salaried: { weight: 12, signals: ["employee", "salaried", "professional", "engineer", "manager", "officer", "bank", "it", "consultant", "chartered", "doctor", "lawyer"] },
  retiree: { weight: 8, signals: ["retired", "pension", "senior citizen"] }
};

const INSURANCE_HOOKS = {
  family_protection: "Aapke parivaar ki suraksha ka matlab sirf savings nahi — jab paisa sahi jagah rakha jaye, toh wo khud aapke family ka shield ban jata hai.",
  savings_investment: "Investment ₹30,000 se shuru hota hai — aur saath me aata hai growth, suraksha, aur flexibility.",
  child_education: "Bachpan ke sapne aapke saath aur aapke baad bhi pura ho sakein — isliye aaj ka smart investment kal ka shield banta hai.",
  cancer_health: "Health aur financial stability ek hi sikke ke do pehlu hain — medical emergency ke samay aapki taraf jo khada ho, wahi asli suraksha hai.",
  tax: "Tax bachana ek smart financial move hai — aur ye kuch plans ke saath naturally juda hua hai."
};

const INSURANCE_BRAND_LINES = [
  "Mai GARUDA hoon — ek AI Financial Advisor, aur Aditya Birla Sun Life (ABSLI) ka official financial partner.",
  "Ye figures ABSLI ke official documents se verified hain — par exact benefits aapke plan, terms & conditions aur underwriting par depend karte hain.",
  "Aur haan — poori detail aap garudaos.in par bhi dekh sakte hain.",
  "Koi pressure nahi, koi jhutha wada nahi. Sirf sahi jaankari — kyunki suraksha tabhi asli hai jab wo transparent ho."
];

function insuranceInferQuery(segments) {
  const primary = segments[0] ? segments[0].segment : "";
  const hasChildren = segments.some((s) => s.segment === "parent");
  if (primary === "business_owner" && hasChildren) return "child_education";
  if (primary === "business_owner") return "savings_investment";
  if (hasChildren) return "child_education";
  if (primary === "retiree") return "savings_investment";
  if (primary === "salaried") return "family_protection";
  return "family_protection";
}

// Generic domain registry. Add a new industry by appending a config here
// (topics, segments, hooks, brand lines, data namespace, inferQuery).
const DOMAINS = {
  insurance: {
    id: "insurance",
    label: "Insurance / ABSLI",
    namespace: "insurance",
    topics: INSURANCE_TOPICS,
    topicKeywords: INSURANCE_TOPIC_KEYWORDS,
    segments: INSURANCE_SEGMENTS,
    hooks: INSURANCE_HOOKS,
    brandLines: INSURANCE_BRAND_LINES,
    defaultTopic: "family_protection",
    inferQuery: insuranceInferQuery,
    knowledgeIndexPath: "data/knowledge-index.json",
    website: "garudaos.in"
  }
};

function getDomain(domainId) {
  const domain = DOMAINS[domainId || "insurance"] || DOMAINS.insurance;
  return domain;
}

function listDomains() {
  return Object.values(DOMAINS).map((d) => ({
    id: d.id,
    label: d.label,
    namespace: d.namespace
  }));
}

// Standard intake questions for Business Profile generation (FD-106).
// GARUDA asks these to understand ANY business, then generates outreach from the profile.
const INTAKE_QUESTIONS = [
  { key: "businessName", question: "What is the business name?" },
  { key: "businessType", question: "What kind of business is it?" },
  { key: "offer", question: "What does the business offer / sell?" },
  { key: "targetCustomer", question: "Who is the ideal customer?" },
  { key: "price", question: "What is the typical price / package?" },
  { key: "channels", question: "Where do clients come from today?" },
  { key: "city", question: "Which city / area does it serve?" }
];

function buildBusinessProfile(answers = {}) {
  const profile = {};
  for (const q of INTAKE_QUESTIONS) {
    const value = String(answers[q.key] || "").trim();
    if (value) profile[q.key] = value;
  }
  profile.complete = profile.businessName && profile.offer;
  return profile;
}

module.exports = {
  DOMAINS,
  INTAKE_QUESTIONS,
  buildBusinessProfile,
  getDomain,
  listDomains
};
