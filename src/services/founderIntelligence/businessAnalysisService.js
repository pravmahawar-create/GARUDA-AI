/**
 * GARUDA FOUNDER INTELLIGENCE — Business Analysis Service (Phase B)
 *
 * Deterministic client-request → structured business model analysis (§4).
 * NO LLM in the structure path. Every field carries an evidence label:
 *  - VERIFIED  = directly stated by the client in the input text
 *  - ESTIMATE  = derived from stated signals (explicitly derived)
 *  - PARTIAL   = reconstructed from partial signals
 *  - PLANNED   = potential GARUDA capability suggestion (not a promise)
 *  - UNKNOWN   = not present in input — NEVER guessed
 * Never converts an estimate into VERIFIED. Never invents missing info.
 */

const { LABELS, makeEvidence, unknownEvidence, combineLabels } = require("./evidenceLabels");

const ANALYSIS_VERSION = "founderIntelligence.businessAnalysis.v1";
const SOURCE_ANALYSIS = { type: "model", ref: ANALYSIS_VERSION, retrievedAt: null };
const SOURCE_STATEMENT = { type: "statement", ref: "client_text", retrievedAt: null };

const FIELD_NAMES = Object.freeze([
  "business",
  "businessModel",
  "users",
  "customers",
  "products",
  "transactions",
  "operationalWorkflow",
  "painPoints",
  "requestedFeatures",
  "requiredIntegrations",
  "automationOpportunities",
  "technicalComplexity",
  "risks",
  "missingInformation",
  "garudaCapabilities",
]);

const INDUSTRY_LEXICON = Object.freeze([
  { key: "electronics installment / consumer finance", cues: ["electronics", "installment", "instalment", "emi", "kist", "consumer finance", "loan"] },
  { key: "electronics retail", cues: ["mobile shop", "laptop", "appliance", "gadget", "electronics store"] },
  { key: "general retail / D2C", cues: ["retail", "shop", "store", "grocery", "boutique", "d2c"] },
  { key: "healthcare / clinic", cues: ["clinic", "hospital", "patient", "doctor", "dental", "healthcare"] },
  { key: "food & hospitality", cues: ["restaurant", "cafe", "hotel", "food delivery", "tiffin", "bakery"] },
  { key: "education", cues: ["school", "coaching", "institute", "student", "course", "edtech"] },
  { key: "real estate", cues: ["real estate", "property", "rental", "builder", "broker"] },
  { key: "e-commerce", cues: ["ecommerce", "e-commerce", "online store", "marketplace"] },
  { key: "logistics / delivery", cues: ["logistics", "delivery", "courier", "fleet", "transport"] },
  { key: "manufacturing", cues: ["manufacturing", "factory", "unit", "production"] },
  { key: "salon / wellness", cues: ["salon", "spa", "gym", "beauty", "fitness"] },
  { key: "services / agency", cues: ["agency", "consultancy", "freelance", "services firm"] },
  { key: "travel", cues: ["travel", "tour", "booking agent"] },
  { key: "hr / recruitment", cues: ["recruitment", "hiring", "hr firm", "staffing"] },
  { key: "legal / accounting", cues: ["law firm", "legal", "ca firm", "accounting", "tax consultant"] },
]);

const BUSINESS_MODEL_LEXICON = Object.freeze([
  { key: "installment / credit sales", cues: ["installment", "instalment", "emi", "kist", "credit sale", "down payment"] },
  { key: "subscription", cues: ["subscription", "monthly plan", "saas", "recurring billing"] },
  { key: "product sales", cues: ["sell", "sales", "retail", "shop", "store", "price per unit"] },
  { key: "service billing", cues: ["service charge", "per service", "consultation fee", "service billing"] },
  { key: "marketplace / commission", cues: ["marketplace", "commission", "per order fee", "platform fee"] },
  { key: "booking / appointment", cues: ["booking", "appointment", "reservation"] },
]);

