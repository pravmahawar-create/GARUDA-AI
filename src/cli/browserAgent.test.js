/**
 * 🦅 GARUDA CLI — BROWSER AGENT & WEB RESEARCH UNIT TESTS (PART G, H, J)
 * 
 * Verifies:
 * - G1: Browser Tool Abstraction (open, click, type, select, scroll, extract, screenshot)
 * - G2: Closed-Loop Observation & Verification
 * - G3: Train-Ticket Scenario (Indore to Delhi on 15 Oct, AC 2-Tier)
 * - G3/G5: Irreversible Booking Confirmation Gate (Payment & OTP user-controlled)
 * - G5: Domain Safety Policy (Blocked domains)
 * - Part H: Web Research Engine (Quick Lookup vs Deep Research with source citations)
 * - Part J: Anti-Fabrication evidence labeling (VERIFIED, PARTIAL, INFERRED, UNKNOWN)
 */

const assert = require("assert");
const {
  BrowserToolAbstraction,
  BrowserObservationLoop,
  TrainTicketAssistant,
  BrowserSafetyPolicy,
  WebResearchEngine
} = require("./browserAgent");

console.log("\n=======================================================");
console.log("🦅 GARUDA CLI BROWSER AGENT & RESEARCH TEST MATRIX");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

// ==========================================
// 1. Browser Tool Abstraction & Safety Policy
// ==========================================
console.log("--- 1. Browser Tool Abstraction & Safety ---");
testAsync("BrowserToolAbstraction opens safe URL and blocks malicious domain", async () => {
  const browser = new BrowserToolAbstraction();

  // Safe domain
  const safeRes = await browser.open("https://irctc.co.in");
  assert.strictEqual(safeRes.success, true);
  assert.ok(safeRes.url.includes("irctc.co.in"));

  // Blocked domain
  const blockedRes = await browser.open("https://malware.com/payload");
  assert.strictEqual(blockedRes.success, false);
  assert.strictEqual(blockedRes.status, "BLOCKED");
});

test("BrowserSafetyPolicy classifies purchase and payment as CONFIRM_REQUIRED", () => {
  const r1 = BrowserSafetyPolicy.classifyAction("purchase");
  assert.strictEqual(r1.level, "CONFIRM_REQUIRED");

  const r2 = BrowserSafetyPolicy.classifyAction("payment");
  assert.strictEqual(r2.level, "CONFIRM_REQUIRED");

  const r3 = BrowserSafetyPolicy.classifyAction("scroll");
  assert.strictEqual(r3.level, "SAFE");
});

// ==========================================
// 2. Closed-Loop Browser Observation
// ==========================================
console.log("\n--- 2. Browser Closed-Loop Observation ---");
testAsync("BrowserObservationLoop verifies element interaction state", async () => {
  const browser = new BrowserToolAbstraction();
  await browser.open("https://indianrail.gov.in");

  const loop = new BrowserObservationLoop(browser);
  const actRes = await loop.executeAndVerify("click", { selector: "#search-btn" });

  assert.strictEqual(actRes.verified, true);
  assert.strictEqual(actRes.evidenceStatus, "VERIFIED");
});

// ==========================================
// 3. Train Ticket Scenario (G3 Flagship Scenario)
// ==========================================
console.log("\n--- 3. Train-Ticket Assistant Scenario (Indore -> Delhi, 15 Oct, 2A) ---");
test("TrainTicketAssistant accurately parses natural Hindi/Hinglish query", () => {
  const query = "15 October ko Indore se Delhi ki trains check karo. AC 2-tier options batao.";
  const parsed = TrainTicketAssistant.parseTravelQuery(query);

  assert.strictEqual(parsed.origin, "Indore (INDB)");
  assert.strictEqual(parsed.destination, "Delhi (NDLS)");
  assert.strictEqual(parsed.date, "15 October");
  assert.strictEqual(parsed.classPreference, "AC 2-Tier (2A)");
  assert.strictEqual(parsed.intent, "SEARCH");
});

test("TrainTicketAssistant searches and returns structured verified train options", () => {
  const querySpec = TrainTicketAssistant.parseTravelQuery("15 October ko Indore se Delhi ki trains check karo. AC 2-tier options batao.");
  const searchResults = TrainTicketAssistant.searchTrains(querySpec);

  assert.strictEqual(searchResults.status, "VERIFIED");
  assert.ok(searchResults.results.length >= 3);

  const train1 = searchResults.results[0];
  assert.strictEqual(train1.trainNumber, "12415");
  assert.ok(train1.trainName.includes("Intercity SF"));
  assert.strictEqual(train1.classes["2A"].evidenceLabel, "VERIFIED");
  assert.ok(train1.classes["2A"].status.includes("AVAILABLE"));
  assert.ok(train1.classes["2A"].fare.includes("1,845"));
});

test("TrainTicketAssistant booking requires human confirmation and never auto-pays", () => {
  const train = {
    trainNumber: "12415",
    trainName: "Indore Intercity",
    departure: "17:10",
    arrival: "06:20",
    classSelected: "2A",
    fare: "₹1,845"
  };

  // Without explicit approval
  const gateUnapproved = TrainTicketAssistant.prepareBookingGate(train, { names: ["Praveen Mahawar"] });
  assert.strictEqual(gateUnapproved.status, "CONFIRM_REQUIRED");
  assert.ok(gateUnapproved.message.includes("IRREVERSIBLE FINANCIAL TRANSACTION GATE"));
  assert.ok(gateUnapproved.gateDetails.sensitiveControl.includes("user control"));

  // With user approval -> Still preserves payment step for user
  const gateApproved = TrainTicketAssistant.prepareBookingGate(train, { names: ["Praveen Mahawar"] }, { approved: true });
  assert.strictEqual(gateApproved.status, "APPROVED_FOR_USER_CHECKOUT");
  assert.ok(gateApproved.message.includes("Handing over to user for OTP / Payment authorization"));
});

// ==========================================
// 4. Web Research Engine & Anti-Fabrication Citations
// ==========================================
console.log("\n--- 4. Web Research Engine & Anti-Fabrication ---");
testAsync("WebResearchEngine distinguishes quick lookup from deep research with citations", async () => {
  const research = new WebResearchEngine();

  // Quick Lookup
  const quick = await research.quickLookup("train availability status");
  assert.strictEqual(quick.mode, "QUICK_LOOKUP");
  assert.strictEqual(quick.evidenceLabel, "VERIFIED");
  assert.ok(quick.citations.length >= 1);

  // Deep Research
  const deep = await research.deepResearch("Indian Railways Tatkal ticket allocation algorithms");
  assert.strictEqual(deep.mode, "DEEP_RESEARCH");
  assert.strictEqual(deep.evidenceLabel, "VERIFIED");
  assert.ok(deep.methodology.length >= 3);
  assert.ok(deep.citations.some(c => c.evidenceLabel === "VERIFIED"));
});

(async () => {
  console.log(`\n=======================================================`);
  console.log(`BROWSER AGENT SUITE SUMMARY: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  console.log(`=======================================================\n`);

  if (failed > 0) process.exit(1);
})();
