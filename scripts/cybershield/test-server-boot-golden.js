/**
 * 🦅 GARUDA CYBERSHIELD™ — Golden Autonomy & HTTP Server Integration Test
 * Simulates server boot, background worker auto-spawning, customer HTTP interaction,
 * and automated event ingestion without manual founder terminal execution.
 */

const http = require("http");
const assert = require("assert");

async function runGoldenServerTest() {
  console.log("=== STARTING GOLDEN SERVER & HTTP AUTONOMY TEST ===");

  // Import Express app (which now has CyberShield routes and worker mounted)
  const app = require("../../src/app");
  const { startCyberShieldWorker, getWorkerHealth } = require("../../src/workers/cybershieldWorker");

  // 1. Boot Worker (as server.js does)
  const workerBoot = startCyberShieldWorker();
  assert(workerBoot.success, "Worker failed to boot");
  console.log("1. Background Worker Auto-Boot: SUCCESS (status:", workerBoot.telemetry.status, ")");

  // 2. Start HTTP server on an ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`2. HTTP Server Listening on ${baseUrl}`);

  try {
    // 3. Test Health Endpoint
    const healthRes = await fetch(`${baseUrl}/api/cybershield/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.success, true);
    console.log("3. GET /api/cybershield/health: 200 OK — Telemetry Active");

    // 4. Test Create Monitor via HTTP
    const monRes = await fetch(`${baseUrl}/api/cybershield/monitors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "tenant_client_golden_test"
      },
      body: JSON.stringify({
        targetIdentifier: "@golden_creator_official",
        platform: "instagram",
        targetType: "account"
      })
    });
    assert.strictEqual(monRes.status, 201);
    const monData = await monRes.json();
    assert.strictEqual(monData.success, true);
    const monitorId = monData.data.monitorId;
    console.log(`4. POST /api/cybershield/monitors: 201 Created — Monitor ID: ${monitorId}`);

    // 5. Ingest External Event via HTTP (Simulating Platform Webhook / Polling detection)
    const ingestRes = await fetch(`${baseUrl}/api/cybershield/simulate-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "tenant_client_golden_test"
      },
      body: JSON.stringify({
        platform: "instagram",
        targetHandle: "golden_creator_official",
        perpetratorHandle: "hate_bot_101",
        perpetratorId: "USER-BOT-99",
        commentId: `CMT-${Date.now()}`,
        postUrl: "https://instagram.com/p/golden_reel",
        rawText: "Tu fraud chor hai tera murder karwa dunga kutte",
        monitorId
      })
    });
    assert.strictEqual(ingestRes.status, 201);
    const ingestData = await ingestRes.json();
    assert.strictEqual(ingestData.success, true);
    assert.strictEqual(ingestData.incident.intelligence.severityLevel, 5);
    const incidentId = ingestData.incident.incidentId;
    console.log(`5. POST /api/cybershield/simulate-event: 201 Created — Incident #${incidentId} (Tier 5 Detected)`);

    // 6. Customer Checks Dashboard Incidents via HTTP
    const listRes = await fetch(`${baseUrl}/api/cybershield/incidents`, {
      headers: { "x-tenant-id": "tenant_client_golden_test" }
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert(listData.count >= 1, "Incident list should contain at least 1 incident");
    console.log(`6. GET /api/cybershield/incidents: 200 OK — Found ${listData.count} incidents for tenant`);

    // 7. Customer Downloads Section 63 Evidence Certificate via HTTP
    const certRes = await fetch(`${baseUrl}/api/cybershield/incidents/${incidentId}/evidence`, {
      headers: { "x-tenant-id": "tenant_client_golden_test" }
    });
    assert.strictEqual(certRes.status, 200);
    const certData = await certRes.json();
    assert(certData.certificate.cryptographicDigestSha256, "Missing SHA-256 in certificate");
    console.log(`7. GET /api/cybershield/incidents/:id/evidence: 200 OK — SHA-256: ${certData.certificate.cryptographicDigestSha256}`);

    // 8. Customer Approves Legal Notice Draft via Human Gateway HTTP
    const approveRes = await fetch(`${baseUrl}/api/cybershield/incidents/${incidentId}/approve-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "tenant_client_golden_test"
      },
      body: JSON.stringify({ actionType: "LEGAL_NOTICE", notes: "Approved by Golden Client" })
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.data.humanApproval.status, "APPROVED");
    console.log(`8. POST /api/cybershield/incidents/:id/approve-action: 200 OK — Status: APPROVED`);

    console.log("\n✅ GOLDEN TEST PASSED: 100% SELF-SERVE END-TO-END AUTONOMY VERIFIED OVER HTTP!");
    console.log("   Zero manual terminal scripts required for customer operation.\n");
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runGoldenServerTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Golden test failed:", err);
      process.exit(1);
    });
}
