/**
 * 🦅 Immediate Forensic Audit of LinkedIn DMs, Invitations & Followers
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

async function auditLinkedInNow() {
  console.log("🦅 Starting Immediate LinkedIn DM & Follower Forensic Audit...\n");

  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    console.error("❌ No LINKEDIN_LI_AT found in .env");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900"
    ]
  });

  const report = {
    timestamp: new Date().toISOString(),
    messages: [],
    invitations: [],
    notifications: []
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    // 1. Check Messaging
    console.log("▶ [1/3] Checking Messaging / DMs...");
    await page.goto("https://www.linkedin.com/messaging/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.resolve(__dirname, "../output/billing/v4_1/linkedin_messaging_screen.png") });
    console.log("  Saved messaging screenshot: output/billing/v4_1/linkedin_messaging_screen.png");

    const messageData = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("li.msg-conversation-listitem, div.msg-conversation-card, .msg-conversation-listitem__link"));
      return items.map(el => {
        const nameEl = el.querySelector(".msg-conversation-listitem__participant-names, h3, .msg-conversation-card__participant-names");
        const snippetEl = el.querySelector(".msg-conversation-card__message-snippet, p, .msg-conversation-listitem__message-snippet-body");
        const timeEl = el.querySelector("time, .msg-conversation-listitem__time-stamp");
        const unreadBadge = el.querySelector(".msg-conversation-card__unread-count, .msg-conversation-listitem__unread-count");
        return {
          sender: nameEl ? nameEl.innerText.trim() : "Unknown",
          snippet: snippetEl ? snippetEl.innerText.trim() : "",
          time: timeEl ? timeEl.innerText.trim() : "",
          isUnread: Boolean(unreadBadge)
        };
      });
    });

    report.messages = messageData;
    console.log(`  Found ${messageData.length} conversations.`);

    // If there is an active conversation, extract the conversation thread messages
    const threadMessages = await page.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll(".msg-s-event-listitem, .msg-s-message-list-content, .msg-s-event-listitem__body"));
      return bubbles.slice(-10).map(b => b.innerText.trim());
    });
    report.activeThread = threadMessages;

    // 2. Check Invitations / Connection Requests
    console.log("\n▶ [2/3] Checking Invitations & Connection Requests...");
    await page.goto("https://www.linkedin.com/mynetwork/invitation-manager/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.resolve(__dirname, "../output/billing/v4_1/linkedin_invitations_screen.png") });
    console.log("  Saved invitations screenshot: output/billing/v4_1/linkedin_invitations_screen.png");

    const invData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".invitation-card, li.invitation-card, .mn-invitation-list li"));
      return cards.map(c => {
        const name = c.querySelector(".invitation-card__title, a[href*='/in/'], .app-aware-link");
        const subtitle = c.querySelector(".invitation-card__subtitle, .invitation-card__occupation");
        const time = c.querySelector("time, .time-badge");
        return {
          name: name ? name.innerText.trim() : "Unknown",
          headline: subtitle ? subtitle.innerText.trim() : "",
          time: time ? time.innerText.trim() : ""
        };
      });
    });

    report.invitations = invData;
    console.log(`  Found ${invData.length} pending invitations.`);

    // 3. Check Notifications (Who followed / liked / commented)
    console.log("\n▶ [3/3] Checking Notifications (Follows, Likes, Mentions)...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.resolve(__dirname, "../output/billing/v4_1/linkedin_notifications_screen.png") });
    console.log("  Saved notifications screenshot: output/billing/v4_1/linkedin_notifications_screen.png");

    const notifData = await page.evaluate(() => {
      const notifs = Array.from(document.querySelectorAll("article.nt-card, .notification-item, div[data-ch*='notification']"));
      return notifs.slice(0, 15).map(n => {
        const text = n.innerText.trim().replace(/\n+/g, " | ");
        return text;
      });
    });

    report.notifications = notifData;
    console.log(`  Found ${notifData.length} recent notifications.`);

    fs.writeFileSync(path.resolve(__dirname, "../output/billing/v4_1/linkedin_audit_report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log("\n✔ AUDIT COMPLETE! Saved to output/billing/v4_1/linkedin_audit_report.json");
    console.log("\nREPORT SUMMARY:\n", JSON.stringify(report, null, 2));

  } catch (err) {
    console.error("❌ LinkedIn Audit Error:", err.message);
  } finally {
    await browser.close();
  }
}

auditLinkedInNow();
