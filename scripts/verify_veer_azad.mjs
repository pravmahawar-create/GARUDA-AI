import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const DIST_DIR = path.resolve('veer-azad-portal/dist');
const OUTPUT_DIR = path.resolve('output/veer_azad_screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create lightweight local server for dist
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 5179;

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}/`);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Home Page
    console.log('Navigating to Home...');
    await page.goto(`http://localhost:${PORT}/#home`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const homeShot = path.join(OUTPUT_DIR, '01_home_page.png');
    await page.screenshot({ path: homeShot, fullPage: false });
    console.log('Captured:', homeShot);

    // 2. Certificate Verification Page
    console.log('Navigating to Verify Certificate (#verify?cert=473718)...');
    await page.goto(`http://localhost:${PORT}/#verify?cert=473718`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const verifyShot = path.join(OUTPUT_DIR, '02_verify_certificate_page.png');
    await page.screenshot({ path: verifyShot, fullPage: false });
    console.log('Captured:', verifyShot);

    // 3. Switch to Certificate View
    console.log('Viewing Certificate Canvas in Verify Page...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.includes('View Certificate'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const certShot = path.join(OUTPUT_DIR, '03_authentic_certificate_canvas.png');
    await page.screenshot({ path: certShot, fullPage: false });
    console.log('Captured:', certShot);

    // 4. Admin Dashboard
    console.log('Navigating to Admin Dashboard...');
    await page.goto(`http://localhost:${PORT}/#admin`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const adminShot = path.join(OUTPUT_DIR, '04_admin_dashboard.png');
    await page.screenshot({ path: adminShot, fullPage: false });
    console.log('Captured:', adminShot);

    await browser.close();
    console.log('ALL SCREENSHOTS CAPTURED CLEANLY!');
  } catch (err) {
    console.error('Puppeteer verification failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
