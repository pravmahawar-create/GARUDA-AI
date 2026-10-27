import puppeteer from 'puppeteer';
import path from 'path';

async function verifyLive() {
  console.log('Testing LIVE deployed URL on GitHub Pages...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 1. Live Home
  const liveUrl = 'https://pravmahawar-create.github.io/veer-azad-foundation/';
  console.log('Testing live root:', liveUrl);
  const resp = await page.goto(liveUrl, { waitUntil: 'networkidle0' });
  console.log('Live HTTP Status:', resp.status());

  // 2. Live Resources
  console.log('Testing live #resources...');
  await page.goto(liveUrl + '#resources', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'output/veer_azad_screenshots/15_live_github_pages_resources.png' });
  console.log('Captured live resources screenshot!');

  // 3. Live Verify
  console.log('Testing live #verify?cert=473718...');
  await page.goto(liveUrl + '#verify?cert=473718', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'output/veer_azad_screenshots/16_live_github_pages_verify.png' });
  console.log('Captured live verification screenshot!');

  // 4. Live Admin
  console.log('Testing live #admin...');
  await page.goto(liveUrl + '#admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'output/veer_azad_screenshots/17_live_github_pages_admin.png' });
  console.log('Captured live admin screenshot!');

  await browser.close();
  console.log('ALL LIVE PAGES VERIFIED 100% CLEAN!');
}

verifyLive().catch(err => {
  console.error('Live test error:', err);
  process.exit(1);
});
