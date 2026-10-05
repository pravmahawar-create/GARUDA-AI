/**
 * 🦅 GARUDA Inbound Gig Radar & 1-Click Proposal Generator (Stream 2)
 * Generates an interactive High-Ticket Bid Dashboard for immediate client monetization.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const GIGS_FILE = path.join(DATA_DIR, "inbound-demand-gigs.json");
const DASHBOARD_HTML = path.join(__dirname, "..", "frontend", "public", "gigs_radar.html");

function generateDashboard() {
  console.log("🦅 Compiling Inbound High-Ticket Gig Radar Dashboard...");
  const gigs = JSON.parse(fs.readFileSync(GIGS_FILE, "utf8"));

  const cardsHtml = gigs.map((g, idx) => `
    <div class="gig-card">
      <div class="gig-header">
        <div>
          <span class="platform-badge">${g.platform}</span>
          <h2 class="gig-title">#${idx + 1} ${g.title}</h2>
          <div class="gig-meta">📍 Target Market: <strong>${g.clientLocation}</strong> • Budget: <span class="budget-badge">${g.budget}</span></div>
        </div>
      </div>
      
      <div class="req-box">
        <strong>Client Stated Need:</strong> "${g.clientRequirement}"
      </div>

      <div class="proposal-box">
        <div class="proposal-title">
          <span>⚡ GARUDA Pre-Engineered Winning Proposal:</span>
          <button class="btn-copy" onclick="copyProposal('prop_${g.id}')">📋 Copy 1-Tap</button>
        </div>
        <textarea id="prop_${g.id}" class="proposal-text" readonly>${g.garudaKillerProposal}</textarea>
      </div>
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GARUDA — High-Ticket Inbound Gig Radar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #03070d;
      --card-bg: #07101c;
      --gold: #d4af37;
      --gold-light: #fef08a;
      --cyan: #00f0ff;
      --border: rgba(212, 175, 55, 0.3);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      padding: 32px 20px;
    }
    .container { max-width: 960px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 24px; }
    h1 { font-family: 'Cinzel', serif; font-size: 26px; color: #fff; margin-bottom: 8px; letter-spacing: 0.05em; }
    .subtitle { color: var(--text-muted); font-size: 13px; }
    .gig-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    }
    .platform-badge {
      display: inline-block;
      background: rgba(0, 240, 255, 0.12);
      border: 1px solid var(--cyan);
      color: var(--cyan);
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .gig-title { font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1.4; }
    .gig-meta { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
    .budget-badge { color: #34d399; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
    .req-box {
      background: #040913;
      border-left: 3px solid var(--gold);
      padding: 12px 16px;
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    .proposal-box {
      background: #03060a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 14px;
    }
    .proposal-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--gold-light);
    }
    .btn-copy {
      background: linear-gradient(135deg, #d4af37 0%, #aa841e 100%);
      color: #04070a;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 11px;
      cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .btn-copy:hover { transform: translateY(-1px); box-shadow: 0 2px 10px rgba(212,175,55,0.5); }
    .proposal-text {
      width: 100%;
      height: 140px;
      background: transparent;
      border: none;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.6;
      resize: vertical;
      outline: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--gold); font-weight: 800; margin-bottom: 6px;">
        STREAM 2: INBOUND DEMAND RADAR
      </div>
      <h1>High-Ticket Winning Gig Proposal Kits</h1>
      <div class="subtitle">
        5 Pre-Engineered Bids with Live Working Demos on garudaos.in. Copy & paste in 10 seconds into Upwork, Contra, or direct client inboxes.
      </div>
    </div>
    ${cardsHtml}
  </div>

  <script>
    function copyProposal(id) {
      const el = document.getElementById(id);
      el.select();
      navigator.clipboard.writeText(el.value).then(() => {
        alert("✔ Copied to clipboard! Ready to paste into proposal submission.");
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(DASHBOARD_HTML, html, "utf8");
  console.log(`✔ Inbound Gig Radar Dashboard saved to:\n  ${DASHBOARD_HTML}`);
}

generateDashboard();
