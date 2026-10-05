/**
 * 🦅 Check LinkedIn Inbound Messages & Notifications
 */
const puppeteer = require("puppeteer");
require("dotenv").config();

async function inspectLinkedInInbox() {
  console.log("Connecting to LinkedIn via authenticated session...");
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) {
    console.log("No LINKEDIN_LI_AT in .env");
    return;
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

    await page.setCookie({
      name: "li_at",
      value: cookieVal,
      domain: ".www.linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    }, {
      name: "li_at",
      value: cookieVal,
      domain: ".linkedin.com",
      path: "/",
      httpOnly: true,
      secure: true
    });

    console.log("Navigating to https://www.linkedin.com/messaging/...");
    await page.goto("https://www.linkedin.com/messaging/", { waitUntil: "domcontentloaded", timeout: 35000 });
    await new Promise(r => setTimeout(r, 5000));

    console.log("Current URL:", page.url());
    const title = await page.title();
    console.log("Title:", title);

    if (page.url().includes("/messaging")) {
      const messages = await page.evaluate(() => {
        const convos = Array.from(document.querySelectorAll("li.msg-conversation-listitem, div.msg-conversation-card"));
        return convos.map(c => {
          const nameEl = c.querySelector("h3, .msg-conversation-listitem__participant-names, .msg-conversation-card__participant-names");
          const snippetEl = c.querySelector("p, .msg-conversation-card__message-snippet, .msg-conversation-listitem__message-snippet");
          const timeEl = c.querySelector("time");
          return {
            sender: nameEl ? nameEl.innerText.trim() : "Unknown",
            snippet: snippetEl ? snippetEl.innerText.trim() : "",
            time: timeEl ? timeEl.innerText.trim() : ""
          };
        });
      });
      console.log(`\nFound ${messages.length} conversations in LinkedIn inbox:`);
      messages.slice(0, 10).forEach((m, i) => {
        console.log(`[${i + 1}] From: ${m.sender} (${m.time}) => "${m.snippet}"`);
      });

      // Check Invitations / Connection Requests
      console.log("\nNavigating to https://www.linkedin.com/mynetwork/invitation-manager/...");
      await page.goto("https://www.linkedin.com/mynetwork/invitation-manager/", { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise(r => setTimeout(r, 4000));

      const invitations = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll(".invitation-card, li.invitation-card"));
        return cards.map(c => {
          const title = c.querySelector(".invitation-card__title, a[href*='/in/']");
          const subtitle = c.querySelector(".invitation-card__subtitle");
          return {
            name: title ? title.innerText.trim() : "Unknown",
            headline: subtitle ? subtitle.innerText.trim() : ""
          };
        });
      });

      console.log(`Found ${invitations.length} pending invitations/requests:`);
      invitations.slice(0, 5).forEach((inv, i) => {
        console.log(`[${i + 1}] ${inv.name} - ${inv.headline}`);
      });
    } else {
      console.log("Could not open messaging directly. URL:", page.url());
    }
  } catch (err) {
    console.error("LinkedIn inspect error:", err.message);
  } finally {
    await browser.close();
  }
}

inspectLinkedInInbox();
