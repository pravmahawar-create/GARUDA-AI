/**
 * Security Challenge Detector Test Suite
 * Principle 2: Test conservative detection on Turnstile, Captcha, Checkpoint. Zero bypass.
 */

const assert = require('assert');
const SecurityChallengeDetector = require('../core/securityChallengeDetector');

class MockPage {
  constructor({ url = 'https://example.com', title = 'Example Domain', bodyText = '', iframes = [] } = {}) {
    this._url = url;
    this._title = title;
    this._bodyText = bodyText;
    this._iframes = iframes;
    this._closed = false;
  }

  url() { return this._url; }
  async title() { return this._title; }
  isClosed() { return this._closed; }

  async evaluate(fn, arg) {
    // Provide a mocked DOM environment for the evaluation function
    const mockDoc = {
      body: { innerText: this._bodyText },
      querySelectorAll: (sel) => {
        if (sel === 'iframe') {
          return this._iframes.map(src => ({ src }));
        }
        return [];
      }
    };
    // Run evaluation in mock scope
    const originalDoc = global.document;
    try {
      global.document = mockDoc;
      return fn(arg);
    } finally {
      global.document = originalDoc;
    }
  }
}

async function runSecurityDetectorTests() {
  console.log('--- Testing Security Challenge Detector ---');

  // 1. Cloudflare Turnstile detection by URL / iframe
  const p1 = new MockPage({
    url: 'https://www.linkedin.com/checkpoint/challenge/12345',
    title: 'Security Verification | LinkedIn'
  });
  const res1 = await SecurityChallengeDetector.evaluatePage(p1, 'linkedin');
  assert.strictEqual(res1.detected, true);
  assert.strictEqual(res1.confidence, 'HIGH_CONFIDENCE');
  assert.strictEqual(res1.type, 'LINKEDIN_CHECKPOINT');

  // 2. Cloudflare Turnstile detected in iframe
  const p2 = new MockPage({
    url: 'https://example.com/feed',
    title: 'Just a moment...',
    iframes: ['https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2']
  });
  const res2 = await SecurityChallengeDetector.evaluatePage(p2, 'generic');
  assert.strictEqual(res2.detected, true);
  assert.strictEqual(res2.type, 'CLOUDFLARE_TURNSTILE');

  // 3. Instagram suspicious login challenge
  const p3 = new MockPage({
    url: 'https://www.instagram.com/challenge/choice/',
    title: 'Instagram'
  });
  const res3 = await SecurityChallengeDetector.evaluatePage(p3, 'instagram');
  assert.strictEqual(res3.detected, true);
  assert.strictEqual(res3.type, 'INSTAGRAM_CHALLENGE');

  // 4. Facebook account checkpoint
  const p4 = new MockPage({
    url: 'https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2F',
    title: 'Security Check'
  });
  const res4 = await SecurityChallengeDetector.evaluatePage(p4, 'facebook');
  assert.strictEqual(res4.detected, true);
  assert.strictEqual(res4.type, 'FACEBOOK_CHECKPOINT');

  // 5. Clean legitimate page
  const p5 = new MockPage({
    url: 'https://www.instagram.com/explore/tags/needwebsite/',
    title: '#needwebsite on Instagram • Photos and Videos',
    bodyText: 'Top posts under #needwebsite. Recent photos and videos from creators.'
  });
  const res5 = await SecurityChallengeDetector.evaluatePage(p5, 'instagram');
  assert.strictEqual(res5.detected, false);
  assert.strictEqual(res5.confidence, 'VERIFIED');

  console.log('✔ Security Challenge Detector: ALL ASSERTIONS PASSED');
  return true;
}

if (require.main === module) {
  runSecurityDetectorTests();
}

module.exports = runSecurityDetectorTests;
