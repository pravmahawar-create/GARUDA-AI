const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const SYSTEM_ACCOUNTS = ['instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories', 'garudaos.ai'];

async function inspectPosts() {
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

    const posts = [
      'https://www.instagram.com/p/CVnVkpkvA9l/',
      'https://www.instagram.com/p/ClETqzpPUhW/',
      'https://www.instagram.com/p/BjOsQWdn6XI/',
      'https://www.instagram.com/p/DbqQ4ILDlIP/'
    ];

    for (const url of posts) {
      console.log('\n--- Checking post:', url);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      const postInfo = await page.evaluate((systemList) => {
        const header = document.querySelector('article header') || document.querySelector('main header') || document.querySelector('article');
        if (!header) return { error: 'no header' };

        const links = Array.from(header.querySelectorAll('a')).map(a => ({
          href: a.getAttribute('href') || '',
          text: (a.textContent || '').trim()
        })).filter(l => {
          const clean = l.href.replace(/^\/+|\/+$/g, '').toLowerCase();
          return clean && !systemList.includes(clean) && !l.href.includes('/p/') && !l.href.includes('/explore/') && !l.href.includes('/direct/');
        });

        const caption = (document.querySelector('article h1, article span') || {}).textContent || '';
        return { links, caption: caption.slice(0, 200).replace(/\s+/g, ' ') };
      }, SYSTEM_ACCOUNTS);

      console.log('Post info:', JSON.stringify(postInfo, null, 2));

      if (postInfo.links && postInfo.links.length > 0) {
        const author = postInfo.links[0].href.replace(/^\/+|\/+$/g, '');
        console.log(`Checking profile for @${author}...`);
        await page.goto(`https://www.instagram.com/${author}/`, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await new Promise(r => setTimeout(r, 4000));

        const prof = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll("div[role='button'], button, a")).map(b => (b.textContent || '').trim()).filter(Boolean);
          const hasMsg = btns.some(t => t.toLowerCase() === 'message' || t.toLowerCase().includes('message'));
          return { btns: btns.slice(0, 10), hasMsg };
        });

        console.log(`@${author} profile: hasMsg=${prof.hasMsg}, buttons:`, prof.btns);
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

inspectPosts();
