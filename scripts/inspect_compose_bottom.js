const puppeteer = require('puppeteer');
const path = require('path');
const { createAuthenticatedRedditSession } = require('./reddit_dm_dispatcher');

async function inspectComposeBottom() {
  const { browser, page } = await createAuthenticatedRedditSession();
  try {
    const toUsername = 'IlIlllIIllIII';
    const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(toUsername)}`;
    console.log('Navigating to compose...');
    await page.goto(composeUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));

    const bottomPic = path.resolve(__dirname, '..', 'data', 'reddit_compose_bottom.png');
    await page.screenshot({ path: bottomPic, fullPage: true });
    console.log('Saved full page screenshot to:', bottomPic);

    // Check all buttons and captcha
    const info = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
        tag: b.tagName,
        text: (b.innerText || b.value || '').trim(),
        id: b.id,
        className: b.className,
        visible: b.offsetParent !== null
      }));
      const hasRecaptcha = !!document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, reputation-recaptcha');
      return { buttons, hasRecaptcha };
    });

    console.log('Buttons at bottom:', JSON.stringify(info.buttons, null, 2));
    console.log('Has reCAPTCHA:', info.hasRecaptcha);
  } finally {
    await browser.close();
  }
}

inspectComposeBottom().catch(console.error);
