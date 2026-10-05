const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function commentLexx() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const searchUrl = 'https://www.facebook.com/search/posts/?q=' + encodeURIComponent('Lexx Thee Doll quality website designer');
  console.log('Navigating to Lexx search feed:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find and click Lexx's post text or comment button to open comments thread
  console.log('Locating Lexx post element...');
  const clickedPost = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll("div, span, p"));
    for (const el of allDivs) {
      if (el.textContent && el.textContent.includes("quality website designer") && el.textContent.includes("Lexx")) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        el.click();
        return true;
      }
    }
    // Fallback: search for just the phrase
    for (const el of allDivs) {
      if (el.textContent && el.textContent.includes("Can y'all point me in the direction of a quality website designer")) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        el.click();
        return true;
      }
    }
    return false;
  });

  console.log('Clicked Lexx post?', clickedPost);
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_post_opened.png') });

  // Locate comment textbox
  console.log('Locating comment textbox in the opened post...');
  let commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");

  // If commentBox is not immediately found, try clicking the "Comment" button under the post
  if (!commentBox) {
    console.log('Trying to click comment button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("div[role='button'], span[role='button'], [aria-label*='Comment' i]"));
      for (const btn of buttons) {
        if (btn.textContent && btn.textContent.trim().toLowerCase() === 'comment') {
          btn.click();
          return true;
        }
      }
      return false;
    });
    await new Promise(r => setTimeout(r, 3000));
    commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");
  }

  if (commentBox) {
    console.log('Found comment box! Clicking and typing pitch...');
    await commentBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const pitch = "Hi Lexx! If you're looking for a quality website designer and developer, our team at GARUDA crafts custom, modern, high-speed websites with clean aesthetics and rapid 48-hour turnarounds. You can explore our live portfolio and systems at https://www.garudaos.in — happy to review what you have in mind and share design concepts upfront!";

    await page.keyboard.type(pitch, { delay: 18 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_exact_comment_preview.png') });
    console.log('Preview captured!');

    console.log('Submitting comment...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_exact_comment_live.png') });
    console.log('Live comment submitted and proof captured!');
  } else {
    console.log('Comment box not directly found, capturing state...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_lexx_comment_fail_state.png') });
  }

  await browser.close();
}

commentLexx().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
