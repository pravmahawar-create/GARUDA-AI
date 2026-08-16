// Phase 2 + Phase 3 tests: Revenue Value Model + Priority Bands + Continuous Discovery.
// Pure unit tests (no real MongoDB). Continuous-discovery fallback is tested via
// the discovery service with model methods mocked and mongoose readyState stubbed
// so the dedicated operations mission path is exercised deterministically.
const assert = require("assert");
const vm = require("./revenueValueModelService");
const discovery = require("./opportunityDiscoveryService");

let passed = 0;
let failed = 0;
function report(name, error) {
  if (error) {
    failed += 1;
    console.log(`  xx  ${name}: ${error.message}`);
  } else {
    passed += 1;
    console.log(`  ok  ${name}`);
  }
}
function test(name, fn) {
  try {
    fn();
    report(name);
  } catch (error) {
    report(name, error);
  }
}
async function testAsync(name, fn) {
  try {
    await fn();
    report(name);
  } catch (error) {
    report(name, error);
  }
}

async function main() {
  test("priority bands classify correctly", () => {
    assert.strictEqual(vm.classifyPriority(999).priority, "LOW_VALUE");
    assert.strictEqual(vm.classifyPriority(3000).priority, "LOW");
    assert.strictEqual(vm.classifyPriority(5000).priority, "NORMAL");
    assert.strictEqual(vm.classifyPriority(25000).priority, "HIGH");
    assert.strictEqual(vm.classifyPriority(50000).priority, "VERY_HIGH");
    assert.strictEqual(vm.classifyPriority(100000).priority, "STRATEGIC");
    assert.strictEqual(vm.classifyPriority(5000000).priority, "STRATEGIC");
  });

  test("priority band labels are explicit and queryable", () => {
    assert.strictEqual(vm.priorityLabel("LOW_VALUE"), "LOW VALUE / JUNK");
    assert.strictEqual(vm.priorityLabel("STRATEGIC"), "STRATEGIC HIGH-VALUE");
    assert.strictEqual(vm.priorityLabel("UNKNOWN"), "UNMEASURED");
  });

  test("follow-up caps: LOW_VALUE max 2, others max 3", () => {
    assert.strictEqual(vm.maxFollowUpsFor("LOW_VALUE"), 2);
    assert.strictEqual(vm.maxFollowUpsFor("LOW"), 3);
    assert.strictEqual(vm.maxFollowUpsFor("NORMAL"), 3);
    assert.strictEqual(vm.maxFollowUpsFor("STRATEGIC"), 3);
    assert.strictEqual(vm.maxFollowUpsFor("garbage"), 2);
  });

  test("missing salary evidence -> UNKNOWN/UNMEASURED (no invented value)", () => {
    const estimate = vm.estimateValueFromEvidence("");
    assert.strictEqual(estimate.status, "UNKNOWN");
    assert.strictEqual(estimate.estimatedINR, null);
    assert.ok(/cannot be determined/i.test(estimate.note));
  });

  test("salary evidence -> ESTIMATED (evidence-backed, not approved deal/revenue)", () => {
    const estimate = vm.estimateValueFromEvidence("$3,000/month", { valueType: "salary_contract_compensation" });
    assert.strictEqual(estimate.status, "ESTIMATED");
    assert.ok(estimate.estimatedINR > 0);
    assert.strictEqual(estimate.valueType, "salary_contract_compensation");
    assert.ok(estimate.confidence > 0);
  });

  test("value types never mix", () => {
    const allowed = vm.VALUE_TYPES;
    assert.ok(allowed.includes("estimated_project_value"));
    assert.ok(allowed.includes("salary_contract_compensation"));
    assert.ok(allowed.includes("recurring_monthly_value"));
    assert.ok(allowed.includes("one_time_project_value"));
    assert.ok(allowed.includes("affiliate_commission_value"));
    assert.ok(allowed.includes("insurance_opportunity_value"));
    assert.ok(allowed.includes("approved_deal_value"));
    assert.ok(allowed.includes("received_revenue"));
    assert.ok(allowed.length >= 8);
  });

  test("8-factor rank returns bounded rank with measured factors", () => {
    const ranked = vm.rankOpportunity({ buyingIntent: 8, buyingIntentEvidence: "client asked for quote", verifiedBusinessNeed: 7, verifiedBusinessNeedEvidence: "verified requirement", commercialValue: 6, commercialValueEvidence: "salary evidence" });
    assert.ok(ranked.rank >= 0 && ranked.rank <= 100);
    assert.strictEqual(ranked.factors.length, 8);
    assert.ok(ranked.measured === true);
  });

  test("rankFromCandidate with salary -> ESTIMATED commercial value factor", () => {
    const ranked = vm.rankFromCandidate({ salaryText: "$4,000/month", opportunityChannel: "garuda_deliverable", outcomeDeliverability: { canGarudaDeliver: true }, verification: { sourceVerified: true, directClientWorkEvidence: true } });
    assert.ok(ranked.rank > 0);
  });

  test("no evidence candidate stays unmeasured (rank 0, measured false)", () => {
    const ranked = vm.rankFromCandidate({});
    assert.strictEqual(ranked.rank, 0);
    assert.strictEqual(ranked.measured, false);
  });

  test("continuous discovery uses a real dedicated mission, not a phantom id", () => {
    assert.strictEqual(discovery.DEFAULT_DISCOVERY_MISSION_ID, undefined);
    assert.strictEqual(typeof discovery.CONTINUOUS_DISCOVERY_MISSION_TITLE, "string");
    assert.ok(discovery.CONTINUOUS_DISCOVERY_MISSION_TITLE.length > 0);
    assert.strictEqual(typeof discovery.ensureContinuousDiscoveryMission, "function");
  });

  await testAsync("ensureContinuousDiscoveryMission is deterministic and idempotent", async () => {
    const mongoose = require("mongoose");
    const { IncomeGoal } = require("../models/IncomeGoal");
    const originalReadyState = mongoose.connection.readyState;
    const originalFindOne = IncomeGoal.findOne;
    const originalCreate = IncomeGoal.create;
    mongoose.connection.readyState = 1;
    try {
      const missionId = new mongoose.Types.ObjectId();
      let createCalls = 0;
      IncomeGoal.findOne = async (query) => {
        assert.strictEqual(query.title, discovery.CONTINUOUS_DISCOVERY_MISSION_TITLE);
        assert.strictEqual(query["missionPolicy.continuousDiscovery"], true);
        return { _id: missionId, title: discovery.CONTINUOUS_DISCOVERY_MISSION_TITLE };
      };
      IncomeGoal.create = async () => { createCalls += 1; throw new Error("should not create when mission already exists"); };
      const first = await discovery.ensureContinuousDiscoveryMission();
      const second = await discovery.ensureContinuousDiscoveryMission();
      assert.strictEqual(String(first._id), String(missionId));
      assert.strictEqual(String(second._id), String(missionId));
      assert.strictEqual(createCalls, 0);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      IncomeGoal.findOne = originalFindOne;
      IncomeGoal.create = originalCreate;
    }
  });

  await testAsync("ensureContinuousDiscoveryMission creates a clearly-labelled ops mission only when absent", async () => {
    const mongoose = require("mongoose");
    const { IncomeGoal } = require("../models/IncomeGoal");
    const originalReadyState = mongoose.connection.readyState;
    const originalFindOne = IncomeGoal.findOne;
    const originalCreate = IncomeGoal.create;
    mongoose.connection.readyState = 1;
    try {
      const missionId = new mongoose.Types.ObjectId();
      let createdPayload = null;
      IncomeGoal.findOne = async () => null;
      IncomeGoal.create = async (payload) => { createdPayload = payload; return { _id: missionId, ...payload }; };
      const mission = await discovery.ensureContinuousDiscoveryMission();
      assert.strictEqual(String(mission._id), String(missionId));
      assert.strictEqual(createdPayload.title, discovery.CONTINUOUS_DISCOVERY_MISSION_TITLE);
      assert.strictEqual(createdPayload.status, "active");
      assert.strictEqual(createdPayload.targetAmount, 1);
      assert.ok(createdPayload.auditTrail.some((e) => e.action === "continuous_discovery_mission_auto_created"));
    } finally {
      mongoose.connection.readyState = originalReadyState;
      IncomeGoal.findOne = originalFindOne;
      IncomeGoal.create = originalCreate;
    }
  });

  await testAsync("runDiscoveryCycle falls back to a REAL mission (not a phantom) with zero active missions", async () => {
    const mongoose = require("mongoose");
    const { IncomeGoal } = require("../models/IncomeGoal");
    const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
    const originalReadyState = mongoose.connection.readyState;
    const originalFind = IncomeGoal.find;
    const originalFindOne = IncomeGoal.findOne;
    const originalCreate = IncomeGoal.create;
    const originalFindById = IncomeGoal.findById;
    const originalUpdateOne = IncomeGoal.updateOne;
    const originalCount = DiscoveryCandidate.countDocuments;
    const originalUpdateOneCand = DiscoveryCandidate.updateOne;
    const originalFetch = global.fetch;
    const realMissionId = new mongoose.Types.ObjectId().toHexString();
    IncomeGoal.find = async () => [];
    IncomeGoal.findOne = async () => ({ _id: realMissionId, title: discovery.CONTINUOUS_DISCOVERY_MISSION_TITLE });
    IncomeGoal.create = async () => { throw new Error("must not create when mission already exists"); };
    IncomeGoal.findById = async () => null;
    IncomeGoal.updateOne = async () => ({ modifiedCount: 0 });
    DiscoveryCandidate.countDocuments = async () => 35;
    let persistedMissionId = null;
    DiscoveryCandidate.updateOne = async (identity) => { persistedMissionId = identity.missionId; return { upsertedCount: 0, matchedCount: 0 }; };
    global.fetch = async () => ({ ok: true, json: async () => ({ jobs: [{ id: 9001, title: "Remote Node Engineer", company_name: "Acme", url: "https://remotive.com/job/9001", candidate_required_location: "Worldwide", tags: ["Node"], publication_date: new Date().toISOString(), salary: "$60k/year" }] }) });
    try {
      mongoose.connection.readyState = 1;
      const summary = await discovery.runDiscoveryCycle({ intervalMs: 900000 });
      assert.strictEqual(summary.activeMissionCount, 0);
      assert.strictEqual(summary.mode, "fallback_continuous");
      assert.strictEqual(summary.missionsScanned, 1);
      assert.ok(summary.fetched >= 1);
      assert.strictEqual(persistedMissionId, realMissionId, "candidates attach to the real dedicated mission, not a phantom id");
      assert.ok(!/^507f1f77bcf86cd799439011/.test(String(persistedMissionId)), "no phantom mission id is used");
    } finally {
      mongoose.connection.readyState = originalReadyState;
      IncomeGoal.find = originalFind;
      IncomeGoal.findOne = originalFindOne;
      IncomeGoal.create = originalCreate;
      IncomeGoal.findById = originalFindById;
      IncomeGoal.updateOne = originalUpdateOne;
      DiscoveryCandidate.countDocuments = originalCount;
      DiscoveryCandidate.updateOne = originalUpdateOneCand;
      global.fetch = originalFetch;
    }
  });

  await testAsync("no phantom mission id is injected via batch/standalone discovery", async () => {
    const mongoose = require("mongoose");
    const { IncomeGoal } = require("../models/IncomeGoal");
    const { DiscoveryCandidate } = require("../models/DiscoveryCandidate");
    const originalReadyState = mongoose.connection.readyState;
    const originalFindOne = IncomeGoal.findOne;
    const originalCreate = IncomeGoal.create;
    const originalCandUpdate = DiscoveryCandidate.updateOne;
    const realMissionId = new mongoose.Types.ObjectId();
    mongoose.connection.readyState = 1;
    IncomeGoal.findOne = async () => ({ _id: realMissionId, title: discovery.CONTINUOUS_DISCOVERY_MISSION_TITLE });
    IncomeGoal.create = async (payload) => ({ _id: realMissionId, ...payload });
    DiscoveryCandidate.updateOne = async () => ({ upsertedCount: 0, modifiedCount: 0 });
    try {
      const processed = discovery.processJobsBatch([], null);
      assert.strictEqual(processed.rankedCandidates.length, 0);
      const standalone = await discovery.runStandaloneDiscovery({ jobs: [{ id: 55, title: "API Work", company_name: "Acme", url: "https://remotive.com/job/55", tags: ["API"], candidate_required_location: "Worldwide" }] });
      const top = standalone.topCandidates[0];
      assert.ok(top, "expected a ranked candidate");
      assert.strictEqual(String(top.missionId), String(realMissionId), "candidate carries the real dedicated mission id");
      assert.ok(!String(top.missionId).startsWith("507f1f77bcf86cd799439011"));
    } finally {
      mongoose.connection.readyState = originalReadyState;
      IncomeGoal.findOne = originalFindOne;
      IncomeGoal.create = originalCreate;
      DiscoveryCandidate.updateOne = originalCandUpdate;
    }
  });

  await testAsync("candidate -> opportunity builder maps evidence without fabrication", async () => {
    const opportunityService = require("./opportunityService");
    const originalCreate = opportunityService.createOpportunity;
    let captured = null;
    opportunityService.createOpportunity = async (payload) => {
      captured = payload;
      return { id: "opp-1", ...payload };
    };
    try {
      const created = await discovery.createOpportunityFromCandidate({
        _id: "507f1f77bcf86cd799439011",
        title: "Node API build",
        company: "Acme",
        source: "remotive",
        url: "https://remotive.com/job/1",
        salaryText: "₹1,20,000 one-time",
        valueModel: { estimatedINR: 120000, rank: 80, status: "ESTIMATED", rankedAt: new Date() }
      }, { actor: "FOUNDER" });
      assert.ok(created);
      assert.ok(captured);
      assert.strictEqual(captured.origin, "discovery");
      assert.strictEqual(captured.priority, "STRATEGIC");
      assert.ok(captured.potentialValue > 0);
      assert.strictEqual(captured.candidateId, "507f1f77bcf86cd799439011");
    } finally {
      opportunityService.createOpportunity = originalCreate;
    }
  });

  console.log(`\nrevenueValueModelService.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
