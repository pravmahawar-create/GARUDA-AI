const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "..", "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generateRoadmapInfographic() {
  console.log("🎨 [GARUDA ARCHITECTURE INFOGRAPHIC] Generating 4:5 High-Authority Roadmap...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  // 1200 x 1500 is LinkedIn's optimal high-DPI 4:5 portrait ratio
  await page.setViewport({ width: 1200, height: 1540, deviceScaleFactor: 2 });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body {
      width: 1200px;
      height: 1540px;
      background: #0d1117;
      color: #f0f6fc;
      padding: 45px 55px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    
    /* Header */
    .header {
      border-bottom: 2px solid #30363d;
      padding-bottom: 25px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #f59e0b;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .main-title {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      line-height: 1.15;
      text-transform: uppercase;
    }
    .main-title span {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .author-sub {
      font-size: 16px;
      color: #8b949e;
      margin-top: 8px;
      font-weight: 500;
    }

    /* Stages Container */
    .stages-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 25px 0;
    }

    .stage-row {
      display: grid;
      grid-template-columns: 210px 1fr;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 16px 20px;
      align-items: center;
      gap: 20px;
      position: relative;
    }

    .stage-row:hover {
      border-color: #f59e0b;
    }

    /* Left Stage Label */
    .stage-label-box {
      display: flex;
      align-items: center;
      gap: 14px;
      border-right: 1px solid #30363d;
      padding-right: 15px;
    }
    .stage-num {
      width: 44px;
      height: 44px;
      background: #f59e0b;
      color: #000;
      font-size: 22px;
      font-weight: 900;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    }
    .stage-text h3 {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stage-text p {
      font-size: 12px;
      color: #8b949e;
      margin-top: 3px;
      line-height: 1.25;
    }

    /* Right Steps Flow */
    .steps-flow {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      align-items: center;
      position: relative;
    }

    .step-card {
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 8px;
      padding: 12px 10px;
      text-align: center;
      position: relative;
      min-height: 86px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .step-icon {
      font-size: 20px;
      margin-bottom: 6px;
    }
    .step-title {
      font-size: 12px;
      font-weight: 700;
      color: #e6edf3;
      line-height: 1.2;
    }
    .step-desc {
      font-size: 10px;
      color: #7d8590;
      margin-top: 3px;
      line-height: 1.2;
    }

    /* Arrow between steps */
    .step-card:not(:last-child)::after {
      content: "➔";
      position: absolute;
      right: -10px;
      top: 50%;
      transform: translateY(-50%);
      color: #f59e0b;
      font-size: 12px;
      font-weight: 900;
      z-index: 10;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #30363d;
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .footer-logo {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 1px;
    }
    .footer-logo span {
      color: #f59e0b;
    }
    .footer-meta {
      font-size: 12px;
      color: #8b949e;
    }
    .footer-tagline {
      font-size: 13px;
      font-weight: 600;
      color: #58a6ff;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="badge">◈ Sovereign Autonomous Systems Architecture ◈</div>
    <div class="main-title">7 Stages of a <span>Production-Ready</span> AI Operating System</div>
    <div class="author-sub">By Praveen Mahawar · Founder & Chief Sovereign Architect @ GARUDA OS (www.garudaos.in)</div>
  </div>

  <!-- 7 Stages Grid -->
  <div class="stages-grid">

    <!-- 1. DISCOVER -->
    <div class="stage-row">
      <div class="stage-label-box">
        <div class="stage-num">1</div>
        <div class="stage-text">
          <h3>DISCOVER</h3>
          <p>Forensic problem & latency modeling</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon">🎯</div>
          <div class="step-title">Forensic Audit</div>
          <div class="step-desc">Target client leaks</div>
        </div>
        <div class="step-card">
          <div class="step-icon">👤</div>
          <div class="step-title">Brand Persona</div>
          <div class="step-desc">Gulf luxury / Cyber dark</div>
        </div>
        <div class="step-card">
          <div class="step-icon">⚡</div>
          <div class="step-title">Latency Targets</div>
          <div class="step-desc">Sub-second execution</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🛡️</div>
          <div class="step-title">Founder Shield</div>
          <div class="step-desc">Zero privacy leakage</div>
        </div>
      </div>
    </div>

    <!-- 2. GOVERN -->
    <div class="stage-row">
      <div class="stage-label-box">
        <div class="stage-num">2</div>
        <div class="stage-text">
          <h3>GOVERN</h3>
          <p>Anti-fabrication & constitutional laws</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon">⚖️</div>
          <div class="step-title">Anti-Fabrication</div>
          <div class="step-desc">Zero hallucination law</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🔒</div>
          <div class="step-title">Gatekeeping</div>
          <div class="step-desc">Founder commit lock</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🔄</div>
          <div class="step-title">State Machine</div>
          <div class="step-desc">Goal → Plan → Execute</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🛑</div>
          <div class="step-title">Dietary Isolation</div>
          <div class="step-desc">Zero cultural cross-bleed</div>
        </div>
      </div>
    </div>

    <!-- 3. CONNECT -->
    <div class="stage-row">
      <div class="stage-label-box">
        <div class="stage-num">3</div>
        <div class="stage-text">
          <h3>CONNECT</h3>
          <p>Provider-agnostic compute routing</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon">🔌</div>
          <div class="step-title">Compute Router</div>
          <div class="step-desc">Local / Cloudflare / HF</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🎙️</div>
          <div class="step-title">Neural Edge TTS</div>
          <div class="step-desc">Native Swara / Madhur</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🌐</div>
          <div class="step-title">24/7 Keep-Alive</div>
          <div class="step-desc">Render cloud server</div>
        </div>
        <div class="step-card">
          <div class="step-icon">📡</div>
          <div class="step-title">Event Broker</div>
          <div class="step-desc">garudaEventService bus</div>
        </div>
      </div>
    </div>

    <!-- 4. ORCHESTRATE -->
    <div class="stage-row">
      <div class="stage-label-box">
        <div class="stage-num">4</div>
        <div class="stage-text">
          <h3>ORCHESTRATE</h3>
          <p>Multi-agent workforce swarms</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon">👑</div>
          <div class="step-title">Mother Brain</div>
          <div class="step-desc">High-level decider</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🤖</div>
          <div class="step-title">1,000 Agents</div>
          <div class="step-desc">Parallel task runner</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🎬</div>
          <div class="step-title">Creative Director</div>
          <div class="step-desc">Scene-by-scene script</div>
        </div>
        <div class="step-card">
          <div class="step-icon">📈</div>
          <div class="step-title">Quant Daemon</div>
          <div class="step-desc">5-factor scoring (75%)</div>
        </div>
      </div>
    </div>

    <!-- 5. SYNAPSE -->
    <div class="stage-row">
      <div class="stage-label-box">
        <div class="stage-num">5</div>
        <div class="stage-text">
          <h3>SYNAPSE</h3>
          <p>Durable memory & self-learning</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon">🧠</div>
          <div class="step-title">Durable Journal</div>
          <div class="step-desc">1.52 MB experiences</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🚫</div>
          <div class="step-title">Zero Repetition</div>
          <div class="step-desc">Persistent lessons.jsonl</div>
        </div>
        <div class="step-card">
          <div class="step-icon">📊</div>
          <div class="step-title">Audit Ledger</div>
          <div class="step-desc">Immutable trade log</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🧬</div>
          <div class="step-title">Post-Mission</div>
          <div class="step-desc">Self-healing patch loop</div>
        </div>
      </div>
    </div>

    <!-- 6. VERIFY -->
    <div class="stage-row">
      <div class="stage-label-box">
        <div class="stage-num">6</div>
        <div class="stage-text">
          <h3>VERIFY</h3>
          <p>Pre-flight & cryptographic testing</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon">🔍</div>
          <div class="step-title">Pre-Outreach Probe</div>
          <div class="step-desc">HTTP 200 & title check</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🧪</div>
          <div class="step-title">Worktree Audit</div>
          <div class="step-desc">npm run build pass</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🔑</div>
          <div class="step-title">SHA-256 Hashes</div>
          <div class="step-desc">Verified artifact proof</div>
        </div>
        <div class="step-card">
          <div class="step-icon">📱</div>
          <div class="step-title">ADB Hardware Run</div>
          <div class="step-desc">Clean native APK test</div>
        </div>
      </div>
    </div>

    <!-- 7. SHIP -->
    <div class="stage-row">
      <div class="stage-label-box">
        <div class="stage-num">7</div>
        <div class="stage-text">
          <h3>SHIP & SCALE</h3>
          <p>Autonomous delivery & client revenue</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon">📦</div>
          <div class="step-title">Compiled APK</div>
          <div class="step-desc">Native Android v3.5</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🎥</div>
          <div class="step-title">Master MP4 Reel</div>
          <div class="step-desc">1080x1920 Full HD</div>
        </div>
        <div class="step-card">
          <div class="step-icon">🧾</div>
          <div class="step-title">Billing Suite</div>
          <div class="step-desc">GST / Dexie offline PWA</div>
        </div>
        <div class="step-card">
          <div class="step-icon">💰</div>
          <div class="step-title">Revenue Cycle</div>
          <div class="step-desc">Client settlement & scale</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">
      <div class="footer-logo">🦅 GARUDA <span>OS</span></div>
      <div class="footer-meta">India's Sovereign AI Operating System · 100% Anti-Fabrication Verified</div>
    </div>
    <div class="footer-tagline">SHOW > TELL · WWW.GARUDAOS.IN</div>
  </div>

</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: "load" });
  const outPath = path.join(OUTPUT_DIR, "garuda_7_stages_infographic.png");
  await page.screenshot({ path: outPath, type: "png" });
  console.log("✔ Infographic generated cleanly at:", outPath);

  await browser.close();
}

generateRoadmapInfographic().catch(err => {
  console.error("❌ Error generating infographic:", err);
  process.exit(1);
});
