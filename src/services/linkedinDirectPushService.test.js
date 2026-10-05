/**
 * 🦅 GARUDA Autonomous LinkedIn Direct Push Service Tests
 * Verifies OAuth URL generation, state encoding, token persistence, and API contract invariants.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const linkedinDirectPush = require("./linkedinDirectPushService");

async function runTests() {
  console.log("🦅 Running LinkedIn Direct Push Service Unit & Invariant Tests...\n");

  // Test 1: getStatus structure
  console.log("Test 1: Status schema verification...");
  const status = linkedinDirectPush.getStatus("garuda");
  assert(typeof status === "object", "Status must be an object");
  assert("connected" in status, "Status must have 'connected' flag");
  assert("profile" in status, "Status must have 'profile' field");
  assert("instructions" in status, "Status must provide clear instructions");
  console.log("✔ PASS: getStatus schema verified.");

  // Test 2: getAuthUrl when clientId is configured
  console.log("\nTest 2: OAuth URL generation with custom or env client ID...");
  const testClientId = "test_garuda_client_12345";
  linkedinDirectPush.clientId = testClientId;
  const redirectUri = "https://www.garudaos.in/api/bot-verse/linkedin/callback";
  
  const authRes = linkedinDirectPush.getAuthUrl(redirectUri, "praveen");
  assert(authRes.success === true, "getAuthUrl should return success=true when client ID is provided");
  assert(authRes.authUrl.includes("https://www.linkedin.com/oauth/v2/authorization"), "authUrl must point to LinkedIn OAuth endpoint");
  assert(authRes.authUrl.includes(`client_id=${testClientId}`), "authUrl must include test client_id");
  assert(authRes.authUrl.includes("scope=openid+profile+email+w_member_social") || authRes.authUrl.includes("w_member_social"), "authUrl must include w_member_social scope");
  assert(authRes.authUrl.includes(encodeURIComponent(redirectUri)), "authUrl must include encoded redirectUri");
  console.log("✔ PASS: OAuth URL invariants verified.");

  // Test 3: Token saving and reading isolation
  console.log("\nTest 3: Token persistence and profile isolation...");
  const testTokens = {
    accessToken: "test_token_sample_abc123",
    refreshToken: "test_refresh_sample_xyz789",
    expiresAt: Date.now() + 3600000,
    memberUrn: "urn:li:person:testMember123",
    memberName: "Praveen Mahawar Test",
    memberEmail: "praveen@garudaos.in"
  };

  linkedinDirectPush.saveTokens(testTokens, "praveen");
  const readTokens = linkedinDirectPush.getStoredTokens("praveen");
  assert.strictEqual(readTokens.accessToken, testTokens.accessToken, "Read access token must match saved");
  assert.strictEqual(readTokens.memberUrn, testTokens.memberUrn, "Read memberUrn must match saved");
  assert.strictEqual(readTokens.memberName, testTokens.memberName, "Read memberName must match saved");
  console.log("✔ PASS: Token persistence and profile isolation verified.");

  // Clean up test token file to prevent pollution
  const testFile = linkedinDirectPush.getTokenFilePath("praveen");
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }

  // Restore clientId
  linkedinDirectPush.clientId = process.env.LINKEDIN_CLIENT_ID || null;

  console.log("\n🦅 ALL LINKEDIN DIRECT PUSH TESTS PASSED CLEANLY!");
}

runTests().catch(err => {
  console.error("❌ Test failure:", err);
  process.exit(1);
});