const USER_LEXICON = Object.freeze(["owner", "admin", "staff", "employee", "manager", "team", "doctor", "operator", "salesman", "receptionist", "accountant", "chef", "teacher"]);
const CUSTOMER_LEXICON = Object.freeze(["customer", "client", "patient", "student", "tenant", "rider", "guest", "member", "buyer", "user base", "end user"]);
const PRODUCT_LEXICON = Object.freeze(["product", "item", "inventory", "stock", "goods", "sku", "catalogue", "catalog", "menu", "service menu", "plan"]);
const TRANSACTION_CUES = Object.freeze(["transaction", "payment", "receipt", "refund", "invoice", "order", "collection", "payout", "settlement"]);
const PAIN_CUES = Object.freeze(["problem", "dikkat", "issue", "miss ho", "late", "overdue", "bhool", "confusion", "manual", "struggle", "challenge", "delay", "loss", "leak", "duplicate entry", "excel mein", "spreadsheet", "paper", "follow up nahi", "follow-up nahi", "record nahi"]);
const WORKFLOW_CUES = Object.freeze(["daily", "weekly", "monthly", "phir", "then", "after that", "first", "automatically", "schedule", "track", "remind", "reminders", "follow-up", "followup", "collect", "issue receipt", "update", "approve", "verify", "deliver"]);

const FEATURE_LEXICON = Object.freeze([
  { key: "customer tracking", cues: ["customer tracking", "customer detail", "customer record", "customer history"] },
  { key: "product tracking", cues: ["product tracking", "product record", "stock tracking", "inventory tracking", "item tracking"] },
  { key: "installment schedule", cues: ["installment schedule", "instalment schedule", "emi schedule", "payment schedule", "due schedule"] },
  { key: "due reminders", cues: ["due reminder", "due date reminder", "reminders", "reminder"] },
  { key: "overdue follow-up", cues: ["overdue follow-up", "overdue followup", "overdue", "late payment follow"] },
  { key: "receipts", cues: ["receipt", "receipts", "payment receipt"] },
  { key: "owner dashboard", cues: ["owner dashboard", "dashboard", "admin panel", "admin dashboard"] },
  { key: "reports & analytics", cues: ["report", "reports", "analytics", "insights", "summary report"] },
  { key: "user login / roles", cues: ["login", "authentication", "role based", "roles", "multi user"] },
  { key: "search", cues: ["search", "filter"] },
  { key: "notifications", cues: ["notification", "alerts", "push notification"] },
  { key: "online payment", cues: ["online payment", "upi", "card payment", "payment gateway"] },
  { key: "sms", cues: ["sms", "text message"] },
  { key: "whatsapp", cues: ["whatsapp", "whats app"] },
  { key: "invoice generation", cues: ["invoice", "generate bill", "billing"] },
  { key: "booking / appointment", cues: ["booking", "appointment"] },
  { key: "inventory management", cues: ["inventory", "stock management", "warehouse"] },
]);

const INTEGRATION_LEXICON = Object.freeze([
  { key: "payment gateway", cues: ["payment gateway", "razorpay", "stripe", "payu", "upi gateway"] },
  { key: "WhatsApp Business API", cues: ["whatsapp api", "whatsapp business", "whatsapp integration"] },
  { key: "SMS gateway", cues: ["sms gateway", "sms integration", "dlt sms"] },
  { key: "email service", cues: ["email integration", "smtp", "email service"] },
  { key: "Telegram", cues: ["telegram"] },
  { key: "Tally / accounting", cues: ["tally", "accounting software", "zoho books", "quickbooks"] },
  { key: "ERP", cues: ["erp"] },
  { key: "Google Sheets", cues: ["google sheets", "sheets export"] },
  { key: "shipping / courier partner", cues: ["shiprocket", "delivery partner", "shipping integration", "courier api"] },
  { key: "maps", cues: ["google maps", "maps integration", "geofence"] },
]);

