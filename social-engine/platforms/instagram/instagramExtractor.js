/**
 * GARUDA Social Engine - Instagram Extraction Engine
 * Principle 1: Truth first. Never accept global branding/navigation as post author.
 * Solves the historical "username = Instagram" bug with multi-stage scoring.
 */

const SYSTEM_REJECT_TOKENS = [
  'instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories',
  'about', 'blog', 'jobs', 'help', 'api', 'privacy', 'terms', 'locations',
  'instagram lite', 'contact uploading & non-users', 'meta verified'
];

class InstagramExtractor {
  /**
   * Evaluate candidate links inside an Instagram post page or container
   * @param {import('puppeteer').Page} page
   * @param {string} postUrl
   * @returns {Promise<object>}
   */
  static async extractPost(page, postUrl) {
    const rawResult = await page.evaluate((systemTokens, pUrl) => {
      // 1. Locate primary post container
      const container = document.querySelector('article') || document.querySelector('main') || document.body;
      if (!container) {
        return { author: null, caption: '', timestamp: '', score: 0, reason: 'NO_CONTAINER' };
      }

      // 2. Discover all candidate anchors
      const anchors = Array.from(container.querySelectorAll('a'));
      const candidates = [];

      for (const a of anchors) {
        const href = (a.getAttribute('href') || '').trim();
        const text = (a.textContent || '').trim();
        const ariaLabel = (a.getAttribute('aria-label') || '').trim();

        // Must look like a profile path: e.g. "/username/" or "https://www.instagram.com/username/"
        const cleanHref = href.replace(/^https?:\/\/(www\.)?instagram\.com/, '').replace(/^\/+|\/+$/g, '');
        const segments = cleanHref.split('/').filter(Boolean);

        if (segments.length !== 1) continue; // Exclude multi-segment routes like /p/ID/, /explore/, etc.
        const candidateUsername = segments[0].toLowerCase();

        // 3. Multi-stage scoring
        let score = 0;
        let rejectReason = null;

        // Severe Penalties for System & Navigation links
        if (systemTokens.includes(candidateUsername)) {
          score -= 100;
          rejectReason = 'SYSTEM_BRANDING_MATCH';
        }

        // Check if inside header / article author area
        const isInHeader = a.closest('header') !== null;
        if (isInHeader) score += 40;

        // Accessible name matches username
        if (ariaLabel.toLowerCase().includes(candidateUsername) || text.toLowerCase() === candidateUsername) {
          score += 25;
        }

        // Profile link structure validity
        if (/^[a-zA-Z0-9._]{1,30}$/.test(candidateUsername)) {
          score += 15;
        }

        // Penalty if link is in navigation or footer
        if (a.closest('nav') || a.closest('footer')) {
          score -= 100;
          rejectReason = 'NAVIGATION_OR_FOOTER_ELEMENT';
        }

        candidates.push({
          rawUsername: segments[0],
          cleanUsername: candidateUsername,
          href: `https://www.instagram.com/${candidateUsername}/`,
          score,
          rejectReason,
          isInHeader
        });
      }

      // Filter out rejected and rank by score
      const valid = candidates.filter(c => c.score > 0 && !c.rejectReason);
      valid.sort((a, b) => b.score - a.score);

      // Extract caption and timestamp
      const timeEl = container.querySelector('time');
      const timestamp = timeEl ? (timeEl.getAttribute('datetime') || timeEl.textContent || '') : '';
      
      const h1OrCaption = container.querySelector('h1') || container.querySelector('article span');
      const caption = h1OrCaption ? (h1OrCaption.textContent || '').trim().slice(0, 500) : '';

      return {
        bestCandidate: valid.length > 0 ? valid[0] : null,
        caption,
        timestamp,
        candidateCount: valid.length
      };
    }, SYSTEM_REJECT_TOKENS, postUrl).catch((err) => ({ error: err.message }));

    if (rawResult.error || !rawResult.bestCandidate) {
      return {
        platform: 'instagram',
        postUrl,
        author: {
          username: null,
          profileUrl: null,
          confidence: 0
        },
        caption: rawResult.caption || '',
        timestamp: rawResult.timestamp || '',
        mediaType: 'POST',
        confidence: 0,
        status: 'UNKNOWN'
      };
    }

    const { bestCandidate } = rawResult;
    let status = 'UNKNOWN';
    let confidence = bestCandidate.score;

    if (confidence >= 80) {
      status = 'VERIFIED';
    } else if (confidence >= 60) {
      status = 'LOW_CONFIDENCE';
    } else {
      status = 'UNKNOWN';
    }

    return {
      platform: 'instagram',
      postUrl,
      author: {
        username: status !== 'UNKNOWN' ? bestCandidate.rawUsername : null,
        profileUrl: status !== 'UNKNOWN' ? bestCandidate.href : null,
        confidence
      },
      caption: rawResult.caption || '',
      timestamp: rawResult.timestamp || '',
      mediaType: 'POST',
      confidence,
      status
    };
  }
}

module.exports = InstagramExtractor;
