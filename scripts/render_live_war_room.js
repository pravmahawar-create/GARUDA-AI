const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DIST_DIR = path.resolve(__dirname, '../frontend/dist');
const PORT = 8899;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // If path doesn't have an extension, try .html or directory index
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else {
      // SPA fallback
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Fallback to index.html for SPA routes
    const fallbackPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(fallbackPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(fallbackPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://127.0.0.1:${PORT}`);
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

    // Catch any page console errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('Navigating to http://127.0.0.1:8899/war-room ...');
    await page.goto(`http://127.0.0.1:${PORT}/war-room`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for the React component to mount
    try {
      await page.waitForFunction(() => !document.getElementById('seo-fallback'), { timeout: 10000 });
      console.log('SEO fallback replaced by React app!');
    } catch (e) {
      console.log('Waiting for fallback replace timed out, checking DOM...');
    }

    // Give 1 second for SVGs and animations to settle
    await new Promise(r => setTimeout(r, 1500));

    const outputPath = path.resolve(__dirname, '../data/creative-assets/live_war_room_rendered_v2.png');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`Screenshot saved successfully to ${outputPath}`);

    // Also copy to brain artifact dir
    const artifactPath = 'C:\\Users\\hp\\.gemini\\antigravity-cli\\brain\\c877ab8c-45f8-4814-ae0c-db52efac7c4f\\live_war_room_rendered_v2.png';
    try {
      fs.copyFileSync(outputPath, artifactPath);
      console.log(`Copied to artifact path: ${artifactPath}`);
    } catch (err) {
      console.log('Artifact copy note:', err.message);
    }

    await browser.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
