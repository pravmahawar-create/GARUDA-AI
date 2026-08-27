const opportunityFollowUpService = require('../services/opportunityFollowUpService');
const inboundResponseService = require('../services/inboundResponseService');
const outboundCommunicationService = require('../services/outboundCommunicationService');
const { getProductionConfigStatus } = require('../services/productionConfigService');

async function runRevenueConversionEngineTests() {
  console.log('🧪 Starting GARUDA Mission 16 Revenue Conversion Engine Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // 1. FOLLOW-UP CADENCE & ANTI-SPAM EVALUATION
  // -------------------------------------------------------------
  console.log('--- 1. FOLLOW-UP CADENCE & ANTI-SPAM EVALUATION ---');

  const recentCandidate = {
    externalId: 'opp_test_101',
    company: 'Acme Corp',
    title: 'Full Stack Engineer',
    status: 'AWAITING_RESPONSE',
    lastOutreachAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    followUpCount: 0
  };
  const evalRecent = opportunityFollowUpService.evaluateFollowUp(recentCandidate);
  assert(evalRecent.isDue === false, 'Follow-up NOT due when less than 3 days have elapsed (Cadence protection)');

  const dueCandidate = {
    externalId: 'opp_test_102',
    company: 'Enterprise Inc',
    title: 'Backend Systems Lead',
    status: 'AWAITING_RESPONSE',
    lastOutreachAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    followUpCount: 0
  };
  const evalDue = opportunityFollowUpService.evaluateFollowUp(dueCandidate);
  assert(evalDue.isDue === true && evalDue.followUpNumber === 1, 'Follow-up due when 4 days have elapsed (#1 follow-up)');

  const maxFollowUpCandidate = {
    externalId: 'opp_test_103',
    company: 'Tech Corp',
    title: 'DevOps Specialist',
    status: 'AWAITING_RESPONSE',
    lastOutreachAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    followUpCount: 2
  };
  const evalMax = opportunityFollowUpService.evaluateFollowUp(maxFollowUpCandidate);
  assert(
    evalMax.isDue === false && evalMax.isTimeout === true && evalMax.targetState === 'UNRESPONSIVE',
    'Max follow-up limit (2) triggers UNRESPONSIVE timeout state transition'
  );

  // -------------------------------------------------------------
  // 2. GOVERNED FOLLOW-UP DRAFTING
  // -------------------------------------------------------------
  console.log('\n--- 2. GOVERNED FOLLOW-UP DRAFTING ---');

  const followUpResult = await opportunityFollowUpService.draftFollowUp(dueCandidate);
  assert(
    followUpResult &&
    followUpResult.scheduled === true &&
    followUpResult.draftedCommunication &&
    followUpResult.draftedCommunication.status === 'APPROVAL_REQUIRED',
    'Follow-up drafted in APPROVAL_REQUIRED state for Founder review'
  );

  // -------------------------------------------------------------
  // 3. TRUTHFUL TERMINAL STATE TRANSITION & LEARNING LOOP
  // -------------------------------------------------------------
  console.log('\n--- 3. TRUTHFUL TERMINAL STATE TRANSITION & LEARNING LOOP ---');

  const termRes = await opportunityFollowUpService.transitionTerminalState('opp_test_103', 'UNRESPONSIVE', 'No response after 2 follow-ups');
  assert(termRes && termRes.status === 'UNRESPONSIVE', 'Transitioned opportunity to terminal state UNRESPONSIVE');

  const learningLog = opportunityFollowUpService.getLearningSummary();
  assert(learningLog && learningLog.length > 0, 'Rejection/timeout feedback logged into Learning Store');

  // -------------------------------------------------------------
  // 4. SIMULATED RESPONSE VS REAL-WORLD BENCHMARK DISAMBIGUATION
  // -------------------------------------------------------------
  console.log('\n--- 4. SIMULATED RESPONSE VS REAL-WORLD BENCHMARK DISAMBIGUATION ---');

  const simInbound = await inboundResponseService.processInboundResponse({
    sender: 'test_client@simulated.com',
    channel: 'email',
    messageText: 'SIMULATED RESPONSE — NOT REAL CLIENT ACTIVITY: We authorize work',
    opportunityId: 'opp_simulated_999'
  });

  assert(
    simInbound && simInbound.responseId && simInbound.lifecycleState === 'WORK_AUTHORIZED',
    'Simulated response integration test verified technically (Tag: SIMULATED RESPONSE — NOT REAL CLIENT ACTIVITY)'
  );

  // -------------------------------------------------------------
  // 5. EXTERNAL CONFIGURATION AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 5. EXTERNAL CONFIGURATION AUDIT ---');

  const prodStatus = getProductionConfigStatus();
  assert(prodStatus && Boolean(prodStatus.recommendedEnvVars.RAZORPAY_WEBHOOK_SECRET_TEST), 'Production env variable audit template verified');

  console.log(`\n📊 Mission 16 Revenue Conversion Engine Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRevenueConversionEngineTests();
}

module.exports = runRevenueConversionEngineTests;
