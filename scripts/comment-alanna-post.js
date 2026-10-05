const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function commentAlanna() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const searchUrl = 'https://www.facebook.com/search/posts/?q=' + encodeURIComponent('Alanna Giselle reputable and reliable web designer');
  console.log('Navigating to Alanna search feed:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find and click Alanna's post text to open the comments thread
  console.log('Locating Alanna post element...');
  const clickedPost = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll("div, span"));
    for (const el of allDivs) {
      if (el.textContent && el.textContent.includes("Hoping someone can help recommend a reputable and reliable web designer")) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        el.click();
        return true;
      }
    }
    return false;
  });

  console.log('Clicked Alanna post?', clickedPost);
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_alanna_post_opened.png') });

  // Locate comment textbox
  console.log('Locating comment textbox in the opened post...');
  const commentBox = await page.$("div[role='textbox'][aria-label*='comment' i], div[contenteditable='true'][role='textbox']");

  if (commentBox) {
    console.log('Found comment box! Clicking and typing pitch...');
    await commentBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const pitch = "Hi Alanna! If you're looking for a reputable, production-grade web developer for your business website, our team at GARUDA specializes in modern, high-performance web development with rapid 48-hour turnarounds. We build clean, fully responsive sites with custom workflows and zero bloat. Feel free to review our live portfolio and interactive systems at https://www.garudaos.in — happy to review your reference example and share architectural wireframes upfront!";

    await page.keyboard.type(pitch, { delay: 18 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_alanna_exact_comment_preview.png') });
    console.log('Preview captured!');

    console.log('Submitting comment...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_alanna_exact_comment_live.png') });
    console.log('Live comment submitted and proof captured!');
  } else {
    console.log('Comment box not directly found, capturing state...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_alanna_comment_fail_state.png') });
  }

  await browser.close();
}

commentAlanna().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
