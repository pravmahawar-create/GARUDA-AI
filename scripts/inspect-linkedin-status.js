const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function checkLinkedInStatus() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 [GARUDA LINKEDIN STATUS RADAR] Checking profile activity & notifications...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({
    name: "li_at",
    value: cookieVal,
    domain: ".linkedin.com",
    path: "/"
  });

  // 1. Check Notifications Page
  console.log("▶ Navigating to LinkedIn Notifications...");
  await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 35000 });
  await new Promise(r => setTimeout(r, 4500));

  const notifProof = path.join(OUTPUT_DIR, "linkedin_notifications_radar.png");
  await page.screenshot({ path: notifProof });
  console.log("✔ Notifications screenshot saved:", notifProof);

  // Extract top 5 notification texts
  const notifs = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".nt-card, [data-ch]"));
    return cards.slice(0, 6).map(c => (c.innerText || "").replace(/\n+/g, " | ").trim());
  });

  console.log("\n--- Top Notifications ---");
  notifs.forEach((n, i) => console.log(`[${i+1}] ${n.slice(0, 140)}`));

  // 2. Check Recent Activity
  console.log("\n▶ Checking Recent Profile Activity...");
  await page.goto("https://www.linkedin.com/in/me/recent-activity/all/", { waitUntil: "domcontentloaded", timeout: 35000 });
  await new Promise(r => setTimeout(r, 4500));

  const activityProof = path.join(OUTPUT_DIR, "linkedin_recent_activity_proof.png");
  await page.screenshot({ path: activityProof });
  console.log("✔ Activity screenshot saved:", activityProof);

  await browser.close();
  console.log("\n✔ LinkedIn status check complete.");
}

checkLinkedInStatus().catch(err => {
  console.error("❌ Error checking LinkedIn status:", err.message);
  process.exit(1);
});
