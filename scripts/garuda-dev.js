const {
  getGitSummary,
  detectPhase,
  getRecommendedNextAction
} = require("../src/devkit/projectIntelligence");

const BASE_URL = process.env.GARUDA_BASE_URL || "http://localhost:3000";

async function requestJson(url, options = {}) {
  const start = Date.now();

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    const durationMs = Date.now() - start;

    try {
      return { ok: response.ok, status: response.status, durationMs, data: JSON.parse(text) };
    } catch {
      return { ok: response.ok, status: response.status, durationMs, data: text };
    }
  } catch (error) {
    return { ok: false, status: 0, durationMs: Date.now() - start, error: error.message };
  }
}

async function run() {
  const git = getGitSummary();
  const phase = detectPhase(git.branch);

  console.log("====================================");
  console.log("GARUDA DEV TOOLKIT");
  console.log("====================================");
  console.log("Base URL:", BASE_URL);
  console.log("Branch:", git.branch);
  console.log("Latest Commit:", git.commit);
  console.log("Current Phase:", phase);

  const health = await requestJson(`${BASE_URL}/api/health`);
  console.log(`\n[1] Health API: ${health.ok ? "PASS" : "FAIL"} (${health.status}) ${health.durationMs}ms`);

  const knowledge = await requestJson(`${BASE_URL}/api/knowledge/search?q=term%20insurance`);
  console.log(`[2] Knowledge API: ${knowledge.ok ? "PASS" : "FAIL"} (${knowledge.status}) ${knowledge.durationMs}ms`);

  const rag = await requestJson(`${BASE_URL}/api/rag/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "What is term insurance?" })
  });

  console.log(`[3] RAG API: ${rag.ok ? "PASS" : "FAIL"} (${rag.status}) ${rag.durationMs}ms`);

  let qualityScore = 100;
  const weakSignals = ["terms & conditions", "terminal illness", "fixed maturity", "the term cancer"];
  const foundWeakSignals = [];

  if (rag.data && typeof rag.data === "object") {
    const context = String(rag.data.context || "").toLowerCase();

    for (const signal of weakSignals) {
      if (context.includes(signal)) {
        foundWeakSignals.push(signal);
        qualityScore -= 15;
      }
    }

    if (!Array.isArray(rag.data.sources) || rag.data.sources.length === 0) qualityScore -= 25;
    if (rag.data.provider === "fallback") qualityScore -= 10;

    console.log("\nRAG Provider:", rag.data.provider || "unknown");
    console.log("Grounded:", rag.data.grounded);
    console.log("Warnings:", Array.isArray(rag.data.warnings) ? rag.data.warnings.join(", ") : "none");
    console.log("Sources:", Array.isArray(rag.data.sources) ? rag.data.sources.length : 0);
  } else {
    qualityScore = 0;
  }

  qualityScore = Math.max(0, qualityScore);

  console.log("\nRetrieval Weak Signals:", foundWeakSignals.length ? foundWeakSignals.join(", ") : "none");
  console.log("Quality Score:", `${qualityScore}/100`);

  console.log("\nGit Status:");
  console.log(git.status);

  console.log("\nRecommended Next Action:");
  if (!health.ok) {
    console.log("Start GARUDA backend using: npm start");
  } else {
    console.log(getRecommendedNextAction({ branch: git.branch, gitStatus: git }));
  }

  console.log("\n====================================");
}

run().catch(error => {
  console.error("GARUDA Dev Toolkit failed:", error.message);
  process.exitCode = 1;
});
