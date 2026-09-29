/**
 * GARUDA Outreach Policy Engine
 * Governs platform permissions, rate limits, opt-outs, and Founder Autonomy Controls.
 * Autonomy Modes: SAFE_AUTONOMOUS | APPROVAL_REQUIRED | STOPPED.
 * Conforms to Section 5, 10 & 21 of Revenue Hunter Directive.
 */

const fs = require('fs');
const path = require('path');
const LeadDeduplication = require('../leads/leadDeduplication');

const KILL_SWITCH_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'kill_switch.json');
const AUTONOMY_MODE_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'autonomy_mode.json');

const AUTONOMY_MODES = {
  SAFE_AUTONOMOUS: 'SAFE_AUTONOMOUS',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  STOPPED: 'STOPPED'
};

class OutreachPolicyEngine {
  constructor(options = {}) {
    this.options = options;
    this.dedup = new LeadDeduplication(options.dedupFile);
    this.dailyLimits = {
      facebook: options.fbDailyLimit || 10,
      instagram: options.igDailyLimit || 10,
      linkedin: options.liDailyLimit || 0, // 0 because LinkedIn is SECURITY_BLOCKED
      web: options.webDailyLimit || 20,
      global: options.globalDailyLimit || 30
    };
  }

  static get AUTONOMY_MODES() {
    return AUTONOMY_MODES;
  }

