/**
 * GARUDA Acquisition Attribution Service
 * Lightweight, privacy-first acquisition channel detection and UTM parameter preservation.
 * Determines the exact origin of inbound visitors and prospective commercial leads:
 * - Direct
 * - Organic Search (Google, Bing, DuckDuckGo, Yahoo, Baidu, Yandex, etc.)
 * - LinkedIn (Posts, InMail, Profile links, lnkd.in)
 * - Referral (External websites, GitHub, ProductHunt, etc.)
 * - Social (Twitter/X, Facebook, YouTube, Reddit, WhatsApp, etc.)
 * - Identifiable Campaign Source (Paid CPC, Email outreach, Newsletter, etc.)
 */

const SEARCH_ENGINE_PATTERNS = [
  /(^|\.)google\./i,
  /(^|\.)bing\.com$/i,
  /(^|\.)duckduckgo\.com$/i,
  /(^|\.)yahoo\.com$/i,
  /(^|\.)baidu\.com$/i,
  /(^|\.)yandex\./i,
  /(^|\.)ecosia\.org$/i,
  /(^|\.)ask\.com$/i,
  /(^|\.)search\.brave\.com$/i,
  /(^|\.)qwant\.com$/i
];

const LINKEDIN_PATTERNS = [
  /(^|\.)linkedin\.com$/i,
  /(^|\.)lnkd\.in$/i,
  /(^|\.)licdn\.com$/i,
  /android-app:\/\/com\.linkedin\.android/i
];

const SOCIAL_PATTERNS = [
  { name: "Twitter / X", regex: /(^|\.)(twitter\.com|t\.co|x\.com)$/i },
  { name: "Facebook", regex: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/i },
  { name: "Instagram", regex: /(^|\.)(instagram\.com)$/i },
  { name: "Reddit", regex: /(^|\.)(reddit\.com|redd\.it)$/i },
  { name: "YouTube", regex: /(^|\.)(youtube\.com|youtu\.be)$/i },
  { name: "WhatsApp", regex: /(^|\.)(whatsapp\.com|wa\.me)$/i },
  { name: "Telegram", regex: /(^|\.)(t\.me|telegram\.org|telegram\.me)$/i },
  { name: "Threads", regex: /(^|\.)(threads\.net)$/i },
  { name: "GitHub", regex: /(^|\.)(github\.com)$/i },
  { name: "Hacker News", regex: /(^|\.)(news\.ycombinator\.com)$/i },
  { name: "Product Hunt", regex: /(^|\.)(producthunt\.com)$/i }
];

const INTERNAL_HOST_PATTERNS = [
  /garudaos\.in/i,
  /localhost/i,
  /127\.0\.0\.1/i,
  /vercel\.app/i
];

class AcquisitionAttributionService {
  /**
   * Extracts hostname from a URL string safely.
   */
  extractHostname(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return "";
    try {
      const parsed = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
      return parsed.hostname.toLowerCase();
    } catch {
      return String(rawUrl).toLowerCase().split("/")[0];
    }
  }

  /**
   * Checks if domain is internal / self-referring.
   */
  isInternalDomain(domain) {
    if (!domain) return true;
    return INTERNAL_HOST_PATTERNS.some((p) => p.test(domain));
  }

