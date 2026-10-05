const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function renderPoster() {
  const sigilCleanPath = 'D:\\\\GARUDA-AI\\\\output\\STATUS_POSTERS\\garuda_eagle_sigil_clean.png';
  let sigilBase64 = '';
  if (fs.existsSync(sigilCleanPath)) {
    sigilBase64 = `data:image/png;base64,${fs.readFileSync(sigilCleanPath).toString('base64')}`;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GARUDA OS - Ultra Premium Executive Status</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1080px;
      height: 1920px;
      background-color: #000000;
      background-image: 
        radial-gradient(circle at 50% 19%, rgba(212, 175, 55, 0.25) 0%, rgba(99, 102, 241, 0.12) 32%, transparent 62%),
        radial-gradient(circle at 10% 75%, rgba(212, 175, 55, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 45%),
        linear-gradient(180deg, #000000 0%, #06070B 45%, #020305 100%);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      color: #FFFFFF;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 100px 54px 120px 54px;
    }

    /* Ambient Cyber Grids */
    .cyber-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 1;
    }

    .container {
      position: relative;
      z-index: 10;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Top Sovereign Brand Bar */
    .top-brand {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 9px 30px;
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.45);
      border-radius: 100px;
      backdrop-filter: blur(16px);
      margin-bottom: 8px;
      box-shadow: 0 0 35px rgba(212, 175, 55, 0.2);
    }

    .pulse-dot {
      width: 11px;
      height: 11px;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 16px #10B981, 0 0 30px #10B981;
    }

    .pill-text {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      letter-spacing: 3.5px;
      text-transform: uppercase;
      color: #F8FAFC;
    }

    .sigil-wrapper {
      position: relative;
      width: 460px;
      height: 250px;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sigil-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      mix-blend-mode: lighten;
    }

    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 70px;
      font-weight: 900;
      letter-spacing: 14px;
      background: linear-gradient(135deg, #FFF8E1 0%, #FADB5F 25%, #D4AF37 55%, #9E740C 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-transform: uppercase;
      margin-top: -8px;
      margin-bottom: 4px;
      filter: drop-shadow(0 6px 25px rgba(212, 175, 55, 0.45));
    }

    .brand-sub {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #CBD5E1;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .brand-tagline {
      font-family: 'Cinzel', serif;
      font-size: 14px;
      letter-spacing: 4px;
      color: #E2B74A;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 24px;
    }

    /* Core Power Matrix Grid */
    .matrix-title-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .matrix-line {
      height: 1px;
      width: 100px;
      background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent);
    }

    .matrix-tag {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13.5px;
      letter-spacing: 4px;
      color: #FADB5F;
      font-weight: 800;
      text-transform: uppercase;
      text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
    }

    .cards-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }

    .power-card {
      background: rgba(14, 17, 26, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: 5px solid #D4AF37;
      border-radius: 16px;
      padding: 19px 22px;
      backdrop-filter: blur(20px);
      display: flex;
      align-items: flex-start;
      gap: 20px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
    }

    .power-card::after {
      content: '';
      position: absolute;
      top: -20px;
      right: -20px;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
      pointer-events: none;
    }

    .card-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%);
      border: 1px solid rgba(212, 175, 55, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
      box-shadow: 0 4px 18px rgba(212, 175, 55, 0.25);
    }

    .card-content {
      flex: 1;
    }

    .card-heading {
      font-size: 18px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-badge {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      background: rgba(212, 175, 55, 0.2);
      color: #FADB5F;
      border: 1px solid rgba(212, 175, 55, 0.5);
      letter-spacing: 1.2px;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }

    .card-desc {
      font-size: 13.5px;
      line-height: 1.5;
      color: #94A3B8;
      font-weight: 500;
    }

    .card-desc b {
      color: #F1F5F9;
      font-weight: 700;
    }

    /* Key Stats Bar */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }

    .stat-box {
      background: rgba(16, 20, 32, 0.75);
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 14px;
      padding: 16px 12px;
      text-align: center;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .stat-val {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #FADB5F;
      letter-spacing: 1.5px;
      margin-bottom: 3px;
      text-shadow: 0 0 14px rgba(212, 175, 55, 0.35);
    }

    .stat-lbl {
      font-size: 11px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    /* Bottom Sovereign Seal & CTA */
    .bottom-seal {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-top: 1px solid rgba(212, 175, 55, 0.28);
      padding-top: 24px;
    }

    .mantra {
      font-family: 'Cinzel', serif;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #F8FAFC;
      text-transform: uppercase;
      margin-bottom: 14px;
      text-shadow: 0 0 18px rgba(212, 175, 55, 0.4);
    }

    .url-chip {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      padding: 12px 38px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.28) 0%, rgba(99, 102, 241, 0.15) 100%);
      border: 1.5px solid rgba(212, 175, 55, 0.7);
      border-radius: 100px;
      margin-bottom: 14px;
      box-shadow: 0 0 32px rgba(212, 175, 55, 0.35);
    }

    .url-chip span {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 2.5px;
    }

    .credentials {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #64748B;
      text-transform: uppercase;
    }

    .credentials b {
      color: #CBD5E1;
    }
  </style>
