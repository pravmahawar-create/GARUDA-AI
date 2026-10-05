const puppeteer = require('puppeteer');
(async()=>{
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36');
  try{
    await page.goto('https://www.studypool.com/login', {waitUntil:'domcontentloaded', timeout:25000});
    console.log('Login page', await page.title());
    await page.waitForSelector('input[type="email"]', {timeout:10000});
    await page.type('input[type="email"]', 'garudaos.ai@gmail.com', {delay:40});
    await page.type('input[type="password"]', 'Ayeshapm1@', {delay:40});
    console.log('Filled creds');
    const btn = await page.$('button[type="submit"]');
    if(btn){ await btn.click(); console.log('Clicked login'); }
    await new Promise(r=>setTimeout(r,6000));
    console.log('After login URL', page.url());
    console.log('Title', await page.title());
    const text = await page.evaluate(()=> document.body.innerText.slice(0,3000));
    console.log('DASHBOARD_TEXT', text.slice(0,2500));
    // Try to find classes/courses
    const classes = await page.evaluate(()=>{
      const t = document.body.innerText;
      // Look for Notebank / My Documents / Courses
      return t.slice(0,4000);
    });
    console.log('CLASSES_RAW', classes.slice(0,2000));
  } catch(e){ console.log('ERR', e.message.slice(0,800)); console.log(e.stack.slice(0,800)); }
  await browser.close();
})();
