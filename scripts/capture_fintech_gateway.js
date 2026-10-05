const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const distDir = path.resolve('frontend/dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(4195, async () => {
  console.log('Serving on 4195');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1800 });
  await page.goto('http://localhost:4195/fintech-gateway', { waitUntil: 'networkidle0' });
  
  // Capture initial state
  await page.screenshot({ path: 'scratch_fintech_gateway_initial.png', fullPage: false });
  console.log('Saved scratch_fintech_gateway_initial.png');

  // Click the simulate button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Simulate Live')) {
      await b.click();
      console.log('Clicked simulate button!');
      break;
    }
  }

  // Wait for simulation steps to finish (2.5 seconds)
  await new Promise(r => setTimeout(r, 2600));

  // Capture simulated active state
  await page.screenshot({ path: 'scratch_fintech_gateway_active.png', fullPage: false });
  console.log('Saved scratch_fintech_gateway_active.png');

  await browser.close();
  server.close();
  console.log('Done!');
});
