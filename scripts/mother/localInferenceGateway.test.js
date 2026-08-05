const assert = require("assert");
const { createGatewayApp } = require("../../src/services/localInferenceGateway");

async function runGatewayTests() {
  console.log("=== GARUDA LOCAL AUTHENTICATED GATEWAY TEST SUITE ===");

  const TEST_SECRET = "test_garuda_secret_key_998877";
  const app = createGatewayApp(TEST_SECRET);

  const server = app.listen(0, "127.0.0.1", async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // -------------------------------------------------------------
      // 1. REJECT MISSING AUTHENTICATION (401)
      // -------------------------------------------------------------
      const resNoAuth = await fetch(`${baseUrl}/health`);
      assert.strictEqual(resNoAuth.status, 401, "Missing auth header must return 401");
      const dataNoAuth = await resNoAuth.json();
      assert.strictEqual(dataNoAuth.error, "UNAUTHORIZED");
      console.log("✔ 1. Missing authentication rejected with 401.");

      // -------------------------------------------------------------
      // 2. REJECT INVALID AUTHENTICATION KEY (401)
      // -------------------------------------------------------------
      const resBadAuth = await fetch(`${baseUrl}/health`, {
        headers: { "X-GARUDA-NODE-KEY": "wrong_key_12345" }
      });
      assert.strictEqual(resBadAuth.status, 401, "Invalid auth header must return 401");
      console.log("✔ 2. Invalid authentication key rejected with 401.");

      // -------------------------------------------------------------
      // 3. ALLOW VALID AUTHENTICATION GET /health (200)
      // -------------------------------------------------------------
      const resHealth = await fetch(`${baseUrl}/health`, {
        headers: { "X-GARUDA-NODE-KEY": TEST_SECRET }
      });
      assert.strictEqual(resHealth.status, 200, "Valid auth GET /health must return 200");
      const dataHealth = await resHealth.json();
      assert.strictEqual(dataHealth.status, "ONLINE");
      assert.strictEqual(dataHealth.gateway, "GARUDA_AUTHENTICATED_GATEWAY_V1");
      console.log("✔ 3. Valid authenticated GET /health returned 200 OK.");

      // -------------------------------------------------------------
      // 4. ALLOW VALID AUTHENTICATION POST /generate (200)
      // -------------------------------------------------------------
      const resGen = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GARUDA-NODE-KEY": TEST_SECRET
        },
        body: JSON.stringify({
          model: "qwen2.5-coder:3b",
          prompt: "Say hello in 3 words."
        })
      });
      assert.strictEqual(resGen.status, 200, "Valid auth POST /generate must return 200");
      const dataGen = await resGen.json();
      assert.ok(typeof dataGen.response === "string" && dataGen.response.length > 0);
      console.log(`✔ 4. Valid authenticated POST /generate returned: "${dataGen.response.trim()}"`);

      // -------------------------------------------------------------
      // 5. BLOCK ARBITRARY MODEL REQUESTS (403)
      // -------------------------------------------------------------
      const resBadModel = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-GARUDA-NODE-KEY": TEST_SECRET
        },
        body: JSON.stringify({
          model: "unauthorized-malicious-model:70b",
          prompt: "test"
        })
      });
      assert.strictEqual(resBadModel.status, 403, "Arbitrary model request must return 403");
      console.log("✔ 5. Arbitrary model request blocked with 403 Forbidden.");

      console.log("\nALL GATEWAY SECURITY TESTS PASSED CLEANLY!");
    } catch (err) {
      console.error("❌ GATEWAY TEST FAILED:", err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runGatewayTests();
