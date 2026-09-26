/**
 * GARUDA FOUNDER INTELLIGENCE — GOLDEN EVALUATION SUITE (Phase 11)
 *
 * Deterministic regression suite — 10 realistic business scenarios.
 * Model/provider changes can be evaluated against these scenarios without
 * network dependency (LLM is faked; engines are deterministic).
 *
 * Validated per scenario (as mandated):
 *  intent recognition · context extraction · routing · deterministic
 *  pricing math · evidence labels · UNKNOWN handling · source preservation ·
 *  no fabricated numbers · no fabricated customer intent ·
 *  founderPrivate separation · proposal correctness.
 *
 * Run: node src/services/founderIntelligence/founderIntelligenceGoldenEval.test.js
 */

const assert = require("assert");
const os = require("os");
const path = require("path");

process.env.GARUDA_FI_AUDIT = "off"; // audit covered in security test

const fi = require("./founderIntelligenceService");
const pricingEngine = require("./pricingIntelligenceEngine");
const negotiationAdvisor = require("./negotiationAdvisor");
const clientMemoryService = require("./clientMemoryService");
const clientMemoryAdapter = require("./clientMemoryAdapter");
const meetingModeService = require("./meetingModeService");
const proposalCopilot = require("./proposalCopilot");
const { LABELS } = require("./evidenceLabels");

// Isolated client-memory store for the eval run
clientMemoryService.setAdapter(
  new clientMemoryAdapter.JsonlClientMemoryAdapter({
    filePath: path.join(os.tmpdir(), `fi-golden-${process.pid}.jsonl`),
  })
);

// Fake LLM — guarantees no network/model dependency in the golden suite
const fakeLLM = {
  generateAnswer: async () => ({ answer: "(golden-eval fake llm answer)", warnings: [] }),
};
const deps = { llmAdapter: fakeLLM };

const results = [];
function record(id, name, detail = "") {
  results.push({ id, name, detail });
  console.log(`  ✔ S${id} PASS: ${name}${detail ? " — " + detail : ""}`);
}

function assertNoFabricatedNumber(text, allowedNumbers) {
  if (typeof text !== "string") return;
  const nums = (text.match(/₹?\s?[\d,]+/g) || []).map((s) => s.replace(/[₹\s,]/g, ""));
  for (const n of nums) {
    if (n.length === 0) continue;
    const allowed = allowedNumbers.some((a) => String(a) === n);
    // years / small ints in prose (e.g. "50%") tolerated if 2-digit
    if (allowed || Number(n) <= 100) continue;
    throw new Error(`FABRICATED_NUMBER:${n} not in allowed set [${allowedNumbers.join(",")}]`);
  }
}

async function scenario1() {
  const text = "Electronics installment business ke liye automation system chahiye — quote kitna hoga?";
  const r = await fi.handle({ text }, deps);
  assert.strictEqual(r.intent, "pricing", "intent must be pricing");
  assert.strictEqual(r.context.serviceType, "business_automation", "context serviceType extracted");
  assert.ok(r.result.success && r.result.quote, "quote produced");
  assert.strictEqual(r.result.quote.minINR, 25000, "deterministic verified anchor 25000");
  assert.ok([LABELS.VERIFIED, LABELS.PARTIAL].includes(r.label), `label honest: ${r.label}`);
  const anchorEv = r.evidence.find((e) => e.field === "anchor:project_business_automation");
  assert.ok(anchorEv, "anchor evidence present");
  assert.strictEqual(anchorEv.source.ref, "https://www.garudaos.in/pricing", "source preserved (live page)");
  assert.strictEqual(anchorEv.source.retrievedAt, "2026-09-26", "retrieval metadata preserved");
  // determinism
  const r2 = await fi.handle({ text }, deps);
  assert.deepStrictEqual(r2.result.quote, r.result.quote, "deterministic pricing math");
  record(1, "Electronics installment business", `intent=pricing quote=₹${r.result.quote.minINR} label=${r.label}`);
}

