/**
 * GARUDA Client-Side Acquisition Attribution Helper
 * Captures initial first-touch UTM parameters, referrer, and landing route on page load.
 * Persists attribution across navigation in sessionStorage so all chat and form conversions
 * carry full attribution telemetry.
 */

const SEARCH_ENGINE_DOMAINS = [
  "google.", "bing.com", "duckduckgo.com", "yahoo.com", "baidu.com", "yandex.", "ecosia.org", "ask.com"
];

const LINKEDIN_DOMAINS = [
  "linkedin.com", "lnkd.in", "licdn.com"
];

const SOCIAL_DOMAINS = [
  "twitter.com", "t.co", "x.com", "facebook.com", "fb.me", "instagram.com", "reddit.com", "youtube.com", "whatsapp.com", "threads.net"
];

const STORAGE_KEY = "garuda_acquisition_attribution";

function getDomainFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function initAttribution() {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = (params.get("utm_source") || "").trim();
    const utmMedium = (params.get("utm_medium") || "").trim();
    const utmCampaign = (params.get("utm_campaign") || "").trim();
    const utmTerm = (params.get("utm_term") || "").trim();
    const utmContent = (params.get("utm_content") || "").trim();
    const gclid = (params.get("gclid") || "").trim();
    const fbclid = (params.get("fbclid") || "").trim();
    const ref = (params.get("ref") || "").trim();

    const referrer = document.referrer ? document.referrer.trim() : "";
    const referrerDomain = getDomainFromUrl(referrer);
    const landingPath = window.location.pathname || "/";

    const isSelfReferral = referrerDomain.includes("garudaos.in") || referrerDomain.includes("localhost");

    // Check if we already have first-touch attribution stored
    const existingRaw = sessionStorage.getItem(STORAGE_KEY);
    let existing = null;
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw);
      } catch {}
    }

    // If new UTM parameters are present on this visit, update attribution; otherwise preserve first-touch
    const hasNewUTMs = Boolean(utmSource || utmCampaign || gclid || fbclid || ref);

    if (existing && !hasNewUTMs) {
      return existing;
    }

    // Classify Channel
    let channel = "Direct";
    let identifiedSource = "direct";
    let identifiedMedium = utmMedium || "none";

    if (gclid || /^(cpc|ppc|paid|ad|banner)$/i.test(utmMedium)) {
      channel = "Paid Campaign";
      identifiedSource = utmSource || "google_ads";
      identifiedMedium = utmMedium || "cpc";
    } else if (/linkedin/i.test(utmSource) || LINKEDIN_DOMAINS.some((d) => referrerDomain.includes(d))) {
      channel = "LinkedIn";
      identifiedSource = utmSource || (referrerDomain.includes("lnkd.in") ? "lnkd.in" : "linkedin.com");
      identifiedMedium = utmMedium || "social_post";
    } else if (/^(organic|search|seo)$/i.test(utmMedium) || (!isSelfReferral && SEARCH_ENGINE_DOMAINS.some((d) => referrerDomain.includes(d)))) {
      channel = "Organic Search";
      identifiedSource = referrerDomain.includes("google") ? "google" : referrerDomain.includes("bing") ? "bing" : utmSource || referrerDomain || "organic";
      identifiedMedium = utmMedium || "organic";
    } else if (!isSelfReferral && SOCIAL_DOMAINS.some((d) => referrerDomain.includes(d))) {
      channel = "Social";
      identifiedSource = referrerDomain;
      identifiedMedium = utmMedium || "social";
    } else if (utmSource) {
      channel = "Identifiable Campaign";
      identifiedSource = utmSource;
      identifiedMedium = utmMedium || "campaign";
    } else if (referrerDomain && !isSelfReferral) {
      channel = "Referral";
      identifiedSource = referrerDomain;
      identifiedMedium = "referral";
    } else if (ref) {
      channel = "Referral";
      identifiedSource = `ref:${ref}`;
      identifiedMedium = "partner_link";
    } else {
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
      gclid: gclid || null,
      fbclid: fbclid || null,
      ref: ref || null,
      referrerDomain: referrerDomain && !isSelfReferral ? referrerDomain : null,
      referrerUrl: referrer && !isSelfReferral ? referrer : null,
      landingPath,
      capturedAt: new Date().toISOString()
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    return attribution;
  } catch {
    return null;
  }
}

export function getAttributionPayload() {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    return initAttribution() || {};
  } catch {
    return {};
  }
}
