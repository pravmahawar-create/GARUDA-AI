const puppeteer = require('puppeteer');
const fs = require('fs');

async function renderMasterpiece() {
  const bgPath = 'D:\\\\GARUDA-AI\\\\output\\STATUS_POSTERS\\GARUDA_STATUS_CINEMATIC_EDITION.jpg';
  const bgBase64 = `data:image/jpeg;base64,${fs.readFileSync(bgPath).toString('base64')}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GARUDA OS - Masterpiece Status</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1080px;
      height: 1920px;
      background: #040508 url('${bgBase64}') no-repeat center top;
      background-size: 1080px auto;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      color: #FFFFFF;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 0 46px 85px 46px;
    }

    /* Ambient dark gradient overlay to make cards blend seamlessly */
    .lower-backdrop {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1080px;
      background: linear-gradient(180deg, rgba(4, 5, 8, 0) 0%, rgba(4, 5, 8, 0.95) 12%, #040508 24%, #040508 100%);
      pointer-events: none;
      z-index: 1;
    }

    .content-layer {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .matrix-title-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 2px;
    }

    .matrix-line {
      height: 1.5px;
      width: 90px;
      background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.7), transparent);
    }

    .matrix-tag {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13.5px;
      letter-spacing: 4px;
      color: #FADB5F;
      font-weight: 800;
      text-transform: uppercase;
      text-shadow: 0 0 16px rgba(212, 175, 55, 0.6);
    }

    /* 4-Card 2x2 Grid or Stack */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .power-card {
      background: rgba(11, 14, 22, 0.86);
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 16px;
      padding: 18px 18px;
      backdrop-filter: blur(24px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 195px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }

    .power-card::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 70px;
      height: 70px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.22) 0%, rgba(99, 102, 241, 0.15) 100%);
      border: 1px solid rgba(212, 175, 55, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
    }

    .card-badge {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(212, 175, 55, 0.18);
      color: #FADB5F;
      border: 1px solid rgba(212, 175, 55, 0.4);
      letter-spacing: 1px;
    }

    .card-title {
      font-size: 15px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.3px;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    .card-desc {
      font-size: 12px;
      line-height: 1.45;
      color: #94A3B8;
      font-weight: 500;
    }

    .card-desc b {
      color: #F1F5F9;
      font-weight: 700;
    }

    /* Fifth Wide Card: 100% Anti-Fabrication Law */
    .wide-card {
      background: rgba(11, 14, 22, 0.86);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-left: 4px solid #D4AF37;
      border-radius: 14px;
      padding: 14px 20px;
      backdrop-filter: blur(24px);
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
    }

    .wide-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%);
      border: 1px solid rgba(212, 175, 55, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }

    .wide-text {
      flex: 1;
    }

    .wide-heading {
      font-size: 14.5px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .wide-desc {
      font-size: 11.5px;
      color: #94A3B8;
      line-height: 1.35;
    }

    .wide-desc b {
      color: #F8FAFC;
    }

    /* Sovereign Bottom Bar */
    .bottom-seal {
      margin-top: 6px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .royal-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 10px 32px;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.22) 0%, rgba(17, 24, 39, 0.8) 100%);
      border: 1.5px solid rgba(212, 175, 55, 0.65);
      border-radius: 100px;
      box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
      margin-bottom: 12px;
    }

    .royal-badge span {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #FFFFFF;
    }

    .mantra {
      font-family: 'Cinzel', serif;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 5px;
      color: #E2B74A;
      text-transform: uppercase;
      margin-bottom: 8px;
      text-shadow: 0 0 14px rgba(212, 175, 55, 0.4);
    }

    .credentials {
      font-size: 11.5px;
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
  <div class="lower-backdrop"></div>

  <div class="content-layer">
    <div class="matrix-title-bar">
      <div class="matrix-line"></div>
      <div class="matrix-tag">SOVEREIGN CAPABILITIES & WORKING CAPACITY</div>
      <div class="matrix-line"></div>
    </div>

    <!-- 2x2 Matrix -->
    <div class="cards-grid">
      <!-- Card 1 -->
      <div class="power-card">
        <div>
          <div class="card-top">
            <div class="card-icon">⚡</div>
            <div class="card-badge">1,000x SPEED</div>
          </div>
          <div class="card-title">AUTONOMOUS SOFTWARE TITAN</div>
        </div>
        <div class="card-desc">
          Replaces an entire 1,000-engineer IT firm. Deploys <b>production Web Apps, native Android APKs & Cloud APIs</b> in minutes.
        </div>
      </div>

      <!-- Card 2 -->
      <div class="power-card">
        <div>
          <div class="card-top">
            <div class="card-icon">🎯</div>
            <div class="card-badge">24/7 AUTONOMOUS</div>
          </div>
          <div class="card-title">FORENSIC REVENUE HUNTER</div>
        </div>
        <div class="card-desc">
          Scans global markets nonstop. Pinpoints exact client conversion holes & builds <b>custom Trojan architectural prototypes</b> to close high-ticket deals.
        </div>
      </div>

      <!-- Card 3 -->
      <div class="power-card">
        <div>
          <div class="card-top">
            <div class="card-icon">🛡️</div>
            <div class="card-badge">ZERO-DAY DEFENSE</div>
          </div>
          <div class="card-title">CYBERSHIELD & SELF-HEALING</div>
        </div>
        <div class="card-desc">
          Hostile security layer. Eliminates vulnerabilities in real-time, suppresses attacks & <b>self-repairs runtime failures</b> before downtime occurs.
        </div>
      </div>

      <!-- Card 4 -->
      <div class="power-card">
        <div>
          <div class="card-top">
            <div class="card-icon">🧠</div>
            <div class="card-badge">COGNITIVE SWARM</div>
          </div>
          <div class="card-title">OMNI-AGENT BOT-VERSE</div>
        </div>
        <div class="card-desc">
          Parallel multi-agent execution. Persistent memory synapses, neural voice synthesis & <b>browser automation with zero human fatigue</b>.
        </div>
      </div>
    </div>

    <!-- Wide Card -->
    <div class="wide-card">
      <div class="wide-icon">💎</div>
      <div class="wide-text">
        <div class="wide-heading">
          <span>THE SUPREME ANTI-FABRICATION DOCTRINE</span>
          <span class="card-badge">100% VERIFIED</span>
        </div>
        <div class="wide-desc">
          <b>Show > Tell.</b> Zero hallucinations, zero fake numbers. Every deliverable is proven with real working code, clean tests & verified SHA-256 binaries.
        </div>
      </div>
    </div>

    <!-- Bottom Sovereign CTA -->
    <div class="bottom-seal">
      <div class="mantra">ONE COMMAND • INFINITE INTELLIGENCE</div>
      <div class="royal-badge">
        <span>🌐 HTTPS://WWW.GARUDAOS.IN</span>
      </div>
      <div class="credentials">
        OFFICIAL SOVEREIGN PLATFORM • <b>FOUNDER PRAVEEN MAHAWAR</b>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const outputPath = 'D:\\\\GARUDA-AI\\\\output\\STATUS_POSTERS\\GARUDA_STATUS_MASTERPIECE_4K.png';
  
  console.log('Rendering Masterpiece 4K Status Poster...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1080,
    height: 1920,
    deviceScaleFactor: 2 // Generates true 2160 x 3840 Ultra HD 4K!
  });

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.screenshot({
    path: outputPath,
    type: 'png'
  });

  await browser.close();
  console.log('Masterpiece generated successfully at:', outputPath);
}

renderMasterpiece().catch(err => {
  console.error('Error rendering masterpiece:', err);
  process.exit(1);
});
