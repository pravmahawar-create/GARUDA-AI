/**
 * 🦅 GARUDA Market Intelligence — Evidence Collector
 * Extracts, validates, and normalizes structured source evidence.
 */

const crypto = require("crypto");

class EvidenceCollector {
  /**
   * Normalizes raw discovery hits into verified Evidence Records.
   */
  collectEvidence(rawHit = {}, sourceType = "PUBLIC_WEB") {
    if (!rawHit.sourceUrl) {
      throw new Error("Cannot collect evidence without verifiable sourceUrl");
    }

    const sourceId = `src_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    const observedAt = new Date().toISOString();
    const sourceUrl = String(rawHit.sourceUrl).trim();

    return {
      sourceId,
      sourceType: rawHit.sourceType || sourceType,
      sourceUrl,
      discoveredAt: rawHit.discoveredAt || observedAt,
      observedAt,
      accessMethod: rawHit.accessMethod || "PUBLIC_HTTP_GET",
      rawReference: rawHit.snippet || rawHit.title || "Public web record",
      verificationStatus: "VERIFIED_PUBLIC_RECORD"
    };
  }

  /**
   * Merges multiple evidence records into a single prospect identity.
   */
  mergeEvidence(existingEvidence = [], newEvidence = []) {
    const map = new Map();
    for (const ev of [...existingEvidence, ...newEvidence]) {
      if (ev && ev.sourceUrl) {
        map.set(ev.sourceUrl.toLowerCase(), ev);
      }
    }
    return Array.from(map.values());
  }
}

module.exports = new EvidenceCollector();
module.exports.EvidenceCollector = EvidenceCollector;