</head>
<body>
  <div class="cyber-grid"></div>

  <div class="container">
    <!-- Top Sovereign Brand -->
    <div class="top-brand">
      <div class="pill-badge">
        <div class="pulse-dot"></div>
        <div class="pill-text">AUTONOMOUS AI WORKFORCE • TITAN ARCHITECTURE</div>
      </div>

      <div class="sigil-wrapper">
        <img class="sigil-img" src="${sigilBase64}" alt="GARUDA SIGIL">
      </div>

      <h1 class="brand-title">GARUDA OS</h1>
      <div class="brand-sub">THE SOVEREIGN AI OPERATING SYSTEM</div>
      <div class="brand-tagline">ONE COMMAND • INFINITE EXECUTION</div>
    </div>

    <!-- Power Capabilities Grid -->
    <div class="powers-section">
      <div class="matrix-title-bar">
        <div class="matrix-line"></div>
        <div class="matrix-tag">CORE CAPABILITIES & WORKING CAPACITY</div>
        <div class="matrix-line"></div>
      </div>

      <div class="cards-stack">
        <!-- Card 1 -->
        <div class="power-card">
          <div class="card-icon-wrap">⚡</div>
          <div class="card-content">
            <div class="card-heading">
              <span>AUTONOMOUS FULL-STACK TITAN</span>
              <span class="card-badge">1,000x SPEED</span>
            </div>
            <div class="card-desc">
              Replaces an entire 1,000-engineer IT force. Architects, codes, tests & compiles <b>production Web, Native Mobile Apps (APK/iOS) & APIs</b> in minutes.
            </div>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="power-card">
          <div class="card-icon-wrap">🎯</div>
          <div class="card-content">
            <div class="card-heading">
              <span>24/7 FORENSIC REVENUE HUNTER</span>
              <span class="card-badge">AUTO-PROSPECT</span>
            </div>
            <div class="card-desc">
              Scans global markets nonstop. Pinpoints operational hemorrhages, generates <b>custom Trojan architectural prototypes</b> & converts deals autonomously.
            </div>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="power-card">
          <div class="card-icon-wrap">🛡️</div>
          <div class="card-content">
            <div class="card-heading">
              <span>CYBERSHIELD & SELF-HEALING</span>
              <span class="card-badge">ZERO-DAY GUARD</span>
            </div>
            <div class="card-desc">
              Zero-trust hostile defense. Conducts deep static audits, eliminates vulnerabilities, and <b>self-heals broken routes & runtime faults</b> instantly.
            </div>
          </div>
        </div>

        <!-- Card 4 -->
        <div class="power-card">
          <div class="card-icon-wrap">🧠</div>
          <div class="card-content">
            <div class="card-heading">
              <span>OMNI-AGENT COGNITIVE SWARM</span>
              <span class="card-badge">MULTI-DAEMON</span>
            </div>
            <div class="card-desc">
              Multi-agent parallel execution. Persistent memory synapses, neural voice engines, headless browser automation, and <b>zero-fatigue 24/7 execution</b>.
            </div>
          </div>
        </div>

        <!-- Card 5 -->
        <div class="power-card">
          <div class="card-icon-wrap">💎</div>
          <div class="card-content">
            <div class="card-heading">
              <span>100% ANTI-FABRICATION LAW</span>
              <span class="card-badge">VERIFIED SHA-256</span>
            </div>
            <div class="card-desc">
              <b>Show > Tell.</b> Zero hallucinations, zero fake claims. Every build, APK binary, and deployment is backed by forensic proofs and real working code.
            </div>
          </div>
        </div>
      </div>

      <!-- Live Benchmarks -->
      <div class="stats-bar">
        <div class="stat-box">
          <div class="stat-val">1-SHOT</div>
          <div class="stat-lbl">NATIVE COMPILE</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">24 / 7</div>
          <div class="stat-lbl">AUTONOMOUS OPS</div>
        </div>
        <div class="stat-box">
          <div class="stat-val">100%</div>
          <div class="stat-lbl">SOVEREIGN AI</div>
        </div>
      </div>
    </div>

    <!-- Bottom Sovereign Seal -->
    <div class="bottom-seal">
      <div class="mantra">ONE MIND • ONE AI • ENDLESS POWER</div>
      <div class="url-chip">
        <span>🌐 HTTPS://WWW.GARUDAOS.IN</span>
      </div>
      <div class="credentials">
        OFFICIAL PLATFORM • <b>FOUNDER PRAVEEN MAHAWAR</b> • PRAVEEN@GARUDAOS.IN
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const outputPath = 'D:\\\\GARUDA-AI\\\\output\\STATUS_POSTERS\\GARUDA_STATUS_EXECUTIVE_4K.png';
  
  console.log('Rendering 4K status pamphlet with black blend...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1080,
    height: 1920,
    deviceScaleFactor: 2 // True 2160 x 3840 Ultra-HD 4K resolution!
  });

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.screenshot({
    path: outputPath,
    type: 'png'
  });

  await browser.close();
  console.log('Generated Ultra HD 4K status pamphlet successfully at:', outputPath);
}

renderPoster().catch(err => {
  console.error('Render error:', err);
  process.exit(1);
});
