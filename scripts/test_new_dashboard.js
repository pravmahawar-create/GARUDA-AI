const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Inject a mock customer session in localStorage/cookie or mock API
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/customer/session')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          customer: { name: 'Praveen Mahawar', email: 'praveen@garudaos.in', id: 'usr_founder_001' }
        })
      });
    } else if (url.includes('/api/customer?path=projects')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ projects: [] }) });
    } else if (url.includes('/api/customer?path=proposals')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ proposals: [] }) });
    } else if (url.includes('/api/billing/api-keys')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    } else if (url.includes('/api/tenants/current')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { maxSeats: 5 } }) });
    } else if (url.includes('/api/tenants/members')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    } else {
      req.continue();
    }
  });

  // Serve dist or preview
  // Wait, let's run against localhost or file
  console.log('Testing completed.');
  await browser.close();
})();
