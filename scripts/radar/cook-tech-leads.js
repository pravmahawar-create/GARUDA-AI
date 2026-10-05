/**
 * 🦅 GARUDA SOVEREIGN LEAD COOKING & DISPATCH ENGINE
 * 
 * Takes the 24 high-intent tech opportunities captured in data/live-tech-opportunities.json,
 * enriches them with contact details (email/telegram/domain/author),
 * dispatches executive email proposals to reachable decision makers,
 * and alerts Founder Praveen on Telegram with instant copy-paste proposal payloads.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { sendSmtpWithFallback } = require('../../src/services/motherPlatformAuthService');
const telegram = require('../../src/services/telegramBotService');

const OPP_FILE = path.join(__dirname, '..', '..', 'data', 'live-tech-opportunities.json');
const DISPATCH_LOG = path.join(__dirname, '..', '..', 'data', 'leads', 'outreach_dispatch_log.jsonl');
const COOKED_LEADS_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'cooked_tech_leads.json');

const SERPER_API_KEY = process.env.SERPER_API_KEY;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function querySerper(query) {
  return new Promise((resolve) => {
    if (!SERPER_API_KEY) return resolve(null);
    const payload = JSON.stringify({ q: query, num: 3 });
    const req = https.request('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

function generateExecutiveEmailHtml(lead) {
  const scopingUrl = `https://www.garudaos.in/chat?ref=${encodeURIComponent(lead.id || 'TECH_FIX')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Engineering Resolution Brief — ${lead.title || 'Technical Solution'}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #03070d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #07101c; border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.85);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 24px; background: linear-gradient(180deg, #0b1524 0%, #07101c 100%); border-bottom: 1px solid rgba(212, 175, 55, 0.25); text-align: center;">
        <div style="display: inline-block; padding: 4px 14px; background-color: rgba(212, 175, 55, 0.12); border: 1px solid #d4af37; border-radius: 999px; color: #fef08a; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px;">
          URGENT TECHNICAL EXECUTION BRIEF
        </div>
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.04em; line-height: 1.3;">
          Immediate Engineering Resolution & Architecture
        </h1>
        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px;">
          GARUDA Sovereign AI & Full-Stack Systems
        </p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 28px 24px;">
        <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Hello,
        </p>
        <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          We saw your active requirement regarding: <strong style="color: #fef08a;">${lead.title}</strong>.
        </p>

        <!-- Problem Isolation Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b1524; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <span style="color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Requirement Breakdown:</span>
              <p style="margin: 6px 0 0 0; color: #e2e8f0; font-size: 13px; line-height: 1.5;">
                ${lead.snippet}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px;">
              <span style="color: #4ade80; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Guaranteed GARUDA Resolution:</span>
              <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                <li><strong>24-48 Hour Turnaround:</strong> Direct execution without trial-and-error delays.</li>
                <li><strong>Robust Error Handling:</strong> Fallback routing, queue retries & zero dropped events.</li>
                <li><strong>Verified Local Delivery:</strong> 100% SHA-256 local verification before deployment.</li>
              </ul>
            </td>
          </tr>
        </table>

        <!-- Live Demo / Scoping CTA -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 28px auto 16px auto;">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #d4af37 0%, #aa8010 100%); border-radius: 10px; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.35);">
              <a href="${scopingUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; color: #04060a; font-size: 14px; font-weight: 800; text-decoration: none; letter-spacing: 0.05em; text-transform: uppercase;">
                Explore Solution & Architecture →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 24px; background-color: #050a12; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
        <p style="margin: 0;"><strong>GARUDA Operating System</strong> | Official Entity Domain: https://www.garudaos.in</p>
        <p style="margin: 4px 0 0 0;">Direct Engineering Escalation: <a href="mailto:praveen@garudaos.in" style="color: #d4af37; text-decoration: none;">praveen@garudaos.in</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function cookAndDispatch() {
  console.log('🦅 [LEAD COOKING ENGINE] Loading scouted opportunities...');
  if (!fs.existsSync(OPP_FILE)) {
    console.error('❌ OPP_FILE not found:', OPP_FILE);
    return;
  }

  const raw = fs.readFileSync(OPP_FILE, 'utf8');
  const opps = JSON.parse(raw);
  console.log(`Loaded ${opps.length} opportunities for processing.`);

  const cookedLeads = [];
  let dispatchedCount = 0;

  for (let i = 0; i < opps.length; i++) {
    const opp = opps[i];
    console.log(`\n🍳 [${i+1}/${opps.length}] Cooking Lead: [${opp.category}] ${opp.title.slice(0, 60)}...`);

    const leadInfo = {
      ...opp,
      cookedAt: new Date().toISOString(),
      actionableChannel: 'MANUAL_OR_PLATFORM',
      resolvedEmail: null,
      dispatched: false
    };

    // 1. Identify specific entity or company name from title & snippet
    let entityMatch = opp.snippet.match(/([a-zA-Z0-9_\-\.]+@(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,})/);
    if (entityMatch) {
      leadInfo.resolvedEmail = entityMatch[1];
      leadInfo.actionableChannel = 'DIRECT_EMAIL';
    }

    // 2. If it's a dental / car care / tutor business with known domain or company name, query email
    if (!leadInfo.resolvedEmail && (opp.category === 'UK_HIGH_TICKET_TUITION' || opp.category === 'FB_GHL_AUTOMATION')) {
      const queryName = opp.title.replace(/[^a-zA-Z0-9\s]/g, ' ').slice(0, 40);
      try {
        const serperRes = await querySerper(`"${queryName}" contact email`);
        if (serperRes && serperRes.organic) {
          for (const org of serperRes.organic) {
            const m = (org.snippet + ' ' + org.title).match(/([a-zA-Z0-9_\-\.]+@(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,})/);
            if (m && !m[1].includes('example.com') && !m[1].includes('sentry.io')) {
              leadInfo.resolvedEmail = m[1];
              leadInfo.actionableChannel = 'DIRECT_EMAIL';
              console.log(`   ✔ Resolved Email via Serper: ${leadInfo.resolvedEmail}`);
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`   ⚠ Serper email lookup note: ${err.message}`);
      }
    }

    // 3. Dispatch Email if direct email is resolved
    if (leadInfo.resolvedEmail) {
      console.log(`   📧 Dispatching Executive Visual Brief to: ${leadInfo.resolvedEmail}...`);
      try {
        const emailHtml = generateExecutiveEmailHtml(leadInfo);
        const sendRes = await sendSmtpWithFallback({
          to: leadInfo.resolvedEmail,
          from: `"Praveen Mahawar | GARUDA OS" <${process.env.GARUDA_EMAIL_USER || 'praveen@garudaos.in'}>`,
          subject: `Urgent Engineering Solution: ${leadInfo.title.slice(0, 60)}`,
          html: emailHtml
        });

        if (sendRes && sendRes.messageId) {
          leadInfo.dispatched = true;
          leadInfo.messageId = sendRes.messageId;
          dispatchedCount++;
          console.log(`   ✔ Dispatched cleanly! MessageID: ${sendRes.messageId}`);

          // Append to outreach log
          fs.appendFileSync(
            DISPATCH_LOG,
            JSON.stringify({
              timestamp: new Date().toISOString(),
              recipientEmail: leadInfo.resolvedEmail,
              leadId: leadInfo.id,
              category: leadInfo.category,
              messageId: sendRes.messageId,
              status: 'SENT'
            }) + '\n',
            'utf8'
          );

          // Pacing delay (10-15s for rate limit protection)
          await sleep(10000);
        }
      } catch (emailErr) {
        console.error(`   ❌ Email dispatch failed for ${leadInfo.resolvedEmail}:`, emailErr.message);
      }
    }

    cookedLeads.push(leadInfo);
  }

  // Save cooked leads
  fs.mkdirSync(path.dirname(COOKED_LEADS_FILE), { recursive: true });
  fs.writeFileSync(COOKED_LEADS_FILE, JSON.stringify(cookedLeads, null, 2), 'utf8');
  console.log(`\n✔ Cooked ${cookedLeads.length} leads. Dispatched ${dispatchedCount} direct emails.`);

  // 4. Alert Founder Praveen on Telegram with the top cooked opportunities + direct links & ready-to-paste messages
  console.log('📱 Formatting Telegram War-Room Brief for Founder Praveen...');
  try {
    const telegramHeader = 
      `🦅 *GARUDA REVENUE HUNTER: 24 LEADS COOKED*\n\n` +
      `Founder Praveen ji, AI Scout ne 24 high-intent leads cook kar liye hain.\n` +
      `• *Direct Emails Dispatched:* ${dispatchedCount}\n` +
      `• *Platform Gigs (Upwork/Reddit/FB):* ${cookedLeads.length - dispatchedCount}\n\n` +
      `Neeche top 5 immediate money opportunities hain jahan direct drop karke instant response liya ja sakta hai:`;

    await telegram.sendMessage(telegramHeader);
    await sleep(600);

    const top5 = cookedLeads.slice(0, 5);
    for (let i = 0; i < top5.length; i++) {
      const l = top5[i];
      const card = 
        `🔥 *Deal #${i+1} [${l.category}]*\n` +
        `📌 *Title:* ${l.title}\n` +
        `🔗 *Direct Link:* ${l.link}\n` +
        `🎯 *Requirement:* ${l.snippet.slice(0, 160)}...\n\n` +
        `💼 *Actionable Pitch (Copy & Drop):*\n\`\`\`\n${l.recommendedPitch.slice(0, 400)}...\n\`\`\``;

      await telegram.sendMessage(card);
      await sleep(600);
    }

    console.log('✔ Telegram alert dispatched to Founder phone successfully!');
  } catch (telErr) {
    console.error('⚠ Telegram dispatch note:', telErr.message);
  }
}

cookAndDispatch().catch(console.error);
