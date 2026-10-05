const https = require('https');

function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        url,
        status: res.statusCode,
        headers: res.headers,
        scripts: (data.match(/<script[^>]+src="([^"]+)"/g) || [])
      }));
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

(async () => {
  console.log('--- Checking garuda-ai.vercel.app ---');
  console.log(await fetch('https://garuda-ai.vercel.app/chat'));

  console.log('\n--- Checking garuda-ai-v1.vercel.app ---');
  console.log(await fetch('https://garuda-ai-v1.vercel.app/chat'));

  console.log('\n--- Checking www.garudaos.in ---');
  console.log(await fetch('https://www.garudaos.in/chat'));
})();
