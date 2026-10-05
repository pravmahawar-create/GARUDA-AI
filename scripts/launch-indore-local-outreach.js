/**
 * 🦅 GARUDA Indore High-Margin Local Business Outreach Engine (Stream 3)
 * 
 * Targets:
 * - Diagnostics & Pathology Labs (Home collection & automated report delivery)
 * - Real Estate Builders & Luxury Brokers (Instant brochure dispatch & site visit booking)
 * - CA & Tax Consultancy Firms (Monthly GST & ITR document collection PWA)
 * 
 * Dispatches:
 * 1. Generates frontend/public/indore_launcher.html
 * 2. Transmits all 1-Click WhatsApp links to Founder Praveen's Telegram (@Garudaos_AI_bot)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const telegram = require("../src/services/telegramBotService");

const DATA_DIR = path.join(__dirname, "..", "data");
const TARGETS_FILE = path.join(DATA_DIR, "indore-highmargin-targets.json");
const DASHBOARD_HTML = path.join(__dirname, "..", "frontend", "public", "indore_launcher.html");

function generateIndoreScript(target) {
  const scopingUrl = `https://www.garudaos.in/chat?ref=${target.id}`;

  if (target.category === "pathology_diagnostic") {
    return `*Namaste ${target.contactPerson}*,
Main Praveen Mahawar bol raha hoon (Founder, GARUDA AI Operating System - Indore).

Humne Indore ke premium diagnostic centres ka patient workflow study kiya hai:
*Problem:* Patients subah call karke Home Blood Collection book karte hain ya din bhar 'Report kab aayegi?' puchte hain. Front desk reception poori tarah busy ho jati hai.

*GARUDA 24/7 Solution for ${target.businessName}:*
1. Official WhatsApp par *24/7 AI Lab Assistant* jo home collection booking (address pin aur time slot) 10 second me confirm karta hai.
2. Lab software se connect hoke patient ki *PDF Report seedha unke WhatsApp par automatically deliver* karta hai.
3. Reception load 60% kam ho jata hai.

*Setup Fee:* ₹35,000 (50% advance ₹17,500). Setup in 48 hours.
Aapka live interactive demo Indore server par ready hai:
👉 ${scopingUrl}

Kya aaj 5-minute ka live walkthrough call karein?
- Praveen Mahawar (Founder, GARUDA OS | Indore)`;
  }

  if (target.category === "real_estate") {
    return `*Namaste ${target.contactPerson}*,
Main Praveen Mahawar bol raha hoon (Founder, GARUDA AI Operating System - Indore).

Indore real estate me ad budget ka sabse bada leakage:
*Problem:* Meta/Google ads se prospective property buyers shaam 8 PM ke baad message karte hain. Reception subah 11 baje brochure bhejti hai tab tak buyer ka interest 80% thanda ho chuka hota hai.

*GARUDA Instant Real Estate Node:*
1. WhatsApp par buyer ke aate hi *10 second me Master Layout Plan & Dynamic Pricing Sheet* dispatch.
2. Weekend *Site Visit slot confirmation* vehicle pickup ke saath.
3. High-intent NRI buyers ka instant alert aapke sales director ke WhatsApp par.

*Commercials:* Setup ₹35,000 - ₹45,000 (50% advance).
Aapka live demo yahan active hai:
👉 ${scopingUrl}

Kya aaj shaam 5-minute ka quick demo call karein?
- Praveen Mahawar (Founder, GARUDA OS)`;
  }

  // CA & Tax Firm
  return `*Namaste ${target.contactPerson}*,
Main Praveen Mahawar bol raha hoon (Founder, GARUDA AI Operating System - Indore).

Humne Indore ki leading CA firms ka monthly compliance audit kiya hai:
*Problem:* Har mahine 18 se 20 taareekh ko junior audit staff 150+ MSME clients ko din bhar phone karke GST purchase bills aur bank statements mangta hai. 4 din sirf follow-up me barbaad hote hain.

*GARUDA 1-Tap Client Document PWA:*
1. Har mahine 10th aur 15th ko client ke WhatsApp par automated polite reminder.
2. 1-Click secure document upload link (No app install needed).
3. Files auto-sorted client GSTIN aur financial year ke hisaab se seedha aapke server folder me.

*Setup Fee:* ₹30,000 (50% advance ₹15,000). Turnaround: 48 Hours.
Live Demo yahan test kijiye:
👉 ${scopingUrl}

Kya aaj 5-minute ka quick screen-share schedule karein?
- Praveen Mahawar (Founder, GARUDA OS)`;
}

async function runIndoreOutreach() {
  console.log("==================================================================");
  console.log("🦅 GARUDA INDORE HIGH-MARGIN LOCAL BUSINESS OUTREACH (STREAM 3)");
  console.log("==================================================================\n");

  const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, "utf8"));
  console.log(`Loaded ${targets.length} Verified Indore High-Margin Targets.\n`);

  const links = [];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const rawPhone = String(t.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const script = generateIndoreScript(t);
    const encodedText = encodeURIComponent(script);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    links.push({
      id: t.id,
      businessName: t.businessName,
      category: t.category,
      contact: t.contactPerson,
      phone: t.phone,
      dealSize: t.dealSize,
      waUrl,
      script
    });

    console.log(`[#${i + 1}] ${t.businessName} (${t.category.toUpperCase()})`);
    console.log(`  Contact: ${t.contactPerson} | Phone: +91 ${t.phone}`);
    console.log(`  Deal Size: ${t.dealSize}`);
    console.log(`  WhatsApp Link: ${waUrl.slice(0, 70)}...\n`);
  }

  // Generate HTML Launcher Dashboard
  const cardsHtml = links.map((l, idx) => `
    <div class="card">
      <div class="card-info">
        <div class="cat-tag">${l.category.replace('_', ' ').toUpperCase()}</div>
        <div class="card-title">#${idx + 1} ${l.businessName}</div>
        <div class="card-meta">Contact: <strong>${l.contact}</strong> • Phone: <strong>+91 ${l.phone}</strong></div>
        <div class="card-deal">Commercials: <span style="color:#34d399; font-weight:800;">${l.dealSize}</span></div>
      </div>
      <a class="btn-wa" target="_blank" href="${l.waUrl}">
        <span>💬</span>
        <span>Send via WhatsApp →</span>
      </a>
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GARUDA — Indore High-Margin Local Business Launcher</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #03070d;
      --card-bg: #07101c;
      --gold: #d4af37;
      --border: rgba(212, 175, 55, 0.35);
      --wa-green: #25d366;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 32px 20px; }
    .container { max-width: 920px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 24px; }
    h1 { font-family: 'Cinzel', serif; font-size: 24px; color: #fff; margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 13px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    }
    .cat-tag {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--gold);
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid var(--gold);
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .card-title { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 4px; }
    .card-meta { font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }
    .card-deal { font-size: 12px; font-family: 'JetBrains Mono', monospace; }
    .btn-wa {
      background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
      color: #fff;
      padding: 12px 22px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 800;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
    }
    .btn-wa:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(37, 211, 102, 0.6); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--gold); font-weight: 800; margin-bottom: 6px;">
        STREAM 3: INDORE HIGH-MARGIN GROUND ENGINE
      </div>
      <h1>Indore Local High-Margin Outreach Launcher</h1>
      <div class="subtitle">
        Pathology & Diagnostic Labs, Real Estate Builders, and Chartered Accountants in Indore. Click each button below to launch WhatsApp with pre-filled bespoke pitches.
      </div>
    </div>
    ${cardsHtml}
  </div>
</body>
</html>`;

  fs.writeFileSync(DASHBOARD_HTML, html, "utf8");
  console.log(`✔ Indore Launcher Dashboard saved to:\n  ${DASHBOARD_HTML}`);

  // Dispatch all 5 1-Click WhatsApp links to Founder Praveen's private Telegram!
  console.log("\n🦅 Dispatching Indore 1-Click Links to Founder Praveen's Telegram...");
  const introMsg = `🦅 *GARUDA STREAM 3: INDORE HIGH-MARGIN LOCAL DEALS*\n*Pathology Labs, Real Estate & CA Firms in Indore*\n\nNeeche diye har link par tap kijiye — phone ka WhatsApp pre-filled Indore pitch ke saath khul jayega. Bas *SEND* dabana hai:`;
  await telegram.sendMessage(introMsg);

  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    const cardMsg = `📍 *#${i + 1} ${l.businessName}* [${l.category.replace('_', ' ').toUpperCase()}]\n👤 *Contact:* ${l.contact}\n📞 *Phone:* +91 ${l.phone}\n💰 *Deal Size:* ${l.dealSize}\n\n👉 *Tap to Send WhatsApp:*\n${l.waUrl}`;
    await telegram.sendMessage(cardMsg);
    await new Promise((r) => setTimeout(r, 600));
  }

  const outroMsg = `✔ *Saare 5 Indore links ready hain!*\nInka ticket size ₹30,000 - ₹45,000 hai. Jaise hi koi reply kare, alert aa jayega!`;
  await telegram.sendMessage(outroMsg);
  console.log("✔ All Indore 1-Click Links Dispatched to Founder Telegram Successfully!");
}

if (require.main === module) {
  runIndoreOutreach().catch(console.error);
}

module.exports = { runIndoreOutreach };
