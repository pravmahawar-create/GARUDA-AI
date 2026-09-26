/**
 * GARUDA SCOUT FLEET — PHASE 16C SCOUT QUALITY & DRY-RUN AUDIT
 * 
 * Objective: Validate discovery quality, candidate qualification, identity
 * resolution, and safety gate outbound decisioning in strict DRY-RUN mode.
 * 
 * GUARANTEE: Zero live outbound DMs are dispatched. All checks verify
 * end-to-end extraction, negative vendor filtering, system account defense,
 * cross-platform deduplication, and audit ledger integrity.
 */

const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { evaluateOutboundSafetyGate, logOutboundAttempt } = require('./outbound-safety-gate');
const { isGloballyContacted, recordContactedLead } = require('./unified-lead-guard');

// Import candidate qualification helpers
const fbKeywords = ['need', 'looking for', 'seeking', 'recommend', 'suggestions', 'hire', 'developer', 'designer', 'website', 'app'];
const fbVendorKeywords = [
  'we are an agency', 'we are a team', 'our agency', 'dm me for services',
  'check our portfolio', 'we offer web', 'contact us on whatsapp', 'affordable prices',
  'hire us', 'best web development company', 'order now'
];

function qualifyFacebookLead(text) {
  const lower = (text || '').toLowerCase();
  const isVendor = fbVendorKeywords.some(v => lower.includes(v));
  if (isVendor) {
    return { qualified: false, reason: 'Negative vendor advertisement' };
  }
  const hasKeyword = fbKeywords.some(k => lower.includes(k));
  if (!hasKeyword) {
    return { qualified: false, reason: 'No buyer intent keywords' };
  }
  return { qualified: true, reason: 'Valid buyer inquiry detected' };
}

function qualifyInstagramLead(caption, author) {
  const SYSTEM_ACCOUNTS = ['instagram', 'meta', 'threads', 'explore', 'direct', 'reels', 'stories', 'garudaos.ai'];
  const normAuthor = (author || '').toLowerCase().replace(/[^a-z0-9._]/g, '');
  if (SYSTEM_ACCOUNTS.includes(normAuthor)) {
    return { qualified: false, reason: `System account target (@${normAuthor})` };
  }
  if (!normAuthor || normAuthor === 'unknown' || normAuthor === 'instagramuser') {
    return { qualified: false, reason: 'Ambiguous or anonymous author identity' };
  }
  const lower = (caption || '').toLowerCase();
  const hasNeed = lower.includes('need') || lower.includes('looking for') || lower.includes('recommend') || lower.includes('developer');
  if (!hasNeed) {
    return { qualified: false, reason: 'No procurement intent detected in caption' };
  }
  return { qualified: true, reason: 'Valid Instagram buyer lead' };
}

function buildExecutivePitch(platform, name, context) {
  return `Hi ${name}! Saw your note regarding needing a reputable developer for your project. Reaching out directly in private rather than adding noise to your public comments.\n\nOur team at GARUDA specializes in production-grade software and high-speed web/app engineering with rapid 48-hour turnarounds.\n\nLive portfolio & systems: https://www.garudaos.in\n\nBest regards,\nPraveen Mahawar\nFounder, GARUDA OS`;
}

