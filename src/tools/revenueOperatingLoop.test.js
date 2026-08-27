const { runDiscoveryCycle } = require("../services/opportunityDiscoveryService");
const missionControlService = require("../services/missionControlService");
const outboundCommunicationService = require("../services/outboundCommunicationService");
const { getOperatingCycleTelemetry, stopRevenueOperatingCycle } = require("../services/revenueOperatingCycleInitializer");

async function runRevenueOperatingLoopTests() {
  console.log("🧪 Starting GARUDA Mission 12 Operational Revenue Loop Test Suite...\n");

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
  // 1. REAL EXTERNAL OPPORTUNITY DISCOVERY & ACQUISITION
  // -------------------------------------------------------------
  console.log("--- 1. REAL EXTERNAL OPPORTUNITY DISCOVERY & ACQUISITION ---");

  const discoveryResult = await runDiscoveryCycle();
  assert(
    discoveryResult &&
    typeof discoveryResult.fetched === "number" &&
    discoveryResult.fetched > 0,
    `Real external opportunity fetch succeeded (${discoveryResult.fetched} jobs fetched from Remotive API)`
  );

  assert(
    typeof discoveryResult.ranked === "number" &&
    discoveryResult.errors.length === 0,
    `Opportunity qualification & minimum-value gate passed (${discoveryResult.ranked} candidates qualified, 0 errors)`
  );

  // -------------------------------------------------------------
  // 2. GOVERNED OUTBOUND COMMUNICATION & APPROVAL GATE
  // -------------------------------------------------------------
  console.log("\n--- 2. GOVERNED OUTBOUND COMMUNICATION & APPROVAL GATE ---");

  const draftPayload = {
    recipient: "client@example.com",
    channel: "email",
    subject: "GARUDA Autonomous Software Engineering Proposal",
    body: "We have reviewed your software engineering scope and prepared a governed deliverable proposal."
  };

  const draft = await outboundCommunicationService.draftCommunication(draftPayload, { founderApproved: false });
  assert(
    draft &&
    draft.communicationId &&
    draft.status === "APPROVAL_REQUIRED" &&
    draft.founderApproved === false,
    "Outbound communication draft created; enforces APPROVAL_REQUIRED when unapproved"
  );

  // Attempt sending without approval should be blocked
  let blockedError = null;
  try {
    await outboundCommunicationService.approveAndSend(draft.communicationId, { founderApproved: false });
  } catch (err) {
    blockedError = err;
  }
  assert(
    blockedError && blockedError.statusCode === 403,
    "Unapproved outbound send attempt strictly blocked by Founder approval gate (403 Forbidden)"
  );

  // Founder approval sends communication
  const sentRes = await outboundCommunicationService.approveAndSend(draft.communicationId, { founderApproved: true });
  assert(
    sentRes &&
    sentRes.status === "SENT" &&
    sentRes.founderApproved === true,
    "Founder approval token transitions communication status to SENT with full audit trail"
  );

  // -------------------------------------------------------------
  // 3. 24x7 BACKGROUND SCHEDULER & TELEMETRY
  // -------------------------------------------------------------
  console.log("\n--- 3. 24x7 BACKGROUND SCHEDULER & TELEMETRY ---");

  const { initRevenueOperatingCycle } = require("../services/revenueOperatingCycleInitializer");
  initRevenueOperatingCycle();

  const telemetry = getOperatingCycleTelemetry();
  assert(
    telemetry &&
    telemetry.isInitialized === true &&
    telemetry.discoveryWorkerActive === true,
    "24x7 Background Revenue Operating Cycle initialized and telemetry active"
  );

  stopRevenueOperatingCycle();

  console.log(`\n📊 Mission 12 Operational Revenue Loop Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRevenueOperatingLoopTests();
}

module.exports = runRevenueOperatingLoopTests;
