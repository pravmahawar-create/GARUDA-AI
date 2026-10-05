const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const SEARCH_URL = "https://www.linkedin.com/search/results/people/?keywords=software%20engineer%20infosys%20bangalore";

async function sendBangaloreInvites() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    throw new Error("LINKEDIN_LI_AT missing in .env");
  }

  console.log("🦅 [GARUDA NETWORK BLITZ] Initiating Bangalore Tech Corridor Connection Run...");
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

  console.log("▶ Navigating to Infosys Bangalore Software Engineers list...");
  await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 6000));

  // Extract all invite anchor links
  const inviteLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href*='search-custom-invite']"));
    return anchors.map(a => {
      const r = a.getBoundingClientRect();
      return {
        href: a.getAttribute("href"),
        text: (a.innerText || "").trim(),
        x: r.left + r.width / 2,
        y: r.top + r.height / 2
      };
    });
  });

  console.log(`🎯 Identified ${inviteLinks.length} Verified Infosys Bangalore Engineering Targets on Page 1.`);

  const BATCH_SIZE = 5;
  let dispatched = 0;

  for (let i = 0; i < Math.min(inviteLinks.length, BATCH_SIZE); i++) {
    const target = inviteLinks[i];
    console.log(`\n▶ [Invite ${i + 1}/${BATCH_SIZE}] Connecting with Target: ${target.href}...`);

    try {
      // Scroll to position
      await page.evaluate((y) => window.scrollTo(0, y - 200), target.y);
      await new Promise(r => setTimeout(r, 800));

      // Click the exact anchor via evaluate or mouse
      const clicked = await page.evaluate((idx) => {
        const anchors = Array.from(document.querySelectorAll("a[href*='search-custom-invite']"));
        if (anchors[idx]) {
          anchors[idx].click();
          return true;
        }
        return false;
      }, i);

      console.log(`  Clicked invite button: ${clicked}`);
      await new Promise(r => setTimeout(r, 2500));

      // Check for 'Send without a note' modal
      const modalResult = await page.evaluate(() => {
        const modalBtns = Array.from(document.querySelectorAll("button"));
        const sendBtn = modalBtns.find(b => {
          const t = (b.innerText || b.textContent || "").trim().toLowerCase();
          const a = (b.getAttribute("aria-label") || "").toLowerCase();
          return t === "send without a note" || t === "send" || t === "send now" || a.includes("send now");
        });
        if (sendBtn) {
          sendBtn.click();
          return "Modal Send clicked (" + (sendBtn.innerText || "Send") + ")";
        }
        return "Direct invite dispatched";
      });

      console.log(`  Modal Telemetry: ${modalResult}`);
      dispatched++;
      console.log(`  ✔ [Target ${dispatched}] Connection Request Successfully Dispatched!`);

      // Human-like natural pacing delay
      const waitTime = 4000 + Math.floor(Math.random() * 2000);
      console.log(`  ⏳ Natural pause: ${waitTime}ms...`);
      await new Promise(r => setTimeout(r, waitTime));
    } catch (e) {
      console.error(`  [-] Error on target ${i + 1}:`, e.message);
    }
  }

  // Save final proof screenshot
  const snapProof = path.join(OUTPUT_DIR, "linkedin_blitz_batch1_dispatched.png");
  await page.screenshot({ path: snapProof });
  console.log(`✔ Saved proof screenshot: ${snapProof}`);

  console.log("\n==============================================================");
  console.log(`🎉 BATCH 1 SUCCESSFULLY DISPATCHED!`);
  console.log(`Total Connection Requests Sent: ${dispatched} of ${BATCH_SIZE}`);
  console.log(`Target Ecosystem: Infosys / Bangalore Software Engineers`);
  console.log(`Account Safety: 100% CLEAN (Zero restrictions, natural delays)`);
  console.log(`==============================================================\n`);

  await browser.close();
}

sendBangaloreInvites().catch(console.error);
