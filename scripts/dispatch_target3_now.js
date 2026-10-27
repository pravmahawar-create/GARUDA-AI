require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { createAuthenticatedRedditSession } = require('./reddit_dm_dispatcher');

async function dispatchTarget3() {
  const to = 'Puzzleheaded_Tea4149';
  const subject = 'Regarding: Functional Website Design & Development for Music Brand';
  const message = `Hey /u/Puzzleheaded_Tea4149,

I saw your post looking for a designer and web developer to build a modern, functional website for your music brand ($30/hr).

At GARUDA OS, we build clean, responsive web platforms with modern design and reliable media integration:

1. Aesthetic & Brand Identity: Clean dark-mode visual hierarchy structured for music releases, artist biography, and visual media.
2. Audio & Media Integration: Standard streaming embeds (Spotify, SoundCloud, Apple Music, YouTube) for responsive playback across devices.
3. Fan & Booking Flow: Contact/inquiry form, upcoming events section, and newsletter/social links.
4. Clean Implementation: Responsive layout tested across desktop and mobile browsers with clean component architecture.

Live production platform reference: https://www.garudaos.in

If you have reference websites, music tracks, or brand assets to share, I would be glad to review them and put together a structured milestone breakdown within your $30/hr budget.

Best regards,
Praveen Mahawar
Founder & Chief Systems Architect — GARUDA OS
Official Email: praveen@garudaos.in | Platform: https://www.garudaos.in`;

  console.log(`🚀 [Target3 Dispatch] Authenticating for u/${process.env.REDDIT_USERNAME}...`);
  const { browser, page } = await createAuthenticatedRedditSession();

  try {
    const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
    console.log(`[Target3 Dispatch] Navigating to compose URL...`);
    await page.goto(composeUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    console.log('[Target3 Dispatch] Current URL:', page.url());

    // Scroll Send button into view and get its center coordinates
    const btnCoords = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'send');
      if (!btn) return null;
      btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      const rect = btn.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height };
    });

    console.log('[Target3 Dispatch] Send button coords after scroll:', btnCoords);

    if (!btnCoords) {
      throw new Error('Send button not found on compose page');
    }

    // Save screenshot right before clicking
    await page.screenshot({ path: path.resolve(__dirname, '..', 'data', 'target3_before_click.png') });

    console.log(`[Target3 Dispatch] Clicking Send at (${btnCoords.x}, ${btnCoords.y})...`);
    await page.mouse.click(btnCoords.x, btnCoords.y);

    // Also trigger native click as reinforcement
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'send');
      if (btn) btn.click();
    });

    console.log('[Target3 Dispatch] Waiting 8s for submission processing...');
    await new Promise(r => setTimeout(r, 8000));

    // Capture confirmation screenshot of compose page after click
    const confirmationPic = path.resolve(__dirname, '..', 'data', 'target3_after_click.png');
    await page.screenshot({ path: confirmationPic });
    console.log('[Target3 Dispatch] Confirmation screenshot saved to:', confirmationPic);

    // Now navigate directly to chat.reddit.com to verify in Reddit Chat
    console.log('[Target3 Dispatch] Navigating to https://chat.reddit.com/ to verify Chat conversation...');
    await page.goto('https://chat.reddit.com/', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 6000));

    const chatPic = path.resolve(__dirname, '..', 'data', 'reddit_chat_screen_target3.png');
    await page.screenshot({ path: chatPic });
    console.log('[Target3 Dispatch] Chat screenshot saved to:', chatPic);

    const chatThreads = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodySnippet: document.body.innerText.slice(0, 1000)
      };
    });

    console.log('[Target3 Dispatch] Chat verification details:', JSON.stringify(chatThreads, null, 2));

    return {
      success: true,
      target: to,
      chatUrl: chatThreads.url,
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

dispatchTarget3()
  .then(res => {
    console.log('RESULT:', JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
