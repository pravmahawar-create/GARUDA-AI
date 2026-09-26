/**
 * GARUDA FOUNDER INTELLIGENCE — UNIT TESTS (Phase 11)
 *
 * Covers: evidence labels · pricing determinism + staleness + UNKNOWN ·
 * calculator math · client-memory adapter boundary + allowlist views ·
 * negotiation verbatim-budget handling · meeting leak detector.
 *
 * Run: node src/services/founderIntelligence/founderIntelligenceUnit.test.js
 */

const assert = require("assert");
const os = require("os");
const path = require("path");
const fs = require("fs");

process.env.GARUDA_FI_AUDIT = "off";

const {
  LABELS,
  makeEvidence,
  combineLabels,
  summarizeEvidence,
  assertLabel,
} = require("./evidenceLabels");
const pricingEvidenceStore = require("./pricingEvidenceStore");
const pricingEngine = require("./pricingIntelligenceEngine");
const calculator = require("./businessCalculator");
const negotiationAdvisor = require("./negotiationAdvisor");
const meetingModeService = require("./meetingModeService");
const clientMemoryAdapter = require("./clientMemoryAdapter");
const clientMemoryService = require("./clientMemoryService");

async function runUnitTests() {
  console.log("🧪 GARUDA Founder Intelligence — Unit Test Suite\n");

  // ---------- Evidence labels ----------
  assert.strictEqual(assertLabel("VERIFIED"), "VERIFIED");
  assert.throws(() => assertLabel("MADE_UP"), /INVALID_EVIDENCE_LABEL/);
  assert.throws(
    () => makeEvidence({ field: "x", label: "VERIFIED", source: null }),
    /EVIDENCE_SOURCE_REQUIRED/
  );
  assert.strictEqual(combineLabels([]), LABELS.UNKNOWN);
  assert.strictEqual(combineLabels(["VERIFIED", "UNKNOWN"]), LABELS.PARTIAL, "unknown+verified → PARTIAL");
  assert.strictEqual(combineLabels(["UNKNOWN", "UNKNOWN"]), LABELS.UNKNOWN, "unknown-only → UNKNOWN");
  assert.strictEqual(combineLabels(["VERIFIED", "ESTIMATE"]), LABELS.VERIFIED);
  assert.strictEqual(combineLabels(["CONTRADICTED", "VERIFIED"]), LABELS.CONTRADICTED);
  assert.strictEqual(combineLabels(["ESTIMATE"]), LABELS.ESTIMATE);
  const sum = summarizeEvidence([
    makeEvidence({ field: "a", label: "VERIFIED", source: { type: "url", ref: "u", retrievedAt: "2026-09-26" } }),
    { field: "b", label: "UNKNOWN", source: null, value: null, note: null },
  ]);
  assert.strictEqual(sum.label, LABELS.PARTIAL);
  assert.deepStrictEqual(sum.unknownFields, ["b"]);
  console.log("  ✔ PASS: evidence labels — validation, combination semantics, summary");

  // ---------- Pricing evidence store: staleness detectable ----------
  const fresh = pricingEvidenceStore.getSnapshotStatus({ nowMs: Date.parse("2026-09-26T00:00:00Z") });
  assert.strictEqual(fresh.live.freshness.isStale, false, "snapshot fresh on retrieval date");
  const stale = pricingEvidenceStore.getSnapshotStatus({ nowMs: Date.parse("2026-11-15T00:00:00Z") });
  assert.strictEqual(stale.live.freshness.isStale, true, "snapshot STALE after 30 days");
  assert.ok(stale.live.freshness.ageDays > 30, "age days computed");
  assert.ok(stale.reverifyAction.includes("garudaos.in/pricing"), "re-verification action documented");
  console.log("  ✔ PASS: pricing snapshot staleness detectable + re-verify action");

  // ---------- Pricing engine: determinism + stale warning ----------
  const a = pricingEngine.quote({ serviceType: "custom_ai" });
  const b = pricingEngine.quote({ serviceType: "custom_ai" });
  assert.deepStrictEqual(a.quote, b.quote, "same input → identical quote");
  const staleQ = pricingEngine.quote({ serviceType: "custom_ai" }, { nowMs: Date.parse("2026-12-01T00:00:00Z") });
  assert.ok(staleQ.warnings.includes("PRICE_SNAPSHOT_STALE"), "stale snapshot warns");
  assert.ok(staleQ.evidence.some((e) => e.note === "STALE_SNAPSHOT"), "stale evidence marked");
  assert.strictEqual(staleQ.label, LABELS.PARTIAL, "stale → no full VERIFIED claim");

  // UNKNOWN path: unsupported service
  const bad = pricingEngine.quote({ serviceType: "quantum laser refinery" });
  assert.strictEqual(bad.label, LABELS.UNKNOWN, "unknown service → UNKNOWN");
  assert.strictEqual(bad.quote, null, "no quote invented");

  // subscription range
  const sub = pricingEngine.quote({ serviceType: "saas_subscription" });
  assert.strictEqual(sub.label, LABELS.VERIFIED);
  assert.strictEqual(sub.quote.minINR, 0);
  assert.strictEqual(sub.quote.maxINR, 19999);
  console.log("  ✔ PASS: pricing engine — deterministic, stale-warn, UNKNOWN, subscription range");

  // ---------- Calculators ----------
  const m = calculator.margin({ revenueINR: 100000, costINR: 60000 });
  assert.strictEqual(m.grossProfitINR, 40000);
  assert.strictEqual(m.marginPct, 40);
  const mBad = calculator.margin({ revenueINR: 100000 });
  assert.strictEqual(mBad.success, false);
  assert.strictEqual(mBad.label, LABELS.UNKNOWN, "missing cost → UNKNOWN, not guessed");
  const d = calculator.discountImpact({ listINR: 50000, discountPct: 10 });
  assert.strictEqual(d.finalINR, 45000);
  assert.strictEqual(calculator.discountImpact({ listINR: 100, discountPct: 150 }).success, false, "out-of-range discount rejected");
  const ms = calculator.milestoneSplit({ totalINR: 50000 });
  assert.strictEqual(ms.depositINR, 25000);
  assert.strictEqual(ms.governanceLabel, LABELS.VERIFIED, "50% = verified governance");
  const msCustom = calculator.milestoneSplit({ totalINR: 50000, depositPct: 30 });
  assert.strictEqual(msCustom.governanceLabel, LABELS.FOUNDER_JUDGMENT, "non-standard split = founder decision");
  const be = calculator.breakEven({ fixedCostINR: 50000, unitPriceINR: 5000, unitCostINR: 2500 });
  assert.strictEqual(be.breakEvenUnits, 20);
  assert.strictEqual(calculator.breakEven({ fixedCostINR: 10, unitPriceINR: 5, unitCostINR: 5 }).success, false, "non-positive contribution rejected");
  console.log("  ✔ PASS: business calculator — math exact, missing inputs UNKNOWN, bounds enforced");

  // ---------- Negotiation: verbatim budget recorded, else UNKNOWN ----------
  const withBudget = negotiationAdvisor.analyze({
    customerStatements: [{ quote: "Mera budget 50000 hai" }],
  });
  const withBudgetUnknowns = withBudget.unknowns.map((u) => u.field);
  assert.ok(!withBudgetUnknowns.includes("customerBudget"), "verbatim budget → not unknown");
  assert.strictEqual(
    withBudget.evidenceClasses.verifiedCustomerStatements[0].quote,
    "Mera budget 50000 hai",
    "verbatim preserved"
  );
  const noBudget = negotiationAdvisor.analyze({ customerStatements: [{ quote: "Thoda adjust karo" }] });
  assert.ok(noBudget.unknowns.map((u) => u.field).includes("customerBudget"), "no statement → budget UNKNOWN");
  assert.strictEqual(noBudget.closeProbability.label, LABELS.UNKNOWN, "no invented probability");
  // measured probability path via injected tracker
  const measured = negotiationAdvisor.analyze(
    { customerStatements: [] },
    { dealTracker: { getEmpiricalProbability: () => ({ measured: true, winRate: 42, winRateLabel: "42% (n=10)" }) } }
  );
  assert.strictEqual(measured.closeProbability.label, LABELS.VERIFIED, "measured stats → VERIFIED");
  assert.ok(measured.closeProbability.sampleNote.includes("not a prediction"), "labeled as fact not prediction");
  console.log("  ✔ PASS: negotiation — verbatim budget vs UNKNOWN, probability never invented");

  // ---------- Meeting leak detector ----------
  meetingModeService._resetSessions();
  const sess = meetingModeService.startSession({ topic: "unit" });
  const splitOk = meetingModeService.buildSplitResponse(sess.sessionId, {
    public: { publicAnswer: "List price ₹45,000 se start" },
    private: { internalFloor: 45000, privateGuidance: [{ guidance: "floor rakhna" }] },
  });
  assert.strictEqual(splitOk.success, true);
  assert.strictEqual(splitOk.customerView.internalFloor, undefined, "floor key absent in customerView");
  assert.strictEqual(splitOk.founderPrivate.internalFloor, 45000, "floor present privately");
  assert.throws(() => meetingModeService.assertNoPrivateLeak({ marginNote: "40%" }), /MEETING_PRIVATE_LEAK/);
  const noSession = meetingModeService.buildSplitResponse("nonexistent_session", {});
  assert.strictEqual(noSession.success, false, "unknown session rejected, no split built");
  assert.strictEqual(noSession.reason, "SESSION_NOT_FOUND");
  console.log("  ✔ PASS: meeting split allowlist + leak detector throws on violation");

  // ---------- Client memory: adapter boundary + allowlist ----------
  const tmpFile = path.join(os.tmpdir(), `fi-unit-mem-${process.pid}.jsonl`);
  const jsonlAdapter = new clientMemoryAdapter.JsonlClientMemoryAdapter({ filePath: tmpFile });
  // interface conformance (adapter contract)
  for (const method of ["append", "update", "findById", "listByClient", "listAll", "search"]) {
    assert.strictEqual(typeof jsonlAdapter[method], "function", `adapter implements ${method}`);
  }
  assert.ok(jsonlAdapter instanceof clientMemoryAdapter.ClientMemoryAdapter, "instanceof base adapter");
  clientMemoryService.setAdapter(jsonlAdapter);

  await clientMemoryService.createClientProfile({ name: "Unit Client", industry: "Testing", goals: ["goal-a"] });
  await clientMemoryService.recordClientStatement({
    clientId: "cli_unit_client",
    text: "Customer ko discount pasand hai",
    type: "negotiation_note", // private type
  });
  await clientMemoryService.recordClientStatement({
    clientId: "cli_unit_client",
    text: "Delivery next month chahiye",
    type: "customer_statement",
  });

  const founderView = await clientMemoryService.getClientFounderView("cli_unit_client");
  assert.strictEqual(founderView.success, true);
  assert.strictEqual(founderView.client.privateNotes.length, 1, "private note stored for founder");

  const customerView = await clientMemoryService.getClientCustomerView("cli_unit_client");
  const custSer = JSON.stringify(customerView.client);
  assert.ok(!custSer.includes("discount pasand"), "private note ABSENT from customer view");
  assert.ok(custSer.includes("Delivery next month"), "public statement present");
  assert.ok(!("privateNotes" in customerView.client), "allowlist excludes privateNotes key");
  assert.ok(!("founderAssumptions" in customerView.client), "allowlist excludes founderAssumptions key");

  // persistence adapter actually persisted to disk
  assert.ok(fs.existsSync(tmpFile), "jsonl adapter persisted");
  const lines = fs.readFileSync(tmpFile, "utf8").trim().split("\n");
  assert.ok(lines.length >= 1, "jsonl lines written");
  JSON.parse(lines[0]); // valid JSON lines

  const recall = await clientMemoryService.recallForContext("Unit Client");
  assert.strictEqual(recall.found, true);
  assert.strictEqual(recall.label, LABELS.VERIFIED);

  // Future DB migration path: swapping adapter keeps service functional
  class FakeDbAdapter extends clientMemoryAdapter.ClientMemoryAdapter {
    constructor() { super(); this.rows = []; }
    async append(r) { const rec = { ...r, id: "db_1" }; this.rows.push(rec); return { id: "db_1", record: rec }; }
    async update(id, patch) { const i = this.rows.findIndex((x) => x.id === id); if (i < 0) return null; this.rows[i] = { ...this.rows[i], ...patch }; return { id, record: this.rows[i] }; }
    async findById(id) { return this.rows.find((x) => x.id === id) || null; }
    async listByClient(cid) { return this.rows.filter((x) => x.clientId === cid); }
    async listAll() { return [...this.rows]; }
    async search(fn) { return this.rows.filter(fn); }
  }
  clientMemoryService.setAdapter(new FakeDbAdapter());
  const dbCreated = await clientMemoryService.createClientProfile({ name: "Mongo Future Client" });
  assert.strictEqual(dbCreated.success, true, "service works with swapped adapter (no logic rewrite)");
  clientMemoryService.setAdapter(jsonlAdapter); // restore

  try { fs.unlinkSync(tmpFile); } catch { /* temp cleanup */ }
  console.log("  ✔ PASS: client memory — adapter boundary, allowlist views, disk persistence, swap-ready");

  // ---------- 8. FINAL PRODUCT: floor rule, contradiction, derived blocks, analysis ----------
  // (pricingEngine / LABELS / fs / os / path already imported at file top)
  const businessAnalysisService = require("./businessAnalysisService");
  const learningLoopService = require("./learningLoopService");

  // founderFloor: NEVER invented; UNKNOWN without verified cost/margin inputs
  const floorUnknown = pricingEngine.quote({ serviceType: "business_automation" });
  assert.strictEqual(floorUnknown.derived.founderFloor.valueINR, null, "floor null without founder inputs");
  assert.strictEqual(floorUnknown.derived.founderFloor.label, LABELS.UNKNOWN, "floor label UNKNOWN (never list price)");
  const floorDefined = pricingEngine.quote({ serviceType: "business_automation", founderCostINR: 30000, targetMarginPct: 40 });
  assert.strictEqual(floorDefined.derived.founderFloor.valueINR, 50000, "floor = cost/(1-margin) when founder-defined");
  assert.strictEqual(floorDefined.derived.founderFloor.label, LABELS.FOUNDER_JUDGMENT, "defined floor labeled FOUNDER_JUDGMENT");

  // contradiction detector (§23C)
  const c1 = pricingEngine.detectContradiction([{ kind: "fixed", amountINR: 10000 }, { kind: "fixed", amountINR: 20000 }]);
  assert.strictEqual(c1.contradicted, true, ">30% spread = contradicted");
  assert.strictEqual(c1.evidence.label, LABELS.CONTRADICTED, "contradiction evidence label");
  const c2 = pricingEngine.detectContradiction([{ kind: "fixed", amountINR: 10000 }, { kind: "fixed", amountINR: 11000 }]);
  assert.strictEqual(c2.contradicted, false, "<30% spread = not contradicted");
  const c3 = pricingEngine.detectContradiction([{ kind: "fixed", amountINR: 10000 }]);
  assert.strictEqual(c3.contradicted, false, "single anchor never contradicted");

  // derived cost blocks default UNKNOWN (never invented) / FOUNDER_JUDGMENT when supplied
  assert.strictEqual(floorUnknown.derived.thirdPartyCosts.label, LABELS.UNKNOWN, "third-party costs UNKNOWN by default");
  assert.strictEqual(floorUnknown.derived.recurring.label, LABELS.UNKNOWN, "recurring UNKNOWN for one-shot projects");
  const withCosts = pricingEngine.quote({ serviceType: "business_automation", thirdPartyCostsINR: 5000, recurringMonthlyINR: 2000 });
  assert.strictEqual(withCosts.derived.thirdPartyCosts.valueINR, 5000, "founder third-party cost accepted");
  assert.strictEqual(withCosts.derived.recurring.monthlyINR, 2000, "founder recurring accepted");
  assert.strictEqual(withCosts.derived.recurring.annualINR, 24000, "annual = monthly × 12 deterministic");

  // recommendation = band midpoint deterministic
  const rec1 = pricingEngine.quote({ serviceType: "custom_ai" });
  const rec2 = pricingEngine.quote({ serviceType: "custom_ai" });
  assert.deepStrictEqual(rec1.derived.recommendedQuote, rec2.derived.recommendedQuote, "recommended quote deterministic");
  assert.strictEqual(
    rec1.derived.recommendedQuote.valueINR,
    Math.round(Math.round((rec1.quote.minINR + rec1.quote.maxINR) / 2) / 100) * 100,
    "recommended = nearest-100 midpoint (deterministic roundINR)"
  );

  // Business analysis labels (§4): stated=VERIFIED, derived=ESTIMATE, absent=UNKNOWN
  const ana = businessAnalysisService.analyze({
    text: "Hum electronics installment par dete hain. Customer tracking, due reminders, receipts aur owner dashboard chahiye.",
  });
  assert.strictEqual(ana.analysis.business.label, LABELS.VERIFIED, "stated industry VERIFIED");
  assert.strictEqual(ana.analysis.requestedFeatures.label, LABELS.VERIFIED, "stated features VERIFIED");
  assert.strictEqual(ana.analysis.technicalComplexity.label, LABELS.ESTIMATE, "derived complexity ESTIMATE");
  assert.strictEqual(ana.analysis.timeline === undefined, true, "no timeline field invented");
  assert.ok(Array.isArray(ana.analysis.missingInformation.value), "missing information listed, never guessed");
  const anaEmpty = businessAnalysisService.analyze({ text: "hello" });
  assert.strictEqual(anaEmpty.analysis.requestedFeatures.label, LABELS.UNKNOWN, "absent features UNKNOWN (never guessed)");
  assert.ok(ana.fieldCount === 15, "all 15 analysis fields present");

  // Learning loop: validated stages + policy (tmp file, cleaned up)
  const lrnFile = path.join(os.tmpdir(), `fi-unit-lrn-${process.pid}.jsonl`);
  const prevLrn = process.env.GARUDA_FI_LEARNING_FILE;
  process.env.GARUDA_FI_LEARNING_FILE = lrnFile;
  const lrnBad = learningLoopService.recordEvent({ stage: "WON" });
  assert.strictEqual(lrnBad.success, false, "WON without proposalId rejected");
  const lrnOk = learningLoopService.recordEvent({ stage: "QUOTED", proposalId: "prop_unit_x", quotedINR: 45000 });
  assert.strictEqual(lrnOk.success, true, "valid stage accepted");
  assert.ok(lrnOk.policy.includes("NEVER auto-modified"), "policy pinned in every event");
  const lrnSum = learningLoopService.summarize();
  assert.strictEqual(lrnSum.byStage.QUOTED, 1, "summary counts stages");
  if (prevLrn === undefined) delete process.env.GARUDA_FI_LEARNING_FILE;
  else process.env.GARUDA_FI_LEARNING_FILE = prevLrn;
  try { fs.unlinkSync(lrnFile); } catch { /* temp cleanup */ }

  console.log("  ✔ PASS: final product — floor UNKNOWN rule, contradiction, derived blocks, 15-field analysis, learning loop");

  console.log("\nUNIT SUITE PASSED: all modules green.");
}

if (require.main === module) {
  runUnitTests().catch((err) => {
    console.error("\n✖ UNIT SUITE FAILED:", err.message);
    process.exit(1);
  });
}

module.exports = { runUnitTests };
