/**
 * GARUDA FOUNDER INTELLIGENCE — FULL-CHAIN INTEGRATION E2E (FINAL PRODUCT §23E)
 *
 * Chain under test (HTTP, founder-gated, real services):
 *   analyze → price → negotiation → proposal draft → proposal fetch → PDF export
 *   → client memory (statement + chain record) → learning event → meeting split
 *
 * Anti-pollution guarantees (self-cleaning):
 *   - data/proposals.json restored byte-exact in finally (test creates + deletes).
 *   - data/creative-assets.jsonl restored byte-exact; new PDF artifacts unlinked.
 *   - memory / audit / learning files redirected to os.tmpdir() and deleted.
 *
 * Run: node src/services/founderIntelligence/founderIntelligenceIntegration.test.js
 */

const assert = require("assert");
const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");

// ---- env isolation (BEFORE any service require) ----
const TEST_FOUNDER_KEY = "fi_integration_test_key_2026";
process.env.FOUNDER_ADMIN_KEY = TEST_FOUNDER_KEY;
process.env.NODE_ENV = "test"; // suppress telegram side effects in persistent services
const AUDIT_FILE = path.join(os.tmpdir(), `fi-int-audit-${process.pid}.jsonl`);
process.env.GARUDA_FI_AUDIT_FILE = AUDIT_FILE;
delete process.env.GARUDA_FI_AUDIT; // audit ON
const MEMORY_FILE = path.join(os.tmpdir(), `fi-int-memory-${process.pid}.jsonl`);
process.env.GARUDA_FOUNDER_MEMORY_FILE = MEMORY_FILE;
const LEARNING_FILE = path.join(os.tmpdir(), `fi-int-learning-${process.pid}.jsonl`);
process.env.GARUDA_FI_LEARNING_FILE = LEARNING_FILE;

const DATA_DIR = path.join(__dirname, "..", "..", "..", "data");
const PROPOSALS_FILE = path.join(DATA_DIR, "proposals.json");
const ASSETS_INDEX = path.join(DATA_DIR, "creative-assets.jsonl");
const ASSETS_DIR = path.join(DATA_DIR, "creative-assets");

const founderIntelligenceRoutes = require("../../routes/founderIntelligenceRoutes");

function safeRead(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return null; }
}
function listAssets() {
  try { return new Set(fs.readdirSync(ASSETS_DIR)); } catch { return new Set(); }
}
function cleanupFile(file) {
  try { if (file !== null && fs.existsSync(file)) fs.unlinkSync(file); } catch { /* best-effort */ }
}

