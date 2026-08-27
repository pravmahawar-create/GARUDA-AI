const inboundResponseService = require('../services/inboundResponseService');
const outboundCommunicationService = require('../services/outboundCommunicationService');
const missionControlService = require('../services/missionControlService');

async function runInboundClientDecisioningTests() {
  console.log('🧪 Starting GARUDA Mission 15 Inbound Response & Decisioning Suite...\n');

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
  // 1. MOTHER BRAIN INTENT CLASSIFICATION TESTS
  // -------------------------------------------------------------
  console.log('--- 1. MOTHER BRAIN INTENT CLASSIFICATION TESTS ---');

  const intentQuote = inboundResponseService.classifyIntent('Can you send a pricing quote for this job?');
  assert(intentQuote.action === 'prepare_quote' && intentQuote.state === 'PRICE_PROPOSED', 'Classified pricing inquiry as prepare_quote → PRICE_PROPOSED');

  const intentScope = inboundResponseService.classifyIntent('Please provide the technical deliverables and architecture scope.');
  assert(intentScope.action === 'prepare_scope' && intentScope.state === 'SCOPE_PROPOSED', 'Classified scope request as prepare_scope → SCOPE_PROPOSED');

  const intentAuthorize = inboundResponseService.classifyIntent('We accept your proposal. Please proceed and authorize the work.');
  assert(intentAuthorize.action === 'authorize_work' && intentAuthorize.state === 'WORK_AUTHORIZED', 'Classified acceptance as authorize_work → WORK_AUTHORIZED');

  const intentClose = inboundResponseService.classifyIntent('We decided not to proceed. Please decline and cancel.');
  assert(intentClose.action === 'close_opportunity' && intentClose.state === 'CLOSED', 'Classified rejection as close_opportunity → CLOSED');

  // -------------------------------------------------------------
  // 2. INBOUND RESPONSE INGESTION & DRAFT GENERATION
  // -------------------------------------------------------------
  console.log('\n--- 2. INBOUND RESPONSE INGESTION & DRAFT GENERATION ---');

  const inboundResult = await inboundResponseService.processInboundResponse({
    sender: 'client@enterprise.com',
    channel: 'email',
    messageText: 'We need a price quote for the Node.js backend scope.',
    opportunityId: 'opp_client_9988'
  });

  assert(
    inboundResult &&
    inboundResult.responseId &&
    inboundResult.lifecycleState === 'PRICE_PROPOSED' &&
    inboundResult.draftedOutreach &&
    inboundResult.draftedOutreach.status === 'APPROVAL_REQUIRED',
    'Inbound response ingested; drafted outbound quote reply in APPROVAL_REQUIRED state'
  );

  // -------------------------------------------------------------
  // 3. WORK AUTHORIZATION & MISSION CONTROL EXECUTION
  // -------------------------------------------------------------
  console.log('\n--- 3. WORK AUTHORIZATION & MISSION CONTROL EXECUTION ---');

  const authInbound = await inboundResponseService.processInboundResponse(
    {
      sender: 'client@enterprise.com',
      channel: 'email',
      messageText: 'Proposal accepted. Authorize work and start execution.',
      opportunityId: 'opp_client_9988'
    },
    { founderApproved: true }
  );

  assert(
    authInbound &&
    authInbound.lifecycleState === 'WORK_AUTHORIZED' &&
    authInbound.mission &&
    ['READY', 'RUNNING', 'COMPLETED'].includes(authInbound.mission.status),
    'Work authorization received; launched governed execution mission in Mission Control'
  );

  console.log(`\n📊 Mission 15 Inbound Response & Decisioning Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runInboundClientDecisioningTests();
}

module.exports = runInboundClientDecisioningTests;
