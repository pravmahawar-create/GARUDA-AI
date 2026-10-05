const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);
  
  console.log('Navigating to https://www.garudaos.in/chat ...');
  await page.goto('https://www.garudaos.in/chat', { waitUntil: 'networkidle2', timeout: 30000 });
  
  await page.screenshot({ path: 'output/live_chat_verified.png' });
  console.log('Screenshot saved to output/live_chat_verified.png');
  
  // Check layout elements
  const info = await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.trim(),
      width: b.offsetWidth,
      height: b.offsetHeight
    }));
    const textarea = document.querySelector('textarea');
    return {
      title: document.title,
      pillCount: pills.length,
      pills: pills.slice(0, 10),
      hasTextarea: !!textarea,
      textareaVisible: textarea ? textarea.offsetHeight > 0 : false
    };
  });
  console.log('Chat page evaluation:', JSON.stringify(info, null, 2));

  console.log('Navigating to https://www.garudaos.in/login ...');
  await page.goto('https://www.garudaos.in/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.screenshot({ path: 'output/live_login_before.png' });
  
  // Find Google login button
  const buttonTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
  });
  console.log('Buttons on login page:', buttonTexts);

  // Click Google button
  const googleBtnFound = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Google'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (googleBtnFound) {
    console.log('Clicked Google button, waiting for navigation or state change...');
    await new Promise(r => setTimeout(r, 4000));
    console.log('Current URL after Google click:', page.url());
    await page.screenshot({ path: 'output/live_login_after_google.png' });
  } else {
    console.log('Google button not found!');
  }

  await browser.close();
})();
