const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function inspectFbChatInput() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.setCookie(
      { name: 'c_user', value: process.env.FB_C_USER.trim(), domain: '.facebook.com', path: '/', secure: true },
      { name: 'xs', value: process.env.FB_XS.trim(), domain: '.facebook.com', path: '/', httpOnly: true, secure: true }
    );

    await page.goto('https://www.facebook.com/candacecarr6', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    // Click Message button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("div[role='button'], a[role='button'], [aria-label*='Message' i], button"));
      for (const b of btns) {
        const txt = (b.textContent || '').trim().toLowerCase();
        if (txt === 'message') {
          b.click();
          break;
        }
      }
    });

    await new Promise(r => setTimeout(r, 4000));

    // Find all contenteditable, inputs, textareas, role='textbox'
    const inputs = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[contenteditable], input, textarea, [role='textbox']"));
      return els.map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        contenteditable: el.getAttribute('contenteditable'),
        ariaLabel: el.getAttribute('aria-label'),
        placeholder: el.getAttribute('placeholder'),
        className: el.className,
        rect: el.getBoundingClientRect()
      }));
    });

    console.log('Chat input elements found:', JSON.stringify(inputs, null, 2));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

inspectFbChatInput();
