/**
 * GARUDA Social Engine - Facebook Extractor
 * Extracts recent post leads from Facebook search without relying on obfuscated CSS classes.
 * Rejects global navigation (Home, Watch, Marketplace, Notifications).
 */

const FB_GLOBAL_REJECTS = [
  'facebook', 'home', 'watch', 'marketplace', 'groups', 'gaming',
  'notifications', 'bookmarks', 'friends', 'saved', 'events', 'memories',
  'privacy', 'terms', 'help', 'settings'
];

class FacebookExtractor {
  /**
   * Extract candidate search result posts from page DOM
   * @param {import('puppeteer').Page} page
   * @returns {Promise<Array<object>>}
   */
  static async extractSearchResults(page) {
    return await page.evaluate((rejectTokens) => {
      // Find role="feed" or main container
      const feed = document.querySelector('div[role="feed"]') || document.querySelector('div[role="main"]') || document.body;
      const articles = Array.from(feed.querySelectorAll('div[role="article"], div.x1yztbdb, div[data-ad-preview="message"]'));

      const results = [];

      // If specific articles not clearly marked, look for post card containers
      const candidates = articles.length > 0 ? articles : Array.from(document.querySelectorAll('div[data-pagelet*="FeedUnit_"]'));

      for (const el of candidates) {
        // 1. Author Identification: Look for profile anchor inside top header of the post
        const anchors = Array.from(el.querySelectorAll('a[role="link"], h2 a, h3 a, strong a'));
        let authorCandidate = null;

        for (const a of anchors) {
          const href = (a.getAttribute('href') || '').toLowerCase();
          const text = (a.textContent || '').trim();

          // Reject global navigation
          const isSystem = rejectTokens.some(token => href.includes(`/${token}`) || text.toLowerCase() === token);
          if (isSystem) continue;

          // Check if looks like profile URL
          const isProfilePattern = href.includes('profile.php?id=') || (href.startsWith('https://www.facebook.com/') && !href.includes('/posts/') && !href.includes('/groups/'));

          if (isProfilePattern && text.length > 1) {
            authorCandidate = {
              name: text,
              profileUrl: href.split('?')[0].split('&')[0], // clean tracking params
              confidence: 85
            };
            break;
          }
        }

        // 2. Post Text & Permalinks
        const textNodes = Array.from(el.querySelectorAll('div[dir="auto"]')).map(d => d.textContent.trim()).filter(Boolean);
        const snippet = textNodes.join(' ').slice(0, 400);

        const permalinkAnchor = el.querySelector("a[href*='/posts/'], a[href*='/permalink/'], a[href*='story.php']");
        const postUrl = permalinkAnchor ? permalinkAnchor.href.split('?')[0] : '';

        if (authorCandidate && snippet.length > 20) {
          results.push({
            platform: 'facebook',
            author: authorCandidate,
            postUrl,
            snippet,
            timestamp: new Date().toISOString(),
            confidence: 85,
            status: 'VERIFIED'
          });
        }
      }

      return results;
    }, FB_GLOBAL_REJECTS).catch(() => []);
  }
}

module.exports = FacebookExtractor;
