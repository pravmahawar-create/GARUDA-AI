const BASE_URL = process.env.GARUDA_BASE_URL || "http://localhost:3000";

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: JSON.parse(text)
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: text
    };
  }
}

async function run() {
  console.log("GARUDA RAG Test Runner");
  console.log("Base URL:", BASE_URL);

  const health = await requestJson(`${BASE_URL}/api/health`);
  console.log("\n[1] Health:", health.ok ? "PASS" : "FAIL", health.status);

  const knowledge = await requestJson(`${BASE_URL}/api/knowledge/search?q=term%20insurance`);
  console.log("\n[2] Knowledge Search:", knowledge.ok ? "PASS" : "FAIL", knowledge.status);

  const rag = await requestJson(`${BASE_URL}/api/rag/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "What is term insurance?" })
  });

  console.log("\n[3] RAG Answer:", rag.ok ? "PASS" : "FAIL", rag.status);

  if (rag.data && typeof rag.data === "object") {
    console.log("Provider:", rag.data.provider || "unknown");
    console.log("Grounded:", rag.data.grounded);
    console.log("Warnings:", Array.isArray(rag.data.warnings) ? rag.data.warnings.join(", ") : "none");
    console.log("Sources:", Array.isArray(rag.data.sources) ? rag.data.sources.length : 0);

    const context = String(rag.data.context || "").toLowerCase();
    const weakSignals = ["terms & conditions", "terminal illness", "fixed maturity"];

    const foundWeakSignals = weakSignals.filter(signal => context.includes(signal));
    console.log("Weak retrieval signals:", foundWeakSignals.length ? foundWeakSignals.join(", ") : "none");

    if (foundWeakSignals.length) {
      console.log("\nResult: RAG PIPELINE PASS, RETRIEVAL QUALITY NEEDS IMPROVEMENT");
      process.exitCode = 2;
      return;
    }

    console.log("\nResult: PASS");
    return;
  }

  console.log("\nResult: FAIL - Invalid RAG response");
  process.exitCode = 1;
}

run().catch(error => {
  console.error("\nTest runner failed:", error.message);
  process.exitCode = 1;
});
