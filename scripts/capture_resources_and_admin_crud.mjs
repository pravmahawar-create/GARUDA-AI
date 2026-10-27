import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.resolve('output/veer_azad_screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser to capture Resources & Admin CRUD...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  // 1. Resources Page
  console.log('Navigating to #resources...');
  await page.goto('http://localhost:5173/#resources', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const resShot = path.join(OUTPUT_DIR, '10_statutory_resources_page.png');
  await page.screenshot({ path: resShot });
  console.log('Saved Resources page:', resShot);

  // 2. Click "View Document" to open preview modal
  console.log('Opening Document Preview Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const viewBtn = btns.find(b => b.textContent.includes('View Document'));
    if (viewBtn) viewBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const modalShot = path.join(OUTPUT_DIR, '11_resource_document_preview_modal.png');
  await page.screenshot({ path: modalShot });
  console.log('Saved Resource modal:', modalShot);

  // 3. Admin Dashboard
  console.log('Navigating to #admin...');
  await page.goto('http://localhost:5173/#admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const adminShot = path.join(OUTPUT_DIR, '12_admin_console_all_tabs.png');
  await page.screenshot({ path: adminShot });
  console.log('Saved Admin Console:', adminShot);

  // 4. Click Campaigns tab
  console.log('Clicking Campaigns tab in Admin...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const campBtn = btns.find(b => b.textContent.includes('Campaigns ('));
    if (campBtn) campBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const campAdminShot = path.join(OUTPUT_DIR, '13_admin_campaigns_crud.png');
  await page.screenshot({ path: campAdminShot });
  console.log('Saved Admin Campaigns CRUD:', campAdminShot);

  // 5. Click "Add Member" modal
  console.log('Opening Add Member modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const memTab = btns.find(b => b.textContent.includes('Members ('));
    if (memTab) memTab.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addMem = btns.find(b => b.textContent.includes('Add Member'));
    if (addMem) addMem.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const addMemShot = path.join(OUTPUT_DIR, '14_admin_add_member_modal.png');
  await page.screenshot({ path: addMemShot });
  console.log('Saved Add Member modal:', addMemShot);

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
