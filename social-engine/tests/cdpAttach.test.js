/**
 * Chrome DevTools Protocol (CDP) Attach Test
 * Section 6: Complete the PARTIAL item.
 * Evaluates whether port 9222 is active. If offline, reports REQUIRES_ENVIRONMENT without false failures.
 */

const assert = require('assert');
const StealthBrowserFactory = require('../browser/stealthBrowserFactory');

async function testCdpAttach() {
  console.log('--- Testing CDP Attach Protocol ---');
  const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9222';

  // 1. Probe if CDP endpoint is listening
  let isListening = false;
  try {
    const res = await fetch(`${cdpUrl}/json/version`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) isListening = true;
  } catch (_) {
    isListening = false;
  }

  if (!isListening) {
    console.log(`ℹ️ [CDP Attach] Port 9222 is not actively listening.`);
    console.log(`ℹ️ Status: REQUIRES_ENVIRONMENT (Start Chrome with --remote-debugging-port=9222 for live attach)`);
    return { status: 'REQUIRES_ENVIRONMENT', listening: false };
  }

  // 2. Endpoint is listening: Perform live attach verification
  console.log(`▶ Connecting to Founder-controlled browser via CDP at ${cdpUrl}...`);
  const result = await StealthBrowserFactory.connectToExistingBrowser(cdpUrl);
  assert.strictEqual(result.success, true);
  assert.ok(result.browser);

  const pages = await result.browser.pages();
  console.log(`✔ CDP Connected. Active user pages: ${pages.length}`);

  // Disconnect safely without closing the user's browser!
  await result.browser.disconnect();
  console.log('✔ CDP Disconnected safely (User browser left running)');

  return { status: 'VERIFIED', listening: true };
}

if (require.main === module) {
  testCdpAttach().then(res => {
    console.log('CDP Test Result:', res.status);
  });
}

module.exports = testCdpAttach;
