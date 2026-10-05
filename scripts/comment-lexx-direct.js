const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function commentLexxDirect() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,1000'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const query = 'Alanna Giselle reputable and reliable web designer';
  console.log('Navigating to proven feed...');
  await page.goto('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  console.log('Scrolling down to Lexx Thee Doll...');
  await page.evaluate(() => window.scrollBy(0, 1500));
  await new Promise(r => setTimeout(r, 3000));

  // Find Lexx element and click it
  console.log('Clicking Lexx post text...');
  const clicked = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    for (const el of all) {
      if (el.textContent && el.textContent.includes('Can y\'all point me in the direction of a quality website designer') && el.children.length === 0) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        el.click();
        return true;
      }
    }
    // fallback if no leaf node matched
    for (const el of all) {
      if (el.textContent && el.textContent.includes('quality website designer') && el.textContent.includes('Lexx Thee Doll')) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        el.click();
        return true;
      }
    }
    return false;
  });

  console.log('Lexx post clicked?', clicked);
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_opened_direct.png') });

  // Now locate the comment box
  console.log('Searching for comment box...');
  let commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");

  if (!commentBox) {
    // Try clicking any visible comment trigger or button in the opened view
    await page.evaluate(() => {
      const triggers = Array.from(document.querySelectorAll("[aria-label*='Write a comment' i], [aria-label*='comment' i], div[role='button']"));
      for (const t of triggers) {
        if (t.textContent && t.textContent.toLowerCase().includes('comment')) {
          t.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");
  }

  if (commentBox) {
    console.log('Found comment box! Typing pitch...');
    await commentBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const pitch = "Hi Lexx! If you're looking for a quality website designer and developer, our team at GARUDA crafts custom, modern, high-speed websites with clean aesthetics and rapid 48-hour turnarounds. You can explore our live portfolio and systems at https://www.garudaos.in — happy to review what you have in mind and share design concepts upfront!";
    await page.keyboard.type(pitch, { delay: 18 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_preview_direct.png') });
    console.log('Submitting comment...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_submitted_direct.png') });
    console.log('Done!');
  } else {
    console.log('No comment box found, check fb_lexx_opened_direct.png');
  }

  await browser.close();
}

commentLexxDirect().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