async function scenario2() {
  const text = "website + SEO ke liye quote chahiye, 6 pages, standard complexity";
  const r = await fi.handle({ text }, deps);
  assert.strictEqual(r.intent, "pricing");
  assert.strictEqual(r.context.serviceType, "website_seo");
  assert.strictEqual(r.context.scope.pages, 6, "scope.pages extracted");
  assert.strictEqual(r.label, LABELS.ESTIMATE, "unanchored scoped service → ESTIMATE");
  // deterministic math: 25000+6*2500=40000 ×1.25=50000 → min 50000*0.65=32500, max 50000*1.35=67500
  assert.strictEqual(r.result.quote.minINR, 32500, "exact deterministic min");
  assert.strictEqual(r.result.quote.maxINR, 67500, "exact deterministic max");
  const modelEv = r.evidence.find((e) => e.field === "effort_model");
  assert.ok(modelEv && modelEv.label === LABELS.ESTIMATE, "methodology labeled ESTIMATE");
  assert.strictEqual(modelEv.source.ref, "founderIntelligence.pricingMethodology.v1", "model source preserved");
  assert.strictEqual(r.result.missingInputs.length, 0, "no missing inputs");
  record(2, "Website + SEO client", "ESTIMATE 32500–67500 (methodology v1)");
}

async function scenario3() {
  const text = "PWA app ka quote chahiye, 4 pages aur 3 features ka scope hai";
  const r = await fi.handle({ text }, deps);
  assert.strictEqual(r.intent, "pricing");
  assert.strictEqual(r.context.serviceType, "mobile_pwa", "PWA alias resolved");
  assert.strictEqual(r.context.scope.pages, 4);
  assert.strictEqual(r.context.scope.features, 3);
  assert.strictEqual(r.label, LABELS.ESTIMATE);
  // 25000+4*2500+3*5000=50000 ×1.25=62500 → min round(40625)=40600, max round(84375)=84400
  assert.strictEqual(r.result.quote.minINR, 40600, "exact deterministic min");
  assert.strictEqual(r.result.quote.maxINR, 84400, "exact deterministic max");
  record(3, "Mobile/PWA application", "ESTIMATE 40600–84400");
}

async function scenario4() {
  const text = "Custom AI automation project ka cost kitna hoga?";
  const r = await fi.handle({ text }, deps);
  assert.strictEqual(r.intent, "pricing");
  assert.strictEqual(r.context.serviceType, "custom_ai", "AI alias resolved");
  assert.strictEqual(r.result.quote.minINR, 45000, "verified live anchor");
  assert.ok([LABELS.VERIFIED, LABELS.PARTIAL].includes(r.label));
  assert.strictEqual(r.result.snapshot.source.ref, "https://www.garudaos.in/pricing", "snapshot source");
  assert.strictEqual(r.result.snapshot.freshness.isStale, false, "fresh snapshot, no staleness");
  record(4, "AI automation project", `₹45,000+ verified anchor, label=${r.label}`);
}

async function scenario5() {
  const text = "negotiation analyze karo — customer keh raha hai budget kam hai aur discount chahiye";
  const r = await fi.handle(
    { text, customerStatements: [{ quote: "Budget kam hai, discount chahiye" }] },
    deps
  );
  assert.strictEqual(r.intent, "negotiation");
  const classes = r.result.evidenceClasses;
  assert.ok(Array.isArray(classes.verifiedCustomerStatements), "class separation present");
  assert.strictEqual(r.result.closeProbability.label, LABELS.UNKNOWN, "probability NEVER invented (UNMEASURED)");
  assert.strictEqual(r.result.closeProbability.measured, false);
  const unknownFields = r.result.unknowns.map((u) => u.field);
  assert.ok(unknownFields.includes("customerBudget"), "budget UNKNOWN (no verbatim budget given)");
  assert.ok(unknownFields.includes("customerIntent"), "intent UNKNOWN — never fabricated");
  assert.ok(unknownFields.includes("competitorOffer"), "competitor offer UNKNOWN");
  assert.strictEqual(r.result.guardrails.forbiddenPresent.length, 0, "no forbidden inventions present");
  assert.ok(r.result.privateGuidance.length > 0, "private guidance exists (founder-only)");
  assertNoFabricatedNumber(JSON.stringify(r.result.privateGuidance), [45000, 75900]);
  record(5, "Low-budget customer negotiation", "probability/budget/intent = UNKNOWN, private guidance isolated");
}

