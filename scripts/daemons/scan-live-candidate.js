const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const SYSTEM_ACCOUNTS = ['instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories', 'garudaos.ai'];

async function scanForLiveCandidate() {
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

    const tags = ['webdeveloperneeded', 'needwebsite', 'appdeveloperneeded', 'hirewebdeveloper'];
    for (const tag of tags) {
      console.log(`Checking tag: #${tag}`);
      await page.goto(`https://www.instagram.com/explore/tags/${tag}/`, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      const posts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href*='/p/'], a[href*='/reel/']")).slice(0, 8).map(a => a.href);
      });

      console.log(`Tag #${tag} has ${posts.length} posts`);

      for (const p of posts) {
        await page.goto(p, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await new Promise(r => setTimeout(r, 3000));

        // Get post author from caption or header
        const author = await page.evaluate((sys) => {
          const links = Array.from(document.querySelectorAll("a[role='link'], header a, a")).map(a => a.getAttribute('href') || '').filter(h => h.startsWith('/') && !h.includes('/p/') && !h.includes('/reel/') && !h.includes('/explore/') && !h.includes('/direct/'));
          for (const l of links) {
            const clean = l.replace(/^\/+|\/+$/g, '').toLowerCase();
            if (clean && !sys.includes(clean) && !clean.includes('legal') && !clean.includes('about')) {
              return clean;
            }
          }
          return null;
        }, SYSTEM_ACCOUNTS);

        if (author) {
          console.log(`Checking profile @${author}...`);
          await page.goto(`https://www.instagram.com/${author}/`, { waitUntil: 'domcontentloaded', timeout: 35000 });
          await new Promise(r => setTimeout(r, 3000));

          const res = await page.evaluate(() => {
            const headerBtns = Array.from(document.querySelectorAll("header button, header div[role='button']")).map(b => (b.textContent || '').trim());
            const hasMsg = headerBtns.some(t => t.toLowerCase() === 'message');
            return { hasMsg, headerBtns };
          });

          console.log(`@${author}: hasMsg=${res.hasMsg}, buttons:`, res.headerBtns);
          if (res.hasMsg) {
            console.log(`🎉 FOUND TARGET WITH MESSAGE BUTTON: @${author}!`);
            return { tag, postUrl: p, author };
          }
        }
      }
    }

  } catch (e) {
    console.error('Scan error:', e.message);
  } finally {
    await browser.close();
  }
}

scanForLiveCandidate();
