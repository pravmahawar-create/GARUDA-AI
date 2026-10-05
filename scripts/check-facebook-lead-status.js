const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function checkFacebookStatus() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) {
    throw new Error("FB_C_USER or FB_XS missing in .env");
  }

  console.log("🦅 [GARUDA FB CHECKER] Launching browser to check Facebook leads, notifications & DMs...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  const report = {
    timestamp: new Date().toISOString(),
    notifications: [],
    messages: [],
    ghlGroupStatus: {},
    huntPostStatus: {}
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    await page.setCookie(
      { name: "c_user", value: cUser.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: xs.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    // ==========================================
    // 1. CHECK NOTIFICATIONS
    // ==========================================
    console.log("▶ [1/4] Checking Facebook Notifications...");
    await page.goto("https://www.facebook.com/notifications", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    const notifScreenshot = path.join(OUTPUT_DIR, "fb_status_notifications.png");
    await page.screenshot({ path: notifScreenshot, fullPage: false });
    console.log(`✔ Notifications screenshot: ${notifScreenshot}`);

    const notifItems = await page.evaluate(() => {
      const items = [];
      const notifElements = document.querySelectorAll("div[role='feed'] div[role='article'], div[role='main'] a, div[data-visualcompletion='ignore-dynamic-snippet']");
      const seen = new Set();
      for (const el of notifElements) {
        const text = (el.innerText || "").trim().replace(/\n+/g, " ");
        if (text.length > 15 && text.length < 300 && !seen.has(text)) {
          seen.add(text);
          items.push(text);
        }
      }
      return items.slice(0, 10);
    });
    report.notifications = notifItems;
    console.log(`Found ${notifItems.length} notifications:`, notifItems);

    // ==========================================
    // 2. CHECK MESSENGER / INBOX
    // ==========================================
    console.log("▶ [2/4] Checking Facebook Messenger Inbox...");
    await page.goto("https://www.facebook.com/messages/t/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    const msgScreenshot = path.join(OUTPUT_DIR, "fb_status_messages.png");
    await page.screenshot({ path: msgScreenshot, fullPage: false });
    console.log(`✔ Messenger screenshot: ${msgScreenshot}`);

    const msgThreads = await page.evaluate(() => {
      const threads = [];
      const threadElements = document.querySelectorAll("div[role='grid'] div[role='row'], div[role='navigation'] a, div[aria-label*='Chats'] div[role='listitem']");
      const seen = new Set();
      for (const el of threadElements) {
        const text = (el.innerText || "").trim().replace(/\n+/g, " ");
        if (text.length > 5 && text.length < 250 && !seen.has(text)) {
          seen.add(text);
          threads.push(text);
        }
      }
      return threads.slice(0, 10);
    });
    report.messages = msgThreads;
    console.log(`Found ${msgThreads.length} messenger threads:`, msgThreads);

    // ==========================================
    // 3. CHECK GHL GROUP COMMENT
    // ==========================================
    console.log("▶ [3/4] Checking GHL Group Trojan comment...");
    const ghlUrl = "https://www.facebook.com/groups/1844616979220134/";
    await page.goto(ghlUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));
    await page.evaluate(() => window.scrollBy(0, 400));
    await new Promise(r => setTimeout(r, 3000));

    const ghlScreenshot = path.join(OUTPUT_DIR, "fb_status_ghl_group.png");
    await page.screenshot({ path: ghlScreenshot, fullPage: false });
    console.log(`✔ GHL group screenshot: ${ghlScreenshot}`);

    const ghlDetails = await page.evaluate(() => {
      const body = document.body.innerText || "";
      const hasOutboundComment = body.includes("Outbound Voice AI inside GHL") || body.includes("Sub-second response latency");
      return {
        foundOurComment: hasOutboundComment,
        pageSnippet: body.slice(0, 500).replace(/\n+/g, " ")
      };
    });
    report.ghlGroupStatus = ghlDetails;

    // ==========================================
    // 4. CHECK SEARCH POSTS (Courtney / Nyambe)
    // ==========================================
    console.log("▶ [4/4] Checking Search Feed for hunted leads (Courtney / Nyambe)...");
    const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent("looking for a web developer")}&filters=eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9In0%3D`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));
    await page.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 3000));

    const searchScreenshot = path.join(OUTPUT_DIR, "fb_status_search_leads.png");
    await page.screenshot({ path: searchScreenshot, fullPage: false });
    console.log(`✔ Search leads screenshot: ${searchScreenshot}`);

    const searchDetails = await page.evaluate(() => {
      const body = document.body.innerText || "";
      const hasGarudaPitch = body.includes("Hey Courtney") || body.includes("24 to 48 hours flat") || body.includes("garudaos.in");
      const hasNyambe = body.includes("Nyambe Nichole") || body.includes("chatbrina");
      return {
        foundOurPitch: hasGarudaPitch,
        foundNyambePost: hasNyambe,
        snippet: body.slice(0, 600).replace(/\n+/g, " ")
      };
    });
    report.huntPostStatus = searchDetails;

    const reportPath = path.join(OUTPUT_DIR, "fb_lead_status_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`✔ Report saved: ${reportPath}`);

  } finally {
    await browser.close();
  }

  return report;
}

checkFacebookStatus()
  .then(res => {
    console.log("\n==========================================");
    console.log("🦅 FACEBOOK STATUS AUDIT COMPLETE");
    console.log("==========================================");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Facebook Checker Error:", err);
    process.exit(1);
  });
