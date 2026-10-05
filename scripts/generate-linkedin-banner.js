const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUTPUT_IMAGE = path.join(__dirname, "..", "output", "linkedin_bangalore_launch_banner.png");

async function generateBanner() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: #030712;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 60px;
    }
    /* Subtle neon background ambient glow */
    .glow-cyan {
      position: absolute;
      top: -100px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%);
      pointer-events: none;
    }
    .glow-gold {
      position: absolute;
      bottom: -100px;
      left: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 24px;
      border-radius: 999px;
      background: rgba(212, 175, 55, 0.15);
      border: 1.5px solid #d4af37;
      color: #fef08a;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.3);
    }
    .tag-bangalore {
      padding: 8px 20px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid #38bdf8;
      color: #38bdf8;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .main-content {
      position: relative;
      z-index: 2;
      margin: 20px 0;
    }
    .hero-title {
      font-size: 44px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 30%, #38bdf8 70%, #d4af37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }
    .hero-sub {
      font-size: 20px;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 1px;
      max-width: 800px;
      line-height: 1.5;
    }
    .metric-row {
      display: flex;
      gap: 24px;
      position: relative;
      z-index: 2;
    }
    .metric-card {
      flex: 1;
      padding: 18px 22px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .m-emerald { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 25px rgba(16, 185, 129, 0.15); }
    .m-cyan { border-color: rgba(56, 189, 248, 0.4); box-shadow: 0 0 25px rgba(56, 189, 248, 0.15); }
    .m-gold { border-color: rgba(212, 175, 55, 0.4); box-shadow: 0 0 25px rgba(212, 175, 55, 0.15); }

    .m-val {
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .m-val span {
      font-size: 16px;
      font-weight: 700;
      color: #34d399;
      margin-left: 6px;
    }
    .m-label {
      font-size: 14px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 16px;
    }
    .f-left {
      font-size: 16px;
      font-weight: 700;
      color: #64748b;
    }
    .f-left span {
      color: #e2e8f0;
    }
    .f-right {
      font-size: 18px;
      font-weight: 900;
      color: #fef08a;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow-cyan"></div>
  <div class="glow-gold"></div>

  <div class="header">
    <div class="brand-pill">
      <span>🦅</span> GARUDA OS · SOVEREIGN ARCHITECTURE
    </div>
    <div class="tag-bangalore">
      📍 BANGALORE IT CORRIDOR · SPECIAL BRIEFING
    </div>
  </div>

  <div class="main-content">
    <h1 class="hero-title">The Death of 6-Month IT Delivery.<br>The Rise of India's Sovereign AI OS.</h1>
    <p class="hero-sub">
      Replacing sluggish enterprise development cycles with an autonomous workforce of 1,000 AI engineering agents. Full-stack microservices & cloud deployment in 48 hours flat.
    </p>
  </div>

  <div class="metric-row">
    <div class="metric-card m-emerald">
      <div class="m-val">1,000 <span>AI AGENTS</span></div>
      <div class="m-label">Autonomous Workforce</div>
    </div>
    <div class="metric-card m-cyan">
      <div class="m-val">48 HOURS <span>SPRINT</span></div>
      <div class="m-label">Production Delivery</div>
    </div>
    <div class="metric-card m-gold">
      <div class="m-val">SHA-256 <span>VERIFIED</span></div>
      <div class="m-label">Cryptographic Proof</div>
    </div>
  </div>

  <div class="footer">
    <div class="f-left">
      Founder: <span>Praveen Mahawar</span> · Operating Model: <span>Founder + AI Workforce</span>
    </div>
    <div class="f-right">
      WWW.GARUDAOS.IN
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: OUTPUT_IMAGE });
  await browser.close();

  console.log(`✔ Banner generated: ${OUTPUT_IMAGE} (${(fs.statSync(OUTPUT_IMAGE).size / 1024).toFixed(1)} KB)`);
  return OUTPUT_IMAGE;
}

generateBanner().catch(console.error);
