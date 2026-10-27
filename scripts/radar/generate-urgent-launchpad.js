const fs = require('fs');
const path = require('path');

const urgentPath = path.join(__dirname, '..', '..', 'data', 'leads', 'urgent_screaming_buyers.json');
const deepPath = path.join(__dirname, '..', '..', 'data', 'leads', 'reddit_buyers_deep_contacts.json');
const activePath = path.join(__dirname, '..', '..', 'data', 'leads', 'live_reddit_buyers.json');

let urgentLeads = [];
if (fs.existsSync(urgentPath)) {
  try { urgentLeads = JSON.parse(fs.readFileSync(urgentPath, 'utf8')).leads || []; } catch(e){}
}

let activeBuyers = [];
if (fs.existsSync(activePath)) {
  try { activeBuyers = JSON.parse(fs.readFileSync(activePath, 'utf8')).buyers || []; } catch(e){}
}

// Compile list of top priority screaming/urgent buyers
const allTargets = [
  {
    type: "REDDIT_DM",
    title: "[Hiring] Remote AI model evaluation & finance tasks — $100–$150/hr",
    author: "BABABOEE13",
    budget: "$100 - $150 / hour",
    urgency: "HIGH TICKET AI WORKFLOW",
    dmUrl: "https://www.reddit.com/message/compose/?to=BABABOEE13&subject=Regarding%3A%20AI%20Model%20Evaluation%20%26%20Finance%20Workflow",
    postUrl: "https://www.reddit.com/r/forhire/comments/1x2pfv3/hiring_remote_financeconsulting_professionals_for/",
    pitch: `Hey /u/BABABOEE13,\n\nI saw your requirement for: "[Hiring] Remote finance/consulting professionals for AI model evaluation — $100–$150/hr".\n\nAt GARUDA OS, we build production software and automation engines designed for sub-second execution, zero latency, and verified resilience.\n\nHow we solve this immediately:\n1. Architecture: Clean typed codebase, reactive state management, and strict zero-bloat execution.\n2. Verified Delivery: 100% build verification, end-to-end integration tests, and SHA-certified deployments.\n3. Live Production Proof: https://www.garudaos.in\n\nWe can deploy a working prototype or proof-of-concept directly for you without lengthy agency delays.\nLet's connect if you want this solved cleanly.`
  },
  {
    type: "REDDIT_DM",
    title: "[Hiring] Urgent: Senior Python + C# Engineer, Remote (Global)",
    author: "Client (r/forhire)",
    budget: "$2,600 to $4,000 / month",
    urgency: "URGENT HIRING (ASAP)",
    dmUrl: "https://www.reddit.com/r/forhire/comments/1wzkvzs/hiring_paid_ads_client_manager_financial_advisor/",
    postUrl: "https://www.reddit.com/r/forhire/comments/1wzkvzs/hiring_paid_ads_client_manager_financial_advisor/",
    pitch: `Hey there,\n\nI saw your urgent requirement: "[Hiring] Urgent: Senior Python + C# Engineer, Remote (Global)".\n\nAt GARUDA OS, we build production-grade backends, high-concurrency microservices, and autonomous software with zero agency delays.\n\nHow we resolve this immediately:\n1. Senior Systems Architecture: Clean typed Python (FastAPI/AsyncIO) and C# (.NET Core) services.\n2. Sub-second performance & rigorous test verification.\n3. Live production proof: https://www.garudaos.in\n\nIf you need an immediate senior partner to step in today without ramp-up friction, let's talk.`
  },
  {
    type: "REDDIT_DM",
    title: "[Hiring] Certified Cybersecurity Freelancer / Penetration Tester",
    author: "IVII0",
    budget: "$500 - $1,200 Flat / $40-$80/hr",
    urgency: "COMPLIANCE & OWASP AUDIT",
    dmUrl: "https://www.reddit.com/message/compose/?to=IVII0&subject=Regarding%3A%20Cybersecurity%20Pentest%20%26%20Compliance",
    postUrl: "https://www.reddit.com/r/forhire/comments/1x1gmzx/hiring_certified_cybersecurity_freelancer/",
    pitch: `Hey /u/IVII0,\n\nI saw your requirement for authenticated web app pentest & DORA / OWASP ASVS compliance.\n\nAt GARUDA OS, our security architecture includes automated multi-tenant isolation verification, IDOR forensic scanning, and strict zero-trust boundary verification.\n\nWe can execute a forensic review and deliver an executive report with remediation code.\nLive capabilities & proof: https://www.garudaos.in\n\nLet's connect if you want this executed with precision.`
  },
  {
    type: "EMAIL",
    title: "Figma-to-Code & Comic Web Platform Build",
    author: "Osama Aman",
    email: "Osamaaman1998@gmail.com",
    budget: "Project Scope",
    urgency: "READY FOR BUILD",
    dmUrl: "mailto:Osamaaman1998@gmail.com?subject=Figma-to-Code%20%26%20Web%20Platform%20Build%20%5BGARUDA%20OS%5D",
    postUrl: "https://www.reddit.com/r/forhire",
    pitch: `Hi Osama,\n\nI saw your requirement on Reddit for a web developer to build a pixel-perfect website from your Figma design and comic web platform.\n\nWe build production-grade web systems at GARUDA OS with sub-second load times, 100/100 Lighthouse performance, and clean maintainable code (React / Next.js / HTML5).\n\nHow we execute:\n1. Exact 1-to-1 fidelity with your Figma layouts and mobile responsiveness.\n2. Clean, bloat-free code with zero layout shift.\n3. Rapid 48-hour delivery on staging for your review.\n\nLive architecture proof: https://www.garudaos.in\n\nIf you'd like to share the Figma file or project brief, I can review it immediately and provide a turnaround preview.\n\nBest regards,\nPraveen Mahawar\nFounder & Chief Architect — GARUDA OS\nOfficial Email: praveen@garudaos.in | Web: https://www.garudaos.in`
  },
  {
    type: "EMAIL",
    title: "Senior Web & Functional Frontend Development Partner",
    author: "Andrew (Variance Agency)",
    email: "andrew@variance.agency",
    budget: "$3,000 - $5,000 Scope",
    urgency: "AGENCY PARTNER CAPACITY",
    dmUrl: "mailto:andrew@variance.agency?subject=Senior%20Web%20%26%20Frontend%20Partner%20%5BGARUDA%20OS%5D",
    postUrl: "https://www.reddit.com/r/hiredev",
    pitch: `Hi Andrew,\n\nI saw Variance Agency's requirement for a senior technical web partner to handle complex responsive frontends and digital builds.\n\nAt GARUDA OS, we act as a force multiplier for agencies needing senior capacity without recruitment overhead:\n- 100% typed, resilient frontend code (React, Next.js, TypeScript).\n- Sub-second performance, strict viewport locking, and zero flicker.\n- Proven delivery with SHA-256 verification before handover.\n\nLive proof & portfolio: https://www.garudaos.in\n\nHappy to take on an initial milestone or overflow build to demonstrate speed and code quality.\n\nBest regards,\nPraveen Mahawar\nFounder & Chief Architect — GARUDA OS`
  },
  {
    type: "EMAIL",
    title: "Shopify & E-Commerce Web Engineering",
    author: "Tigerbelly Studio",
    email: "thetigerbelly@gmail.com",
    budget: "E-Com Overhaul",
    urgency: "CONVERSION & MOBILE SPEED",
    dmUrl: "mailto:thetigerbelly@gmail.com?subject=Shopify%20%26%20E-Commerce%20Web%20Engineering%20%5BGARUDA%20OS%5D",
    postUrl: "Direct Signal",
    pitch: `Hi Tigerbelly Team,\n\nI reviewed your e-commerce platform and store performance requirements.\n\nAt GARUDA OS, we engineer custom Shopify and headless e-commerce architectures optimized for sub-second mobile checkout, zero render lag, and verified uptime.\n\nWe eliminate cart abandonment bottlenecks and optimize Core Web Vitals to 95+.\nLive reference: https://www.garudaos.in\n\nLet's connect if you want a technical audit of your conversion funnel.\n\nBest regards,\nPraveen Mahawar\nFounder — GARUDA OS`
  }
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GARUDA OS — URGENT BUYER DISPATCH LAUNCHPAD</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #475569;
      --gold: #b45309;
      --emerald: #059669;
      --rose: #dc2626;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); padding: 24px 16px; }
    .container { max-width: 900px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
    .badge { background: #fef3c7; color: #92400e; font-weight: 800; font-size: 12px; padding: 6px 12px; border-radius: 20px; border: 1px solid #fde047; }
    .grid { display: flex; flex-direction: column; gap: 14px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 10px; }
    .card:hover { border-color: var(--gold); }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .card-title { font-size: 16px; font-weight: 800; color: #0f172a; }
    .card-meta { display: flex; gap: 10px; font-size: 12px; font-weight: 600; margin-top: 4px; color: var(--text-muted); }
    .budget-tag { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--emerald); background: #ecfdf5; padding: 2px 8px; border-radius: 6px; }
    .urgency-tag { color: var(--rose); font-weight: 700; }
    .actions { display: flex; gap: 10px; margin-top: 8px; }
    .btn { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; }
    .btn-secondary { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
    .btn:active { transform: scale(0.97); }
    .pitch-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #334155; white-space: pre-wrap; display: none; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🦅 GARUDA OS — URGENT TECH BUYERS</h1>
        <p style="font-size:13px; color:var(--text-muted); margin-top:3px">Direct 1-Click Launchpad for Clients Screaming for Urgent Help</p>
      </div>
      <span class="badge">🔥 100% IN-MARKET BUYERS</span>
    </header>

    <div class="grid">
      ${allTargets.map((t, idx) => `
        <div class="card">
          <div class="card-top">
            <div>
              <div class="card-title">${t.title}</div>
              <div class="card-meta">
                <span>Target: <strong>${t.author}</strong></span>
                <span>•</span>
                <span class="budget-tag">${t.budget}</span>
                <span>•</span>
                <span class="urgency-tag">⚡ ${t.urgency}</span>
              </div>
            </div>
            <span style="font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; background:${t.type === 'EMAIL' ? '#e0e7ff; color:#3730a3;' : '#ffedd5; color:#9a3412;'}">${t.type}</span>
          </div>

          <div class="actions">
            <a href="${t.dmUrl}" target="_blank" class="btn btn-primary">
              🚀 1-Click Shoot ${t.type === 'EMAIL' ? 'Email' : 'Reddit DM'}
            </a>
            <button class="btn btn-secondary" onclick="togglePitch('pitch-${idx}', this)">
              👁️ View Surgical Pitch
            </button>
            <button class="btn btn-secondary" onclick="copyText('pitch-text-${idx}')">
              📋 Copy Pitch Text
            </button>
          </div>

          <div id="pitch-${idx}" class="pitch-box">
            <div id="pitch-text-${idx}">${t.pitch}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    function togglePitch(id, btn) {
      const el = document.getElementById(id);
      if (el.style.display === 'block') {
        el.style.display = 'none';
        btn.textContent = '👁️ View Surgical Pitch';
      } else {
        el.style.display = 'block';
        btn.textContent = 'Hide Pitch';
      }
    }
    function copyText(id) {
      const txt = document.getElementById(id).innerText;
      navigator.clipboard.writeText(txt);
      alert('Surgical Pitch Copied to Clipboard! Ready to paste into Reddit/Email.');
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', '..', 'data', 'leads', 'urgent_buyers_launchpad.html'), html, 'utf8');
console.log('✅ Generated data/leads/urgent_buyers_launchpad.html successfully!');
