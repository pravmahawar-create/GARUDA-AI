const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function findOpenMsgCandidate() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setCookie(
      { name: 'sessionid', value: process.env.INSTAGRAM_SESSION_ID.trim(), domain: '.instagram.com', path: '/' },
      { name: 'ds_user_id', value: process.env.INSTAGRAM_USER_ID.trim(), domain: '.instagram.com', path: '/' }
    );

    // Let's search explore tags for needwebsite
    console.log('Navigating to #needwebsite tag...');
    await page.goto('https://www.instagram.com/explore/tags/needwebsite/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));

    // Get all post links in grid
    const postHrefs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href*='/p/']")).map(a => a.href);
    });

    console.log(`Found ${postHrefs.length} post links:`, postHrefs);

    // Test each post link
    for (const postHref of postHrefs) {
      console.log(`\nNavigating to post: ${postHref}`);
      await page.goto(postHref, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      // Extract author from article links
      const author = await page.evaluate(() => {
        // Look for links inside article or main that look like usernames
        const SYSTEM = ['instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories', 'garudaos.ai', 'p'];
        const links = Array.from(document.querySelectorAll('a')).map(a => {
          const h = a.getAttribute('href') || '';
          const parts = h.split('/').filter(Boolean);
          return parts.length === 1 ? parts[0] : null;
        }).filter(p => p && !SYSTEM.includes(p.toLowerCase()));

        // Also check if there is an h2 or title or header with username
        return links[0] || null;
      });

      console.log(`Post author candidate: ${author}`);

      if (author) {
        const profUrl = `https://www.instagram.com/${author}/`;
        console.log(`Checking profile: ${profUrl}`);
        await page.goto(profUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await new Promise(r => setTimeout(r, 4000));

        const profCheck = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("div[role='button'], button, a")).map(b => (b.textContent || '').trim());
          const hasMessage = btns.some(t => t.toLowerCase() === 'message');
          return { btns, hasMessage, title: document.title };
        });

        console.log(`Profile @${author} check: hasMessage=${profCheck.hasMessage}`);

        if (profCheck.hasMessage) {
          console.log(`🎯🎯 SUCCESS! Found profile with open Message button: @${author}!`);
          const shot = path.join(OUTPUT_DIR, `candidate_with_msg_${author}.png`);
          await page.screenshot({ path: shot });
          console.log('Saved proof screenshot:', shot);
          return { author, postHref, profUrl };
        }
      }
    }

  } catch (e) {
    console.error('Find error:', e.message);
  } finally {
    await browser.close();
  }
}

findOpenMsgCandidate();