  /**
   * Resolves acquisition channel, source, and UTM parameters from raw inputs.
   */
  resolveAttribution(input = {}) {
    const req = input.req || {};
    const body = input.body || {};
    const query = input.query || (req.query ? req.query : {});
    const headers = req.headers || {};
    const payloadAttr = body.attribution || input.attribution || {};

    // 1. Extract UTM Parameters (prioritize client payload, then query params, then body)
    const utmSource = String(
      payloadAttr.utm_source ||
      payloadAttr.source ||
      query.utm_source ||
      body.utm_source ||
      ""
    ).trim();

    const utmMedium = String(
      payloadAttr.utm_medium ||
      payloadAttr.medium ||
      query.utm_medium ||
      body.utm_medium ||
      ""
    ).trim();

    const utmCampaign = String(
      payloadAttr.utm_campaign ||
      payloadAttr.campaign ||
      query.utm_campaign ||
      body.utm_campaign ||
      ""
    ).trim();

    const utmTerm = String(
      payloadAttr.utm_term ||
      payloadAttr.term ||
      query.utm_term ||
      body.utm_term ||
      ""
    ).trim();

    const utmContent = String(
      payloadAttr.utm_content ||
      payloadAttr.content ||
      query.utm_content ||
      body.utm_content ||
      ""
    ).trim();

    const gclid = String(payloadAttr.gclid || query.gclid || body.gclid || "").trim();
    const fbclid = String(payloadAttr.fbclid || query.fbclid || body.fbclid || "").trim();
    const refParam = String(payloadAttr.ref || query.ref || body.ref || "").trim();

    // 2. Extract Referrer Information
    const rawReferrer = String(
      payloadAttr.referrer ||
      payloadAttr.referrerUrl ||
      headers["referer"] ||
      headers["referrer"] ||
      input.referrer ||
      ""
    ).trim();

    const landingPath = String(
      payloadAttr.landingPath ||
      input.landingPath ||
      req.path ||
      "/"
    ).trim();

    const referrerDomain = this.extractHostname(rawReferrer);
    const isInternalRef = this.isInternalDomain(referrerDomain);

    // 3. Classify Acquisition Channel
    let channel = "Direct";
    let identifiedSource = "direct";
    let identifiedMedium = utmMedium || "none";

    // Condition A: Explicit Paid Ads / Click IDs
    if (gclid || /^(cpc|ppc|paid|ad|paidsearch|paidsocial|display|banner)$/i.test(utmMedium)) {
      channel = "Paid Campaign";
      identifiedSource = utmSource || (gclid ? "google_ads" : "paid_campaign");
      identifiedMedium = utmMedium || "cpc";
    }
    // Condition B: LinkedIn (via UTM or Referrer)
    else if (
      /linkedin/i.test(utmSource) ||
      (referrerDomain && LINKEDIN_PATTERNS.some((p) => p.test(referrerDomain)))
    ) {
      channel = "LinkedIn";
      identifiedSource = utmSource || (referrerDomain.includes("lnkd.in") ? "lnkd.in" : "linkedin.com");
      identifiedMedium = utmMedium || "social_post";
    }
    // Condition C: Organic Search (via UTM medium or Referrer Domain)
    else if (
      /^(organic|search|seo)$/i.test(utmMedium) ||
      (referrerDomain && !isInternalRef && SEARCH_ENGINE_PATTERNS.some((p) => p.test(referrerDomain)))
    ) {
      channel = "Organic Search";
      if (referrerDomain.includes("google")) identifiedSource = "google";
      else if (referrerDomain.includes("bing")) identifiedSource = "bing";
      else if (referrerDomain.includes("duckduckgo")) identifiedSource = "duckduckgo";
      else if (referrerDomain.includes("yahoo")) identifiedSource = "yahoo";
      else identifiedSource = utmSource || referrerDomain || "organic_search";
      identifiedMedium = utmMedium || "organic";
    }
    // Condition D: Social Media Referrals
    else if (
      referrerDomain &&
      !isInternalRef &&
      SOCIAL_PATTERNS.some((s) => s.regex.test(referrerDomain))
    ) {
      const matched = SOCIAL_PATTERNS.find((s) => s.regex.test(referrerDomain));
      channel = ["GitHub", "Product Hunt", "Hacker News"].includes(matched.name) ? "Referral" : "Social";
      identifiedSource = matched.name.toLowerCase().replace(/\s+/g, "_");
      identifiedMedium = utmMedium || "referral";
    }
    // Condition E: Other Identifiable Campaign Sources (UTM source provided)
    else if (utmSource) {
      channel = "Identifiable Campaign";
      identifiedSource = utmSource;
      identifiedMedium = utmMedium || "campaign";
    }
    // Condition F: External Website Referral
    else if (referrerDomain && !isInternalRef) {
      channel = "Referral";
      identifiedSource = referrerDomain;
      identifiedMedium = "referral";
    }
    // Condition G: Direct Referral Parameter (e.g. ?ref=partner)
    else if (refParam) {
      channel = "Referral";
      identifiedSource = `ref:${refParam}`;
      identifiedMedium = "partner_link";
    }
    // Condition H: Direct Traffic
    else {
      channel = "Direct";
      identifiedSource = "direct";
      identifiedMedium = "none";
    }

    const attribution = {
      channel,
      source: identifiedSource,
      medium: identifiedMedium,
      campaign: utmCampaign || null,
      term: utmTerm || null,
      content: utmContent || null,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      utm_term: utmTerm || null,
      utm_content: utmContent || null,
      gclid: gclid || null,
      fbclid: fbclid || null,
      ref: refParam || null,
      referrerDomain: referrerDomain && !isInternalRef ? referrerDomain : null,
      referrerUrl: rawReferrer && !isInternalRef ? rawReferrer : null,
      landingPath,
      capturedAt: new Date().toISOString()
    };

    attribution.summary = this.formatAttributionSummary(attribution);
    return attribution;
  }

  /**
   * Generates a concise human-readable summary string of the attribution.
   */
  formatAttributionSummary(attr) {
    if (!attr) return "Direct (direct / none)";
    const parts = [attr.channel];
    const details = [];

    if (attr.source && attr.source !== "direct") {
      details.push(`source: ${attr.source}`);
    }
    if (attr.medium && attr.medium !== "none") {
      details.push(`medium: ${attr.medium}`);
    }
    if (attr.campaign) {
      details.push(`campaign: ${attr.campaign}`);
    }
    if (attr.ref) {
      details.push(`ref: ${attr.ref}`);
    }

    if (details.length) {
      return `${parts[0]} (${details.join(" | ")})`;
    }
    return `${parts[0]} (direct / none)`;
  }
}

module.exports = new AcquisitionAttributionService();
