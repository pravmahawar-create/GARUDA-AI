const assert = require("assert");
const fs = require("fs");
const path = require("path");
const pipelineService = require("./unifiedCommercialPipelineService");

async function runPipelineTests() {
  console.log("Starting GARUDA Mission M38: Autonomous Revenue Engine & 12-Stage Pipeline Test Suite...\n");

  pipelineService.clearPipelineStore();

  // --- Stage 1, 2, 3: DISCOVER, ATTRACT, CAPTURE ---
  console.log("--- Test 1: Ingesting Commercial Lead (Discover, Attract, Capture) ---");
  const ingestRes = pipelineService.ingestLead({
    businessName: "Maa Sharda Hardware & Building Materials",
    contactName: "Sunil Verma",
    phone: "9827112345",
    email: "sharda.hardware@example.com",
    category: "hardware_building_materials",
    location: "Raipur, Chhattisgarh",
    painPoint: "Daily cement & sariya billing calculation takes too long, notebook credit ledger gets messy",
    source: "inbound_web"
  });

  assert.strictEqual(ingestRes.success, true);
  assert.strictEqual(ingestRes.stage, "CAPTURE");
  assert.ok(ingestRes.pipelineId.startsWith("pipe_"));
  assert.strictEqual(ingestRes.pipeline.prospect.businessName, "Maa Sharda Hardware & Building Materials");
  assert.strictEqual(ingestRes.pipeline.trackId, "TRACK_A_BILLING_RETAIL");
  assert.strictEqual(ingestRes.pipeline.history.length, 3);
  console.log("✔ PASS: Lead ingested across DISCOVER → ATTRACT → CAPTURE stages");

  // Idempotency check: submitting same lead twice returns existing record
  const duplicateRes = pipelineService.ingestLead({
    businessName: "Maa Sharda Hardware & Building Materials",
    contactName: "Sunil Verma",
    phone: "9827112345",
    email: "sharda.hardware@example.com"
  });
  assert.strictEqual(duplicateRes.isExisting, true);
  assert.strictEqual(duplicateRes.pipelineId, ingestRes.pipelineId);
  console.log("✔ PASS: Lead deduplication & idempotency verified");

  const pipelineId = ingestRes.pipelineId;

  // --- Stage 4: QUALIFY ---
  console.log("\n--- Test 2: Qualifying Lead ---");
  const qualRes = pipelineService.qualifyLead(pipelineId);
  assert.strictEqual(qualRes.success, true);
  assert.strictEqual(qualRes.qualification.status, "QUALIFIED");
  assert(qualRes.qualification.score >= 60, "Lead score should pass qualification threshold");
  assert.strictEqual(qualRes.stage, "QUALIFY");
  console.log(`✔ PASS: Lead qualified with score ${qualRes.qualification.score}/100`);

  // --- Stage 5: DEMONSTRATE ---
  console.log("\n--- Test 3: Demonstrating Capabilities ---");
  const demoRes = pipelineService.prepareDemonstration(pipelineId);
  assert.strictEqual(demoRes.success, true);
  assert.strictEqual(demoRes.demonstration.demoOffered, true);
  assert.ok(demoRes.demonstration.demoUrl.includes("QuickStart_Card_Hindi.pdf"));
  assert.strictEqual(demoRes.stage, "DEMONSTRATE");
  console.log("✔ PASS: Demonstration materials prepared and linked");

  // --- Stage 6: PROPOSE ---
  console.log("\n--- Test 4: Generating Proposal ---");
  const propRes = pipelineService.generateProposal(pipelineId, { pricingType: "one_time_pilot" });
  assert.strictEqual(propRes.success, true);
  assert.strictEqual(propRes.proposal.quotedAmountINR, 1999);
  assert.strictEqual(propRes.proposal.pricingType, "one_time_pilot");
  assert.strictEqual(propRes.stage, "PROPOSE");
  console.log("✔ PASS: Commercial pilot proposal generated for ₹1,999 (one_time_pilot)");

  // --- Stage 7: CHECKOUT ---
  console.log("\n--- Test 5: Initiating Checkout ---");
  const checkRes = pipelineService.initiateCheckout(pipelineId);
  assert.strictEqual(checkRes.success, true);
  assert.strictEqual(checkRes.checkout.upiQrGenerated, true);
  assert.ok(checkRes.checkout.upiString.startsWith("upi://pay"));
  assert.strictEqual(checkRes.checkout.amountINR, 1999);
  assert.strictEqual(checkRes.stage, "CHECKOUT");
  console.log("✔ PASS: Standard NPCI UPI payload & checkout parameters generated");

  // --- Stage 8: VERIFY_PAYMENT (Anti-Fabrication Gate) ---
  console.log("\n--- Test 6: Anti-Fabrication Payment Truth Gate ---");
  
  // 6a. Text claim or screenshot must be REJECTED
  const fakeClaimRes = pipelineService.verifyPayment(pipelineId, {
    claimText: "Maine 1999 rupaye bhej diye hain",
    screenshot: "fake_screenshot_blob"
  });
  assert.strictEqual(fakeClaimRes.success, false);
  assert.strictEqual(fakeClaimRes.verified, false);
  assert.strictEqual(fakeClaimRes.error, "PAYMENT_NOT_VERIFIED");
  console.log("✔ PASS: Casual text payment claims and screenshots strictly blocked");

  // 6b. Delivery must be BLOCKED if payment is not verified
  assert.throws(() => {
    pipelineService.deliverProduct(pipelineId);
  }, /Anti-Fabrication Law Violation/);
  console.log("✔ PASS: Delivery attempt blocked before authoritative payment verification");

  // 6c. Authoritative bank payment verification
  const validPaymentRes = pipelineService.verifyPayment(pipelineId, {
    utr: "428732348245",
    amountINR: 1999,
    authoritative: true,
    verifier: "founder_praveen"
  });
  assert.strictEqual(validPaymentRes.success, true);
  assert.strictEqual(validPaymentRes.verified, true);
  assert.strictEqual(validPaymentRes.stage, "VERIFY_PAYMENT");
  assert.strictEqual(validPaymentRes.payment.amountPaidINR, 1999);
  assert.strictEqual(validPaymentRes.payment.utr, "428732348245");
  console.log("✔ PASS: Authoritative bank UTR verified and credited cleanly");

  // --- Stage 9: DELIVER ---
  console.log("\n--- Test 7: Delivering Verified Release Package ---");
  const delivRes = pipelineService.deliverProduct(pipelineId);
  assert.strictEqual(delivRes.success, true);
  assert.strictEqual(delivRes.delivery.delivered, true);
  assert.ok(delivRes.delivery.licenseKey.startsWith("GRD-LIC-"));
  assert.strictEqual(delivRes.delivery.manifest.artifacts.length, 2);
  assert.strictEqual(
    delivRes.delivery.manifest.artifacts[0].sha256,
    "28a57588aafdb8b77e6e4ca415ee43724db0ab02db17d1a95c0f1410cffb4eab",
    "Delivered APK must match verified SHA-256 hash"
  );
  assert.strictEqual(delivRes.stage, "DELIVER");
  console.log("✔ PASS: Delivery manifest generated with authentic SHA-256 release artifacts");

  // --- Stage 10: ONBOARD ---
  console.log("\n--- Test 8: Merchant Onboarding Execution ---");
  const onbRes = pipelineService.completeOnboarding(pipelineId);
  assert.strictEqual(onbRes.success, true);
  assert.strictEqual(onbRes.onboarding.status, "COMPLETED");
  assert.strictEqual(onbRes.onboarding.checklistCompleted, 7);
  assert.strictEqual(onbRes.onboarding.voiceCommandsTested.length, 5);
  assert.strictEqual(onbRes.stage, "ONBOARD");
  console.log("✔ PASS: Merchant onboarding completed with 7-step checklist and 5 Hindi voice patterns");

  // --- Stage 11: RETAIN ---
  console.log("\n--- Test 9: Merchant Retention & Periodic Backup Schedule ---");
  const retRes = pipelineService.scheduleRetention(pipelineId);
  assert.strictEqual(retRes.success, true);
  assert.strictEqual(retRes.retention.backupReminderActive, true);
  assert.strictEqual(retRes.stage, "RETAIN");
  console.log("✔ PASS: Automatic retention schedule & offline backup reminder activated");

  // --- Stage 12: UPSELL ---
  console.log("\n--- Test 10: Upsell Expansion Proposal ---");
  const upsellRes = pipelineService.triggerUpsell(pipelineId, "MULTI_DEVICE_SYNC");
  assert.strictEqual(upsellRes.success, true);
  assert.strictEqual(upsellRes.upsell.eligible, true);
  assert.strictEqual(upsellRes.upsell.upsellItem.priceINR, 999);
  assert.strictEqual(upsellRes.stage, "UPSELL");
  console.log("✔ PASS: Natural upsell expansion offer triggered (Multi-Device Sync @ ₹999)");

  // --- Test 11: Durable Disk Persistence & Reality Metrics ---
  console.log("\n--- Test 11: Durable Disk Persistence & Reality Metrics ---");
  const metrics = pipelineService.getPipelineMetrics();
  assert.strictEqual(metrics.totalOpportunitiesCaptured, 1);
  assert.strictEqual(metrics.paidDealsCount, 1);
  assert.strictEqual(metrics.totalRevenueVerifiedINR, 1999);
  assert.strictEqual(metrics.countsByStage.UPSELL, 1);

  // Check physical file on disk
  const diskPath = path.join(__dirname, "..", "..", "data", "garuda-commercial-pipeline.json");
  assert.ok(fs.existsSync(diskPath), "Durable pipeline disk file must exist");
  const rawDiskData = JSON.parse(fs.readFileSync(diskPath, "utf8"));
  assert.strictEqual(rawDiskData.length, 1);
  assert.strictEqual(rawDiskData[0].pipelineId, pipelineId);
  assert.strictEqual(rawDiskData[0].payment.amountPaidINR, 1999);
  console.log("✔ PASS: Durable JSON storage verified on disk; reality metrics strictly match actual verified payment");

  console.log("\n🦅 ALL 12-STAGE AUTONOMOUS REVENUE ENGINE PIPELINE TESTS PASSED CLEANLY!");
}

runPipelineTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
