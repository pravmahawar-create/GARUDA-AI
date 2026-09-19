/**
 * 🦅 GARUDA SOVEREIGN DEMO FORGE: INSTANT CLIENT DEMO GENERATOR
 * Generates ultra-sleek, mobile-first, high-converting preview landing pages
 * for every qualified local business lead in data/local_hunter_leads.json.
 * 
 * Each demo contains:
 * - Dynamic branding & local contact info
 * - 24/7 AI Concierge widget (GARUDA powered)
 * - 1-Click WhatsApp appointment booking
 * - Verified Google Maps rating badge
 * - "Upar-Neeche Lock" zero-flicker mobile responsive standard
 */

const fs = require("fs");
const path = require("path");

const LEADS_FILE = path.join(__dirname, "..", "..", "data", "local_hunter_leads.json");
const DEMOS_DIR = path.join(__dirname, "..", "..", "public", "demos");
const FRONTEND_DEMOS_DIR = path.join(__dirname, "..", "..", "frontend", "public", "demos");

[DEMOS_DIR, FRONTEND_DEMOS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function getNicheConfig(niche) {
  const n = String(niche || "").toLowerCase();
  if (n.includes("car detailing") || n.includes("ceramic")) {
    return {
      heroTag: "AUTOMOTIVE AESTHETIC STUDIO",
      tagline: "Ultra-Premium Paint Protection Film (PPF), Ceramic Coating & Forensic Detailing",
      accentColor: "#f59e0b", // Amber gold
      badge: "Indore's Top Rated Auto Studio",
      services: [
        { title: "Self-Healing PPF (TPU)", desc: "5-10 Year warranty, ultra-gloss scratch resistant shield.", price: "From ₹35,000" },
        { title: "9H Graphene Ceramic Coating", desc: "Permanent hydrophobic gloss and deep mirror reflection.", price: "From ₹14,999" },
        { title: "Forensic Interior Spa", desc: "Anti-bacterial steam sterilization & leather conditioning.", price: "From ₹3,499" },
        { title: "Paint Correction & Swirl Removal", desc: "3-Stage rotary cut & polish restoring showroom clarity.", price: "From ₹5,999" }
      ]
    };
  } else if (n.includes("dental")) {
    return {
      heroTag: "ADVANCED DENTAL & IMPLANT CLINIC",
      tagline: "Painless Digital Dentistry, Smile Designing & Lifetime Dental Implants",
      accentColor: "#06b6d4", // Cyan medical
      badge: "Painless Laser Dentistry",
      services: [
        { title: "Digital Smile Designing (Veneers)", desc: "Celebrity smile makeover with 3D digital precision.", price: "Custom Plan" },
        { title: "Immediate Dental Implants", desc: "Same-day fixed teeth with Swiss implant technology.", price: "From ₹18,000" },
        { title: "Invisible Clear Aligners", desc: "Zero-wire invisible teeth straightening in 6 months.", price: "EMI Available" },
        { title: "Root Canal Treatment (Single Sitting)", desc: "100% painless rotary laser endodontics.", price: "From ₹3,500" }
      ]
    };
  } else if (n.includes("salon") || n.includes("spa")) {
    return {
      heroTag: "LUXURY HAIR & BEAUTY LOUNGE",
      tagline: "Bespoke Styling, Organic Skin Rituals & VIP Bridal Makeovers",
      accentColor: "#ec4899", // Rose pink
      badge: "Celebrity Stylists & Therapists",
      services: [
        { title: "Bespoke Hair Keratin & Botoplex", desc: "Formaldehyde-free mirror shine and intense hydration.", price: "From ₹4,999" },
        { title: "HydraFacial Glow MD", desc: "Deep pore suction, lymphatic drainage and peptide infusion.", price: "From ₹2,999" },
        { title: "VIP Bridal & Groom Lounge", desc: "Complete head-to-toe couture styling packages.", price: "From ₹14,999" },
        { title: "Aroma Hot Stone Spa Therapy", desc: "60-minute stress-release deep muscle therapy.", price: "From ₹2,499" }
      ]
    };
  } else {
    return {
      heroTag: "PREMIUM LIFESTYLE STUDIO",
      tagline: "Transformative Quality, Exceptional Service & Guaranteed Results",
      accentColor: "#6366f1", // Indigo
      badge: "Verified Local Excellence",
      services: [
        { title: "VIP Consultation", desc: "In-depth personalized analysis and custom roadmap.", price: "Free Initial Call" },
        { title: "Signature Experience", desc: "Our highest rated flagship service package.", price: "Best Value" },
        { title: "Rapid Express Service", desc: "Zero-wait priority scheduling for busy professionals.", price: "On Demand" }
      ]
    };
  }
}

function generateHtml(lead) {
  const cfg = getNicheConfig(lead.niche);
  let cleanPhone = String(lead.phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waMsg = encodeURIComponent(`Hi ${lead.businessName}, I saw your website and want to book a VIP appointment.`);
  const waLink = `https://wa.me/${waPhone}?text=${waMsg}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${lead.businessName} — Official Direct Booking Portal</title>
  <meta name="description" content="${lead.businessName} in ${lead.city}. ${cfg.tagline}. Book direct online.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent: ${cfg.accentColor};
      --bg: #090d16;
      --card: rgba(18, 24, 38, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    html, body {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .app-container {
      max-width: 540px;
      margin: 0 auto;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(6, 182, 212, 0.08), transparent 40%),
                  #090d16;
      border-left: 1px solid rgba(255,255,255,0.05);
      border-right: 1px solid rgba(255,255,255,0.05);
      position: relative;
    }
    /* Fixed Top Header */
    .top-header {
      position: sticky;
      top: 0;
      z-index: 40;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background: rgba(9, 13, 22, 0.85);
      border-bottom: 1px solid var(--border);
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .live-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #10b981;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 4px 10px;
      border-radius: 999px;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    /* Main Content */
    .content-body {
      flex: 1;
      padding: 20px 18px 110px 18px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .hero-box {
      padding: 24px 20px;
      background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      position: relative;
      overflow: hidden;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 10px;
    }
    .hero-heading {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.25;
      color: #fff;
      margin-bottom: 10px;
    }
    .hero-sub {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .metrics-row {
      display: flex;
      gap: 12px;
      margin-top: 10px;
    }
    .metric-pill {
      flex: 1;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.06);
      padding: 10px;
      border-radius: 12px;
      text-align: center;
    }
    .metric-val {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .metric-lbl {
      font-size: 10px;
      color: var(--muted);
      margin-top: 2px;
    }
    /* Services Section */
    .section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .service-card {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: transform 0.16s ease, border-color 0.16s ease;
    }
    .service-card:active {
      transform: scale(0.98);
      border-color: var(--accent);
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .service-name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .service-price {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      background: rgba(245, 158, 11, 0.1);
      padding: 3px 8px;
      border-radius: 8px;
    }
    .service-desc {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.4;
    }
    /* AI Assistant Card */
    .ai-card {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08));
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 18px;
      border-radius: 18px;
    }
    .ai-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .ai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #fff;
    }
    .ai-bubble {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 12px;
      color: #e2e8f0;
      line-height: 1.5;
    }
    .ai-input-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .ai-input {
      flex: 1;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-size: 12px;
      outline: none;
    }
    .ai-send-btn {
      background: var(--accent);
      color: #000;
      border: none;
      padding: 0 16px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    /* Fixed Bottom Action Bar */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-width: 540px;
      margin: 0 auto;
      z-index: 50;
      background: rgba(9, 13, 22, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border);
      padding: 14px 18px;
      display: flex;
      gap: 10px;
    }
    .cta-btn {
      flex: 1;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
      transition: transform 0.16s ease;
    }
    .cta-btn:active {
      transform: scale(0.97);
    }
    .phone-btn {
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border);
      color: #fff;
      padding: 14px 16px;
      border-radius: 14px;
      text-decoration: none;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .watermark-badge {
      text-align: center;
      font-size: 10px;
      color: rgba(255,255,255,0.25);
      letter-spacing: 0.05em;
      margin-top: 10px;
    }
  </style>
</head>
<body>

<div class="app-container">
  <!-- Top Header -->
  <header class="top-header">
    <div class="brand-title">${lead.businessName}</div>
    <div class="live-status">
      <div class="status-dot"></div>
      <span>OPEN TODAY</span>
    </div>
  </header>

  <!-- Body -->
  <main class="content-body">
    <!-- Hero Box -->
    <div class="hero-box">
      <div class="hero-badge">⚡ ${cfg.badge}</div>
      <h1 class="hero-heading">${lead.businessName}</h1>
      <p class="hero-sub">${cfg.tagline} in ${lead.city}. Instant VIP online slot confirmation.</p>

      <div class="metrics-row">
        <div class="metric-pill">
          <div class="metric-val">⭐ ${lead.rating}</div>
          <div class="metric-lbl">Google Maps</div>
        </div>
        <div class="metric-pill">
          <div class="metric-val">${lead.reviews}+</div>
          <div class="metric-lbl">Verified Reviews</div>
        </div>
        <div class="metric-pill">
          <div class="metric-val">100%</div>
          <div class="metric-lbl">Direct Priority</div>
        </div>
      </div>
    </div>

    <!-- Services -->
    <div class="section-title">
      <span>Our Featured Services</span>
      <span style="font-size: 11px; color: var(--accent); font-weight: 600;">Transparent Pricing</span>
    </div>

    ${cfg.services
      .map(
        (s) => `
    <div class="service-card">
      <div class="service-header">
        <span class="service-name">${s.title}</span>
        <span class="service-price">${s.price}</span>
      </div>
      <p class="service-desc">${s.desc}</p>
    </div>`
      )
      .join("\n")}

    <!-- AI Concierge Widget -->
    <div class="ai-card">
      <div class="ai-header">
        <div class="ai-avatar">🦅</div>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: #fff;">24/7 AI Concierge</div>
          <div style="font-size: 11px; color: #a5b4fc;">Powered by GARUDA Autonomous Intelligence</div>
        </div>
      </div>
      <div class="ai-bubble" id="ai-reply">
        Namaste! Main <strong>${lead.businessName}</strong> ka 24/7 AI Assistant hoon. Kisi bhi service ki booking, rate card ya timings ke baare me puchiye!
      </div>
      <div class="ai-input-row">
        <input type="text" id="ai-query" class="ai-input" placeholder="e.g. Aaj appointment kab mil sakti hai?">
        <button class="ai-send-btn" onclick="askAi()">Ask</button>
      </div>
    </div>

    <!-- Location & Contact -->
    <div class="service-card" style="margin-top: 10px;">
      <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px;">📍 Studio Location</div>
      <p class="service-desc">${lead.address}</p>
      <div style="margin-top: 6px; font-size: 12px; color: var(--accent); font-weight: 600;">📞 Direct Line: ${lead.phone || "Available on request"}</div>
    </div>

    <div class="watermark-badge">
      ⚡ ARCHITECTED BY GARUDA OS • SOVEREIGN PERFORMANCE STANDARD
    </div>
  </main>

  <!-- Bottom Navigation Action Bar -->
  <div class="bottom-bar">
    <a href="tel:${lead.phone}" class="phone-btn" title="Direct Phone Call">📞</a>
    <a href="${waLink}" target="_blank" class="cta-btn">
      <span>💬 Book on WhatsApp</span>
    </a>
  </div>
</div>

<script>
  function askAi() {
    const input = document.getElementById('ai-query');
    const reply = document.getElementById('ai-reply');
    const val = input.value.trim();
    if (!val) return;
    reply.innerHTML = "Thinking...";
    setTimeout(() => {
      reply.innerHTML = "Aapka message receive ho gaya hai! VIP slots available hain. Niche <strong>Book on WhatsApp</strong> button par tap kijiye direct confirm karne ke liye.";
      input.value = "";
    }, 600);
  }
</script>

</body>
</html>`;
}

function buildAllDemos() {
  if (!fs.existsSync(LEADS_FILE)) {
    console.error("❌ Leads file not found. Run local-radar-hunter.js first.");
    return [];
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  console.log(`🦅 [GARUDA DEMO FORGE] Generating preview sites for ${leads.length} leads...`);

  const generated = [];

  for (const lead of leads) {
    const html = generateHtml(lead);

    [DEMOS_DIR, FRONTEND_DEMOS_DIR].forEach((baseDir) => {
      const clientDir = path.join(baseDir, lead.slug);
      if (!fs.existsSync(clientDir)) fs.mkdirSync(clientDir, { recursive: true });
      fs.writeFileSync(path.join(clientDir, "index.html"), html, "utf8");
    });

    const previewUrl = `/demos/${lead.slug}/index.html`;
    generated.push({
      businessName: lead.businessName,
      slug: lead.slug,
      previewUrl,
      phone: lead.phone,
      instagramHandle: lead.instagramHandle,
      defectType: lead.defectType
    });
    console.log(`   ✔ Built Demo: [${lead.slug}] -> ${previewUrl}`);
  }

  console.log(`\n🎉 Successfully forged ${generated.length} live client demo portals!`);
  return generated;
}

if (require.main === module) {
  buildAllDemos();
}

module.exports = { buildAllDemos, generateHtml };
