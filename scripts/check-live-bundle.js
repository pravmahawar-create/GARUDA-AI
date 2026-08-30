const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function inspectProduction() {
  console.log("=== INSPECTING LIVE PRODUCTION DEPLOYMENT (https://www.garudaos.in) ===");
  const routes = [
    '/',
    '/app',
    '/founder',
    '/high-command',
    '/login',
    '/signup'
  ];

  for (const r of routes) {
    const url = 'https://www.garudaos.in' + r;
    const res = await fetchUrl(url);
    console.log(`Route [${r}] -> HTTP ${res.status} (Length: ${res.body.length})`);
    if (res.body.includes("GARUDA Founder Console UI Notice")) {
      console.log(`  ❌ ERROR BOUNDARY FOUND ON ${r}!`);
    } else {
      console.log(`  ✔ No error boundary found in HTML.`);
    }

    // Check script tag
    const match = res.body.match(/\/assets\/index-[a-zA-Z0-9_-]+\.js/);
    if (match) {
      console.log(`  Script tag points to: ${match[0]}`);
    }
  }

  // Fetch the actual index JS bundle served on production
  const indexRes = await fetchUrl('https://www.garudaos.in/');
  const jsMatch = indexRes.body.match(/\/assets\/index-[a-zA-Z0-9_-]+\.js/);
  if (jsMatch) {
    const jsUrl = 'https://www.garudaos.in' + jsMatch[0];
    console.log('\nFetching Live JS Bundle:', jsUrl);
    const jsRes = await fetchUrl(jsUrl);
    console.log('JS HTTP Status:', jsRes.status, 'Size:', jsRes.body.length);
    console.log('Does JS include literal "CustomerAuthForm is not defined"?:', jsRes.body.includes('CustomerAuthForm is not defined'));
    console.log('Does JS include raw undefined CustomerAuthForm identifier?:', jsRes.body.includes('CustomerAuthForm,'));
    console.log('Does JS include customer-email input?:', jsRes.body.includes('customer-email'));
    console.log('Does JS include GARUDA Founder Console UI Notice?:', jsRes.body.includes('GARUDA Founder Console UI Notice'));
  }
}

inspectProduction().catch(console.error);
