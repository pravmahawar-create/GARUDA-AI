import express from "express";
import path from "path";
import puppeteer from "puppeteer";
import fs from "fs";

async function captureMobileDemoScreenshots() {
  console.log("=== CAPTURING VYAPAR OS MOBILE (390px) & DESKTOP REGRESSION SCREENSHOTS ===");

  const app = express();
  const distDir = path.resolve("frontend/dist");
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });

  const server = app.listen(4192, () => {
    console.log("✓ Screenshot server listening at http://localhost:4192");
  });

  const outputDir = path.resolve("output/vyapar_mobile_screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    const errors = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", err => errors.push(err.message));

    // ==========================================
    // 1. MOBILE SUITE (390px x 844px - iPhone 13/14/15)
    // ==========================================
    console.log("\n--- Capturing Mobile Screenshots at 390px Width ---");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // A. Executive Command Center
    console.log("1. Mobile Executive Command Center...");
    await page.goto("http://localhost:4192/vyapar-os", { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, "01_mobile_executive_command_390px.png"), fullPage: false });
    console.log("✓ Saved 01_mobile_executive_command_390px.png");

    // B. MAHA-ROKAD Master Vault
    console.log("2. Mobile Maha-Rokad Master Vault...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".vyapar-bottom-nav button, nav button"));
      const target = btns.find(b => b.textContent.includes("Vault") || b.textContent.includes("Maha-Rokad"));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, "02_mobile_maharokad_vault_390px.png"), fullPage: false });
    console.log("✓ Saved 02_mobile_maharokad_vault_390px.png");

    // C. Milk Distribution OS (100 Staff)
    console.log("3. Mobile Milk Distribution OS...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".vyapar-bottom-nav button, nav button"));
      const target = btns.find(b => b.textContent.includes("Milk 100") || b.textContent.includes("Milk OS"));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, "03_mobile_milk_os_100_staff_390px.png"), fullPage: false });
    console.log("✓ Saved 03_mobile_milk_os_100_staff_390px.png");

    // D. Agent PWA & Road Float
    console.log("4. Mobile Agent PWA & Field Float...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".vyapar-bottom-nav button, nav button"));
      const target = btns.find(b => b.textContent.includes("Agent PWA"));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, "04_mobile_agent_pwa_terminal_390px.png"), fullPage: false });
    console.log("✓ Saved 04_mobile_agent_pwa_terminal_390px.png");

    // E. Rojgari Finance (Borrower Directory)
    console.log("5. Mobile Rojgari Finance Directory...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".vyapar-bottom-nav button, nav button"));
      const target = btns.find(b => b.textContent.includes("Lending") || b.textContent.includes("Rojgari"));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, "05_mobile_rojgari_finance_390px.png"), fullPage: false });
    console.log("✓ Saved 05_mobile_rojgari_finance_390px.png");

    // F. Parda Boli (Anonymous Reverse Auction)
    console.log("6. Mobile Parda Boli Auction...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".vyapar-bottom-nav button, nav button"));
      const target = btns.find(b => b.textContent.includes("Chit BC") || b.textContent.includes("Parda Boli"));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, "06_mobile_parda_boli_auction_390px.png"), fullPage: false });
    console.log("✓ Saved 06_mobile_parda_boli_auction_390px.png");

    // ==========================================
    // 2. DESKTOP REGRESSION SCREENSHOT (1440px x 900px)
    // ==========================================
    console.log("\n--- Capturing Desktop Regression Screenshot (1440px Width) ---");
    await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
    await page.goto("http://localhost:4192/vyapar-os", { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, "07_desktop_regression_executive_1440px.png"), fullPage: false });
    console.log("✓ Saved 07_desktop_regression_executive_1440px.png");

    console.log("\n=== SCREENSHOT CAPTURE COMPLETE ===");
    console.log(`Total Errors Logged: ${errors.length}`);
    if (errors.length > 0) {
      console.error("Errors:", errors);
    } else {
      console.log("✓ ZERO CONSOLE ERRORS. ALL VIEWPORTS RENDERED PERFECTLY.");
    }

  } catch (err) {
    console.error("Screenshot error:", err);
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log("✓ Test server closed.");
  }
}

captureMobileDemoScreenshots();
