/**
 * GARUDA Social Engine - Global Deduplication & Opt-Out Registry
 * Deduplicates leads and outreach across Facebook, Instagram, LinkedIn, Web, Search, Comments, and Replies.
 * Enforces permanent DO_NOT_CONTACT registry per Section 8 & 13 of Revenue Hunter Directive.
 */

const fs = require('fs');
const path = require('path');

class LeadDeduplication {
  constructor(storageFilePath = null) {
    this.storageFile = storageFilePath || path.join(__dirname, '..', '..', 'data', 'leads', 'social_dedup_index.json');
    const dir = path.dirname(this.storageFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.index = this._loadIndex();
  }

  _loadIndex() {
    if (fs.existsSync(this.storageFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        return {
          leads: data.leads || {},
          contacted: data.contacted || {},
          optOuts: data.optOuts || {},
          crossPlatformMap: data.crossPlatformMap || {}
        };
      } catch (_) {
        return { leads: {}, contacted: {}, optOuts: {}, crossPlatformMap: {} };
      }
    }
    return { leads: {}, contacted: {}, optOuts: {}, crossPlatformMap: {} };
  }

  _saveIndex() {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.index, null, 2), 'utf8');
    } catch (err) {
      console.error('[LeadDeduplication] Failed to persist dedup index:', err.message);
    }
  }

  _cleanIdentity(identity) {
    if (!identity || typeof identity !== 'string') return '';
    return identity.toLowerCase().trim()
      .replace(/^https?:\/\/(www\.)?/, '')
      .replace(/\/+$/, '')
      .replace(/[?#].*$/, '');
  }

  _generateKey(platform, identity) {
    const cleanId = this._cleanIdentity(identity);
    return `${(platform || 'generic').toLowerCase()}::${cleanId}`;
  }

  /**
   * Check if a lead has already been discovered (per platform or cross-platform)
   */
  isDuplicateLead(platform, identity) {
    this.index = this._loadIndex();
    const key = this._generateKey(platform, identity);
    if (this.index.leads[key]) return true;

    // Check cross-platform map (e.g. if company or website is identical)
    const clean = this._cleanIdentity(identity);
    if (clean && this.index.crossPlatformMap[clean]) return true;

    return false;
  }

  /**
   * Check if a prospect has already been sent an outreach message
   */
  isAlreadyContacted(platform, identity) {
    this.index = this._loadIndex();
    const key = this._generateKey(platform, identity);
    if (this.index.contacted[key]) return true;

    const clean = this._cleanIdentity(identity);
    if (clean && this.index.crossPlatformMap[clean]) {
      const canonicalKey = this.index.crossPlatformMap[clean];
      if (this.index.contacted[canonicalKey]) return true;
    }

    return false;
  }

  /**
   * Check if an identity is in the permanent DO_NOT_CONTACT opt-out list
   */
  isOptedOut(identity) {
    this.index = this._loadIndex();
    const clean = this._cleanIdentity(identity);
    if (!clean) return false;
    return Boolean(this.index.optOuts[clean]);
  }

  /**
   * Record a permanent DO_NOT_CONTACT opt-out
   */
  recordOptOut(identity, reason = 'OPT_OUT_REQUESTED') {
    const clean = this._cleanIdentity(identity);
    if (!clean) return;
    this.index = this._loadIndex();
    this.index.optOuts[clean] = {
      optedOutAt: new Date().toISOString(),
      reason
    };
    this._saveIndex();
    console.log(`[LeadDeduplication] 🛑 Identity recorded in DO_NOT_CONTACT: ${clean} (${reason})`);
  }

  /**
   * Register a newly discovered lead into the global index
   */
  registerLead(lead) {
    this.index = this._loadIndex();
    const primaryKey = this._generateKey(lead.platform, lead.profileUrl || lead.username || lead.leadId);
    this.index.leads[primaryKey] = {
      leadId: lead.leadId,
      name: lead.name,
      platform: lead.platform,
      registeredAt: new Date().toISOString()
    };

    // Cross-platform aliases (company, website domain, handle)
    const aliases = [lead.username, lead.profileUrl, lead.company].filter(Boolean);
    for (const alias of aliases) {
      const cleanAlias = this._cleanIdentity(alias);
      if (cleanAlias && cleanAlias.length > 3) {
        this.index.crossPlatformMap[cleanAlias] = primaryKey;
      }
    }

    this._saveIndex();
  }

  /**
   * Record that outreach was dispatched to this lead
   */
  recordContacted(platform, identity, details = {}) {
    this.index = this._loadIndex();
    const key = this._generateKey(platform, identity);
    this.index.contacted[key] = {
      contactedAt: new Date().toISOString(),
      ...details
    };

    const clean = this._cleanIdentity(identity);
    if (clean) {
      this.index.crossPlatformMap[clean] = key;
    }

    this._saveIndex();
  }
}

module.exports = LeadDeduplication;
