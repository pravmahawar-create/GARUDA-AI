import puppeteer from 'puppeteer';
import path from 'path';

const VERCEL_URL = 'https://veer-azad-foundation.vercel.app/';

async function runMobileAudit() {
  console.log('Starting Live Mobile Responsiveness Forensic Audit...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  // 1. iPhone 14 Viewport (390 x 844)
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  console.log('1. Testing Mobile Home Viewport...');
  await page.goto(VERCEL_URL + '#home', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'output/veer_azad_screenshots/mobile_01_home_hero.png' });

  // 2. Test Mobile Menu Drawer
  console.log('2. Testing Mobile Menu Drawer Open...');
  await page.evaluate(() => {
    // Find hamburger menu button
    const btns = Array.from(document.querySelectorAll('header button'));
    // Last button with svg
    const menuBtn = btns[btns.length - 1];
    if (menuBtn) menuBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'output/veer_azad_screenshots/mobile_02_menu_drawer.png' });

  // 3. Test Mobile Resources Page
  console.log('3. Testing Mobile Resources Page...');
  await page.goto(VERCEL_URL + '#resources', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'output/veer_azad_screenshots/mobile_03_resources.png' });

  // 4. Test Mobile Verify Page
  console.log('4. Testing Mobile Certificate Verify Page...');
  await page.goto(VERCEL_URL + '#verify?cert=473718', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'output/veer_azad_screenshots/mobile_04_verify_certificate.png' });

  // 5. Test Mobile Admin Studio
  console.log('5. Testing Mobile Admin Console...');
  await page.goto(VERCEL_URL + '#admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'output/veer_azad_screenshots/mobile_05_admin_console.png' });

  await browser.close();
  console.log('MOBILE AUDIT COMPLETED CLEANLY!');
}

runMobileAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
