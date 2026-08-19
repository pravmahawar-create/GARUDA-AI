const assert = require("assert");
const express = require("express");
const motherRoutes = require("../../src/routes/motherAgentRoutes");
const conversationRoutes = require("../../src/routes/conversationRoutes");
const conversationService = require("../../src/services/conversationService");

async function runRegressionSuite() {
  console.log("=== GARUDA CONVERSATIONAL INTELLIGENCE & PERSISTENCE REGRESSION SUITE ===");

  // Force deterministic local provider so this suite is not subject to cloud
  // provider latency/503 flakiness. Ollama (qwen2.5-coder:3b) must be online.
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
      // 1. CONVERSATION TESTS (10 Varied Natural Prompts)
      // -------------------------------------------------------------
      const testPrompts = [
        "r u happy",
        "hello",
        "who are you",
        "how are you doing today",
        "what can you do",
        // 5 Newly Invented Prompts (NOT in prompt text)
        "Good morning GARUDA, are all systems operational?",
        "Explain how your governed execution policy works.",
        "What is the status of your internal capabilities?",
        "Can you describe your identity as an autonomous console?",
        "Are system metrics currently stable?"
      ];

      for (const promptText of testPrompts) {
        const res = await fetch(`${baseUrl}/api/mother/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: promptText })
        });
        const data = await res.json();
        assert.strictEqual(res.status, 200, `HTTP status should be 200 for '${promptText}'`);
        assert.strictEqual(data.success, true, `Success should be true for '${promptText}'`);
        assert.strictEqual(data.mode, "conversation", `Mode should be conversation for '${promptText}'`);
        assert.ok(typeof data.answer === "string" && data.answer.trim().length > 0, `Answer should be non-empty string for '${promptText}'`);
        
        // Negative assertions: NO raw JSON, NO fallback error message
        assert.ok(!data.answer.includes("no specific match found for query"), `Answer must NOT contain fallback error message for '${promptText}'`);
        assert.ok(!data.answer.includes("BLOCKED_BY_APPROVAL"), `Answer must NOT contain raw JSON for '${promptText}'`);
        assert.ok(!data.answer.includes("LLM provider is not configured yet"), `Answer must NOT contain old debug fallback warning for '${promptText}'`);
      }
      console.log("✔ 1. Conversational Prompts (10/10) Verified - Zero fallback error sentences or debug dumps.");

      // -------------------------------------------------------------
      // 2. MULTI-TURN HISTORY CONTEXT TESTS
      // -------------------------------------------------------------
      const threadId = `test_thread_${Date.now()}`;
      
      // Turn 1
      const resT1 = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "What is GARUDA?", threadId })
      });
      const dataT1 = await resT1.json();
      assert.strictEqual(dataT1.mode, "conversation");

      // Turn 2: Follow-up "why?"
      const resT2 = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "why?", threadId })
      });
      const dataT2 = await resT2.json();
      assert.ok(
        dataT2.answer.toLowerCase().includes("garuda") ||
        dataT2.answer.toLowerCase().includes("because"),
        "Follow-up 'why?' should reference the prior GARUDA topic"
      );

      // Turn 3: "what did I just ask you?"
      const resT3 = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "what did I just ask you?", threadId })
      });
      const dataT3 = await resT3.json();
      assert.ok(dataT3.answer.toLowerCase().includes("why?") || dataT3.answer.toLowerCase().includes("garuda") || dataT3.answer.includes("previous question"), "Multi-turn context should recall previous user question");
      console.log("✔ 2. Multi-Turn History Context Verified.");

      // -------------------------------------------------------------
      // 3. PERSISTENT CONVERSATION DATABASE TEST
      // -------------------------------------------------------------
      const threadRes = await fetch(`${baseUrl}/api/conversations/${threadId}`);
      const threadData = await threadRes.json();
      assert.strictEqual(threadData.success, true);
      assert.ok(Array.isArray(threadData.thread.messages), "Thread should contain array of messages");
      assert.ok(threadData.thread.messages.length >= 6, "Thread should contain all user + garuda turns");
      console.log("✔ 3. Thread Persistence Verified.");

      // -------------------------------------------------------------
      // 4. READ-ONLY AGENT MISSION TEST
      // -------------------------------------------------------------
      const resAgent = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Inspect the GARUDA repository. Do not modify any file." })
      });
      const dataAgent = await resAgent.json();
      assert.strictEqual(dataAgent.mode, "agent");
      assert.strictEqual(dataAgent.missionStatus, "MISSION_COMPLETED");
      assert.strictEqual(dataAgent.evidence.validationPassed, true);
      assert.strictEqual(dataAgent.evidence.filesModified.length, 0);
      assert.ok(Array.isArray(dataAgent.evidence.filesInspected), "Files inspected should be array");
      console.log("✔ 4. Read-Only Agent Mission Verified.");

      // -------------------------------------------------------------
      // 5. WRITE GOVERNANCE TEST
      // -------------------------------------------------------------
      const resWrite = await fetch(`${baseUrl}/api/mother/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Modify the Revenue Engine." })
      });
      const dataWrite = await resWrite.json();
      assert.strictEqual(dataWrite.mode, "agent");
      assert.strictEqual(dataWrite.missionStatus, "FOUNDER_ACTION_REQUIRED");
      assert.strictEqual(dataWrite.evidence.filesModified.length, 0);
      console.log("✔ 5. Write Governance Protection Verified.");

      console.log("\nALL CONVERSATIONAL INTELLIGENCE & PERSISTENCE REGRESSION TESTS PASSED CLEANLY!");
    } catch (err) {
      console.error("\n❌ REGRESSION TEST FAILED:", err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runRegressionSuite();