async function runIntegrationTests() {
  console.log("🔗 GARUDA Founder Intelligence — Full-Chain Integration E2E\n");

  // ---- snapshots for byte-exact restore ----
  const proposalsSnap = safeRead(PROPOSALS_FILE);
  const assetsIndexSnap = safeRead(ASSETS_INDEX);
  const assetsBefore = listAssets();

  const app = express();
  app.use(express.json());
  app.use("/api/founder-intelligence", founderIntelligenceRoutes);
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api/founder-intelligence`;
  const H = { "Content-Type": "application/json", "x-founder-key": TEST_FOUNDER_KEY };
  const call = (method, url, body) =>
    fetch(`${base}${url}`, { method, headers: H, ...(body ? { body: JSON.stringify(body) } : {}) });
  const unwrap = (res) => res.json().then((j) => j.data !== undefined ? j.data : j);

  try {
    // ---- 1. ANALYZE: electronics installment scenario (§24 style) ----
    const anaRes = await call("POST", "/analysis", {
      text: "Hum electronics installment par dete hain. Customer tracking, due reminders, receipts aur owner dashboard chahiye. ~250 customers, 4 staff, manual register se kaam ho raha hai.",
    });
    assert.strictEqual(anaRes.status, 200, "analyze 200");
    const ana = await unwrap(anaRes);
    assert.strictEqual(ana.intent, "analyze", "intent analyze");
    const A = ana.result.analysis;
    assert.strictEqual(Object.keys(A).length, 15, "15 analysis fields");
    assert.strictEqual(A.business.label, "VERIFIED", "business VERIFIED");
    assert.strictEqual(A.requestedFeatures.label, "VERIFIED", "features VERIFIED");
    assert.strictEqual(A.technicalComplexity.label, "ESTIMATE", "complexity ESTIMATE");
    assert.ok(ana.panel && ana.panel.recommendation, "panel present");
    assert.ok(Array.isArray(ana.nextQuestions) && ana.nextQuestions.length >= 1, "next questions suggested");
    assert.strictEqual(typeof ana.confidence.score, "number", "confidence score computed");
    console.log("  ✔ CHAIN 1/8: analyze → 15-field labeled analysis + panel + confidence");

    // ---- 2. PRICE: deterministic quote with derived blocks ----
    const quoteRes = await call("POST", "/pricing", { serviceType: "business_automation", complexity: "standard" });
    assert.strictEqual(quoteRes.status, 200, "pricing 200");
    const quote = await unwrap(quoteRes);
    assert.ok(quote.quote && quote.quote.minINR > 0, "quote band present");
    const d = quote.derived;
    assert.strictEqual(d.founderFloor.label, "UNKNOWN", "founderFloor UNKNOWN by default");
    assert.strictEqual(d.founderFloor.valueINR, null, "founderFloor null (never list price)");
    assert.strictEqual(d.thirdPartyCosts.label, "UNKNOWN", "thirdPartyCosts UNKNOWN default");
    assert.strictEqual(d.recurring.label, "UNKNOWN", "recurring UNKNOWN for one-shot");
    assert.ok(d.recommendedQuote && d.recommendedQuote.valueINR > 0, "recommended quote present");
    assert.ok(Array.isArray(d.assumptions) && d.assumptions.length >= 1, "assumptions documented");
    const quote2 = await unwrap(await call("POST", "/pricing", { serviceType: "business_automation", complexity: "standard" }));
    assert.strictEqual(quote.quote.minINR, quote2.quote.minINR, "same input → same price");
    assert.strictEqual(quote.derived.recommendedQuote.valueINR, quote2.derived.recommendedQuote.valueINR, "recommendation deterministic");
    console.log("  ✔ CHAIN 2/8: price → deterministic band + UNKNOWN-floor + assumptions");

    // ---- 3. NEGOTIATION: no invented probability, verbatim budget ----
    const negRes = await call("POST", "/negotiation", {
      serviceType: "business_automation",
      customerStatements: [{ text: "Budget 60k tak ho sakta hai" }],
      founderAssumptions: ["Target margin 35% — internal"],
    });
    assert.strictEqual(negRes.status, 200, "negotiation 200");
    const neg = await unwrap(negRes);
    assert.strictEqual(neg.success, true, "negotiation success");
    assert.ok(neg.closeProbability, "closeProbability present (measured or UNKNOWN)");
    assert.strictEqual(typeof neg.closeProbability.measured, "boolean", "probability carries measured flag");
    if (neg.closeProbability.measured !== true) {
      assert.strictEqual(neg.closeProbability.winRate, undefined, "unmeasured probability never invented");
      assert.strictEqual(neg.closeProbability.label, "UNKNOWN", "unmeasured → UNKNOWN");
    }
    assert.ok(neg.privateGuidance, "founder private guidance present");
    assert.ok(neg.guardrails && neg.guardrails.rule, "guardrails rule pinned");
    const negSer = JSON.stringify(neg);
    assert.ok(!/NaN|Infinity/.test(negSer), "no NaN/Infinity in negotiation");
    console.log("  ✔ CHAIN 3/8: negotiation → advice with no invented probability");

    // ---- 4. PROPOSAL DRAFT (mirror into persistent store, cleaned in finally) ----
    const draftRes = await call("POST", "/proposal/draft", {
      title: "INTEGRATION-E2E Proposal (self-deleted)",
      requirements: "Electronics installment tracking: customer records, due reminders, receipts, owner dashboard.",
      serviceType: "business_automation",
      complexity: "standard",
      scope: { pages: 5, features: 6 },
    });
    assert.strictEqual(draftRes.status, 201, "draft created (201)");
    const draft = await unwrap(draftRes);
    assert.strictEqual(draft.created, true, "created flag");
    const proposalId = draft.proposalId || draft.proposal?.id || draft.proposal?.proposalId;
    assert.ok(proposalId, `proposalId present (got keys: ${Object.keys(draft).join(",")})`);
    assert.ok(draft.validation, "validation present");
    assert.deepStrictEqual(draft.validation.issues || [], [], "zero validation issues (anti-fabrication)");
    assert.ok(draft.proposedAmountINR > 0, "amount comes from pricing engine (not user-invented)");
    assert.strictEqual(draft.persistentMirror?.mirrored, true, "mirrored into persistentProposalService");

    // ---- 5. PROPOSAL FETCH ----
    const getP = await unwrap(await call("GET", `/proposal/${proposalId}`));
    assert.strictEqual(getP.success, true, "proposal fetchable");
    assert.strictEqual(getP.proposal.proposalId, proposalId, "fetched id matches");
    assert.ok(String(getP.proposal.project?.title || "").includes("INTEGRATION-E2E"), "fetch returns same proposal title");

    // ---- 6. PDF EXPORT (artifact cleanup via asset diff in finally) ----
    const pdfRes = await call("POST", `/proposal/${proposalId}/pdf`, {});
    assert.strictEqual(pdfRes.status, 200, "pdf 200");
    const pdf = await unwrap(pdfRes);
    assert.strictEqual(pdf.success, true, "pdf generated");
    assert.ok(pdf.artifact, "artifact returned");
    assert.strictEqual(pdf.label, "VERIFIED", "pdf label VERIFIED");
    console.log("  ✔ CHAIN 4/6: proposal draft → validate → mirror → fetch → PDF artifact");

    // ---- 7. CLIENT MEMORY: create + statement + chain record + views ----
    const memC = await call("POST", "/memory/clients", { name: "Integration Client", industry: "Electronics Retail" });
    assert.strictEqual(memC.status, 201, "client created");
    const memCData = await unwrap(memC);
    const clientId = memCData.client?.clientId || memCData.client?.id;
    assert.ok(clientId, "clientId returned");
    const st = await call("POST", `/memory/clients/${clientId}/statements`, {
      text: "Hum installment par electronics bechte hain, reminders manual hote hain",
    });
    assert.strictEqual(st.status, 200, "statement recorded");
    const rec = await call("POST", `/memory/clients/${clientId}/records`, {
      type: "quote",
      data: { amountINR: 65000, label: "PARTIAL" },
    });
    assert.strictEqual(rec.status, 200, "chain record recorded");
    const recData = await unwrap(rec);
    assert.strictEqual(recData.type, "quote", "record type echoed");
    const badRec = await call("POST", `/memory/clients/${clientId}/records`, { type: "executive_summary", data: {} });
    assert.strictEqual(badRec.status, 422, "non-whitelisted record type rejected");
    const founderView = await unwrap(await call("GET", `/memory/clients/${clientId}`));
    assert.ok(founderView.success, "founder view ok");
    assert.ok(founderView.privateFieldsPresent.includes("privateNotes"), "founder view declares private fields");
    assert.strictEqual((founderView.client?.quotes || []).length, 1, "quote chain record persisted into quotes field");
    const listRes = await unwrap(await call("GET", "/memory/clients"));
    const listed = (listRes.clients || []).find((cl) => cl.clientId === clientId);
    assert.ok(listed && listed.chainCounts, "listClients exposes derived chainCounts");
    const custView = await unwrap(await call("GET", `/memory/clients/${clientId}/customer-view`));
    const custSer = JSON.stringify(custView);
    assert.ok(!/floor|margin|private|negotiat|assumption/i.test(custSer), "customer view leak-free");
    console.log("  ✔ CHAIN 7/8: memory → statement + whitelist chain record + leak-free views");

    // ---- 8. LEARNING LOOP + MEETING SPLIT ----
    const lrn = await call("POST", "/learning/events", {
      stage: "QUOTED",
      proposalId,
      quotedINR: 65000,
      serviceType: "business_automation",
    });
    assert.strictEqual(lrn.status, 201, "learning event recorded");
    const lrnData = await unwrap(lrn);
    assert.ok(lrnData.policy.includes("NEVER auto-modified"), "learning policy pinned");
    const summary = await unwrap(await call("GET", "/learning/summary"));
    assert.ok(summary.byStage.QUOTED >= 1, "summary counts the event");

    const sess = await unwrap(await call("POST", "/meeting/start", { topic: "integration chain meeting" }));
    const sid = sess.sessionId;
    assert.ok(sid, "meeting session created");
    const split = await (await call("POST", `/meeting/${sid}/split`, {
      text: "kitna lagega",
      serviceType: "business_automation",
      founderAssumptions: ["Internal floor note — 45000"],
      customerStatements: [{ quote: "Price zyada hai" }],
    })).json();
    assert.ok(split.customerView && split.founderPrivate, "split two structures");
    const custSplitSer = JSON.stringify(split.customerView);
    const privSplitSer = JSON.stringify(split.founderPrivate);
    assert.ok(!/floor|margin|private|negotiat|assumption|probability/i.test(custSplitSer), "customer split leak-free");
    assert.ok(privSplitSer.includes("Internal floor note"), "assumption only in private");
    console.log("  ✔ CHAIN 8/8: learning event + summary + meeting split leak-free");

    console.log("\nINTEGRATION E2E PASSED: analyze→price→negotiate→proposal→PDF→memory→learning→meeting all green.");
  } finally {
    server.close();
    // ---- byte-exact restore / cleanup ----
    if (proposalsSnap !== null) { try { fs.writeFileSync(PROPOSALS_FILE, proposalsSnap, "utf8"); } catch { /* best-effort */ } }
    if (assetsIndexSnap !== null) { try { fs.writeFileSync(ASSETS_INDEX, assetsIndexSnap, "utf8"); } catch { /* best-effort */ } }
    const assetsAfter = listAssets();
    for (const name of assetsAfter) {
      if (!assetsBefore.has(name)) cleanupFile(path.join(ASSETS_DIR, name));
    }
    cleanupFile(AUDIT_FILE);
    cleanupFile(MEMORY_FILE);
    cleanupFile(LEARNING_FILE);
  }
}

if (require.main === module) {
  runIntegrationTests().then(() => process.exit(0)).catch((err) => {
    console.error("\n✖ INTEGRATION E2E FAILED:", err.message);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };
