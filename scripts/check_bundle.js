const https = require('https');

https.get('https://garuda-ai-v1.vercel.app/assets/index-DQbgJZX8.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Bundle size:', data.length);
    console.log('Contains skipBrowserRedirect:', data.includes('skipBrowserRedirect'));
    console.log('Contains loginWithGoogleFallback:', data.includes('loginWithGoogleFallback'));
    console.log('Contains Plan an Electoral Campaign:', data.includes('Plan an Electoral Campaign'));
  });
});
