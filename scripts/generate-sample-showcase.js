const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const HTML_PATH = path.resolve(__dirname, "../frontend/dist/sample-preview.html");
const PNG_PATH_DATA = path.resolve(__dirname, "../data/creative-assets/war_room_sample_preview.png");
const PNG_PATH_ARTIFACT = "C:\\Users\\hp\\.gemini\\antigravity-cli\\brain\\c877ab8c-45f8-4814-ae0c-db52efac7c4f\\war_room_sample_preview.png";

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GARUDA OS War Room & Cadre PWA — Visual Typography Sample</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;0,900;1,600&family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #07080A;
      color: #F5F5F2;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 40px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      max-width: 1100px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 36px;
    }
    .header-banner {
      border-bottom: 1px solid rgba(196, 139, 40, 0.3);
      padding-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-banner h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 38px;
      font-weight: 700;
      color: #F5F1E8;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }
    .header-banner .tagline {
      font-size: 13px;
      color: #C48B28;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 28px;
    }
    .card {
      background: linear-gradient(180deg, #101318 0%, #0B0D11 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 28px;
      position: relative;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
    }
    .card-gold-border {
      border: 1px solid rgba(196, 139, 40, 0.35);
    }
    .eyebrow {
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #C48B28;
      text-transform: uppercase;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .serif-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.25;
      margin-bottom: 10px;
    }
    .sans-desc {
      font-size: 13px;
      line-height: 1.6;
      color: #9B9B98;
      margin-bottom: 20px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 20px;
    }
    .stat-box .num {
      font-family: 'Inter', sans-serif;
      font-size: 19px;
      font-weight: 800;
      color: #FFFFFF;
    }
    .stat-box .lbl {
      font-size: 10px;
      color: #6B7280;
      text-transform: uppercase;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .mono-audit-box {
      background: #060709;
      border: 1px solid rgba(196, 139, 40, 0.25);
      border-radius: 8px;
      padding: 12px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #C48B28;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mono-audit-box .audit-line {
      display: flex;
      justify-content: space-between;
    }
    .badge-verified {
      background: rgba(5, 150, 105, 0.15);
      color: #10B981;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
    }

    /* Cadre Mobile Preview Mockup */
    .cadre-shell {
      background: #08090C;
      border: 2px solid rgba(196, 139, 40, 0.4);
      border-radius: 24px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    }
    .cadre-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 12px;
    }
    .cadre-heartbeat-btn {
      width: 170px;
      height: 170px;
      border-radius: 50%;
      background: radial-gradient(circle, #059669 0%, #064E3B 100%);
      border: 5px solid rgba(255, 255, 255, 0.18);
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 8px auto;
      box-shadow: 0 0 35px rgba(5, 150, 105, 0.65);
    }
    .cadre-heartbeat-btn .btn-icon {
      font-size: 32px;
      margin-bottom: 4px;
    }
    .cadre-heartbeat-btn .btn-text {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .cadre-heartbeat-btn .btn-sub {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 700;
      margin-top: 2px;
    }
    .hardware-pills {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .pill {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 8px 10px;
      border-radius: 8px;
    }
    .pill .plbl {
      font-size: 9px;
      color: #6B7280;
      text-transform: uppercase;
    }
    .pill .pval {
      font-size: 12px;
      font-weight: 700;
      color: #F5F5F2;
      margin-top: 2px;
    }
  </style>
</head>
<body>

  <div class="container">
    
    <!-- HEADER -->
    <div class="header-banner">
      <div>
        <div class="tagline">GARUDA OS // TYPOGRAPHY & VISUAL STANDARD</div>
        <h1>Constituency War Room & Cadre PWA</h1>
      </div>
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8F6A2B; text-align: right;">
        PALETTE: OBSIDIAN / GRAPHITE / METALLIC GOLD<br>
        TRUTH LAW: 100% EVIDENCE BACKED
      </div>
    </div>

    <!-- MAIN GRID: DOSSIER (SERIF/SANS/MONO) + CADRE PWA (SANS/MONO) -->
    <div class="grid-2">

      <!-- LEFT: CLASSIFIED INTELLIGENCE DOSSIER (Playfair + Inter + JetBrains Mono) -->
      <div class="card card-gold-border">
        <div class="eyebrow">
          <span>🦅 GARUDA CONFIDENTIAL</span>
          <span>•</span>
          <span>LEVEL 4 SOVEREIGN DOSSIER</span>
        </div>

        <div class="serif-title">
          148 - Thane Assembly Constituency
        </div>

        <p class="sans-desc">
          Strategic Intelligence Dossier compiled under GARUDA Anti-Fabrication Law. Verified against official ECI gazette records, DEO Polling Booth list, and multi-cycle Form 20 EVM data.
        </p>

        <!-- STATS ROW (Inter Sans 800) -->
        <div class="stats-row">
          <div class="stat-box">
            <div class="num">3,42,618</div>
            <div class="lbl">Registered Electors</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color: #C48B28;">348 / 351</div>
            <div class="lbl">Gazetted / Cluster</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color: #10B981;">52.84%</div>
            <div class="lbl">Turnout Baseline</div>
          </div>
        </div>

        <!-- 12-SECTION SAMPLE SECTION WITH AUDIT REGISTRY -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; margin-bottom: 18px;">
          <div style="font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 700; color: #F5F1E8; margin-bottom: 6px;">
            Section 2: Polling Booth Hierarchy & Discrepancy Reconciliation
          </div>
          <p style="font-size: 12px; color: #9CA3AF; line-height: 1.5; margin-bottom: 10px;">
            DEO Thane official gazette documents 348 base stations. Operational cluster grouping aggregates 351 units (+3 auxiliary stations in high-density wards). Marked as UNKNOWN / REQUIRES VALIDATION in Evidence Drawer.
          </p>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #C48B28; display: flex; flex-wrap: wrap; gap: 8px;">
            <span>[SOURCE: DEO Thane Gazette]</span>
            <span>•</span>
            <span>[TRUTH: VERIFIED]</span>
            <span>•</span>
            <span>[CONFIDENCE: 95%]</span>
          </div>
        </div>

        <!-- MONOSPACE AUDIT LEDGER (JetBrains Mono) -->
        <div class="mono-audit-box">
          <div class="audit-line">
            <span>ARTIFACT SHA-256:</span>
            <span style="color: #FFFFFF;">43b9b2964c32b2498e980...</span>
          </div>
          <div class="audit-line">
            <span>DELIVERABLE STATUS:</span>
            <span class="badge-verified">ISO-PDF VERIFIED</span>
          </div>
          <div class="audit-line">
            <span>CAMPAIGN RETAINER:</span>
            <span style="color: #F59E0B; font-weight: 700;">₹35,00,000 (FLAGSHIP 50/30/20)</span>
          </div>
        </div>
      </div>

      <!-- RIGHT: CADRE FIELD PWA HANDSET (Inter + JetBrains Mono) -->
      <div class="cadre-shell">
        <div class="cadre-topbar">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">🦅</span>
            <div>
              <div style="font-size: 9.5px; font-weight: 800; color: #C48B28; letter-spacing: 1px;">CADRE FIELD PWA</div>
              <div style="font-size: 13px; font-weight: 700; color: #FFFFFF;">Booth #1 — Central Core</div>
            </div>
          </div>
          <span style="background: rgba(16,185,129,0.15); color: #10B981; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
            LIVE (&lt;60s)
          </span>
        </div>

        <!-- BIG 1-TAP ACTION BUTTON -->
        <div class="cadre-heartbeat-btn">
          <span class="btn-icon">🟢</span>
          <span class="btn-text">BOOTH ACTIVE</span>
          <span class="btn-sub">1-TAP HEARTBEAT</span>
        </div>

        <!-- HARDWARE PROBE PILLS (Inter & JetBrains Mono) -->
        <div class="hardware-pills">
          <div class="pill">
            <div class="plbl">Battery Level</div>
            <div class="pval" style="color: #10B981;">84% ⚡ (REAL)</div>
          </div>
          <div class="pill">
            <div class="plbl">Network Signal</div>
            <div class="pval" style="color: #3B82F6;">4G LTE (REAL)</div>
          </div>
          <div class="pill">
            <div class="plbl">Device ID</div>
            <div class="pval" style="font-family: 'JetBrains Mono', monospace; font-size: 10px;">GRD-CADRE-148-001</div>
          </div>
          <div class="pill">
            <div class="plbl">Anti-Replay Shield</div>
            <div class="pval" style="color: #10B981; font-size: 10px;">ACTIVE (TTL 300s)</div>
          </div>
        </div>

        <!-- SERVER ACK RECEIPT -->
        <div style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.25); border-radius: 8px; padding: 10px; font-size: 11px;">
          <div style="color: #10B981; font-weight: 700; margin-bottom: 2px;">
            ✅ SERVER ACKNOWLEDGEMENT
          </div>
          <div style="color: #9CA3AF; font-size: 10px; font-family: 'JetBrains Mono', monospace;">
            Ack: 2026-10-03T11:15:20Z | Skew: 12ms
          </div>
        </div>

        <div style="font-size: 10px; color: #6B7280; text-align: center;">
          Optimized for low-end Android handsets (Redmi / Realme / Jio)
        </div>
      </div>

    </div>

  </div>

</body>
</html>
`;

async function renderShowcase() {
  fs.writeFileSync(HTML_PATH, HTML_CONTENT, "utf8");
  console.log("✔ Sample HTML written to:", HTML_PATH);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 750, deviceScaleFactor: 2 });
  await page.setContent(HTML_CONTENT, { waitUntil: "networkidle0" });

  await page.screenshot({ path: PNG_PATH_DATA, fullPage: true });
  console.log("✔ PNG Screenshot saved to:", PNG_PATH_DATA);

  try {
    fs.copyFileSync(PNG_PATH_DATA, PNG_PATH_ARTIFACT);
    console.log("✔ PNG Screenshot copied to artifact directory:", PNG_PATH_ARTIFACT);
  } catch (e) {
    console.warn("Could not copy to artifact path:", e.message);
  }

  await browser.close();
}

renderShowcase().catch(err => {
  console.error("Rendering failed:", err);
  process.exit(1);
});
