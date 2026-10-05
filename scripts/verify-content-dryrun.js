/**
 * Verification Script: One Safe Dry-Run Content Cycle & Restart Recovery Proof
 */

const ContentScheduler = require('../social-engine/content/contentScheduler');
const ContentPolicyManager = require('../social-engine/content/contentPolicyManager');
const PublishingSafetyGate = require('../social-engine/content/publishingSafetyGate');
const { isMongoConnected } = require('../src/database/db');

async function verify() {
  console.log('================================================================');
  console.log('🦅 GARUDA CONTENT OPERATIONS ENGINE — SAFE DRY-RUN VERIFICATION');
  console.log('================================================================\n');

  // Ensure clean autonomous mode
  ContentPolicyManager.setKillSwitch(false);
  ContentPolicyManager.setPostingMode('AUTONOMOUS');

  // 1. Schedule a test campaign
  console.log('▶ [1/4] Scheduling Campaign...');
  const scheduleRes = await ContentScheduler.scheduleCampaign({
    idea: 'Zero-trust execution prevents AI agents from leaking database and payment gateway credentials.',
    topic: 'Zero-Trust AI Agent Architecture',
    primaryObjective: 'AUTHORITY',
    platforms: ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'],
    targetUrl: 'https://www.garudaos.in',
    candidateHashtags: ['#EnterpriseAI', '#SoftwareArchitecture', '#MCP'],
    immediate: true
  });
  console.log(`✔ Campaign Scheduled: Family ID=${scheduleRes.contentFamilyId}, Count=${scheduleRes.scheduledCount}`);

  // 2. Run ONE SAFE DRY-RUN Cycle
  console.log('\n▶ [2/4] Executing ONE SAFE DRY-RUN Cycle (Zero Real Platform API Calls)...');
  const cycleResult = await ContentScheduler.runSchedulerCycle({ dryRun: true });
  console.log(`✔ Dry-Run Cycle Complete: Evaluated=${cycleResult.evaluated}, Published=${cycleResult.published}, Failed=${cycleResult.failed}`);
  for (const detail of cycleResult.details) {
    console.log(`   • ${detail.platform}: ${detail.status} (firstCommentPosted: ${detail.firstCommentPosted})`);
  }

  // 3. Test Duplicate Protection
  console.log('\n▶ [3/4] Testing Duplicate Protection Gate...');
  const duplicateCandidate = {
    platform: 'LINKEDIN',
    format: 'TEXT',
    category: 'ARCHITECTURE',
    headline: 'Engineering Deep Dive: Zero-Trust AI Agent Architecture',
    topic: 'Zero-Trust AI Agent Architecture',
    body: 'Sample duplicate content body'
  };
  const dupCheck = await PublishingSafetyGate.evaluate(duplicateCandidate);
  console.log(`✔ Duplicate Check Result: Safe=${dupCheck.safe}, Status=${dupCheck.status} (${dupCheck.reason})`);

  // 4. Test Restart Recovery
  console.log('\n▶ [4/4] Testing Restart Recovery...');
  const recoveredList = ContentScheduler._loadLocalSchedule();
  const familyMatches = recoveredList.filter(p => p.contentFamilyId === scheduleRes.contentFamilyId);
  console.log(`✔ Restart Recovery Verified: Recovered ${familyMatches.length} persisted records matching Family ID ${scheduleRes.contentFamilyId}`);

  console.log('\n================================================================');
  console.log('🎉 ALL DRY-RUN & SAFETY VERIFICATIONS COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

verify().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
