/**
 * GARUDA Social Engine - Truth Lock at Dispatch
 * Principle: GARUDA Anti-Fabrication Law. Never dispatch unsupported or exaggerated claims.
 * Adheres strictly to Section 0 & 9 of Revenue Hunter Directive.
 */

const https = require('https');

const FORBIDDEN_BUZZWORDS = [
  /\benterprise-grade\b/i,
  /\bworld-class\b/i,
  /\bindustry-leading\b/i,
  /\bproven track record\b/i,
  /\bguaranteed results\b/i,
  /\bhigh-performance\b/i,
  /\bfortune 500\b/i,
  /\bofficial partner of (google|apple|microsoft|meta)\b/i,
  /\b100% money back\b/i,
  /\branked #1\b/i
];

const FABRICATED_CLAIM_PATTERNS = [
  /\bwe have built over \d+ apps\b/i,
  /\bwe have \d+ engineers on staff\b/i,
  /\bour team of \d+ developers\b/i,
  /\bclients like (uber|netflix|amazon|airbnb)\b/i
];

class TruthVerifier {
  /**
   * Verify that the outbound message adheres to the 100% Anti-Fabrication Law
   * @param {string} pitch
   * @param {object} lead
   * @returns {Promise<{ verified: boolean, reason?: string }>}
   */
  static async verifyMessage(pitch, lead) {
    if (!pitch || typeof pitch !== 'string' || pitch.length < 20) {
      return { verified: false, reason: 'PITCH_TOO_SHORT_OR_EMPTY' };
    }

    // 1. Check for prohibited buzzwords
    for (const regex of FORBIDDEN_BUZZWORDS) {
      if (regex.test(pitch)) {
        return {
          verified: false,
          reason: `TRUTH_VERIFICATION_REQUIRED: Prohibited exaggerated buzzword detected (${regex})`
        };
      }
    }

    // 2. Check for fabricated claims
    for (const regex of FABRICATED_CLAIM_PATTERNS) {
      if (regex.test(pitch)) {
        return {
          verified: false,
          reason: `TRUTH_VERIFICATION_REQUIRED: Unsupported fabricated claim detected (${regex})`
        };
      }
    }

    // 3. Female developer identity guardrail
    // If the pitch mentions "female developer", it MUST clearly disclose non-impersonation
    if (/\bfemale developer\b/i.test(pitch)) {
      const hasTransparentDisclosure = /\brather than an individual female developer\b/i.test(pitch) ||
                                       /\bnot an individual female developer\b/i.test(pitch);
      if (!hasTransparentDisclosure) {
        return {
          verified: false,
          reason: 'TRUTH_VERIFICATION_REQUIRED: False gender identity claim detected without mandatory transparency disclosure'
        };
      }
    }

    // 4. Destination accessibility check (garudaos.in)
    if (/garudaos\.in/i.test(pitch)) {
      const isReachable = await this._checkDomainHealth('www.garudaos.in');
      if (!isReachable) {
        return {
          verified: false,
          reason: 'TRUTH_VERIFICATION_REQUIRED: Destination garudaos.in is not reachable'
        };
      }
    }

    return { verified: true };
  }

  static _checkDomainHealth(hostname) {
    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname,
          path: '/',
          method: 'HEAD',
          timeout: 7000
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        }
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  }
}

module.exports = TruthVerifier;
