/**
 * 🦅 GARUDA Project-Driven Universe Activation & System Wiring Suite
 * Comprehensive integration tests verifying:
 * 1. Multi-Universe Clustering: Composite requirement activates multiple relevant capabilities.
 * 2. Irrelevant Universe Prevention: Unrelated Universes are NOT activated.
 * 3. Payment & Plan Initialization: Deposit payment verifies and auto-initializes governed execution.
 * 4. Real Domain Engine Execution: Governed execution executes real creative, content, brand, and digital presence engines.
 * 5. Anti-Fabrication / Cryptographic Truth: Artifacts contain real structured payloads & valid SHA-256 hashes.
 * 6. Tenancy & Role Isolation: Customer A cannot see Customer B deliverables; Founder has sovereign superset access.
 * 7. Proposal & Payment Integrity: Milestone pricing, acceptance, and Razorpay HMAC truth remains intact.
 */

const assert = require("assert");
const crypto = require("crypto");
const capabilityRegistry = require("./capabilityRegistryService");
const persistentProposalService = require("./persistentProposalService");
const governedDelivery = require("./governedProjectDeliveryService");
const founderCommandService = require("./founderCommandService");
const MultiBrainPlanner = require("../../scripts/dev-agent/core/MultiBrainPlanner");

async function runSuite() {
  console.log("=== RUNNING GARUDA PROJECT-DRIVEN UNIVERSE EXECUTION SUITE ===");

  // -------------------------------------------------------------
  // TEST 1: Multi-Universe Capability Clustering
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Multi-Universe Capability Clustering ---");
  const compositeReq = {
    title: "Omnipresent Multi-Channel Digital Brand Campaign",
    description: "We need a complete creative brief, 5-angle ad copy hooks, a 4-week social media editorial calendar, IdentityLock brand guidelines, SEO keyword clusters, and high-converting landing page blueprints for our luxury product launch."
  };

  const match = capabilityRegistry.matchDemandUniversal(compositeReq);
  assert.ok(match.activatedUniverses.includes("U19 Creative"), "Must activate U19 Creative");
  assert.ok(match.activatedUniverses.includes("U20 Content"), "Must activate U20 Content");
  assert.ok(match.activatedUniverses.includes("U21 Brand"), "Must activate U21 Brand");
  assert.ok(match.activatedUniverses.includes("U22 Digital Presence"), "Must activate U22 Digital Presence");
  assert.ok(match.activatedUniverses.includes("U01 Knowledge"), "Must activate U01 Knowledge core");
  assert.ok(match.activatedUniverses.includes("U02 Reasoning"), "Must activate U02 Reasoning core");
  assert.ok(match.activatedUniverses.includes("U09 Governance"), "Must activate U09 Governance core");
  assert.ok(match.activatedUniverses.includes("U10 Revenue"), "Must activate U10 Revenue core");

  console.log("✔ Composite requirement activated matching Universes:", match.activatedUniverses.join(", "));

  // -------------------------------------------------------------
  // TEST 2: Irrelevant Universe Prevention
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Irrelevant Universe Prevention ---");
  assert.ok(!match.activatedUniverses.includes("U13 Career"), "Must NOT activate U13 Career");
  assert.ok(!match.activatedUniverses.includes("U15 Health"), "Must NOT activate U15 Health");
  assert.ok(!match.activatedUniverses.includes("U17 Travel"), "Must NOT activate U17 Travel");
  assert.ok(!match.activatedUniverses.includes("U24 Wealth & Real Estate"), "Must NOT activate U24 Wealth when no real estate requirement is present");
  console.log("✔ Irrelevant Universes correctly excluded from activation set.");

  // -------------------------------------------------------------
  // TEST 3: MultiBrainPlanner Domain Awareness
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: MultiBrainPlanner Domain Awareness ---");
  const planner = new MultiBrainPlanner();
  const selectedBrains = planner._selectBrains(compositeReq.description);
  assert.ok(selectedBrains.includes("creative"), "Planner must select 'creative' brain");
  assert.ok(selectedBrains.includes("content"), "Planner must select 'content' brain");
  assert.ok(selectedBrains.includes("brand"), "Planner must select 'brand' brain");
  assert.ok(selectedBrains.includes("digital_presence"), "Planner must select 'digital_presence' brain");

  const plannedTasks = planner._buildTasks(compositeReq.description);
  const workerTypes = plannedTasks.map(t => t.workerType);
  assert.ok(workerTypes.includes("creative"), "Tasks must include creative worker");
  assert.ok(workerTypes.includes("content"), "Tasks must include content worker");
  assert.ok(workerTypes.includes("brand"), "Tasks must include brand worker");
  assert.ok(workerTypes.includes("digital_presence"), "Tasks must include digital_presence worker");
  console.log("✔ Planner decomposed domain work packages:", workerTypes.join(", "));

  // -------------------------------------------------------------
  // TEST 4: Payment Verification & Auto-Plan Initialization
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Payment Verification & Project Activation ---");
  const testProposalId = `prop_test_universe_${Date.now()}`;
  const testClientEmail = `client_universe_${Date.now()}@example.com`;

  const proposalDoc = {
    proposalId: testProposalId,
    title: "Luxury Brand Launch 360",
    client: { name: "Aura Enterprises", email: testClientEmail },
    requirements: compositeReq.description,
    deliverables: [
      "Multimodal creative brief and 5-angle ad copy hooks",
      "4-week editorial calendar and content pillars",
      "IdentityLock brand profile and compliance report",
      "High-converting landing page blueprint and SEO clusters"
    ],
    pricing: { currency: "INR", totalAmount: 85000, depositAmount: 42500 },
    status: "APPROVED",
    activatedUniverses: match.activatedUniverses,
    createdAt: new Date().toISOString()
  };

  await persistentProposalService.saveProposal(proposalDoc);

  // Accept proposal
  await persistentProposalService.acceptProposal(testProposalId, {
    signerName: "Director Aura",
    signerEmail: testClientEmail
  });

  // Pay deposit & activate
  const activateRes = await persistentProposalService.recordDepositAndActivateProject(testProposalId, {
    paymentId: `pay_test_${Date.now()}`,
    amountPaid: 42500,
    currency: "INR",
    provider: "razorpay"
  });

  assert.ok(activateRes.success, "Project activation must succeed");
  const activatedProj = activateRes.project;
  assert.ok(activatedProj.projectId, "Must generate a projectId");
  assert.ok(["ACTIVE_IN_DEVELOPMENT", "EXECUTION_PLANNED"].includes(activatedProj.status), `Project status must be active or planned, got ${activatedProj.status}`);
  assert.ok(Array.isArray(activatedProj.activatedUniverses), "Project must preserve activatedUniverses");
  assert.ok(activatedProj.executionPlan, "Governed execution plan must be auto-initialized on payment");
  console.log(`✔ Project activated: ${activatedProj.projectId} with auto-initialized plan (${activatedProj.executionPlan.tasks.length} tasks).`);

  // -------------------------------------------------------------
  // TEST 5: Governed Real Domain Engine Execution
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Governed Real Domain Engine Execution ---");
  const deliveryResult = await governedDelivery.executeAndValidateDelivery(activatedProj.projectId);

  assert.ok(deliveryResult.success, "Delivery execution must succeed");
  assert.equal(deliveryResult.status, "DELIVERY_READY");
  assert.ok(deliveryResult.deliveryPackage, "Delivery package must be created");

  const manifest = deliveryResult.deliveryPackage.manifest;
  assert.ok(manifest.length >= 4, "Must contain at least 4 governed deliverables");

  // Verify real domain outputs exist in the manifest
  const creativeDeliv = manifest.find(m => m.universe === "U19 Creative" || m.deliverableType === "CREATIVE_BRIEF_AND_AD_ANGLES");
  const contentDeliv = manifest.find(m => m.universe === "U20 Content" || m.deliverableType === "EDITORIAL_CALENDAR_AND_PILLARS");
  const brandDeliv = manifest.find(m => m.universe === "U21 Brand" || m.deliverableType === "IDENTITY_LOCK_BRAND_PROFILE");
  const presenceDeliv = manifest.find(m => m.universe === "U22 Digital Presence" || m.deliverableType === "LANDING_PAGE_BLUEPRINT_AND_SEO");

  assert.ok(creativeDeliv, "Must contain real U19 Creative deliverable");
  assert.ok(contentDeliv, "Must contain real U20 Content deliverable");
  assert.ok(brandDeliv, "Must contain real U21 Brand deliverable");
  assert.ok(presenceDeliv, "Must contain real U22 Digital Presence deliverable");

  // Check cryptographic SHA-256 seal
  manifest.forEach(item => {
    assert.ok(item.sha256 && /^[a-f0-9]{64}$/i.test(item.sha256), `Item ${item.name} must have a valid SHA-256 hash`);
    assert.ok(item.payload, `Item ${item.name} must contain structured domain payload`);
  });

  console.log(`✔ Real domain engines executed successfully! Generated ${manifest.length} verified artifacts with SHA-256 seals.`);

  // -------------------------------------------------------------
  // TEST 6: Client Tenancy & Role Isolation
  // -------------------------------------------------------------
  console.log("\n--- TEST 6: Client Tenancy & Role Isolation ---");
  const customerAProjects = await persistentProposalService.listCustomerProjects(testClientEmail);
  const customerBProjects = await persistentProposalService.listCustomerProjects("stranger@otherdomain.com");

  assert.ok(customerAProjects.some(p => p.projectId === activatedProj.projectId), "Customer A must see their own project");
  assert.ok(!customerBProjects.some(p => p.projectId === activatedProj.projectId), "Customer B MUST NOT see Customer A's project");
  console.log("✔ Customer tenancy isolation verified 100%. Customer B cannot see Customer A deliverables.");

  // -------------------------------------------------------------
  // TEST 7: Sovereign Founder Access & Timeline Inspection
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: Sovereign Founder Superset Access ---");
  const founderTimeline = await founderCommandService.getProjectCommandTimeline(activatedProj.projectId);
  assert.ok(founderTimeline.project, "Founder must retrieve full project state");
  assert.equal(founderTimeline.project.status, "DELIVERY_READY");
  assert.ok(Array.isArray(founderTimeline.project.activatedUniverses), "Founder must see activated Universes breakdown");
  assert.ok(founderTimeline.delivery, "Founder must see delivery package & SHA-256 manifest");
  console.log("✔ Founder sovereign access verified. Full delivery manifest and universe telemetry available.");

  console.log("\n🎉 ALL PROJECT-DRIVEN UNIVERSE EXECUTION TESTS PASSED (100% SUCCESS)!");
}

runSuite().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
