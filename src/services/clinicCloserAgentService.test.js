const assert = require("assert");
const fs = require("fs");
const path = require("path");
const clinicCloserAgent = require("./clinicCloserAgentService");

async function runTests() {
  console.log("=== Testing Clinic Closer Agent Service ===");

  // Test 1: Profile Retrieval
  const profile = clinicCloserAgent.getProfile("STEP3_CLINIC_SANGHVI_MUMBAI");
  assert(profile, "Profile should exist");
  assert.strictEqual(profile.doctorName, "Dr. Aashal Sanghvi");
  console.log("✔ Test 1: Profile retrieval by ref passed");

  // Test 2: Profile Retrieval by Phone
  const profileByPhone = clinicCloserAgent.getProfile("9819801940");
  assert(profileByPhone, "Profile should exist by phone");
  assert.strictEqual(profileByPhone.businessName, "Sanghvi's Dental Clinic");
  console.log("✔ Test 2: Profile retrieval by phone passed");

  // Test 3: Pricing Inquiry
  const priceResult = await clinicCloserAgent.handleMessage({
    ref: "STEP3_CLINIC_SANGHVI_MUMBAI",
    message: "What are the charges and cost for this setup?"
  });
  assert.strictEqual(priceResult.intent, "PRICING_INQUIRY");
  assert(priceResult.reply.includes("40,000"), "Reply should include pricing");
  console.log("✔ Test 3: Pricing inquiry handling passed");

  // Test 4: Timeline Inquiry
  const timeResult = await clinicCloserAgent.handleMessage({
    ref: "STEP3_CLINIC_MEDIDENT_INDORE",
    message: "Kitne din me ready ho jayega?"
  });
  assert.strictEqual(timeResult.intent, "TIMELINE_INQUIRY");
  assert(timeResult.reply.includes("48 hours"), "Reply should mention 48 hours");
  console.log("✔ Test 4: Timeline inquiry handling passed");

  // Test 5: "Yes Interested" Intent & Telegram Escalation
  const interestResult = await clinicCloserAgent.handleMessage({
    ref: "STEP3_CLINIC_KANUPRIYA_KOLKATA",
    message: "Yes I am interested, call me for demo"
  });
  assert.strictEqual(interestResult.intent, "DEAL_INTERESTED_ESCALATED");
  assert.strictEqual(interestResult.escalated, true);
  assert(interestResult.reply.includes("Praveen Mahawar"), "Reply should introduce Founder Praveen");

  // Verify hot deals file was created and contains the deal
  const hotDealsPath = path.join(__dirname, "..", "..", "data", "hot-clinic-deals.json");
  assert(fs.existsSync(hotDealsPath), "Hot deals file should exist");
  const deals = JSON.parse(fs.readFileSync(hotDealsPath, "utf8"));
  const lastDeal = deals[deals.length - 1];
  assert.strictEqual(lastDeal.businessName, "Dr Kanupriya Advanced Dentistry");
  console.log("✔ Test 5: Hot deal escalation and persistence passed");

  console.log("\n🎉 ALL CLINIC CLOSER AGENT TESTS PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
