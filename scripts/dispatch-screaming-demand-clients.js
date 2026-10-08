/**
 * 🦅 GARUDA SOVEREIGN SCREAMING-NEED CLIENT DISPATCHER
 * Directly connects with clients actively posting urgent hiring/contract needs for web & app developers.
 * 
 * Enforced:
 * - 100% Anti-Fabrication Law: Sent from verified praveen@garudaos.in via Zoho SMTP
 * - Executive Visual Brief: High-contrast responsive dark theme with bespoke pricing & scope
 * - Founder Personal Number Shield: Zero personal phone number in public outreach
 * - Dual Alert: Instant notification to Founder Praveen on Telegram and WhatsApp upon dispatch
 */

require("dotenv").config();
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const telegram = require("../src/services/telegramBotService");
const { sendFounderWhatsAppAlert } = require("../src/services/whatsappCloudService");

const LOG_FILE = path.join(__dirname, "..", "data", "leads", "screaming_clients_dispatch_log.json");

const SMTP_CONFIG = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
    pass: process.env.GARUDA_EMAIL_PASS
  }
};

const FROM_HEADER = `"Praveen Mahawar — GARUDA AI Operating System" <${SMTP_CONFIG.auth.user}>`;

const SCREAMING_CLIENTS = [
  {
    id: "SCREAMING_01_OSAMA_FIGMA",
    name: "Osama Aman",
    to: "Osamaaman1998@gmail.com",
    subject: "Osama — Pixel-Perfect Figma-to-Code Web Build & Reader Architecture",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B0F17;border:1px solid #10B981;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#062C22 0%,#0B0F17 100%);border-bottom:1px solid rgba(16,185,129,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#10B981;text-transform:uppercase;">FULL-STACK PRODUCTION BENCH • RAPID SPRINT</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Pixel-Perfect Figma-to-Code & Web Build</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hi Osama,</p>
      <p>I saw your requirement regarding building a clean, responsive static website from your existing Figma design, as well as your comic web platform build.</p>
      
      <div style="background:#061A14;border-left:4px solid #10B981;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
        <span style="display:block;font-size:11px;font-weight:700;color:#6EE7B7;text-transform:uppercase;margin-bottom:4px;">⚡ How We Execute This:</span>
        <span style="font-size:13px;color:#E2E8F0;">
        1. <b>100% Pixel Fidelity:</b> 1-to-1 match with your Figma layers, typography, and spacing without bloated CSS frameworks.<br>
        2. <b>Ultra-Fast 100/100 Lighthouse:</b> Sub-second asset loading, zero layout shift (CLS: 0), fully responsive across desktop, tablet, and mobile.<br>
        3. <b>Clean Semantic Code:</b> Production-ready HTML5/CSS/JavaScript or modern React/Next.js ready for immediate hosting on Vercel/GitHub Pages.
        </span>
      </div>

      <table width="100%" cellspacing="0" cellpadding="10" style="margin:20px 0;border:1px solid #1E293B;border-radius:8px;background:#060A12;">
        <tr style="border-bottom:1px solid #1E293B;">
          <td style="font-size:13px;font-weight:700;color:#FFFFFF;">Figma-to-Code Production Sprint</td>
          <td align="right" style="font-size:13px;font-weight:800;color:#10B981;">Fixed Milestone (48h Delivery)</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size:12px;color:#94A3B8;padding-top:4px;">Includes clean modular structure, interactive navigation, and full deployment setup. 100% review sign-off guarantee.</td>
        </tr>
      </table>

      <p>Live Architecture Proof & Portfolio: <a href="https://www.garudaos.in" style="color:#10B981;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Send over your Figma link or requirements, and I can have a working staging link ready for you to preview within 24 hours.</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief Architect &middot; GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  },
  {
    id: "SCREAMING_02_ROUGE_OASIS",
    name: "Rouge / Oasis Beauty Spas",
    to: "rouge@oasisbeautyspas.com",
    subject: "Urgent Web Developer for Oasis Beauty Spas — High-Speed Booking & Luxury Experience",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B0F17;border:1px solid #E2A398;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#2A1715 0%,#0B0F17 100%);border-bottom:1px solid rgba(226,163,152,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#E2A398;text-transform:uppercase;">LUXURY WELLNESS & SPA • RAPID DEPLOYMENT</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Oasis Beauty Spas — High-Conversion Digital Presence</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hi Rouge,</p>
      <p>I saw your urgent call for a dedicated web developer for your Oasis Beauty Spas project. We are ready to jump in immediately and deliver the complete build.</p>
      
      <div style="background:#1B0F0E;border-left:4px solid #E2A398;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
        <span style="display:block;font-size:11px;font-weight:700;color:#FBD0C9;text-transform:uppercase;margin-bottom:4px;">🌸 Core Capabilities We Bring:</span>
        <span style="font-size:13px;color:#E2E8F0;">
        1. <b>Luxury Aesthetic:</b> Editorial typography, high-end photography pacing, and smooth mobile micro-interactions that match a premier beauty and spa brand.<br>
        2. <b>Frictionless Client Booking:</b> 1-Tap appointment scheduling and treatment menu browsing with zero confusing checkout steps.<br>
        3. <b>Immediate Delivery:</b> We work in focused 48–72 hour sprints so you don't lose days waiting for traditional agencies.
        </span>
      </div>

      <p>Live Architecture Proof: <a href="https://www.garudaos.in" style="color:#E2A398;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Can you share a brief overview of the project scope or wireframes? I can review them right away and share a turnaround roadmap.</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief Architect &middot; GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  },
  {
    id: "SCREAMING_03_ANDREW_VARIANCE",
    name: "Andrew (Variance Agency)",
    to: "andrew@variance.agency",
    subject: "Andrew — Senior Web Developer & Functional Design Partner for Variance Agency",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B0F17;border:1px solid #6366F1;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#1E1B4B 0%,#0B0F17 100%);border-bottom:1px solid rgba(99,102,241,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#818CF8;text-transform:uppercase;">AGENCY DELIVERY BENCH • FULL-STACK CAPACITY</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Variance Agency — Reliable Developer & Functional Design Partner</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hi Andrew,</p>
      <p>Saw your post looking for a website designer and web developer to build clean, functional websites for your agency pipeline.</p>
      
      <div style="background:#0F172A;border-left:4px solid #6366F1;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
        <span style="display:block;font-size:11px;font-weight:700;color:#C7D2FE;text-transform:uppercase;margin-bottom:4px;">🚀 How We Support Agency Owners:</span>
        <span style="font-size:13px;color:#E2E8F0;">
        1. <b>Zero Handholding:</b> Give us a Figma or client brief, and we deliver fully tested, responsive code with 100% test coverage.<br>
        2. <b>Modern Stack:</b> React 19, Next.js, Node.js, Tailwind, clean vanilla CSS/JS, and seamless API integrations.<br>
        3. <b>Predictable Turnarounds:</b> 48-hour turnarounds on standard landing pages; structured sprint milestones for complex apps.
        </span>
      </div>

      <p>Our Production Platform: <a href="https://www.garudaos.in" style="color:#818CF8;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Happy to take on an initial test ticket or discuss an ongoing overflow arrangement at your standard rates ($30/hr or fixed sprint milestones).</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief Architect &middot; GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  },
  {
    id: "SCREAMING_04_VIJAY_QOLAR",
    name: "Vijay (Qolar)",
    to: "vijay@qolar.in",
    subject: "Vijay — Full-Stack Mobile & Web App Architecture (Production-Ready Sprint)",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B0F17;border:1px solid #38BDF8;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#0C2A4D 0%,#0B0F17 100%);border-bottom:1px solid rgba(56,189,248,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#38BDF8;text-transform:uppercase;">FULL-STACK APP ARCHITECTURE • FAST TURNAROUND</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Cross-Platform App Development & Backend Engineering</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hi Vijay,</p>
      <p>Saw your requirement for an experienced App Developer for Qolar. We engineer high-performance mobile (Android/iOS) and web applications with bulletproof backend architecture.</p>
      
      <div style="background:#081B2E;border-left:4px solid #38BDF8;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
        <span style="display:block;font-size:11px;font-weight:700;color:#BAE6FD;text-transform:uppercase;margin-bottom:4px;">⚙️ Engineering Stack:</span>
        <span style="font-size:13px;color:#E2E8F0;">
        • Cross-platform React Native / Capacitor / PWA with 60 FPS gesture fluidics.<br>
        • Scalable Node.js & Express REST/GraphQL backend with sub-second API latency.<br>
        • Real-time synchronization, push notifications, and payment gateway integrations.
        </span>
      </div>

      <p>Live Architecture Proof: <a href="https://www.garudaos.in" style="color:#38BDF8;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Would love to understand the core features of your app and see how we can ship your version 1 ahead of schedule. When is a good time for a brief 10-minute technical sync?</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief Architect &middot; GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  },
  {
    id: "SCREAMING_05_VEXO_STUDIO",
    name: "Vexo Studio",
    to: "vexo.studio12@gmail.com",
    subject: "Full-Stack Web & Mobile Developer Bench for Vexo Studio (Immediate Availability)",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B0F17;border:1px solid #A855F7;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#2E1065 0%,#0B0F17 100%);border-bottom:1px solid rgba(168,85,247,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#C084FC;text-transform:uppercase;">FULL-STACK ENGINEERING • CONTRACT / BENCH</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Full-Stack Web & Mobile App Delivery for Vexo Studio</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hello Vexo Studio Team,</p>
      <p>I saw your hiring call for a Full-Stack Web & Mobile App Developer. We have immediate capacity to take on your sprint workload with senior-level engineering.</p>
      
      <div style="background:#190D2D;border-left:4px solid #A855F7;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
        <span style="display:block;font-size:11px;font-weight:700;color:#E9D5FF;text-transform:uppercase;margin-bottom:4px;">💎 What We Bring:</span>
        <span style="font-size:13px;color:#E2E8F0;">
        • Modern React 19, TypeScript, and Node.js microservice architecture.<br>
        • Cross-platform mobile app development with native hardware acceleration.<br>
        • 100% test-verified commits with zero regression policy.
        </span>
      </div>

      <p>Check our live production architecture: <a href="https://www.garudaos.in" style="color:#C084FC;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Available to start immediately on a trial task or full milestone. Let's connect.</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief Architect &middot; GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  },
  {
    id: "SCREAMING_06_SUNDAS_KHALID",
    name: "Sundas Khalid",
    to: "hi@sundaskhalid.com",
    subject: "Portfolio & Technical Architecture Overview — Full-Stack Systems (GARUDA OS)",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B0F17;border:1px solid #38BDF8;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#0F2B48 0%,#0B0F17 100%);border-bottom:1px solid rgba(56,189,248,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#38BDF8;text-transform:uppercase;">TECHNICAL PORTFOLIO & ARCHITECTURE</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Full-Stack Product & AI Engineering Portfolio</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hi Sundas,</p>
      <p>I saw your invitation to connect and share portfolios for web and software collaboration. Sharing a high-level overview of our production systems and architecture.</p>
      
      <div style="background:#081B2E;border-left:4px solid #38BDF8;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
        <span style="display:block;font-size:11px;font-weight:700;color:#BAE6FD;text-transform:uppercase;margin-bottom:4px;">🛠️ Core Specializations:</span>
        <span style="font-size:13px;color:#E2E8F0;">
        1. <b>High-Performance Web Apps:</b> Built on React 19, Node.js, and Vite with sub-second page loads and zero layout shift.<br>
        2. <b>Autonomous AI Systems:</b> Multi-agent orchestration, live WhatsApp Cloud integration, real-time RAG, and sub-second inference.<br>
        3. <b>Enterprise Offline-First PWAs:</b> Capacitor & native mobile apps with gesture-locked physics and zero-flicker UI.
        </span>
      </div>

      <p>Live Platform & Architecture Proof: <a href="https://www.garudaos.in" style="color:#38BDF8;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Always open to discussing high-impact projects or technical collaborations.</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief Architect &middot; GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  }
];

async function main() {
  console.log("\n========================================================");
  console.log("🦅 GARUDA HIGH-INTENT SCREAMING-NEED CLIENT DISPATCHER");
  console.log("========================================================\n");

  if (!SMTP_CONFIG.auth.pass) {
    console.error("❌ GARUDA_EMAIL_PASS is missing in environment.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  // Load existing log
  let log = [];
  if (fs.existsSync(LOG_FILE)) {
    try { log = JSON.parse(fs.readFileSync(LOG_FILE, "utf8")); } catch (_) {}
  }
  const sentEmails = new Set(log.filter(l => l.status === "SENT").map(l => l.email.toLowerCase()));

  for (let i = 0; i < SCREAMING_CLIENTS.length; i++) {
    const c = SCREAMING_CLIENTS[i];
    if (sentEmails.has(c.to.toLowerCase())) {
      console.log(`[${i + 1}/${SCREAMING_CLIENTS.length}] ⏭ Skipping already sent: ${c.name} <${c.to}>`);
      continue;
    }
    console.log(`[${i + 1}/${SCREAMING_CLIENTS.length}] Dispatching to: ${c.name} <${c.to}>...`);

    try {
      const info = await transporter.sendMail({
        from: FROM_HEADER,
        to: c.to,
        subject: c.subject,
        html: c.html,
        headers: {
          "X-Priority": "1",
          "X-Mailer": "GARUDA-Sovereign-Outreach",
          "Reply-To": "praveen@garudaos.in"
        }
      });

      console.log(`   ✔ SUCCESS! Message ID: ${info.messageId}`);

      log.push({
        id: c.id,
        name: c.name,
        email: c.to,
        subject: c.subject,
        messageId: info.messageId,
        dispatchedAt: new Date().toISOString(),
        status: "SENT"
      });

      // Dual Alert: Founder Telegram & WhatsApp
      const alertMsg = `🔥 *LIVE SCREAMING-NEED CLIENT CONTACTED!*\n\n👤 *Client:* ${c.name}\n📧 *Email:* ${c.to}\n🎯 *Subject:* ${c.subject}\n\nYeh client actively developer dhoond raha tha! Direct Trojan proposal dispatched via praveen@garudaos.in.`;
      
      try { await telegram.sendMessage(alertMsg); } catch (e) { console.error("Telegram alert error:", e.message); }
      try { await sendFounderWhatsAppAlert(alertMsg); } catch (e) { console.error("WhatsApp alert error:", e.message); }

      // Humanized pause between emails to preserve perfect sender reputation
      await new Promise(r => setTimeout(r, 6000));
    } catch (err) {
      console.error(`   ❌ FAILED to send to ${c.to}:`, err.message);
      log.push({
        id: c.id,
        name: c.name,
        email: c.to,
        subject: c.subject,
        dispatchedAt: new Date().toISOString(),
        status: "FAILED",
        error: err.message
      });
    }
  }

  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), "utf8");
  console.log(`\n✔ Dispatched screaming-need clients recorded to: ${LOG_FILE}`);
}

main().catch(console.error);