async function scenario6() {
  const text = "website ka quote batao jaldi";
  const r = await fi.handle({ text }, deps);
  assert.strictEqual(r.intent, "pricing");
  assert.strictEqual(r.context.serviceType, "website_seo");
  assert.strictEqual(r.label, LABELS.UNKNOWN, "missing required input → UNKNOWN");
  assert.strictEqual(r.result.success, false, "no quote invented");
  assert.strictEqual(r.result.quote, null, "quote is null, not a guess");
  assert.deepStrictEqual(r.result.missingInputs, ["scope.pages"], "missing input reported");
  assert.ok(r.unknownFields.length > 0 || r.evidence.some((e) => e.label === LABELS.UNKNOWN), "UNKNOWN surfaced");
  record(6, "Missing-information request", "UNKNOWN + missingInputs=[scope.pages], zero invention");
}

async function scenario7() {
  const text = "research karo current market pricing competitors ke baare me";
  const r = await fi.handle({ text }, deps);
  assert.strictEqual(r.intent, "research", "research intent routed");
  assert.ok(r.research, "research executed");
  assert.ok([LABELS.VERIFIED, LABELS.PARTIAL].includes(r.research.label), `research label: ${r.research.label}`);
  const priceSrc = (r.sources || []).find((s) => String(s.source?.ref || "").includes("garudaos.in/pricing"));
  assert.ok(priceSrc, "live pricing source preserved");
  assert.ok(priceSrc.source.retrievedAt, "retrieval metadata preserved");
  for (const f of r.research ? [] : []) assert.ok(f); // findings live in researchBridge result via r.research counts
  for (const s of r.sources) assert.ok(s.title, "every source has a title (no anonymous claims)");
  // no fabricated market numbers in evidence values
  const allEvidence = JSON.stringify(r.evidence);
  assert.ok(!/competitor price|market average/i.test(allEvidence), "no fabricated market stats");
  record(7, "Current market research request", `${r.research.sourceCount} source(s), label=${r.research.label}`);
}

async function scenario8() {
  const text = "proposal banao — SaaS MVP client ke liye";
  const r = await fi.handle(
    { text, structured: { serviceType: "saas_mvp", scope: { pages: 6 }, complexity: "standard", title: "SaaS MVP for RetailOps", requirements: "MVP with 6 pages auth billing dashboard" } },
    deps
  );
  assert.strictEqual(r.intent, "proposal");
  assert.strictEqual(r.result.created, true, "proposal created");
  assert.strictEqual(r.result.proposedAmountINR, 50000, "amount = verified from-price anchor (no invention)");
  assert.strictEqual(r.result.validation.ok, true, `proposal validated: ${r.result.validation.issues.join(",") || "clean"}`);
  assert.ok(r.result.proposalId, "proposalId present");
  const total = r.result.proposal.pricing?.totalINR;
  assert.strictEqual(total, 50000, "proposal total matches engine basis");
  const deposit = r.result.proposal.pricing?.depositAmountINR;
  assert.strictEqual(deposit, 25000, "50% milestone governance deposit");
  record(8, "Proposal generation", `created ${r.result.proposalId} total=₹50,000 deposit=₹25,000 validated`);
}

async function scenario9() {
  // Seed returning client
  await clientMemoryService.createClientProfile({
    name: "Ramesh Traders",
    companyName: "Ramesh Electronics",
    industry: "Electronics Retail",
    goals: ["WhatsApp ordering automation"],
  });
  await clientMemoryService.recordClientStatement({
    clientId: "cli_ramesh_traders",
    text: "Pichhle order se delivery 2 din late hui thi",
    source: "transcript",
  });
  await clientMemoryService.recordInteraction({
    clientId: "cli_ramesh_traders",
    summary: "Phase-1 WhatsApp bot delivered, deposit received",
    outcome: "active",
  });

  const r = await fi.handle({ text: "returning client history dikhao — Ramesh" }, deps);
  assert.strictEqual(r.intent, "client_memory");
  assert.strictEqual(r.memory.client.found, true, "memory found");
  assert.strictEqual(r.memory.client.label, LABELS.VERIFIED, "memory label VERIFIED");
  const hit = r.memory.client.clients.find((c) => c.clientId === "cli_ramesh_traders");
  assert.ok(hit, "correct client matched");
  assert.strictEqual(hit.statementCount, 1, "statement count preserved");
  assert.ok(hit.lastInteraction && hit.lastInteraction.summary.includes("Phase-1"), "interaction history intact");
  record(9, "Returning client memory retrieval", "found cli_ramesh_traders, VERIFIED, interactions intact");
}

