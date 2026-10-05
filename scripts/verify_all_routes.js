const https = require('https');

const paths = [
  '/',
  '/chat',
  '/login',
  '/app',
  '/pricing',
  '/experience',
  '/what-is-garuda-ai',
  '/services/custom-ai-development'
];

(async () => {
  console.log('Verifying key routes on https://www.garudaos.in ...');
  for (const p of paths) {
    await new Promise((resolve) => {
      https.get('https://www.garudaos.in' + p, (res) => {
        console.log(`Route: ${p.padEnd(35)} -> Status: ${res.statusCode}`);
        resolve();
      }).on('error', (err) => {
        console.log(`Route: ${p.padEnd(35)} -> Error: ${err.message}`);
        resolve();
      });
    });
  }
})();
