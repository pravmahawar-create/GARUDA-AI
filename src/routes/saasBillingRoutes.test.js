/**
 * GARUDA SaaS Billing & Multi-Tenant Routing Test Suite
 */

const assert = require("assert");
const http = require("http");

let app;
try {
  app = require("../app");
} catch (err) {
  console.error("✘ Failed to load Express app:", err.message);
  process.exit(1);
}

let server;
let port;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log("▶ Starting SaaS Billing HTTP Server on ephemeral port...");
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      console.log(`✓ Listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  try {
    // 1. GET /api/billing/plans
    const r1 = await request("GET", "/api/billing/plans");
    assert.strictEqual(r1.status, 200, "Plans should return 200");
    assert.strictEqual(r1.body.success, true);
    assert.strictEqual(r1.body.data.length, 4, "Should have 4 subscription tiers");
    console.log("✓ GET /api/billing/plans passed");

    // 2. GET /api/billing/subscription
    const r2 = await request("GET", "/api/billing/subscription", null, {
      "x-garuda-tenant-id": "tenant_saas_test_1"
    });
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(r2.body.data.plan, "personal");
    console.log("✓ GET /api/billing/subscription passed");

    // 3. GET /api/billing/usage
    const r3 = await request("GET", "/api/billing/usage", null, {
      "x-garuda-tenant-id": "tenant_saas_test_1"
    });
    assert.strictEqual(r3.status, 200);
    assert.strictEqual(r3.body.data.limits.maxTokensPerMonth, 500000);
    console.log("✓ GET /api/billing/usage passed");

    // 4. POST /api/billing/subscribe
    const r4 = await request("POST", "/api/billing/subscribe", {
      plan: "creator",
      interval: "monthly"
    }, {
      "x-garuda-tenant-id": "tenant_saas_test_1"
    });
    assert.strictEqual(r4.status, 201);
    assert.strictEqual(r4.body.data.amount, 1499);
    console.log("✓ POST /api/billing/subscribe passed");

    // 5. POST /api/billing/activate
    const r5 = await request("POST", "/api/billing/activate", {
      plan: "creator",
      interval: "monthly",
      paymentId: "pay_test_active_1"
    }, {
      "x-garuda-tenant-id": "tenant_saas_test_1"
    });
    assert.strictEqual(r5.status, 200);
    assert.strictEqual(r5.body.data.plan, "creator");
    console.log("✓ POST /api/billing/activate passed");

    // 6. POST /api/billing/api-keys
    const r6 = await request("POST", "/api/billing/api-keys", {
      name: "Production Worker Key",
      scopes: ["missions:read", "missions:write"]
    }, {
      "x-garuda-tenant-id": "tenant_saas_test_1"
    });
    assert.strictEqual(r6.status, 201);
    assert(r6.body.data.apiKey.startsWith("grd_live_"));
    const createdKeyId = r6.body.data.keyId;
    console.log("✓ POST /api/billing/api-keys passed");

    // 7. GET /api/billing/api-keys
    const r7 = await request("GET", "/api/billing/api-keys", null, {
      "x-garuda-tenant-id": "tenant_saas_test_1"
    });
    assert.strictEqual(r7.status, 200);
    assert.strictEqual(r7.body.data.length, 1);
    assert.strictEqual(r7.body.data[0].keyId, createdKeyId);
    console.log("✓ GET /api/billing/api-keys passed");

    // 8. DELETE /api/billing/api-keys/:id
    const r8 = await request("DELETE", `/api/billing/api-keys/${createdKeyId}`, null, {
      "x-garuda-tenant-id": "tenant_saas_test_1"
    });
    assert.strictEqual(r8.status, 200);
    console.log("✓ DELETE /api/billing/api-keys/:id passed");

    // 9. Merchant billing mounted on /api/merchant-billing/voice
    const r9 = await request("POST", "/api/merchant-billing/voice", {});
    assert.strictEqual(r9.status, 400, "Merchant voice without text returns 400");
    assert.strictEqual(r9.body.message, "text required");
    console.log("✓ Retail merchant billing mounted on /api/merchant-billing");

    // 10. Backward-compatibility alias: /api/billing/voice forwarded to merchant router
    const r10 = await request("POST", "/api/billing/voice", {});
    assert.strictEqual(r10.status, 400, "Legacy /api/billing/voice returns 400");
    assert.strictEqual(r10.body.message, "text required");
    console.log("✓ Legacy /api/billing/voice backward-compatibility alias verified");

    console.log("\n All 10 SaaS billing & merchant routing tests PASSED!");
    process.exit(0);
  } finally {
    if (server) {
      server.close();
    }
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  if (server) server.close();
  process.exit(1);
});
