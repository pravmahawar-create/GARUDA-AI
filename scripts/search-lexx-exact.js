const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function searchLexx() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  // In the earlier Alanna search: https://www.facebook.com/search/posts/?q=Alanna%20Giselle%20reputable%20and%20reliable%20web%20designer
  // Lexx's post was directly present right below Alanna's post!
  const query = 'Alanna Giselle reputable and reliable web designer';
  console.log('Navigating to proven feed where Lexx was spotted...');
  await page.goto('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find Lexx post specifically and its comment trigger
  const res = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div, span, p'));
    for (const el of allDivs) {
      if (el.textContent && el.textContent.includes('Can y\'all point me in the direction of a quality website designer')) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        return { found: true, text: el.textContent };
      }
    }
    return { found: false };
  });

  console.log('Found Lexx post in feed?', res);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_feed_located.png') });

  if (res.found) {
    // Click on Lexx's post text or its comment icon
    await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div, span, p'));
      for (const el of allDivs) {
        if (el.textContent && el.textContent.includes('Can y\'all point me in the direction of a quality website designer')) {
          el.click();
          break;
        }
      }
    });

    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_post_opened_clean.png') });

    // Find comment box
    const commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");
    if (commentBox) {
      console.log('Found comment box under Lexx post! Typing pitch...');
      await commentBox.click();
      await new Promise(r => setTimeout(r, 1000));

      const pitch = "Hi Lexx! If you're looking for a quality website designer and developer, our team at GARUDA crafts custom, modern, high-speed websites with clean aesthetics and rapid 48-hour turnarounds. You can explore our live portfolio and systems at https://www.garudaos.in — happy to review what you have in mind and share design concepts upfront!";
      await page.keyboard.type(pitch, { delay: 18 });
      await new Promise(r => setTimeout(r, 2000));
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 6000));
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_verified_live_proof.png') });
      console.log('Verified comment on Lexx post completed!');
    }
  }

  await browser.close();
}

searchLexx().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
