/**
 * Failure Injection Test Suite
 * Section 20: Deliberately simulates controlled system, network, and platform failures.
 * Verifies that the engine degrades safely with 0 unhandled exceptions or state corruptions.
 */

const assert = require('assert');
const { WorkerStateMachine, WORKER_STATES } = require('../core/stateMachine');
const ProfileLockManager = require('../browser/profileLockManager');
const SecurityChallengeDetector = require('../core/securityChallengeDetector');
const LeadDeduplication = require('../leads/leadDeduplication');
const InstagramExtractor = require('../platforms/instagram/instagramExtractor');
const TelegramAlertService = require('../notifications/telegramAlertService');
const StateStore = require('../persistence/stateStore');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function runFailureInjectionTests() {
  console.log('--- Running Controlled Failure Injection Tests ---');

  // Failure 1: CDP unavailable when configured
  const fakeCdpUrl = 'http://127.0.0.1:65530'; // guaranteed offline port
  const StealthBrowserFactory = require('../browser/stealthBrowserFactory');
  const cdpRes = await StealthBrowserFactory.connectToExistingBrowser(fakeCdpUrl);
  assert.strictEqual(cdpRes.success, false);
  assert.ok(cdpRes.error.includes('Failed to attach'));

  // Failure 2: Profile Lock Conflict (Active process collision)
  const tempDir = path.join(os.tmpdir(), `fail_test_lock_${Date.now()}`);
  const lockMgr = new ProfileLockManager(tempDir);
  const l1 = lockMgr.acquireLock('linkedin');
  assert.strictEqual(l1.acquired, true);
  const l2 = lockMgr.acquireLock('linkedin'); // collision
  assert.strictEqual(l2.acquired, false);
  assert.ok(l2.reason.includes('Active process'));
  lockMgr.releaseLock('linkedin');

  // Failure 3: Malformed DOM during extraction
  const brokenPage = {
    isClosed: () => false,
    evaluate: async () => { throw new Error('DOM Context Execution Destroyed'); }
  };
  const extracted = await InstagramExtractor.extractPost(brokenPage, 'https://instagram.com/p/broken');
  assert.strictEqual(extracted.status, 'UNKNOWN');
  assert.strictEqual(extracted.author.username, null);
  assert.strictEqual(extracted.confidence, 0);

  // Failure 4: Duplicate Lead Injection
  const tempDedupFile = path.join(os.tmpdir(), `fail_dedup_${Date.now()}.json`);
  const dedup = new LeadDeduplication(tempDedupFile);
  const sampleLead = { platform: 'facebook', profileUrl: 'https://facebook.com/lead123', name: 'Lead 123' };
  assert.strictEqual(dedup.isDuplicateLead('facebook', sampleLead.profileUrl), false);
  dedup.registerLead(sampleLead);
  assert.strictEqual(dedup.isDuplicateLead('facebook', sampleLead.profileUrl), true);
  try { fs.unlinkSync(tempDedupFile); } catch (_) {}

  // Failure 5: Telegram Client API failure fallback
  const brokenTelegramClient = {
    sendMessage: async () => { throw new Error('Telegram Gateway 502 Bad Gateway'); }
  };
  const telegramService = new TelegramAlertService(brokenTelegramClient);
  const alertRes = await telegramService.sendAlert('CRITICAL', 'Simulated Failure', 'Test error condition');
  assert.strictEqual(alertRes.delivered, false);
  assert.ok(alertRes.error.includes('502 Bad Gateway')); // Handled gracefully, did not crash process!

  // Failure 6: Redirect Loop / Security Challenge stops worker safely
  const sm = new WorkerStateMachine('linkedin');
  sm.transition(WORKER_STATES.STARTING_BROWSER);
  sm.transition(WORKER_STATES.AUTH_CHECK);
  sm.transition(WORKER_STATES.SECURITY_BLOCKED, 'LinkedIn ERR_TOO_MANY_REDIRECTS Challenge');
  assert.strictEqual(sm.getState(), WORKER_STATES.SECURITY_BLOCKED);
  assert.strictEqual(sm.canTransitionTo(WORKER_STATES.OUTREACHING), false);
  assert.strictEqual(sm.canTransitionTo(WORKER_STATES.DISCOVERING), false);

  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}

  console.log('✔ Failure Injection: ALL 6 SIMULATED ANOMALIES DEGRADED SAFELY (Zero Unhandled Crashes)');
  return true;
}

if (require.main === module) {
  runFailureInjectionTests().catch(console.error);
}

module.exports = runFailureInjectionTests;
