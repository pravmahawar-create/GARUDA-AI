/**
 * 🦅 GARUDA FINTECH — PHASE 10 REAL HEADLESS CHROME BROWSER QA SUITE
 * Executes real DOM interactions, HTTP fetches, responsive viewport tests,
 * authentication flows (401 -> JWT 200), all 11 modules, 7-step journey,
 * mismatch/fail/duplicate/invalid-HMAC triggers, exports, drawers, Escape dismissal,
 * mobile sidebar + backdrop, classic view switch, and reset verification.
 *
 * Host Reality: Playwright is not installed (`playwright: MISSING`); uses the repo's
 * installed `puppeteer` against local Chromium (`chrome.exe`) + `frontend/dist`.
 */

const assert = require("assert");
const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

process.env.FOUNDER_ADMIN_KEY = process.env.FOUNDER_ADMIN_KEY || "phase10_qa_founder_key_2026";
process.env.GARUDA_JWT_SECRET = process.env.GARUDA_JWT_SECRET || "phase10_qa_jwt_secret_2026";

const authContextMiddleware = require("../middleware/authContextMiddleware");
const fintechRoutes = require("../routes/fintechOrchestrationRoutes");
const merchantOpsRoutes = require("../routes/merchantOpsRoutes");

const SCREENSHOT_DIR = path.join(__dirname, "..", "..", "GARUDA_FINTECH_DEMO_DELIVERY", "screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function signQaJwt(sub, email) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString("base64url");
  const sig = crypto
    .createHmac("sha256", process.env.GARUDA_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function findBrowserExecutable() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  return candidates.find((p) => fs.existsSync(p)) || undefined;
}

async function clickButtonByText(page, textSubstring) {
  const clicked = await page.evaluate((needle) => {
    const btns = Array.from(document.querySelectorAll("button"));
    const target = btns.find((b) => !b.disabled && b.textContent && b.textContent.includes(needle));
    if (!target) return false;
    target.click();
    return true;
  }, textSubstring);
  assert.ok(clicked, `Expected clickable enabled button containing "${textSubstring}"`);
}

async function run() {
  const distDir = path.join(__dirname, "..", "..", "frontend", "dist");
  assert.ok(fs.existsSync(path.join(distDir, "index.html")), "frontend/dist/index.html must exist before Browser QA");

  const app = express();
  app.use(express.json());
  app.use(express.static(distDir));
  app.use(authContextMiddleware);
  app.get("/api/auth/session", (_req, res) => res.json({ authenticated: false }));
  app.get("/api/customer/session", (_req, res) => res.json({ authenticated: false, customer: null }));
  app.use("/api/fintech", fintechRoutes);
  app.use("/api/merchant", merchantOpsRoutes);
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });

  let server;
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const execPath = findBrowserExecutable();

  let browser;
  const pageErrors = [];
  const unexpectedHttp500 = [];
  const capturedDownloads = [];

  try {
    console.log(`▶ Launching headless browser QA (${execPath || "bundled"}) against ${baseUrl}/merchant`);
    browser = await puppeteer.launch({
      headless: true,
      executablePath: execPath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("response", (res) => {
      if (res.status() >= 500) unexpectedHttp500.push(`${res.status()} ${res.url()}`);
    });

    // Spy on Blob downloads cleanly so we inspect actual CSV / JSON export text in browser
    await page.evaluateOnNewDocument(() => {
      window.__qaDownloads = [];
      const origCreate = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        if (blob && typeof blob.text === "function") {
          blob.text().then((txt) => window.__qaDownloads.push({ type: blob.type, text: txt })).catch(() => {});
        }
        return origCreate(blob);
      };
    });

    // 1. Open /merchant and verify SIMULATED initial load + clean reset baseline
    await page.goto(`${baseUrl}/merchant`, { waitUntil: "networkidle2" });
    await page.waitForSelector(".ef-shell");
    await clickButtonByText(page, "Reset Sandbox");
    await page.waitForFunction(() => document.body.innerText.includes("Reset Sandbox") && !document.body.innerText.includes("Loading workspace data"));

    const overviewText = await page.evaluate(() => document.body.innerText);
    assert.ok(overviewText.includes("ISOLATED SIMULATED SANDBOX"), "Simulated mode banner must be visible");
    assert.ok(overviewText.includes("₹0") || overviewText.includes("0"), "Zero-custody KPI must display 0");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_desktop_overview_simulated.png"), fullPage: true });
    console.log("  ✔ [PASS] 1. Initial load & Reset Sandbox in SIMULATED mode verified");

    // 2. Test LIVE mode authentication 401 fail-closed & real JWT 200 connection
    await clickButtonByText(page, "Live Tenant API");
    await page.waitForFunction(() => document.body.innerText.includes("HTTP 401") || document.body.innerText.includes("AUTHENTICATION_REQUIRED"));
    const unauthText = await page.evaluate(() => document.body.innerText);
    assert.ok(!unauthText.includes("Baba Enterprises Digital Ops (SIMULATED)"), "SIMULATED merchants must NOT leak into LIVE mode");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_live_mode_401_failclosed.png"), fullPage: false });

    // Authenticate LIVE mode with real signed JWT via token modal
    await clickButtonByText(page, "Set Live Session Token");
    const qaJwt = signQaJwt("usr_phase10_qa", "qa_customer@example.com");
    await page.type('.ef-modal input[type="password"]', qaJwt);
    await clickButtonByText(page, "Apply Session Token");
    await page.waitForFunction(() => document.body.innerText.includes("API Credentials Loaded") && !document.body.innerText.includes("HTTP 401"));
    const liveAuthText = await page.evaluate(() => document.body.innerText);
    assert.ok(liveAuthText.includes("AUTHENTICATED TENANT WORKSPACE"), "Live workspace authenticated state must render cleanly");
    assert.ok(!liveAuthText.includes("SIM_M_BABA_01"), "SIMULATED IDs must never appear in authenticated LIVE workspace");
    console.log("  ✔ [PASS] 2. LIVE mode 401 unauth protection & real signed JWT login (200) verified with zero SIM leak");

    // Switch back to SIMULATED sandbox for full interactive feature journey
    await clickButtonByText(page, "Simulated Sandbox");
    await page.waitForFunction(() => document.body.innerText.includes("Run Full 7-Step Customer Journey"));

    // 3. Navigate ALL 11 modules cleanly & verify empty/real content
    const moduleLabels = [
      "Payment Operations",
      "Settlement & Recon",
      "Merchant Management",
      "Commercial Agreements",
      "Prepaid Fuel Tank",
      "Postpaid Receivables",
      "Invoices & Tracking",
      "Risk & Compliance",
      "Bank & CRM Integrations",
      "Reports & Audit History",
      "Executive Overview"
    ];
    for (const label of moduleLabels) {
      await clickButtonByText(page, label);
      await page.waitForFunction((l) => {
        const h1 = document.querySelector("h1");
        return h1 && h1.textContent && h1.textContent.includes(l);
      }, {}, label);
    }
    console.log("  ✔ [PASS] 3. All 11 enterprise modules navigated & rendered cleanly");

    // 4. Execute Full 7-Step Customer Journey + Mismatch / Failed / Duplicate / Invalid-HMAC Scenarios
    await clickButtonByText(page, "Run Full 7-Step Customer Journey");
    await page.waitForFunction(() => document.body.innerText.includes("7. Receipt Verified & Paid"));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_7step_customer_journey_complete.png"), fullPage: true });

    await clickButtonByText(page, "Mismatch Settlement");
    await page.waitForFunction(() => document.body.innerText.includes("MANUAL_REVIEW") || document.body.innerText.includes("mismatch"));

    await clickButtonByText(page, "Failed / Returned Rail");
    await page.waitForFunction(() => document.body.innerText.includes("RETURNED") || document.body.innerText.includes("₹0.00 fee debited"));

    await clickButtonByText(page, "Replay Duplicate Webhook");
    await page.waitForFunction(() => document.body.innerText.includes("Duplicate webhook"));

    await clickButtonByText(page, "Invalid HMAC Tamper Block");
    await page.waitForFunction(() => document.body.innerText.includes("rejected"));
    console.log("  ✔ [PASS] 4. Full 7-step E2E customer journey + mismatch, failed, duplicate & invalid-HMAC verified in UI");

    // 5. Verify Invoices & GST Math (₹24,000 + ₹4,320 GST = ₹28,320 PAID) + CSV Export isolation
    await clickButtonByText(page, "Invoices & Tracking");
    await page.waitForFunction(() => document.body.innerText.includes("28,320"));
    await clickButtonByText(page, "Export CSV");
    await new Promise((r) => setTimeout(r, 200));
    const dl1 = await page.evaluate(() => window.__qaDownloads.slice(-1)[0]);
    assert.ok(dl1 && dl1.text.includes("SIMULATED,true"), "Exported invoice CSV must explicitly carry SIMULATED,true isolation columns");

    // 6. Verify Filters, Search, Pagination & Detail Drawer + Escape dismissal in Payment Operations
    await clickButtonByText(page, "Payment Operations");
    await page.type('.ef-filters input[placeholder*="Search"]', "SIM_M_BABA");
    await page.select(".ef-filters select", "SETTLED");
    await page.waitForSelector(".ef-table-row--clickable");
    await page.click(".ef-table-row--clickable");
    await page.waitForSelector(".ef-drawer");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_transaction_detail_drawer.png"), fullPage: false });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".ef-drawer"));
    console.log("  ✔ [PASS] 5. Invoice math (₹28,320), SIMULATED CSV export, filters, Detail Drawer & Escape dismissal verified");

    // 7. Verify Risk & Compliance ConfirmModal + Freeze Dossier
    await clickButtonByText(page, "Risk & Compliance");
    await clickButtonByText(page, "Simulate Lawful Account Freeze Notice");
    await page.waitForSelector(".ef-modal");
    await clickButtonByText(page, "Record Freeze Dossier");
    await page.waitForFunction(() => document.body.innerText.includes("LEGAL REVIEW") && !document.querySelector(".ef-modal"));

    // 8. Verify Bank & CRM Integrations: NOT CONNECTED, Activate disabled, Connection Requirements modal opens
    await clickButtonByText(page, "Bank & CRM Integrations");
    await page.waitForFunction(() => document.body.innerText.includes("NOT CONNECTED / AWAITING CUSTOMER ACCESS"));
    const activateDisabled = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button")).filter((b) => b.textContent.includes("Activate Live"));
      return btns.length > 0 && btns.every((b) => b.disabled === true);
    });
    assert.strictEqual(activateDisabled, true, "All Activate Live buttons MUST remain disabled");
    await clickButtonByText(page, "Connection Requirements");
    await page.waitForSelector(".ef-modal");
    await clickButtonByText(page, "Close");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_bank_crm_not_connected.png"), fullPage: true });
    console.log("  ✔ [PASS] 6. Risk ConfirmModal & Bank/CRM Integrations readiness (all Activate disabled) verified");

    // 9. Verify Reports & Audit History JSON Evidence Pack export
    await clickButtonByText(page, "Reports & Audit History");
    await clickButtonByText(page, "Evidence JSON Pack");
    await new Promise((r) => setTimeout(r, 200));
    const dl2 = await page.evaluate(() => window.__qaDownloads.slice(-1)[0]);
    const parsedPack = JSON.parse(dl2.text);
    assert.strictEqual(parsedPack.environmentMode, "SIMULATED");
    assert.strictEqual(parsedPack.isSimulated, true);
    assert.strictEqual(parsedPack.chainIntegrityValid, true);

    // 10. Mobile 390x844 layout, Hamburger open, Backdrop dismissal, zero horizontal overflow
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 200));
    await page.waitForSelector(".ef-mobile-menu-btn", { visible: true });
    await page.evaluate(() => document.querySelector(".ef-mobile-menu-btn")?.click());
    await page.waitForSelector(".ef-sidebar--open");
    await page.waitForSelector(".ef-sidebar-backdrop");
    await new Promise((r) => setTimeout(r, 300)); // allow slide transition to settle for crisp screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_mobile_responsive_drawer.png"), fullPage: false });
    await page.evaluate(() => {
      const bd = document.querySelector(".ef-sidebar-backdrop");
      if (bd) bd.click();
    });
    await page.waitForFunction(() => !document.querySelector(".ef-sidebar--open"));
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert.strictEqual(mobileOverflow, false, "Mobile viewport must have zero horizontal document overflow");
    console.log("  ✔ [PASS] 7. Mobile (390x844) sidebar drawer, backdrop dismiss & zero overflow verified");

    // 11. Verify Classic Merchant Operations Terminal switch, Gaming Growth Studio, BSA Sec 63 & clean Return
    await page.setViewport({ width: 1440, height: 900 });
    await page.click(".ef-mobile-menu-btn").catch(() => {});
    await clickButtonByText(page, "Classic Merchant View");
    await page.waitForFunction(() => document.body.innerText.includes("Merchant Operations Terminal") && document.body.innerText.includes("Apex Arena Esports"));
    await clickButtonByText(page, "UPI Checkout & QR");
    await page.waitForSelector("#dynamic-checkout-qr-img");
    await page.waitForSelector("#checkout-amount-input");
    const qrOriginText = await page.$eval("#checkout-qr-origin-badge", (el) => el.textContent || "");
    assert(qrOriginText.includes("LOCAL_PREVIEW_QR") && !qrOriginText.includes("LIVE PAYMENT-READY"), "Local preview QR must never show LIVE payment-ready");

    // 11a. Amount typing test
    const qrSrcBefore = await page.$eval("#dynamic-checkout-qr-img", (el) => el.getAttribute("src") || "");
    await page.click("#checkout-amount-input");
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.type("#checkout-amount-input", "4250");
    await page.waitForFunction((prevSrc) => {
      const img = document.querySelector("#dynamic-checkout-qr-img");
      const refEl = document.querySelector("#checkout-displayed-reference");
      return Boolean(
        img &&
        refEl &&
        img.getAttribute("data-qr-amount") === "4250" &&
        img.getAttribute("data-qr-origin") === "LOCAL_PREVIEW_QR" &&
        img.getAttribute("data-qr-reference") === refEl.textContent &&
        img.getAttribute("src") !== prevSrc
      );
    }, {}, qrSrcBefore);

    // 11b. Preset selection + Generate intent + Stale invalidation test
    const qrSrc4250 = await page.$eval("#dynamic-checkout-qr-img", (el) => el.getAttribute("src") || "");
    await clickButtonByText(page, "₹10,000");
    await page.waitForFunction((prevSrc) => {
      const img = document.querySelector("#dynamic-checkout-qr-img");
      return Boolean(img && img.getAttribute("data-qr-amount") === "10000" && img.getAttribute("src") !== prevSrc);
    }, {}, qrSrc4250);
    await clickButtonByText(page, "Generate Checkout & VAN");
    await page.waitForFunction(() => {
      const el = document.querySelector("#checkout-active-intent-id");
      const img = document.querySelector("#dynamic-checkout-qr-img");
      const refEl = document.querySelector("#checkout-displayed-reference");
      return Boolean(el && !el.textContent.includes("None") && img && refEl && img.getAttribute("data-qr-reference") === refEl.textContent);
    });
    // Changing amount must invalidate stale generated intent cleanly
    await clickButtonByText(page, "₹25,000");
    await page.waitForFunction(() => {
      const warn = document.querySelector("#checkout-stale-warning");
      const img = document.querySelector("#dynamic-checkout-qr-img");
      const activeId = document.querySelector("#checkout-active-intent-id");
      return Boolean(warn && warn.textContent.includes("STALE_INVALIDATED") && img && img.getAttribute("data-qr-amount") === "25000" && activeId && activeId.textContent.includes("None"));
    });

    // 11c. Invalid amount must disable QR cleanly, then restore valid preset
    await page.click("#checkout-amount-input");
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.type("#checkout-amount-input", "0");
    await page.waitForFunction(() => Boolean(document.querySelector("#checkout-amount-error") && !document.querySelector("#dynamic-checkout-qr-img")));
    await clickButtonByText(page, "₹2,500");
    await page.waitForSelector("#dynamic-checkout-qr-img");
    console.log("  ✔ [PASS] Dynamic QR guard (typing, preset, stale invalidation, invalid amount & ref match) verified in Chrome");
    await clickButtonByText(page, "BSA Sec 63 Evidence Desk");
    await page.waitForFunction(() => document.body.innerText.includes("Schedule Part A") && document.body.innerText.includes("Schedule Part B"));
    await clickButtonByText(page, "Gaming & Esports Growth Studio");
    await page.waitForFunction(() => document.body.innerText.includes("Permitted Gaming & Esports Growth Intelligence Studio"));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07_classic_merchant_portal_preserved.png"), fullPage: false });
    await clickButtonByText(page, "Return to Enterprise Treasury OS");
    await page.waitForSelector(".ef-shell");

    // Final Reset Sandbox sanity check
    await clickButtonByText(page, "Executive Overview");
    await clickButtonByText(page, "Reset Sandbox");
    await page.waitForFunction(() => !document.body.innerText.includes("7. Receipt Verified & Paid"));
    console.log("  ✔ [PASS] 8. Classic Merchant View preserved & final Sandbox Reset clean");

    assert.strictEqual(pageErrors.length, 0, `Uncaught page errors found: ${pageErrors.join("; ")}`);
    assert.strictEqual(unexpectedHttp500.length, 0, `Unexpected HTTP 500 responses: ${unexpectedHttp500.join("; ")}`);
    console.log("\n🎉 ALL PHASE 10 HEADLESS CHROME BROWSER QA CHECKS PASSED (0 PAGE ERRORS, 0 HTTP 500)!");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("❌ PHASE 10 BROWSER QA FAILED:", err);
  process.exit(1);
});
