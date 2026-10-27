/**
 * 🦅 GARUDA AUTONOMOUS BUYER OUTREACH DISPATCH ENGINE
 * 
 * Fully autonomous execution — zero manual clicks required from Founder.
 * Targets live buyers who explicitly posted urgent project requirements with direct contact channels.
 * Strictly adheres to Rule 2 (Golden Brand Identity), Rule 3 (Autonomous Non-Stop Execution),
 * and Rule 11 (Zero Exhaustion for Founder Praveen).
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sendSmtpWithFallback } = require("../src/services/motherPlatformAuthService");

const DATA_DIR = path.join(__dirname, "..", "data");
const LOGS_PATH = path.join(DATA_DIR, "active-buyer-dispatch-log.json");

const smtpConfig = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: Number(process.env.GARUDA_EMAIL_PORT) || 465,
  user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
  pass: process.env.GARUDA_EMAIL_PASS
};

if (!smtpConfig.user || !smtpConfig.pass) {
  console.error("FATAL: SMTP credentials missing in environment.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BUYERS = [
  {
    id: "buyer_rouge_web",
    name: "Rouge Media & Spa Group",
    contactName: "Project Lead",
    email: "rouge@oasisbeautyspas.com",
    requirement: "Urgent Web Application & Digital Platform Engineering",
    subject: "Urgent Web Engineering & Digital Architecture [GARUDA OS]",
    leadSource: "Direct Buyer Requirement (Twitter/Web)",
    scope: "High-speed responsive web platform, sub-second load times, automated appointment intake.",
    accentColor: "#6366f1"
  },
  {
    id: "buyer_ketan_livestream",
    name: "NextEntertain / Live Streaming Division",
    contactName: "Ketan Tyagi",
    email: "ketan.tyagi@nextentertain.com",
    requirement: "Live Streaming Application Architecture & Real-Time Engine",
    subject: "High-Throughput Live Streaming Engine & Architecture [GARUDA OS]",
    leadSource: "Direct Buyer Requirement (LinkedIn/Web)",
    scope: "Low-latency streaming pipelines, scalable WebSocket state management, mobile-first client architecture.",
    accentColor: "#10b981"
  },
  {
    id: "buyer_mike_tech",
    name: "Mike Straw Media",
    contactName: "Mike Straw",
    email: "Mike@MikeStrawMedia.com",
    requirement: "Custom Technical Systems & Software Project Engineering",
    subject: "Production Software Architecture & Engineering Scope [GARUDA OS]",
    leadSource: "Direct Buyer Requirement (Twitter/Web)",
    scope: "Custom engine development, API pipelines, sub-second high-reliability execution.",
    accentColor: "#f59e0b"
  }
];

function generateVisualEmailHtml(buyer) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${buyer.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-bottom: 1px solid #1f2937;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: ${buyer.accentColor}; text-transform: uppercase;">GARUDA SOVEREIGN SYSTEMS</span>
                    <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                      Architectural Proposal: ${buyer.requirement}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #e5e7eb;">
                Hello <strong>${buyer.contactName}</strong>,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                We noted your immediate requirement regarding <strong>"${buyer.requirement}"</strong>. At <strong>GARUDA OS</strong>, we engineer and deploy high-throughput, mission-critical web applications and distributed software with sub-second latency and zero architectural bloat.
              </p>

              <!-- Capability Block -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border-left: 3px solid ${buyer.accentColor}; border-radius: 4px; padding: 18px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; color: #93c5fd; text-transform: uppercase; margin-bottom: 6px;">Execution Scope & Architecture</div>
                    <div style="font-size: 14px; color: #e2e8f0; line-height: 1.5;">${buyer.scope}</div>
                  </td>
                </tr>
              </table>

              <!-- Highlights -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                    <strong style="color: #ffffff;">⚡ Sub-Second TTFB:</strong> Edge-rendered reactive interface with zero stutter and rigid mobile viewport lock.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                    <strong style="color: #ffffff;">🔒 Cryptographic Delivery:</strong> Complete test suites, clean typed APIs, and 100% local verification before shipment.
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                    <strong style="color: #ffffff;">🤝 Milestone Governance:</strong> 50% deposit upon kickoff, 50% upon verified delivery with zero surprise costs.
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="https://www.garudaos.in" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; letter-spacing: 0.5px;">
                      View Live Production Engine (GARUDA OS) &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
                We are prepared to deploy a working prototype or proof-of-concept directly for your review within 24–48 hours. Please reply directly to this email to align on specs and timeline.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0d1117; border-top: 1px solid #1f2937; font-size: 12px; color: #6b7280; line-height: 1.5;">
              <strong>Praveen Mahawar</strong> &bull; Founder & Chief Architect<br>
              GARUDA OS &bull; <a href="mailto:praveen@garudaos.in" style="color: #818cf8; text-decoration: none;">praveen@garudaos.in</a> &bull; <a href="https://www.garudaos.in" style="color: #818cf8; text-decoration: none;">https://www.garudaos.in</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function runAutonomousBuyerDispatch() {
  console.log("🦅 ========================================================");
  console.log("🦅 GARUDA AUTONOMOUS BUYER OUTREACH DISPATCH ENGINE");
  console.log(`🦅 Sender: Praveen Mahawar <${smtpConfig.user}> via ${smtpConfig.host}:${smtpConfig.port}`);
  console.log("🦅 Mode: 100% Autonomous | Zero Manual Clicks");
  console.log("🦅 ========================================================\n");

  const results = [];

  for (let i = 0; i < BUYERS.length; i++) {
    const b = BUYERS[i];
    console.log(`[${i + 1}/${BUYERS.length}] Preparing Proposal for: ${b.contactName} (${b.email})...`);

    const htmlContent = generateVisualEmailHtml(b);
    const sha256 = crypto.createHash("sha256").update(Buffer.from(htmlContent)).digest("hex");

    const plainText = `Hello ${b.contactName},\n\n` +
      `We noted your immediate requirement regarding "${b.requirement}". At GARUDA OS, we engineer and deploy high-throughput, mission-critical web applications and distributed software with sub-second latency.\n\n` +
      `Scope: ${b.scope}\n\n` +
      `• Platform: https://www.garudaos.in\n` +
      `• Direct Contact: praveen@garudaos.in\n\n` +
      `We are prepared to deploy a working prototype within 24-48 hours. Let us connect.\n\n` +
      `Sincerely,\nPraveen Mahawar\nFounder & Chief Architect, GARUDA OS`;

    try {
      console.log(`   📡 Dispatching live SMTP packet to ${b.email}...`);
      const sendRes = await sendSmtpWithFallback(smtpConfig, {
        to: b.email,
        subject: b.subject,
        body: plainText,
        html: htmlContent
      });

      console.log(`   ✔ SUCCESS! Delivered to ${b.email}`);
      console.log(`   Provider Response: ${sendRes.providerResponseId}`);
      console.log(`   SHA-256 Proof: ${sha256}\n`);

      results.push({
        buyerId: b.id,
        email: b.email,
        name: b.name,
        subject: b.subject,
        status: "DELIVERED",
        providerResponseId: sendRes.providerResponseId,
        sha256,
        dispatchedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(`   ❌ ERROR delivering to ${b.email}: ${err.message}\n`);
      results.push({
        buyerId: b.id,
        email: b.email,
        status: "FAILED",
        error: err.message,
        dispatchedAt: new Date().toISOString()
      });
    }

    if (i < BUYERS.length - 1) {
      await sleep(2000); // Politeness delay
    }
  }

  // Save audit log
  let existingLogs = [];
  if (fs.existsSync(LOGS_PATH)) {
    try { existingLogs = JSON.parse(fs.readFileSync(LOGS_PATH, "utf8")); } catch (_) {}
  }
  existingLogs.push(...results);
  fs.writeFileSync(LOGS_PATH, JSON.stringify(existingLogs, null, 2), "utf8");

  console.log("========================================================");
  console.log(`🦅 MISSION COMPLETE: ${results.filter(r => r.status === "DELIVERED").length}/${BUYERS.length} Proposals Dispatched Live.`);
  console.log(`💾 Audit Log: ${LOGS_PATH}`);
  console.log("========================================================\n");

  return results;
}

if (require.main === module) {
  runAutonomousBuyerDispatch()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("FATAL DISPATCH ERROR:", err);
      process.exit(1);
    });
}

module.exports = { runAutonomousBuyerDispatch };
