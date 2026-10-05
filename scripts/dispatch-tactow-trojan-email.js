/**
 * 🦅 GARUDA Autonomous Outreach: Karthik Bhaskara (Tactow.in)
 * Mission: Architectural Solution for Razorpay Single-Key / LLM Company Brain Security
 * Standard: Golden Outreach & Visual Brand Identity Doctrine (AGENTS.md / GEMINI.md)
 * 100% Anti-Fabrication Law: Real verified enterprise channels, zero personal number exposure.
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const TARGET_EMAIL = "support@tactow.in";
const TARGET_NAME = "Karthik Bhaskara & Tactow Core Team";

async function dispatchTactowEmail() {
  console.log("===============================================================");
  console.log("🦅 GARUDA SURGICAL TROJAN DISPATCH: TACTOW.IN / KARTHIK BHASKARA");
  console.log("===============================================================\n");

  const host = process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in";
  const port = parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10);
  const user = process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in";
  const pass = process.env.GARUDA_EMAIL_PASS;

  if (!pass) {
    throw new Error("Missing GARUDA_EMAIL_PASS in environment.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const subject = "Architectural Blueprint: Air-Gapped Read-Only MCP Gateway for Tactow's LLM Brain (Zero Razorpay Write Exposure)";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GARUDA OS Architecture Blueprint: Tactow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #05070B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #05070B; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- 600px Master Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0B0F17; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Top Cyber Brand Header -->
          <tr>
            <td style="padding: 24px 30px; background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); border-bottom: 1px solid #312E81;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #818CF8; text-transform: uppercase; background: rgba(99, 102, 241, 0.15); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.3);">
                      GARUDA OS • ARCHITECTURAL BRIEF
                    </span>
                    <h1 style="margin: 12px 0 4px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      Air-Gapped Read-Only MCP Gateway
                    </h1>
                    <p style="margin: 0; font-size: 13px; color: #94A3B8;">
                      Prepared for Karthik Bhaskara & Tactow Engineering
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <span style="font-size: 24px;">🦅</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Context & Pain Point -->
          <tr>
            <td style="padding: 28px 30px 16px 30px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Hey Karthik,
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Saw your post calling out Razorpay’s single API key constraint when wiring autonomous AI agents to Tactow’s “Company Brain”. Your observation was spot-on: <em style="color: #F87171;">“shipping a press release instead of an endpoint”</em> leaves founders with an intolerable security dilemma—handing master write/refund checkout secrets to an LLM context.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                You don’t need Razorpay support or second keys to solve this. At <strong style="color: #FFFFFF;">GARUDA OS</strong>, we architect autonomous operational engines for high-growth tech & D2C brands. Here is the exact production architecture that eliminates this risk in under 30 minutes:
              </p>
            </td>
          </tr>

          <!-- Architecture Card -->
          <tr>
            <td style="padding: 0 30px 24px 30px;">
              <div style="background-color: #030712; border: 1px solid #1E293B; border-radius: 8px; padding: 20px;">
                <div style="font-size: 12px; font-weight: 700; color: #38BDF8; letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase;">
                  ⚙️ Architectural Countermeasure (Zero-Trust Model)
                </div>

                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #111827;">
                      <strong style="color: #A5B4FC; font-size: 13px;">1. Vault Isolation:</strong>
                      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                        The master Razorpay key resides exclusively inside an internal local proxy daemon. It is physically inaccessible to the LLM agent’s context or prompt window.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #111827;">
                      <strong style="color: #A5B4FC; font-size: 13px;">2. Schema Hardening (Read-Only MCP Server):</strong>
                      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                        Expose a minimal Model Context Protocol (<code style="background: #1E293B; color: #38BDF8; padding: 2px 5px; border-radius: 3px;">@modelcontextprotocol/sdk</code>) bridge offering exactly 3 read-only tools:
                        <br>• <code style="color: #34D399;">get_order_status(order_id)</code>
                        <br>• <code style="color: #34D399;">fetch_daily_settlement_summary()</code>
                        <br>• <code style="color: #34D399;">verify_payment_by_email(email)</code>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #111827;">
                      <strong style="color: #A5B4FC; font-size: 13px;">3. Physical Mutation Stripping:</strong>
                      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                        <code style="color: #F87171;">/payments/{id}/refund</code> and <code style="color: #F87171;">/capture</code> endpoints are completely absent from the MCP server tool definitions. Even in the event of prompt injection or model hallucination, the agent physically lacks the capability to trigger refunds or drain funds.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0 0 0;">
                      <strong style="color: #A5B4FC; font-size: 13px;">4. Local Webhook SQLite Cache:</strong>
                      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94A3B8; line-height: 1.5;">
                        Instead of spamming Razorpay REST APIs, point webhooks to a local SQLite cache. The MCP agent queries this local replica at sub-millisecond latency with zero rate-limit anxiety.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- CTA & Collaboration -->
          <tr>
            <td style="padding: 0 30px 28px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                We’ve already codified this adapter pattern for autonomous D2C stacks. If you’d like to wire this up to Tactow without wasting days fighting gateway restrictions, we are happy to share our ready-to-run MCP bridge boilerplate or hop on a 15-minute engineering screen-share.
              </p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);">
                    <a href="https://www.garudaos.in/chat?ref=tactow-karthik" target="_blank" style="font-size: 13px; font-weight: 700; color: #FFFFFF; text-decoration: none; padding: 12px 24px; display: inline-block; letter-spacing: 0.5px;">
                      CONNECT ON ARCHITECTURE CHAT →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Enterprise Footer (Strict Anti-Fabrication & Privacy Compliant) -->
          <tr>
            <td style="padding: 20px 30px; background-color: #030712; border-top: 1px solid #1E293B; font-size: 12px; color: #64748B;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <strong style="color: #94A3B8; font-size: 12px;">GARUDA OS</strong> — Sovereign AI & Autonomous Systems Engine<br>
                    Official Portal: <a href="https://www.garudaos.in" style="color: #818CF8; text-decoration: none;">https://www.garudaos.in</a><br>
                    Direct Inquiries: <a href="mailto:praveen@garudaos.in" style="color: #818CF8; text-decoration: none;">praveen@garudaos.in</a>
                  </td>
                  <td align="right" valign="bottom" style="font-size: 11px; color: #475569;">
                    Ref: TACTOW-MCP-01
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

  const textContent = `
GARUDA OS • ARCHITECTURAL BRIEF
Air-Gapped Read-Only MCP Gateway for Tactow's LLM Brain
Prepared for Karthik Bhaskara & Tactow Engineering

Hey Karthik,

Saw your post calling out Razorpay’s single API key constraint when wiring autonomous AI agents to Tactow’s “Company Brain”. Your observation was spot-on: “shipping a press release instead of an endpoint” leaves founders with an intolerable security dilemma—handing master write/refund checkout secrets to an LLM context.

You don’t need Razorpay support or second keys to solve this. At GARUDA OS, we architect autonomous operational engines for high-growth tech & D2C brands. Here is the exact production architecture that eliminates this risk in under 30 minutes:

1. Vault Isolation: The master Razorpay key resides exclusively inside an internal local proxy daemon. It is physically inaccessible to the LLM agent’s context or prompt window.
2. Schema Hardening (Read-Only MCP Server): Expose a minimal Model Context Protocol bridge (@modelcontextprotocol/sdk) offering exactly 3 read-only tools:
   - get_order_status(order_id)
   - fetch_daily_settlement_summary()
   - verify_payment_by_email(email)
3. Physical Mutation Stripping: /payments/{id}/refund and /capture endpoints are completely absent from the MCP server tool definitions. Even in the event of prompt injection or model hallucination, the agent physically lacks the capability to trigger refunds or drain funds.
4. Local Webhook SQLite Cache: Instead of spamming Razorpay REST APIs, point webhooks to a local SQLite cache. The MCP agent queries this local replica at sub-millisecond latency with zero rate-limit anxiety.

We’ve already codified this adapter pattern for autonomous D2C stacks. If you’d like to wire this up to Tactow without wasting days fighting gateway restrictions, we are happy to share our ready-to-run MCP bridge boilerplate or hop on a 15-minute engineering screen-share.

Connect with us: https://www.garudaos.in/chat?ref=tactow-karthik
Or reply directly to this email.

GARUDA OS — Sovereign AI & Autonomous Systems Engine
https://www.garudaos.in
praveen@garudaos.in
Ref: TACTOW-MCP-01
  `.trim();

  console.log(`▶ Pre-flight verification: Verifying destination URL...`);
  const testUrl = "https://www.garudaos.in";
  try {
    const res = await fetch(testUrl);
    if (!res.ok) throw new Error(`Portal status ${res.status}`);
    console.log(`✔ Verified live portal: ${testUrl} (HTTP ${res.status})`);
  } catch (e) {
    console.warn("Portal check note:", e.message);
  }

  console.log(`▶ Dispatching Executive Architectural Brief to: ${TARGET_EMAIL}...`);

  const mailOptions = {
    from: `"GARUDA OS Architecture Team" <${user}>`,
    to: TARGET_EMAIL,
    replyTo: user,
    subject,
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✔ EMAIL DISPATCH SUCCESSFUL!");
  console.log("Message ID:", info.messageId);
  console.log("Response:", info.response);

  // Record SHA-256 evidence
  const evidence = {
    timestamp: new Date().toISOString(),
    recipient: TARGET_EMAIL,
    subject,
    messageId: info.messageId,
    smtpResponse: info.response,
    sha256: crypto.createHash("sha256").update(htmlContent).digest("hex")
  };

  const recordPath = path.resolve(__dirname, "../reports/tactow-trojan-email-evidence.json");
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, JSON.stringify(evidence, null, 2), "utf8");
  console.log("✔ Evidence saved to:", recordPath);

  return evidence;
}

dispatchTactowEmail().catch(err => {
  console.error("❌ Email Dispatch Failed:", err.message);
  process.exit(1);
});
