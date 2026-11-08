/**
 * 🦅 GARUDA Autonomous Strategic Dispatch: 3 High-Growth AI Startups
 * Targets:
 *  1. Rupert Wiseman (Co-Founder, AssumeAI) — rupert@assume-ai.com
 *  2. Catalyst Wayfare AI — talent+hn@cwai.co
 *  3. BuildQ AI — careers@buildq.ai (Subject format: "HN Founding Engineer")
 * Governance:
 *  - 100% Anti-Fabrication Law
 *  - Rule 15: Zero-Bounce Pre-Flight MX Verified
 *  - Executive Visual Standard | Founder Privacy Shield (Zero personal phone number)
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { verifyEmail } = require("./governance/verify-email-preflight");

const TARGETS = [
  {
    key: "assume_ai",
    to: "rupert@assume-ai.com",
    name: "Rupert Wiseman",
    company: "AssumeAI",
    subject: "Production AI Agent Architecture & Fast-Ship Delivery Bench — GARUDA-AI",
    headline: "Fast-Ship Delivery Bench for Production AI Agents & Claude Workflows",
    body: `
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #F3F4F6;">Hi <strong>Rupert</strong>,</p>
      
      <p style="margin: 0 0 16px 0;">
        Saw that you're scaling engineering at <strong>AssumeAI</strong> to deploy production-grade AI agents, Claude skills, and automated software for SMEs. That exact stack — autonomous agent orchestration, Vercel/Supabase backends, and deterministic error handling — is our core specialty.
      </p>

      <p style="margin: 0 0 16px 0;">
        Instead of waiting 6–8 weeks through conventional hiring loops, <strong>GARUDA-AI</strong> operates as a rapid sovereign engineering unit. We design, benchmark, and deploy full-stack agentic workflows in days:
      </p>

      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #0F172A; border-left: 3px solid #38BDF8; border-radius: 6px; padding: 18px 20px;">
        <tr>
          <td>
            <div style="font-size: 13.5px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">
              ⚡ Production Capabilities for AssumeAI Sprints:
            </div>
            <div style="font-size: 13px; color: #94A3B8; line-height: 1.6;">
              • <strong>Agentic Workflows:</strong> Sub-second latency LLM tool-calling, RAG pipelines, and deterministic state sync.<br>
              • <strong>Full-Stack Architecture:</strong> Clean Python, TypeScript, Supabase, and Vercel infrastructure.<br>
              • <strong>Delivery Model:</strong> Contract / Sprint basis (£35–£50/hr or fixed scope) — you own 100% of the code with cryptographic deployment verification.
            </div>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0;">
        We can take a pilot workflow or client module and ship a working production build in 48 hours to prove our velocity.
      </p>
    `
  },
  {
    key: "catalyst_wayfare",
    to: "talent+hn@cwai.co",
    name: "R. David Edelman & Catalyst Team",
    company: "Catalyst · Wayfare AI",
    subject: "Agent Builder / Multi-Agent Systems Engineer — Production Architecture",
    headline: "Production Multi-Agent Systems & Enterprise LLM Workflows",
    body: `
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #F3F4F6;">Dear <strong>Catalyst·Wayfare AI Team</strong>,</p>
      
      <p style="margin: 0 0 16px 0;">
        Writing in reference to your <strong>Agent Builder / AI Engineer</strong> contract opening. We saw that you're shipping multi-agent systems for mid-market enterprises across regulated domains (finance, energy, healthcare) with high security and reliability requirements.
      </p>

      <p style="margin: 0 0 16px 0;">
        At <strong>GARUDA-AI</strong>, we engineer autonomous agent swarms with rigorous deterministic safeguards:
      </p>

      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #0F172A; border-left: 3px solid #818CF8; border-radius: 6px; padding: 18px 20px;">
        <tr>
          <td>
            <div style="font-size: 13.5px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">
              🛡️ Enterprise Multi-Agent Architecture:
            </div>
            <div style="font-size: 13px; color: #94A3B8; line-height: 1.6;">
              • <strong>Multi-Agent Governance:</strong> Air-gapped tool execution, Section 63 BSA electronic evidence audit trails, and strict role demarcation.<br>
              • <strong>Production Readiness:</strong> Full-duplex streaming, sub-second response times, and zero-hallucination boundary enforcement.<br>
              • <strong>Contract Alignment:</strong> Available for 1099 contract sprints (20–40 hrs/wk) overlapping US business hours.
            </div>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0;">
        Ready to take on an initial enterprise proof-of-concept or integrate into your active client delivery sprints immediately.
      </p>
    `
  },
  {
    key: "buildq_ai",
    to: "careers@buildq.ai",
    name: "BuildQ Founders & Core Team",
    company: "BuildQ AI",
    subject: "HN Founding Engineer — Praveen Mahawar (GARUDA-AI)",
    headline: "Founding Engineer Application: Agentic Document Review & Full-Stack Systems",
    body: `
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #F3F4F6;">Hello <strong>BuildQ Core Team</strong>,</p>
      
      <p style="margin: 0 0 16px 0;">
        Applying for the <strong>HN Founding Engineer</strong> role. Saw your mission building an agent-driven document review platform for heavy industry finance.
      </p>

      <p style="margin: 0 0 16px 0;">
        Instead of a theoretical resume, here is what I build and ship inside <strong>GARUDA-AI</strong>:
      </p>

      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #0F172A; border-left: 3px solid #10B981; border-radius: 6px; padding: 18px 20px;">
        <tr>
          <td>
            <div style="font-size: 13.5px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">
              🏗️ Proven Full-Stack & Agentic Track Record:
            </div>
            <div style="font-size: 13px; color: #94A3B8; line-height: 1.6;">
              • <strong>Stack Mastery:</strong> Python, TypeScript, React/Next.js, PostgreSQL, AWS, and local vector indexing.<br>
              • <strong>Complex Document Analysis:</strong> Built cryptographic verification pipelines, SHA-256 automated forensic audit trails, and high-accuracy parsing systems.<br>
              • <strong>Startup Velocity:</strong> Autonomous full-lifecycle development — from schema design and API contracts to production UI and automated test suites.
            </div>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 16px 0;">
        Eager to discuss how we can accelerate BuildQ's product roadmap and deliver production-grade document agents.
      </p>
    `
  }
];

function buildHtmlShell(title, bodyContent, accentColor = "#38BDF8") {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; line-height: 1.6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #111827; border: 1px solid #1F2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="background: linear-gradient(90deg, ${accentColor} 0%, #0284C7 100%); height: 4px;"></td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="padding: 26px 30px 18px 30px; border-bottom: 1px solid #1F2937;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 19px; font-weight: 800; letter-spacing: 1.2px; color: #FFFFFF;">🦅 GARUDA<span style="color: ${accentColor};">-AI</span></span>
                    <span style="display: block; font-size: 11px; font-weight: 600; color: #9CA3AF; letter-spacing: 0.5px; margin-top: 2px;">AUTONOMOUS AI SYSTEMS ARCHITECTURE</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); font-size: 10.5px; font-weight: 700; color: ${accentColor}; letter-spacing: 0.5px;">CONTRACT BENCH</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 30px 24px 30px; color: #D1D5DB; font-size: 14px; line-height: 1.7;">
              ${bodyContent}

              <p style="margin: 22px 0 0 0; color: #E5E7EB;">
                Warm regards,<br>
                <strong style="color: #FFFFFF; font-size: 15px;">Praveen Mahawar</strong><br>
                <span style="font-size: 13px; color: #9CA3AF;">Founder & AI Systems Architect | GARUDA-AI</span><br>
                <span style="font-size: 12px; color: #6B7280;">Official Portal: <a href="https://www.garudaos.in" style="color: ${accentColor}; text-decoration: none;">https://www.garudaos.in</a></span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 30px; background-color: #0B0F19; border-top: 1px solid #1F2937;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 11.5px; color: #6B7280;">
                    Verified Enterprise Channel: <a href="mailto:praveen@garudaos.in" style="color: #9CA3AF; text-decoration: underline;">praveen@garudaos.in</a><br>
                    Zero-hallucination · 100% Client Code Ownership · Cryptographic Deploy Evidence
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function dispatchAll() {
  console.log("===============================================================");
  console.log("🦅 GARUDA SURGICAL TROJAN OUTREACH: 3 VERIFIED AI STARTUPS");
  console.log("===============================================================\n");

  const host = process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in";
  const port = parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10);
  const user = process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in";
  const pass = process.env.GARUDA_EMAIL_PASS;

  if (!pass) throw new Error("Missing GARUDA_EMAIL_PASS");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  await transporter.verify();
  console.log("✔ SMTP Gateway verified on " + host + ":" + port);

  const dispatchLog = [];

  for (const t of TARGETS) {
    console.log(`\n▶ [PRE-FLIGHT] Verifying target: ${t.to}...`);
    const preflight = await verifyEmail(t.to);
    if (!preflight.valid) {
      console.error(`❌ PRE-FLIGHT REJECTED ${t.to}: ${preflight.reason}`);
      continue;
    }
    console.log(`✔ PRE-FLIGHT PASS: ${t.to} (MX: ${preflight.primaryMx})`);

    const html = buildHtmlShell(t.headline, t.body);
    const sha256 = crypto.createHash("sha256").update(html).digest("hex");

    const mailOptions = {
      from: `"${process.env.GARUDA_EMAIL_FROM_NAME || 'Praveen Mahawar | Founder, GARUDA-AI'}" <${user}>`,
      to: t.to,
      subject: t.subject,
      html: html
    };

    console.log(`[DISPATCHING] Sending to ${t.to} (${t.company})...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✔ DELIVERED! MessageId: ${info.messageId} | SMTP: ${info.response}`);

    dispatchLog.push({
      target: t.to,
      company: t.company,
      subject: t.subject,
      messageId: info.messageId,
      smtpResponse: info.response,
      sha256: sha256,
      sentAt: new Date().toISOString()
    });

    // Polite 2-second rate-limiting between dispatches
    await new Promise(r => setTimeout(r, 2000));
  }

  const logFile = path.join(__dirname, "../reports/foreign-ai-startups-dispatch-log.json");
  fs.writeFileSync(logFile, JSON.stringify(dispatchLog, null, 2), "utf8");
  console.log(`\n✔ All dispatches logged with cryptographic proof in: ${logFile}`);
}

dispatchAll().catch(err => {
  console.error("❌ DISPATCH ERROR:", err);
  process.exit(1);
});
