const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.resolve(__dirname, '../data/browser-sessions/linkedin');

async function testStealth() {
  console.log('Testing real Chrome with persistent user-data-dir and stealth...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,900',
      `--user-data-dir=${SESSION_DIR}`
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    console.log('Navigating to LinkedIn...');
    const res = await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    console.log('Final URL:', page.url());
    console.log('Title:', await page.title());
    const isFeed = page.url().includes('/feed');
    console.log('Reached Feed:', isFeed);
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await browser.close();
  }
}

testStealth();
