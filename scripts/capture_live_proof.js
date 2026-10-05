const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);
  
  console.log('Navigating to https://www.garudaos.in/chat ...');
  await page.goto('https://www.garudaos.in/chat', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'output/live_fixed_talk_to_architect_proof.png' });
  console.log('Screenshot saved to output/live_fixed_talk_to_architect_proof.png');
  
  // Inspect ChatConsole elements
  const chatDetails = await page.evaluate(() => {
    const textarea = document.querySelector('textarea');
    const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Send' || b.innerText.includes('Send'));
    const messagesBox = document.querySelector('main');
    return {
      hasTextarea: !!textarea,
      textareaRect: textarea ? textarea.getBoundingClientRect() : null,
      hasSendBtn: !!sendBtn,
      sendBtnRect: sendBtn ? sendBtn.getBoundingClientRect() : null,
      mainRect: messagesBox ? messagesBox.getBoundingClientRect() : null
    };
  });
  console.log('Chat Details:', JSON.stringify(chatDetails, null, 2));

  // Now test https://www.garudaos.in/login Google click
  console.log('Navigating to https://www.garudaos.in/login ...');
  await page.goto('https://www.garudaos.in/login', { waitUntil: 'networkidle2' });
  
  // Find Google button
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Google'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Google button clicked:', clicked);
  
  // Wait 4 seconds to observe navigation or fallback
  await new Promise(r => setTimeout(r, 4000));
  console.log('URL after Google click:', page.url());
  await page.screenshot({ path: 'output/live_login_after_google_click.png' });

  await browser.close();
})();
