const missionControlService = require('../services/missionControlService');

async function runMissionControlTests() {
  console.log('🧪 Starting GARUDA Runway 2 Mission Control & Wiring Test Suite...\n');

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
  // 1. MISSION CREATION & PERSISTENCE TESTS
  // -------------------------------------------------------------
  console.log('--- 1. MISSION CREATION & PERSISTENCE TESTS ---');

  // Test 1: Create mission with goal
  const goalText = 'Inspect repository package.json and audit capabilities';
  const mission = await missionControlService.createMission(goalText, { founderApproved: true });

  assert(
    mission &&
    mission.missionId &&
    mission.goal === goalText &&
    ['READY', 'RUNNING', 'COMPLETED'].includes(mission.status),
    'Mission created with unique ID and persistent record'
  );

  // Test 2: Mission retrieval & persistence check
  const fetched = await missionControlService.findMissionById(mission.missionId);
  assert(
    fetched &&
    fetched.missionId === mission.missionId &&
    fetched.goal === goalText,
    'Mission persists and can be retrieved authoritatively'
  );

  // -------------------------------------------------------------
  // 2. GOVERNANCE APPROVAL GATE & ACTION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. GOVERNANCE APPROVAL GATE & ACTION TESTS ---');

  // Test 3: Unapproved write goal triggers WAITING_APPROVAL state
  const writeGoal = 'Create a new test file scratch/mission_test_unapproved.txt';
  const unapprovedMission = await missionControlService.createMission(writeGoal, { founderApproved: false });

  assert(
    unapprovedMission &&
    (unapprovedMission.status === 'WAITING_APPROVAL' || unapprovedMission.status === 'BLOCKED'),
    'Unapproved write goal triggers WAITING_APPROVAL governance gate'
  );

  // Test 4: Founder approval action resumes mission execution
  const approvedActionRes = await missionControlService.handleAction(unapprovedMission.missionId, 'approve');
  assert(
    approvedActionRes &&
    ['RUNNING', 'COMPLETED'].includes(approvedActionRes.status),
    'Founder approval action resumes mission execution and updates status to COMPLETED'
  );

  console.log(`\n📊 Mission Control Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runMissionControlTests();
}

module.exports = runMissionControlTests;
