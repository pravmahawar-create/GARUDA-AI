/**
 * GARUDA Social Engine - LinkedIn Platform Adapter
 * Principle: Never endlessly retry on ERR_TOO_MANY_REDIRECTS.
 * Clean failure states, conservative detection.
 */

const SecurityChallengeDetector = require('../../core/securityChallengeDetector');

class LinkedInAdapter {
  constructor(sessionManager, healthMonitor) {
    this.sessionManager = sessionManager;
    this.healthMonitor = healthMonitor;
  }

  async verifyAuthentication(page) {
    try {
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 35000 });
      this.healthMonitor.recordNavigation('https://www.linkedin.com/feed/');
    } catch (err) {
      if (err.message && err.message.includes('ERR_TOO_MANY_REDIRECTS')) {
        this.healthMonitor.setAuthStatus('AUTH_EXPIRED');
        return {
          authenticated: false,
          status: 'FAILED',
          reason: 'TOO_MANY_REDIRECTS',
          retryable: false,
          details: 'LinkedIn session cookie invalidated or challenged by platform bot protection.'
        };
      }
      throw err;
    }

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'linkedin');
    if (challenge.detected) {
      this.healthMonitor.setSecurityChallenge(true);
      return { authenticated: false, challenge, retryable: false };
    }

    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint/') || currentUrl.includes('/authwall')) {
      this.healthMonitor.setAuthStatus('AUTH_EXPIRED');
      return { authenticated: false, reason: 'LOGIN_REQUIRED', retryable: false };
    }

    this.healthMonitor.setAuthStatus('VERIFIED');
    return { authenticated: true };
  }

  async searchPublicPosts(page, query) {
    const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(query)}&sortBy=%22date_posted%22`;
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
      this.healthMonitor.recordNavigation(searchUrl);
    } catch (err) {
      if (err.message && err.message.includes('ERR_TOO_MANY_REDIRECTS')) {
        return {
          leads: [],
          status: 'FAILED',
          reason: 'TOO_MANY_REDIRECTS',
          retryable: false
        };
      }
      throw err;
    }

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'linkedin');
    if (challenge.detected) {
      return { leads: [], challenge };
    }

    // Extract post cards
    const candidates = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.feed-shared-update-v2, div[data-urn*="activity"]'));
      const results = [];

      for (const card of cards) {
        const actorNameEl = card.querySelector('.update-components-actor__name, .feed-shared-actor__name');
        const actorLinkEl = card.querySelector('.update-components-actor__container-link, a.app-aware-link');
        const textEl = card.querySelector('.feed-shared-update-v2__description, .update-components-text');

        const name = actorNameEl ? actorNameEl.textContent.trim() : 'LinkedIn Member';
        const profileUrl = actorLinkEl ? actorLinkEl.href.split('?')[0] : '';
        const snippet = textEl ? textEl.textContent.trim().slice(0, 300) : '';

        if (name && name !== 'LinkedIn Member' && profileUrl) {
          results.push({
            platform: 'linkedin',
            author: { name, profileUrl, confidence: 90 },
            postUrl: '',
            snippet,
            timestamp: new Date().toISOString(),
            confidence: 90,
            status: 'VERIFIED'
          });
        }
      }
      return results;
    }).catch(() => []);

    return { leads: candidates, challenge: null };
  }
}

module.exports = LinkedInAdapter;
