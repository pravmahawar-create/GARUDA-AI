const https = require('https');

function get(url, headers = {}) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data, json: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data, json: null });
        }
      });
    }).on('error', err => resolve({ status: 0, error: err.message }));
  });
}

async function main() {
  const commit = '7bb4b049f756b6881ae5a6e32f00e12fd9a9ed73';
  console.log(`[DEPLOY-POLL] Monitoring commit ${commit.slice(0, 7)} on Vercel & Render...`);

  for (let i = 1; i <= 40; i++) {
    const ghRes = await get(`https://api.github.com/repos/pravmahawar-create/GARUDA-AI/commits/${commit}/statuses`, { 'User-Agent': 'Node.js' });
    const statuses = Array.isArray(ghRes.json) ? ghRes.json : [];
    const v1 = statuses.find(s => s.context?.includes('garuda-ai-v1'));
    const prod = statuses.find(s => s.context === 'Vercel – garuda-ai');

    const renderRes = await get('https://garuda-ai-xfif.onrender.com/api/cybershield/health');
    const vercelPageRes = await get('https://www.garudaos.in/cybershield');

    console.log(`[Round ${i}] Vercel: v1=${v1?.state} prod=${prod?.state} | Render /cybershield/health HTTP ${renderRes.status} | Vercel /cybershield HTTP ${vercelPageRes.status}`);

    const vercelSuccess = (v1?.state === 'success' || prod?.state === 'success');
    const renderSuccess = (renderRes.status === 200 && renderRes.json?.success === true);

    if (vercelSuccess && renderSuccess) {
      console.log('✅ BOTH VERCEL AND RENDER DEPLOYMENTS ARE LIVE AND HEALTHY!');
      console.log('Render Health Payload:', JSON.stringify(renderRes.json));
      process.exit(0);
    }

    await new Promise(r => setTimeout(r, 10000));
  }

  console.log('⚠️ Polling timeout reached. Check cloud consoles.');
}

main();
