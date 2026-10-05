const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function commentPamela() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,1000'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const query = 'Alanna Giselle reputable and reliable web designer';
  console.log('Navigating to feed...');
  await page.goto('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  console.log('Scrolling down to Pamela Callahan...');
  await page.evaluate(() => window.scrollBy(0, 1400));
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_pamela_in_view.png') });

  // Find Pamela's post container and click its comment button
  console.log('Finding Pamela comment button...');
  const clickedComment = await page.evaluate(() => {
    // Find the container for Pamela
    const allDivs = Array.from(document.querySelectorAll('div'));
    for (const d of allDivs) {
      if (d.textContent && d.textContent.includes('Pamela Callahan') && d.textContent.includes('dependable website designer')) {
        // Find comment button or bubble inside this container
        const btns = Array.from(d.querySelectorAll("div[role='button'], span[role='button'], [aria-label*='Comment' i]"));
        for (const b of btns) {
          if (b.textContent && (b.textContent.trim().toLowerCase() === 'comment' || b.textContent.includes('70'))) {
            b.click();
            return { clicked: true, text: b.textContent };
          }
        }
        // Fallback: click post text itself
        const textNodes = Array.from(d.querySelectorAll('span, p, div'));
        for (const tn of textNodes) {
          if (tn.textContent && tn.textContent.includes('looking for a reliable, dependable website designer')) {
            tn.click();
            return { clicked: true, text: 'clicked text' };
          }
        }
      }
    }
    return { clicked: false };
  });

  console.log('Clicked Pamela comment trigger?', clickedComment);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_pamela_opened.png') });

  let commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");
  if (commentBox) {
    console.log('Found comment box! Typing pitch...');
    await commentBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const pitch = "Hi Pamela! If you're looking for a reliable, dependable web developer for your site, our team at GARUDA specializes in clean, high-performance websites with rapid 48-hour turnarounds and zero bloat. You can explore our live portfolio and systems at https://www.garudaos.in — happy to review what you need and share architectural wireframes upfront!";
    await page.keyboard.type(pitch, { delay: 18 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_pamela_preview.png') });
    console.log('Submitting comment...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_pamela_exact_comment_live.png') });
    console.log('Live comment submitted on Pamela post!');
  } else {
    console.log('Comment box not found for Pamela.');
  }

  await browser.close();
}

commentPamela().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
