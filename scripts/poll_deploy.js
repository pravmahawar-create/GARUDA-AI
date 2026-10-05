const https = require('https');

async function poll() {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 6000));
    const statuses = await new Promise((resolve) => {
      const commitHash = process.argv[2] || '1e3d1c0';
      const options = {
        hostname: 'api.github.com',
        path: `/repos/pravmahawar-create/GARUDA-AI/commits/${commitHash}/statuses`,
        headers: { 'User-Agent': 'Node.js' }
      };
      https.get(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch(e) { resolve([]); }
        });
      }).on('error', () => resolve([]));
    });

    const v1 = statuses.find(s => s.context.includes('garuda-ai-v1'));
    const prod = statuses.find(s => s.context === 'Vercel – garuda-ai');
    console.log('Poll #' + (i+1) + ': v1=' + v1?.state + ' (' + v1?.description + ') | prod=' + prod?.state + ' (' + prod?.description + ')');
    if (v1?.state === 'success' || prod?.state === 'success') {
      console.log('Deployment successful!');
      return;
    }
  }
}

poll();
