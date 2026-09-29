/**
 * GARUDA Social Engine - Telegram Alert Service
 * Principle: Never expose sensitive tokens or cookies in alert messages.
 */

class TelegramAlertService {
  constructor(client = null) {
    if (client) {
      this.client = client;
    } else {
      try {
        this.client = require('../../src/services/telegramBotService');
      } catch (_) {
        this.client = null;
      }
    }
  }

  _sanitize(text) {
    if (typeof text !== 'string') return '';
    // Strip potential cookies / secrets
    return text
      .replace(/li_at=[^;\s&]+/gi, 'li_at=[REDACTED]')
      .replace(/c_user=[^;\s&]+/gi, 'c_user=[REDACTED]')
      .replace(/xs=[^;\s&]+/gi, 'xs=[REDACTED]')
      .replace(/sessionid=[^;\s&]+/gi, 'sessionid=[REDACTED]')
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');
  }

  async sendAlert(level, title, message, metadata = {}) {
    const icons = {
      INFO: 'ℹ️',
      WARNING: '🟡',
      ERROR: '🔴',
      CRITICAL: '🚨',
      SECURITY: '🛡️⚠️'
    };

    const icon = icons[level] || '📢';
    const sanitizedMsg = this._sanitize(message);

    const payload = `${icon} [GARUDA SOCIAL ENGINE] ${level}\n*${title}*\n\n${sanitizedMsg}\n\nTime: ${new Date().toISOString()}`;

    if (this.client && typeof this.client.sendMessage === 'function') {
      try {
        await this.client.sendMessage(payload);
        return { delivered: true };
      } catch (err) {
        console.error('[TelegramAlertService] Delivery failed:', err.message);
        return { delivered: false, error: err.message };
      }
    } else {
      console.log(`[TelegramAlertFallback] ${payload}`);
      return { delivered: false, reason: 'CLIENT_UNAVAILABLE' };
    }
  }
}

module.exports = TelegramAlertService;
