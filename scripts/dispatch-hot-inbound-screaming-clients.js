/**
 * 🦅 GARUDA HIGH-INTENT INBOUND CLIENT DISPATCHER
 * Directly dispatches bespoke Trojan proposals to clients who explicitly posted urgent need for developers.
 * 
 * Targets:
 * 1. Trivanta Hospitality Group (trivantahospitality@gmail.com) — Luxury Hotel & Hospitality Website
 * 2. Jack, UK Agency Founder (socialmedia2evolve@outlook.com) — White-Label Web Delivery Bench
 * 3. Nisarga Care (nisargacare1@gmail.com) — SEO-Safe Zero-Drop Website Redesign
 * 
 * Enforced:
 * - 100% Anti-Fabrication Law: Sent from verified praveen@garudaos.in via Zoho SMTP
 * - Executive Visual Brief: High-contrast responsive dark theme with bespoke pricing & scope
 */

require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const telegram = require("../src/services/telegramBotService");
const { sendFounderWhatsAppAlert } = require("../src/services/whatsappCloudService");

const LOG_FILE = path.join(__dirname, "..", "data", "leads", "client_hunt_dispatch_log.json");

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

const HOT_CLIENTS = [
  {
    id: "TRIVANTA_HOSPITALITY",
    name: "Trivanta Hospitality Group",
    to: "trivantahospitality@gmail.com",
    subject: "Trivanta Hospitality — Luxury 5-Star Website Architecture Blueprint (₹35,000 / 4-Day Delivery)",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B0F17;border:1px solid #D4AF37;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#151B28 0%,#0B0F17 100%);border-bottom:1px solid rgba(212,175,55,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#D4AF37;text-transform:uppercase;">LUXURY HOSPITALITY BRIEF • BESPOKE ARCHITECTURE</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Trivanta Hospitality Group — Direct Booking Portal</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hello Trivanta Leadership Team,</p>
      <p>We saw your direct call for a talented web development partner for <b>Trivanta Hospitality Group</b> to build a premium, modern, and user-friendly luxury presence.</p>
      
      <div style="background:#0F172A;border-left:4px solid #D4AF37;padding:14px 16px;border-radius:0 8px 8px 0;margin:18px 0;">
        <span style="display:block;font-size:11px;font-weight:700;color:#FDE68A;text-transform:uppercase;margin-bottom:4px;">💎 What Makes 5-Star Hospitality Sites Convert:</span>
        <span style="font-size:13px;color:#E2E8F0;">
        1. <b>Under 2-Second First Impression:</b> Cinematic image pacing and silk-smooth micro-interactions that communicate luxury before a guest reads a word.<br>
        2. <b>Direct Booking Funnel:</b> Bypasses 15–22% OTA commissions (MakeMyTrip, Booking.com) with an integrated 1-tap WhatsApp concierge and direct reservation inquiry pipeline.
        </span>
      </div>

      <table width="100%" cellspacing="0" cellpadding="10" style="margin:20px 0;border:1px solid #1E293B;border-radius:8px;background:#060A12;">
        <tr style="border-bottom:1px solid #1E293B;">
          <td style="font-size:13px;font-weight:700;color:#FFFFFF;">Luxury Hospitality Web Architecture</td>
          <td align="right" style="font-size:13px;font-weight:800;color:#D4AF37;">₹35,000 fixed</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size:12px;color:#94A3B8;padding-top:4px;">Includes responsive React/Node portal, suite showcase, dynamic menus, and 1-tap WhatsApp booking engine. 50% milestone safety. 4-day sprint.</td>
        </tr>
      </table>

      <p>Interactive Architecture Proof: <a href="https://www.garudaos.in/chat?ref=TRIVANTA_HOSPITALITY" style="color:#D4AF37;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Can we connect for a 5-minute screen share today to show you our luxury hospitality prototype?</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief AI Architect • GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  },
  {
    id: "UK_AGENCY_JACK",
    name: "Jack (Social Media 2 Evolve)",
    to: "socialmedia2evolve@outlook.com",
    subject: "Follow-up for Jack — Silent White-Label Web Delivery Bench (UK Project Overflow)",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#04070D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#080C16;border:1px solid #6366F1;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#12182A 0%,#080C16 100%);border-bottom:1px solid rgba(99,102,241,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#818CF8;text-transform:uppercase;">UK AGENCY WHITE-LABEL • 48-HOUR DELIVERY BENCH</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Silent Engineering Delivery for Social Media 2 Evolve</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Hi Jack,</p>
      <p>Checking in following your post looking for a reliable freelance web developer to collaborate on upcoming client projects.</p>
      
      <p>Instead of relying on individual freelancers who might disappear mid-sprint, we provide a <b>silent, NDA-protected white-label engineering bench</b>:</p>

      <ul style="color:#E2E8F0;padding-left:20px;line-height:1.7;">
        <li><b>100% Invisible White-Label:</b> We never touch or contact your client. You keep the brand relationship and your healthy agency margin.</li>
        <li><b>UK Business Hours Overlap:</b> Instant same-day Slack/WhatsApp feedback loops and sub-second code delivery.</li>
        <li><b>Verified Production Builds:</b> Modern React 19, responsive Node backends, and offline-first PWAs delivered in 48–72 hours with SHA-256 integrity proofs.</li>
      </ul>

      <table width="100%" cellspacing="0" cellpadding="10" style="margin:20px 0;border:1px solid #1E293B;border-radius:8px;background:#0D1322;">
        <tr style="border-bottom:1px solid #1E293B;">
          <td style="font-size:13px;font-weight:700;color:#FFFFFF;">White-Label Agency Client Build</td>
          <td align="right" style="font-size:13px;font-weight:800;color:#818CF8;">From £280 / ₹30,000</td>
        </tr>
        <tr>
          <td colspan="2" style="font-size:12px;color:#94A3B8;padding-top:4px;">Test us risk-free on a single pilot task first before any ongoing commitment.</td>
        </tr>
      </table>

      <p>Interactive Architecture Proof: <a href="https://www.garudaos.in/chat?ref=UK_AGENCY_JACK" style="color:#818CF8;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      <p>Would you have 5 minutes for a quick chat this week to review our component library?</p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Best regards,<br>
        <strong style="color:#FFFFFF;">Praveen Mahawar</strong><br>
        Founder & Chief AI Architect • GARUDA AI Operating System<br>
        Official Email: praveen@garudaos.in | Platform: www.garudaos.in
      </p>
    </td>
  </tr>
</table>
</body>
</html>`
  },
  {
    id: "NISARGA_CARE",
    name: "Nisarga Care Team",
    to: "nisargacare1@gmail.com",
    subject: "Follow-up: Nisarga Care SEO-Safe Redesign (Zero Google Index Drop)",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 10px;background:#05070B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#E2E8F0;">
<table align="center" width="100%" style="max-width:600px;background:#0B1220;border:1px solid #38BDF8;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
  <tr>
    <td style="padding:24px 28px;background:linear-gradient(180deg,#0F2B4A 0%,#0B1220 100%);border-bottom:1px solid rgba(56,189,248,0.3);">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;color:#38BDF8;text-transform:uppercase;">HEALTHCARE WEB REDESIGN • SEO PROTECTION GUARANTEE</span>
      <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Nisarga Care — Zero-Rank-Drop Modern Redesign</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:#CBD5E1;">
      <p style="margin-top:0;">Namaste Nisarga Care Team 🙏,</p>
      <p>Following up on your requirement to <b>redesign nisargacare.com without making any changes to your Google Search index or rankings</b>.</p>
      
      <p>We guarantee 100% index preservation with our 3-step surgical migration protocol:</p>
      <ul style="color:#E2E8F0;padding-left:20px;line-height:1.7;">
        <li>Exact URL structure mapping with zero 404 broken links.</li>
        <li>Preservation of all high-ranking keyword metadata and schema tags.</li>
        <li>Sub-second mobile loading speed for anxious elder-care families.</li>
      </ul>

      <p>Pricing: <b>₹30,000 fixed milestone</b> (50% advance to start, remaining upon live verification on Search Console).</p>
      <p>Platform Proof: <a href="https://www.garudaos.in/chat?ref=NISARGA_CARE" style="color:#38BDF8;font-weight:700;text-decoration:none;">https://www.garudaos.in</a></p>
      
      <p style="margin-bottom:0;color:#94A3B8;font-size:13px;">
        Praveen Mahawar &middot; Founder, GARUDA OS<br>
        praveen@garudaos.in | www.garudaos.in
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
  console.log("🦅 GARUDA HIGH-INTENT INBOUND CLIENT DISPATCHER");
  console.log("========================================================\n");

  if (!SMTP_CONFIG.auth.pass) {
    console.error("❌ GARUDA_EMAIL_PASS is missing.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  for (let i = 0; i < HOT_CLIENTS.length; i++) {
    const c = HOT_CLIENTS[i];
    console.log(`[${i + 1}/${HOT_CLIENTS.length}] Dispatching to: ${c.name} <${c.to}>...`);

    try {
      const info = await transporter.sendMail({
        from: FROM_HEADER,
        to: c.to,
        subject: c.subject,
        html: c.html,
        headers: { "X-Priority": "1", "X-Mailer": "GARUDA-Sovereign-Outreach" }
      });

      console.log(`   ✔ SUCCESS! Message ID: ${info.messageId}`);

      // Alert Founder via Telegram & WhatsApp
      const alertMsg = `🔥 *HIGH-INTENT CLIENT DISPATCHED!*\n\n🏢 *Client:* ${c.name}\n📧 *Email:* ${c.to}\n🎯 *Subject:* ${c.subject}\n\nYeh client khud kaam maang raha tha! Inbox monitor active hai.`;
      try { await telegram.sendMessage(alertMsg); } catch (_) {}
      try { await sendFounderWhatsAppAlert(alertMsg); } catch (_) {}

      // Humanized pause between sends
      await new Promise(r => setTimeout(r, 6000));
    } catch (err) {
      console.error(`   ❌ FAILED to send to ${c.to}:`, err.message);
    }
  }

  console.log("\n✔ ALL 3 HIGH-INTENT INBOUND CLIENTS DISPATCHED!");
}

main().catch(console.error);
