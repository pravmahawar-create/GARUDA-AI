/**
 * 🦅 GARUDA Autonomous Strategic Dispatch: Databricks Partner Operations
 * Mission: Transition from ISV track to Consulting & System Integrator (C&SI) Partner Program
 * Governance: 100% Anti-Fabrication Law | Executive Visual Standard | Founder Privacy Shield
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const TO_EMAIL = "ISV-Partners@Databricks.com";
const CC_EMAIL = "Partners@databricks.com";

async function dispatchDatabricksEmail() {
  console.log("===============================================================");
  console.log("🦅 GARUDA PARTNER DISPATCH: DATABRICKS C&SI PARTNER PROGRAM");
  console.log("===============================================================\n");

  const host = process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in";
  const port = parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10);
  const user = process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in";
  const pass = process.env.GARUDA_EMAIL_PASS;

  if (!pass) {
    throw new Error("Missing GARUDA_EMAIL_PASS in environment.");
  }

  console.log(`[SMTP SETUP] Connecting to ${host}:${port} as ${user}...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  // Verify connection configuration
  await transporter.verify();
  console.log("✔ SMTP Connection verified successfully.");

  const subject = "Re: A better-fitting partner path - Databricks ISV Partner Program [GARUDA-AI]";

  const plainText = `Dear Databricks Partner Operations Team,

Thank you for the thorough evaluation of our application and for the constructive guidance regarding our partnership trajectory.

We have reviewed your assessment and agree with your recommendation. GARUDA-AI operates as an advanced Data & AI Systems Architecture and Engineering Practice. We specialize in designing and deploying end-to-end autonomous AI pipelines, data ingestion frameworks, and enterprise-grade intelligence layers for high-growth businesses.

The Consulting & System Integrator (C&SI) Partner Program is indeed the ideal strategic alignment for our practice and delivery capabilities.

Please advise on next steps or feel free to transition our file directly to the Consulting & SI onboarding team (Partners@databricks.com). We look forward to completing the C&SI partner onboarding and collaborating on joint customer data and AI transformations within the Databricks ecosystem.

Warm regards,

Praveen Mahawar
Founder & Chief Architect | GARUDA-AI
Official Portal: https://www.garudaos.in
Verified Email: praveen@garudaos.in
`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Databricks Partnership Alignment - GARUDA-AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0; line-height: 1.6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 35px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #111827; border: 1px solid #1F2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Top Accent Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #FF3621 0%, #E02E1B 50%, #B91C1C 100%); height: 4px;"></td>
          </tr>
          
          <!-- Brand Badge Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #1F2937;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #FFFFFF;">🦅 GARUDA<span style="color: #FF3621;">-AI</span></span>
                    <span style="display: block; font-size: 11px; font-weight: 600; color: #9CA3AF; letter-spacing: 0.5px; margin-top: 2px;">SOVEREIGN DATA & AI SYSTEMS ARCHITECTURE</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 5px 12px; border-radius: 9999px; background-color: rgba(255, 54, 33, 0.12); border: 1px solid rgba(255, 54, 33, 0.3); font-size: 11px; font-weight: 700; color: #FF6B5B; letter-spacing: 0.5px;">PARTNER TRACK ALIGNMENT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; color: #D1D5DB; font-size: 14px; line-height: 1.7;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #F3F4F6;">Dear <strong>Databricks Partner Operations Team</strong>,</p>
              
              <p style="margin: 0 0 18px 0;">
                Thank you for the thorough evaluation of our application and for the constructive guidance regarding our partnership trajectory.
              </p>

              <p style="margin: 0 0 18px 0;">
                We have reviewed your assessment and agree with your recommendation. <strong style="color: #FFFFFF;">GARUDA-AI</strong> operates primarily as an advanced Data & AI Systems Architecture and Engineering Practice. We specialize in designing and deploying end-to-end autonomous AI pipelines, high-throughput data engineering frameworks, and enterprise intelligence layers for fast-scaling organizations.
              </p>

              <!-- Strategic Alignment Highlight Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 22px 0; background-color: #0F172A; border-left: 3px solid #FF3621; border-radius: 6px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">
                      Selected Track: Consulting & System Integrator (C&SI) Partner Program
                    </div>
                    <div style="font-size: 13px; color: #94A3B8; line-height: 1.5;">
                      Focus: Deliver full-lifecycle Data & AI transformations, Lakehouse migrations, and production-grade LLM architectures for joint enterprise customers.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 18px 0;">
                Please advise on the next steps or feel free to transition our file directly to the Consulting & SI onboarding team (<a href="mailto:Partners@databricks.com" style="color: #FF6B5B; text-decoration: none; font-weight: 600;">Partners@databricks.com</a>). We look forward to completing the C&SI partner registration and collaborating closely on joint customer implementations within the Databricks ecosystem.
              </p>

              <p style="margin: 24px 0 0 0; color: #E5E7EB;">
                Warm regards,<br>
                <strong style="color: #FFFFFF; font-size: 15px;">Praveen Mahawar</strong><br>
                <span style="font-size: 13px; color: #9CA3AF;">Founder & Chief Architect | GARUDA-AI</span>
              </p>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0B0F19; border-top: 1px solid #1F2937;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 12px; color: #6B7280;">
                    Official Platform: <a href="https://www.garudaos.in" style="color: #9CA3AF; text-decoration: underline;">https://www.garudaos.in</a><br>
                    Direct Email: <a href="mailto:praveen@garudaos.in" style="color: #9CA3AF; text-decoration: underline;">praveen@garudaos.in</a>
                  </td>
                  <td align="right" style="font-size: 11px; color: #4B5563; font-weight: 500;">
                    REF: DATABRICKS-CSI-TRANSITION
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

  const mailOptions = {
    from: `"${process.env.GARUDA_EMAIL_FROM_NAME || 'Praveen Mahawar | Founder, GARUDA-AI'}" <${user}>`,
    to: TO_EMAIL,
    cc: CC_EMAIL,
    subject: subject,
    text: plainText,
    html: htmlContent
  };

  console.log(`[DISPATCHING] Sending email to ${TO_EMAIL} (CC: ${CC_EMAIL})...`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`✔ SUCCESS! Email sent successfully. MessageId: ${info.messageId}`);
  console.log(`[SMTP RESPONSE] ${info.response}`);

  // Create evidence record
  const sha256 = crypto.createHash("sha256").update(htmlContent).digest("hex");
  const evidence = {
    timestamp: new Date().toISOString(),
    recipient: TO_EMAIL,
    cc: CC_EMAIL,
    subject: subject,
    messageId: info.messageId,
    smtpResponse: info.response,
    sha256: sha256
  };

  const evidencePath = path.join(__dirname, "../reports/databricks-csi-email-evidence.json");
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(`✔ Evidence saved to: ${evidencePath}`);
  console.log(`✔ Verified SHA-256: ${sha256}`);
}

dispatchDatabricksEmail().catch((err) => {
  console.error("❌ DISPATCH FAILED:", err.message);
  process.exit(1);
});
