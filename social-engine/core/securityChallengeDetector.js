/**
 * GARUDA Social Engine - Security Challenge Detector
 * Principle 2: Security controls are NEVER bypassed or defeated.
 * When a challenge is detected: STOP WORKER -> PRESERVE EVIDENCE -> ALERT FOUNDER.
 */

const CHALLENGE_SIGNALS = [
  // Generic / Cloudflare / Arkose
  { type: 'CLOUDFLARE_TURNSTILE', patterns: ['challenges.cloudflare.com', 'cf-turnstile', '__cf_bm', 'ray id', 'challenge-running'] },
  { type: 'CAPTCHA_GENERIC', patterns: ['recaptcha', 'g-recaptcha', 'hcaptcha', 'arkoselabs', 'funcaptcha'] },
  
  // LinkedIn
  { type: 'LINKEDIN_CHECKPOINT', patterns: ['/checkpoint/challenge/', '/checkpoint/lg/login-submit', 'checkpoint/security-check', 'unusual activity'] },
  { type: 'LINKEDIN_AUTH_WALL', patterns: ['/authwall', 'sign-in to view', 'join linkedin to view'] },
  
  // Facebook
  { type: 'FACEBOOK_CHECKPOINT', patterns: ['/checkpoint/', 'checkpoint/block', 'confirm your identity', 'security check', 'account temporarily locked'] },
  { type: 'FACEBOOK_CAPTCHA', patterns: ['captcha', 'please enter the text above'] },
  
  // Instagram
  { type: 'INSTAGRAM_CHALLENGE', patterns: ['/challenge/', 'challenge/choice', 'suspicious login attempt', 'help us confirm you own this account'] },
  { type: 'INSTAGRAM_ACTION_BLOCKED', patterns: ['action blocked', 'try again later', 'we restrict certain activity'] }
];

class SecurityChallengeDetector {
  /**
   * Evaluate a page for security challenges conservatively
   * @param {import('puppeteer').Page} page
   * @param {string} platform
   * @returns {Promise<{ detected: boolean, type: string|null, confidence: string, details: string }>}
   */
  static async evaluatePage(page, platform = 'generic') {
    if (!page || page.isClosed()) {
      return { detected: false, type: null, confidence: 'UNKNOWN', details: 'Page is closed' };
    }

    try {
      const url = (page.url() || '').toLowerCase();
      const title = (await page.title().catch(() => '')).toLowerCase();

      // Check URL and Title first (lightweight)
      for (const signal of CHALLENGE_SIGNALS) {
        for (const pattern of signal.patterns) {
          if (url.includes(pattern) || title.includes(pattern)) {
            return {
              detected: true,
              type: signal.type,
              confidence: 'HIGH_CONFIDENCE',
              details: `Matched pattern '${pattern}' in url/title (${url})`
            };
          }
        }
      }

      // Check DOM text and iframes
      const domSignals = await page.evaluate((signals) => {
        const text = (document.body ? document.body.innerText || '' : '').toLowerCase().slice(0, 3000);
        const iframes = Array.from(document.querySelectorAll('iframe')).map(f => (f.src || '').toLowerCase());

        for (const signal of signals) {
          for (const pattern of signal.patterns) {
            if (text.includes(pattern)) {
              return { detected: true, type: signal.type, match: `body text: ${pattern}` };
            }
            for (const src of iframes) {
              if (src.includes(pattern)) {
                return { detected: true, type: signal.type, match: `iframe: ${src}` };
              }
            }
          }
        }
        return { detected: false };
      }, CHALLENGE_SIGNALS).catch(() => ({ detected: false }));

      if (domSignals.detected) {
        return {
          detected: true,
          type: domSignals.type,
          confidence: 'HIGH_CONFIDENCE',
          details: `Matched in DOM: ${domSignals.match}`
        };
      }

      return {
        detected: false,
        type: null,
        confidence: 'VERIFIED',
        details: 'No security challenge patterns identified'
      };
    } catch (err) {
      return {
        detected: false,
        type: null,
        confidence: 'UNKNOWN',
        details: `Evaluation failed: ${err.message}`
      };
    }
  }
}

module.exports = SecurityChallengeDetector;
