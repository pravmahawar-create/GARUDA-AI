/**
 * GARUDA Social Engine - Instagram Platform Adapter
 */

const InstagramExtractor = require('./instagramExtractor');
const SecurityChallengeDetector = require('../../core/securityChallengeDetector');

class InstagramAdapter {
  constructor(sessionManager, healthMonitor) {
    this.sessionManager = sessionManager;
    this.healthMonitor = healthMonitor;
  }

  async verifyAuthentication(page) {
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    this.healthMonitor.recordNavigation('https://www.instagram.com/');

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'instagram');
    if (challenge.detected) {
      this.healthMonitor.setSecurityChallenge(true);
      return { authenticated: false, challenge };
    }

    const currentUrl = page.url();
    if (currentUrl.includes('/accounts/login') || currentUrl.includes('/challenge/')) {
      this.healthMonitor.setAuthStatus('AUTH_EXPIRED');
      return { authenticated: false, reason: 'LOGIN_REQUIRED' };
    }

    this.healthMonitor.setAuthStatus('VERIFIED');
    return { authenticated: true };
  }

  async discoverHashtagPosts(page, hashtag, limit = 5) {
    const cleanTag = hashtag.replace(/^#/, '');
    const url = `https://www.instagram.com/explore/tags/${encodeURIComponent(cleanTag)}/`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    this.healthMonitor.recordNavigation(url);

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'instagram');
    if (challenge.detected) {
      return { posts: [], challenge };
    }

    // Gentle scroll to allow lazy-loaded hashtag grid to mount DOM anchors
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 2500));

    const postLinks = await page.evaluate((max) => {
      const links = Array.from(document.querySelectorAll("a[href*='/p/']"));
      return links.slice(0, max).map(a => a.href);
    }, limit).catch(() => []);

    return { posts: postLinks, challenge: null };
  }

  async extractPostDetails(page, postUrl) {
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    this.healthMonitor.recordNavigation(postUrl);

    const challenge = await SecurityChallengeDetector.evaluatePage(page, 'instagram');
    if (challenge.detected) {
      return { extracted: null, challenge };
    }

    const extracted = await InstagramExtractor.extractPost(page, postUrl);
    return { extracted, challenge: null };
  }
}

module.exports = InstagramAdapter;
