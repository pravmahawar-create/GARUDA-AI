const https = require('https');

function check(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', err => resolve({ status: 0, error: err.message }));
  });
}

async function main() {
  console.log('[Render Poll] Checking commit a758bbe on Render (https://garuda-ai-xfif.onrender.com)...');
  for (let i = 1; i <= 36; i++) {
    const health = await check('https://garuda-ai-xfif.onrender.com/health');
    const rhStatus = await check('https://garuda-ai-xfif.onrender.com/api/revenue-hunter/status');
    
    console.log(`[Round ${i}] Health: HTTP ${health.status} (${health.json?.database || health.body?.slice(0, 30)}) | RH Status: HTTP ${rhStatus.status} (${JSON.stringify(rhStatus.json || rhStatus.body || rhStatus.error).slice(0, 70)})`);

    if (rhStatus.status === 200 && rhStatus.json?.success === true) {
      console.log('\n=============================================');
      console.log('✅ RENDER REVENUE HUNTER DEPLOYMENT IS LIVE!');
      console.log('=============================================');
      console.log('Health payload:', JSON.stringify(health.json, null, 2));
      console.log('Revenue Hunter Status:', JSON.stringify(rhStatus.json, null, 2));
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log('Polling reached timeout.');
  process.exit(1);
}

main();
