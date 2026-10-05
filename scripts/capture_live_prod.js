const puppeteer = require('puppeteer');

async function capture() {
  console.log('Launching headless browser to inspect live https://www.garudaos.in...');
  const browser = await puppeteer.launch({ headless: 'new' });
  
  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600 });
  await page.goto('https://www.garudaos.in', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'scratch_live_production_desktop.png', fullPage: false });
  console.log('Captured scratch_live_production_desktop.png');

  // Mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('https://www.garudaos.in', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'scratch_live_production_mobile.png', fullPage: false });
  console.log('Captured scratch_live_production_mobile.png');

  await browser.close();
  console.log('Done!');
}

capture().catch(console.error);
