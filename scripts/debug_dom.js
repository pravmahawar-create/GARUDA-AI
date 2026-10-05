const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setCacheEnabled(false);
  
  await page.goto('https://www.garudaos.in/chat', { waitUntil: 'networkidle2' });
  
  const details = await page.evaluate(() => {
    const chip = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Electoral'));
    if (!chip) return 'Chip not found';
    
    let el = chip;
    const hierarchy = [];
    while (el && el !== document.body) {
      const cs = window.getComputedStyle(el);
      hierarchy.push({
        tag: el.tagName,
        className: el.className,
        style: el.getAttribute('style'),
        display: cs.display,
        flexDirection: cs.flexDirection,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
        height: cs.height,
        offsetHeight: el.offsetHeight,
        width: cs.width,
        offsetWidth: el.offsetWidth
      });
      el = el.parentElement;
    }
    return {
      chipHtml: chip.outerHTML,
      hierarchy
    };
  });

  console.log(JSON.stringify(details, null, 2));
  await browser.close();
})();
