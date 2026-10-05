const https = require('https');

https.get('https://www.garudaos.in?' + Date.now(), (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Last-Modified Header:', res.headers['last-modified']);
    console.log('Vercel ID:', res.headers['x-vercel-id']);
    
    // Find script tags
    const scripts = html.match(/src="[^"]+"/g);
    console.log('Scripts:', scripts);
    
    // Find stylesheet tags
    const styles = html.match(/href="[^"]+\.css"/g);
    console.log('Styles:', styles);
  });
});
