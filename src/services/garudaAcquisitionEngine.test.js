const assert = require("assert");
const http = require("http");
const express = require("express");
const selfMarketing = require("./garudaSelfMarketingService");
const acquisitionEngine = require("./garudaAcquisitionEngineService");
const acquisitionRoutes = require("../routes/acquisitionRoutes");

const app = express();
app.use(express.json());
app.use("/api/acquisition", acquisitionRoutes);

async function runTests() {
  console.log("Starting GARUDA Milestone 27: Acquisition Engine Test Suite...\n");

  // --- 1. Self-Marketing & Programmatic SEO Topics ---
  console.log("--- 1. Self-Marketing & Programmatic SEO Topics ---");
  const topics = selfMarketing.getTopics();
  assert(Array.isArray(topics) && topics.length >= 4, "Should index at least 4 high-intent commercial topics");
  assert(topics.some((t) => t.slug === "custom-ai-development"), "Must include Custom AI Development topic");
  assert(topics.some((t) => t.slug === "custom-software-saas-mvp"), "Must include Custom Software / SaaS topic");
  console.log(`✔ PASS: Indexed ${topics.length} programmatic SEO topics with search-intent targeting`);

  // --- 2. Programmatic Content Brief & Structured Data ---
  console.log("\n--- 2. Programmatic Content Brief & Structured Data ---");
  const brief = selfMarketing.generateContentBrief("custom-ai-development");
  assert.strictEqual(brief.targetKeyword, "custom ai development");
  assert(brief.metaTitle.includes("GARUDA"), "Must include brand in meta title");
  assert.strictEqual(brief.structuredData["@type"], "Service");
  assert.strictEqual(brief.structuredData.offers.priceCurrency, "INR");
  assert(brief.contentOutline.length >= 3, "Content brief should provide complete outline");
  console.log("✔ PASS: Generated structured SEO content brief with Schema.org microdata");

  // --- 3. Sitemap Dynamic Directives ---
  console.log("\n--- 3. Sitemap Dynamic Directives ---");
  const sitemapEntries = selfMarketing.generateSitemapEntries();
  assert(Array.isArray(sitemapEntries) && sitemapEntries.length === topics.length);
  assert(sitemapEntries[0].url.startsWith("https://www.garudaos.in/services/"));
  console.log("✔ PASS: Generated programmatic dynamic sitemap entries");

  // --- 4. Acquisition Command Center Telemetry ---
  console.log("\n--- 4. Acquisition Command Center Telemetry ---");
  const metrics = await acquisitionEngine.getAcquisitionMetrics({ isTest: true });
  assert.strictEqual(metrics.success, true);
  assert(typeof metrics.funnel.totalDiscovered === "number");
  assert(Array.isArray(metrics.topDemands) && metrics.topDemands.length >= 3);
  assert(Array.isArray(metrics.bottlenecks) && metrics.bottlenecks.length >= 1);
  assert(Boolean(metrics.nextCustomerStrategy.primaryChannel));
  assert.strictEqual(metrics.truthDeclaration.realCustomerRevenue, "₹0", "Anti-Fabrication: Initial revenue must be ₹0");
  console.log("✔ PASS: Acquisition Command Center telemetry calculated with bottleneck diagnosis");

  // --- 5. Inbound Lead State Machine ---
  console.log("\n--- 5. Inbound Lead State Machine ---");
  const leadRecord = await acquisitionEngine.processInboundLead({
    title: "Enterprise Logistics Route Optimizer MVP",
    requirements: "Need custom AI route optimization algorithm connecting to Postgres database and Google Maps API",
    budget: 45000,
    currency: "INR",
    clientName: "Logistics Lead (TEST / SIMULATION)",
    source: "inbound_web_search"
  }, { isTest: true });

  assert.strictEqual(leadRecord.status, "QUALIFIED");
  assert.strictEqual(leadRecord.isTest, true);
  assert(leadRecord.leadId.startsWith("lead_"));
  console.log("✔ PASS: Inbound commercial lead qualified into state machine with test tag");

  // Start local ephemeral HTTP server for route testing
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // --- 6. REST API: GET /api/acquisition/command-center ---
    console.log("\n--- 6. REST API: GET /api/acquisition/command-center ---");
    const resMetrics = await fetch(`${baseUrl}/api/acquisition/command-center`, {
      headers: { "x-garuda-test": "true" }
    });
    const bodyMetrics = await resMetrics.json();
    assert.strictEqual(resMetrics.status, 200);
    assert.strictEqual(bodyMetrics.success, true);
    assert(Array.isArray(bodyMetrics.topDemands));
    console.log("✔ PASS: GET /api/acquisition/command-center returned 200 OK");

    // --- 7. REST API: GET /api/acquisition/self-marketing/topics ---
    console.log("\n--- 7. REST API: GET /api/acquisition/self-marketing/topics ---");
    const resTopics = await fetch(`${baseUrl}/api/acquisition/self-marketing/topics`);
    const bodyTopics = await resTopics.json();
    assert.strictEqual(resTopics.status, 200);
    assert.strictEqual(bodyTopics.success, true);
    assert(bodyTopics.count >= 4);
    console.log("✔ PASS: GET /api/acquisition/self-marketing/topics returned 200 OK");

    // --- 8. REST API: GET /api/acquisition/self-marketing/brief/:slug ---
    console.log("\n--- 8. REST API: GET /api/acquisition/self-marketing/brief/custom-software-saas-mvp ---");
    const resBrief = await fetch(`${baseUrl}/api/acquisition/self-marketing/brief/custom-software-saas-mvp`);
    const bodyBrief = await resBrief.json();
    assert.strictEqual(resBrief.status, 200);
    assert.strictEqual(bodyBrief.success, true);
    assert.strictEqual(bodyBrief.brief.targetKeyword, "custom software development");
    console.log("✔ PASS: GET /api/acquisition/self-marketing/brief/:slug returned 200 OK");

    // --- 9. REST API: POST /api/acquisition/leads ---
    console.log("\n--- 9. REST API: POST /api/acquisition/leads ---");
    const resLead = await fetch(`${baseUrl}/api/acquisition/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-garuda-test": "true" },
      body: JSON.stringify({
        title: "Custom CRM AI Pipeline",
        requirements: "Automated invoice parsing and CRM sync via webhook",
        budget: 35000,
        currency: "INR",
        isTest: true
      })
    });
    const bodyLead = await resLead.json();
    assert.strictEqual(resLead.status, 201);
    assert.strictEqual(bodyLead.success, true);
    assert.strictEqual(bodyLead.lead.status, "QUALIFIED");
    console.log("✔ PASS: POST /api/acquisition/leads processed lead into QUALIFIED state");

    console.log("\n🦅 ALL 9 MILESTONE 27 ACQUISITION ENGINE TEST CASES PASSED CLEANLY!");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Acquisition Engine test failure:", err);
  process.exit(1);
});
