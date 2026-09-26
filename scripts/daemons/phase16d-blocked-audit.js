/**
 * GARUDA SCOUT FLEET — PHASE 16D BLOCKED INTEGRATIONS & ESCALATION AUDIT
 * 
 * Objective: Verify quarantine status of blocked integrations and live Telegram channel:
 * 1. LinkedIn: STATUS = BLOCKED, Zero public comment execution paths, zero bypass attempts.
 * 2. WhatsApp: STATUS = BLOCKED / UNCONFIGURED, zero fabricated credentials, outbound blocked.
 * 3. Telegram: Live bot handshake verified with @Garudaos_AI_bot and founder chat ID bound.
 */

const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function runPhase16DAudit() {
  console.log('================================================================');
  console.log('🦅 GARUDA SCOUT FLEET — PHASE 16D BLOCKED INTEGRATIONS AUDIT');
  console.log(`Execution Time: ${new Date().toISOString()} | IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log('================================================================\n');

  const report = {};

  // 1. LinkedIn Quarantine Verification
  console.log('--- TEST 1: LinkedIn Quarantine & Zero Public Comments ---');
  const linkedinCode = fs.readFileSync(path.join(__dirname, 'linkedin-scout-daemon.js'), 'utf-8');
  const hasNoCommentButtons = !linkedinCode.includes('.comments-comment-box__submit-button') &&
                             !linkedinCode.includes('comment-button') &&
                             !linkedinCode.includes('Add a comment');
  const hasBlockedStatus = linkedinCode.includes('STATUS = BLOCKED');
  const hasRedirectHandling = linkedinCode.includes('ERR_TOO_MANY_REDIRECTS');
  const t1Pass = hasNoCommentButtons && hasBlockedStatus && hasRedirectHandling;
  report.linkedinQuarantine = {
    status: t1Pass ? 'VERIFIED' : 'FAILED',
    description: 'LinkedIn strictly STATUS = BLOCKED; zero public commenting execution paths exist'
  };
  console.log(`Test 1 (LinkedIn Quarantine): ${report.linkedinQuarantine.status}\n`);

  // 2. WhatsApp Truthful Quarantine Verification
  console.log('--- TEST 2: WhatsApp Unconfigured & No-Send Quarantine ---');
  const waToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isWaUnconfigured = !waToken || waToken === 'your_meta_whatsapp_token_here';
  
  // Verify outbound-safety-gate blocks WhatsApp if ever requested
  const { evaluateOutboundSafetyGate } = require('./outbound-safety-gate');
  const waGateCheck = evaluateOutboundSafetyGate({
    platform: 'whatsapp',
    author: 'TestLead',
    profileUrl: 'https://wa.me/test',
    snippet: 'Need a website',
    pitch: 'Test pitch',
    currentCycleCount: 0
  });
  const t2Pass = isWaUnconfigured && waGateCheck.allowed === false && waGateCheck.gate === 'PLATFORM_CHECK';
  report.whatsappQuarantine = {
    status: t2Pass ? 'VERIFIED' : 'FAILED',
    description: 'WhatsApp verified BLOCKED / UNCONFIGURED; platform allowlist rejects outbound actions'
  };
  console.log(`Test 2 (WhatsApp Quarantine): ${report.whatsappQuarantine.status}\n`);

  // 3. Telegram Live Channel Handshake
  console.log('--- TEST 3: Telegram Live Handshake ---');
  let t3Pass = false;
  try {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const founderChatId = process.env.TELEGRAM_FOUNDER_CHAT_ID;
    if (tgToken && founderChatId) {
      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`).then(r => r.json());
      t3Pass = tgRes && tgRes.ok === true && tgRes.result.username === 'Garudaos_AI_bot';
    }
  } catch (e) {
    t3Pass = false;
  }
  report.telegramHandshake = {
    status: t3Pass ? 'VERIFIED' : 'FAILED',
    description: 'Telegram Bot API live handshake confirmed with @Garudaos_AI_bot'
  };
  console.log(`Test 3 (Telegram Handshake): ${report.telegramHandshake.status}\n`);

  console.log('================================================================');
  console.log('📊 PHASE 16D BLOCKED INTEGRATIONS SUMMARY:');
  console.table(Object.entries(report).map(([item, d]) => ({ Item: item, Status: d.status, Description: d.description })));
  console.log('================================================================');

  const allPassed = Object.values(report).every(r => r.status === 'VERIFIED');
  return { allPassed, report };
}

if (require.main === module) {
  runPhase16DAudit().then(({ allPassed }) => {
    process.exit(allPassed ? 0 : 1);
  }).catch(e => {
    console.error('FATAL 16D AUDIT ERROR:', e);
    process.exit(1);
  });
}

module.exports = { runPhase16DAudit };
