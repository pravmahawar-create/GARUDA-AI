/**
 * GARUDA Social Engine - Canonical Lead Normalizer
 * Enforces unified schema across all social and search platforms per Section 7 of Revenue Hunter Directive.
 */

const crypto = require('crypto');

class LeadNormalizer {
  /**
   * Normalizes raw extracted platform lead into unified GARUDA Canonical Lead schema
   * @param {string} platform - 'facebook' | 'instagram' | 'linkedin' | 'web' | 'search'
   * @param {object} raw - Extracted data
   * @param {Array<string>} intentSignals - Extracted buyer signals
   * @param {object} options - Optional metadata (score, category, evidence, etc.)
   * @returns {object} Canonical lead record
   */
  static normalize(platform, raw, intentSignals = [], options = {}) {
    const author = raw.author || {};
    const name = raw.name || author.name || author.username || 'UNKNOWN';
    const profileUrl = raw.profileUrl || author.profileUrl || '';
    const username = raw.username || author.username || (profileUrl ? profileUrl.split('/').filter(Boolean).pop() : 'UNKNOWN');
    const postUrl = raw.postUrl || raw.sourcePostUrl || '';
    const sourceText = raw.requirement || raw.snippet || raw.caption || raw.sourceText || '';
    const confidence = typeof raw.confidence === 'number' ? raw.confidence : (author.confidence || 0);
    const status = raw.status || (confidence >= 80 ? 'VERIFIED' : 'LOW_CONFIDENCE');
    const sourceType = raw.sourceType || options.sourceType || 'post';
    const company = raw.company || author.company || '';
    const location = raw.location || author.location || '';
    const qualificationScore = options.qualificationScore || raw.qualificationScore || confidence;
    const nowIso = new Date().toISOString();

    // Deterministic Lead ID based on platform + (profileUrl or username or postUrl)
    const identityString = `${platform.toLowerCase()}:${(profileUrl || username || postUrl).toLowerCase()}`;
    const leadId = raw.leadId || `lead_${crypto.createHash('sha256').update(identityString).digest('hex').slice(0, 16)}`;

    // Build evidence payload
    const evidence = raw.evidence || options.evidence || {
      extractedSnippet: sourceText.slice(0, 300),
      capturedAt: nowIso,
      evidenceHash: crypto.createHash('sha256').update(`${identityString}:${sourceText.slice(0, 300)}`).digest('hex')
    };

    return {
      leadId,
      platform: platform.toLowerCase(),
      sourceType,
      profileUrl,
      postUrl,
      sourcePostUrl: postUrl, // backward compatibility
      name,
      username,
      company,
      location,
      requirement: sourceText.slice(0, 1000),
      sourceText: sourceText.slice(0, 500), // backward compatibility
      intentSignals: Array.isArray(intentSignals) ? intentSignals : [],
      evidence,
      confidence,
      qualificationScore,
      discoveredAt: raw.discoveredAt || nowIso,
      lastSeenAt: nowIso,
      status,
      outreachStatus: raw.outreachStatus || 'NONE',
      responseStatus: raw.responseStatus || 'NONE'
    };
  }
}

module.exports = LeadNormalizer;
