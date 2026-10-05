const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function engageCourtneyCarter() {
  const cUser = process.env.FB_C_USER;
  const xs = process.env.FB_XS;

  if (!cUser || !xs) throw new Error("FB_C_USER or FB_XS missing in .env");

  console.log("🦅 [GARUDA FB ENGAGE] Navigating to customer hunt search to engage Courtney Carter...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    await page.setCookie(
      { name: "c_user", value: cUser.trim(), domain: ".facebook.com", path: "/", secure: true },
      { name: "xs", value: xs.trim(), domain: ".facebook.com", path: "/", httpOnly: true, secure: true }
    );

    const searchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent("looking for a web developer")}&filters=eyJyZWNlbnRfcG9zdHM6MCI6IntcIm5hbWVcIjpcInJlY2VudF9wb3N0c1wiLFwiYXJnc1wiOlwiXCJ9In0%3D`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));

    // Find the comment icon or button under the first post (Courtney Carter / Oliver Mark)
    console.log("▶ Locating comment button on first post...");
    
    // In the screenshot, there is a Like icon, Comment icon, Share icon
    const commentClicked = await page.evaluate(() => {
      // Find comment buttons or aria-labels
      const btns = Array.from(document.querySelectorAll("div[role='button'], div[aria-label*='Comment' i], span"));
      for (const b of btns) {
        const aria = b.getAttribute("aria-label") || "";
        const txt = b.textContent || "";
        if (aria.toLowerCase().includes("leave a comment") || aria.toLowerCase().includes("comment") || txt.trim() === "Comment") {
          b.scrollIntoView({ behavior: "instant", block: "center" });
          b.click();
          return true;
        }
      }
      return false;
    });

    console.log("▶ Comment trigger clicked?", commentClicked);
    await new Promise(r => setTimeout(r, 3000));

    // Look for contenteditable or textbox
    const editor = await page.$("div[role='textbox'][contenteditable='true'], div[contenteditable='true']");
    if (editor) {
      console.log("▶ Found comment editor! Injecting professional pitch...");
      await editor.click();
      await new Promise(r => setTimeout(r, 1000));

      const commentText = "Hey Courtney! If you need a clean, responsive website built ASAP, our team delivers production-ready sites in 24 to 48 hours flat. Live portfolio & interactive demos: https://www.garudaos.in — let's connect!";
      
      await page.keyboard.type(commentText, { delay: 20 });
      await new Promise(r => setTimeout(r, 2000));

      const previewPath = path.join(OUTPUT_DIR, "fb_courtney_pitch_preview.png");
      await page.screenshot({ path: previewPath });
      console.log(`✔ Preview captured: ${previewPath}`);

      // Press Enter to submit
      console.log("▶ Submitting comment via Enter key...");
      await page.keyboard.press("Enter");
      await new Promise(r => setTimeout(r, 6000));

      const proofPath = path.join(OUTPUT_DIR, "fb_courtney_pitch_live_proof.png");
      await page.screenshot({ path: proofPath });
      console.log(`✔ Live proof captured: ${proofPath}`);
    } else {
      console.log("⚠ Could not find active textbox, saving debug screenshot...");
      await page.screenshot({ path: path.join(OUTPUT_DIR, "fb_courtney_debug.png") });
    }

  } finally {
    await browser.close();
  }
}

engageCourtneyCarter().catch(err => {
  console.error("❌ Engage Error:", err.message);
  process.exit(1);
});
