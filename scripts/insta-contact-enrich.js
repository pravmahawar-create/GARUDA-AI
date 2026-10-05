require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const REPORT = path.resolve(__dirname, "../data/leads/insta_contact_enrichment.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const human = () => sleep(5000 + Math.random() * 4000);

const POSTS = [
  { rank: 1, url: "https://www.instagram.com/p/DdN22UcFGLj/", lead: "Nisarga Care" },
  { rank: 2, url: "https://www.instagram.com/p/DaD1VpECGT0/", lead: "Trivanta Hospitality Group" },
  { rank: 3, url: "https://www.instagram.com/p/Ddw68qlvd3_/", lead: "Luxury revamp business owner" },
  { rank: 4, url: "https://www.instagram.com/p/DSAmoAZj9Mg/", lead: "UK agency founder" }
];

const CONTACT_RE = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})|(\+?\d[\d\s-]{7,15}\d)|(wa\.me\/\+?\d+)|(https?:\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"']*)/i;

(async () => {
  const out = { createdAt: new Date().toISOString(), entries: [] };
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"]
  });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.53 Safari/537.36");
  await page.setCookie(
    { name: "sessionid", value: process.env.INSTAGRAM_SESSION_ID, domain: ".instagram.com", path: "/" },
    { name: "ds_user_id", value: process.env.INSTAGRAM_USER_ID, domain: ".instagram.com", path: "/" }
  );

  for (const p of POSTS) {
    const entry = { rank: p.rank, lead: p.lead, postUrl: p.url };
    try {
      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(6000);
      const loggedIn = await page.evaluate(() => !document.querySelector("input[name='username']"));
      if (!loggedIn) { entry.error = "NOT_LOGGED_IN"; out.entries.push(entry); continue; }

      const post = await page.evaluate(() => {
        const t = document.body.innerText || "";
        const header = document.querySelector("header a[href]") || document.querySelector('a[href^="/"][tabindex]');
        const links = Array.from(document.querySelectorAll("a[href]")).map(a => a.getAttribute("href"));
        const mail = (t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i) || [])[0] || null;
        const phone = (t.match(/\+?\d[\d\s-]{8,15}\d/) || [])[0] || null;
        return { text: t.slice(0, 2500), headerHref: header ? header.getAttribute("href") : null, mail, phone, links: links.filter(l => l && l.startsWith("/") && l.split("/").length === 2 && !["explore", "reels", "direct", "p", "reel"].includes(l.split("/")[1])).slice(0, 8) };
      });
      entry.postTextHead = post.text.slice(0, 700);
      entry.postMail = post.mail;
      entry.postPhone = post.phone;
      let username = null;
      if (post.headerHref) username = post.headerHref.replace(/^\//, "").split("/")[0];
      if (!username) username = (post.links[0] || "").replace(/^\//, "").split("/")[0] || null;
      entry.username = username;

      if (username && !["explore", "reels"].includes(username)) {
        await human();
        await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await sleep(6000);
        const bio = await page.evaluate(() => {
          const t = document.body.innerText || "";
          const section = t.split("Page")[0];
          const mail = (section.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i) || [])[0] || null;
          const phone = (section.match(/\+?\d[\d\s-]{8,15}\d/) || [])[0] || null;
          const wa = (section.match(/wa\.me\/\+?\d+/i) || [])[0] || null;
          const site = (section.match(/https?:\/\/(?!www\.instagram|l\.instagram)[a-z0-9.-]+\.[a-z]{2,}[^\s]*/i) || [])[0] || null;
          return { head: section.slice(0, 900), mail, phone, wa, site };
        });
        entry.profile = bio;
      }
      console.log(`[ENRICH] #${p.rank} ${p.lead} user=${entry.username} mail=${entry.postMail || (entry.profile || {}).mail} phone=${entry.postPhone || (entry.profile || {}).phone}`);
    } catch (e) {
      entry.error = e.message;
      console.log(`[ENRICH] #${p.rank} ERROR ${e.message}`);
    }
    out.entries.push(entry);
    fs.writeFileSync(REPORT, JSON.stringify(out, null, 2));
    await human();
  }
  await browser.close();
  console.log("DONE -> " + REPORT);
})().catch(e => { console.error(e); process.exit(1); });
