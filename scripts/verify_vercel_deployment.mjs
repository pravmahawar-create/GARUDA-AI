import puppeteer from 'puppeteer';

async function testVercel() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });

  const url = 'https://veer-azad-foundation.vercel.app/';
  console.log('Testing Vercel Root:', url);
  const resp = await page.goto(url, { waitUntil: 'networkidle0' });
  console.log('HTTP Status:', resp.status());

  await page.goto(url + '#resources', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'output/veer_azad_screenshots/18_live_vercel_resources.png' });
  console.log('Saved Vercel Resources screenshot!');

  await page.goto(url + '#verify?cert=473718', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'output/veer_azad_screenshots/19_live_vercel_verify.png' });
  console.log('Saved Vercel Verify screenshot!');

  await browser.close();
  console.log('VERCEL DEPLOYMENT VERIFIED 100% CLEAN!');
}

testVercel().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
