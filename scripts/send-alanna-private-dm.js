const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const LEADS_FILE = path.join(__dirname, '..', 'data', 'leads', 'direct_messages_sent.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(LEADS_FILE))) fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });

async function sendAlannaDM() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  await page.setCookie(
    { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
    { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
  );

  // Alanna's verified profile URL
  const profileUrl = 'https://www.facebook.com/groups/112924992139863/user/16201101/';
  console.log('Navigating to Alanna Giselle profile:', profileUrl);
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find and click the Message button
  console.log('Locating and clicking Message button...');
  const clickedMsg = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("div[role='button'], a[role='button'], [aria-label*='Message' i]"));
    for (const b of btns) {
      if (b.textContent && b.textContent.trim().toLowerCase() === 'message') {
        b.scrollIntoView({ behavior: 'instant', block: 'center' });
        b.click();
        return true;
      }
    }
    return false;
  });

  console.log('Clicked Message button?', clickedMsg);
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_chat_opened.png') });

  // Locate the message textbox (can be in chat popup or full messenger)
  console.log('Locating message textbox...');
  let chatBox = await page.$("div[role='textbox'][aria-label*='Message' i], div[contenteditable='true'][role='textbox'], div[aria-label='Message']");

  if (!chatBox) {
    // If not directly in popup, check for general contenteditable textbox
    chatBox = await page.$("div[contenteditable='true']");
  }

  if (chatBox) {
    console.log('Found chat textbox! Clicking and typing private executive brief...');
    await chatBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const messageText = 
      "Hi Alanna! Saw your note regarding needing a reputable and reliable web developer for your business website. Reaching out directly in private rather than adding noise to your public comments.\n\n" +
      "Saw that you already have an example reference of what you're looking to accomplish — happy to review that reference in private and share architectural wireframes upfront.\n\n" +
      "Our team at GARUDA specializes in modern, high-performance web development with rapid 48-hour turnarounds and zero monthly bloat.\n\n" +
      "Live portfolio & interactive systems: https://www.garudaos.in\n\n" +
      "Best regards,\nPraveen Mahawar\nFounder, GARUDA OS";

    // Split lines by Shift+Enter so it sends as a single elegant formatted block
    const lines = messageText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 0) {
        await page.keyboard.type(lines[i], { delay: 12 });
      }
      if (i < lines.length - 1) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await new Promise(r => setTimeout(r, 100));
      }
    }

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_alanna_preview.png') });
    console.log('Saved preview: fb_dm_alanna_preview.png');

    console.log('Sending message (pressing Enter)...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'fb_dm_alanna_sent_proof.png') });
    console.log('Message sent! Saved proof: fb_dm_alanna_sent_proof.png');

    // Save to sent log
    const entry = {
      prospect: 'Alanna Giselle',
      platform: 'facebook_messenger',
      profileUrl,
      message: messageText,
      proofScreenshot: path.join(OUTPUT_DIR, 'fb_dm_alanna_sent_proof.png'),
      timestamp: new Date().toISOString()
    };
    let history = [];
    try {
      if (fs.existsSync(LEADS_FILE)) history = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    } catch {}
    history.push(entry);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(history, null, 2), 'utf-8');
    console.log('Logged DM entry to direct_messages_sent.json');

  } else {
    console.error('Chat textbox not found after clicking Message button. Check fb_dm_chat_opened.png');
  }

  await browser.close();
}

sendAlannaDM().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
