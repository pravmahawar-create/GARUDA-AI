/**
 * GARUDA Social Engine - Human Approval & Outreach Manager CLI
 * Exposes commands: list, approve, reject, edit, dispatch (dry-run/real)
 */

const path = require('path');
const OutreachQueue = require('./outreachQueue');
const DispatchWorker = require('./dispatchWorker');

const queue = new OutreachQueue();
const worker = new DispatchWorker();

const [,, command, arg1, arg2] = process.argv;

async function main() {
  switch (command) {
    case 'list': {
      const pending = queue.getPendingApproval();
      const approved = queue.getFounderApproved();
      console.log('====================================================');
      console.log('🦅 GARUDA OUTREACH QUEUE: PENDING FOUNDER REVIEW');
      console.log('====================================================\n');
      console.log(`Pending Approval: ${pending.length} | Approved & Ready: ${approved.length}\n`);

      pending.forEach((item, idx) => {
        console.log(`[#${idx + 1}] ID: ${item.queueId}`);
        console.log(`  Lead: ${item.lead.name} (${item.lead.platform})`);
        console.log(`  Profile URL: ${item.lead.profileUrl}`);
        console.log(`  Intent Evidence: "${item.lead.sourceText ? item.lead.sourceText.slice(0, 100) : ''}..."`);
        console.log(`  Confidence Score: ${item.lead.confidence}% (${item.lead.status})`);
        console.log(`  Intent Signals: [${item.lead.intentSignals.join(', ')}]`);
        console.log(`  Proposed Draft: "${item.pitch}"`);
        console.log(`  Current Status: ${item.status}\n`);
      });

      if (approved.length > 0) {
        console.log('--- FOUNDER_APPROVED (Ready for Dispatch) ---');
        approved.forEach(a => {
          console.log(`  ID: ${a.queueId} | Lead: ${a.lead.name} | Approved: ${a.approvedAt}`);
        });
      }
      break;
    }

    case 'approve': {
      if (!arg1) {
        console.error('Usage: node manageOutreach.js approve <queueId>');
        process.exit(1);
      }
      const res = queue.approve(arg1, 'founder_praveen');
      if (res.success) {
        console.log(`✔ [FOUNDER_APPROVED] Lead ${res.item.lead.name} approved!`);
        console.log(`  QueueId: ${res.item.queueId}`);
        console.log(`  Message Hash: ${res.item.messageHash}`);
        console.log(`  Status: ${res.item.status}`);
      } else {
        console.error(`❌ [APPROVAL_FAILED] ${res.error}`);
        process.exit(1);
      }
      break;
    }

    case 'reject': {
      if (!arg1) {
        console.error('Usage: node manageOutreach.js reject <queueId> [reason]');
        process.exit(1);
      }
      const res = queue.reject(arg1, arg2 || 'REJECTED_BY_FOUNDER', 'founder_praveen');
      if (res.success) {
        console.log(`✔ [REJECTED] Lead ${res.item.lead.name} rejected.`);
      } else {
        console.error(`❌ [REJECT_FAILED] ${res.error}`);
        process.exit(1);
      }
      break;
    }

    case 'dispatch': {
      const isDryRun = !process.argv.includes('--real');
      const targetId = process.argv.find(a => a.startsWith('--lead='))?.split('=')[1] || null;

      console.log(`Executing dispatch worker... (Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'REAL DISPATCH'})`);
      const summary = await worker.processApproved({ dryRun: isDryRun, targetQueueId: targetId });
      console.log('\n--- Dispatch Summary ---');
      console.log(JSON.stringify(summary, null, 2));
      break;
    }

    default:
      console.log('GARUDA Outreach Manager CLI');
      console.log('Commands:');
      console.log('  node manageOutreach.js list');
      console.log('  node manageOutreach.js approve <queueId>');
      console.log('  node manageOutreach.js reject <queueId> [reason]');
      console.log('  node manageOutreach.js dispatch --dry-run');
      console.log('  node manageOutreach.js dispatch --real --lead=<queueId>');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
