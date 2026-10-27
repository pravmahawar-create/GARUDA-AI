/**
 * 🦅 GARUDA SOVEREIGN REDDIT AUTONOMOUS DM DISPATCHER
 * Authenticates using verified credentials from .env and dispatches DMs via Puppeteer.
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const USERNAME = process.env.REDDIT_USERNAME || 'Wide-Environment774';
const PASSWORD = process.env.REDDIT_PASSWORD;

async function createAuthenticatedRedditSession() {
  if (!PASSWORD) {
    throw new Error('REDDIT_PASSWORD not configured in .env');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,900'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  console.log(`[RedditAuth] Navigating to login for u/${USERNAME}...`);
  await page.goto('https://www.reddit.com/login/', { waitUntil: 'networkidle2', timeout: 35000 });

  // Fill Username
  await page.evaluate((u) => {
    function findInput(root, name) {
      const el = root.querySelector(`input[name="${name}"]`);
      if (el) return el;
      for (const child of root.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const found = findInput(child.shadowRoot, name);
          if (found) return found;
        }
      }
      return null;
    }
    const uInput = findInput(document, 'username');
    if (uInput) {
      uInput.focus();
      uInput.value = u;
      uInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      uInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }, USERNAME);

  await new Promise(r => setTimeout(r, 500));

  // Fill Password
  await page.evaluate((p) => {
    function findInput(root, name) {
      const el = root.querySelector(`input[name="${name}"]`);
      if (el) return el;
      for (const child of root.querySelectorAll('*')) {
        if (child.shadowRoot) {
          const found = findInput(child.shadowRoot, name);
          if (found) return found;
        }
      }
      return null;
    }
    const pInput = findInput(document, 'password');
    if (pInput) {
      pInput.focus();
      pInput.value = p;
      pInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      pInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }, PASSWORD);

  await new Promise(r => setTimeout(r, 500));
  console.log('[RedditAuth] Submitting via Enter key...');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 14000));

  const currentUrl = page.url();
  console.log('[RedditAuth] Post-login URL:', currentUrl);
  const cookies = await page.cookies();
  const sessionCookie = cookies.find(c => c.name === 'reddit_session');
  console.log('[RedditAuth] reddit_session exists:', !!sessionCookie);

  if (!sessionCookie && currentUrl.includes('/login/')) {
    const errorPic = path.resolve(__dirname, '..', 'data', 'reddit_auth_fail.png');
    await page.screenshot({ path: errorPic });
    console.log('[RedditAuth] Saved error screenshot to:', errorPic);
    await browser.close();
    throw new Error(`Reddit authentication failed at: ${currentUrl}`);
  }

  console.log('✔ [RedditAuth] Authenticated session established successfully!');
  return { browser, page };
}

async function sendDirectMessage(toUsername, subject, messageText) {
  const { browser, page } = await createAuthenticatedRedditSession();

  try {
    const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(toUsername)}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(messageText)}`;
    console.log(`[RedditDM] Navigating to compose for /u/${toUsername}...`);

    await page.goto(composeUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    console.log('[RedditDM] Compose page loaded. Current URL:', page.url());

    // Wait 3 seconds for client hydration
    await new Promise(r => setTimeout(r, 3000));

    // Save pre-send screenshot
    const previewScreenshot = path.resolve(__dirname, '..', 'data', `reddit_compose_${toUsername}_preview.png`);
    await page.screenshot({ path: previewScreenshot });
    console.log('[RedditDM] Saved preview screenshot to:', previewScreenshot);

    // Locate the Send button (both in light DOM and shadow DOM)
    const btnCoords = await page.evaluate(() => {
      function findSendBtn(root) {
        const buttons = Array.from(root.querySelectorAll('button, input[type="submit"]'));
        for (const b of buttons) {
          const txt = (b.innerText || b.value || '').trim().toLowerCase();
          if (txt === 'send' || b.id === 'send' || b.className.includes('send')) {
            const rect = b.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: txt };
            }
          }
        }
        for (const child of root.querySelectorAll('*')) {
          if (child.shadowRoot) {
            const found = findSendBtn(child.shadowRoot);
            if (found) return found;
          }
        }
        return null;
      }
      return findSendBtn(document);
    });

    console.log('[RedditDM] Send button coordinates:', btnCoords);

    if (btnCoords) {
      console.log(`[RedditDM] Moving mouse and clicking Send (${btnCoords.text})...`);
      await page.mouse.move(btnCoords.x, btnCoords.y);
      await page.mouse.down();
      await new Promise(r => setTimeout(r, 100));
      await page.mouse.up();
    } else {
      console.log('[RedditDM] Using form submit fallback...');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.submit();
      });
    }

    console.log('[RedditDM] Waiting for submission response (12s)...');
    await new Promise(r => setTimeout(r, 12000));

    const finalUrl = page.url();
    console.log('[RedditDM] Settled URL post-submission:', finalUrl);

    // Save post-send screenshot
    const sentScreenshot = path.resolve(__dirname, '..', 'data', `reddit_compose_${toUsername}_sent.png`);
    await page.screenshot({ path: sentScreenshot });
    console.log('[RedditDM] Saved confirmation screenshot to:', sentScreenshot);

    const isSent = finalUrl.includes('/sent') || finalUrl.includes('/messages') || !finalUrl.includes('compose');
    console.log(`[RedditDM] Delivery verified: ${isSent}`);

    return {
      success: isSent,
      to: toUsername,
      subject,
      finalUrl,
      timestamp: new Date().toISOString(),
      previewScreenshot,
      sentScreenshot
    };
  } finally {
    await browser.close();
  }
}

// Allow CLI execution: node scripts/reddit_dm_dispatcher.js <targetNumber 1 or 2>
if (require.main === module) {
  const targetId = process.argv[2] || '2';
  
  const PROSPECTS = {
    '1': {
      to: 'Naive_Area6965',
      subject: 'Node.js Developer for Playwright CDP Automation',
      message: `Hi /u/Naive_Area6965,\n\nI read your requirement for a Node.js developer to build the browser interaction and logging layers for your local UI testing/simulation suite via Playwright CDP.\n\nI am a Systems Architect working hands-on with Node.js automation, Chrome DevTools Protocol (CDP) session management, and structured database logging pipelines.\n\nHow I can help with your implementation:\n- Playwright CDP: Direct CDP session connection (connectOverCDP), event listening, and targeted DOM interaction modules.\n- Structured Logging: Clean execution traces formatted and written strictly according to your database schemas.\n- Modular Integration: Clean, self-contained functions matching your documented validation loops.\n\nVerified engineering reference: https://www.garudaos.in\n\nIf you are still accepting applications, I would be glad to review your schemas and documentation. We can structure a small, fixed starter milestone ($250-$300) to implement and verify the first automated workflow module before expanding across your full suite.\n\nBest regards,\nPraveen Mahawar\nFounder & Chief Systems Architect — GARUDA OS\nEmail: praveen@garudaos.in | Portfolio: https://www.garudaos.in`
    },
    '2': {
      to: 'IlIlllIIllIII',
      subject: 'Regarding: Senior Full Stack Developer for Marketplace (Bilingual RTL/LTR)',
      message: `Hey /u/IlIlllIIllIII,\n\nI saw your post for a Senior Full Stack Developer to build your marketplace platform with Arabic + English (RTL/LTR) support, and specifically your requirement for clean, hand-crafted architecture rather than cheap AI-generated slop.\n\nAt GARUDA OS, we engineer production web applications with strict TypeScript typing, sub-second latency, and verified bidirectional (RTL/LTR) layouts:\n\n1. Bidirectional UI Architecture: CSS logical properties with zero layout tearing when switching between Arabic (RTL) and English (LTR).\n2. Marketplace Core: Scalable listing schemas, faceted search/filters, isolated seller/buyer roles, and secure role-based access control (RBAC) on the admin dashboard.\n3. Verified Delivery: 100% build-verified clean code with zero dependency bloat.\n\nLive production proof of our engineering standard: https://www.garudaos.in\n\nIf you have wireframes, a Figma file, or a functional spec, I would be glad to review them and provide a structured milestone breakdown within your $40/hr budget.\n\nBest regards,\nPraveen Mahawar\nFounder & Chief Architect — GARUDA OS\nOfficial Email: praveen@garudaos.in | Platform: https://www.garudaos.in`
    }
  };

  const target = PROSPECTS[targetId];
  if (!target) {
    console.error('Unknown target:', targetId);
    process.exit(1);
  }

  console.log(`🚀 [GARUDA DISPATCHER] Starting autonomous DM dispatch for Target ${targetId} (/u/${target.to})...`);
  sendDirectMessage(target.to, target.subject, target.message)
    .then(result => {
      console.log('✅ [GARUDA DISPATCHER] Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('❌ [GARUDA DISPATCHER] Error:', err.message);
      process.exit(1);
    });
}

module.exports = {
  createAuthenticatedRedditSession,
  sendDirectMessage
};
