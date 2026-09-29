/**
 * GARUDA Content Policy & Founder Governance Manager
 * Controls autonomy modes, platform whitelists, topic blacklists,
 * daily frequency limits, and the immediate Global Content Kill Switch.
 */

const fs = require('fs');
const path = require('path');

const POLICY_FILE = path.resolve(__dirname, '../../data/content/content_policy.json');

const DEFAULT_POLICY = {
  postingMode: 'AUTONOMOUS', // 'AUTONOMOUS' | 'APPROVAL_REQUIRED' | 'STOPPED'
  killSwitch: false,
  enabledPlatforms: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'],
  dailyPlatformLimits: {
    LINKEDIN: 2,
    FACEBOOK: 3,
    INSTAGRAM: 2,
    YOUTUBE: 2
  },
  approvedCategories: [
    'ARCHITECTURE',
    'ENGINEERING',
    'AI_AGENTS',
    'MCP_PROTOCOL',
    'BILLING_INFRASTRUCTURE',
    'CYBERSHIELD_DEFENSE',
    'CASE_STUDY'
  ],
  blacklistedTopics: [
    'crypto speculative',
    'get rich quick',
    'guaranteed returns',
    'unverified client names'
  ],
  approvedCtaPatterns: [
    'DISCUSS_ARCHITECTURE',
    'COMMUNITY_CONVERSATION',
    'SAVE_AND_SHARE',
    'SUBSCRIBE',
    'LEARN_MORE'
  ],
  lastUpdated: new Date().toISOString(),
  updatedBy: 'founder_praveen'
};

class ContentPolicyManager {
  static _policy = null;

  static loadPolicy() {
    try {
      if (fs.existsSync(POLICY_FILE)) {
        this._policy = JSON.parse(fs.readFileSync(POLICY_FILE, 'utf8'));
      } else {
        this._policy = { ...DEFAULT_POLICY };
        this.savePolicy(this._policy);
      }
    } catch (e) {
      this._policy = { ...DEFAULT_POLICY };
    }
    return this._policy;
  }

  static getPolicy() {
    if (!this._policy) this.loadPolicy();
    return this._policy;
  }

  static savePolicy(newPolicy) {
    this._policy = {
      ...this.getPolicy(),
      ...newPolicy,
      lastUpdated: new Date().toISOString()
    };
    try {
      const dir = path.dirname(POLICY_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(POLICY_FILE, JSON.stringify(this._policy, null, 2), 'utf8');
    } catch (e) {
      console.warn(`[ContentPolicyManager] Could not write policy file: ${e.message}`);
    }
    return this._policy;
  }

  static setPostingMode(mode, author = 'founder_praveen') {
    const validModes = ['AUTONOMOUS', 'APPROVAL_REQUIRED', 'STOPPED'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid posting mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }
    return this.savePolicy({ postingMode: mode, updatedBy: author });
  }

  static setKillSwitch(active, reason = 'Founder Command') {
    const isEngaged = Boolean(active);
    return this.savePolicy({
      killSwitch: isEngaged,
      postingMode: isEngaged ? 'STOPPED' : 'AUTONOMOUS',
      killSwitchReason: reason,
      updatedBy: 'founder_praveen'
    });
  }

  static isPlatformEnabled(platform) {
    const policy = this.getPolicy();
    if (policy.killSwitch || policy.postingMode === 'STOPPED') return false;
    return policy.enabledPlatforms.includes((platform || '').toUpperCase());
  }

  static isTopicAllowed(topic) {
    const policy = this.getPolicy();
    const lower = (topic || '').toLowerCase();
    for (const blacklisted of policy.blacklistedTopics) {
      if (lower.includes(blacklisted.toLowerCase())) return false;
    }
    return true;
  }
}

module.exports = ContentPolicyManager;
