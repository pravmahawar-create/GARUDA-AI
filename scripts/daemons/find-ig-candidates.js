const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function findIgCandidates() {
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

    const tags = ['lookingforwebdesigner', 'webdeveloperneeded', 'needwebsite', 'hirewebdesigner'];
    const candidates = [];

    for (const tag of tags) {
      console.log(`\nSearching tag #${tag}...`);
      await page.goto(`https://www.instagram.com/explore/tags/${tag}/`, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 5000));

      const postLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href*='/p/']")).slice(0, 4).map(a => a.href);
      });

      console.log(`Found ${postLinks.length} posts under #${tag}`);

      for (const pUrl of postLinks) {
        await page.goto(pUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await new Promise(r => setTimeout(r, 3000));

        const postData = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("header a[role='link'], a[role='link']"));
          let author = null;
          for (const l of links) {
            const h = l.getAttribute('href') || '';
            if (h.startsWith('/') && !h.includes('/p/') && !h.includes('/explore/') && !h.includes('/direct/')) {
              const clean = h.replace(/^\/+|\/+$/g, '');
              if (clean && clean !== 'instagram' && clean !== 'meta' && clean !== 'threads' && clean !== 'explore') {
                author = clean;
                break;
              }
            }
          }
          const text = document.body.innerText.slice(0, 300);
          return { author, text };
        });

        if (postData.author) {
          // Check profile for Message button
          const profUrl = `https://www.instagram.com/${postData.author}/`;
          await page.goto(profUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
          await new Promise(r => setTimeout(r, 3000));

          const hasMessageBtn = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll("div[role='button'], button, a"));
            return btns.some(b => {
              const t = (b.textContent || '').trim().toLowerCase();
              return t === 'message' || t.includes('message');
            });
          });

          console.log(`Author: @${postData.author} | Profile: ${profUrl} | Has Message Btn: ${hasMessageBtn}`);
          candidates.push({
            tag,
            postUrl: pUrl,
            author: postData.author,
            profileUrl: profUrl,
            hasMessageBtn,
            snippet: postData.text.slice(0, 100).replace(/\s+/g, ' ')
          });

          if (hasMessageBtn) {
            console.log(`🎯 FOUND QUALIFIED CANDIDATE WITH OPEN MESSAGE BUTTON: @${postData.author}`);
            const shot = path.join(OUTPUT_DIR, `candidate_ig_${postData.author}.png`);
            await page.screenshot({ path: shot });
          }
        }
      }
    }

    console.log('\n--- ALL DISCOVERED IG CANDIDATES ---');
    console.log(JSON.stringify(candidates, null, 2));

  } catch (e) {
    console.error('Candidate find error:', e.message);
  } finally {
    await browser.close();
  }
}

findIgCandidates();
