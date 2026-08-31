/**
 * Growth Handoff Service Tests — Phase 7
 * Tests communication + revenue handoff contracts from Growth Intelligence to U07/U10.
 */

const { draftCampaignCommunication, draftCampaignProposal, listCampaignHandoffs } = require("./growthHandoffService");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✔ PASS: ${label}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

async function assertAsyncThrows(fn) {
  try { await fn(); return false; } catch { return true; }
}

(async () => {
  console.log("=== GROWTH HANDOFF SERVICE — PHASE 7 TESTS ===\n");

  // ─── Section 1: Communication Handoff ───
  console.log("Section 1: Campaign-Triggered Communication Handoff");
  {
    const result = await draftCampaignCommunication({
      campaignId: "gc_test_001",
      campaignBrief: { businessName: "TestCorp", productOrService: "AI Platform" },
      channel: "email",
      recipient: "client@testcorp.com",
      body: "Hello from GARUDA Growth Intelligence.",
      subject: "Growth Campaign Proposal"
    });
    assert(result.success === true, "communication handoff returns success");
    assert(result.data.communicationId.startsWith("comm_"), "communicationId has comm_ prefix");
    assert(result.data.status === "APPROVAL_REQUIRED" || result.data.status === "DRAFTED", "status is APPROVAL_REQUIRED or DRAFTED");
    assert(result.data.channel === "email", "channel is email");
    assert(result.data.recipient === "client@testcorp.com", "recipient preserved");
    assert(result.data.truthNotice.includes("Founder approval"), "truthNotice mentions founder approval");
    assert(result.data.handoffId.startsWith("gh_"), "handoffId has gh_ prefix");
  }

  {
    const result = await draftCampaignCommunication({
      campaignId: "gc_test_002",
      campaignBrief: { businessName: "TelegramCo" },
      channel: "telegram",
      recipient: "123456789",
      body: "Telegram outreach from growth campaign."
    });
    assert(result.success === true, "telegram communication handoff succeeds");
    assert(result.data.channel === "telegram", "channel is telegram");
  }

  {
    const r1 = await draftCampaignCommunication({
      campaignId: "gc_test_dup",
      campaignBrief: { businessName: "Dup Corp" },
      channel: "email",
      recipient: "a@b.com",
      body: "First"
    });
    const r2 = await draftCampaignCommunication({
      campaignId: "gc_test_dup",
      campaignBrief: { businessName: "Dup Corp" },
      channel: "email",
      recipient: "a@b.com",
      body: "Second"
    });
    assert(r1.data.handoffId !== r2.data.handoffId, "duplicate handoffs get unique IDs");
  }

  // ─── Section 2: Validation ───
  console.log("\nSection 2: Communication Handoff Validation");
  {
    const e1 = await assertAsyncThrows(() => draftCampaignCommunication({}));
    assert(e1, "rejects empty payload");

    const e2 = await assertAsyncThrows(() => draftCampaignCommunication({ campaignId: "gc_x" }));
    assert(e2, "rejects missing recipient");

    const e3 = await assertAsyncThrows(() => draftCampaignCommunication({ campaignId: "gc_x", recipient: "a@b.com" }));
    assert(e3, "rejects missing body");
  }

  // ─── Section 3: Proposal Handoff ───
  console.log("\nSection 3: Campaign-Triggered Proposal Handoff");
  {
    const result = await draftCampaignProposal({
      campaignId: "gc_test_prop_001",
      campaignBrief: { businessName: "PropCorp", productOrService: "SaaS Platform", contactEmail: "cto@prop.com" },
      milestones: [
        { title: "Strategy & Planning", value: 50000, deliverables: ["Brand guidelines", "Campaign brief"] },
        { title: "Content Production", value: 75000, deliverables: ["12 social posts", "4 blog articles"] },
        { title: "Campaign Execution", value: 100000, deliverables: ["Ad campaigns", "Performance reports"] }
      ],
      totalValue: 225000,
      currency: "INR"
    });
    assert(result.success === true, "proposal handoff returns success");
    assert(result.data.proposalId.startsWith("prop_growth_"), "proposalId has prop_growth_ prefix");
    assert(result.data.status === "APPROVED", "proposal status is APPROVED");
    assert(result.data.totalValue === 225000, "totalValue preserved");
    assert(result.data.currency === "INR", "currency preserved");
    assert(result.data.milestoneCount === 3, "milestoneCount is 3");
    assert(result.data.truthNotice.includes("Proposal created"), "truthNotice present");
    assert(result.data.handoffId.startsWith("gh_"), "handoffId present");
  }

  {
    const result = await draftCampaignProposal({
      campaignId: "gc_test_prop_002",
      campaignBrief: { businessName: "AutoVal" },
      milestones: [
        { title: "Execution", value: 100000 }
      ]
    });
    assert(result.data.totalValue === 100000, "auto-calculated totalValue when not provided");
  }

  // ─── Section 4: Proposal Validation ───
  console.log("\nSection 4: Proposal Handoff Validation");
  {
    const e1 = await assertAsyncThrows(() => draftCampaignProposal({}));
    assert(e1, "rejects empty payload");

    const e2 = await assertAsyncThrows(() => draftCampaignProposal({ campaignId: "gc_x" }));
    assert(e2, "rejects missing milestones");

    const e3 = await assertAsyncThrows(() => draftCampaignProposal({ campaignId: "gc_x", milestones: [] }));
    assert(e3, "rejects empty milestones array");
  }

  // ─── Section 5: Handoff Listing ───
  console.log("\nSection 5: Handoff Listing");
  {
    const result = listCampaignHandoffs({});
    assert(result.success === true, "listHandoffs returns success");
    assert(Array.isArray(result.data), "data is array");
    assert(result.data.length >= 5, "at least 5 handoff records from prior tests");

    const filtered = listCampaignHandoffs({ campaignId: "gc_test_prop_001" });
    assert(filtered.data.every((r) => r.campaignId === "gc_test_prop_001"), "campaignId filter works");
  }

  // ─── Section 6: Event Emission ───
  console.log("\nSection 6: Event Emission (verify no crash)");
  {
    const commResult = await draftCampaignCommunication({
      campaignId: "gc_event_test_001",
      campaignBrief: { businessName: "EventTest" },
      channel: "email",
      recipient: "test@event.com",
      body: "Event emission test"
    });
    assert(commResult.success === true, "communication handoff with event emission does not crash");

    const propResult = await draftCampaignProposal({
      campaignId: "gc_event_test_002",
      campaignBrief: { businessName: "EventTest" },
      milestones: [{ title: "Test", value: 10000 }]
    });
    assert(propResult.success === true, "proposal handoff with event emission does not crash");
  }

  // ─── Summary ───
  console.log(`\n=== HANDOFF SERVICE TEST RESULTS: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
})();

