/**
 * GARUDA Multi-Tenant Workspaces, Seats & Team Invitations Test Suite
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
  console.log("▶ Starting Tenant Workspace & Seats HTTP Server...");
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      console.log(`✓ Listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  const tenantId = `tenant_seat_test_${Date.now()}`;
  const testHeaders = { "x-garuda-tenant-id": tenantId };

  try {
    // 1. GET /api/tenants/current
    const r1 = await request("GET", "/api/tenants/current", null, testHeaders);
    assert.strictEqual(r1.status, 200);
    assert.strictEqual(r1.body.data.plan, "personal");
    assert.strictEqual(r1.body.data.maxSeats, 1, "Personal plan starts with 1 seat limit");
    console.log("✓ GET /api/tenants/current passed (Personal plan, 1 seat limit)");

    // 2. GET /api/tenants/members (empty initially)
    const r2 = await request("GET", "/api/tenants/members", null, testHeaders);
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(r2.body.data.length, 0);
    console.log("✓ GET /api/tenants/members passed");

    // 3. POST /api/tenants/invites -> invites first member (1/1 seat)
    const r3 = await request(
      "POST",
      "/api/tenants/invites",
      { email: "lead_dev@garudaos.in", role: "tenant_admin" },
      testHeaders
    );
    assert.strictEqual(r3.status, 201);
    assert.strictEqual(r3.body.data.status, "invited");
    const firstMembershipId = r3.body.data.membershipId;
    const firstInviteToken = r3.body.data.inviteToken;
    console.log("✓ POST /api/tenants/invites: invited 1st member successfully");

    // 4. POST /api/tenants/invites -> exceeds 1 seat limit on personal plan!
    const r4 = await request(
      "POST",
      "/api/tenants/invites",
      { email: "qa_lead@garudaos.in", role: "tenant_member" },
      testHeaders
    );
    assert.strictEqual(r4.status, 403, "Exceeding seat limit must return 403 Forbidden");
    assert.strictEqual(r4.body.code, "SEAT_LIMIT_REACHED");
    console.log("✓ Seat quota enforcement verified (403 SEAT_LIMIT_REACHED)");

    // 5. Upgrade workspace to SME plan (10 seats) via billing activation
    const r5 = await request(
      "POST",
      "/api/billing/activate",
      { plan: "sme", interval: "monthly", paymentId: "pay_upgrade_sme_verified" },
      testHeaders
    );
    assert.strictEqual(r5.status, 200);
    assert.strictEqual(r5.body.data.plan, "sme");
    console.log("✓ Workspace upgraded to SME plan (10 seats capacity)");

    // 6. Now invite 2nd member -> should succeed because SME allows 10 seats!
    const r6 = await request(
      "POST",
      "/api/tenants/invites",
      { email: "qa_lead@garudaos.in", role: "tenant_member" },
      testHeaders
    );
    assert.strictEqual(r6.status, 201, "After upgrade, second invitation succeeds");
    const secondMembershipId = r6.body.data.membershipId;
    console.log("✓ POST /api/tenants/invites: 2nd member invited after upgrade");

    // 7. Accept first invitation
    const r7 = await request(
      "POST",
      `/api/tenants/invites/${firstInviteToken}/accept`,
      { userId: "usr_lead_dev_1" },
      testHeaders
    );
    assert.strictEqual(r7.status, 200);
    assert.strictEqual(r7.body.data.status, "active");
    assert.strictEqual(r7.body.data.userId, "usr_lead_dev_1");
    console.log("✓ POST /api/tenants/invites/:inviteId/accept verified");

    // 8. Revoke second invitation
    const r8 = await request(
      "DELETE",
      `/api/tenants/members/${secondMembershipId}`,
      null,
      testHeaders
    );
    assert.strictEqual(r8.status, 200);
    assert.strictEqual(r8.body.data.status, "revoked");
    console.log("✓ DELETE /api/tenants/members/:membershipId verified");

    console.log("\n All 8 Multi-Tenant & Seat Invitation tests PASSED!");
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
