const puppeteer = require('puppeteer');
const path = require('path');
(async()=>{
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36');
  const filePath = path.resolve('data/notebank-upload/GARUDA-Study-Guide-mahawar-ji.txt');
  try{
    await page.goto('https://www.studypool.com/login', {waitUntil:'domcontentloaded', timeout:25000});
    console.log('Login page', await page.title());
    await page.waitForSelector('input[type="email"]', {timeout:10000});
    await page.type('input[type="email"]', 'garudaos.ai@gmail.com', {delay:50});
    await page.type('input[type="password"]', 'Ayeshapm1@', {delay:50});
    console.log('Filled creds garudaos.ai@gmail.com');
    const btn = await page.$('button[type="submit"]');
    if(btn) await btn.click();
    await new Promise(r=>setTimeout(r,7000));
    console.log('After login URL', page.url());
    // Navigate to Notebank
    await page.goto('https://www.studypool.com/notebank', {waitUntil:'domcontentloaded', timeout:25000});
    await new Promise(r=>setTimeout(r,4000));
    console.log('Notebank URL', page.url());
    const text = await page.evaluate(()=> document.body.innerText.slice(0,2500));
    console.log('NOTEBANK_TEXT', text.slice(0,1500));
    // Try to find upload button
    const uploadSelectors = ['a[href*="upload"]','button:has-text("Upload")','[data-testid*="upload"]','a[href*="notebank/upload"]'];
    let found = false;
    for(const sel of ['a[href*="upload"]']){
      const el = await page.$(sel);
      if(el){ console.log('Found upload selector', sel); found=true; break; }
    }
    if(!found) console.log('No upload button found — need manual selector, dumping HTML');
    const html = await page.content();
    console.log(html.slice(0,3000));
  } catch(e){ console.log('ERR', e.message.slice(0,800)); }
  await browser.close();
})();
