const https = require('https');

function check(url) {
  https.get(url + '?nocache=' + Date.now(), {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'User-Agent': 'Mozilla/5.0' }
  }, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const scripts = data.match(/\/assets\/[a-zA-Z0-9_\-\.]+\.js/g);
      console.log(url, 'Status:', res.statusCode, 'Scripts:', scripts ? scripts.slice(0, 3) : 'none');
    });
  });
}

check('https://www.garudaos.in/war-room');
check('https://garuda-ai-v1.vercel.app/war-room');
