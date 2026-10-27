import express from "express";
import path from "path";
import puppeteer from "puppeteer";
import fs from "fs";

async function verifyVyaparDemo() {
  console.log("=== STARTING VYAPAR OS FORENSIC HEADLESS VERIFICATION ===");
  
  // 1. Setup static server on port 4179
  const app = express();
  const distDir = path.resolve("frontend/dist");
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });

  const server = app.listen(4179, () => {
    console.log("✓ Headless test server listening at http://localhost:4179");
  });

  const screenshotsDir = path.resolve("output/vyapar_screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", err => errors.push(err.message));

    // A. Executive Command Center
    console.log("Testing Screen 1: Executive Command Center (/vyapar-os)...");
    await page.goto("http://localhost:4179/vyapar-os", { waitUntil: "networkidle0" });
    await page.screenshot({ path: path.join(screenshotsDir, "01_executive_command_center.png"), fullPage: false });
    console.log("✓ Captured 01_executive_command_center.png");

    // B. Switch to Maha-Rokad Vault
    console.log("Testing Screen 2: Maha-Rokad Master Vault...");
    const mahaTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.find(b => b.textContent.includes("Maha-Rokad Vault"));
    });
    if (mahaTab) {
      await mahaTab.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(screenshotsDir, "02_maharokad_vault.png"), fullPage: false });
      console.log("✓ Captured 02_maharokad_vault.png");
    }

    // C. Switch to Milk OS
    console.log("Testing Screen 3: Milk Distribution OS (100 Staff)...");
    const milkTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.find(b => b.textContent.includes("Milk OS"));
    });
    if (milkTab) {
      await milkTab.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(screenshotsDir, "03_milk_distribution_100_workers.png"), fullPage: false });
      console.log("✓ Captured 03_milk_distribution_100_workers.png");
    }

    // D. Switch to Agent PWA
    console.log("Testing Screen 4: Agent Field Collections & Mobile PWA...");
    const agentTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.find(b => b.textContent.includes("Agent PWA"));
    });
    if (agentTab) {
      await agentTab.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(screenshotsDir, "04_agent_pwa_and_float.png"), fullPage: false });
      console.log("✓ Captured 04_agent_pwa_and_float.png");
    }

    // E. Switch to Parda Boli
    console.log("Testing Screen 5: Parda Boli Anonymous Auction...");
    const pardaTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.find(b => b.textContent.includes("Parda Boli"));
    });
    if (pardaTab) {
      await pardaTab.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(screenshotsDir, "05_parda_boli_auction.png"), fullPage: false });
      console.log("✓ Captured 05_parda_boli_auction.png");
    }

    // F. Switch to Public Hotel Sites
    console.log("Testing Screen 6: Public Hotel Showcase...");
    const hotelShowcaseTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.find(b => b.textContent.includes("Public Hotel Sites"));
    });
    if (hotelShowcaseTab) {
      await hotelShowcaseTab.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(screenshotsDir, "06_hotel_public_showcase.png"), fullPage: false });
      console.log("✓ Captured 06_hotel_public_showcase.png");
    }

    console.log("=== HEADLESS VERIFICATION SUMMARY ===");
    console.log(`Total Console / Page Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error("Errors encountered:", errors);
    } else {
      console.log("✓ ZERO CONSOLE ERRORS. 100% CLEAN RUN.");
    }

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log("✓ Test server closed.");
  }
}

verifyVyaparDemo();
