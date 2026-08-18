// GARUDA Sales Agent — intake -> quote -> negotiate -> deal -> payment.
// Autonomy: full. Founder approved autonomous pricing/negotiation on 2026-08-11.
// Guardrails: never below base cost (no loss), never invent figures, no fake promises.

const fs = require("fs");
const path = require("path");
const capabilityRegistryService = require("./capabilityRegistryService");
const founderSubmissionPackageService = require("./founderSubmissionPackageService");

const DEFAULT_CURRENCY = "INR";
const PAYMENT_PAGE_URL = process.env.GARUDA_PAYMENT_PAGE_URL || "https://razorpay.me/@garudaosincompany";

// In-memory deal states per lead/session id (no DB requirement).
const dealStore = new Map();

// ---------------------------------------------------------------- scope parse

const TYPE_SIGNALS = [
  { type: "website", label: "Business website", keywords: ["website", "site", "landing page", "web page", "pages ka", "business site"] },
  { type: "ecommerce", label: "E-commerce store", keywords: ["ecommerce", "e-commerce", "online store", "online shop", "shop website", "selling online", "orders online"] },
  { type: "mobile_app", label: "Mobile app", keywords: ["mobile app", "android app", "ios app", "app banana", "application", "app chahiye"] },
  { type: "telegram_bot", label: "Telegram bot", keywords: ["telegram bot", "bot banana", "automation bot", "chatbot"] },
  { type: "chatbot", label: "Chatbot / AI assistant", keywords: ["chatbot", "ai assistant", "chat bot", "customer support bot", "ai chat"] },
  { type: "api_integration", label: "API / integration", keywords: ["api", "integration", "connect", "zapier", "whatsapp api", "payment gateway"] },
  { type: "automation", label: "Automation workflow", keywords: ["automation", "auto reply", "workflow", "scrape", "scraping", "crm", "lead capture"] },
  { type: "dashboard", label: "Dashboard / web app", keywords: ["dashboard", "web app", "admin panel", "portal", "panel"] },
  { type: "logo", label: "Logo / brand design", keywords: ["logo", "branding", "brand design", "identity"] },
  { type: "seo", label: "SEO / digital marketing", keywords: ["seo", "google ranking", "digital marketing", "ads", "marketing"] }
];

const BUDGET_UNITS = {
  lakh: 100000,
  lac: 100000,
  crore: 10000000,
  cr: 10000000,
  k: 1000,
  thousand: 1000
};

function parseBudget(text) {
  const clean = String(text || "").toLowerCase();
  let match = clean.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|crore|cr|k|thousand)/);
  if (match) return Math.round(Number(match[1]) * BUDGET_UNITS[match[2]]);
  match = clean.match(/[₹]\s*(\d[\d,]*)/);
  if (match) {
    const val = parseInt(String(match[1]).replace(/,/g, ""), 10);
    if (val > 500 && val < 100000000) return val;
  }
  const commaNumbers = clean.match(/\b(\d{1,3}(?:,\d{3})+)\b/g);
  if (commaNumbers && commaNumbers.length) {
    const val = parseInt(String(commaNumbers[commaNumbers.length - 1]).replace(/,/g, ""), 10);
    if (val > 500 && val < 100000000) return val;
  }
  const bareNumbers = clean.match(/\b(\d{4,})\b/g);
  if (bareNumbers && bareNumbers.length) {
    const val = parseInt(String(bareNumbers[bareNumbers.length - 1]), 10);
    if (val > 500 && val < 100000000) return val;
  }
  return null;
}

