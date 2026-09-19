/**
 * 🦅 GARUDA SOVEREIGN INSTAGRAM DM DISPATCHER
 * Autonomously dispatches personalized "Show > Tell" pitches to qualified business profiles
 * via official handle @garudaos.ai using verified session authentication.
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
require("dotenv").config();

const telegram = require("../../src/services/telegramBotService");
const QUEUE_FILE = path.join(__dirname, "..", "..", "data", "outreach_dispatch_queue.json");
const DISPATCH_LOG = path.join(__dirname, "..", "..", "data", "dispatched_dms_log.json");

function getDispatchedLog() {
  if (fs.existsSync(DISPATCH_LOG)) {
    try {
      return JSON.parse(fs.readFileSync(DISPATCH_LOG, "utf8"));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveDispatchedLog(log) {
  fs.writeFileSync(DISPATCH_LOG, JSON.stringify(log, null, 2), "utf8");
}

async function sendInstagramDm(page, handle, messageText) {
  console.log(`\n▶ [INSTA DM] Navigating to profile: https://www.instagram.com/${handle}/`);
  await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 4000));

  // Check if profile exists
  const title = await page.title();
  if (title.includes("Page Not Found") || title.includes("Sorry")) {
    console.log(`❌ [INSTA DM] Profile @${handle} not found.`);
    return { ok: false, error: "profile_not_found" };
  }

  // Look for "Message" button
  console.log(`▶ Looking for 'Message' button on @${handle}...`);
  const messageBtnSelector = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
    for (const b of buttons) {
      const txt = (b.innerText || "").trim().toLowerCase();
      if (txt === "message" || txt === "send message") {
        b.click();
        return true;
      }
    }
    // Also check links with /direct/t/
    const links = Array.from(document.querySelectorAll('a[href*="/direct/t/"]'));
    if (links.length > 0) {
      links[0].click();
      return true;
    }
    return false;
  });

  if (!messageBtnSelector) {
    console.log(`⚠️ [INSTA DM] Could not locate 'Message' button for @${handle} directly.`);
    // Try navigating directly to conversation thread or direct compose
    return { ok: false, error: "no_message_button" };
  }

  console.log(`✔ Clicked 'Message' button. Waiting for chat UI hydration (6s)...`);
  await new Promise((r) => setTimeout(r, 6000));

  // If a "Turn on Notifications" modal appears, dismiss it
  await page.evaluate(() => {
    const notNowButtons = Array.from(document.querySelectorAll('button'));
    for (const b of notNowButtons) {
      if ((b.innerText || "").toLowerCase().includes("not now")) {
        b.click();
        break;
      }
    }
  });

  // Find message input (div[contenteditable="true"] or textarea or paragraph)
  console.log(`▶ Typing pitch into chat box...`);
  const inputSelector = 'div[role="textbox"][contenteditable="true"], div[aria-label*="Message"][contenteditable="true"], textarea[placeholder*="Message"]';
  
  try {
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    const messageBox = await page.$(inputSelector);
    if (!messageBox) {
      throw new Error("Message textbox element not found");
    }

    await messageBox.focus();
    await page.keyboard.type(messageText, { delay: 15 }); // Natural typing cadence
    await new Promise((r) => setTimeout(r, 1500));

    // Send via Enter key
    await page.keyboard.press("Enter");
    console.log(`🚀 [SENT] Message dispatched to @${handle}!`);
    await new Promise((r) => setTimeout(r, 3000));

    return { ok: true };
  } catch (err) {
    console.error(`❌ [INSTA DM FAILED] Could not type/send message: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

async function dispatchAllDms() {
  const sessionId = process.env.INSTAGRAM_SESSION_ID;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!sessionId || !userId) {
    console.error("❌ INSTAGRAM_SESSION_ID / USER_ID missing in .env.");
    return;
  }

  if (!fs.existsSync(QUEUE_FILE)) {
    console.error("❌ Queue file missing. Run multi-channel-dispatcher.js first.");
    return;
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  const dispatchedLog = getDispatchedLog();
  const dispatchedSet = new Set(dispatchedLog.map((d) => d.handle));

  // Find all leads with instagramHandle that haven't been dispatched yet
  const targets = queue.filter((q) => q.instagramHandle && !dispatchedSet.has(q.instagramHandle));

  console.log(`🦅 [GARUDA INSTA DISPATCHER] Found ${targets.length} pending targets with verified Instagram handles.`);

  if (targets.length === 0) {
    console.log("✔ All verified Instagram targets have already received outreach!");
    return;
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,800"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      {
        name: "sessionid",
        value: sessionId,
        domain: ".instagram.com",
        path: "/"
      },
      {
        name: "ds_user_id",
        value: userId,
        domain: ".instagram.com",
        path: "/"
      }
    );

    for (const target of targets) {
      console.log(`\n🎯 Preparing dispatch for: ${target.businessName} (@${target.instagramHandle})`);
      const result = await sendInstagramDm(page, target.instagramHandle, target.pitches.instaDm);

      dispatchedLog.push({
        businessName: target.businessName,
        handle: target.instagramHandle,
        status: result.ok ? "DISPATCHED" : "FAILED",
        error: result.error || null,
        dispatchedAt: new Date().toISOString()
      });
      saveDispatchedLog(dispatchedLog);

      if (result.ok) {
        // Notify Founder Praveen on Telegram
        const alertTitle = `📨 *INSTAGRAM OUTREACH DISPATCHED!*`;
        const alertBody = 
          `🏢 *Business:* ${target.businessName}\n` +
          `📸 *Handle:* @${target.instagramHandle}\n` +
          `🌐 *Demo Sent:* ${target.pitches.demoUrl}\n` +
          `📞 *Phone:* ${target.phone || "N/A"}\n\n` +
          `GARUDA AI ne official DM successfully deliver kar diya hai. Jaise hi reply aayega, turant alert milega!`;
        
        await telegram.sendFounderAlert(alertTitle, alertBody).catch(() => {});
      }

      // Safe pause between DMs to keep Instagram account health pristine (12-18s)
      console.log("⏳ Safety delay for Instagram rate limits (12s)...");
      await new Promise((r) => setTimeout(r, 12000));
    }
  } catch (err) {
    console.error("❌ Fatal error in Instagram dispatcher:", err.message);
  } finally {
    await browser.close();
  }

  console.log("\n✔ Instagram DM dispatch sequence finished!");
}

if (require.main === module) {
  dispatchAllDms().catch(console.error);
}

module.exports = { dispatchAllDms, sendInstagramDm };
