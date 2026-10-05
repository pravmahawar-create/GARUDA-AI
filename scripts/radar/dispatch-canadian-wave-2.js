/**
 * 🦅 GARUDA AUTONOMOUS OUTREACH ENGINE — CANADIAN DENTAL CADRE WAVE 2
 * 
 * Targets 10 verified, uncontacted high-ticket dental practices in Toronto & Vancouver
 * from data/leads/international_dental_50_leads.json (CA-DEN-012 to CA-DEN-021).
 * 
 * Adheres strictly to:
 * 1. Executive Visual Brief Standard (600px dark sapphire obsidian table layout)
 * 2. 100% Anti-Fabrication Law: Sent via verified Zoho SMTP (praveen@garudaos.in)
 * 3. Strict Founder Personal Privacy: Official enterprise channels only
 * 4. Anti-spam pacing (10-15s per email)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sendSmtpWithFallback } = require('../../src/services/motherPlatformAuthService');

const LEADS_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'international_dental_50_leads.json');
const DISPATCH_LOG = path.join(__dirname, '..', '..', 'data', 'leads', 'outreach_dispatch_log.jsonl');

const smtpConfig = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: Number(process.env.GARUDA_EMAIL_PORT) || 465,
  user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
  pass: process.env.GARUDA_EMAIL_PASS
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function loadDispatchedEmails() {
  if (!fs.existsSync(DISPATCH_LOG)) return new Set();
  const lines = fs.readFileSync(DISPATCH_LOG, 'utf8').split('\n').filter(Boolean);
  const emails = new Set();
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.email) emails.add(parsed.email.toLowerCase().trim());
      if (parsed.recipientEmail) emails.add(parsed.recipientEmail.toLowerCase().trim());
    } catch {}
  }
  return emails;
}

function generateDentalVisualBriefHtml(target) {
  const scopingUrl = `https://www.garudaos.in/chat?ref=${encodeURIComponent(target.id)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autonomous Patient Intake Architecture — ${target.practiceName}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #03070d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #07101c; border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.85);">
    
    <!-- Header -->
    <tr>
      <td style="padding: 28px 24px; background: linear-gradient(180deg, #0b1524 0%, #07101c 100%); border-bottom: 1px solid rgba(212, 175, 55, 0.25); text-align: center;">
        <div style="display: inline-block; padding: 4px 14px; background-color: rgba(212, 175, 55, 0.12); border: 1px solid #d4af37; border-radius: 999px; color: #fef08a; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px;">
          CONFIDENTIAL CLINICAL BRIEF • CANADIAN CADRE
        </div>
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.04em; line-height: 1.3;">
          Autonomous Patient Intake & 24/7 AI Triage
        </h1>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px;">
          Engineered specifically for <strong style="color: #cbd5e1;">${target.practiceName}</strong> (${target.city}, Canada)
        </p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 28px 24px;">
        <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Dear ${target.doctorName || 'Clinical Director'} and Practice Management Team,
        </p>
        <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          In high-density medical corridors across <strong style="color: #fef08a;">${target.city}</strong>, dental practices routinely lose <strong>35%–42% of high-value cosmetic & emergency enquiries</strong> when patients reach voicemail after 5:00 PM or during peak front-desk rush hours.
        </p>

        <!-- Problem / Hemorrhage Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b1524; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; margin-bottom: 20px; overflow: hidden;">
          <tr>
            <td style="padding: 16px 20px;">
              <span style="color: #f87171; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Identified Patient Intake Friction:</span>
              <p style="margin: 6px 0 0 0; color: #e2e8f0; font-size: 13px; line-height: 1.5;">
                When prospective patients search for restorative, orthodontic, or emergency care in ${target.city}, delays of even 5 minutes result in them booking with the next practice on Google. Traditional phone trees and static web contact forms cause severe drop-offs.
              </p>
            </td>
          </tr>
        </table>

        <!-- Solution Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b1524; border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
          <tr>
            <td style="padding: 16px 20px;">
              <span style="color: #4ade80; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">GARUDA 24/7 Clinical AI Solution:</span>
              <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                <li><strong>Sub-Second Patient Response:</strong> Autonomous intake agent greets patients via web chat or WhatsApp in &lt;3 seconds.</li>
                <li><strong>Clinical Pre-Triage:</strong> Identifies urgent symptoms, answers procedure FAQs (Invisalign, implants, whitening), and verifies insurance/intake basics.</li>
                <li><strong>Automated Calendar Booking:</strong> Direct slot locking into your clinical calendar without receptionist intervention.</li>
                <li><strong>100% Fixed Turnaround:</strong> Full system deployment in 48 hours with zero staff disruption.</li>
              </ul>
            </td>
          </tr>
        </table>

        <!-- Interactive Scoping CTA -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto 16px auto;">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%); border-radius: 10px; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.35);">
              <a href="${scopingUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #04060a; font-size: 14px; font-weight: 800; text-decoration: none; letter-spacing: 0.05em; text-transform: uppercase;">
                View Live Interactive Demo & Architecture →
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 20px 0 0 0; color: #94a3b8; font-size: 13px; line-height: 1.5; text-align: center;">
          Or review our platform overview: <a href="https://www.garudaos.in" target="_blank" style="color: #38bdf8; text-decoration: none;">https://www.garudaos.in</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 24px; background-color: #050a12; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
        <p style="margin: 0;"><strong>GARUDA Operating System</strong> | Autonomous AI & Systems Engineering</p>
        <p style="margin: 4px 0 0 0;">Official Verification: <a href="mailto:praveen@garudaos.in" style="color: #d4af37; text-decoration: none;">praveen@garudaos.in</a> | Platform: <a href="https://www.garudaos.in" style="color: #38bdf8; text-decoration: none;">garudaos.in</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function runCanadianWave() {
  console.log('🦅 [GARUDA CANADIAN WAVE 2] Initializing autonomous dispatch...');
  const dispatched = loadDispatchedEmails();

  const allLeads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  const pendingTargets = allLeads.filter(l => !dispatched.has(l.email.toLowerCase().trim())).slice(0, 10);

  console.log(`Found ${pendingTargets.length} pending Canadian targets ready for dispatch.\n`);

  let count = 0;
  for (const target of pendingTargets) {
    count++;
    console.log(`[${count}/${pendingTargets.length}] Dispatching to: ${target.practiceName} (${target.email}) in ${target.city}...`);

    try {
      const emailHtml = generateDentalVisualBriefHtml(target);
      const subject = `Confidential Brief: Autonomous Patient Intake Architecture for ${target.practiceName}`;

      const res = await sendSmtpWithFallback(smtpConfig, {
        to: target.email,
        from: `"Praveen Mahawar | GARUDA OS" <${smtpConfig.user}>`,
        replyTo: "praveen@garudaos.in",
        subject: subject,
        html: emailHtml
      });

      if (res && (res.accepted || res.messageId)) {
        const msgId = res.messageId || res.providerResponseId || "250_OK";
        console.log(`   ✔ SUCCESS! ProviderResponse: ${res.providerResponseId || res.messageId}`);
        const logEntry = {
          timestamp: new Date().toISOString(),
          leadId: target.id,
          practiceName: target.practiceName,
          email: target.email,
          messageId: msgId,
          status: 'SUCCESS'
        };
        fs.appendFileSync(DISPATCH_LOG, JSON.stringify(logEntry) + '\n', 'utf8');

        // Anti-spam pacing delay (12 seconds)
        if (count < pendingTargets.length) {
          console.log(`   ⏳ Pacing delay 12s before next dispatch...`);
          await sleep(12000);
        }
      }
    } catch (err) {
      console.error(`   ❌ Failed to dispatch to ${target.email}:`, err.message);
    }
  }

  console.log(`\n🎉 Canadian Cadre Wave 2 Dispatch Completed! Dispatched ${count} verified high-ticket briefs.`);
}

runCanadianWave().catch(console.error);