function matchLexicon(text, lexicon) {
  const t = text.toLowerCase();
  const hits = [];
  for (const entry of lexicon) {
    if (Array.isArray(entry.cues)) {
      if (entry.cues.some((c) => t.includes(c))) hits.push(entry.key);
    } else if (t.includes(entry)) {
      hits.push(entry);
    }
  }
  return hits;
}

function matchField(text, value, label, note = null) {
  return { value, label, note };
}

function detectCount(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Number(m[1]);
  }
  return null;
}

function firstPhrases(text, cues, max = 4) {
  const sentences = String(text).split(/(?<=[.!?।])\s+|\n+/);
  const out = [];
  for (const s of sentences) {
    const low = s.toLowerCase();
    if (cues.some((c) => low.includes(c))) {
      const clean = s.trim();
      if (clean && !out.includes(clean)) out.push(clean.slice(0, 220));
    }
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Main deterministic analysis.
 * @param {object} input  { text, structured: { serviceType, scope, complexity } }
 */
function analyze(input = {}) {
  const text = String(input.text || "").trim();
  const structured = input.structured || {};
  if (!text) {
    return {
      success: false,
      label: LABELS.UNKNOWN,
      reason: "TEXT_REQUIRED",
      analysis: null,
      evidence: [unknownEvidence("text")],
      missingInputs: ["text"],
    };
  }

  const analysis = {};
  const evidence = [];
  const labels = [];

  const push = (field, value, label, note = null, source = SOURCE_ANALYSIS) => {
    analysis[field] = { value, label, note };
    labels.push(label);
    evidence.push(
      label === LABELS.UNKNOWN
        ? unknownEvidence(field, note || undefined)
        : makeEvidence({ field, label, value, source, note })
    );
  };

  // 1. Business (industry)
  const industries = matchLexicon(text, INDUSTRY_LEXICON);
  push(
    "business",
    industries.length ? industries : null,
    industries.length ? LABELS.VERIFIED : LABELS.UNKNOWN,
    industries.length ? "Stated/detected from client text" : "No industry stated in input"
  );

  // 2. Business model
  const models = matchLexicon(text, BUSINESS_MODEL_LEXICON);
  push(
    "businessModel",
    models.length ? models : null,
    models.length ? LABELS.VERIFIED : LABELS.UNKNOWN,
    models.length ? null : "Business model not stated"
  );

  // 3. Users (internal operators)
  const users = matchLexicon(text, USER_LEXICON);
  const userCount = detectCount(text, [/(\d+)\s*(?:staff|employees|users|people|members)\b/i]);
  push(
    "users",
    users.length || userCount ? { roles: users.length ? users : [], headcount: userCount } : null,
    users.length || userCount ? LABELS.VERIFIED : LABELS.UNKNOWN,
    users.length || userCount ? "Roles/headcount as stated" : "Internal users not stated"
  );

  // 4. Customers (end)
  const customers = matchLexicon(text, CUSTOMER_LEXICON);
  const customerCount = detectCount(text, [/(\d+)\s*(?:customers|patients|students|clients|tenants|orders)\b/i]);
  let customersValue = null;
  let customersLabel = LABELS.UNKNOWN;
  if (customers.length || customerCount) {
    customersValue = { segments: customers, headcount: customerCount };
    customersLabel = LABELS.VERIFIED;
  } else if (models.includes("installment / credit sales")) {
    customersValue = { segments: ["credit buyers / installment customers"], headcount: null };
    customersLabel = LABELS.ESTIMATE;
    push("customers", customersValue, customersLabel, "Derived from installment business model (not stated)");
  }
  if (!analysis.customers) push("customers", customersValue, customersLabel, customersLabel === LABELS.UNKNOWN ? "End customers not stated" : null);

  // 5. Products
  const products = matchLexicon(text, PRODUCT_LEXICON);
  const namedGoods = matchLexicon(text, ["electronics", "mobile", "laptop", "furniture", "clothing", "grocery", "medicine", "vehicle"]);
  const goodsValue = [...new Set([...products, ...namedGoods])];
  push(
    "products",
    goodsValue.length ? goodsValue : null,
    goodsValue.length ? LABELS.VERIFIED : LABELS.UNKNOWN,
    goodsValue.length ? null : "Products/services not stated"
  );

  // 6. Transactions
  const txCues = matchLexicon(text, TRANSACTION_CUES);
  const txVolume = detectCount(text, [/(\d+)\s*(?:transactions|payments|orders|receipts)\b/i, /(\d+)\s*(?:per day|daily|day)/i, /(\d+)\s*(?:per month|monthly)\s*(?:transactions|payments|orders)/i]);
  push(
    "transactions",
    txCues.length ? { types: txCues, volume: txVolume } : null,
    txCues.length ? (txVolume ? LABELS.VERIFIED : LABELS.PARTIAL) : LABELS.UNKNOWN,
    txCues.length ? (txVolume ? "Types + volume stated" : "Types stated, volume not stated") : "No transaction activity stated"
  );

  // 7. Operational workflow (reconstructed action sequence)
  const workflowHits = matchLexicon(text, WORKFLOW_CUES);
  const workflowPhrases = firstPhrases(text, ["track", "remind", "reminders", "follow-up", "followup", "collect", "receipt", "update", "record", "remind"], 5);
  push(
    "operationalWorkflow",
    workflowPhrases.length ? workflowPhrases : null,
    workflowPhrases.length ? LABELS.PARTIAL : LABELS.UNKNOWN,
    workflowPhrases.length ? "Reconstructed from stated actions (not a confirmed SOP)" : "No workflow steps stated"
  );
  void workflowHits;

  // 8. Pain points
  const pains = firstPhrases(text, PAIN_CUES, 5);
  push(
    "painPoints",
    pains.length ? pains : null,
    pains.length ? LABELS.VERIFIED : LABELS.UNKNOWN,
    pains.length ? "Client-stated problems" : "No explicit pain points stated"
  );

  // 9. Requested features
  const features = matchLexicon(text, FEATURE_LEXICON);
  push(
    "requestedFeatures",
    features.length ? features : null,
    features.length ? LABELS.VERIFIED : LABELS.UNKNOWN,
    features.length ? "Requested verbatim/lexicon match" : "No features stated"
  );

  // 10. Required integrations
  const integrations = matchLexicon(text, INTEGRATION_LEXICON);
  push(
    "requiredIntegrations",
    integrations.length ? integrations : null,
    integrations.length ? LABELS.VERIFIED : LABELS.UNKNOWN,
    integrations.length ? "Stated integration names" : "No integration named — scope question for customer"
  );

  // 11. Automation opportunities (derived PLANNED capabilities)
  const automation = [];
  if (features.includes("due reminders")) automation.push("Automated due-date reminder flows (WhatsApp/SMS)");
  if (features.includes("overdue follow-up")) automation.push("Overdue ledger + auto follow-up queue");
  if (features.includes("receipts")) automation.push("Auto receipt generation on payment entry");
  if (features.includes("installment schedule")) automation.push("Installment schedule engine with day-wise due tracking");
  if (features.includes("reports & analytics")) automation.push("Daily collection + overdue analytics report");
  if (features.includes("inventory management")) automation.push("Low-stock alert automation");
  if (models.includes("booking / appointment")) automation.push("Booking confirmation + reminder automation");
  push(
    "automationOpportunities",
    automation.length ? automation : null,
    automation.length ? LABELS.PLANNED : LABELS.UNKNOWN,
    automation.length ? "Derived from stated features — PLANNED, not yet built" : "Not enough stated features to derive automation"
  );

  // 12. Technical complexity (derived estimate)
  const complexityScore =
    (features.length || 0) * 1 +
    (integrations.length || 0) * 2 +
    (txVolume ? 1 : 0) +
    (structured.scope?.pages || 0) * 0.5;
  const complexity = complexityScore >= 9 ? "complex" : complexityScore >= 4 ? "standard" : "basic";
  push(
    "technicalComplexity",
    { complexity, score: complexityScore, inputs: { features: features.length, integrations: integrations.length } },
    LABELS.ESTIMATE,
    "Derived from feature/integration/scope counts (declared scoring)"
  );

  // 13. Risks (structural, derived — no legal/financial invention)
  const risks = [];
  const missingScope = !(structured.scope?.pages || structured.scope?.features || structured.scope?.flows);
  if (missingScope) risks.push({ risk: "Scope size undefined — pricing confidence reduced until pages/features confirmed", label: LABELS.UNKNOWN });
  if (integrations.includes("payment gateway") === false && (features.includes("online payment") || models.includes("installment / credit sales"))) {
    risks.push({ risk: "Payments in flow but no gateway named — integration choice open", label: LABELS.PARTIAL });
  }
  if (!features.includes("user login / roles") && (userCount || users.length > 1)) {
    risks.push({ risk: "Multi-user use implied but role/access model not defined", label: LABELS.PARTIAL });
  }
  if (customersCountSafe(customerCount) && !features.includes("notifications")) {
    risks.push({ risk: "Customer-facing volume implied but notification strategy not stated", label: LABELS.PARTIAL });
  }
  push(
    "risks",
    risks.length ? risks : null,
    risks.length ? LABELS.PARTIAL : LABELS.UNKNOWN,
    risks.length ? "Structural risks derived from evidence gaps" : "No structural risk signals detected"
  );

  // 14. Missing information (never guessed)
  const missing = [];
  if (!missingScope) {
    /* scope present */
  } else missing.push("scope.pages|scope.features (required for pricing)");
  if (!/\d+\s*days?|timeline|deadline|by next month|month end/i.test(text)) missing.push("timeline (delivery deadline)");
  if (!/₹|budget|lakh|crore/i.test(text)) missing.push("budget range");
  if (!userCount && !customerCount) missing.push("user + customer headcount");
  if (!integrations.length && (features.includes("online payment") || features.includes("whatsapp"))) missing.push("exact integration/vendor choice");
  if (!structured.serviceType && industries.length === 0) missing.push("business category");
  push(
    "missingInformation",
    missing.length ? missing : null,
    missing.length ? LABELS.UNKNOWN : LABELS.VERIFIED,
    missing.length ? "Required inputs absent — will not be guessed" : "No critical gaps detected in stated scope"
  );

  // 15. Potential GARUDA capabilities (PLANNED suggestions)
  const capabilities = [];
  if (features.includes("due reminders") || features.includes("overdue follow-up")) capabilities.push("GARUDA WhatsApp reminder + follow-up engine");
  if (features.includes("owner dashboard") || features.includes("reports & analytics")) capabilities.push("GARUDA owner dashboard (PWA)");
  if (features.includes("receipts") || features.includes("invoice generation")) capabilities.push("GARUDA receipt/invoice generator");
  if (features.includes("whatsapp")) capabilities.push("GARUDA WhatsApp Business flows");
  if (features.includes("reports & analytics")) capabilities.push("GARUDA analytics + daily digest");
  if (capabilities.length === 0 && features.length) capabilities.push("GARUDA custom module build from stated features");
  push(
    "garudaCapabilities",
    capabilities.length ? capabilities : null,
    capabilities.length ? LABELS.PLANNED : LABELS.UNKNOWN,
    capabilities.length ? "Capability mapping — PLANNED until scoped" : "No capability mapping without stated features"
  );

  const label = combineLabels(labels);
  return {
    success: true,
    label,
    analysis,
    fieldCount: FIELD_NAMES.length,
    evidence,
    missingInputs: analysis.missingInformation?.value || [],
    assumptions: ["Deterministic lexicon analysis of founder-provided text — no LLM in structure path"],
    warnings: [],
  };
}

function customersCountSafe(n) {
  return Number.isFinite(n) && n > 0;
}

module.exports = { analyze, FIELD_NAMES, ANALYSIS_VERSION };
