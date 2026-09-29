/**
 * Outreach Safety Gate & Queue Test
 * Section 14: Verifies that outreach is never dispatched silently.
 * Enforces AUTO_ALLOWED, HUMAN_APPROVAL_REQUIRED, and BLOCKED policies.
 */

const assert = require('assert');
const ApprovalGate = require('../outreach/approvalGate');
const OutreachQueue = require('../outreach/outreachQueue');
const fs = require('fs');
const path = require('path');
const os = require('os');

function runOutreachSafetyTests() {
  console.log('--- Testing Outreach Safety Gate & Queue ---');

  const tempQueueFile = path.join(os.tmpdir(), `test_queue_${Date.now()}.json`);
  const queue = new OutreachQueue(tempQueueFile);

  try {
    // 1. High confidence verified lead -> AUTO_ALLOWED
    const lead1 = {
      leadId: 'lead_test_01',
      platform: 'instagram',
      name: 'Alpha Founder',
      profileUrl: 'https://instagram.com/alphafounder/',
      confidence: 90,
      status: 'VERIFIED'
    };
    const gate1 = ApprovalGate.evaluate({
      lead: lead1,
      pitch: 'Hello Alpha Founder, we noticed your project scope for an MVP.',
      platformHealthy: true,
      rateLimitAvailable: true,
      autoAllowedEnabled: true
    });
    assert.strictEqual(gate1.status, 'AUTO_ALLOWED');

    // 2. Low confidence lead (<70) -> HUMAN_APPROVAL_REQUIRED
    const lead2 = {
      leadId: 'lead_test_02',
      platform: 'facebook',
      name: 'Ambiguous User',
      profileUrl: 'https://facebook.com/user123',
      confidence: 65,
      status: 'LOW_CONFIDENCE'
    };
    const gate2 = ApprovalGate.evaluate({
      lead: lead2,
      pitch: 'Hello, saw your post regarding website development services.',
      platformHealthy: true,
      rateLimitAvailable: true
    });
    assert.strictEqual(gate2.status, 'HUMAN_APPROVAL_REQUIRED');

    // 3. Platform security block or unhealthy -> BLOCKED
    const gate3 = ApprovalGate.evaluate({
      lead: lead1,
      pitch: 'Valid pitch text here exceeding twenty characters.',
      platformHealthy: false,
      rateLimitAvailable: true
    });
    assert.strictEqual(gate3.status, 'BLOCKED');

    // 4. Rate limit exhausted -> BLOCKED
    const gate4 = ApprovalGate.evaluate({
      lead: lead1,
      pitch: 'Valid pitch text here exceeding twenty characters.',
      platformHealthy: true,
      rateLimitAvailable: false
    });
    assert.strictEqual(gate4.status, 'BLOCKED');

    // 5. Enqueue item requiring human approval
    const item = queue.enqueue({
      lead: lead2,
      pitch: 'Hello, saw your post regarding website development services.',
      platformHealthy: true,
      rateLimitAvailable: true
    });
    assert.ok(item.status === 'AWAITING_APPROVAL' || item.status === 'PENDING_APPROVAL');

    // Verify ready for dispatch list is currently empty
    assert.strictEqual(queue.getReadyForDispatch('facebook').length, 0);

    // Approve the item
    const approved = queue.approve(item.queueId);
    assert.ok(approved === true || approved?.success === true);

    // Now it must appear in ready for dispatch
    const ready = queue.getReadyForDispatch('facebook');
    assert.strictEqual(ready.length, 1);
    assert.strictEqual(ready[0].queueId, item.queueId);

    console.log('✔ Outreach Safety Gate: ALL ASSERTIONS PASSED (Zero Unauthorized Outreach)');
    return true;
  } finally {
    try { fs.unlinkSync(tempQueueFile); } catch (_) {}
  }
}

if (require.main === module) {
  runOutreachSafetyTests();
}

module.exports = runOutreachSafetyTests;
