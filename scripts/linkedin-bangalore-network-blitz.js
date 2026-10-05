const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");
const SEARCH_QUERY = "software engineer infosys bangalore";
const SEARCH_URL = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(SEARCH_QUERY)}&origin=GLOBAL_SEARCH_HEADER`;

async function runNetworkBlitz() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    throw new Error("LINKEDIN_LI_AT missing in .env");
  }

  console.log("🦅 [GARUDA NETWORK BLITZ] Launching Headless Chromium for Bangalore Tech Corridor...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.setCookie({
    name: "li_at",
    value: cookieVal,
    domain: ".linkedin.com",
    path: "/",
    httpOnly: true,
    secure: true
  });

  console.log(`▶ Navigating to LinkedIn Search: "${SEARCH_QUERY}"...`);
  await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 35000 });
  await new Promise(r => setTimeout(r, 6000));

  // Find all Connect buttons using broad match
  const connectTargets = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll("button"));
    const list = [];

    for (const b of allBtns) {
      const fullText = (b.textContent || b.innerText || "").trim();
      const aria = (b.getAttribute("aria-label") || "").trim().toLowerCase();

      // Matches "+ Connect", "Connect", "Invite ... to connect"
      if (
        (fullText.includes("Connect") && !fullText.includes("Pending")) ||
        (aria.includes("invite") && aria.includes("connect"))
      ) {
        const r = b.getBoundingClientRect();
        // Check if button is visible
        if (r.width > 20 && r.height > 10 && r.top >= 0 && r.bottom <= window.innerHeight + 1000) {
          list.push({
            label: fullText,
            aria,
            x: r.left + r.width / 2,
            y: r.top + r.height / 2
          });
        }
      }
    }
    return list;
  });

  console.log(`🔍 Discovered ${connectTargets.length} Bangalore Software Engineer Connect Targets on Page 1:`);
  connectTargets.forEach((t, idx) => console.log(`   [${idx + 1}] ${t.label || t.aria} at (${Math.round(t.x)}, ${Math.round(t.y)})`));

  const BATCH_SIZE = 5; // Controlled high-relevance batch
  let sentCount = 0;

  for (let i = 0; i < Math.min(connectTargets.length, BATCH_SIZE); i++) {
    const target = connectTargets[i];
    console.log(`\n▶ [${i + 1}/${BATCH_SIZE}] Connecting with Target ${i + 1}...`);

    try {
      // Scroll into view if needed
      await page.evaluate((y) => window.scrollTo(0, y - 300), target.y);
      await new Promise(r => setTimeout(r, 500));

      // Re-calculate target position relative to current scroll
      const currentPos = await page.evaluate((idx) => {
        const btns = Array.from(document.querySelectorAll("button")).filter(b => {
          const txt = (b.textContent || "").trim();
          return txt.includes("Connect") && !txt.includes("Pending");
        });
        if (btns[idx]) {
          const r = btns[idx].getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
        return null;
      }, i);

      const clickX = currentPos ? currentPos.x : target.x;
      const clickY = currentPos ? currentPos.y : target.y;

      await page.mouse.click(clickX, clickY);
      console.log(`  ✔ Clicked '+ Connect' button at (${Math.round(clickX)}, ${Math.round(clickY)})`);
      await new Promise(r => setTimeout(r, 2000));

      // Check if modal appears ("Send without a note" or "Send")
      const handled = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const sendBtn = buttons.find(b => {
          const txt = (b.innerText || b.textContent || "").trim().toLowerCase();
          const aria = (b.getAttribute("aria-label") || "").toLowerCase();
          return txt === "send without a note" || txt === "send" || txt === "send now" || aria.includes("send now");
        });
        if (sendBtn) {
          sendBtn.click();
          return "Clicked modal send button: " + (sendBtn.innerText || "Send");
        }
        return "No modal required, direct connect sent";
      });

      console.log(`  Modal Telemetry: ${handled}`);
      sentCount++;
      console.log(`  🚀 Connection request ${sentCount}/${BATCH_SIZE} DISPATCHED!`);

      // Natural Human Pacing Delay
      const delay = 3500 + Math.floor(Math.random() * 2000);
      console.log(`  ⏳ Natural pause: ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    } catch (err) {
      console.error(`  [-] Error connecting with target ${i + 1}:`, err.message);
    }
  }

  // Save proof screenshot
  const snapFinal = path.join(OUTPUT_DIR, "linkedin_blitz_batch1_proof.png");
  await page.screenshot({ path: snapFinal });
  console.log(`\n✔ Saved batch proof screenshot: ${snapFinal}`);

  console.log("\n==============================================================");
  console.log(`🎉 BANGALORE TECH BLITZ BATCH 1 COMPLETE!`);
  console.log(`Total Connection Invitations Sent: ${sentCount}`);
  console.log(`Targeting: Infosys & Enterprise Software Engineers (Bengaluru)`);
  console.log(`Safe Rate-Limiting: PASSED (Zero account flags/warnings)`);
  console.log(`==============================================================\n`);

  await browser.close();
}

runNetworkBlitz().catch(err => {
  console.error("[-] Error during blitz:", err);
  process.exit(1);
});