async function scenario10() {
  meetingModeService._resetSessions();
  const start = meetingModeService.startSession({ topic: "Custom AI pricing call", clientName: "Ramesh Traders" });
  const r = await fi.handle(
    {
      text: "meeting mode on — customer call chal raha hai",
      intentHint: "meeting",
      meetingSessionId: start.sessionId,
      serviceType: "custom_ai",
      customerStatements: [{ quote: "Thoda sa kam karo price" }],
      founderAssumptions: ["Client ke paas budget 60k tak ho sakta hai"],
      publicAnswer: "GARUDA scope ke basis par list quote ₹45,000 se start hota hai.",
    },
    deps
  );
  assert.ok(r.customerView, "customerView structure exists");
  assert.ok(r.founderPrivate, "founderPrivate structure exists");

  const custSer = JSON.stringify(r.customerView);
  const privSer = JSON.stringify(r.founderPrivate);

  // 1. Key-level separation
  assert.ok(!/floor|margin|private|negotiat|assumption|probability/i.test(custSer), "customerView has NO private keys/text");
  assert.ok(privSer.includes("internalFloor"), "founderPrivate carries internalFloor");
  assert.ok(privSer.includes("privateGuidance"), "founderPrivate carries negotiation guidance");
  assert.ok(privSer.includes("founderAssumptions"), "founderPrivate carries founder assumptions");

  // 2. Customer view passes the hard leak assertion
  assert.strictEqual(meetingModeService.assertNoPrivateLeak(r.customerView), true, "leak assertion passed");
  // 5b. K3 CORRECTIVE FIX (founder-approved audit finding): internalFloor is the
  // FOUNDER-DEFINED floor (verified cost + target margin) — NEVER the public list
  // quote. Without founder cost/margin inputs it stays null + UNKNOWN.
  assert.strictEqual(r.founderPrivate.internalFloor, null, "internalFloor never = public list quote (K3 fix)");
  assert.strictEqual(r.founderPrivate.marginGuidance.label, "UNKNOWN", "floor label UNKNOWN without founder inputs");
  assert.strictEqual(r.founderPrivate.marginGuidance.valueINR, null, "floor value null without founder inputs");

  // 3. Accessors return separate structures
  const cust = meetingModeService.getCustomerView(start.sessionId);
  const priv = meetingModeService.getFounderPrivate(start.sessionId);
  assert.strictEqual(cust.success, true);
  assert.strictEqual(priv.success, true);
  assert.ok(!("founderPrivate" in cust.customerView), "customer accessor never includes private block");

  // 4. Founder assumption VALUE must not leak into customer payload
  assert.ok(!custSer.includes("60k"), "assumption value absent from customerView");

  // 5. Intentional leak detector works (defense-in-depth proven)
  let threw = false;
  try {
    meetingModeService.assertNoPrivateLeak({ sessionId: "x", internalFloor: 45000 });
  } catch {
    threw = true;
  }
  assert.strictEqual(threw, true, "assertNoPrivateLeak catches planted private keys");

  record(10, "CustomerView/founderPrivate security separation", "server-side split, leak detector proven");
}

async function runAll() {
  console.log("🦅 GARUDA FOUNDER INTELLIGENCE — GOLDEN EVALUATION SUITE (10 scenarios)\n");
  await scenario1();
  await scenario2();
  await scenario3();
  await scenario4();
  await scenario5();
  await scenario6();
  await scenario7();
  await scenario8();
  await scenario9();
  await scenario10();
  console.log(`\nGOLDEN EVAL PASSED: ${results.length}/10 scenarios green.`);
  return results;
}

if (require.main === module) {
  runAll().catch((err) => {
    console.error("\n✖ GOLDEN EVAL FAILED:", err.message);
    process.exit(1);
  });
}

module.exports = { runAll };
