const puppeteer = require('puppeteer');
(async()=>{
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36');
  try{
    await page.goto('https://www.studypool.com/login', {waitUntil:'domcontentloaded', timeout:25000});
    console.log('Loaded login', await page.title());
    const text = await page.evaluate(()=> document.body.innerText.slice(0,1500));
    console.log('PAGE_TEXT', text.slice(0,1000));
    const hasEmail = await page.$('input[type="email"]');
    console.log('hasEmail field:', !!hasEmail);
  } catch(e){ console.log('ERR', e.message.slice(0,400)); }
  await browser.close();
})();
