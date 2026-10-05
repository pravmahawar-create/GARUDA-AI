const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const BASE_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(BASE_DIR, "output");
const FRAMES_DIR = path.join(OUTPUT_DIR, "roadmap_frames");
const FFMPEG = path.join(BASE_DIR, "node_modules", "ffmpeg-static", "ffmpeg.exe");

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function buildAnimatedRoadmap() {
  console.log("🎬 [GARUDA ANIMATED ROADMAP] Initializing High-Tech Cyber Motion Engine...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  // 960 x 1232 provides ultra-crisp mobile LinkedIn 4:5 vertical scale while keeping GIF size light (< 5MB)
  await page.setViewport({ width: 960, height: 1232, deviceScaleFactor: 1 });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      width: 960px;
      height: 1232px;
      background: #090d13;
      color: #f0f6fc;
      padding: 30px 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }

    /* Cyber Scanline */
    .scanline {
      position: absolute;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.8) 50%, transparent 100%);
      box-shadow: 0 0 15px rgba(245, 158, 11, 0.9);
      pointer-events: none;
      z-index: 99;
    }

    /* Header */
    .header {
      border-bottom: 2px solid #21262d;
      padding-bottom: 18px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: #f59e0b;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }
    .main-title {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      line-height: 1.15;
      text-transform: uppercase;
    }
    .main-title span {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .author-sub {
      font-size: 13px;
      color: #8b949e;
      margin-top: 6px;
      font-weight: 500;
    }

    /* Stages Grid */
    .stages-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 16px 0;
    }

    .stage-row {
      display: grid;
      grid-template-columns: 175px 1fr;
      background: #121820;
      border: 1px solid #21262d;
      border-radius: 10px;
      padding: 12px 16px;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    /* Left Stage Number */
    .stage-label-box {
      display: flex;
      align-items: center;
      gap: 12px;
      border-right: 1px solid #21262d;
      padding-right: 12px;
    }
    .stage-num {
      width: 36px;
      height: 36px;
      background: #f59e0b;
      color: #000;
      font-size: 18px;
      font-weight: 900;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    }
    .stage-text h3 {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stage-text p {
      font-size: 10px;
      color: #8b949e;
      margin-top: 2px;
      line-height: 1.2;
    }

    /* Right Steps Flow */
    .steps-flow {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      align-items: center;
    }

    .step-card {
      background: #090d13;
      border: 1px solid #1f242c;
      border-radius: 8px;
      padding: 8px 6px;
      text-align: center;
      position: relative;
      min-height: 70px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .step-icon {
      font-size: 18px;
      margin-bottom: 4px;
      display: inline-block;
    }
    .step-title {
      font-size: 11px;
      font-weight: 700;
      color: #e6edf3;
      line-height: 1.2;
    }
    .step-desc {
      font-size: 9px;
      color: #7d8590;
      margin-top: 2px;
      line-height: 1.15;
    }

    /* Arrow between steps */
    .arrow-indicator {
      position: absolute;
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
      color: #f59e0b;
      font-size: 11px;
      font-weight: 900;
      z-index: 10;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #21262d;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .footer-logo {
      font-size: 16px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 1px;
    }
    .footer-logo span {
      color: #f59e0b;
    }
    .footer-meta {
      font-size: 11px;
      color: #8b949e;
    }
    .footer-tagline {
      font-size: 12px;
      font-weight: 700;
      color: #58a6ff;
    }
  </style>
</head>
<body>

  <!-- Animated Scanline -->
  <div class="scanline" id="scanline"></div>

  <!-- Header -->
  <div class="header">
    <div class="badge"><div class="live-dot"></div> Sovereign Autonomous Architecture · LIVE MOTION</div>
    <div class="main-title">7 Stages of a <span>Production-Ready</span> AI Operating System</div>
    <div class="author-sub">By Praveen Mahawar · Founder & Chief Sovereign Architect @ GARUDA OS (www.garudaos.in)</div>
  </div>

  <!-- 7 Stages Grid -->
  <div class="stages-grid">

    <!-- 1. DISCOVER -->
    <div class="stage-row" id="row-1">
      <div class="stage-label-box">
        <div class="stage-num">1</div>
        <div class="stage-text">
          <h3>DISCOVER</h3>
          <p>Forensic problem & latency modeling</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-1-1">🎯</div>
          <div class="step-title">Forensic Audit</div>
          <div class="step-desc">Target client leaks</div>
          <div class="arrow-indicator" id="arr-1-1">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-1-2">👤</div>
          <div class="step-title">Brand Persona</div>
          <div class="step-desc">Gulf luxury / Cyber</div>
          <div class="arrow-indicator" id="arr-1-2">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-1-3">⚡</div>
          <div class="step-title">Latency Targets</div>
          <div class="step-desc">Sub-second runtime</div>
          <div class="arrow-indicator" id="arr-1-3">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-1-4">🛡️</div>
          <div class="step-title">Founder Shield</div>
          <div class="step-desc">Zero privacy leakage</div>
        </div>
      </div>
    </div>

    <!-- 2. GOVERN -->
    <div class="stage-row" id="row-2">
      <div class="stage-label-box">
        <div class="stage-num">2</div>
        <div class="stage-text">
          <h3>GOVERN</h3>
          <p>Anti-fabrication & constitutional laws</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-2-1">⚖️</div>
          <div class="step-title">Anti-Fabrication</div>
          <div class="step-desc">Zero hallucination law</div>
          <div class="arrow-indicator" id="arr-2-1">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-2-2">🔒</div>
          <div class="step-title">Gatekeeping</div>
          <div class="step-desc">Founder commit lock</div>
          <div class="arrow-indicator" id="arr-2-2">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-2-3">🔄</div>
          <div class="step-title">State Machine</div>
          <div class="step-desc">Goal → Plan → Run</div>
          <div class="arrow-indicator" id="arr-2-3">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-2-4">🛑</div>
          <div class="step-title">Dietary Isolation</div>
          <div class="step-desc">Zero cultural leakage</div>
        </div>
      </div>
    </div>

    <!-- 3. CONNECT -->
    <div class="stage-row" id="row-3">
      <div class="stage-label-box">
        <div class="stage-num">3</div>
        <div class="stage-text">
          <h3>CONNECT</h3>
          <p>Provider-agnostic compute routing</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-3-1">🔌</div>
          <div class="step-title">Compute Router</div>
          <div class="step-desc">Local / Cloudflare</div>
          <div class="arrow-indicator" id="arr-3-1">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-3-2">🎙️</div>
          <div class="step-title">Neural Edge TTS</div>
          <div class="step-desc">Native Swara / Madhur</div>
          <div class="arrow-indicator" id="arr-3-2">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-3-3">🌐</div>
          <div class="step-title">24/7 Keep-Alive</div>
          <div class="step-desc">Render cloud server</div>
          <div class="arrow-indicator" id="arr-3-3">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-3-4">📡</div>
          <div class="step-title">Event Broker</div>
          <div class="step-desc">garudaEventService</div>
        </div>
      </div>
    </div>

    <!-- 4. ORCHESTRATE -->
    <div class="stage-row" id="row-4">
      <div class="stage-label-box">
        <div class="stage-num">4</div>
        <div class="stage-text">
          <h3>ORCHESTRATE</h3>
          <p>Multi-agent workforce swarms</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-4-1">👑</div>
          <div class="step-title">Mother Brain</div>
          <div class="step-desc">High-level decider</div>
          <div class="arrow-indicator" id="arr-4-1">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-4-2">🤖</div>
          <div class="step-title">1,000 Agents</div>
          <div class="step-desc">Parallel workforce</div>
          <div class="arrow-indicator" id="arr-4-2">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-4-3">🎬</div>
          <div class="step-title">Creative Director</div>
          <div class="step-desc">Scene-by-scene script</div>
          <div class="arrow-indicator" id="arr-4-3">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-4-4">📈</div>
          <div class="step-title">Quant Daemon</div>
          <div class="step-desc">5-factor scoring (75%)</div>
        </div>
      </div>
    </div>

    <!-- 5. SYNAPSE -->
    <div class="stage-row" id="row-5">
      <div class="stage-label-box">
        <div class="stage-num">5</div>
        <div class="stage-text">
          <h3>SYNAPSE</h3>
          <p>Durable memory & self-learning</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-5-1">🧠</div>
          <div class="step-title">Durable Journal</div>
          <div class="step-desc">1.52 MB experiences</div>
          <div class="arrow-indicator" id="arr-5-1">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-5-2">🚫</div>
          <div class="step-title">Zero Repetition</div>
          <div class="step-desc">lessons.jsonl store</div>
          <div class="arrow-indicator" id="arr-5-2">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-5-3">📊</div>
          <div class="step-title">Audit Ledger</div>
          <div class="step-desc">Immutable trade log</div>
          <div class="arrow-indicator" id="arr-5-3">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-5-4">🧬</div>
          <div class="step-title">Post-Mission</div>
          <div class="step-desc">Self-healing loop</div>
        </div>
      </div>
    </div>

    <!-- 6. VERIFY -->
    <div class="stage-row" id="row-6">
      <div class="stage-label-box">
        <div class="stage-num">6</div>
        <div class="stage-text">
          <h3>VERIFY</h3>
          <p>Pre-flight & cryptographic testing</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-6-1">🔍</div>
          <div class="step-title">Pre-Outreach</div>
          <div class="step-desc">HTTP 200 & title check</div>
          <div class="arrow-indicator" id="arr-6-1">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-6-2">🧪</div>
          <div class="step-title">Worktree Audit</div>
          <div class="step-desc">npm build pass (code 0)</div>
          <div class="arrow-indicator" id="arr-6-2">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-6-3">🔑</div>
          <div class="step-title">SHA-256 Hashes</div>
          <div class="step-desc">Verified artifact proof</div>
          <div class="arrow-indicator" id="arr-6-3">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-6-4">📱</div>
          <div class="step-title">ADB Hardware Run</div>
          <div class="step-desc">Clean native APK test</div>
        </div>
      </div>
    </div>

    <!-- 7. SHIP -->
    <div class="stage-row" id="row-7">
      <div class="stage-label-box">
        <div class="stage-num">7</div>
        <div class="stage-text">
          <h3>SHIP & SCALE</h3>
          <p>Autonomous delivery & client revenue</p>
        </div>
      </div>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-7-1">📦</div>
          <div class="step-title">Compiled APK</div>
          <div class="step-desc">Native Android v3.5</div>
          <div class="arrow-indicator" id="arr-7-1">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-7-2">🎥</div>
          <div class="step-title">Master MP4 Reel</div>
          <div class="step-desc">1080x1920 Full HD</div>
          <div class="arrow-indicator" id="arr-7-2">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-7-3">🧾</div>
          <div class="step-title">Billing Suite</div>
          <div class="step-desc">GST / Dexie offline PWA</div>
          <div class="arrow-indicator" id="arr-7-3">➔</div>
        </div>
        <div class="step-card">
          <div class="step-icon icon-anim" id="icon-7-4">💰</div>
          <div class="step-title">Revenue Cycle</div>
          <div class="step-desc">Settlement & scale</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">
      <div class="footer-logo">🦅 GARUDA <span>OS</span></div>
      <div class="footer-meta">India's Sovereign AI Operating System · 100% Anti-Fabrication Law</div>
    </div>
    <div class="footer-tagline">SHOW > TELL · WWW.GARUDAOS.IN</div>
  </div>

  <script>
    window.setAnimationState = function(t) {
      // t is progress from 0.0 to 1.0 (looping cycle)
      
      // 1. Move scanline down
      const scanline = document.getElementById('scanline');
      scanline.style.top = (t * 1232) + 'px';

      // 2. Pulse active stage row
      const activeStage = Math.floor(t * 7) + 1;
      for (let s = 1; s <= 7; s++) {
        const row = document.getElementById('row-' + s);
        if (s === activeStage) {
          row.style.borderColor = '#f59e0b';
          row.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.25)';
          row.style.background = '#18202b';
        } else {
          row.style.borderColor = '#21262d';
          row.style.boxShadow = 'none';
          row.style.background = '#121820';
        }
      }

      // 3. Animate arrows and icons in flow
      for (let s = 1; s <= 7; s++) {
        for (let step = 1; step <= 3; step++) {
          const arr = document.getElementById('arr-' + s + '-' + step);
          if (arr) {
            const phase = (t * 4 + s * 0.2 + step * 0.3) % 1;
            const glow = Math.sin(phase * Math.PI);
            arr.style.opacity = 0.3 + 0.7 * Math.max(0, glow);
            arr.style.transform = 'translateY(-50%) translateX(' + (glow * 4) + 'px)';
            arr.style.color = glow > 0.6 ? '#fbbf24' : '#f59e0b';
          }
        }

        for (let step = 1; step <= 4; step++) {
          const icon = document.getElementById('icon-' + s + '-' + step);
          if (icon) {
            const phase = (t * 2 + s * 0.3 + step * 0.25) % 1;
            const scale = 1 + 0.18 * Math.sin(phase * Math.PI);
            icon.style.transform = 'scale(' + scale + ')';
          }
        }
      }
    };
  </script>
</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: "load" });

  const TOTAL_FRAMES = 24; // 24 frames for smooth 2-second looping cycle
  console.log(`📸 Capturing ${TOTAL_FRAMES} high-definition frames...`);

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const t = f / TOTAL_FRAMES;
    await page.evaluate((progress) => window.setAnimationState(progress), t);
    const framePath = path.join(FRAMES_DIR, `frame_${String(f).padStart(3, "0")}.png`);
    await page.screenshot({ path: framePath, type: "png" });
  }

  await browser.close();
  console.log("✔ All frames captured cleanly!");

  // Compile to Animated GIF via FFmpeg
  const outputGif = path.join(OUTPUT_DIR, "garuda_7_stages_animated.gif");
  console.log("🎞️ Compiling animated GIF with custom palette optimization...");

  const ffmpegCmd = `"${FFMPEG}" -y -framerate 12 -i "${path.join(FRAMES_DIR, "frame_%03d.png")}" -vf "fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${outputGif}"`;

  execSync(ffmpegCmd);
  const stats = fs.statSync(outputGif);
  console.log(`🎉 ANIMATED GIF READY: ${outputGif} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

buildAnimatedRoadmap().catch(err => {
  console.error("❌ Error building animated roadmap:", err);
  process.exit(1);
});