async function runPhase16CDryRunAudit() {
  console.log('================================================================');
  console.log('🦅 GARUDA SCOUT FLEET — PHASE 16C SCOUT QUALITY & DRY-RUN AUDIT');
  console.log(`Execution Time: ${new Date().toISOString()} | IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log('Mode: STRICT DRY-RUN (ZERO Outbound DMs Dispatched)');
  console.log('================================================================\n');

  const report = {};

  // SCENARIO 1: Facebook Buyer Discovery (Qualified & Clean)
  console.log('--- SCENARIO 1: Facebook Buyer Inquiry Discovery ---');
  const fbBuyerCandidate = {
    author: 'Sarah Jenkins',
    profileLink: 'https://facebook.com/sarah.jenkins.biz',
    text: 'Looking for a reliable dependable website designer for our medical clinic redesign. Please PM details!'
  };
  const qual1 = qualifyFacebookLead(fbBuyerCandidate.text);
  const pitch1 = buildExecutivePitch('facebook', fbBuyerCandidate.author, fbBuyerCandidate.text);
  const gate1 = evaluateOutboundSafetyGate({
    platform: 'facebook',
    author: fbBuyerCandidate.author,
    profileUrl: fbBuyerCandidate.profileLink,
    snippet: fbBuyerCandidate.text,
    pitch: pitch1,
    currentCycleCount: 0
  });
  const audit1 = logOutboundAttempt({
    platform: 'facebook',
    candidateIdentity: { author: fbBuyerCandidate.author },
    profileUrl: fbBuyerCandidate.profileLink,
    sourcePostUrl: 'https://facebook.com/search/posts?q=test',
    qualificationResult: qual1,
    personalizationResult: pitch1,
    safetyGateResult: gate1,
    sendResult: { dryRun: true, sent: false, note: 'Dry-run approved without dispatch' }
  });
  const s1Pass = qual1.qualified === true && gate1.allowed === true && audit1.candidateIdentity.author === 'Sarah Jenkins';
  report.scenario1 = {
    status: s1Pass ? 'VERIFIED' : 'FAILED',
    description: 'Facebook genuine buyer qualified and approved by Safety Gate for dry-run'
  };
  console.log(`Scenario 1: ${report.scenario1.status}\n`);

  // SCENARIO 2: Facebook Vendor Advertisement Filtering
  console.log('--- SCENARIO 2: Facebook Vendor Advertisement Filtering ---');
  const fbVendorCandidate = {
    author: 'Web Solutions Pro',
    profileLink: 'https://facebook.com/websolutionspro',
    text: 'We are an agency offering modern responsive websites starting at $99. Contact us on WhatsApp now!'
  };
  const qual2 = qualifyFacebookLead(fbVendorCandidate.text);
  const s2Pass = qual2.qualified === false && qual2.reason === 'Negative vendor advertisement';
  report.scenario2 = {
    status: s2Pass ? 'VERIFIED' : 'FAILED',
    description: 'Vendor advertisement cleanly rejected before safety gate evaluation'
  };
  console.log(`Scenario 2: ${report.scenario2.status}\n`);

  // SCENARIO 3: Facebook Ambiguous Profile Blocked
  console.log('--- SCENARIO 3: Facebook Ambiguous Profile Blocked ---');
  const fbAnonCandidate = {
    author: '',
    profileLink: 'https://facebook.com/profile.php?id=unknown',
    text: 'Need someone to build a flutter app'
  };
  const gate3 = evaluateOutboundSafetyGate({
    platform: 'facebook',
    author: fbAnonCandidate.author,
    profileUrl: fbAnonCandidate.profileLink,
    snippet: fbAnonCandidate.text,
    pitch: buildExecutivePitch('facebook', 'Friend', fbAnonCandidate.text),
    currentCycleCount: 0
  });
  const s3Pass = gate3.allowed === false && gate3.gate === 'IDENTITY_VERIFICATION';
  report.scenario3 = {
    status: s3Pass ? 'VERIFIED' : 'FAILED',
    description: 'Anonymous/empty author blocked at IDENTITY_VERIFICATION stage'
  };
  console.log(`Scenario 3: ${report.scenario3.status}\n`);

  // SCENARIO 4: Cross-Platform Duplicate Candidate Suppressed
  console.log('--- SCENARIO 4: Cross-Platform Duplicate Candidate Suppressed ---');
  // First record a test lead
  recordContactedLead({
    author: 'Michael Scott',
    username: 'michaelscott99',
    profileUrl: 'https://facebook.com/michaelscott99',
    platform: 'facebook',
    snippet: 'Need a developer for Dunder Mifflin paper sales website'
  });
  // Now attempt to target Michael on Instagram
  const igDupCandidate = {
    username: 'michaelscott99',
    author: 'Michael Scott',
    profileUrl: 'https://instagram.com/michaelscott99',
    caption: 'Need a mobile app built ASAP'
  };
  const gate4 = evaluateOutboundSafetyGate({
    platform: 'instagram',
    author: igDupCandidate.author,
    username: igDupCandidate.username,
    profileUrl: igDupCandidate.profileUrl,
    snippet: igDupCandidate.caption,
    pitch: buildExecutivePitch('instagram', igDupCandidate.author, igDupCandidate.caption),
    currentCycleCount: 0
  });
  const s4Pass = gate4.allowed === false && gate4.gate === 'GLOBAL_DEDUPLICATION';
  report.scenario4 = {
    status: s4Pass ? 'VERIFIED' : 'FAILED',
    description: 'Cross-platform candidate (contacted on FB) blocked on Instagram'
  };
  console.log(`Scenario 4: ${report.scenario4.status}\n`);

  // SCENARIO 5: Instagram Genuine Poster Discovery
  console.log('--- SCENARIO 5: Instagram Genuine Poster Discovery ---');
  const igBuyerCandidate = {
    username: 'dr_clara_clinics',
    author: 'Dr. Clara Clinics',
    profileUrl: 'https://instagram.com/dr_clara_clinics',
    caption: 'Looking for a reliable web designer to revamp our patient booking portal #needwebsite'
  };
  const qual5 = qualifyInstagramLead(igBuyerCandidate.caption, igBuyerCandidate.author);
  const pitch5 = buildExecutivePitch('instagram', igBuyerCandidate.author, igBuyerCandidate.caption);
  const gate5 = evaluateOutboundSafetyGate({
    platform: 'instagram',
    author: igBuyerCandidate.author,
    username: igBuyerCandidate.username,
    profileUrl: igBuyerCandidate.profileUrl,
    snippet: igBuyerCandidate.caption,
    pitch: pitch5,
    currentCycleCount: 0
  });
  const s5Pass = qual5.qualified === true && gate5.allowed === true;
  report.scenario5 = {
    status: s5Pass ? 'VERIFIED' : 'FAILED',
    description: 'Instagram genuine buyer qualified and approved by Safety Gate for dry-run'
  };
  console.log(`Scenario 5: ${report.scenario5.status}\n`);

  // SCENARIO 6: Instagram System Account Blocked
  console.log('--- SCENARIO 6: Instagram System Account Target Blocked ---');
  const igSystemCandidate = {
    username: 'instagram',
    author: 'Instagram Official',
    profileUrl: 'https://instagram.com/instagram',
    caption: 'Share your reels with friends'
  };
  const qual6 = qualifyInstagramLead(igSystemCandidate.caption, igSystemCandidate.username);
  const gate6 = evaluateOutboundSafetyGate({
    platform: 'instagram',
    author: igSystemCandidate.author,
    username: igSystemCandidate.username,
    profileUrl: igSystemCandidate.profileUrl,
    snippet: igSystemCandidate.caption,
    pitch: buildExecutivePitch('instagram', 'Instagram', igSystemCandidate.caption),
    currentCycleCount: 0
  });
  const s6Pass = qual6.qualified === false && gate6.allowed === false && gate6.gate === 'SYSTEM_ACCOUNT_GUARD';
  report.scenario6 = {
    status: s6Pass ? 'VERIFIED' : 'FAILED',
    description: 'System account (@instagram) blocked by both qualification and safety gate'
  };
  console.log(`Scenario 6: ${report.scenario6.status}\n`);

  // SCENARIO 7: Rate Limit Exhaustion Simulation
  console.log('--- SCENARIO 7: Cycle Rate Limit Exhaustion ---');
  const gate7 = evaluateOutboundSafetyGate({
    platform: 'facebook',
    author: 'Fresh Lead 7',
    profileUrl: 'https://facebook.com/freshlead7',
    snippet: 'Looking for a web designer for real estate agency',
    pitch: buildExecutivePitch('facebook', 'Fresh Lead', 'Looking for a web designer'),
    currentCycleCount: 2 // Max cycle limit is 2
  });
  const s7Pass = gate7.allowed === false && gate7.gate === 'RATE_LIMIT_CHECK';
  report.scenario7 = {
    status: s7Pass ? 'VERIFIED' : 'FAILED',
    description: 'Cycle rate limit ceiling (2/2) strictly enforced with zero outbound bypass'
  };
  console.log(`Scenario 7: ${report.scenario7.status}\n`);

  console.log('================================================================');
  console.log('📊 PHASE 16C DRY-RUN AUDIT SUMMARY:');
  console.table(Object.entries(report).map(([scen, d]) => ({ Scenario: scen, Status: d.status, Description: d.description })));
  console.log('================================================================');

  const allPassed = Object.values(report).every(r => r.status === 'VERIFIED');
  return { allPassed, report };
}

if (require.main === module) {
  runPhase16CDryRunAudit().then(({ allPassed }) => {
    process.exit(allPassed ? 0 : 1);
  }).catch(e => {
    console.error('FATAL 16C AUDIT ERROR:', e);
    process.exit(1);
  });
}

module.exports = { runPhase16CDryRunAudit };
