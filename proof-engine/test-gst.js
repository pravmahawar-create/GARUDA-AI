const puppeteer = require('puppeteer');
const browserController = require('./core/browser-controller');
const path = require('path');

(async () => {
  try {
    await browserController.ensureServer(path.resolve(__dirname, '../billing'), 4174);
    const { browser, page } = await browserController.launchBrowser({ width: 1080, height: 1920, isMobile: true });
    await page.goto('http://127.0.0.1:4174/#/bill', { waitUntil: 'networkidle2' });
    
    // 1. Enter Customer Name
    const nameInput = await page.$('input[placeholder="Naam *"]');
    await nameInput.click();
    await page.keyboard.type('Sharma Hardware', { delay: 20 });

    // 2. Enter GSTIN
    const gstinInput = await page.$('input[placeholder="GSTIN (GST bill ke liye)"]');
    await gstinInput.click();
    await page.keyboard.type('23AABCS1429B1ZB', { delay: 20 });

    // 3. Add Cement
    const btns = await page.$$('button');
    for (const b of btns) {
      const text = await (await b.getProperty('textContent')).jsonValue();
      if (text.includes('Cement')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 400));

    // 4. Fill Quantity for Cement (row 1 is empty freshRow, row 2 is Cement)
    const itemRows = await page.$$('.item-row');
    if (itemRows.length >= 2) {
      const qty = await itemRows[1].$('input[placeholder="Qty"]');
      if (qty) {
        await qty.click();
        await page.keyboard.type('10', { delay: 20 });
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // 5. Click Save Bill
    const saveBtn = await page.$('button.primary.big');
    await saveBtn.click();

    await new Promise(r => setTimeout(r, 2000));
    console.log('Final URL:', page.url());

    const billTitle = await page.evaluate(() => document.querySelector('.top-title')?.textContent || 'none');
    const badge = await page.evaluate(() => document.querySelector('.billtype-badge')?.textContent || 'none');
    const taxLines = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.tp-tline')).map(el => el.textContent.trim());
    });
    const grandTotal = await page.evaluate(() => document.querySelector('.tp-grand')?.textContent || 'none');
    const custGstin = await page.evaluate(() => {
      const m = document.querySelector('.tp-cust')?.textContent || '';
      return m.includes('GSTIN') ? m : 'No GSTIN in cust block';
    });

    console.log('Bill Title:', billTitle);
    console.log('Badge:', badge);
    console.log('Cust Block:', custGstin);
    console.log('Tax Lines:', taxLines);
    console.log('Grand Total:', grandTotal);

    await page.screenshot({ path: path.join(__dirname, '../output/test_gst_bill.png') });
    await browser.close();
    await browserController.close();
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
