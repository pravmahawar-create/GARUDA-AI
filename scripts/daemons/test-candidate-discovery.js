const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function inspectDiscovery() {
  console.log('--- TESTING CANDIDATE DISCOVERY ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    // 1. Facebook Discovery Test
    console.log('\n[1] Testing Facebook Discovery...');
    const pageFb = await browser.newPage();
    await pageFb.setViewport({ width: 1440, height: 900 });
    await pageFb.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await pageFb.setCookie(
      { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
      { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
    );

    const query = 'reputable and reliable web designer for business website';
    const fbSearchUrl = 'https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query);
    console.log('Navigating FB to:', fbSearchUrl);
    await pageFb.goto(fbSearchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 6000));
    await pageFb.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 3000));

    const fbShot = path.join(OUTPUT_DIR, 'test_fb_discovery.png');
    await pageFb.screenshot({ path: fbShot });
    console.log('Saved FB discovery screenshot:', fbShot);

    const fbCandidates = await pageFb.evaluate(() => {
      const posts = [];
      const postElements = Array.from(document.querySelectorAll("div[role='feed'] > div, div[role='article']"));
      for (const el of postElements) {
        const text = el.textContent || '';
        if (text.startsWith('FacebookFacebook') || text.length < 25) continue;
        const authorLink = el.querySelector("h2 a[role='link'], h3 a[role='link'], strong a[role='link'], a[role='link'][tabindex='0']");
        let author = '';
        let profileLink = '';
        if (authorLink) {
          author = authorLink.textContent.trim();
          profileLink = authorLink.href;
        }
        if (author && author !== 'Facebook' && author !== 'Meta') {
          posts.push({
            author,
            profileLink,
            text: text.slice(0, 150).replace(/\s+/g, ' ')
          });
        }
      }
      return posts;
    });

    console.log(`Discovered ${fbCandidates.length} FB candidates:`);
    console.log(JSON.stringify(fbCandidates.slice(0, 5), null, 2));
    await pageFb.close();

    // 2. Instagram Discovery Test
    console.log('\n[2] Testing Instagram Discovery...');
    const pageIg = await browser.newPage();
    await pageIg.setViewport({ width: 1280, height: 900 });
    await pageIg.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await pageIg.setCookie(
      { name: 'sessionid', value: process.env.INSTAGRAM_SESSION_ID.trim(), domain: '.instagram.com', path: '/' },
      { name: 'ds_user_id', value: process.env.INSTAGRAM_USER_ID.trim(), domain: '.instagram.com', path: '/' }
    );

    const tag = 'needwebsite';
    const igTagUrl = `https://www.instagram.com/explore/tags/${tag}/`;
    console.log('Navigating IG to:', igTagUrl);
    await pageIg.goto(igTagUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 6000));

    const igShot = path.join(OUTPUT_DIR, 'test_ig_discovery.png');
    await pageIg.screenshot({ path: igShot });
    console.log('Saved IG discovery screenshot:', igShot);

    const igPostLinks = await pageIg.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href*='/p/']"));
      return links.slice(0, 5).map(a => a.href);
    });

    console.log(`Discovered ${igPostLinks.length} IG post links under #${tag}:`, igPostLinks);

    if (igPostLinks.length > 0) {
      console.log('Inspecting first IG post:', igPostLinks[0]);
      await pageIg.goto(igPostLinks[0], { waitUntil: 'domcontentloaded', timeout: 35000 });
      await new Promise(r => setTimeout(r, 4000));

      const SYSTEM_ACCOUNTS = ['instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories', 'garudaos.ai'];
      const authorInfo = await pageIg.evaluate((systemList) => {
        const headerLink = document.querySelector("article header a[role='link']:not([href*='/explore/'])");
        let name = null;
        if (headerLink) {
          const text = (headerLink.textContent || '').trim();
          if (text && !systemList.includes(text.toLowerCase())) name = text;
          else {
            const href = headerLink.getAttribute('href') || '';
            const clean = href.replace(/^\/+|\/+$/g, '');
            if (clean && !systemList.includes(clean.toLowerCase())) name = clean;
          }
        }
        const captionEl = document.querySelector("article h1, article div[role='button'] + span, article span");
        const caption = captionEl ? captionEl.textContent.trim().slice(0, 150) : '';
        return { username: name, caption };
      }, SYSTEM_ACCOUNTS);

      console.log('IG post author info:', authorInfo);
    }
    await pageIg.close();

  } catch (err) {
    console.error('Discovery error:', err.message);
  } finally {
    await browser.close();
  }
}

inspectDiscovery();
