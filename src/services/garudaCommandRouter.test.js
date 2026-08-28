const assert = require("assert");
const router = require("./garudaCommandRouter");

async function runTests() {
  console.log("Starting Garuda Command Router Test Suite...");

  // 1. Help detection
  const helpDet = router.detectCommand("/help");
  assert.strictEqual(helpDet.command, "help", "Should detect /help");
  const helpRes = await router.dispatchCommand("/help");
  assert.strictEqual(helpRes.success, true);
  assert(helpRes.message.includes("GARUDA COMMAND CENTER"), "Help should display command center banner");
  console.log("✔ Case 1 — /help detected and dispatched correctly");

  // 2. Status detection
  const statusDet = router.detectCommand("/status");
  assert.strictEqual(statusDet.command, "status", "Should detect /status");
  const statusRes = await router.dispatchCommand("/status");
  assert.strictEqual(statusRes.success, true);
  assert(statusRes.message.includes("GARUDA LIVE STATUS"), "Status should display live status");
  console.log("✔ Case 2 — /status detected and dispatched correctly");

  // 3. Pipeline detection
  const pipeDet = router.detectCommand("/pipeline");
  assert.strictEqual(pipeDet.command, "pipeline", "Should detect /pipeline");
  const pipeRes = await router.dispatchCommand("/pipeline");
  assert.strictEqual(pipeRes.success, true);
  assert(pipeRes.message.includes("GARUDA LIVE PIPELINE"), "Pipeline should display live pipeline");
  console.log("✔ Case 3 — /pipeline detected and dispatched correctly");

  // 4. Mission creation detection & dispatch
  const missionDet = router.detectCommand("/mission Verify and audit system reliability");
  assert.strictEqual(missionDet.command, "mission");
  assert.strictEqual(missionDet.params.goal, "Verify and audit system reliability");
  const missionRes = await router.dispatchCommand("/mission Verify and audit system reliability", { founderApproved: true });
  assert.strictEqual(missionRes.success, true);
  assert(missionRes.missionId.startsWith("mission_"), "Mission ID should start with mission_");
  console.log("✔ Case 4 — /mission detected and created successfully");

  // 5. Missions list detection & dispatch
  const listDet = router.detectCommand("/missions");
  assert.strictEqual(listDet.command, "missions_list");
  const listRes = await router.dispatchCommand("/missions");
  assert.strictEqual(listRes.success, true);
  assert(listRes.message.includes("LATEST MISSIONS"), "Missions list should return recent missions");
  console.log("✔ Case 5 — /missions detected and listed successfully");

  // 6. Project Scoping & Quote detection & dispatch
  const scopeDet = router.detectCommand("/scope Build full stack React and Node.js application with payment gateway");
  assert.strictEqual(scopeDet.command, "scope");
  const scopeRes = await router.dispatchCommand("/scope Build full stack React and Node.js application with payment gateway");
  assert.strictEqual(scopeRes.success, true);
  assert(scopeRes.message.includes("PROJECT SCOPE & PRICING ESTIMATE"), "Should return scoping estimate");
  assert(scopeRes.message.includes("Fixed Pricing:"), "Should return fixed pricing breakdown");
  console.log("✔ Case 6 — /scope detected and generated fixed price quote");

  // 7. Revenue truth detection & dispatch
  const revDet = router.detectCommand("/revenue");
  assert.strictEqual(revDet.command, "revenue");
  const revRes = await router.dispatchCommand("/revenue");
  assert.strictEqual(revRes.success, true);
  assert(revRes.message.includes("Real Realized Revenue: ₹0"), "Should enforce anti-fabrication revenue truth");
  console.log("✔ Case 7 — /revenue detected and returned anti-fabrication truth");

  // 8. Deals briefing detection & dispatch
  const dealsDet = router.detectCommand("/deals");
  assert.strictEqual(dealsDet.command, "deals");
  const dealsRes = await router.dispatchCommand("/deals");
  assert.strictEqual(dealsRes.success, true);
  console.log("✔ Case 8 — /deals detected and returned briefing");

  // 9. Mission approval detection & dispatch
  const approveDet = router.detectCommand(`/approve ${missionRes.missionId}`);
  assert.strictEqual(approveDet.command, "approve");
  assert.strictEqual(approveDet.params.targetId, missionRes.missionId);
  const approveRes = await router.dispatchCommand(`/approve ${missionRes.missionId}`, { founderApproved: true });
  assert.strictEqual(approveRes.success, true);
  assert(approveRes.message.includes("APPROVED by Founder"), "Mission should be approved");
  console.log("✔ Case 9 — /approve detected and approved mission");

  console.log("\nAll 9 Garuda Command Router tests PASSED cleanly.");
}

runTests().catch((err) => {
  console.error("Garuda Command Router test failure:", err);
  process.exit(1);
});
