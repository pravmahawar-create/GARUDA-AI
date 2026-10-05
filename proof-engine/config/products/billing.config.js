/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - PRODUCT CONFIGURATION
 * Product: GARUDA Billing (POS & Retail GST Invoicing Engine)
 * Mode: GARUDA HUMAN PRESENTER MODE v1
 * 
 * Strict Anti-Fabrication Law:
 * Only verified, physically working workflows and safe mock data.
 * Voice: hi-IN-SwaraNeural with natural conversational delivery.
 */

const path = require('path');

module.exports = {
  product: {
    id: 'billing',
    name: 'GARUDA Billing',
    tagline: 'High-Performance Offline-First POS & GST Invoicing Engine',
    category: 'Retail & MSME Fintech',
    appDir: path.resolve(__dirname, '../../../billing'),
    port: 4174,
    startRoute: '#/',
    branding: {
      primaryColor: '#10b981', // Emerald
      secondaryColor: '#f59e0b', // Garuda Gold
      darkBg: '#0b0f19',
      lightText: '#f8fafc'
    },
    safeMockData: {
      customerName: 'Sharma Hardware',
      customerMobile: '9826012345',
      customerGstin: '23AABCS1429B1ZB',
      item1: { name: 'TMT Sariya 12mm', unit: 'qtl', qty: '15', rate: '850' },
      item2: { name: 'Ultratech Cement', unit: 'bag', qty: '50', rate: '380' }
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 9:16 SHORT FORM — HUMAN PRESENTER STORY (~48-52 sec)
  // ─────────────────────────────────────────────────────────────────────────
  shortScenes: [
    {
      id: 'scene_01_hook',
      name: 'Hook & Identity',
      intent: 'hook',
      energy: 0.90,
      pace: 1.05,
      narration: 'Software banana alag baat hai... lekin ground par dukaandaar ke liye software banana? Yeh GARUDA ka kaam hai.',
      narrationEn: 'Building software is one thing. Engineering software for shopkeepers on the ground? That is GARUDA\'s mission.',
      route: '#/',
      annotation: { text: 'GARUDA POS BILLING', selector: '.brand, .top-title, header', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(1200);
        await helpers.smoothScroll(page, 150);
        await helpers.sleep(800);
        await helpers.smoothScroll(page, 0);
        await helpers.sleep(500);
      }
    },
    {
      id: 'scene_02_customer',
      name: 'Customer Selection',
      intent: 'discovery',
      energy: 0.85,
      pace: 1.03,
      narration: 'Sabse pehle dekhiye... counter par customer aaya, toh ek tap mein uska khata aur GST details samne.',
      narrationEn: 'First, take a look... the moment a customer arrives at the counter, their ledger and GST context load in one tap.',
      route: '#/bill',
      annotation: { text: 'SELECT CUSTOMER', selector: '.ir-top select, input[placeholder*="Customer"], .card', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(800);
        const select = await page.$('select');
        if (select) {
          const options = await page.$$eval('select option', opts => opts.map(o => ({ val: o.value, txt: o.textContent })));
          const validOpt = options.find(o => o.val && o.val !== '');
          if (validOpt) await select.select(validOpt.val);
        }
        await helpers.sleep(1000);
      }
    },
    {
      id: 'scene_03_items',
      name: 'Add Items & Catalog',
      intent: 'live_demonstration',
      energy: 0.86,
      pace: 1.02,
      narration: 'Ab item add karte hain. Sariya aur Cement catalog se chuna... aur quantities direct enter ho gayi.',
      narrationEn: 'Now let\'s add items. Selecting Steel and Cement from the catalog, quantities are entered directly.',
      route: '#/bill',
      annotation: { text: 'ADD ITEMS', selector: '.chip-steel, .chip-cement, .add-btns', position: 'top' },
      action: async (page, helpers) => {
        await helpers.sleep(600);
        const steelBtn = await page.$('.chip-steel');
        if (steelBtn) {
          await helpers.realisticClick(page, steelBtn);
          await helpers.sleep(500);
        }
        const qtyInputs = await page.$$('.item-row input[inputmode="decimal"]');
        if (qtyInputs.length >= 2) {
          await helpers.realisticType(page, qtyInputs[0], '15');
          await helpers.sleep(300);
          await helpers.realisticType(page, qtyInputs[1], '850');
        }
        await helpers.sleep(600);

        const cementBtn = await page.$('.chip-cement');
        if (cementBtn) {
          await helpers.realisticClick(page, cementBtn);
          await helpers.sleep(500);
          const allInputs = await page.$$('.item-row input[inputmode="decimal"]');
          if (allInputs.length >= 4) {
            await helpers.realisticType(page, allInputs[2], '50');
            await helpers.sleep(300);
            await helpers.realisticType(page, allInputs[3], '380');
          }
        }
        await helpers.sleep(1000);
      }
    },
    {
      id: 'scene_04_calc',
      name: 'Real-Time Auto Calculation',
      intent: 'result',
      energy: 0.88,
      pace: 1.04,
      narration: 'Aur yahan notice kijiye — subtotal, CGST aur SGST bina kisi calculator ke, yahin instantly calculate ho raha hai.',
      narrationEn: 'And notice here — subtotal, CGST, and SGST calculate right here without needing a manual calculator.',
      route: '#/bill',
      annotation: { text: 'AUTO CALCULATION', selector: '.total-line.grand, .total-line', position: 'top' },
      action: async (page, helpers) => {
        await helpers.sleep(500);
        await helpers.smoothScroll(page, 450);
        await helpers.sleep(1800);
      }
    },
    {
      id: 'scene_05_receipt',
      name: '1-Tap Thermal Receipt',
      intent: 'feature_reveal',
      energy: 0.90,
      pace: 1.03,
      narration: 'Save kiya... aur dekhiye, 80mm thermal receipt ready. Barcode aur pure tax breakup ke sath.',
      narrationEn: 'Hit save... and look, an 80mm thermal receipt is ready with full tax breakdown and barcode.',
      route: '#/bill',
      annotation: { text: '1-TAP THERMAL RECEIPT', selector: 'button.primary.big, .invoice-paper', position: 'top' },
      action: async (page, helpers) => {
        const saveBtn = await page.$('button.primary.big');
        if (saveBtn) {
          await helpers.realisticClick(page, saveBtn);
          await helpers.sleep(1500);
        }
        await page.waitForSelector('.invoice-paper, .tp-table', { timeout: 5000 }).catch(() => {});
        // UI Breathing Room: viewer absorbs the visual receipt
        await helpers.sleep(900);
        await helpers.smoothScroll(page, 200);
        await helpers.sleep(1200);
      }
    },
    {
      id: 'scene_06_offline',
      name: 'Offline-First Verification',
      intent: 'reassuring',
      energy: 0.84,
      pace: 0.98,
      narration: 'Mandi ya godown mein internet chala bhi gaya na... koi problem nahi. Local database ke sath billing rukti nahi.',
      narrationEn: 'Even if internet drops in the godown or market... no problem. With local persistence, billing never stops.',
      route: '#/invoice',
      annotation: { text: '100% OFFLINE FIRST', selector: '.pay-row, .invoice-paper, .actions', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(1500);
        await helpers.smoothScroll(page, 300);
        await helpers.sleep(1500);
      }
    },
    {
      id: 'scene_07_cta',
      name: 'GARUDA Engineering & CTA',
      intent: 'cta',
      energy: 0.86,
      pace: 1.01,
      narration: 'Agar aapke business mein bhi aisi koi problem hai... toh GARUDA ko bataiye. Solution hum engineer karenge: garudaos.in',
      narrationEn: 'If your business faces operational challenges like this... bring them to GARUDA. We engineer the solution: garudaos.in',
      isBrandCard: true,
      cardText: {
        title: 'GARUDA',
        tagline: 'AI SOFTWARE • AUTOMATION • PRODUCT ENGINEERING',
        portal: 'www.garudaos.in',
        cta: 'Have a business problem? Let GARUDA engineer the solution.'
      },
      action: async (page, helpers) => {
        await helpers.sleep(3500);
      }
    }
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // 16:9 MASTER FILM — HUMAN PRESENTER STORY (~72-80 sec)
  // ─────────────────────────────────────────────────────────────────────────
  masterScenes: [
    {
      id: 'm_scene_01_brand_open',
      name: 'GARUDA Sovereign Reveal',
      intent: 'hook',
      energy: 0.90,
      pace: 1.05,
      narration: 'Software banana alag baat hai... lekin ground par dukaandaar ke liye software banana? Yeh GARUDA ka kaam hai.',
      narrationEn: 'Building software is one thing. Engineering software for shopkeepers on the ground? That is GARUDA\'s mission.',
      isBrandCard: true,
      cardText: {
        title: 'GARUDA',
        tagline: 'BUILT TO SOLVE REAL BUSINESS PROBLEMS',
        portal: 'www.garudaos.in'
      },
      action: async (page, helpers) => {
        await helpers.sleep(3000);
      }
    },
    {
      id: 'm_scene_02_problem',
      name: 'Counter Bottleneck Problem',
      intent: 'problem',
      energy: 0.78,
      pace: 0.97,
      narration: 'Mandi aur retail counters par jab bheed hoti hai... tab slow software aur manual hisab ghanton ka nuksan karte hain.',
      narrationEn: 'During counter rush hours, slow software and manual paperwork cause costly operational delays.',
      route: '#/',
      annotation: { text: 'REAL-TIME DASHBOARD', selector: '.dashboard-metrics, header, .top-title', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(1000);
        await helpers.smoothScroll(page, 200);
        await helpers.sleep(1200);
      }
    },
    {
      id: 'm_scene_03_customer',
      name: 'Customer & Scope Isolation',
      intent: 'discovery',
      energy: 0.85,
      pace: 1.02,
      narration: 'GARUDA Billing mein dekhiye... ek click par customer select hota hai, aur uska GST context automatically load ho jata hai.',
      narrationEn: 'In GARUDA Billing, customer selection takes one click and automatically isolates tax context.',
      route: '#/bill',
      annotation: { text: 'SELECT CUSTOMER', selector: '.ir-top select, input[placeholder*="Customer"]', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(1000);
        const select = await page.$('select');
        if (select) {
          const options = await page.$$eval('select option', opts => opts.map(o => ({ val: o.value, txt: o.textContent })));
          const validOpt = options.find(o => o.val && o.val !== '');
          if (validOpt) await select.select(validOpt.val);
        }
        await helpers.sleep(1200);
      }
    },
    {
      id: 'm_scene_04_items',
      name: 'Lightning Item Entry',
      intent: 'live_demonstration',
      energy: 0.86,
      pace: 1.02,
      narration: 'Ab catalog se Sariya aur Cement jaise hardware items ko chuniye... aur quantities bina kisi jhanjhat ke add ho jaati hain.',
      narrationEn: 'Select hardware items like Steel and Cement from the smart catalog... quantities are added smoothly and directly.',
      route: '#/bill',
      annotation: { text: 'ADD ITEMS', selector: '.chip-steel, .chip-cement, .add-btns', position: 'top' },
      action: async (page, helpers) => {
        const steelBtn = await page.$('.chip-steel');
        if (steelBtn) {
          await helpers.realisticClick(page, steelBtn);
          await helpers.sleep(400);
          const qtyInputs = await page.$$('.item-row input[inputmode="decimal"]');
          if (qtyInputs.length >= 2) {
            await helpers.realisticType(page, qtyInputs[0], '15');
            await helpers.sleep(300);
            await helpers.realisticType(page, qtyInputs[1], '850');
          }
        }
        const cementBtn = await page.$('.chip-cement');
        if (cementBtn) {
          await helpers.realisticClick(page, cementBtn);
          await helpers.sleep(400);
          const allInputs = await page.$$('.item-row input[inputmode="decimal"]');
          if (allInputs.length >= 4) {
            await helpers.realisticType(page, allInputs[2], '50');
            await helpers.sleep(300);
            await helpers.realisticType(page, allInputs[3], '380');
          }
        }
        await helpers.sleep(1200);
      }
    },
    {
      id: 'm_scene_05_calc',
      name: 'Mathematical Precision & GST',
      intent: 'result',
      energy: 0.88,
      pace: 1.04,
      narration: 'Yahan screen par dekhiye — CGST, SGST, freight aur loading charges ek sath accurately calculate hote hain.',
      narrationEn: 'Notice on screen — CGST, SGST, freight, and loading charges calculate simultaneously with precision.',
      route: '#/bill',
      annotation: { text: 'AUTO CALCULATION', selector: '.total-line.grand, .total-line', position: 'top' },
      action: async (page, helpers) => {
        await helpers.smoothScroll(page, 450);
        await helpers.sleep(2000);
      }
    },
    {
      id: 'm_scene_06_receipt',
      name: 'Thermal & Digital Receipt Preview',
      intent: 'feature_reveal',
      energy: 0.90,
      pace: 1.03,
      narration: 'Save karte hi instant 80mm thermal receipt generate hoti hai, jise WhatsApp ya thermal printer par turant bheja ja sakta hai.',
      narrationEn: 'Saving immediately generates an 80mm thermal receipt ready for instant printing or WhatsApp dispatch.',
      route: '#/bill',
      annotation: { text: '1-TAP THERMAL RECEIPT', selector: 'button.primary.big, .invoice-paper', position: 'top' },
      action: async (page, helpers) => {
        const saveBtn = await page.$('button.primary.big');
        if (saveBtn) {
          await helpers.realisticClick(page, saveBtn);
          await helpers.sleep(1500);
        }
        await page.waitForSelector('.invoice-paper, .tp-table', { timeout: 5000 }).catch(() => {});
        // UI Breathing room
        await helpers.sleep(900);
        await helpers.smoothScroll(page, 250);
        await helpers.sleep(1500);
      }
    },
    {
      id: 'm_scene_07_offline',
      name: 'Offline-First Resilience',
      intent: 'reassuring',
      energy: 0.83,
      pace: 0.98,
      narration: 'Aur sabse zaroori baat — internet connection band ho tab bhi, Dexie local database ke sath dukaan ka hisab chalta rehta hai.',
      narrationEn: 'And most importantly — even when connectivity drops, local database persistence keeps business running.',
      route: '#/invoice',
      annotation: { text: '100% OFFLINE FIRST', selector: '.pay-row, .invoice-paper', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(2000);
      }
    },
    {
      id: 'm_scene_08_brand_close',
      name: 'GARUDA Engineering Outro & CTA',
      intent: 'cta',
      energy: 0.86,
      pace: 1.01,
      narration: 'Agar aapke business mein bhi aisi koi problem hai... toh GARUDA ko bataiye. Solution hum engineer karenge: garudaos.in',
      narrationEn: 'Have a business problem? Bring it to GARUDA. We will engineer the solution: garudaos.in',
      isBrandCard: true,
      cardText: {
        title: 'GARUDA',
        tagline: 'AI SOFTWARE • AUTOMATION • PRODUCT ENGINEERING',
        portal: 'www.garudaos.in',
        cta: 'Have a business problem? Let GARUDA engineer the solution.'
      },
      action: async (page, helpers) => {
        await helpers.sleep(4000);
      }
    }
  ]
};
