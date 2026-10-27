import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const DIST_DIR = path.resolve('veer-azad-portal/dist');
const OUTPUT_DIR = path.resolve('output/veer_azad_screenshots');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

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
      res.end('Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 5180;

server.listen(PORT, async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });

    // Open Admin Dashboard directly to Certificate Studio
    await page.goto(`http://localhost:${PORT}/#admin`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Click on "Certificate Studio" tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const studioBtn = btns.find(b => b.textContent.includes('Certificate Studio'));
      if (studioBtn) studioBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll to Certificate area
    const certEl = await page.$('#certificate-print-area');
    if (certEl) {
      const certBox = path.join(OUTPUT_DIR, '05_exact_certificate_matching_sample.png');
      await certEl.screenshot({ path: certBox });
      console.log('Saved exact certificate element shot:', certBox);
    }

    // Capture Full Page Studio
    const studioFull = path.join(OUTPUT_DIR, '06_certificate_studio_full.png');
    await page.screenshot({ path: studioFull, fullPage: true });
    console.log('Saved full studio shot:', studioFull);

    await browser.close();
  } catch (err) {
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});
