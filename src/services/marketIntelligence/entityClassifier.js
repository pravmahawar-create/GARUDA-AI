/**
 * 🦅 GARUDA Market Intelligence — Canonical Entity Classification Engine
 * Enforces Absolute Truth Law: SOURCE !== PROSPECT
 *
 * Distinguishes direct commercial entities (Developers, Builders) from
 * discovery sources (Property Portals, Business Directories, Content Sites, News).
 */

const KNOWN_PROPERTY_PORTALS = new Set([
  "housing.com",
  "squareyards.com",
  "99acres.com",
  "magicbricks.com",
  "nobroker.com",
  "makaan.com",
  "indiaproperty.com",
  "commonfloor.com",
  "proptiger.com",
  "360propguide.com"
]);

const KNOWN_BUSINESS_DIRECTORIES = new Set([
  "realestateindia.com",
  "justdial.com",
  "indiamart.com",
  "tradeindia.com",
  "sulekha.com",
  "yellowpages.in"
]);

const KNOWN_NEWS_SOURCES = new Set([
  "economictimes.indiatimes.com",
  "moneycontrol.com",
  "livemint.com",
  "business-standard.com",
  "ndtv.com",
  "hindustantimes.com",
  "timesofindia.indiatimes.com"
]);

const ENTITY_TYPES = Object.freeze({
  REAL_ESTATE_DEVELOPER: "REAL_ESTATE_DEVELOPER",
  REAL_ESTATE_BUILDER: "REAL_ESTATE_BUILDER",
  REAL_ESTATE_BROKER: "REAL_ESTATE_BROKER",
  REAL_ESTATE_AGENCY: "REAL_ESTATE_AGENCY",
  PROPERTY_PORTAL: "PROPERTY_PORTAL",
  BUSINESS_DIRECTORY: "BUSINESS_DIRECTORY",
  CONTENT_SITE: "CONTENT_SITE",
  NEWS_SOURCE: "NEWS_SOURCE",
  GOVERNMENT_REGISTRY: "GOVERNMENT_REGISTRY",
  SEARCH_RESULT_SOURCE: "SEARCH_RESULT_SOURCE",
  SERVICE_PROVIDER: "SERVICE_PROVIDER",
  UNKNOWN: "UNKNOWN"
});

const DIRECT_ELIGIBLE_COMMERCIAL_TYPES = new Set([
  ENTITY_TYPES.REAL_ESTATE_DEVELOPER,
  ENTITY_TYPES.REAL_ESTATE_BUILDER
]);

function extractHostname(url = "") {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return String(url).toLowerCase().trim();
  }
}

class EntityClassifier {
  constructor() {
    this.ENTITY_TYPES = ENTITY_TYPES;
    this.DIRECT_ELIGIBLE_COMMERCIAL_TYPES = DIRECT_ELIGIBLE_COMMERCIAL_TYPES;
  }

