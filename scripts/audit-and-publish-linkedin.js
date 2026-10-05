/**
 * 🦅 GARUDA LinkedIn Autonomous Inbound Audit & Video Publisher
 * Uses verified fresh li_at + JSESSIONID cookies.
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const LI_AT = "AQEDAW1NST8CkpiwAAABoOiLevsAAAGhDJf--1YASUnkDapKj8ZYiC_WlHRhAcFV_SWRGKSsKaV2Mf_F667OnxJrtX_dqdaHpMmf1mi31Ae1iwQdNoNZxylxCegtqeX6TLNFRkhiJr_5kmLUr8-36htb";
const JSESSIONID = '"ajax:8912913176490188972"';
const OUTPUT_DIR = path.resolve(__dirname, "../output/billing/v4_1");

async function main() {
  console.log("===============================================================");
  console.log("🦅 GARUDA LINKEDIN INBOUND AUDIT & VIDEO PUBLISHER");
  console.log("===============================================================\n");

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
    user: "GARUDA-AI AI OPERATING SYSTEM",
    messages: [],
    invitations: [],
    notifications: []
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    // Set both cookies on .linkedin.com
    await page.setCookie(
      {
        name: "li_at",
        value: LI_AT,
        domain: ".linkedin.com",
        path: "/",
        httpOnly: true,
        secure: true
      },
      {
        name: "JSESSIONID",
        value: JSESSIONID,
        domain: ".linkedin.com",
        path: "/",
        httpOnly: false,
        secure: true
      }
    );

    // Step 1: Open Feed to establish session
    console.log("▶ [1/4] Navigating to LinkedIn Feed...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));
    console.log("  Feed URL reached:", page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, "audit_feed_live.png") });

    // Step 2: Open Messaging / Inbound DMs
    console.log("\n▶ [2/4] Navigating to LinkedIn Messaging (/messaging)...");
    await page.goto("https://www.linkedin.com/messaging/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));
    console.log("  Messaging URL reached:", page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, "audit_messaging_live.png") });

    const messages = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".msg-conversation-listitem, .msg-conversation-card, li.msg-conversation-listitem__link"));
      return items.map(el => {
        const nameEl = el.querySelector(".msg-conversation-listitem__participant-names, h3, .msg-conversation-card__participant-names");
        const snippetEl = el.querySelector(".msg-conversation-card__message-snippet, p, .msg-conversation-listitem__message-snippet-body");
        const timeEl = el.querySelector("time, .msg-conversation-listitem__time-stamp");
        const unread = el.querySelector(".msg-conversation-card__unread-count, .msg-conversation-listitem__unread-count");
        return {
          sender: nameEl ? nameEl.innerText.trim() : "Unknown",
          snippet: snippetEl ? snippetEl.innerText.trim() : "",
          time: timeEl ? timeEl.innerText.trim() : "",
          isUnread: Boolean(unread)
        };
      });
    });

    // Also get active thread messages if open
    const thread = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll(".msg-s-message-list__event, .msg-s-event-listitem"));
      return msgs.map(m => {
        const author = m.querySelector(".msg-s-message-group__name, .msg-s-message-group__profile-link");
        const text = m.querySelector(".msg-s-event-listitem__body");
        const time = m.querySelector("time");
        return {
          author: author ? author.innerText.trim() : "Sender",
          text: text ? text.innerText.trim() : m.innerText.trim(),
          time: time ? time.innerText.trim() : ""
        };
      });
    });

    report.messages = messages;
    report.activeThread = thread;
    console.log(`  ✔ Found ${messages.length} conversation threads in inbox.`);

    // Step 3: Open My Network / Invitations
    console.log("\n▶ [3/4] Navigating to Invitations (/mynetwork/invitation-manager)...");
    await page.goto("https://www.linkedin.com/mynetwork/invitation-manager/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));
    console.log("  Invitations URL reached:", page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, "audit_invitations_live.png") });

    const invitations = await page.evaluate(() => {
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

    report.invitations = invitations;
    console.log(`  ✔ Found ${invitations.length} pending invitations.`);

    // Step 4: Open Notifications
    console.log("\n▶ [4/4] Navigating to Notifications (/notifications)...");
    await page.goto("https://www.linkedin.com/notifications/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 6000));
    console.log("  Notifications URL reached:", page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, "audit_notifications_live.png") });

    const notifs = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("article.nt-card, .notification-item"));
      return items.slice(0, 15).map(item => item.innerText.trim().replace(/\n+/g, " | "));
    });

    report.notifications = notifs;
    console.log(`  ✔ Found ${notifs.length} recent notifications.`);

    // Save final report
    fs.writeFileSync(path.join(OUTPUT_DIR, "linkedin_live_audit_report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log("\n✔ AUDIT DATA SAVED TO output/billing/v4_1/linkedin_live_audit_report.json");
    console.log("\n--- REPORT PREVIEW ---");
    console.log(JSON.stringify(report, null, 2));

  } catch (err) {
    console.error("❌ Error during LinkedIn Audit:", err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
