/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - PRODUCT CONFIGURATION V3
 * Product: GARUDA Billing (POS & Retail Invoicing Engine)
 * Version: V3 FINAL PRODUCT PROOF FILM
 * Focus: Human Presenter + Proof + Differentiation ("WHY GARUDA?")
 * 
 * Strict Anti-Fabrication Law:
 * Only verified, physically working workflows and safe mock data.
 * Zero unverified speed claims or superlatives.
 */

const path = require('path');

module.exports = {
  product: {
    id: 'billing',
    outputSubdir: 'v3',
    name: 'GARUDA Billing',
    tagline: 'Workflow-First POS & Invoicing Engine for Indian MSMEs',
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
      item1: { name: 'TMT Steel 12mm', qty: '15', rate: '61' },
      item2: { name: 'Cement - UltraTech', qty: '50', rate: '395' }
    }
  },

  microClipMoments: [
    { startSec: 8, durSec: 12, name: 'Actual Bill Creation' },
    { startSec: 36, durSec: 10, name: 'Actual Thermal Receipt' },
    { startSec: 26, durSec: 10, name: 'Offline-First Workflow' }
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // 9:16 SHORT FORM — FINAL V3 STORY (~52-55 sec)
  // ───────────────────────────────────────────────────────────────────────────
  shortScenes: [
    {
      id: 'scene_01_hook',
      name: 'Hook: Billing App vs Custom Software',
      intent: 'hook',
      energy: 0.90,
      pace: 1.05,
      narration: 'Billing apps toh bahut hain... lekin aapke business ke hisaab se customized software?',
      narrationEn: 'There are plenty of billing apps... but software engineered specifically for your business?',
      route: '#/',
      annotation: { text: 'WHY GARUDA?', selector: '.topbar, .brand, header, .top-title', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(600);
        await helpers.smoothScroll(page, 150);
        await helpers.sleep(600);
        await helpers.smoothScroll(page, 0);
        await helpers.sleep(300);
      }
    },
    {
      id: 'scene_02_problem',
      name: 'Real Business Problem',
      intent: 'problem',
      energy: 0.85,
      pace: 1.03,
      narration: 'Focus sirf bill printing par nahi... counter ka actual business workflow smoothly chalana hai.',
      narrationEn: 'Focus is not just on printing bills... it is on driving your actual counter workflow smoothly.',
      route: '#/bill',
      annotation: { text: 'WORKFLOW-FIRST ARCHITECTURE', selector: '.billtype-chip, .screen', position: 'top' },
      action: async (page, helpers) => {
        await helpers.sleep(800);
        await helpers.smoothScroll(page, 80);
        await helpers.sleep(400);
      }
    },
    {
      id: 'scene_03_demo',
      name: 'Actual Billing Demo: Customer & Items',
      intent: 'live_demonstration',
      energy: 0.88,
      pace: 1.04,
      narration: 'Customer Sharma Hardware... Cement aur Steel items... aur real-time tax calculation.',
      narrationEn: 'Customer Sharma Hardware... Cement and Steel items... and real-time tax calculation.',
      route: '#/bill',
      annotation: { text: 'REAL-TIME CALCULATION', selector: '.total-line.grand, .card', position: 'top' },
      action: async (page, helpers) => {
        // 1. Enter customer name
        const nameInput = await page.$('input[placeholder="Naam *"]');
        if (nameInput) {
          await nameInput.click();
          await page.keyboard.type('Sharma Hardware', { delay: 20 });
        }
        await helpers.sleep(300);

        // 2. Add Steel and Cement
        const btns = await page.$$('button');
        for (const b of btns) {
          const text = await (await b.getProperty('textContent')).jsonValue();
          if (text.includes('Steel') || text.includes('Cement')) {
            await b.click();
            await helpers.sleep(200);
          }
        }

        // 3. Fill quantities
        const itemRows = await page.$$('.item-row');
        if (itemRows.length >= 3) {
          const row1Qty = await itemRows[1].$('input[placeholder="Qty"]');
          if (row1Qty) {
            await row1Qty.click();
            await page.keyboard.type('15', { delay: 20 });
          }
          await helpers.sleep(150);
          const row2Qty = await itemRows[2].$('input[placeholder="Qty"]');
          if (row2Qty) {
            await row2Qty.click();
            await page.keyboard.type('50', { delay: 20 });
          }
        }

        await helpers.sleep(400);
        await helpers.smoothScroll(page, 320);
        await helpers.sleep(500);
      }
    },
    {
      id: 'scene_04_differentiation',
      name: 'Differentiation Moment: Engineered Workflow',
      intent: 'explanatory',
      energy: 0.86,
      pace: 1.02,
      narration: 'Yahi difference hai: generic template nahi, tailored business engineering.',
      narrationEn: 'This is the difference: not a generic template, but tailored business engineering.',
      route: null,
      annotation: { text: 'ENGINEERED FOR YOUR WORKFLOW', selector: '.total-line.grand, .card', position: 'top' },
      action: async (page, helpers) => {
        await helpers.sleep(800);
        await helpers.smoothScroll(page, 450);
        await helpers.sleep(1000);
      }
    },
    {
      id: 'scene_05_offline',
      name: 'Offline-First Proof',
      intent: 'reassuring',
      energy: 0.85,
      pace: 1.04,
      narration: 'Internet chala bhi gaya na... billing rukti nahi. 100% offline-first indexed database.',
      narrationEn: 'Even if the internet drops... billing does not stop. 100% offline-first indexed database.',
      route: null,
      annotation: { text: '100% OFFLINE-FIRST (INDEXEDDB)', selector: 'button.primary.big', position: 'top' },
      action: async (page, helpers) => {
        await helpers.sleep(600);
        const saveBtn = await page.$('button.primary.big');
        if (saveBtn) {
          const box = await saveBtn.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
          }
        }
        await helpers.sleep(800);
      }
    },
    {
      id: 'scene_06_hero_bill',
      name: 'Actual Bill Generation: HERO MOMENT',
      intent: 'feature_reveal',
      energy: 0.92,
      pace: 1.03,
      narration: 'Dekhiye, single tap par bill generate... aur actual thermal receipt ready.',
      narrationEn: 'Notice, single tap generates the bill... and the actual thermal receipt is ready.',
      route: null, // DO NOT switch route, save action automatically transitions to generated invoice
      annotation: { text: 'VERIFIED WORKING PROOF', selector: '.invoice-paper, .pay-card', position: 'top' },
      action: async (page, helpers) => {
        const saveBtn = await page.$('button.primary.big');
        if (saveBtn) {
          await helpers.realisticClick(page, saveBtn);
          await helpers.sleep(1200);
        }
        await page.waitForSelector('.invoice-paper, .tp-table', { timeout: 6000 }).catch(() => {});
        await helpers.sleep(500);
        await helpers.smoothScroll(page, 200);
        await helpers.sleep(1000);
        await helpers.smoothScroll(page, 0);
        await helpers.sleep(500);
      }
    },
    {
      id: 'scene_07_positioning',
      name: 'Why GARUDA: Final Positioning',
      intent: 'confident',
      energy: 0.88,
      pace: 1.02,
      narration: 'GARUDA ka standard simple hai: real working software, zero excuses.',
      narrationEn: 'The GARUDA standard is simple: real working software, zero excuses.',
      route: null,
      annotation: { text: 'GARUDA ENGINEERING', selector: '.pay-card, .invoice-paper', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(600);
        await helpers.smoothScroll(page, 150);
        await helpers.sleep(1000);
      }
    },
    {
      id: 'scene_08_brand_cta',
      name: 'GARUDA Brand Moment & CTA',
      intent: 'cta',
      energy: 0.88,
      pace: 1.03,
      narration: 'Custom business software chahiye? Connect kijiye: garudaos.in',
      narrationEn: 'Need custom business software? Connect at: garudaos.in',
      isBrandCard: true,
      cardText: {
        title: 'GARUDA',
        tagline: 'AI SOFTWARE • AUTOMATION • PRODUCT ENGINEERING',
        portal: 'www.garudaos.in/chat',
        cta: 'Have an operational bottleneck? Let GARUDA engineer the solution.'
      },
      action: async (page, helpers) => {
        await helpers.sleep(3000);
      }
    }
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // 16:9 MASTER FILM — FINAL V3 STORY (~75-82 sec)
  // ───────────────────────────────────────────────────────────────────────────
  masterScenes: [
    {
      id: 'm_scene_01_hook',
      name: 'Master Hook & Brand Reveal',
      intent: 'hook',
      energy: 0.90,
      pace: 1.04,
      narration: 'Billing app toh bahut hain... lekin aapke business ke hisaab se bana software?',
      narrationEn: 'There are plenty of billing apps... but software engineered specifically for your business?',
      isBrandCard: true,
      cardText: {
        title: 'GARUDA',
        tagline: 'ENGINEERED FOR REAL BUSINESS WORKFLOWS',
        portal: 'www.garudaos.in'
      },
      action: async (page, helpers) => {
        await helpers.sleep(3000);
      }
    },
    {
      id: 'm_scene_02_problem',
      name: 'Counter Bottleneck & Operational Focus',
      intent: 'problem',
      energy: 0.82,
      pace: 1.00,
      narration: 'GARUDA mein focus sirf bill banane par nahi hai. Focus hai — aapka actual business workflow smoothly chalana.',
      narrationEn: 'At GARUDA, the focus is not just on printing bills. It is on driving your actual business workflow seamlessly.',
      route: '#/',
      annotation: { text: 'REAL-TIME DASHBOARD', selector: '.dashboard-metrics, header, .top-title', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(1000);
        await helpers.smoothScroll(page, 200);
        await helpers.sleep(1200);
        await helpers.smoothScroll(page, 0);
      }
    },
    {
      id: 'm_scene_03_customer',
      name: 'Customer & Scope Isolation',
      intent: 'discovery',
      energy: 0.85,
      pace: 1.02,
      narration: 'GARUDA Billing mein dekhiye... counter par customer aaya, toh ek tap mein uska khata aur context load hota hai.',
      narrationEn: 'In GARUDA Billing, the moment a customer arrives at the counter, their ledger and context load in one tap.',
      route: '#/bill',
      annotation: { text: 'SELECT CUSTOMER', selector: '.card input[placeholder*="Naam"], .card select', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(800);
        const nameInput = await page.$('input[placeholder="Naam *"]');
        if (nameInput) {
          await nameInput.click();
          await page.keyboard.type('Sharma Hardware', { delay: 25 });
        }
        await helpers.sleep(600);
      }
    },
    {
      id: 'm_scene_04_items',
      name: 'Catalog & Item Entry',
      intent: 'live_demonstration',
      energy: 0.87,
      pace: 1.02,
      narration: 'Ab catalog se Sariya aur Cement chuniye... aur quantities bina kisi jhanjhat ke add ho jaati hain.',
      narrationEn: 'Now select Steel and Cement from the catalog... quantities are added smoothly and directly.',
      route: '#/bill',
      annotation: { text: 'ADD ITEMS', selector: 'button', position: 'top' },
      action: async (page, helpers) => {
        const btns = await page.$$('button');
        for (const b of btns) {
          const text = await (await b.getProperty('textContent')).jsonValue();
          if (text.includes('Steel') || text.includes('Cement')) {
            await b.click();
            await helpers.sleep(250);
          }
        }
        const itemRows = await page.$$('.item-row');
        if (itemRows.length >= 3) {
          const row1Qty = await itemRows[1].$('input[placeholder="Qty"]');
          if (row1Qty) {
            await row1Qty.click();
            await page.keyboard.type('15', { delay: 25 });
          }
          await helpers.sleep(200);
          const row2Qty = await itemRows[2].$('input[placeholder="Qty"]');
          if (row2Qty) {
            await row2Qty.click();
            await page.keyboard.type('50', { delay: 25 });
          }
        }
        await helpers.sleep(800);
      }
    },
    {
      id: 'm_scene_05_differentiation',
      name: 'Differentiation Moment: Engineered Workflow',
      intent: 'explanatory',
      energy: 0.86,
      pace: 1.00,
      narration: 'Difference sirf features ka nahi hai... difference hai ki software aapke specific business workflow ke around engineer kiya ja sakta hai.',
      narrationEn: 'The difference is not just features. The difference is that software can be custom-engineered around your exact operational workflow.',
      route: null,
      annotation: { text: 'ENGINEERED FOR YOUR WORKFLOW', selector: '.total-line.grand, .card', position: 'top' },
      action: async (page, helpers) => {
        await helpers.smoothScroll(page, 350);
        await helpers.sleep(1500);
      }
    },
    {
      id: 'm_scene_06_calc',
      name: 'Real-Time Auto Calculation',
      intent: 'result',
      energy: 0.88,
      pace: 1.03,
      narration: 'Yahan screen par dekhiye — subtotal, tax aur freight bina kisi manual calculation ke yahin update hote hain.',
      narrationEn: 'Notice on screen — subtotal, tax, and freight update right here without manual calculations.',
      route: null,
      annotation: { text: 'AUTO CALCULATION', selector: '.total-line.grand', position: 'top' },
      action: async (page, helpers) => {
        await helpers.smoothScroll(page, 450);
        await helpers.sleep(1800);
      }
    },
    {
      id: 'm_scene_07_offline',
      name: 'Offline-First Resilience',
      intent: 'reassuring',
      energy: 0.83,
      pace: 0.98,
      narration: 'Aur sabse zaroori baat — internet chala bhi gaya, tab bhi Dexie local database ke sath dukaan ka hisab continue rehta hai.',
      narrationEn: 'And most importantly — even if connectivity drops, local database persistence keeps business running.',
      route: null,
      annotation: { text: '100% OFFLINE FIRST', selector: 'button.primary.big', position: 'top' },
      action: async (page, helpers) => {
        await helpers.sleep(1400);
      }
    },
    {
      id: 'm_scene_08_hero_bill',
      name: 'Actual Bill Generation: HERO MOMENT',
      intent: 'feature_reveal',
      energy: 0.92,
      pace: 1.03,
      narration: 'Bill ready? Ab seedha receipt... aur dekhiye, yahi hai verified working proof.',
      narrationEn: 'Bill ready? Straight to receipt... and notice, this is verified working proof.',
      route: null,
      annotation: { text: 'VERIFIED WORKING PROOF', selector: '.invoice-paper, .pay-card', position: 'top' },
      action: async (page, helpers) => {
        const saveBtn = await page.$('button.primary.big');
        if (saveBtn) {
          await helpers.realisticClick(page, saveBtn);
          await helpers.sleep(1500);
        }
        await page.waitForSelector('.invoice-paper, .tp-table', { timeout: 6000 }).catch(() => {});
        await helpers.sleep(600);
        await helpers.smoothScroll(page, 200);
        await helpers.sleep(1200);
        await helpers.smoothScroll(page, 0);
        await helpers.sleep(600);
      }
    },
    {
      id: 'm_scene_09_positioning',
      name: 'Why GARUDA: Positioning',
      intent: 'confident',
      energy: 0.88,
      pace: 1.01,
      narration: 'GARUDA ka difference simple hai. Hum sirf software nahi dikhate — hum business ke workflow ko samajhkar software engineer karte hain.',
      narrationEn: 'The GARUDA difference is simple. We do not just showcase software — we study your business workflow and engineer the right solution.',
      route: null,
      annotation: { text: 'GARUDA ENGINEERING', selector: '.pay-card, .invoice-paper', position: 'bottom' },
      action: async (page, helpers) => {
        await helpers.sleep(1500);
      }
    },
    {
      id: 'm_scene_10_brand_close',
      name: 'GARUDA Outro & CTA',
      intent: 'cta',
      energy: 0.88,
      pace: 1.02,
      narration: 'GARUDA. Aapke business ke hisaab se engineered. Apne business ke liye custom software chahiye? GARUDA se baat kijiye: garudaos.in',
      narrationEn: 'GARUDA. Engineered for your business. Need custom software for your operations? Speak to GARUDA: garudaos.in',
      isBrandCard: true,
      cardText: {
        title: 'GARUDA',
        tagline: 'AI SOFTWARE • AUTOMATION • PRODUCT ENGINEERING',
        portal: 'www.garudaos.in/chat',
        cta: 'Have a business problem? Let GARUDA engineer the solution.'
      },
      action: async (page, helpers) => {
        await helpers.sleep(4000);
      }
    }
  ]
};
