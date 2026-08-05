const assert = require("assert");
const express = require("express");
const motherRoutes = require("../../src/routes/motherAgentRoutes");
const conversationRoutes = require("../../src/routes/conversationRoutes");
const cognitiveRouterService = require("../../src/services/cognitiveRouterService");

async function runIntegrationSuite() {
  console.log("=== GARUDA LOCAL COGNITIVE RESOURCE INTEGRATION TEST SUITE ===");

  // Set local environment to use active Ollama instance
  process.env.GARUDA_LLM_PROVIDER = "ollama";
  process.env.GARUDA_LLM_MODEL = "qwen2.5-coder:3b";
  process.env.GARUDA_OLLAMA_URL = "http://127.0.0.1:11434";

  const app = express();
  app.use(express.json());
  app.use("/api/mother", motherRoutes);
  app.use("/api/conversations", conversationRoutes);

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // -------------------------------------------------------------
      // 1. HEALTH & ROUTER RESOLUTION TEST
      // -------------------------------------------------------------
      const health = await cognitiveRouterService.checkCognitiveHealth();
      console.log("Cognitive Health Probe:", JSON.stringify(health, null, 2));
      assert.strictEqual(health.status, "ONLINE", "Ollama daemon on 127.0.0.1:11434 must be ONLINE");

      const resource = cognitiveRouterService.resolveCognitiveResource("CONVERSATION");
      assert.strictEqual(resource.provider, "ollama");
      assert.strictEqual(resource.model, "qwen2.5-coder:3b");
      console.log("✔ 1. Sovereign Router & Health Probe Verified (ONLINE).");

      // -------------------------------------------------------------
      // 2. END-TO-END LOCAL NATURAL CONVERSATION SUITE (10 PROMPTS)
      // -------------------------------------------------------------
      const testPrompts = [
        "r u happy",
        "hello",
        "who are you",
        "tum kaun ho aur kya kar sakte ho?",
        "explain how microservices communicate briefly",
        "bhai system metrics ke baare mein batao",
        "give me 3 quick tips for database indexing",
        "how are your operational systems performing?",
        "describe your core system architecture",
        "how is your local thinking engine performing?"
      ];

      for (const promptText of testPrompts) {
        const t0 = Date.now();
        const res = await fetch(`${baseUrl}/api/mother/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: promptText })
        });
        const data = await res.json();
        const elapsed = Date.now() - t0;

        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.mode, "conversation");
        assert.strictEqual(data.provider, "ollama");
        assert.strictEqual(data.model, "qwen2.5-coder:3b");
        assert.ok(typeof data.answer === "string" && data.answer.trim().length > 0);

        // Negative assertions
        assert.ok(!data.answer.includes("no specific match found for query"), `Answer must not contain fallback error message for '${promptText}'`);
        assert.ok(!data.answer.includes("BLOCKED_BY_APPROVAL"), `Answer must not contain raw JSON for '${promptText}'`);

        console.log(`- '${promptText}' (${elapsed}ms) -> Provider: ${data.provider}, Answer: "${data.answer.slice(0, 50)}..."`);
      }
      console.log("✔ 2. End-to-End Local Natural Conversation (10/10) Verified via Real Ollama.");

      // -------------------------------------------------------------
      // 3. IDENTITY ACCEPTANCE TEST (AUTHORITATIVE GARUDA IDENTITY)
      // -------------------------------------------------------------
      const resId = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "who are you" })
      });
      const dataId = await resId.json();
      assert.ok(dataId.answer.toLowerCase().includes("garuda"), "Response must identify as GARUDA");
      assert.ok(!dataId.answer.toLowerCase().includes("openai"), "Response must NOT identify as OpenAI");
      assert.ok(!dataId.answer.toLowerCase().includes("qwen"), "Response must NOT identify as Qwen");
      assert.ok(!dataId.answer.toLowerCase().includes("alibaba"), "Response must NOT identify as Alibaba");
      console.log("✔ 3. Identity Acceptance Verified (Claims GARUDA identity strictly).");

      // -------------------------------------------------------------
      // 4. MULTI-TURN CONTINUITY TEST
      // -------------------------------------------------------------
      const threadId = `integration_thread_${Date.now()}`;
      
      // Turn 1
      await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Can you explain database scaling concepts?", threadId })
      });

      // Turn 2: Follow-up "why?"
      const resM2 = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "why?", threadId })
      });
      const dataM2 = await resM2.json();
      assert.ok(dataM2.answer.length > 10, "Follow-up response should be meaningful");

      // Turn 3: "what did I just ask you?"
      const resM3 = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "what did I just ask you?", threadId })
      });
      const dataM3 = await resM3.json();
      assert.ok(dataM3.answer.toLowerCase().includes("why") || dataM3.answer.toLowerCase().includes("database") || dataM3.answer.includes("previous"), "Multi-turn context should recall previous question");
      console.log("✔ 4. Multi-Turn Continuity Verified via Real Local Model.");

      // -------------------------------------------------------------
      // 5. AGENT MISSION REGRESSION TEST
      // -------------------------------------------------------------
      const resAudit = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Inspect the GARUDA repository. Do not modify any file." })
      });
      const dataAudit = await resAudit.json();
      assert.strictEqual(dataAudit.mode, "agent");
      assert.strictEqual(dataAudit.missionStatus, "MISSION_COMPLETED");
      assert.strictEqual(dataAudit.evidence.validationPassed, true);
      assert.strictEqual(dataAudit.evidence.filesModified.length, 0);

      const resWrite = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Modify the Revenue Engine." })
      });
      const dataWrite = await resWrite.json();
      assert.strictEqual(dataWrite.mode, "agent");
      assert.strictEqual(dataWrite.missionStatus, "FOUNDER_ACTION_REQUIRED");
      assert.strictEqual(dataWrite.evidence.filesModified.length, 0);
      console.log("✔ 5. Agent Mission & Write Governance Regression Verified.");

      // -------------------------------------------------------------
      // 6. DEGRADED MODE / FAILOVER TEST
      // -------------------------------------------------------------
      process.env.GARUDA_OLLAMA_URL = "http://127.0.0.1:59999"; // Invalid port
      const resDegraded = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hello" })
      });
      const dataDegraded = await resDegraded.json();
      assert.strictEqual(resDegraded.status, 200);
      assert.strictEqual(dataDegraded.success, true);
      assert.ok(Array.isArray(dataDegraded.warnings));
      assert.ok(dataDegraded.warnings.includes("GENERATIVE_ENGINE_UNAVAILABLE"), "Degraded mode must emit GENERATIVE_ENGINE_UNAVAILABLE warning");
      assert.ok(typeof dataDegraded.answer === "string" && dataDegraded.answer.length > 0, "Degraded mode must return natural fallback answer");
      console.log("✔ 6. Degraded Failover Mode Verified (Generates grounded fallback when Ollama is offline).");

      // Restore active Ollama URL
      process.env.GARUDA_OLLAMA_URL = "http://127.0.0.1:11434";

      // -------------------------------------------------------------
      // 7. MODEL REPLACEMENT TEST (ARCHITECTURE INDEPENDENCE)
      // -------------------------------------------------------------
      process.env.GARUDA_LLM_MODEL = "llama3.1:8b";
      const resModelSwap = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hello" })
      });
      const dataModelSwap = await resModelSwap.json();
      assert.strictEqual(dataModelSwap.model, "llama3.1:8b", "Router must accept model configuration replacement without code changes");
      console.log("✔ 7. Model Independence Verified (Hot-swappable via configuration).");

      // Restore default model
      process.env.GARUDA_LLM_MODEL = "qwen2.5-coder:3b";

      console.log("\nALL LOCAL COGNITIVE RESOURCE INTEGRATION TESTS PASSED CLEANLY!");
    } catch (err) {
      console.error("\n❌ LOCAL INTEGRATION TEST FAILED:", err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runIntegrationSuite();
