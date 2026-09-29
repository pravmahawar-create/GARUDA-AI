/**
 * Outreach Workflow Test Suite
 * Validates deterministic approval, message immutability, duplicate protection, and dry-run dispatch.
 * Uses an isolated temporary queue file. ZERO real messages sent.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const OutreachQueue = require('../outreach/outreachQueue');
const DispatchWorker = require('../outreach/dispatchWorker');
const LeadDeduplication = require('../leads/leadDeduplication');

async function testOutreachWorkflow() {
  console.log('--- Testing Governed Outreach Workflow ---');

  const tmpQueue = path.join(os.tmpdir(), `test_workflow_q_${Date.now()}.json`);
  const tmpDedup = path.join(os.tmpdir(), `test_workflow_d_${Date.now()}.json`);

  const queue = new OutreachQueue(tmpQueue);
  const dedup = new LeadDeduplication(tmpDedup);
  const worker = new DispatchWorker({ queueFile: tmpQueue, dedupFile: tmpDedup });

  try {
    // 1. Enqueue Lead -> Must be AWAITING_APPROVAL
    const lead = {
      leadId: 'lead_flow_test',
      platform: 'facebook',
      name: 'Test Prospect',
      username: 'testprospect',
      profileUrl: 'https://facebook.com/testprospect',
      confidence: 85,
      status: 'VERIFIED'
    };
    const item = queue.enqueue({
      lead,
      pitch: 'Hello Test Prospect, we design and build custom websites at GARUDA (garudaos.in). Glad to discuss your project requirements.'
    });
    assert.strictEqual(item.status, 'AWAITING_APPROVAL');

    // 2. Dispatch without approval -> 0 eligible
    const preRes = await worker.processApproved({ dryRun: true });
    assert.strictEqual(preRes.totalEligible, 0);

    // 3. Explicit Founder Approval -> FOUNDER_APPROVED + Message Hash
    const appRes = queue.approve(item.queueId, 'founder_praveen');
    assert.strictEqual(appRes.success, true);
    assert.strictEqual(appRes.item.status, 'FOUNDER_APPROVED');
    assert.ok(appRes.item.messageHash);

    // 4. Message Immutability Violation Test: Modify pitch directly
    item.pitch = 'Modified pitch without approval.';
    queue._saveQueue();
    const modRes = await worker.processApproved({ dryRun: true });
    assert.strictEqual(modRes.immutabilityViolations, 1);
    assert.strictEqual(queue.getPendingApproval().length, 1); // Reset back to AWAITING_APPROVAL

    // 5. Restore valid pitch and re-approve
    queue.editPitch(item.queueId, 'Hello Test Prospect, we design and build custom websites at GARUDA (garudaos.in). Glad to discuss your project requirements.');
    queue.approve(item.queueId, 'founder_praveen');

    // 6. Safe Dry Run Dispatch
    const dryRunRes = await worker.processApproved({ dryRun: true });
    assert.strictEqual(dryRunRes.sent, 1);
    assert.strictEqual(dryRunRes.results[0].status, 'DRY_RUN_VERIFIED');

    // 7. Duplicate Send Protection: Mark as already contacted, then attempt dispatch
    dedup.recordContacted('facebook', lead.profileUrl);
    const dupRes = await worker.processApproved({ dryRun: false });
    assert.strictEqual(dupRes.alreadySent, 1);
    assert.strictEqual(dupRes.results[0].status, 'ALREADY_SENT');

    console.log('✔ Outreach Workflow Tests: ALL ASSERTIONS PASSED (100% Governed & Safe)');
    return true;
  } finally {
    try { fs.unlinkSync(tmpQueue); } catch (_) {}
    try { fs.unlinkSync(tmpDedup); } catch (_) {}
  }
}

if (require.main === module) {
  testOutreachWorkflow().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = testOutreachWorkflow;
