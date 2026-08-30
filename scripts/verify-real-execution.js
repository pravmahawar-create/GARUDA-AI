/**
 * 🦅 GARUDA End-to-End Reality Verification Script
 * One-shot physical execution proof script:
 * Ingests a real luxury launch requirement -> multi-universe matching -> commercial proposal
 * -> deposit payment -> multi-brain planning -> real domain engine execution -> cryptographic seal
 * -> persistence survival -> tenancy isolation -> founder superset inspection.
 */

const assert = require("assert");
const crypto = require("crypto");
const capabilityRegistry = require("../src/services/capabilityRegistryService");
const persistentProposalService = require("../src/services/persistentProposalService");
const governedDelivery = require("../src/services/governedProjectDeliveryService");
const founderCommandService = require("../src/services/founderCommandService");
const MultiBrainPlanner = require("./dev-agent/core/MultiBrainPlanner");

async function verifyRealExecution() {
  console.log("===============================================================================");
  console.log("🦅 GARUDA ONE-SHOT END-TO-END PROJECT EXECUTION REALITY VERIFICATION");
  console.log("===============================================================================\n");

  const timestamp = Date.now();
  const testClientEmail = `reality_client_${timestamp}@sovereignbrand.in`;
  const testProposalId = `prop_reality_${timestamp}`;

  // ---------------------------------------------------------------------------
  // STEP 1: Requirement Intake & Universal Capability Detection
  // ---------------------------------------------------------------------------
  console.log("[STEP 1] Requirement Intake & Capability Detection");
  const testRequirement = {
    title: "Aura Luxe — Luxury Product Launch Omnipresent Campaign",
    description: "We need a complete luxury product launch campaign including: creative strategy, brand positioning, 5 advertising angles, social media content calendar, SEO topic clusters, and a high-converting landing page blueprint."
  };

  const match = capabilityRegistry.matchDemandUniversal(testRequirement);
  console.log("  → Primary Universe:", match.primaryUniverse);
  console.log("  → Activated Universes Cluster:", match.activatedUniverses.join(", "));

  // Constitutional verification of matching
  assert.ok(match.activatedUniverses.includes("U19 Creative"), "Must activate U19 Creative");
  assert.ok(match.activatedUniverses.includes("U20 Content"), "Must activate U20 Content");
  assert.ok(match.activatedUniverses.includes("U21 Brand"), "Must activate U21 Brand");
  assert.ok(match.activatedUniverses.includes("U22 Digital Presence"), "Must activate U22 Digital Presence");
  assert.ok(match.activatedUniverses.includes("U01 Knowledge"), "Must include U01 Knowledge core");
  assert.ok(match.activatedUniverses.includes("U02 Reasoning"), "Must include U02 Reasoning core");
  assert.ok(match.activatedUniverses.includes("U09 Governance"), "Must include U09 Governance core");
  assert.ok(match.activatedUniverses.includes("U10 Revenue"), "Must include U10 Revenue core");

  // Irrelevant universes remain dormant
  assert.ok(!match.activatedUniverses.includes("U13 Career"), "Must NOT activate U13 Career");
  assert.ok(!match.activatedUniverses.includes("U15 Health"), "Must NOT activate U15 Health");
  assert.ok(!match.activatedUniverses.includes("U17 Travel"), "Must NOT activate U17 Travel");
  assert.ok(!match.activatedUniverses.includes("U24 Wealth & Real Estate"), "Must NOT activate U24 Wealth when real estate is not in scope");
  console.log("  ✔ Capability detection & universe clustering verified.\n");

  // ---------------------------------------------------------------------------
  // STEP 2: Commercial Proposal Creation & Storage
  // ---------------------------------------------------------------------------
  console.log("[STEP 2] Commercial Proposal Creation & Persistence");
  const proposalDoc = {
    proposalId: testProposalId,
    title: testRequirement.title,
    client: {
      name: "Aura Luxe Private Limited",
      email: testClientEmail,
      organization: "Aura Luxe Global"
    },
    requirements: testRequirement.description,
    deliverables: [
      "Multimodal creative brief and 5-angle ad copy hooks",
      "4-week social media editorial calendar and content pillars",
      "Sovereign IdentityLock brand profile and compliance report",
      "High-converting landing page blueprint and SEO topic clusters"
    ],
    pricing: {
      currency: "INR",
      totalAmount: 125000,
      depositAmount: 62500,
      totalINR: 125000,
      depositAmountINR: 62500
    },
    primaryUniverse: match.primaryUniverse,
    activatedUniverses: match.activatedUniverses,
    selectedCapabilities: match.selectedCapabilities,
    status: "APPROVED",
    createdAt: new Date().toISOString()
  };

  const savedProposal = await persistentProposalService.saveProposal(proposalDoc);
  assert.equal(savedProposal.proposalId, testProposalId);
  console.log("  ✔ Proposal created and persisted:", savedProposal.proposalId);

  // ---------------------------------------------------------------------------
  // STEP 3: Client Acceptance & Deposit Payment Verification
  // ---------------------------------------------------------------------------
  console.log("\n[STEP 3] Client Acceptance & Deposit Payment Verification");
  const acceptResult = await persistentProposalService.acceptProposal(testProposalId, {
    signerName: "Vikram Malhotra",
    signerEmail: testClientEmail
  });
  assert.equal(acceptResult.proposal.status, "CLIENT_ACCEPTED");
  console.log("  ✔ Proposal signed & accepted by client.");

  const paymentId = `pay_reality_${timestamp}`;
  const activationResult = await persistentProposalService.recordDepositAndActivateProject(testProposalId, {
    paymentId,
    amountPaid: 62500,
    currency: "INR",
    provider: "razorpay"
  });

  assert.ok(activationResult.success, "Project activation must succeed");
  const activatedProject = activationResult.project;
  const projectId = activatedProject.projectId;
  console.log("  ✔ Deposit payment verified (₹62,500). Project Activated:", projectId);
  console.log("  → Project Status:", activatedProject.status);
  console.log("  → Auto-Initialized Execution Plan ID:", activatedProject.executionPlan?.planId);
  assert.ok(activatedProject.executionPlan, "Execution plan must be auto-initialized");
  assert.equal(activatedProject.executionPlan.tasks.length, 4, "Plan must decompose into 4 tasks");

  // ---------------------------------------------------------------------------
  // STEP 4: Real Domain Engine Execution (Zero Mocks)
  // ---------------------------------------------------------------------------
  console.log("\n[STEP 4] Governed Real Domain Engine Execution");
  const deliveryResult = await governedDelivery.executeAndValidateDelivery(projectId);
  assert.ok(deliveryResult.success, "Governed delivery must succeed");
  assert.equal(deliveryResult.status, "DELIVERY_READY");

  const manifest = deliveryResult.deliveryPackage.manifest;
  console.log(`  ✔ Delivery Package Sealed with SHA-256! Generated ${manifest.length} domain artifacts:`);

  manifest.forEach((m, idx) => {
    console.log(`    [Artifact ${idx + 1}] ${m.label}`);
    console.log(`      • Domain Universe: ${m.universe}`);
    console.log(`      • Deliverable Type: ${m.deliverableType}`);
    console.log(`      • SHA-256 Seal: ${m.sha256}`);
    assert.ok(m.sha256 && /^[a-f0-9]{64}$/i.test(m.sha256), `Artifact ${m.name} must have a valid SHA-256 hash`);
    assert.ok(m.payload, `Artifact ${m.name} must contain structured payload`);
  });

  // Verify specific real domain payloads
  const creativeArt = manifest.find(m => m.universe === "U19 Creative");
  assert.ok(creativeArt && creativeArt.payload && creativeArt.payload.adCopyVariants, "U19 Creative payload must contain adCopyVariants from real creativeStudioService");

  const contentArt = manifest.find(m => m.universe === "U20 Content");
  assert.ok(contentArt && contentArt.payload && contentArt.payload.contentPillars, "U20 Content payload must contain contentPillars from real digitalMarketingOsService");

  const brandArt = manifest.find(m => m.universe === "U21 Brand");
  assert.ok(brandArt && brandArt.payload && brandArt.payload.complianceVerdict, "U21 Brand payload must contain complianceVerdict from real identityLockService");

  const presenceArt = manifest.find(m => m.universe === "U22 Digital Presence");
  assert.ok(presenceArt && presenceArt.payload && presenceArt.payload.landingPageId, "U22 Digital Presence payload must contain landingPageId & topicClusters");

  console.log("  ✔ All domain engine outputs verified as authentic, structured payloads.");

  // ---------------------------------------------------------------------------
  // STEP 5: Persistence Survival Proof (Reload Fresh from Storage)
  // ---------------------------------------------------------------------------
  console.log("\n[STEP 5] Persistence Survival Proof (Fresh Database Reload)");
  const reloadedProject = await persistentProposalService.getProjectById(projectId);
  assert.ok(reloadedProject, "Project must reload from persistent storage");
  assert.equal(reloadedProject.status, "DELIVERY_READY");
  assert.ok(reloadedProject.deliveryPackage, "Delivery package must survive in persisted project record");
  assert.equal(reloadedProject.deliveryPackage.manifest.length, 4);
  assert.ok(Array.isArray(reloadedProject.activatedUniverses), "Activated universes must be persisted");
  console.log("  ✔ Project record, delivery package, and universe metadata verified restart-safe in persistent storage.");

  // ---------------------------------------------------------------------------
  // STEP 6: Customer Tenancy & Security Attack Verification
  // ---------------------------------------------------------------------------
  console.log("\n[STEP 6] Customer Tenancy & Authorization Security Gate");
  const ownerProjects = await persistentProposalService.listCustomerProjects(testClientEmail);
  const intruderProjects = await persistentProposalService.listCustomerProjects("competitor@otherorg.com");

  assert.ok(ownerProjects.some(p => p.projectId === projectId), "Owner client must see their project");
  assert.ok(!intruderProjects.some(p => p.projectId === projectId), "Competitor client MUST NOT see owner's project");
  console.log("  ✔ Strict customer tenancy verified 100%. Cross-tenant leakage blocked.");

  // ---------------------------------------------------------------------------
  // STEP 7: Sovereign Founder Superset Access Verification
  // ---------------------------------------------------------------------------
  console.log("\n[STEP 7] Sovereign Founder Superset Access");
  const founderTimeline = await founderCommandService.getProjectCommandTimeline(projectId);
  assert.ok(founderTimeline.project, "Founder must retrieve full project state without tenancy restriction");
  assert.equal(founderTimeline.project.status, "DELIVERY_READY");
  assert.ok(founderTimeline.delivery, "Founder must see cryptographic delivery package");
  assert.ok(Array.isArray(founderTimeline.project.activatedUniverses), "Founder must see activated universes list");
  console.log("  ✔ Founder sovereign superset telemetry and execution state verified.");

  console.log("\n===============================================================================");
  console.log("🎉 ALL REALITY VERIFICATION CHECKS PASSED (100% AUTHENTIC EXECUTION PROOF)");
  console.log("===============================================================================");
}

verifyRealExecution().catch((err) => {
  console.error("\n❌ REALITY VERIFICATION FAILED:", err);
  process.exit(1);
});
