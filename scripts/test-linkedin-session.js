const puppeteer = require('puppeteer');
require('dotenv').config();

async function testWithJsession() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36']
  });
  const page = await browser.newPage();
  await page.setCookie(
    { name: 'li_at', value: process.env.LINKEDIN_LI_AT, domain: '.linkedin.com', path: '/', secure: true, httpOnly: true },
    { name: 'JSESSIONID', value: '"ajax:1234567890123456789"', domain: '.linkedin.com', path: '/', secure: true }
  );

  try {
    console.log('Navigating to LinkedIn feed...');
    const res = await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 25000 });
    console.log('Final URL:', page.url());
    console.log('Title:', await page.title());
    const isLogin = page.url().includes('login') || page.url().includes('checkpoint');
    console.log('Is Login/Checkpoint:', isLogin);
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await browser.close();
  }
}
testWithJsession();
