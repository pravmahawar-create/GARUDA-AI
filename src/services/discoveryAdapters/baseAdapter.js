/**
 * GARUDA Base Discovery Adapter
 * Standardizes raw opportunity ingestion, sanitization, validation, and multi-currency parsing.
 */

const crypto = require("crypto");

const PROHIBITED_TERMS = [
  "casino", "gambling", "betting", "adult content", "tobacco", "vape", "alcohol sales", "escort", "pay upfront"
];

const SCAM_TERMS = [
  "registration fee", "training fee", "telegram only", "whatsapp only", "guaranteed income",
  "wire transfer check", "deposit check", "send money to receive"
];

const BENCHMARK_FX_TO_USD = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  AED: 0.272,
  CAD: 0.73,
  AUD: 0.65,
  SGD: 0.74,
  INR: 0.0118
};

const BENCHMARK_USD_TO_INR = 85.0;

function plainText(value = "") {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCurrency(text = "") {
  const clean = String(text || "").toLowerCase();
  if (/(£|gbp|pound)/i.test(clean)) return "GBP";
  if (/(€|eur|euro)/i.test(clean)) return "EUR";
  if (/(aed|dirham|dhs|dh\b)/i.test(clean)) return "AED";
  if (/(c\$|cad|canadian dollar)/i.test(clean)) return "CAD";
  if (/(a\$|aud|australian dollar)/i.test(clean)) return "AUD";
  if (/(s\$|sgd|singapore dollar)/i.test(clean)) return "SGD";
  if (/(₹|inr|rs\b|rupee|lakh|lac|crore)/i.test(clean)) return "INR";
  if (/(\$|usd|dollars?)/i.test(clean)) return "USD";
  return "USD";
}

function convertToINR(amount, currency = "USD") {
  const cur = String(currency || "USD").toUpperCase();
  const num = Number(amount) || 0;
  if (cur === "INR") return Math.round(num);

  const toUsd = BENCHMARK_FX_TO_USD[cur] || 1.0;
  const amountUSD = num * toUsd;
  return Math.round(amountUSD * BENCHMARK_USD_TO_INR);
}

function inspectOpportunitySafety(opportunity = {}) {
  const searchable = `${opportunity.title || ""} ${opportunity.description || ""} ${(opportunity.tags || []).join(" ")}`.toLowerCase();
  const rejectionReasons = [];

  if (PROHIBITED_TERMS.some((term) => searchable.includes(term))) {
    rejectionReasons.push("prohibited_or_age_restricted_category");
  }
  if (SCAM_TERMS.some((term) => searchable.includes(term))) {
    rejectionReasons.push("scam_signal_detected");
  }
  if (opportunity.url && !/^https?:\/\//i.test(String(opportunity.url))) {
    rejectionReasons.push("missing_secure_original_link");
  }

  return {
    accepted: rejectionReasons.length === 0,
    rejectionReasons
  };
}

function generateDeduplicationFingerprint(opportunity = {}) {
  const normalizedTitle = plainText(opportunity.title).toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedCompany = plainText(opportunity.company).toLowerCase().replace(/[^a-z0-9]/g, "");
  return crypto.createHash("sha256").update(`${normalizedTitle}:${normalizedCompany}`).digest("hex");
}

class BaseDiscoveryAdapter {
  constructor(name, options = {}) {
    this.name = name;
    this.timeoutMs = options.timeoutMs || 10000;
    this.enabled = options.enabled !== false;
  }

  async fetchRaw() {
    throw new Error(`fetchRaw() must be implemented by adapter ${this.name}`);
  }

  normalize(rawItem) {
    throw new Error(`normalize() must be implemented by adapter ${this.name}`);
  }

  async fetchAndNormalize() {
    if (!this.enabled) return [];
    try {
      const rawItems = await this.fetchRaw();
      if (!Array.isArray(rawItems)) return [];

      const normalized = [];
      for (const item of rawItems) {
        try {
          const norm = this.normalize(item);
          if (norm && norm.externalId && norm.title) {
            norm.fingerprint = generateDeduplicationFingerprint(norm);
            norm.safety = inspectOpportunitySafety(norm);
            normalized.push(norm);
          }
        } catch (err) {
          // Skip malformed individual items cleanly
        }
      }
      return normalized;
    } catch (err) {
      console.error(`[DiscoveryAdapter:${this.name}] Fetch failed:`, err.message);
      return [];
    }
  }
}

module.exports = {
  BaseDiscoveryAdapter,
  plainText,
  detectCurrency,
  convertToINR,
  inspectOpportunitySafety,
  generateDeduplicationFingerprint,
  BENCHMARK_FX_TO_USD,
  BENCHMARK_USD_TO_INR
};
