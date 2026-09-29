/**
 * Instagram Extractor Regression Test
 * HARD GUARANTEE: Never accept global branding/navigation as post author.
 * Evaluates candidate ranking, scoring thresholds, and UNKNOWN fallback.
 */

const assert = require('assert');
const InstagramExtractor = require('../platforms/instagram/instagramExtractor');

class MockInstagramPage {
  constructor(mockAnchors, caption = '', timestamp = '') {
    this._anchors = mockAnchors;
    this._caption = caption;
    this._timestamp = timestamp;
  }

  isClosed() { return false; }

  async evaluate(fn, ...args) {
    // Construct fake DOM document
    const mockContainer = {
      querySelectorAll: (sel) => {
        if (sel === 'a') return this._anchors;
        return [];
      },
      querySelector: (sel) => {
        if (sel === 'time') return { getAttribute: () => this._timestamp, textContent: this._timestamp };
        if (sel === 'h1' || sel === 'article span') return { textContent: this._caption };
        return null;
      }
    };

    const originalDoc = global.document;
    try {
      global.document = {
        querySelector: (sel) => {
          if (sel === 'article' || sel === 'main') return mockContainer;
          return null;
        },
        body: mockContainer
      };
      return fn(...args);
    } finally {
      global.document = originalDoc;
    }
  }
}

function createAnchor({ href, text = '', ariaLabel = '', inHeader = false, inNav = false }) {
  return {
    getAttribute: (attr) => {
      if (attr === 'href') return href;
      if (attr === 'aria-label') return ariaLabel;
      return null;
    },
    textContent: text,
    closest: (tag) => {
      if (tag === 'header') return inHeader ? {} : null;
      if (tag === 'nav') return inNav ? {} : null;
      if (tag === 'footer') return null;
      return null;
    }
  };
}

async function runInstagramRegressionTests() {
  console.log('--- Testing Instagram Extractor Hard Guarantees ---');

  // Test Case 1: Post contains real author + Instagram branding + Navigation
  const anchors1 = [
    createAnchor({ href: '/instagram/', text: 'Instagram', inNav: true }),
    createAnchor({ href: '/explore/', text: 'Explore', inNav: true }),
    createAnchor({ href: '/acme_agency/', text: 'acme_agency', ariaLabel: 'acme_agency profile', inHeader: true }),
    createAnchor({ href: '/reels/', text: 'Reels', inNav: true }),
    createAnchor({ href: '/about/', text: 'About' })
  ];

  const page1 = new MockInstagramPage(anchors1, 'Need a reliable web developer for our new business platform');
  const res1 = await InstagramExtractor.extractPost(page1, 'https://www.instagram.com/p/test12345/');

  assert.strictEqual(res1.status, 'VERIFIED');
  assert.strictEqual(res1.author.username, 'acme_agency');
  assert.notStrictEqual(res1.author.username, 'Instagram');
  assert.notStrictEqual(res1.author.username, 'instagram');
  assert.ok(res1.confidence >= 80);

  // Test Case 2: Only system tokens and navigation present (Author link missing or obfuscated)
  const anchors2 = [
    createAnchor({ href: '/instagram/', text: 'Instagram', inNav: true }),
    createAnchor({ href: '/meta/', text: 'Meta' }),
    createAnchor({ href: '/explore/', text: 'Explore' })
  ];

  const page2 = new MockInstagramPage(anchors2, 'Just looking for recommendations');
  const res2 = await InstagramExtractor.extractPost(page2, 'https://www.instagram.com/p/broken/');

  // MUST degrade safely to UNKNOWN, never guess or return Instagram
  assert.strictEqual(res2.status, 'UNKNOWN');
  assert.strictEqual(res2.author.username, null);
  assert.strictEqual(res2.author.profileUrl, null);
  assert.strictEqual(res2.confidence, 0);

  // Test Case 3: Ambiguous anchor outside header with low confidence (<60)
  const anchors3 = [
    createAnchor({ href: '/randomuser/', text: 'random comment', inHeader: false })
  ];
  const page3 = new MockInstagramPage(anchors3, 'Check this out');
  const res3 = await InstagramExtractor.extractPost(page3, 'https://www.instagram.com/p/ambiguous/');

  // Score should be valid profile (+15), but not in header, no aria match -> score = 15 (<60) -> UNKNOWN
  assert.strictEqual(res3.status, 'UNKNOWN');
  assert.strictEqual(res3.author.username, null);

  console.log('✔ Instagram Extractor Regression: ALL ASSERTIONS PASSED (Zero False Attribution)');
  return true;
}

if (require.main === module) {
  runInstagramRegressionTests();
}

module.exports = runInstagramRegressionTests;