  /**
   * Get current autonomy mode: SAFE_AUTONOMOUS | APPROVAL_REQUIRED | STOPPED
   * @returns {string}
   */
  static getAutonomyMode() {
    if (process.env.STOP_ALL_AUTONOMOUS_OUTREACH === 'true') {
      return AUTONOMY_MODES.STOPPED;
    }
    if (process.env.GARUDA_AUTONOMY_MODE) {
      const envMode = process.env.GARUDA_AUTONOMY_MODE.toUpperCase();
      if (AUTONOMY_MODES[envMode]) return envMode;
    }
    if (fs.existsSync(AUTONOMY_MODE_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(AUTONOMY_MODE_FILE, 'utf8'));
        if (data.mode && AUTONOMY_MODES[data.mode]) {
          return data.mode;
        }
      } catch (_) {}
    }
    // Default mode is strictly APPROVAL_REQUIRED (Human-in-the-loop)
    return AUTONOMY_MODES.APPROVAL_REQUIRED;
  }

  /**
   * Update the autonomy mode
   * @param {string} mode - 'SAFE_AUTONOMOUS' | 'APPROVAL_REQUIRED' | 'STOPPED'
   * @param {string} actor
   * @param {string} reason
   */
  static setAutonomyMode(mode, actor = 'founder_praveen', reason = 'Founder control update') {
    const targetMode = (mode || '').toUpperCase();
    if (!AUTONOMY_MODES[targetMode]) {
      throw new Error(`Invalid autonomy mode: ${mode}. Must be SAFE_AUTONOMOUS, APPROVAL_REQUIRED, or STOPPED.`);
    }

    const dir = path.dirname(AUTONOMY_MODE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const payload = {
      mode: targetMode,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
      reason
    };

    fs.writeFileSync(AUTONOMY_MODE_FILE, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`[OutreachPolicyEngine] 🔄 Autonomy Mode changed to: ${targetMode} by ${actor}`);
    return payload;
  }

  /**
   * Check if Founder Global Kill Switch is engaged
   * @returns {boolean}
   */
  static isKillSwitchActive() {
    if (process.env.STOP_ALL_AUTONOMOUS_OUTREACH === 'true') {
      return true;
    }
    if (fs.existsSync(KILL_SWITCH_FILE)) {
      try {
        const state = JSON.parse(fs.readFileSync(KILL_SWITCH_FILE, 'utf8'));
        return Boolean(state.active);
      } catch (_) {
        return false;
      }
    }
    return false;
  }

  /**
   * Set Founder Global Kill Switch state
   * @param {boolean} active
   * @param {string} actor
   * @param {string} reason
   */
  static setKillSwitch(active, actor = 'founder_praveen', reason = 'Manual trigger') {
    const dir = path.dirname(KILL_SWITCH_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const payload = {
      active: Boolean(active),
      setAt: new Date().toISOString(),
      setBy: actor,
      reason
    };

    fs.writeFileSync(KILL_SWITCH_FILE, JSON.stringify(payload, null, 2), 'utf8');
    if (active) {
      OutreachPolicyEngine.setAutonomyMode(AUTONOMY_MODES.STOPPED, actor, `Kill Switch engaged: ${reason}`);
    }
    console.log(`[OutreachPolicyEngine] ⚠️ Founder Kill Switch set to ${active ? 'ENGAGED (HALT ALL)' : 'DISENGAGED'}`);
    return payload;
  }

  /**
   * Evaluates permissions for a given platform action and prospect
   * @param {object} params
   * @param {string} params.platform - 'facebook' | 'instagram' | 'linkedin' | 'web'
   * @param {string} params.action - 'DISCOVER' | 'EXTRACT' | 'COMMENT' | 'DM' | 'CONNECT' | 'FOLLOW_UP'
   * @param {object} params.lead - Canonical lead record
   * @param {number} params.dailyCount - Messages sent today on this platform
   * @returns {{ allowed: boolean, reason: string, route: string, mode: string }}
   */
  evaluate({ platform, action, lead = {}, dailyCount = 0 }) {
    const p = (platform || '').toLowerCase();
    const act = (action || '').toUpperCase();
    const currentMode = OutreachPolicyEngine.getAutonomyMode();
    const killActive = OutreachPolicyEngine.isKillSwitchActive();

    // 1. Global Kill Switch or STOPPED Mode Check (Stops ALL outbound actions immediately)
    if ((killActive || currentMode === AUTONOMY_MODES.STOPPED) && ['DM', 'COMMENT', 'FOLLOW_UP'].includes(act)) {
      return {
        allowed: false,
        reason: killActive
          ? 'GLOBAL_KILL_SWITCH_ACTIVE: Founder emergency halt is engaged.'
          : 'AUTONOMY_MODE_STOPPED: Outbound actions paused by Founder control.',
        route: 'HALTED',
        mode: currentMode
      };
    }

    // 2. Opt-Out / DO_NOT_CONTACT Protection
    const identity = lead.profileUrl || lead.username || lead.leadId || '';
    if (this.dedup.isOptedOut(identity)) {
      return {
        allowed: false,
        reason: 'DO_NOT_CONTACT: Prospect requested opt-out.',
        route: 'DO_NOT_CONTACT',
        mode: currentMode
      };
    }

    // 3. Platform-specific security status
    if (p === 'linkedin') {
      return {
        allowed: false,
        reason: 'PLATFORM_SECURITY_BLOCKED: LinkedIn is challenged. Zero circumvention allowed.',
        route: 'SECURITY_BLOCKED',
        mode: currentMode
      };
    }

    // 4. Rate Limit Verification
    const maxForPlatform = this.dailyLimits[p] || 10;
    if (dailyCount >= maxForPlatform && ['DM', 'COMMENT'].includes(act)) {
      return {
        allowed: false,
        reason: `RATE_LIMIT_EXCEEDED: Daily limit of ${maxForPlatform} reached for ${p}.`,
        route: 'RATE_LIMITED',
        mode: currentMode
      };
    }

    // 5. Action Capability Matrix
    if (act === 'DISCOVER' || act === 'EXTRACT') {
      return { allowed: true, reason: 'PERMITTED_DISCOVERY', route: 'AUTOMATED', mode: currentMode };
    }

    if (act === 'DM') {
      if (p === 'facebook') {
        if (currentMode === AUTONOMY_MODES.SAFE_AUTONOMOUS) {
          return {
            allowed: true,
            reason: 'PERMITTED_SAFE_AUTONOMOUS',
            route: 'AUTONOMOUS_DISPATCH',
            mode: currentMode
          };
        }
        // Default APPROVAL_REQUIRED
        return {
          allowed: true,
          reason: 'PERMITTED_WITH_FOUNDER_APPROVAL',
          route: 'FOUNDER_GATED',
          mode: currentMode
        };
      }

      if (p === 'instagram') {
        return {
          allowed: false,
          reason: 'MANUAL_ACTION_REQUIRED: Instagram DM requires official Graph API or manual dispatch.',
          route: 'MANUAL_ACTION_REQUIRED',
          mode: currentMode
        };
      }

      if (p === 'web') {
        return {
          allowed: false,
          reason: 'MANUAL_ACTION_REQUIRED: Web lead contact requires official email or inquiry form.',
          route: 'MANUAL_ACTION_REQUIRED',
          mode: currentMode
        };
      }
    }

    if (act === 'COMMENT') {
      return {
        allowed: false,
        reason: 'COMMENT_DRAFT_ONLY: Automated commenting prohibited to protect brand reputation.',
        route: 'COMMENT_DRAFT_ONLY',
        mode: currentMode
      };
    }

    if (act === 'FOLLOW_UP') {
      if (lead.outreachStatus !== 'SENT') {
        return {
          allowed: false,
          reason: 'FOLLOW_UP_INELIGIBLE: Initial message was never successfully sent.',
          route: 'INELIGIBLE',
          mode: currentMode
        };
      }
      if (currentMode === AUTONOMY_MODES.SAFE_AUTONOMOUS) {
        return {
          allowed: true,
          reason: 'PERMITTED_SAFE_AUTONOMOUS_FOLLOW_UP',
          route: 'AUTONOMOUS_DISPATCH',
          mode: currentMode
        };
      }
      return {
        allowed: true,
        reason: 'PERMITTED_SINGLE_FOLLOW_UP',
        route: 'FOUNDER_GATED',
        mode: currentMode
      };
    }

    return { allowed: false, reason: 'UNSUPPORTED_ACTION', route: 'BLOCKED', mode: currentMode };
  }
}

module.exports = OutreachPolicyEngine;
