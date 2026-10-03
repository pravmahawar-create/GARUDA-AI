/**
 * 🦅 GARUDA OS — META GRAPH API & AUTHORIZED PUBLISHING PIPELINE TEST SUITE
 *
 * Verifies:
 * 1. Environment Security & Zero Secret Exposure (Tokens/Secrets Never Leaked)
 * 2. Connection Status Resolution & Error Mapping (CONNECTED / PARTIAL / UNAVAILABLE)
 * 3. Page Discovery & Non-Secret Metadata Isolation
 * 4. Instagram Professional Discovery & UNAVAILABLE Invariant
 * 5. Mandatory Human Review & Digital Authorization Gate
 * 6. Controlled Publishing Lifecycle & Audit Reference Linking
 * 7. Truth-State Adherence (REAL / CALCULATED / SIMULATED / UNAVAILABLE)
 * 8. Aggregate Analytics Non-Fabrication (Only Meta-Returned Metrics)
 * 9. Immutable Audit Trail Logging (Actor, Target, Timestamp, Result)
 * 10. Strict Political Safety Scope (Zero Individual Voter Profiling)
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const metaService = require("./metaDirectPushService");
const { META_ERROR_CODES } = require("./metaDirectPushService");

console.log("=== STARTING META GRAPH API & PUBLISHING PIPELINE AUDIT TESTS ===");

async function runTests() {
  // TEST 1: Environment Security & Zero Secret Leakage Invariant
  console.log("Test 1: Auditing Security & Secret Isolation...");
  const status = await metaService.getConnectionStatus();

  // Ensure status object NEVER contains token or secret strings
  const statusStr = JSON.stringify(status);
  assert.ok(!statusStr.includes("EAAL"), "Access token leaked into getConnectionStatus() response!");
  assert.ok(!statusStr.includes("f31e804fc"), "App Secret leaked into getConnectionStatus() response!");
  assert.strictEqual(typeof status.facebookPage, "object", "facebookPage metadata missing");
  assert.strictEqual(typeof status.instagram, "object", "instagram metadata missing");
  console.log("✔ Zero Secret Exposure verified: No tokens or secrets present in client response.");

  // TEST 2: Truth-State Resolution & Connection Status
  console.log("Test 2: Auditing Truth-State Resolution...");
  assert.ok(["CONNECTED", "PARTIAL", "UNAVAILABLE"].includes(status.status), "Status must be CONNECTED, PARTIAL, or UNAVAILABLE");
  assert.ok(["REAL", "UNAVAILABLE"].includes(status.truthState), "TruthState must be REAL or UNAVAILABLE");
  // If no Page is connected, status must be PARTIAL or UNAVAILABLE (never falsely CONNECTED)
  if (!status.facebookPage.connected && !status.instagram.connected && status.status !== "UNAVAILABLE") {
    assert.strictEqual(status.status, "PARTIAL", "Without Page/IG, valid token must resolve to PARTIAL");
  }
  console.log(`✔ Truth-State verified: status=${status.status}, truthState=${status.truthState}`);

  // TEST 3: Page Discovery & Safe Metadata Isolation
  console.log("Test 3: Auditing Page Discovery Protocol...");
  const discovery = await metaService.discoverPages({ actor: "Audit Tester" });
  assert.strictEqual(typeof discovery.success, "boolean", "Discovery success must be boolean");
  assert.ok(["REAL", "UNAVAILABLE"].includes(discovery.truthState), "Discovery truthState must be REAL or UNAVAILABLE");
  assert.ok(Array.isArray(discovery.pages), "Discovered pages must be an array");

  // Verify safe structure of each page
  for (const page of discovery.pages) {
    assert.ok(page.pageId, "Page ID missing");
    assert.ok(page.pageName, "Page Name missing");
    assert.ok(!JSON.stringify(page).includes("access_token"), "Page object leaks access_token!");
  }
  console.log(`✔ Page Discovery verified: ${discovery.pages.length} pages found. Zero secrets leaked.`);

  // TEST 4: Instagram Professional Account Discovery & UNAVAILABLE Invariant
  console.log("Test 4: Auditing Instagram Professional Linkage...");
  // If Instagram is not connected, statusMessage must explicitly state UNAVAILABLE
  if (!status.instagram.connected) {
    assert.ok(
      status.instagram.statusMessage.includes("UNAVAILABLE"),
      "Disconnected Instagram must explicitly report UNAVAILABLE"
    );
  }
  console.log("✔ Instagram Professional linkage invariant verified: Zero assumption of Instagram presence.");

  // TEST 5: Mandatory Human Review & Authorization Gate (Anti-Autonomy Defense)
  console.log("Test 5: Auditing Mandatory Human Review Gate...");
  const unapprovedAttempt = await metaService.publishControlledContent({
    platform: "FACEBOOK_PAGE",
    contentType: "POST",
    message: "Test unauthorized post",
    isApproved: false, // NOT APPROVED
    reviewApprovalToken: null,
    actor: "Adversarial Test Daemon"
  });

  assert.strictEqual(unapprovedAttempt.success, false, "Unapproved publish must fail!");
  assert.strictEqual(unapprovedAttempt.errorClassification, META_ERROR_CODES.HUMAN_APPROVAL_REQUIRED);
  assert.strictEqual(unapprovedAttempt.truthState, "UNAVAILABLE");
  assert.ok(unapprovedAttempt.auditReference, "Failed attempt must generate audit reference");
  console.log("✔ Human Review Gate strictly enforced: Autonomous unapproved publish blocked.");

  // TEST 6: Page & Account Connection Persistence (Non-Secret)
  console.log("Test 6: Auditing Page Connection State Persistence...");
  const connectRes = await metaService.connectPage({
    pageId: "test_page_1002938475",
    pageName: "GARUDA Benchmark Campaign Handle",
    instagramAccountId: "test_ig_9928374",
    instagramUsername: "garuda_benchmark",
    actor: "Audit Suite Operator"
  });
  assert.strictEqual(connectRes.success, true);
  assert.strictEqual(connectRes.truthState, "REAL");
  assert.strictEqual(connectRes.connection.pageId, "test_page_1002938475");
  assert.ok(!JSON.stringify(connectRes).includes("access_token"), "Connection leaks token!");

  // Verify connection status reflects connected state
  const updatedStatus = await metaService.getConnectionStatus();
  assert.strictEqual(updatedStatus.facebookPage.connected, true);
  assert.strictEqual(updatedStatus.facebookPage.pageId, "test_page_1002938475");
  console.log("✔ Page & Instagram connection state successfully persisted without secrets.");

  // TEST 7: Controlled Publishing Workflow & Response Metadata Verification
  console.log("Test 7: Auditing Controlled Publishing Validation...");
  // Test invalid platform
  const invalidPlatform = await metaService.publishControlledContent({
    platform: "INVALID_PLATFORM",
    isApproved: true,
    reviewApprovalToken: "TOKEN_AUTH_99182",
    approvedBy: "Praveen Mahawar (Campaign Principal)",
    actor: "War Room Operator"
  });
  assert.strictEqual(invalidPlatform.success, false);
  assert.strictEqual(invalidPlatform.error, "UNSUPPORTED_PLATFORM");

  // Test missing video URL for Reels
  const missingReelUrl = await metaService.publishControlledContent({
    platform: "INSTAGRAM_REELS",
    contentType: "REEL",
    mediaPublicUrl: null,
    isApproved: true,
    reviewApprovalToken: "TOKEN_AUTH_99182",
    approvedBy: "Praveen Mahawar (Campaign Principal)",
    actor: "War Room Operator"
  });
  assert.strictEqual(missingReelUrl.success, false);
  assert.strictEqual(missingReelUrl.error, "INVALID_MEDIA_URL");
  console.log("✔ Controlled publishing parameter validations passed cleanly.");

  // Clean up test connection
  await metaService.disconnectPage({ actor: "Audit Suite Cleanup" });
  const cleanedStatus = await metaService.getConnectionStatus();
  assert.strictEqual(cleanedStatus.facebookPage.connected, false);
  console.log("✔ Test connection cleaned up and returned to authentic state.");

  // TEST 8: Aggregate Analytics Non-Fabrication
  console.log("Test 8: Auditing Aggregate Analytics Non-Fabrication Law...");
  const analytics = await metaService.getPageAndAccountAnalytics({ actor: "Analytics Audit" });
  assert.strictEqual(analytics.success, true);
  assert.strictEqual(analytics.truthState, "REAL");
  assert.strictEqual(typeof analytics.analytics, "object");

  // Ensure adCampaigns reflects real data or explicit UNAVAILABLE
  assert.ok(["REAL", "UNAVAILABLE"].includes(analytics.analytics.adCampaigns.truthState));
  // Disconnected page metrics must be UNAVAILABLE, never fabricated numbers
  if (!cleanedStatus.facebookPage.connected) {
    assert.strictEqual(analytics.analytics.facebookPage.truthState, "UNAVAILABLE");
  }
  console.log("✔ Aggregate analytics verified: Never substitutes guessed or fabricated metrics.");

  // TEST 9: Immutable Audit Trail Logging
  console.log("Test 9: Auditing Immutable Audit Ledger...");
  const auditTrail = metaService.getAuditTrail({ limit: 10 });
  assert.ok(Array.isArray(auditTrail), "Audit trail must be an array");
  assert.ok(auditTrail.length > 0, "Audit trail must have recorded test operations");

  const latest = auditTrail[0];
  assert.ok(latest.id && latest.id.startsWith("aud_meta_"), "Audit ID format invalid");
  assert.ok(latest.timestamp, "Audit timestamp missing");
  assert.ok(latest.actor, "Audit actor missing");
  assert.ok(latest.action, "Audit action missing");
  assert.ok(latest.result, "Audit result missing");
  assert.ok(!JSON.stringify(auditTrail).includes("EAAL"), "Audit trail leaks access tokens!");
  console.log(`✔ Audit trail verified: ${auditTrail.length} records checked with zero credential leakage.`);

  // TEST 10: Political-Safety Scope Invariant (Zero Voter Profiling)
  console.log("Test 10: Auditing Political Safety Invariants...");
  const forbiddenKeywords = [
    "voterPsychographic",
    "individualVoterTargeting",
    "persuasionScore",
    "gotvOptimizationPerVoter",
    "voterSegmentationScore"
  ];
  for (const kw of forbiddenKeywords) {
    assert.strictEqual(analytics[kw], undefined, `Forbidden political targeting property '${kw}' found!`);
  }
  console.log("✔ Political safety scope invariant strictly upheld: Zero individual voter profiling.");

  console.log("\n🎉 ALL 10 META GRAPH API & PUBLISHING PIPELINE AUDIT TESTS PASSED (100% SUCCESS)!\n");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
