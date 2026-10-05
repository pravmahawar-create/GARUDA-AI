const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const LEADS_FILE = path.join(__dirname, '..', 'data', 'leads', 'direct_messages_sent.json');

async function sendAlannaExact() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  const messengerUrl = 'https://www.facebook.com/messages/t/16201101';
  console.log('Navigating directly to Alanna Messenger:', messengerUrl);
  await page.goto(messengerUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await new Promise(r => setTimeout(r, 6000));

  // Dismiss any overlay modal if present
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll("[aria-label*='Close' i]"));
    for (const b of closeBtns) b.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click the bottom "Continue" button for E2EE
  console.log('Clicking Continue button at bottom...');
  const clickedContinue = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, span, button'));
    for (const el of all) {
      if (el.textContent && el.textContent.trim() === 'Continue' && el.children.length === 0) {
        el.click();
        return true;
      }
    }
    // fallback
    for (const el of all) {
      if (el.textContent && el.textContent.trim() === 'Continue') {
        el.click();
        return true;
      }
    }
    return false;
  });

  console.log('Clicked Continue?', clickedContinue);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_after_bottom_continue.png') });

  // Locate the message textbox
  console.log('Finding message input box...');
  let textBox = await page.$("div[role='textbox'][aria-label*='Message' i], div[contenteditable='true'][role='textbox'], div[aria-label='Message']");
  if (!textBox) {
    textBox = await page.$("div[contenteditable='true']");
  }

  console.log('Found Messenger textbox?', Boolean(textBox));

  if (textBox) {
    await textBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const pitch = "Hi Alanna! Saw your note regarding needing a reputable and reliable web developer for your business website. Reaching out directly in private rather than adding noise to your public comments. Saw that you already have an example reference of what you're looking to accomplish — happy to review that reference in private and share architectural wireframes upfront. Our team at GARUDA specializes in modern, high-performance web development with rapid 48-hour turnarounds and zero monthly bloat. Live portfolio & interactive systems: https://www.garudaos.in — Best regards, Praveen Mahawar, Founder, GARUDA OS";

    console.log('Typing private executive brief...');
    await page.keyboard.type(pitch, { delay: 14 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_alanna_preview_ready.png') });
    console.log('Saved preview: fb_dm_alanna_preview_ready.png');

    console.log('Sending message...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_alanna_live_sent_proof.png') });
    console.log('Sent screenshot captured: fb_dm_alanna_live_sent_proof.png');

    // Save to sent log
    const entry = {
      prospect: 'Alanna Giselle',
      platform: 'facebook_messenger',
      messengerUrl,
      message: pitch,
      proofScreenshot: path.join(OUTPUT_DIR, 'fb_dm_alanna_live_sent_proof.png'),
      timestamp: new Date().toISOString()
    };
    let history = [];
    try {
      if (fs.existsSync(LEADS_FILE)) history = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    } catch {}
    history.push(entry);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(history, null, 2), 'utf-8');
    console.log('Logged entry to direct_messages_sent.json');
  }

  await browser.close();
}

sendAlannaExact().catch(e => {
  console.error(e);
  process.exit(1);
});
