const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'scouts', 'phase17');

async function testFbSendAccurate() {
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

    const profileUrl = 'https://www.facebook.com/candacecarr6';
    console.log('Navigating to profile:', profileUrl);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
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

    // Focus input
    const targetBox = await page.$("div[role='textbox'][aria-label*='Write' i], div[role='textbox'][contenteditable='true']");
    if (!targetBox) {
      console.error('Target box not found!');
      return;
    }

    console.log('Target box found! Clicking...');
    await targetBox.click();
    await new Promise(r => setTimeout(r, 1000));

    const fbPitch = `Hi Candace! Saw your note regarding needing a dependable web designer for your company. Reaching out directly in private rather than adding noise to public comments.\n\nSaw that you're looking for someone who can build a clean, straightforward website without unnecessary complexity or bloated agency retainers — that is exactly how we operate.\n\nOur team at GARUDA specializes in production-grade web engineering with rapid 48-hour turnarounds, transparent deliverables, and zero monthly overhead.\n\nLive portfolio & interactive systems: https://www.garudaos.in — happy to review your company's requirements in private!\n\nBest regards,\nPraveen Mahawar\nFounder, GARUDA OS`;

    const paragraphs = fbPitch.split('\n\n');
    for (let i = 0; i < paragraphs.length; i++) {
      await page.keyboard.type(paragraphs[i], { delay: 10 });
      if (i < paragraphs.length - 1) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await new Promise(r => setTimeout(r, 120));
      }
    }

    await new Promise(r => setTimeout(r, 2000));
    console.log('Dispatching message via Enter...');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 6000));

    const shotPath = path.join(OUTPUT_DIR, `fb_candace_live_verified_${Date.now()}.png`);
    await page.screenshot({ path: shotPath });
    console.log('Saved screenshot:', shotPath);

    const observe = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return {
        hasPraveen: text.includes('Praveen Mahawar'),
        hasGaruda: text.includes('GARUDA OS'),
        hasCandace: text.includes('Candace Carr')
      };
    });

    console.log('Observation result:', observe);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

testFbSendAccurate();
