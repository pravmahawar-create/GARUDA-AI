import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const DIST_DIR = path.resolve('veer-azad-portal/dist');
const OUTPUT_DIR = path.resolve('output/veer_azad_screenshots');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(5185, async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });

    // 1. Capture Entry Popup Modal
    console.log('Capturing entry popup modal...');
    await page.goto('http://localhost:5185/#home', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200)); // wait for popup trigger
    const popupShot = path.join(OUTPUT_DIR, '07_welcome_impact_popup_modal.png');
    await page.screenshot({ path: popupShot });
    console.log('Saved popup:', popupShot);

    // 2. Capture Appointment Letter in Studio
    console.log('Capturing appointment letter...');
    await page.goto('http://localhost:5185/#admin', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    // Click studio tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const studio = btns.find(b => b.textContent.includes('Certificate Studio'));
      if (studio) studio.click();
    });
    await new Promise(r => setTimeout(r, 800));
    // Click Appointment Letter button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const appt = btns.find(b => b.textContent.includes('Appointment Letter'));
      if (appt) appt.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const apptShot = path.join(OUTPUT_DIR, '08_appointment_letter_studio.png');
    await page.screenshot({ path: apptShot, fullPage: true });
    console.log('Saved appointment letter:', apptShot);

    // 3. Capture Our Team
    console.log('Capturing our team...');
    await page.goto('http://localhost:5185/#team', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    const teamShot = path.join(OUTPUT_DIR, '09_our_team_leadership.png');
    await page.screenshot({ path: teamShot });
    console.log('Saved team:', teamShot);

    await browser.close();
  } catch (e) {
    console.error(e);
  } finally {
    server.close();
    process.exit(0);
  }
});
