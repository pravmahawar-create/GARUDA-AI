async function testEndpoints() {
  const urls = [
    'https://www.garudaos.in/',
    'https://www.garudaos.in/pricing',
    'https://www.garudaos.in/demo',
    'https://www.garudaos.in/terms',
    'https://www.garudaos.in/privacy',
    'https://garuda-ai-v1.vercel.app/pricing',
    'https://garuda-ai-xfif.onrender.com/health'
  ];

  console.log('🌐 [Production Smoke Test] Checking live endpoints...\n');

  for (const url of urls) {
    try {
      const start = Date.now();
      const res = await fetch(url, { headers: { 'User-Agent': 'GARUDA-Production-Verifier/1.0' } });
      const duration = Date.now() - start;
      const text = await res.text();
      console.log(`✓ [HTTP ${res.status}] ${url} (${duration}ms) - ${text.slice(0, 80).replace(/\n/g, ' ')}...`);
    } catch (err) {
      console.log(`✖ [FAIL] ${url} - Error: ${err.message}`);
    }
  }
}

testEndpoints();