  /**
   * Classifies a discovered source or company candidate with verifiable basis.
   */
  classifyEntity(rawHit = {}) {
    const url = String(rawHit.sourceUrl || rawHit.url || "").trim();
    const hostname = extractHostname(url);
    const pathname = (url.includes("/") ? new URL(url.startsWith("http") ? url : `https://${url}`).pathname : "").toLowerCase();
    const name = String(rawHit.companyName || rawHit.name || "").toLowerCase();
    const snippet = String(rawHit.snippet || "").toLowerCase();

    // 1. Check Content / Blog / Article paths first
    if (pathname.includes("/blogs/") || pathname.includes("/blog/") || pathname.includes("/top-") || pathname.includes("/list-of-") || pathname.includes("/news/") || pathname.includes("/article/")) {
      return {
        entityType: pathname.includes("/news/") ? ENTITY_TYPES.NEWS_SOURCE : ENTITY_TYPES.CONTENT_SITE,
        isDirectCommercialProspect: false,
        classificationConfidence: 0.92,
        classificationBasis: `URL path '${pathname}' indicates an informational article/blog/listicle, not an official developer homepage.`,
        hostname,
        role: "INTELLIGENCE_SOURCE"
      };
    }

    // 2. Check Known Portals
    if (KNOWN_PROPERTY_PORTALS.has(hostname) || hostname.endsWith(".housing.com") || hostname.endsWith(".squareyards.com")) {
      return {
        entityType: ENTITY_TYPES.PROPERTY_PORTAL,
        isDirectCommercialProspect: false,
        classificationConfidence: 0.99,
        classificationBasis: `Domain '${hostname}' is a verified national property portal / aggregator, not a real estate developer.`,
        hostname,
        role: "INTELLIGENCE_SOURCE"
      };
    }

    // 3. Check Known Directories
    if (KNOWN_BUSINESS_DIRECTORIES.has(hostname)) {
      return {
        entityType: ENTITY_TYPES.BUSINESS_DIRECTORY,
        isDirectCommercialProspect: false,
        classificationConfidence: 0.99,
        classificationBasis: `Domain '${hostname}' is a multi-vendor business directory / listing portal.`,
        hostname,
        role: "INTELLIGENCE_SOURCE"
      };
    }

    // 4. Check Known News Sites
    if (KNOWN_NEWS_SOURCES.has(hostname)) {
      return {
        entityType: ENTITY_TYPES.NEWS_SOURCE,
        isDirectCommercialProspect: false,
        classificationConfidence: 0.95,
        classificationBasis: `Domain '${hostname}' is a media publication.`,
        hostname,
        role: "INTELLIGENCE_SOURCE"
      };
    }

    // 5. Check Government / RERA registries
    if (hostname.includes("rera") || hostname.endsWith(".gov.in") || hostname.endsWith(".nic.in")) {
      return {
        entityType: ENTITY_TYPES.GOVERNMENT_REGISTRY,
        isDirectCommercialProspect: false,
        classificationConfidence: 0.99,
        classificationBasis: `Domain '${hostname}' is a statutory authority / RERA public registry.`,
        hostname,
        role: "INTELLIGENCE_SOURCE"
      };
    }

    // 6. Check Direct Real Estate Developers / Builders (Official brand websites)
    const developerKeywords = ["group", "infra", "developers", "builders", "homz", "homes", "properties", "realty", "living", "estates", "towers"];
    const isDeveloperName = developerKeywords.some(kw => name.includes(kw) || hostname.includes(kw));

    if (isDeveloperName && !pathname.includes("/builders-developers-in-") && !pathname.includes("/buy/")) {
      return {
        entityType: ENTITY_TYPES.REAL_ESTATE_DEVELOPER,
        isDirectCommercialProspect: true,
        classificationConfidence: 0.88,
        classificationBasis: `Official brand domain '${hostname}' verified with direct developer indicators.`,
        hostname,
        role: "CANDIDATE_PROSPECT"
      };
    }

    // 7. Fallback: Unknown or General Business
    return {
      entityType: ENTITY_TYPES.UNKNOWN,
      isDirectCommercialProspect: false,
      classificationConfidence: 0.50,
      classificationBasis: `Entity '${hostname}' lacks conclusive developer proof; requires secondary verification.`,
      hostname,
      role: "INTELLIGENCE_SOURCE"
    };
  }

  /**
   * Evaluates whether an entity is permitted to enter the direct prospect pipeline.
   */
  isEligibleDirectProspect(entityType) {
    return DIRECT_ELIGIBLE_COMMERCIAL_TYPES.has(entityType);
  }
}

module.exports = new EntityClassifier();
module.exports.EntityClassifier = EntityClassifier;
module.exports.ENTITY_TYPES = ENTITY_TYPES;
module.exports.DIRECT_ELIGIBLE_COMMERCIAL_TYPES = DIRECT_ELIGIBLE_COMMERCIAL_TYPES;
