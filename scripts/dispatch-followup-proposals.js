/**
 * 🦅 GARUDA Governed Follow-Up Outreach Dispatch Engine
 * Strictly enforces:
 * 1. 100% Anti-Fabrication Law: Real verified dispatch from praveen@garudaos.in
 * 2. Dynamic Visual Excellence Standard: Responsive 600px dark-theme executive table layout with regional persona matching
 * 3. Zero Third-Party Brand Pollution: Zero mention of unrelated past entities
 * 4. Politeness Pacing: 5-second interval between sends to safeguard domain reputation
 * 5. Audit Logging: Full SHA-256 and SMTP response tracking
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sendSmtpWithFallback } = require("../src/services/motherPlatformAuthService");

const DATA_DIR = path.join(__dirname, "..", "data");
const LOGS_PATH = path.join(DATA_DIR, "outreach-dispatch-log.json");
const FOLLOWUP_LOGS_PATH = path.join(DATA_DIR, "followup-dispatch-log.json");

const smtpConfig = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: Number(process.env.GARUDA_EMAIL_PORT) || 465,
  user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
  pass: process.env.GARUDA_EMAIL_PASS
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getPersonaTheme(email, businessName) {
  const e = (email || "").toLowerCase();
  const b = (businessName || "").toLowerCase();

  // Gulf / Dubai Persona (Luxury Obsidian & Rich Gold)
  if (e.endsWith(".ae") || b.includes("dubai") || e.includes("globalmedia")) {
    return {
      accent: "#F59E0B",
      accentLight: "#FDE68A",
      borderAccent: "#78350F",
      badgeText: "GULF LUXURY TECH • DUBAI BRIEF",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      tagBg: "rgba(245, 158, 11, 0.15)",
      tagBorder: "rgba(245, 158, 11, 0.35)",
      btnBg: "#F59E0B",
      btnText: "#0F172A"
    };
  }

  // London / UK Persona (Cyber-Indigo Minimalist)
  if (e.endsWith(".uk") || b.includes("stellified") || b.includes("pixelfield") || b.includes("pronto")) {
    return {
      accent: "#818CF8",
      accentLight: "#C7D2FE",
      borderAccent: "#3730A3",
      badgeText: "CYBER-INDIGO MINIMALIST • LONDON BRIEF",
      gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      tagBg: "rgba(99, 102, 241, 0.15)",
      tagBorder: "rgba(99, 102, 241, 0.35)",
      btnBg: "#6366F1",
      btnText: "#FFFFFF"
    };
  }

  // High-Trust Sapphire Enterprise Persona (Global & India)
  return {
    accent: "#38BDF8",
    accentLight: "#BAE6FD",
    borderAccent: "#1E3A8A",
    badgeText: "HIGH-TRUST SAPPHIRE • ENTERPRISE BRIEF",
    gradient: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
    tagBg: "rgba(56, 189, 248, 0.15)",
    tagBorder: "rgba(56, 189, 248, 0.35)",
    btnBg: "#0284C7",
    btnText: "#FFFFFF"
  };
}

function renderExecutiveFollowupHtml(prospect) {
  const theme = getPersonaTheme(prospect.email, prospect.businessName);
  const scopingUrl = `https://www.garudaos.in/chat?ref=${encodeURIComponent(prospect.prospectId || "direct")}`;
  const portalUrl = "https://www.garudaos.in";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Executive Follow-Up for ${prospect.businessName}</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #050811;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .mobile-padding {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #050811;">
  <center style="width: 100%; background-color: #050811;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #0B1120; border-radius: 12px; border: 1px solid #1E293B; overflow: hidden;" class="email-container">
      <tr>
        <td height="4" style="background: ${theme.gradient}; line-height: 4px; font-size: 4px;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding: 28px 32px 20px 32px;" class="mobile-padding">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <div style="display: inline-block; padding: 4px 12px; border-radius: 999px; background-color: ${theme.tagBg}; border: 1px solid ${theme.tagBorder}; font-size: 11px; font-weight: 700; color: ${theme.accent}; letter-spacing: 0.1em; text-transform: uppercase;">
                  🦅 ${theme.badgeText}
                </div>
                <h1 style="margin: 16px 0 6px 0; color: #FFFFFF; font-size: 20px; font-weight: 800; line-height: 1.3; letter-spacing: -0.01em;">
                  Digital Architecture &amp; Automated Execution Follow-Up
                </h1>
                <p style="margin: 0; color: #94A3B8; font-size: 13px; font-weight: 500;">
                  Prepared for the Leadership Team at <strong style="color: #F8FAFC;">${prospect.businessName}</strong>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px;" class="mobile-padding">
          <div style="border-top: 1px solid #1E293B;"></div>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px 32px 20px 32px;" class="mobile-padding">
          <p style="margin: 0 0 14px 0; color: #E2E8F0; font-size: 14px; line-height: 1.6;">
            Dear <strong style="color: #FFFFFF;">${prospect.businessName}</strong> Leadership,
          </p>
          <p style="margin: 0 0 14px 0; color: #CBD5E1; font-size: 13.5px; line-height: 1.6;">
            I am following up on the digital architecture blueprint and autonomous AI concierge strategy we prepared for your team.
          </p>
          <p style="margin: 0 0 20px 0; color: #CBD5E1; font-size: 13.5px; line-height: 1.6;">
            As Founder and Chief Architect at <strong>GARUDA AI Systems</strong>, I personally supervise our engineering pipelines. We eliminate technical friction and build sovereign digital workforces under strict milestone governance.
          </p>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px 16px; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 8px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="28" valign="top" style="font-size: 16px; line-height: 1;">⚡</td>
                    <td>
                      <div style="color: #F8FAFC; font-size: 13px; font-weight: 700;">Autonomous Full-Stack Engineering</div>
                      <div style="color: #94A3B8; font-size: 12px; line-height: 1.4; margin-top: 2px;">
                        Zero-technical-debt web applications, standalone mobile PWAs/APKs, and supersonic API workflows.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding: 12px 16px; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 8px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="28" valign="top" style="font-size: 16px; line-height: 1;">🤖</td>
                    <td>
                      <div style="color: #F8FAFC; font-size: 13px; font-weight: 700;">24/7 Intelligent Concierges &amp; Automated Funnels</div>
                      <div style="color: #94A3B8; font-size: 12px; line-height: 1.4; margin-top: 2px;">
                        Conversational intake concierges that qualify high-ticket opportunities instantly with zero manual delay.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding: 12px 16px; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 8px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="28" valign="top" style="font-size: 16px; line-height: 1;">🛡️</td>
                    <td>
                      <div style="color: #F8FAFC; font-size: 13px; font-weight: 700;">Milestone Governance Guarantee</div>
                      <div style="color: #94A3B8; font-size: 12px; line-height: 1.4; margin-top: 2px;">
                        Transparent 50/50 engagement structure: 50% kickoff, 50% upon verified delivery with complete regression proof.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #070B16; border: 1px solid ${theme.borderAccent}; border-radius: 10px; text-align: center; margin-bottom: 24px;">
            <tr>
              <td style="padding: 24px 20px;">
                <div style="color: ${theme.accent}; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px;">
                  PRIVATE &amp; TAILORED WORKSPACE
                </div>
                <h3 style="margin: 0 0 14px 0; color: #FFFFFF; font-size: 16px; font-weight: 700;">
                  Enter Your Dedicated Scoping Room
                </h3>
                <p style="margin: 0 0 20px 0; color: #94A3B8; font-size: 12.5px; line-height: 1.5; max-width: 440px; margin-left: auto; margin-right: auto;">
                  Access your interactive brief, review real-time architectural components, and converse directly with our core engineering stack.
                </p>
                <div>
                  <a href="${scopingUrl}" target="_blank" style="display: inline-block; background: ${theme.gradient}; color: ${theme.btnText}; padding: 12px 28px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
                    ENTER PRIVATE SCOPING ROOM &rarr;
                  </a>
                </div>
                <div style="margin-top: 14px;">
                  <a href="${portalUrl}" target="_blank" style="color: #94A3B8; font-size: 11.5px; text-decoration: underline;">
                    Or explore the public portal: ${portalUrl}
                  </a>
                </div>
              </td>
            </tr>
          </table>

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 8px;">
            <tr>
              <td>
                <p style="margin: 0 0 4px 0; color: #FFFFFF; font-size: 13.5px; font-weight: 700;">
                  Praveen Mahawar
                </p>
                <p style="margin: 0 0 4px 0; color: #94A3B8; font-size: 12px;">
                  Founder &amp; Chief Architect, GARUDA AI Systems
                </p>
                <p style="margin: 0; color: ${theme.accent}; font-size: 12px; font-family: monospace;">
                  <a href="mailto:praveen@garudaos.in" style="color: ${theme.accent}; text-decoration: none;">praveen@garudaos.in</a> &bull; <a href="${portalUrl}" style="color: ${theme.accent}; text-decoration: none;">garudaos.in</a>
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <tr>
        <td style="padding: 20px 32px; background-color: #070C19; border-top: 1px solid #1E293B; text-align: center;" class="mobile-padding">
          <p style="margin: 0 0 6px 0; color: #64748B; font-size: 11px; line-height: 1.4;">
            This executive follow-up was securely generated and transmitted under sovereign GARUDA governance.
          </p>
          <p style="margin: 0; color: #475569; font-size: 10px;">
            GARUDA AI Systems &bull; High-Performance Autonomous Engineering &bull; All Rights Reserved.
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>`;
}

function renderPlainTextBody(prospect) {
  const scopingUrl = `https://www.garudaos.in/chat?ref=${encodeURIComponent(prospect.prospectId || "direct")}`;
  const portalUrl = "https://www.garudaos.in";

  return `Dear ${prospect.businessName} Leadership,

I am following up on the Digital Architecture & Growth Blueprint prepared specifically for ${prospect.businessName}.

As Founder and Chief Architect at GARUDA AI Systems, I personally oversee our engineering pipelines and sovereign AI worktrees. Whether you are aiming to accelerate web infrastructure, launch standalone mobile applications, or deploy 24/7 intelligent concierges that qualify high-value leads automatically, we execute under strict milestone governance (50% kickoff, 50% upon verified delivery with complete regression proof).

You can review your complete interactive architecture brief or enter your private scoping room here:
• Dedicated Scoping Room: ${scopingUrl}
• Official GARUDA Portal: ${portalUrl}
• Direct Founder Channel: praveen@garudaos.in

Sincerely,
Praveen Mahawar
Founder & Chief Architect, GARUDA AI Systems
praveen@garudaos.in | ${portalUrl}`;
}

async function runFollowupDispatch() {
  console.log("================================================================================");
  console.log("🦅 GARUDA SOVEREIGN EXECUTIVE FOLLOW-UP DISPATCH ENGINE");
  console.log(`Sender: Praveen Mahawar | Founder, GARUDA-AI <${smtpConfig.user}>`);
  console.log(`Gateway: ${smtpConfig.host}:${smtpConfig.port}`);
  console.log("================================================================================\n");

  if (!fs.existsSync(LOGS_PATH)) {
    console.error("Error: Outreach log not found at", LOGS_PATH);
    return;
  }

  const logs = JSON.parse(fs.readFileSync(LOGS_PATH, "utf8"));
  const seenEmails = new Set();
  const targetProspects = [];

  for (const item of logs) {
    if (item.email && !seenEmails.has(item.email.toLowerCase())) {
      seenEmails.add(item.email.toLowerCase());
      targetProspects.push(item);
    }
  }

  console.log(`Identified ${targetProspects.length} unique prospects for executive follow-up.\n`);

  const followupResults = [];

  for (let i = 0; i < targetProspects.length; i++) {
    const p = targetProspects[i];
    const subject = `Executive Follow-up: Digital Architecture & Automated Execution for ${p.businessName}`;
    const htmlContent = renderExecutiveFollowupHtml(p);
    const plainTextBody = renderPlainTextBody(p);
    const sha256 = crypto.createHash("sha256").update(htmlContent).digest("hex");

    console.log(`[${i + 1}/${targetProspects.length}] Dispatching Executive Follow-Up to: ${p.email} (${p.businessName})...`);
    console.log(`   SHA-256 Digest: ${sha256}`);

    try {
      const sendRes = await sendSmtpWithFallback(smtpConfig, {
        to: p.email,
        subject,
        body: plainTextBody,
        html: htmlContent
      });

      const auditRecord = {
        prospectId: p.prospectId,
        businessName: p.businessName,
        email: p.email,
        subject,
        sha256,
        status: "dispatched",
        providerResponseId: sendRes.providerResponseId,
        timestamp: new Date().toISOString()
      };

      followupResults.push(auditRecord);
      console.log(`   ✔ Sent successfully | Server: ${sendRes.providerResponseId}\n`);
    } catch (err) {
      console.error(`   ✖ Failed: ${err.message}\n`);
      followupResults.push({
        prospectId: p.prospectId,
        businessName: p.businessName,
        email: p.email,
        subject,
        sha256,
        status: "failed",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }

    if (i < targetProspects.length - 1) {
      console.log("   [Politeness Rate-Limiter] Waiting 5 seconds before next dispatch...\n");
      await sleep(5000);
    }
  }

  fs.writeFileSync(FOLLOWUP_LOGS_PATH, JSON.stringify(followupResults, null, 2), "utf8");
  console.log("================================================================================");
  const deliveredCount = followupResults.filter(r => r.status === "dispatched").length;
  console.log(`Follow-up campaign complete! ${deliveredCount}/${targetProspects.length} delivered.`);
  console.log(`Audit log saved to: ${FOLLOWUP_LOGS_PATH}`);
  console.log("================================================================================");

  return followupResults;
}

if (require.main === module) {
  runFollowupDispatch().catch(console.error);
}

module.exports = { runFollowupDispatch, renderExecutiveFollowupHtml, renderPlainTextBody };

