const assert = require("assert");
const http = require("http");
const express = require("express");
const revenueRoutes = require("./revenueRoutes");

async function testRevenuePipelineRoutes() {
  console.log("Testing Revenue Pipeline HTTP Routes...\n");

  const app = express();
  app.use(express.json());
  app.use("/api/revenue", revenueRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/revenue`;

  try {
    // 1. Ingest Lead
    const ingestRes = await fetch(`${baseUrl}/pipeline/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: "Shree Krishna Traders",
        contactName: "Ramesh Sharma",
        phone: "9827001122",
        email: "ramesh@krishnatraders.in",
        category: "kirana_grocery",
        painPoint: "Daily notebook khata management & fast hindi voice billing"
      })
    });
    const ingestJson = await ingestRes.json();
    assert.strictEqual(ingestRes.status, 201);
    assert.strictEqual(ingestJson.success, true);
    const pipelineId = ingestJson.data.pipelineId;
    assert.ok(pipelineId);
    console.log("✔ POST /api/revenue/pipeline/ingest passed");

    // 2. Qualify
    const qualRes = await fetch(`${baseUrl}/pipeline/qualify/${pipelineId}`, { method: "POST" });
    const qualJson = await qualRes.json();
    assert.strictEqual(qualRes.status, 200);
    assert.strictEqual(qualJson.data.qualification.status, "QUALIFIED");
    console.log("✔ POST /api/revenue/pipeline/qualify/:id passed");

    // 3. Demonstrate
    const demoRes = await fetch(`${baseUrl}/pipeline/demonstrate/${pipelineId}`, { method: "POST" });
    const demoJson = await demoRes.json();
    assert.strictEqual(demoRes.status, 200);
    assert.ok(demoJson.data.demonstration.demoUrl);
    console.log("✔ POST /api/revenue/pipeline/demonstrate/:id passed");

    // 4. Propose
    const propRes = await fetch(`${baseUrl}/pipeline/propose/${pipelineId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountINR: 1999 })
    });
    const propJson = await propRes.json();
    assert.strictEqual(propRes.status, 200);
    assert.strictEqual(propJson.data.proposal.quotedAmountINR, 1999);
    console.log("✔ POST /api/revenue/pipeline/propose/:id passed");

    // 5. Checkout
    const checkRes = await fetch(`${baseUrl}/pipeline/checkout/${pipelineId}`, { method: "POST" });
    const checkJson = await checkRes.json();
    assert.strictEqual(checkRes.status, 200);
    assert.ok(checkJson.data.checkout.upiString);
    console.log("✔ POST /api/revenue/pipeline/checkout/:id passed");

    // 6. Verify Payment (Negative test: unverified claim)
    const negPayRes = await fetch(`${baseUrl}/pipeline/verify-payment/${pipelineId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimText: "Payment ho gaya" })
    });
    assert.strictEqual(negPayRes.status, 400);
    console.log("✔ POST /api/revenue/pipeline/verify-payment/:id blocked unverified claim with HTTP 400");

    // 7. Verify Payment (Positive test: authoritative UTR)
    const posPayRes = await fetch(`${baseUrl}/pipeline/verify-payment/${pipelineId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utr: "528994829103", authoritative: true, amountINR: 1999 })
    });
    const posPayJson = await posPayRes.json();
    assert.strictEqual(posPayRes.status, 200);
    assert.strictEqual(posPayJson.data.payment.verified, true);
    console.log("✔ POST /api/revenue/pipeline/verify-payment/:id approved authoritative UTR with HTTP 200");

    // 8. Deliver
    const delivRes = await fetch(`${baseUrl}/pipeline/deliver/${pipelineId}`, { method: "POST" });
    const delivJson = await delivRes.json();
    assert.strictEqual(delivRes.status, 200);
    assert.strictEqual(delivJson.data.delivery.delivered, true);
    assert.strictEqual(delivJson.data.delivery.manifest.artifacts[0].sha256, "28a57588aafdb8b77e6e4ca415ee43724db0ab02db17d1a95c0f1410cffb4eab");
    console.log("✔ POST /api/revenue/pipeline/deliver/:id generated delivery package with verified SHA-256");

    // 9. Status & Metrics
    const statusRes = await fetch(`${baseUrl}/pipeline/status/${pipelineId}`);
    const statusJson = await statusRes.json();
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusJson.data.currentStage, "DELIVER");

    const metricsRes = await fetch(`${baseUrl}/pipeline/metrics`);
    const metricsJson = await metricsRes.json();
    assert.strictEqual(metricsRes.status, 200);
    assert(metricsJson.data.totalRevenueVerifiedINR >= 1999);
    console.log("✔ GET /api/revenue/pipeline/status and /metrics verified cleanly");

    console.log("\nAll Revenue Pipeline HTTP Route Tests PASSED!");
  } finally {
    server.close();
  }
}

testRevenuePipelineRoutes().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
