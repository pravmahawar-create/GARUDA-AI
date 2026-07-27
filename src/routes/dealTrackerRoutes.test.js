const assert = require("assert");
const http = require("http");
const app = require("../app");
const { clearDealTrackerStore } = require("../services/dealTrackerService");

function request(server, method, path, body = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const postData = JSON.stringify(body);

    const reqOptions = {
      hostname: "127.0.0.1",
      port: address.port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on("error", reject);
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      req.write(postData);
    }
    req.end();
  });
}

async function runRouteTests() {
  clearDealTrackerStore();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    // 1. Test GET /api/revenue/deals/metrics (Initial empty state)
    const metrics1 = await request(server, "GET", "/api/revenue/deals/metrics");
    assert.strictEqual(metrics1.status, 200);
    assert.strictEqual(metrics1.body.success, true);
    assert.strictEqual(metrics1.body.data.submissionCount, 0);
    assert.strictEqual(metrics1.body.data.winRateLabel, "UNMEASURED (Awaiting empirical deal data)");

    // 2. Test POST /api/revenue/deals/submit
    const submitRes = await request(server, "POST", "/api/revenue/deals/submit", {
      dealId: "api-deal-101",
      client: "A.Team Remote",
      platform: "Remotive",
      quotedPrice: 3000,
      currency: "USD",
      deliveryPromiseDays: 5
    });
    assert.strictEqual(submitRes.status, 201);
    assert.strictEqual(submitRes.body.success, true);
    assert.strictEqual(submitRes.body.data.dealId, "api-deal-101");
    assert.strictEqual(submitRes.body.data.currentStatus, "NO_REPLY");

    // 3. Test POST /api/revenue/deals/response
    const responseRes = await request(server, "POST", "/api/revenue/deals/response", {
      dealId: "api-deal-101",
      status: "INTERVIEW",
      clientMessage: "We are interested in scheduling a technical interview."
    });
    assert.strictEqual(responseRes.status, 200);
    assert.strictEqual(responseRes.body.success, true);
    assert.strictEqual(responseRes.body.data.currentStatus, "INTERVIEW");

    // 4. Test GET /api/revenue/deals/metrics after response
    const metrics2 = await request(server, "GET", "/api/revenue/deals/metrics");
    assert.strictEqual(metrics2.status, 200);
    assert.strictEqual(metrics2.body.data.submissionCount, 1);
    assert.strictEqual(metrics2.body.data.replyCount, 1);
    assert.strictEqual(metrics2.body.data.replyRatePercent, 100);

    console.log("Deal Tracker API Route Integration Tests PASSED cleanly.");
  } catch (err) {
    console.error("Route test error:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(0);
  }
}

runRouteTests();
