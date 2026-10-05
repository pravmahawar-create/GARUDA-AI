const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function commentLana() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const query = 'Alanna Giselle reputable and reliable web designer';
  console.log('Navigating to feed...');
  await page.goto('https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  console.log('Scrolling to find Lana Reese...');
  const scrolled = await page.evaluate(async () => {
    for (let i = 0; i < 6; i++) {
      const allEls = Array.from(document.querySelectorAll('div, span, p'));
      for (const el of allEls) {
        if (el.textContent && el.textContent.includes('I need someone to design a website for me any suggestions are welcome')) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
          return true;
        }
      }
      window.scrollBy(0, 500);
      await new Promise(res => setTimeout(res, 1000));
    }
    return false;
  });

  console.log('Located Lana Reese post?', scrolled);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lana_located.png') });

  if (scrolled) {
    // Click on Lana's post to open comments thread
    await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('div, span, p'));
      for (const el of allEls) {
        if (el.textContent && el.textContent.includes('I need someone to design a website for me any suggestions are welcome')) {
          el.click();
          break;
        }
      }
    });

    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lana_opened.png') });

    let commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");
    if (!commentBox) {
      // try clicking comment button under Lana's post
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("[aria-label*='Comment' i], div[role='button']"));
        for (const b of btns) {
          if (b.textContent && b.textContent.trim().toLowerCase() === 'comment') {
            b.click();
            break;
          }
        }
      });
      await new Promise(r => setTimeout(r, 2500));
      commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");
    }

    if (commentBox) {
      console.log('Found comment box for Lana! Typing pitch...');
      await commentBox.click();
      await new Promise(r => setTimeout(r, 1000));

      const pitch = "Hi Lana! If you're looking for a reliable, high-performance website designer and developer, our team at GARUDA crafts custom, modern websites with rapid 48-hour turnarounds and zero monthly bloat. You can explore our live portfolio and systems at https://www.garudaos.in — happy to review your vision and share design concepts upfront!";
      await page.keyboard.type(pitch, { delay: 18 });
      await new Promise(r => setTimeout(r, 2000));

      console.log('Submitting comment...');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 6000));

      await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lana_exact_comment_live.png') });
      console.log('Live comment submitted on Lana post!');
    }
  }

  await browser.close();
}

commentLana().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
