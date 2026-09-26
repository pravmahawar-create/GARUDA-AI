const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts');

async function testIgDirect() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setCookie(
      { name: 'sessionid', value: process.env.INSTAGRAM_SESSION_ID.trim(), domain: '.instagram.com', path: '/' },
      { name: 'ds_user_id', value: process.env.INSTAGRAM_USER_ID.trim(), domain: '.instagram.com', path: '/' }
    );

    console.log('Navigating to IG Direct inbox...');
    await page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));

    // Dismiss notifications popup if any
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      for (const b of btns) {
        if (b.textContent && (b.textContent.trim().toLowerCase() === 'not now' || b.textContent.trim().toLowerCase() === 'cancel')) {
          b.click();
          break;
        }
      }
    });

    const shot1 = path.join(OUTPUT_DIR, 'test_ig_direct_inbox.png');
    await page.screenshot({ path: shot1 });
    console.log('Saved inbox screenshot:', shot1);

    // Look for New Message button (pencil/edit icon)
    const newMsgClicked = await page.evaluate(() => {
      const newMsgBtn = document.querySelector("svg[aria-label='New message']");
      if (newMsgBtn) {
        const parent = newMsgBtn.closest("div[role='button']") || newMsgBtn.parentElement;
        if (parent) { parent.click(); return true; }
      }
      const btns = Array.from(document.querySelectorAll("div[role='button'], button, a"));
      for (const b of btns) {
        if (b.getAttribute('aria-label') === 'New message' || b.textContent.includes('Send message')) {
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log('New message button clicked?', newMsgClicked);
    await new Promise(r => setTimeout(r, 3000));

    const shot2 = path.join(OUTPUT_DIR, 'test_ig_direct_modal.png');
    await page.screenshot({ path: shot2 });
    console.log('Saved modal screenshot:', shot2);

    // If modal opened, search for 'charms_hub'
    const searchInput = await page.$("input[name='queryBox'], input[placeholder*='Search']");
    if (searchInput) {
      console.log('Typing charms_hub in search box...');
      await searchInput.type('charms_hub', { delay: 50 });
      await new Promise(r => setTimeout(r, 3000));

      const shot3 = path.join(OUTPUT_DIR, 'test_ig_search_charms.png');
      await page.screenshot({ path: shot3 });
      console.log('Saved search screenshot:', shot3);

      const searchResults = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("div[role='dialog'] div[role='button'], div[role='dialog'] span")).map(el => el.textContent.trim()).filter(t => t.length > 2 && t.length < 50);
        return rows.slice(0, 10);
      });
      console.log('Search dialog items:', searchResults);
    }

  } catch (e) {
    console.error('IG direct test error:', e.message);
  } finally {
    await browser.close();
  }
}

testIgDirect();
