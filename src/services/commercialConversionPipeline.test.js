const assert = require("assert");
const clientProposalService = require("./clientProposalService");
const missionControlService = require("./missionControlService");

async function runTests() {
  console.log("Starting GARUDA Milestone 25: Commercial Conversion Pipeline Test Suite...\n");

  // --- 1. Proposal Creation & Policy Gate (Low-Risk vs High-Risk) ---
  console.log("--- 1. Proposal Creation & Autonomous Policy Gate ---");
  
  // 1a. Low-risk proposal <= ₹25,000
  const lowRiskProp = await clientProposalService.createProposal({
    title: "Build Next.js Landing Page with Stripe Payment Modal",
    requirements: "Responsive landing page with user checkout integration and automated receipt email",
    amount: 20000,
    currency: "INR",
    client: { name: "Sarah Connor", email: "sarah@cyberdyne.io", organization: "Cyberdyne Tech" },
    allowAutonomousAuthorization: true
  });

  assert(lowRiskProp.proposalId.startsWith("prop_"), "Proposal ID should start with prop_");
  assert.strictEqual(lowRiskProp.governance.policyTier, "LOW_RISK_TIER_1");
  assert.strictEqual(lowRiskProp.governance.autonomousAuthorized, true, "Low risk <= ₹25,000 should be autonomously authorized");
  assert.strictEqual(lowRiskProp.status, "APPROVED");
  assert.strictEqual(lowRiskProp.pricing.totalAmount, 20000);
  assert.strictEqual(lowRiskProp.pricing.depositAmount, 10000, "Deposit should be 50% (10,000 INR)");
  console.log("✔ PASS: Low-risk proposal (<= ₹25,000) created with autonomous policy approval");

  // 1b. Higher-value proposal > ₹25,000
  const highValueProp = await clientProposalService.createProposal({
    title: "Enterprise Multi-Tenant AI Agent RAG Pipeline",
    requirements: "Full-stack enterprise RAG engine with vector database, user authentication, and admin telemetry",
    amount: 150000,
    currency: "INR",
    client: { name: "Arthur Dent", email: "arthur@hitchhiker.com" }
  }, { founderApproved: false });

  assert.strictEqual(highValueProp.governance.policyTier, "STANDARD_GOVERNED_TIER_2");
  assert.strictEqual(highValueProp.governance.autonomousAuthorized, false);
  assert.strictEqual(highValueProp.status, "WAITING_APPROVAL", "Proposal > ₹25,000 requires Founder approval");
  console.log("✔ PASS: High-value proposal (> ₹25,000) safely halted at WAITING_APPROVAL");

  // --- 2. Scope & Price Integrity (Multi-Currency) ---
  console.log("\n--- 2. Scope & Price Integrity (Multi-Currency) ---");
  const aedProp = await clientProposalService.createProposal({
    title: "Dubai Hotel WhatsApp Concierge & Booking Sync",
    requirements: "Automated WhatsApp bot integrating with hotel property management system",
    amount: 6000,
    currency: "AED",
    client: { name: "Tariq Al-Mansoor", organization: "Emirates Hospitality" }
  }, { founderApproved: true });

  assert.strictEqual(aedProp.pricing.currency, "AED");
  assert.strictEqual(aedProp.pricing.totalAmount, 6000);
  assert.strictEqual(aedProp.pricing.depositAmount, 3000);
  assert(aedProp.pricing.totalINR > 100000, "6000 AED should convert accurately to INR benchmark");
  assert(aedProp.governance.scopeHash.length === 64, "Scope must generate valid SHA-256 hash");
  console.log("✔ PASS: Multi-currency pricing (AED) and SHA-256 scope hash integrity verified");

  // --- 3. Public Proposal View Sanitization ---
  console.log("\n--- 3. Public Proposal View Sanitization ---");
  const publicView = await clientProposalService.getProposal(lowRiskProp.proposalId, { isPublicView: true });
  assert.strictEqual(publicView.proposalId, lowRiskProp.proposalId);
  assert.strictEqual(publicView.status, "CLIENT_VIEWED", "Accessing public proposal should transition to CLIENT_VIEWED");
  assert.strictEqual(publicView.auditTrail, undefined, "Public view must strip internal audit trail");
  assert.strictEqual(publicView.governance, undefined, "Public view must strip internal governance policy");
  assert.strictEqual(typeof publicView.scopeIntegrity, "string", "Public view preserves verified scope integrity hash");
  console.log("✔ PASS: Public client proposal view sanitized; internal tokens & governance stripped");

  // --- 4. Client Proposal Acceptance ---
  console.log("\n--- 4. Client Proposal Acceptance ---");
  const acceptedProp = await clientProposalService.acceptProposal(lowRiskProp.proposalId, {
    name: "Sarah Connor",
    email: "sarah@cyberdyne.io",
    ip: "203.0.113.42"
  });
  assert.strictEqual(acceptedProp.status, "CLIENT_ACCEPTED");
  assert.strictEqual(acceptedProp.clientAcceptance.agreementConfirmed, true);
  assert.strictEqual(acceptedProp.clientAcceptance.signerName, "Sarah Connor");
  console.log("✔ PASS: Client acceptance recorded with timestamp and signature metadata");

  // --- 5. Anti-Fabrication Payment Truth Enforcement ---
  console.log("\n--- 5. Anti-Fabrication Payment Truth Enforcement ---");
  
  // 5a. Text claim "I paid via UPI" -> REJECTED
  const textClaim = await clientProposalService.recordDepositPayment(lowRiskProp.proposalId, {
    claimText: "I sent 10000 INR on UPI reference 994821",
    authoritative: false
  });
  assert.strictEqual(textClaim.success, false);
  assert.strictEqual(textClaim.verified, false);
  assert.strictEqual(textClaim.state, "PAYMENT_CLAIMED");
  assert.strictEqual(lowRiskProp.payment.depositStatus, "UNPAID", "Unverified claim must not mark deposit as paid");

  // 5b. Screenshot claim -> REJECTED as authoritative
  const screenshotClaim = await clientProposalService.recordDepositPayment(lowRiskProp.proposalId, {
    screenshot: "receipt_screenshot_base64_blob...",
    authoritative: false
  });
  assert.strictEqual(screenshotClaim.success, false);
  assert.strictEqual(screenshotClaim.state, "PAYMENT_EVIDENCE_UNVERIFIED");
  console.log("✔ PASS: Payment claims & screenshots strictly rejected by Anti-Fabrication Law");

  // --- 6. Authoritative Deposit Payment Verification & Automated Mission Kickoff ---
  console.log("\n--- 6. Authoritative Deposit Payment & Automated Mission Kickoff ---");
  const validDeposit = await clientProposalService.recordDepositPayment(lowRiskProp.proposalId, {
    paymentId: "pay_rzp_live_98124981",
    providerEvidence: "razorpay_hmac_signature_verified",
    amount: 10000,
    currency: "INR",
    authoritative: true
  });

  assert.strictEqual(validDeposit.success, true);
  assert.strictEqual(validDeposit.verified, true);
  assert.strictEqual(validDeposit.state, "PAYMENT_VERIFIED");
  assert.strictEqual(validDeposit.proposal.status, "IN_EXECUTION");
  assert.strictEqual(validDeposit.proposal.payment.depositStatus, "PAID");
  assert(validDeposit.proposal.missionId.startsWith("mission_"), "Verified deposit must trigger automated mission creation");
  console.log(`✔ PASS: Authoritative deposit verified; Governed Mission ${validDeposit.proposal.missionId} auto-initialized`);

  // --- 7. Milestone Delivery with Cryptographic SHA-256 Manifest ---
  console.log("\n--- 7. Milestone Delivery & QA Manifest ---");
  const deliveredProp = await clientProposalService.completeDelivery(lowRiskProp.proposalId, {
    artifacts: { code: "nextjs_landing_v1.0", tests: "24_passed" },
    releaseNotes: "Full responsive Next.js landing page with Stripe modal deployed",
    testResults: "24/24 Automated Test Assertions Passed"
  });
  assert.strictEqual(deliveredProp.status, "DELIVERY_READY");
  assert(deliveredProp.delivery.manifestHash.length === 64, "Delivery must contain SHA-256 manifest hash");
  console.log("✔ PASS: Milestone delivery recorded with cryptographic SHA-256 manifest");

  // --- 8. Final Client Sign-off & Final Settlement Payment ---
  console.log("\n--- 8. Final Client Sign-off & Final Settlement ---");
  const finalAccepted = await clientProposalService.recordFinalAcceptance(lowRiskProp.proposalId, {
    notes: "Everything tested and works great on our domain.",
    signature: "Sarah Connor"
  });
  assert.strictEqual(finalAccepted.status, "FINAL_ACCEPTED");

  const finalSettled = await clientProposalService.recordFinalPayment(lowRiskProp.proposalId, {
    paymentId: "pay_rzp_live_final_98124982",
    amount: 10000,
    authoritative: true
  });
  assert.strictEqual(finalSettled.status, "CLOSED");
  assert.strictEqual(finalSettled.finalPayment.verified, true);
  assert.strictEqual(finalSettled.milestones[1].status, "PAID");
  console.log("✔ PASS: Final client acceptance and final milestone settlement verified -> Status: CLOSED");

  // --- 9. Real Commercial Funnel Telemetry ---
  console.log("\n--- 9. Real Commercial Funnel Telemetry ---");
  const funnel = clientProposalService.getCommercialFunnelMetrics();
  assert(funnel.totalProposals >= 3, "Funnel should count all created proposals");
  assert(funnel.pipelineValueINR > 0, "Funnel pipeline value should be calculated");
  assert(funnel.depositsPaidINR > 0, "Funnel deposits paid should be tracked");
  assert(funnel.realizedRevenueINR >= 20000, "Funnel realized revenue must equal closed deals");
  assert.strictEqual(typeof funnel.conversionRates.proposalToAcceptanceRate, "number");
  console.log("✔ PASS: Commercial Funnel Telemetry reflects authentic database state without fabrication");

  console.log("\n🦅 ALL 9 COMMERCIAL CONVERSION PIPELINE TEST CASES PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Commercial Conversion Pipeline test failure:", err);
  process.exit(1);
});
