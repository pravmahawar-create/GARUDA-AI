require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require('path');
const { createAuthenticatedRedditSession } = require('./reddit_dm_dispatcher');

async function dispatchTarget2() {
  const to = 'IlIlllIIllIII';
  const subject = 'Regarding: Senior Full Stack Developer for Marketplace (Bilingual RTL/LTR)';
  const message = `Hey /u/IlIlllIIllIII,

I saw your post for a Senior Full Stack Developer to build your marketplace platform with Arabic + English (RTL/LTR) support, and specifically your requirement for clean, hand-crafted architecture rather than cheap AI-generated slop.

At GARUDA OS, we engineer production web applications with strict TypeScript typing, sub-second latency, and verified bidirectional (RTL/LTR) layouts:

1. Bidirectional UI Architecture: CSS logical properties with zero layout tearing when switching between Arabic (RTL) and English (LTR).
2. Marketplace Core: Scalable listing schemas, faceted search/filters, isolated seller/buyer roles, and secure role-based access control (RBAC) on the admin dashboard.
3. Verified Delivery: 100% build-verified clean code with zero dependency bloat.

Live production proof of our engineering standard: https://www.garudaos.in

If you have wireframes, a Figma file, or a functional spec, I would be glad to review them and provide a structured milestone breakdown within your $40/hr budget.

Best regards,
Praveen Mahawar
Founder & Chief Architect — GARUDA OS
Official Email: praveen@garudaos.in | Platform: https://www.garudaos.in`;

  console.log(`🚀 [Target2 Dispatch] Authenticating for u/${process.env.REDDIT_USERNAME}...`);
  const { browser, page } = await createAuthenticatedRedditSession();

  try {
    const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
    console.log(`[Target2 Dispatch] Navigating to compose URL...`);
    await page.goto(composeUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    console.log('[Target2 Dispatch] Current URL:', page.url());

    // Scroll Send button into view and get its center coordinates
    const btnCoords = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'send');
      if (!btn) return null;
      btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      const rect = btn.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height };
    });

    console.log('[Target2 Dispatch] Send button coords after scroll:', btnCoords);

    if (!btnCoords) {
      throw new Error('Send button not found on page');
    }

    // Save screenshot right before clicking
    await page.screenshot({ path: path.resolve(__dirname, '..', 'data', 'target2_before_click.png') });

    console.log(`[Target2 Dispatch] Clicking Send at (${btnCoords.x}, ${btnCoords.y})...`);
    await page.mouse.click(btnCoords.x, btnCoords.y);

    // Also trigger native click as reinforcement
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'send');
      if (btn) btn.click();
    });

    console.log('[Target2 Dispatch] Waiting 15s for delivery confirmation...');
    await new Promise(r => setTimeout(r, 15000));

    const settledUrl = page.url();
    console.log('[Target2 Dispatch] Settled URL:', settledUrl);

    // Capture confirmation screenshot
    const confirmationPic = path.resolve(__dirname, '..', 'data', 'target2_after_click.png');
    await page.screenshot({ path: confirmationPic });
    console.log('[Target2 Dispatch] Confirmation screenshot saved to:', confirmationPic);

    // Check if URL changed or if sent page loaded
    const isSent = settledUrl.includes('/sent') || settledUrl.includes('/messages') || !settledUrl.includes('compose');
    console.log('[Target2 Dispatch] Delivery confirmed by URL:', isSent);

    return {
      success: isSent,
      settledUrl,
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

dispatchTarget2()
  .then(res => {
    console.log('RESULT:', JSON.stringify(res, null, 2));
    process.exit(res.success ? 0 : 1);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
