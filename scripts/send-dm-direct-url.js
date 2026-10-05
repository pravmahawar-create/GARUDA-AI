const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function sendDirect() {
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

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_direct_messenger_view.png') });
  console.log('Saved fb_dm_direct_messenger_view.png');

  // Find message textbox in full-screen messenger
  const textBox = await page.$("div[role='textbox'][aria-label*='Message' i], div[contenteditable='true'][role='textbox']");
  console.log('Found full-screen Messenger textbox?', Boolean(textBox));

  if (textBox) {
    await textBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const pitch = "Hi Alanna! Saw your note regarding needing a reputable and reliable web developer for your business website. Reaching out directly in private rather than adding noise to your public comments. Saw that you already have an example reference of what you're looking to accomplish — happy to review that reference in private and share architectural wireframes upfront. Our team at GARUDA specializes in modern, high-performance web development with rapid 48-hour turnarounds and zero monthly bloat. Live portfolio & interactive systems: https://www.garudaos.in — Best regards, Praveen Mahawar, Founder, GARUDA OS";

    await page.keyboard.type(pitch, { delay: 12 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_alanna_fullscreen_preview.png') });
    console.log('Preview saved!');

    console.log('Sending message...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 5000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_alanna_fullscreen_sent.png') });
    console.log('Sent screenshot captured!');
  }

  await browser.close();
}

sendDirect().catch(e => {
  console.error(e);
  process.exit(1);
});
