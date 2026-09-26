/**
 * GARUDA CENTRALIZED OUTBOUND SAFETY GATE & AUDIT LEDGER
 * 
 * SOVEREIGN DIRECTIVES:
 * 1. Single Centralized Gate: Evaluated before ANY automated DM across Facebook, Instagram, LinkedIn.
 * 2. If ANY check fails: NO SEND. Logs exact rejection reason.
 * 3. Never records a failed send as successful.
 * 4. Audit ledger: data/leads/outbound_audit_ledger.jsonl
 */

const fs = require('fs');
const path = require('path');
const { isGloballyContacted } = require('./unified-lead-guard');

const AUDIT_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'outbound_audit_ledger.jsonl');
if (!fs.existsSync(path.dirname(AUDIT_FILE))) fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });

const SYSTEM_ACCOUNTS = [
  'instagram',
  'meta',
  'threads',
  'explore',
  'direct',
  'reels',
  'stories',
  'facebook',
  'garudaos.ai',
  'unknown',
  'undefined',
  'null',
  'linkedin member'
];

const PLATFORM_CYCLE_LIMITS = {
  facebook: 3,
  instagram: 3,
  linkedin: 1
};

/**
 * Evaluates the 8-step Centralized Outbound Safety Gate.
 * 
 * candidate
 * ↓
 * identity verified?
 * ↓
 * platform allowed?
 * ↓
 * not system account?
 * ↓
 * not already contacted?
 * ↓
 * within rate limit?
 * ↓
 * context valid?
 * ↓
 * platform auth valid?
 * ↓
 * outreach allowed?
 */
function evaluateOutboundSafetyGate({
  platform,
  author,
  username,
  profileUrl,
  snippet,
  pitch,
  currentCycleCount = 0,
  isAuthBroken = false
}) {
  const normUser = String(username || '').toLowerCase().trim();
  const normAuthor = String(author || '').toLowerCase().trim();

  // 1. Identity Verified?
  const hasValidIdentity = (normUser && normUser.length >= 2 && normUser !== 'unknown') ||
                           (normAuthor && normAuthor.length >= 2 && normAuthor !== 'unknown');
  if (!hasValidIdentity) {
    return {
      allowed: false,
      gate: 'IDENTITY_VERIFICATION',
      reason: `Ambiguous or missing candidate identity (author: "${author}", username: "${username}")`
    };
  }

  // 2. Platform Allowed?
  const validPlatforms = ['facebook', 'instagram', 'linkedin'];
  if (!validPlatforms.includes(platform)) {
    return {
      allowed: false,
      gate: 'PLATFORM_CHECK',
      reason: `Unrecognized or prohibited platform: "${platform}"`
    };
  }

  // 3. Not System Account?
  const isSystem = SYSTEM_ACCOUNTS.includes(normUser) || SYSTEM_ACCOUNTS.includes(normAuthor);
  if (isSystem) {
    return {
      allowed: false,
      gate: 'SYSTEM_ACCOUNT_GUARD',
      reason: `Target is a platform/system account ("${normUser || normAuthor}"). Outreach strictly prohibited.`
    };
  }

  // 4. Platform Authentication Check
  if (isAuthBroken) {
    return {
      allowed: false,
      gate: 'PLATFORM_AUTH_GUARD',
      reason: `Platform authentication is broken or session expired for ${platform}. STATUS = BLOCKED.`
    };
  }

  // 5. Not Already Contacted? (Cross-Platform Global Dedup)
  const dedup = isGloballyContacted({
    username: normUser,
    author: normAuthor,
    profileUrl,
    snippet
  });

  if (dedup.contacted) {
    return {
      allowed: false,
      gate: 'GLOBAL_DEDUPLICATION',
      reason: dedup.reason,
      existing: dedup.existing
    };
  }

  // 6. Within Rate Limit?
  const maxLimit = PLATFORM_CYCLE_LIMITS[platform] ?? 1;
  if (currentCycleCount >= maxLimit) {
    return {
      allowed: false,
      gate: 'RATE_LIMIT_CHECK',
      reason: `Cycle rate limit exhausted (${currentCycleCount}/${maxLimit} DMs already sent for ${platform} this cycle).`
    };
  }

  // 7. Revenue-Intent Classification (Categories A-D allowed, E-H blocked)
  if (snippet) {
    const { classifyRevenueIntent } = require('./revenue-intent-classifier');
    const intent = classifyRevenueIntent(snippet, author, username);
    if (!intent.eligible) {
      return {
        allowed: false,
        gate: 'REVENUE_INTENT_CLASSIFICATION',
        reason: `Candidate rejected by Category ${intent.category} (${intent.name}): ${intent.reasoning}`,
        intent
      };
    }
  }

  // 8. Context & Personalization Valid?
  if (!pitch || typeof pitch !== 'string' || pitch.trim().length < 30) {
    return {
      allowed: false,
      gate: 'CONTEXT_VALIDATION',
      reason: 'Generated pitch is missing or too short to be a valid executive brief.'
    };
  }

  if (!pitch.includes('https://www.garudaos.in')) {
    return {
      allowed: false,
      gate: 'PORTAL_LINK_VALIDATION',
      reason: 'Pitch must contain the official portal link: https://www.garudaos.in'
    };
  }

  if (/\{[a-z0-9_]+\}|\[insert\]|\[name\]/i.test(pitch)) {
    return {
      allowed: false,
      gate: 'TEMPLATE_INTEGRITY_CHECK',
      reason: 'Pitch contains un-hydrated template placeholder tags.'
    };
  }

  // 8. ALL GATES PASSED
  return {
    allowed: true,
    gate: 'ALL_PASS',
    reason: 'All 8 safety checkpoints verified clean.'
  };
}

/**
 * Records every outbound attempt (allowed, blocked, sent, or failed) to audit ledger.
 */
function logOutboundAttempt({
  platform,
  candidateIdentity,
  profileUrl,
  sourcePostUrl = null,
  qualificationResult = null,
  personalizationResult = null,
  dedupResult = null,
  safetyGateResult,
  sendResult = null
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    istTimestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    platform,
    candidateIdentity: candidateIdentity || {},
    profileUrl: profileUrl || null,
    sourcePostUrl: sourcePostUrl || null,
    qualificationResult: qualificationResult || {},
    personalizationResult: personalizationResult ? { preview: String(personalizationResult).slice(0, 100) } : null,
    dedupResult: dedupResult || {},
    safetyGateResult: {
      allowed: safetyGateResult.allowed,
      gate: safetyGateResult.gate,
      reason: safetyGateResult.reason
    },
    sendResult: sendResult || { sent: false, note: 'Not dispatched' },
    blocked: !safetyGateResult.allowed || (sendResult && !sendResult.sent),
    reason: safetyGateResult.reason || (sendResult && sendResult.error) || null
  };

  try {
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.error('[AUDIT LEDGER] Failed to write audit entry:', err.message);
  }

  return entry;
}

module.exports = {
  evaluateOutboundSafetyGate,
  logOutboundAttempt,
  SYSTEM_ACCOUNTS,
  PLATFORM_CYCLE_LIMITS
};
