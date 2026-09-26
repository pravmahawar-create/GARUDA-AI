const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function checkAuth() {
  console.log('--- STARTING PLATFORM AUTHENTICATION DIAGNOSTIC ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const results = {};

  try {
    // 1. Facebook Check
    console.log('[1/2] Testing Facebook Session...');
    const pageFb = await browser.newPage();
    await pageFb.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await pageFb.setCookie(
      { name: 'c_user', value: (process.env.FB_C_USER || '').trim(), domain: '.facebook.com', path: '/', secure: true },
      { name: 'xs', value: (process.env.FB_XS || '').trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
    );
    await pageFb.goto('https://www.facebook.com/me', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));
    const fbUrl = pageFb.url();
    const fbTitle = await pageFb.title();
    const fbLoggedIn = !fbUrl.includes('login') && !fbUrl.includes('checkpoint');
    results.facebook = { url: fbUrl, title: fbTitle, loggedIn: fbLoggedIn };
    console.log('Facebook result:', results.facebook);
    await pageFb.close();

    // 2. Instagram Check
    console.log('[2/2] Testing Instagram Session...');
    const pageIg = await browser.newPage();
    await pageIg.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await pageIg.setCookie(
      { name: 'sessionid', value: (process.env.INSTAGRAM_SESSION_ID || '').trim(), domain: '.instagram.com', path: '/' },
      { name: 'ds_user_id', value: (process.env.INSTAGRAM_USER_ID || '').trim(), domain: '.instagram.com', path: '/' }
    );
    await pageIg.goto('https://www.instagram.com/garudaos.ai/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));
    const igUrl = pageIg.url();
    const igTitle = await pageIg.title();
    const isIgLogin = await pageIg.evaluate(() => Boolean(document.querySelector("input[name='username']")));
    const igLoggedIn = !isIgLogin && !igUrl.includes('/accounts/login');
    results.instagram = { url: igUrl, title: igTitle, loggedIn: igLoggedIn };
    console.log('Instagram result:', results.instagram);
    await pageIg.close();

  } catch (err) {
    console.error('Diagnostic error:', err.message);
    results.error = err.message;
  } finally {
    await browser.close();
  }

  console.log('--- AUTHENTICATION DIAGNOSTIC COMPLETE ---');
  return results;
}

if (require.main === module) {
  checkAuth();
}

module.exports = { checkAuth };
