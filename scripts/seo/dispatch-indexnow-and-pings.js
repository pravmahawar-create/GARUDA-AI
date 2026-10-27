const fs = require('fs');
const path = require('path');
const https = require('https');

async function postJson(url, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const parsedUrl = new URL(url);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'GARUDA-Autonomous-SEO-Pinger/1.0'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function getUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

async function main() {
  console.log('[GARUDA-INDEXNOW] Extracting live URLs from sitemap.xml...');
  const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');

  const urlMatches = sitemapXml.match(/<loc>(https:\/\/[^<]+)<\/loc>/g) || [];
  const urlList = urlMatches.map(m => m.replace(/<\/?loc>/g, '').trim());

  console.log(`[GARUDA-INDEXNOW] Found ${urlList.length} unique production URLs.`);

  const indexNowPayload = {
    host: 'www.garudaos.in',
    key: 'c37b8ef9d18e4726b2aa8d76e73f8361',
    keyLocation: 'https://www.garudaos.in/c37b8ef9d18e4726b2aa8d76e73f8361.txt',
    urlList: urlList
  };

  console.log('[GARUDA-INDEXNOW] 1. Dispatching to api.indexnow.org (Global Search Engine Network)...');
  const res1 = await postJson('https://api.indexnow.org/indexnow', indexNowPayload);
  console.log(`[GARUDA-INDEXNOW] Global IndexNow Response: HTTP ${res1.status} ${res1.body || '(OK)'}`);

  console.log('[GARUDA-INDEXNOW] 2. Dispatching directly to Bing IndexNow Gateway...');
  const res2 = await postJson('https://www.bing.com/indexnow', indexNowPayload);
  console.log(`[GARUDA-INDEXNOW] Bing IndexNow Response: HTTP ${res2.status} ${res2.body || '(OK)'}`);

  console.log('[GARUDA-INDEXNOW] 3. Dispatching directly to Yandex IndexNow Gateway...');
  const res3 = await postJson('https://yandex.com/indexnow', indexNowPayload);
  console.log(`[GARUDA-INDEXNOW] Yandex IndexNow Response: HTTP ${res3.status} ${res3.body || '(OK)'}`);

  console.log('[GARUDA-INDEXNOW] 4. Pinging Google Sitemap Ingestion...');
  const googlePing = await getUrl('https://www.google.com/ping?sitemap=https://www.garudaos.in/sitemap.xml');
  console.log(`[GARUDA-INDEXNOW] Google Sitemap Ping Response: HTTP ${googlePing.status}`);

  console.log('[GARUDA-INDEXNOW] 5. Pinging Bing Sitemap Ingestion...');
  const bingPing = await getUrl('https://www.bing.com/ping?sitemap=https://www.garudaos.in/sitemap.xml');
  console.log(`[GARUDA-INDEXNOW] Bing Sitemap Ping Response: HTTP ${bingPing.status}`);

  console.log('\n[GARUDA-INDEXNOW] ALL SEARCH ENGINES DISPATCHED AUTONOMOUSLY!');
}

main().catch(console.error);
