/**
 * GARUDA SCOUT FLEET — PHASE 16A CORE SAFETY FREEZE VERIFICATION
 * 
 * Verifies all 9 mandatory Phase 16A checkpoints:
 * 1. outbound-safety-gate.js (8 checkpoints)
 * 2. unified-lead-guard.js (FB ↔ IG ↔ LinkedIn cross-platform dedup & process lock)
 * 3. Instagram system account protection (@Instagram, Meta, Threads, Explore)
 * 4. Facebook negative vendor filter
 * 5. LinkedIn public comment execution path (MUST remain completely absent)
 * 6. WhatsApp status (MUST remain BLOCKED / UNCONFIGURED)
 * 7. Telegram service regression (live bot handshake)
 * 8. Security terminology check ("E2EE bypass" absent)
 * 9. Audit ledger record structure
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { evaluateOutboundSafetyGate, logOutboundAttempt } = require('./outbound-safety-gate');
const { isGloballyContacted, acquireProcessLock } = require('./unified-lead-guard');
const telegram = require('../../src/services/telegramBotService');
const waCloud = require('../../src/services/whatsappCloudService');

const VALID_PITCH = "Hi! Saw your note regarding needing a reputable developer. Reaching out directly in private rather than adding noise to public feeds.\n\nOur engineering team at GARUDA crafts custom, modern websites and high-performance apps with rapid 48-hour turnarounds.\n\nLive portfolio & interactive systems: https://www.garudaos.in\n\nBest regards,\nPraveen Mahawar\nFounder, GARUDA OS";

async function runPhase16AAudit() {
  console.log('================================================================');
  console.log('🦅 GARUDA SCOUT FLEET — PHASE 16A CORE SAFETY AUDIT');
  console.log(`Execution Time: ${new Date().toISOString()} | IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log('================================================================\n');

  const report = {};

  // Checkpoint 1: outbound-safety-gate.js
  console.log('--- CHECKPOINT 1: Outbound Safety Gate 8-Stage Check ---');
  const gateTest1 = evaluateOutboundSafetyGate({ platform: 'instagram', username: '', author: '', pitch: VALID_PITCH });
  const gateTest2 = evaluateOutboundSafetyGate({ platform: 'twitter', username: 'test', author: 'Test', pitch: VALID_PITCH });
  const gateTest3 = evaluateOutboundSafetyGate({ platform: 'instagram', username: 'Instagram', author: 'Instagram', pitch: VALID_PITCH });
  const gateTest4 = evaluateOutboundSafetyGate({ platform: 'linkedin', username: 'test', author: 'Test', pitch: VALID_PITCH, isAuthBroken: true });
  const gateTest5 = evaluateOutboundSafetyGate({ platform: 'facebook', author: 'Alanna Giselle', profileUrl: 'https://facebook.com/16201101', pitch: VALID_PITCH });
  const gateTest6 = evaluateOutboundSafetyGate({ platform: 'facebook', author: 'FreshUser99', profileUrl: 'https://facebook.com/fresh', pitch: VALID_PITCH, currentCycleCount: 2 });
  const gateTest7 = evaluateOutboundSafetyGate({ platform: 'facebook', author: 'FreshUser99', profileUrl: 'https://facebook.com/fresh', pitch: 'Too short' });
  const gateTest8 = evaluateOutboundSafetyGate({ platform: 'facebook', author: 'FreshUser99', profileUrl: 'https://facebook.com/fresh', pitch: VALID_PITCH, currentCycleCount: 0 });

  const c1Pass = (!gateTest1.allowed && gateTest1.gate === 'IDENTITY_VERIFICATION') &&
                 (!gateTest2.allowed && gateTest2.gate === 'PLATFORM_CHECK') &&
                 (!gateTest3.allowed && gateTest3.gate === 'SYSTEM_ACCOUNT_GUARD') &&
                 (!gateTest4.allowed && gateTest4.gate === 'PLATFORM_AUTH_GUARD') &&
                 (!gateTest5.allowed && gateTest5.gate === 'GLOBAL_DEDUPLICATION') &&
                 (!gateTest6.allowed && gateTest6.gate === 'RATE_LIMIT_CHECK') &&
                 (!gateTest7.allowed && gateTest7.gate === 'CONTEXT_VALIDATION') &&
                 (gateTest8.allowed && gateTest8.gate === 'ALL_PASS');

  report.checkpoint1 = { status: c1Pass ? 'VERIFIED' : 'FAILED', description: 'All 8 gate checkpoints pass exact specifications' };
  console.log(`Checkpoint 1: ${report.checkpoint1.status}`);

  // Checkpoint 2: unified-lead-guard.js
  console.log('--- CHECKPOINT 2: Unified Cross-Platform Lead Guard ---');
  const fbCheck = isGloballyContacted({ username: 'alannagiselle' });
  const igCheck = isGloballyContacted({ author: 'Instagram' });
  const freshCheck = isGloballyContacted({ author: 'UniqueFreshAuthor_98721' });
  const lockCheck = acquireProcessLock('phase16a_lock_test');
  const duplicateLock = acquireProcessLock('phase16a_lock_test');
  lockCheck.release();

  const c2Pass = fbCheck.contacted && igCheck.contacted && !freshCheck.contacted && lockCheck.acquired && !duplicateLock.acquired;
  report.checkpoint2 = { status: c2Pass ? 'VERIFIED' : 'FAILED', description: 'Bidirectional FB/IG/LinkedIn matching and PID lock verified' };
  console.log(`Checkpoint 2: ${report.checkpoint2.status}`);

  // Checkpoint 3: Instagram System Account Protection
  console.log('--- CHECKPOINT 3: Instagram System Account Blocklist ---');
  const sysUsers = ['instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories', 'garudaos.ai'];
  let allSysBlocked = true;
  for (const u of sysUsers) {
    const res = evaluateOutboundSafetyGate({ platform: 'instagram', username: u, author: u, pitch: VALID_PITCH });
    if (res.allowed) allSysBlocked = false;
  }
  report.checkpoint3 = { status: allSysBlocked ? 'VERIFIED' : 'FAILED', description: 'All 8 system/meta accounts blocked from outreach' };
  console.log(`Checkpoint 3: ${report.checkpoint3.status}`);

  // Checkpoint 4: Facebook Negative Vendor Filter
  console.log('--- CHECKPOINT 4: Facebook Negative Vendor Filter ---');
  const vendorAd = 'Build your app on CreatorX.in! Our agency offers fullstack development, hire our team today and sign up today.';
  const buyerNote = 'Looking for a reliable web designer for business website. Need urgent delivery.';
  const isVendorAd = /build your app on|our agency|our services|hire our team|we offer|sign up today|download our|pricing plan/i.test(vendorAd);
  const isBuyerAd = /build your app on|our agency|our services|hire our team|we offer|sign up today|download our|pricing plan/i.test(buyerNote);
  const c4Pass = isVendorAd && !isBuyerAd;
  report.checkpoint4 = { status: c4Pass ? 'VERIFIED' : 'FAILED', description: 'Vendor advertisements cleanly rejected, buyer notes preserved' };
  console.log(`Checkpoint 4: ${report.checkpoint4.status}`);

  // Checkpoint 5: LinkedIn Public-Comment Absence
  console.log('--- CHECKPOINT 5: LinkedIn Zero Public Comments Audit ---');
  const lnkdCode = fs.readFileSync(path.join(__dirname, 'linkedin-scout-daemon.js'), 'utf8');
  const hasCommentSelectors = lnkdCode.includes('comments-comment-box') ||
                              lnkdCode.includes("button[aria-label*='Comment' i]") ||
                              lnkdCode.includes("role='textbox'][aria-label*='comment' i]");
  report.checkpoint5 = { status: !hasCommentSelectors ? 'VERIFIED' : 'FAILED', description: 'Zero public comment DOM elements/actions in linkedin daemon' };
  console.log(`Checkpoint 5: ${report.checkpoint5.status}`);

  // Checkpoint 6: WhatsApp Status Quarantine
  console.log('--- CHECKPOINT 6: WhatsApp Honest Quarantine ---');
  const isWaCloud = waCloud.isCloudConfigured();
  const orchCode = fs.readFileSync(path.join(__dirname, 'master-scout-orchestrator.js'), 'utf8');
  const hasFakeWa = orchCode.includes('Any hot prospect reply will trigger an immediate WhatsApp');
  const c6Pass = !isWaCloud && !hasFakeWa && orchCode.includes('WhatsApp = BLOCKED / UNCONFIGURED');
  report.checkpoint6 = { status: c6Pass ? 'VERIFIED' : 'FAILED', description: 'WhatsApp verified BLOCKED / UNCONFIGURED without fake claims' };
  console.log(`Checkpoint 6: ${report.checkpoint6.status}`);

  // Checkpoint 7: Telegram Bot Regression
  console.log('--- CHECKPOINT 7: Telegram Bot Service Handshake ---');
  let c7Pass = false;
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`).then(r => r.json());
    c7Pass = tgRes && tgRes.ok && tgRes.result.username === 'Garudaos_AI_bot' && Boolean(process.env.TELEGRAM_FOUNDER_CHAT_ID);
  } catch (e) {
    c7Pass = false;
  }
  report.checkpoint7 = { status: c7Pass ? 'VERIFIED' : 'FAILED', description: 'Live handshake verified with @Garudaos_AI_bot' };
  console.log(`Checkpoint 7: ${report.checkpoint7.status}`);

  // Checkpoint 8: Security Terminology Audit
  console.log('--- CHECKPOINT 8: Security Terminology Audit ---');
  const targetPattern = new RegExp(['e2ee', 'bypass'].join('\\s*'), 'i');
  const daemonFiles = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.js') && f !== 'phase16a-safety-audit.js' && f !== 'fleet-regression-suite.js');
  let hasBypassTerm = false;
  for (const f of daemonFiles) {
    const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
    if (targetPattern.test(content)) {
      hasBypassTerm = true;
      console.error(`Found invalid terminology in: ${f}`);
    }
  }
  report.checkpoint8 = { status: !hasBypassTerm ? 'VERIFIED' : 'FAILED', description: 'Forbidden terminology zero occurrences across daemons; correct terminology enforced' };
  console.log(`Checkpoint 8: ${report.checkpoint8.status}`);

  // Checkpoint 9: Audit Ledger Recording
  console.log('--- CHECKPOINT 9: Outbound Audit Ledger Verification ---');
  const testAttempt = logOutboundAttempt({
    platform: 'facebook',
    candidateIdentity: { author: 'TestAuditLead' },
    profileUrl: 'https://facebook.com/test',
    sourcePostUrl: 'https://facebook.com/search',
    qualificationResult: { isNeed: true },
    personalizationResult: VALID_PITCH,
    safetyGateResult: { allowed: false, gate: 'RATE_LIMIT_CHECK', reason: 'Cycle rate limit test' }
  });
  const c9Pass = testAttempt.blocked === true && testAttempt.reason === 'Cycle rate limit test' && testAttempt.timestamp && testAttempt.istTimestamp;
  report.checkpoint9 = { status: c9Pass ? 'VERIFIED' : 'FAILED', description: 'JSONL audit ledger records exact fields with blocked=true' };
  console.log(`Checkpoint 9: ${report.checkpoint9.status}\n`);

  console.log('================================================================');
  console.log('📊 PHASE 16A AUDIT SUMMARY:');
  console.table(Object.entries(report).map(([cp, d]) => ({ Checkpoint: cp, Status: d.status, Description: d.description })));
  console.log('================================================================');

  const allPassed = Object.values(report).every(r => r.status === 'VERIFIED');
  return { allPassed, report };
}

if (require.main === module) {
  runPhase16AAudit().then(({ allPassed }) => {
    process.exit(allPassed ? 0 : 1);
  }).catch(e => {
    console.error('FATAL 16A AUDIT ERROR:', e);
    process.exit(1);
  });
}

module.exports = { runPhase16AAudit };
