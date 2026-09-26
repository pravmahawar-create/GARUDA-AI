const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function inspectFbDom() {
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

    const query = 'need someone to design a website for me any suggestions';
    const fbSearchUrl = 'https://www.facebook.com/search/posts/?q=' + encodeURIComponent(query);
    console.log('Navigating FB to:', fbSearchUrl);
    await page.goto(fbSearchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 6000));
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 4000));

    const domInfo = await page.evaluate(() => {
      // Find all elements with role='article' or role='feed' or h2/h3/strong links
      const allLinks = Array.from(document.querySelectorAll("a[role='link']")).map(a => ({
        text: a.textContent.trim(),
        href: a.href
      })).filter(l => l.text.length > 2 && l.text.length < 50 && !l.href.includes('/groups/'));

      const articles = Array.from(document.querySelectorAll("div[role='article'], div[role='feed'] > div, div[data-ad-preview]")).map(el => ({
        tag: el.tagName,
        role: el.getAttribute('role'),
        textSnippet: el.textContent.slice(0, 150)
      }));

      // Find any divs containing text like "website" or "designer"
      const textDivs = Array.from(document.querySelectorAll("div[dir='auto']")).map(d => ({
        text: d.textContent.trim()
      })).filter(d => d.text.length > 20 && d.text.length < 300);

      return {
        articlesCount: articles.length,
        articles: articles.slice(0, 5),
        sampleLinks: allLinks.slice(0, 15),
        sampleTextDivs: textDivs.slice(0, 10)
      };
    });

    console.log('FB DOM inspection:', JSON.stringify(domInfo, null, 2));

  } catch (e) {
    console.error('FB inspect error:', e.message);
  } finally {
    await browser.close();
  }
}

inspectFbDom();