function parseCount(text, pattern) {
  const m = String(text || "").match(pattern);
  if (!m) return null;
  const n = parseInt(String(m[1]).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function detectType(message) {
  const lower = String(message || "").toLowerCase();
  let best = null;
  for (const t of TYPE_SIGNALS) {
    if (t.keywords.some((kw) => lower.includes(kw))) {
      best = t;
      break;
    }
  }
  return best;
}

function extractScope(message) {
  const type = detectType(message);
  const budget = parseBudget(message);
  const pages = parseCount(message, /(\d+)\s*(?:pages?|pgs?)/i);
  const timeline = parseCount(message, /(\d+)\s*(?:days?|din|week|weeks?|mahine?)/i);
  return { type, budget, pages, timeline };
}

// ---------------------------------------------------------------- quote engine

const PAGE_BASE_PRICE = 3500;
const TYPE_BASE_PRICE = {
  website: 10000,
  ecommerce: 25000,
  mobile_app: 45000,
  telegram_bot: 8000,
  chatbot: 15000,
  api_integration: 12000,
  automation: 18000,
  dashboard: 22000,
  logo: 4000,
  seo: 12000
};
const TYPE_MIN_FLOOR_RATIO = {
  website: 0.7,
  ecommerce: 0.75,
  mobile_app: 0.8,
  telegram_bot: 0.7,
  chatbot: 0.7,
  api_integration: 0.7,
  automation: 0.75,
  dashboard: 0.75,
  logo: 0.7,
  seo: 0.7
};

function capabilityMinimumFee(typeLabel) {
  const caps = capabilityRegistryService.listCapabilities({ eligible: true }, { rootDir: process.cwd() });
  const cap = caps.find((c) => String(c.name).toLowerCase().includes(String(typeLabel || "").split(" ")[0].toLowerCase()));
  return cap && cap.pricingGuidance && cap.pricingGuidance.minimumFeeUSD
    ? Math.round(cap.pricingGuidance.minimumFeeUSD * 86) // USD -> INR approximate
    : null;
}

function buildQuote(scope = {}) {
  const type = scope.type;
  const typeKey = type ? type.type : "website";
  const basePrice = TYPE_BASE_PRICE[typeKey] || 10000;
  const pages = scope.pages || 1;
  const pageExtra = Math.max(0, pages - 1) * PAGE_BASE_PRICE;
  const capabilityFloor = capabilityMinimumFee(type ? type.label : "");
  const recommendedPrice = Math.max(basePrice + pageExtra, capabilityFloor || 0);

  let finalPrice = recommendedPrice;
  if (scope.budget) {
    if (scope.budget >= recommendedPrice) {
      finalPrice = scope.budget;
    } else {
      finalPrice = Math.max(scope.budget, recommendedPrice);
    }
  }

  const floorPrice = Math.round(finalPrice * (TYPE_MIN_FLOOR_RATIO[typeKey] || 0.7));
  const baseCost = Math.round(recommendedPrice * 0.55); // delivery cost buffer — never quote below this

  const milestones =
    finalPrice >= 30000
      ? [
          { milestone: "Milestone 1 — Advance (core build kickoff)", amount: Math.round(finalPrice / 2), percentage: 50 },
          { milestone: "Milestone 2 — Final delivery & acceptance", amount: finalPrice - Math.round(finalPrice / 2), percentage: 50 }
        ]
      : [{ milestone: "Milestone 1 — Complete delivery & acceptance", amount: finalPrice, percentage: 100 }];

  return {
    currency: DEFAULT_CURRENCY,
    type: typeKey,
    typeLabel: type ? type.label : "Business website",
    pages,
    timeline: scope.timeline || null,
    clientBudget: scope.budget || null,
    recommendedPrice: finalPrice,
    currentPrice: finalPrice,
    floorPrice,
    baseCost,
    margins: {
      idealProfitPercent: Math.round(((finalPrice - baseCost) / finalPrice) * 100),
      floorProfitPercent: Math.round(((floorPrice - baseCost) / floorPrice) * 100)
    },
    pricingModel: finalPrice >= 30000 ? "milestone_based" : "fixed_price",
    milestones
  };
}

// ---------------------------------------------------------------- negotiation

function applyNegotiation(quote, clientReply) {
  const lower = String(clientReply || "").toLowerCase();
  if (/(bahut mehenga|too expensive|kam karo|discount|budget nahi|kitna minimum|thoda kam|reduce|cheap|sasta)/i.test(lower)) {
    if (quote.currentPrice > quote.floorPrice) {
      const discounted = Math.round(quote.currentPrice * 0.9);
      quote.currentPrice = Math.max(discounted, quote.floorPrice);
      quote.negotiationStep = (quote.negotiationStep || 0) + 1;
      return {
        action: "offer_reduced",
        message: `Samajh gaya. Is deal ka best rate ${quote.currentPrice.toLocaleString("en-IN")} INR (floor price). Iske niche quality compromised hogi — GARUDA wo offer nahi karta. Payment 50/50 milestone me bhi possible hai.`
      };
    }
    return {
      action: "at_floor",
      message: `Bhai, is kaam ka best rate ${quote.floorPrice.toLocaleString("en-IN")} INR hai — ye hamari minimum hai, iske niche delivery quality kharab ho jayegi aur main wo risk nahi leta. Quality guarantee ke saath ye final.`
    };
  }
  if (/(deal done|thik hai|ok|okay|done|confirm|agreed|accept|theek hai|chalo|kar do|payment)/i.test(lower)) {
    return { action: "accept", message: `Deal locked! ${quote.currentPrice.toLocaleString("en-IN")} INR. Payment link: ${PAYMENT_PAGE_URL}` };
  }
  return { action: "continue", message: null };
}

// ---------------------------------------------------------------- identity capture

function extractContactFromText(text) {
  const t = String(text || "");
  const emailMatch = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const digits = t.replace(/[^0-9]/g, "");
  const phoneMatch = digits.length >= 10 ? digits.slice(-10) : "";
  return {
    email: emailMatch ? emailMatch[0].toLowerCase() : "",
    phone: phoneMatch
  };
}

// ---------------------------------------------------------------- state

function getState(sessionId) {
  const key = String(sessionId || "default").slice(0, 120);
  if (!dealStore.has(key)) {
    dealStore.set(key, {
      stage: "intake",
      scope: {},
      quote: null,
      currentPrice: null,
      asked: [],
      createdAt: Date.now()
    });
  }
  return dealStore.get(key);
}

function requiredQuestions(state) {
  const scope = state.scope || {};
  const missing = [];
  if (!scope.type) missing.push("Aapko kis tarah ka kaam chahiye? Website, mobile app, e-commerce, Telegram bot, chatbot, dashboard, ya automation?");
  if (!scope.budget) missing.push("Aapka budget kya hai? (Jaise 50,000 ya 2 lakh — isse main best quote bana dunga)");
  return missing;
}

// ---------------------------------------------------------------- main entry

// Intent gate: the sales agent must only take over conversations that are
// actually about buying GARUDA services. Non-sales messages pass through to the
// real LLM instead of being hijacked by quote/budget questions.
const SALES_NEGOTIATION_SIGNALS = [
  /(quote|price|cost|kitna|how much|rate)/i,
  /(banwana|banwani|bana do|banao|bana dena)/i,
  /(mehenga|kam karo|discount|sasta|deal done|deal lock|accept|agreed)/i
];

function shouldEngageSales(message, state = {}) {
  const text = String(message || "").trim();
  if (!text) return false;
  // Session already inside an active deal conversation — keep it going.
  if (state.quote || state.stage === "negotiation" || state.stage === "need_contact" || state.stage === "accepted") return true;
  // Concrete service type or an explicit budget figure both mean sales intent.
  if (detectType(text)) return true;
  if (parseBudget(text) != null) return true;
  // Explicit commercial language.
  return SALES_NEGOTIATION_SIGNALS.some((regex) => regex.test(text));
}

function handleSalesMessage(message, options = {}) {
  const sessionId = options.sessionId || options.userId || "default";
  const state = getState(sessionId);
  const text = String(message || "").trim();
  if (!text) return { action: "noop" };
  if (!shouldEngageSales(text, state)) return { action: "pass_through", message: null };

  const scope = extractScope(text);
  if (scope.type) state.scope.type = scope.type;
  if (scope.budget) state.scope.budget = scope.budget;
  if (scope.pages) state.scope.pages = scope.pages;
  if (scope.timeline) state.scope.timeline = scope.timeline;

  if (state.stage === "intake") {
    state.stage = "quoting";
  }

  // If budget just arrived (or scope looks complete), build quote — once.
  if (state.stage === "quoting") {
    const needs = requiredQuestions(state);
    if (state.scope.budget && state.scope.type && !needs.length) {
      state.quote = buildQuote(state.scope);
      state.currentPrice = state.quote.recommendedPrice;
      state.stage = "negotiation";
      return {
        action: "quote",
        quote: state.quote,
        message:
          `Quote ready, ${state.quote.typeLabel} ke liye:\n` +
          `• ${state.quote.currency} ${state.quote.recommendedPrice.toLocaleString("en-IN")} (₹)\n` +
          `• Model: ${state.quote.pricingModel.replace("_", " ")}\n` +
          `• Payment: ${state.quote.milestones.map((m) => `${m.milestone} — ${m.amount.toLocaleString("en-IN")} (${m.percentage}%)`).join(" | ")}\n` +
          `Agree karte ho toh bol do "deal done" — main payment link bhej dunga.`
      };
    }
  }

  if (state.stage === "negotiation") {
    const result = applyNegotiation(state.quote, text);
    if (result.action === "accept" && state.quote) {
      const contact = extractContactFromText(text);
      const hasContact = Boolean(contact.email || contact.phone);
      if (!hasContact) {
        state.stage = "need_contact";
        return {
          action: "need_contact",
          message:
            `Deal confirm karne ke liye sirf ek cheez chahiye — aapka email ya WhatsApp number (deal, quote aur payment link wahi bhejunga). Bata do, poora pack ready hai.`
        };
      }
      state.contact = contact;
      state.stage = "accepted";
      return { action: "accepted", quote: state.quote, message: result.message, paymentPageUrl: PAYMENT_PAGE_URL };
    }
    if (result.action === "offer_reduced" || result.action === "at_floor") {
      return { action: "negotiated", message: result.message, quote: state.quote };
    }
    return {
      action: "continue",
      message: "Kya hum deal final karein? 'deal done' ya 'ok' bolo, payment link share kar dunga. Ya koi budget adjustment chahiye to batao."
    };
  }

  if (state.stage === "need_contact") {
    const contact = extractContactFromText(text);
    if (contact.email || contact.phone) {
      state.contact = { ...(state.contact || {}), ...contact };
      state.stage = "accepted";
      return {
        action: "accepted",
        quote: state.quote,
        message:
          `Deal locked! ${state.quote.currentPrice.toLocaleString("en-IN")} INR. Aapka contact note kar liya (${contact.email || contact.phone}) — payment link: ${PAYMENT_PAGE_URL}. Delivery plan isi par bhejenge.`,
        paymentPageUrl: PAYMENT_PAGE_URL,
        contact: state.contact
      };
    }
    return {
      action: "need_contact",
      message: "Bas ek email ya WhatsApp number chahiye (jaise name@email.com ya 98XXXXXXXX) — deal lock aur payment link ke liye zaroori hai."
    };
  }

  if (state.stage === "quoting") {
    const needs = requiredQuestions(state);
    return { action: "questions", questions: needs, message: needs.join("\n") };
  }

  return { action: "continue", message: null };
}

function resetDeal(sessionId) {
  dealStore.delete(String(sessionId || "default"));
}

function getDealSummary() {
  const rows = [];
  for (const [key, state] of dealStore.entries()) {
    rows.push({
      sessionId: key,
      stage: state.stage,
      type: state.scope && state.scope.type ? state.scope.type.type : null,
      budget: state.scope && state.scope.budget ? state.scope.budget : null,
      price: state.currentPrice || null,
      updatedAt: new Date(state.createdAt).toISOString()
    });
  }
  return rows;
}

module.exports = {
  applyNegotiation,
  buildQuote,
  detectType,
  extractScope,
  getDealSummary,
  handleSalesMessage,
  parseBudget,
  resetDeal,
  shouldEngageSales
};
