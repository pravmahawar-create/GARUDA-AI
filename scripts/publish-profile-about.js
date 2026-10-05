const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function publishAboutSection() {
  const cookieVal = process.env.LINKEDIN_LI_AT;
  if (!cookieVal) throw new Error("Missing LINKEDIN_LI_AT");

  console.log("🦅 Adding comprehensive About section to LinkedIn profile...");
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

  const summaryUrl = "https://www.linkedin.com/in/garuda-ai-ai-operating-system-227168432/edit/forms/summary/new";
  console.log("Navigating to:", summaryUrl);
  await page.goto(summaryUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));

  const editor = await page.$("div.tiptap.ProseMirror[role='textbox']");
  if (!editor) throw new Error("About ProseMirror editor not found!");

  console.log("Focusing editor and injecting authoritative About text...");
  await editor.click();
  await new Promise(r => setTimeout(r, 800));

  const paragraphs = [
    "Architecting India's Sovereign AI Operating System — moving beyond prompt wrappers into true autonomous, governed enterprise software execution.",
    "",
    "At GARUDA OS, we are building the foundation where autonomous AI agents do not just generate text, but build, inspect, test, and deploy verified full-stack applications with 1,000-engineer velocity and 100% Anti-Fabrication cryptographic verification (SHA-256).",
    "",
    "What We Build & Deliver:",
    "⚡ PAWAN Autonomous Coding Studio: Closed-loop ReAct execution engine with real-time repository repair, syntax self-healing, and two-way voice architecture.",
    "🌐 GARUDA Multi-Agent Swarms: Deterministic state machines that automate end-to-end business workflows, B2B qualification, CRM routing, and custom software delivery.",
    "🤝 GARUDA Dost Rozgar Setu: Democratizing artificial intelligence across Bharat — empowering students, youth, and local micro-partners to deliver AI billing and web apps to local businesses with zero advance barrier.",
    "",
    "Core Focus:",
    "• Sovereign AI & On-Prem Context Isolation",
    "• Deterministic Multi-Agent State Architectures",
    "• Custom Enterprise Software & SaaS MVP Velocity",
    "• Zero-Hallucination Production Gates",
    "",
    "One Command. Infinite Intelligence.",
    "🌐 Platform: https://www.garudaos.in",
    "📩 Enterprise: praveen@garudaos.in"
  ];

  for (const p of paragraphs) {
    if (p === "") {
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    } else {
      await page.keyboard.type(p, { delay: 6 });
      await page.keyboard.down("Shift");
      await page.keyboard.press("Enter");
      await page.keyboard.up("Shift");
    }
    await new Promise(r => setTimeout(r, 40));
  }

  await new Promise(r => setTimeout(r, 1500));

  const previewPath = path.join(OUTPUT_DIR, "profile_about_preview.png");
  await page.screenshot({ path: previewPath });
  console.log("✔ Preview screenshot saved:", previewPath);

  // Click Save
  console.log("Clicking Save button...");
  const saved = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const saveBtn = btns.find(b => (b.innerText || "").trim() === "Save" && !b.disabled);
    if (saveBtn) {
      saveBtn.scrollIntoView({ behavior: "instant", block: "center" });
      saveBtn.click();
      return true;
    }
    return false;
  });

  if (!saved) throw new Error("Could not find enabled Save button!");

  console.log("✔ Save clicked! Waiting 6s for LinkedIn update...");
  await new Promise(r => setTimeout(r, 6000));

  const proofPath = path.join(OUTPUT_DIR, "profile_about_saved.png");
  await page.screenshot({ path: proofPath });
  console.log("✔ Saved confirmation screenshot:", proofPath);

  await browser.close();
  console.log("🎉 ABOUT SECTION SUCCESSFULLY SAVED TO LINKEDIN PROFILE!");
}

publishAboutSection().catch(err => {
  console.error("❌ Error adding About section:", err);
  process.exit(1);
});
