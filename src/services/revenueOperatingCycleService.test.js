// Phase 5 tests: Revenue Operating Cycle (dry-run / no real sends).
// Validates governed rules: no auto-sends, follow-up caps, reply stops
// follow-ups, per-band archiveOnExhaustion policy, reply updates opportunity state.
const assert = require("assert");
const cycle = require("./revenueOperatingCycleService");

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
  test("dry-run is the default", () => {
    assert.strictEqual(cycle.isDryRun({}), true);
    assert.strictEqual(cycle.isDryRun({ dryRun: true }), true);
    assert.strictEqual(cycle.isDryRun({ dryRun: false }), false);
  });

  test("founder approval is required for sends", () => {
    assert.strictEqual(cycle.founderApproved({}), false);
    assert.strictEqual(cycle.founderApproved({ founderApproved: "true" }), true);
    assert.strictEqual(cycle.founderApproved({ founderApproved: true }), true);
  });

  test("a 'no' reply stops follow-ups and archives the opportunity", () => {
    const patch = cycle.applyReplyToOpportunity({ stage: "prospect", probability: 25, outreach: { followUpCount: 1 } }, { intent: "no", date: "2026-08-16T00:00:00Z" });
    assert.strictEqual(patch.stage, "lost");
    assert.strictEqual(patch.outreach.archived, true);
    assert.strictEqual(patch.outreach.archiveReason, "replied_no_or_optout");
  });

  test("an 'interested' reply qualifies the opportunity and bumps probability", () => {
    const patch = cycle.applyReplyToOpportunity({ stage: "prospect", probability: 25, outreach: { followUpCount: 2 } }, { intent: "interested" });
    assert.strictEqual(patch.stage, "qualified");
    assert.strictEqual(patch.probability, 50);
    assert.strictEqual(patch.outreach.lastReplyAt != null, true);
  });

  await testAsync("runInboxPoll is a no-op in dry-run mode", async () => {
    const result = await cycle.runInboxPoll({ dryRun: true });
    assert.strictEqual(result.dryRun, true);
    assert.ok(result.note.includes("dry-run"));
  });

  await testAsync("archive honors archiveOnExhaustion per band (LOW_VALUE/LOW/NORMAL yes; HIGH/STRATEGIC no)", async () => {
    const opps = [
      { id: "lv", priority: "LOW_VALUE", stage: "prospect", outreach: { followUpCount: 2, firstOutreachAt: "2026-08-01T00:00:00Z" } },
      { id: "low", priority: "LOW", stage: "prospect", outreach: { followUpCount: 3, firstOutreachAt: "2026-08-01T00:00:00Z" } },
      { id: "nor", priority: "NORMAL", stage: "prospect", outreach: { followUpCount: 3, firstOutreachAt: "2026-08-01T00:00:00Z" } },
      { id: "hi", priority: "HIGH", stage: "prospect", outreach: { followUpCount: 3, firstOutreachAt: "2026-08-01T00:00:00Z" } },
      { id: "str", priority: "STRATEGIC", stage: "prospect", outreach: { followUpCount: 3, firstOutreachAt: "2026-08-01T00:00:00Z" } }
    ];
    const originalList = require("./opportunityService").listOpportunities;
    const originalUpdate = require("./opportunityService").updateOpportunity;
    require("./opportunityService").listOpportunities = async () => opps;
    const updates = [];
    require("./opportunityService").updateOpportunity = async (id, patch) => { updates.push({ id, patch }); return { id }; };
    try {
      const archived = await cycle.archiveExhaustedLowValue(new Date("2026-08-16T00:00:00Z"));
      const archivedIds = archived.map((a) => a.opportunityId).sort();
      assert.deepStrictEqual(archivedIds, ["low", "lv", "nor"]);
      const lvPatch = updates.find((u) => u.id === "lv").patch.outreach;
      assert.strictEqual(lvPatch.archived, true);
      assert.strictEqual(lvPatch.archiveReason, "no_reply_exhausted_followups");
      assert.ok(!updates.some((u) => u.id === "hi" || u.id === "str"), "HIGH/STRATEGIC are never archived for age");
    } finally {
      require("./opportunityService").listOpportunities = originalList;
      require("./opportunityService").updateOpportunity = originalUpdate;
    }
  });

  await testAsync("opportunities below their band's follow-up cap are not archived", async () => {
    const opps = [
      { id: "lv2", priority: "LOW_VALUE", stage: "prospect", outreach: { followUpCount: 1, firstOutreachAt: "2026-08-01T00:00:00Z" } },
      { id: "low2", priority: "LOW", stage: "prospect", outreach: { followUpCount: 2, firstOutreachAt: "2026-08-01T00:00:00Z" } },
      { id: "nor2", priority: "NORMAL", stage: "prospect", outreach: { followUpCount: 2, firstOutreachAt: "2026-08-01T00:00:00Z" } }
    ];
    const originalList = require("./opportunityService").listOpportunities;
    const originalUpdate = require("./opportunityService").updateOpportunity;
    require("./opportunityService").listOpportunities = async () => opps;
    const updates = [];
    require("./opportunityService").updateOpportunity = async (id, patch) => { updates.push({ id, patch }); return { id }; };
    try {
      const archived = await cycle.archiveExhaustedLowValue(new Date("2026-08-16T00:00:00Z"));
      assert.strictEqual(archived.length, 0);
      assert.strictEqual(updates.length, 0);
    } finally {
      require("./opportunityService").listOpportunities = originalList;
      require("./opportunityService").updateOpportunity = originalUpdate;
    }
  });

  await testAsync("follow-up processor never sends in dry-run / without founder approval", async () => {
    const originalList = require("./opportunityService").listOpportunities;
    const originalSend = require("./garudaInboxService").sendFollowUp;
    require("./opportunityService").listOpportunities = async () => [
      { id: "x", priority: "NORMAL", stage: "prospect", outreach: { followUpCount: 1, firstOutreachAt: "2026-08-01T00:00:00Z" } }
    ];
    let sendCalled = false;
    require("./garudaInboxService").sendFollowUp = async () => { sendCalled = true; return { ok: true }; };
    try {
      const result = await cycle.runFollowUpProcessor({ dryRun: true, now: new Date("2026-08-16T00:00:00Z") });
      assert.strictEqual(sendCalled, false);
      assert.strictEqual(result.dryRun, true);
      assert.ok(result.processed.some((item) => item.mode === "dry_run"));
    } finally {
      require("./opportunityService").listOpportunities = originalList;
      require("./garudaInboxService").sendFollowUp = originalSend;
    }
  });

  await testAsync("follow-up processor requires founder approval even with dry-run off", async () => {
    const originalList = require("./opportunityService").listOpportunities;
    const originalSend = require("./garudaInboxService").sendFollowUp;
    require("./opportunityService").listOpportunities = async () => [
      { id: "y", priority: "NORMAL", stage: "prospect", outreach: { followUpCount: 1, firstOutreachAt: "2026-08-01T00:00:00Z" } }
    ];
    let sendCalled = false;
    require("./garudaInboxService").sendFollowUp = async () => { sendCalled = true; return { ok: true }; };
    try {
      const result = await cycle.runFollowUpProcessor({ dryRun: false, now: new Date("2026-08-16T00:00:00Z") });
      assert.strictEqual(sendCalled, false);
      assert.ok(result.processed.some((item) => item.mode === "founder_approval_required"));
    } finally {
      require("./opportunityService").listOpportunities = originalList;
      require("./garudaInboxService").sendFollowUp = originalSend;
    }
  });

  await testAsync("full operating cycle runs in dry-run without errors", async () => {
    const originalList = require("./opportunityService").listOpportunities;
    const discovery = require("./opportunityDiscoveryService");
    const originalRunDiscovery = discovery.runDiscoveryCycle;
    require("./opportunityService").listOpportunities = async () => [];
    discovery.runDiscoveryCycle = async () => ({ mode: "active_mission", fetched: 0, ranked: 0, rejected: 0, errors: [] });
    try {
      const result = await cycle.runRevenueOperatingCycle({ dryRun: true, now: new Date("2026-08-16T00:00:00Z") });
      assert.strictEqual(result.dryRun, true);
      assert.strictEqual(result.governance.dryRunMode, true);
      assert.strictEqual(result.governance.founderApprovalRequiredForSends, true);
    } finally {
      require("./opportunityService").listOpportunities = originalList;
      discovery.runDiscoveryCycle = originalRunDiscovery;
    }
  });

  console.log(`\nrevenueOperatingCycleService.test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
