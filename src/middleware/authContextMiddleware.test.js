const assert = require("assert");
const crypto = require("crypto");
const authContextService = require("../services/authContextService");
const authContextMiddleware = require("./authContextMiddleware");
const { requireCapability, requireFounderOrAdmin } = require("./capabilityGateMiddleware");

async function runTests() {
  console.log("🦅 Running Auth Context & Trust Boundary Middleware Test Suite...\n");

  // 1. Unauthenticated Request => Restricted Anonymous Guest
  const anonReq = {
    headers: {},
    query: {},
    body: {}
  };
  const anonContext = await authContextService.resolveRequestContext(anonReq);
  assert.strictEqual(anonContext.actorType, "anonymous");
  assert.strictEqual(anonContext.actorId, "anon_guest");
  assert.strictEqual(anonContext.tenantId, "tenant_public_guest");
  assert.strictEqual(anonContext.role, "anonymous_guest");
  assert.strictEqual(anonContext.plan, "personal");
  assert.strictEqual(anonContext.isFounderApproved, false);
  assert(anonContext.capabilities.includes("public.chat"));
  assert(!anonContext.capabilities.includes("creative.generate_standard"));
  console.log("✔ Test 1: Unauthenticated request securely resolves to restricted anonymous guest");

  // 2. Trust Boundary: Anonymous Cannot Claim Arbitrary Tenant via x-tenant-id
  const spoofReq = {
    headers: {
      "x-tenant-id": "tenant_enterprise_victim_org"
    },
    query: {},
    body: {}
  };
  const spoofContext = await authContextService.resolveRequestContext(spoofReq);
  assert.strictEqual(spoofContext.actorType, "anonymous");
  assert.strictEqual(spoofContext.tenantId, "tenant_public_guest");
  assert.notStrictEqual(spoofContext.tenantId, "tenant_enterprise_victim_org");
  assert.strictEqual(spoofContext.isFounderApproved, false);
  console.log("✔ Test 2: Trust boundary enforced: x-tenant-id header is ignored without verified identity");

  // 3. Platform Founder via x-founder-key Header
  const founderReq = {
    headers: {
      "x-founder-key": "garuda_founder_secret_key_2026"
    },
    query: {},
    body: {}
  };
  const founderContext = await authContextService.resolveRequestContext(founderReq);
  assert.strictEqual(founderContext.actorType, "founder");
  assert.strictEqual(founderContext.actorId, "founder");
  assert.strictEqual(founderContext.role, "platform_founder");
  assert.strictEqual(founderContext.isFounderApproved, true);
  assert.deepStrictEqual(founderContext.capabilities, ["*"]);
  console.log("✔ Test 3: Valid founder key resolves platform_founder with [*] wildcard");

  // 4. Platform Founder via Authorization Bearer Header
  const bearerReq = {
    headers: {
      authorization: "Bearer garuda_founder_secret_key_2026"
    },
    query: {},
    body: {}
  };
  const bearerContext = await authContextService.resolveRequestContext(bearerReq);
  assert.strictEqual(bearerContext.actorType, "founder");
  assert.strictEqual(bearerContext.isFounderApproved, true);
  console.log("✔ Test 4: Founder credentials via Bearer header verified successfully");

  // 5. Platform Founder via Signed Cookie (garuda_founder_session)
  const sessionSecret = process.env.FOUNDER_SESSION_SECRET || "test_session_secret_2026";
  process.env.FOUNDER_SESSION_SECRET = sessionSecret;
  const expiresAt = Date.now() + 3600 * 1000;
  const signature = crypto.createHmac("sha256", sessionSecret).update(String(expiresAt)).digest("base64url");
  const cookieValue = `${expiresAt}.${signature}`;

  const cookieReq = {
    headers: {
      cookie: `garuda_founder_session=${encodeURIComponent(cookieValue)}`
    },
    query: {},
    body: {}
  };
  const cookieContext = await authContextService.resolveRequestContext(cookieReq);
  assert.strictEqual(cookieContext.actorType, "founder");
  assert.strictEqual(cookieContext.isFounderApproved, true);
  console.log("✔ Test 5: Founder HMAC-SHA256 cookie session verified successfully");

  // 6. Authenticated Customer JWT Mock
  const userPayload = {
    sub: "usr_regular_customer_789",
    email: "customer@company.com",
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(userPayload)).toString("base64url")}.mock_signature`;

  const customerReq = {
    headers: {
      authorization: `Bearer ${mockJwt}`
    },
    query: {},
    body: {}
  };
  const customerContext = await authContextService.resolveRequestContext(customerReq);
  assert.strictEqual(customerContext.actorType, "tenant_member");
  assert.strictEqual(customerContext.userId, "usr_regular_customer_789");
  assert.strictEqual(customerContext.isFounderApproved, false);
  assert.notStrictEqual(customerContext.role, "platform_founder");
  assert(customerContext.tenantId.startsWith("tenant_personal_"));
  console.log("✔ Test 6: Standard user JWT resolves user tenant and CANNOT become founder");

  // 7. Express Middleware Context Injection
  let nextCalled = false;
  const mockRes = {
    locals: {},
    setHeader: (name, val) => {}
  };
  await authContextMiddleware(anonReq, mockRes, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(anonReq.garudaContext.actorType, "anonymous");
  assert.strictEqual(mockRes.locals.garudaContext.actorType, "anonymous");
  console.log("✔ Test 7: authContextMiddleware attaches req.garudaContext & res.locals.garudaContext");

  // 8. Capability Gate Middleware — Permitted Access
  let gateAllowed = false;
  const permittedGate = requireCapability("public.chat");
  const testRes = {
    status: (code) => ({
      json: (data) => ({ status: code, data })
    })
  };
  await permittedGate(anonReq, testRes, () => {
    gateAllowed = true;
  });
  assert.strictEqual(gateAllowed, true);
  console.log("✔ Test 8: requireCapability permits access when capability is present");

  // 9. Capability Gate Middleware — Forbidden Access (Anonymous -> Cinematic Creative)
  let forbiddenCalled = false;
  let responseStatus = null;
  let responseData = null;
  const cinematicGate = requireCapability("creative.generate_cinematic");
  const denyRes = {
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => {
          forbiddenCalled = true;
          responseData = data;
        }
      };
    }
  };
  await cinematicGate(anonReq, denyRes, () => {
    assert.fail("Should not call next on denied capability");
  });
  assert.strictEqual(forbiddenCalled, true);
  assert.strictEqual(responseStatus, 401); // 401 for anonymous caller
  assert.strictEqual(responseData.success, false);
  assert.strictEqual(responseData.error.code, "CAPABILITY_ENTITLEMENT_REQUIRED");
  assert.strictEqual(responseData.error.requiredCapability, "creative.generate_cinematic");
  console.log("✔ Test 9: requireCapability rejects unentitled caller with structured 401/403 error");

  // 10. Capability Gate Middleware — Founder Wildcard Bypass
  let founderGateAllowed = false;
  const founderReqContext = { ...founderReq, garudaContext: founderContext };
  await cinematicGate(founderReqContext, denyRes, () => {
    founderGateAllowed = true;
  });
  assert.strictEqual(founderGateAllowed, true);
  console.log("✔ Test 10: Platform Founder bypasses capability gate seamlessly via wildcard [*]");

  // 11. requireFounderOrAdmin Privilege Separation
  let adminActionAllowed = false;
  const adminGate = requireFounderOrAdmin();
  const denyAdminRes = {
    status: (code) => {
      responseStatus = code;
      return { json: (data) => data };
    }
  };

  // Regular tenant member cannot perform admin action
  const memberReq = {
    garudaContext: {
      actorType: "tenant_member",
      role: "tenant_member",
      isFounderApproved: false
    }
  };
  await adminGate(memberReq, denyAdminRes, () => {
    adminActionAllowed = true;
  });
  assert.strictEqual(adminActionAllowed, false);
  assert.strictEqual(responseStatus, 403);
  console.log("✔ Test 11: requireFounderOrAdmin correctly blocks non-admin tenant member");

  // 12. Scope Metadata Extraction
  const scopedReq = {
    headers: {
      "x-project-id": "proj_growth_alpha"
    },
    query: {
      sessionId: "sess_chat_123"
    },
    body: {
      continuityScopeId: "cs_universe_creative"
    }
  };
  const scopedContext = await authContextService.resolveRequestContext(scopedReq);
  assert.strictEqual(scopedContext.metadata.projectId, "proj_growth_alpha");
  assert.strictEqual(scopedContext.metadata.sessionId, "sess_chat_123");
  assert.strictEqual(scopedContext.metadata.continuityScopeId, "cs_universe_creative");
  console.log("✔ Test 12: Scope metadata (projectId, sessionId, continuityScopeId) correctly preserved");

  console.log("\n=======================================================");
  console.log("🎉 All 12 Auth Context & Trust Boundary tests PASSED cleanly.");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Auth Context Middleware Test Failure:", err);
  process.exit(1);
});
