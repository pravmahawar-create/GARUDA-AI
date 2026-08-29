const assert = require("assert");
const http = require("http");
const { authUserId, cookieTokens, authenticatedDbClient, authenticatedUserId } = require("../../api/customer/_auth");
const publicChatHandler = require("../../api/public-chat");

function createMockJwt(sub, expSecondsFromNow = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: sub || "user_12345_test",
      email: "test-user@garudaos.in",
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow
    })
  ).toString("base64url");
  const signature = "mock_sig_12345";
  return `${header}.${payload}.${signature}`;
}

async function runTests() {
  console.log("=== RUNNING PUBLIC CHAT & JWT ROBUSTNESS TESTS ===");

  // TEST 1: authUserId correctly decodes valid unexpired token
  const validToken = createMockJwt("user_valid_777", 3600);
  assert.strictEqual(authUserId(validToken), "user_valid_777", "Valid token must return userId");
  console.log("✔ Test 1 Passed: authUserId decodes valid unexpired JWT.");

  // TEST 2: authUserId returns empty string for EXPIRED token
  const expiredToken = createMockJwt("user_expired_888", -3600); // 1 hour ago
  assert.strictEqual(authUserId(expiredToken), "", "Expired token must return empty string");
  console.log("✔ Test 2 Passed: authUserId safely rejects expired JWT.");

  // TEST 3: cookieTokens extracts from Authorization Bearer header
  const reqWithHeader = { headers: { authorization: `Bearer ${validToken}` } };
  const tokensFromHeader = cookieTokens(reqWithHeader);
  assert.strictEqual(tokensFromHeader.accessToken, validToken, "Must extract token from Authorization header");
  console.log("✔ Test 3 Passed: cookieTokens supports Authorization Bearer header.");

  // TEST 4: authenticatedDbClient returns null when token is expired
  const reqWithExpiredCookie = { headers: { cookie: `garuda_customer_session=${expiredToken}~refresh_mock` } };
  const dbClientForExpired = authenticatedDbClient(reqWithExpiredCookie);
  assert.strictEqual(dbClientForExpired, null, "Expired token must NOT instantiate authenticated db client");
  console.log("✔ Test 4 Passed: authenticatedDbClient returns null for expired token.");

  // TEST 5: Public Chat Handler - Unauthenticated visitor
  let unauthStatus = 0;
  let unauthBody = null;
  const mockReqUnauth = {
    method: "POST",
    headers: { "x-garuda-test": "true" },
    body: {
      message: "how u can help me",
      history: []
    }
  };
  const mockResUnauth = {
    setHeader: () => {},
    status: (code) => {
      unauthStatus = code;
      return {
        json: (data) => {
          unauthBody = data;
          return data;
        },
        end: () => {}
      };
    }
  };

  await publicChatHandler(mockReqUnauth, mockResUnauth);
  assert.strictEqual(unauthStatus, 200, "Unauthenticated chat must return HTTP 200");
  assert.ok(unauthBody && unauthBody.reply, "Unauthenticated chat must return reply text");
  assert.ok(!/jwt expired/i.test(unauthBody.reply), "Reply must not contain JWT errors");
  console.log("✔ Test 5 Passed: Public Chat works seamlessly for unauthenticated visitor.");

  // TEST 6: Public Chat Handler - Visitor with EXPIRED JWT Cookie (The Exact Production Bug Scenario)
  let expiredStatus = 0;
  let expiredBody = null;
  const mockReqExpired = {
    method: "POST",
    headers: {
      "x-garuda-test": "true",
      cookie: `garuda_customer_session=${expiredToken}~mock_refresh_token`
    },
    body: {
      message: "how u can help me",
      history: []
    }
  };
  const mockResExpired = {
    setHeader: () => {},
    status: (code) => {
      expiredStatus = code;
      return {
        json: (data) => {
          expiredBody = data;
          return data;
        },
        end: () => {}
      };
    }
  };

  await publicChatHandler(mockReqExpired, mockResExpired);
  assert.strictEqual(expiredStatus, 200, "Expired JWT visitor chat MUST return HTTP 200 (not 400/500)");
  assert.ok(expiredBody && expiredBody.reply, "Expired JWT visitor chat must return valid AI reply");
  assert.ok(!/jwt expired/i.test(expiredBody.reply), "Expired JWT visitor chat must NEVER output JWT expired");
  console.log("✔ Test 6 Passed: Public Chat with EXPIRED JWT safely falls back to HTTP 200 with AI response!");

  // TEST 7: Public Chat Handler - Visitor with EXPIRED Bearer Header
  let expiredHeaderStatus = 0;
  let expiredHeaderBody = null;
  const mockReqExpiredHeader = {
    method: "POST",
    headers: {
      "x-garuda-test": "true",
      authorization: `Bearer ${expiredToken}`
    },
    body: {
      message: "build me a website for my business",
      history: []
    }
  };
  const mockResExpiredHeader = {
    setHeader: () => {},
    status: (code) => {
      expiredHeaderStatus = code;
      return {
        json: (data) => {
          expiredHeaderBody = data;
          return data;
        },
        end: () => {}
      };
    }
  };

  await publicChatHandler(mockReqExpiredHeader, mockResExpiredHeader);
  assert.strictEqual(expiredHeaderStatus, 200, "Expired Bearer chat MUST return HTTP 200");
  assert.ok(expiredHeaderBody && expiredHeaderBody.reply, "Expired Bearer chat must return valid AI reply");
  console.log("✔ Test 7 Passed: Public Chat with EXPIRED Bearer header safely returns HTTP 200!");

  console.log("\n🎉 ALL 7 PUBLIC CHAT AUTH ROBUSTNESS TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test Failure:", err);
  process.exit(1);
});
