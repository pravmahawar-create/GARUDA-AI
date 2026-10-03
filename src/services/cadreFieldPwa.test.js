/**
 * 🦅 GARUDA OS — CADRE FIELD PWA & WAR ROOM FORENSIC INTEGRATION TESTS
 * Verifies:
 * 1. Field PWA Device Registration & Cryptographic Token Verification
 * 2. Safe Metadata Exposure (Zero secret/token leakage)
 * 3. Anti-Replay Clock-Skew Protection (> 5 minutes rejected)
 * 4. Hardware Metric Normalization (UNAVAILABLE preserved, zero hallucinated numbers)
 * 5. 12-Section Intelligence Dossier Citation Rigor (SOURCE, DATE, TRUTH STATE, METHODOLOGY, CONFIDENCE)
 * 6. Sovereign Flagship Commercial Plan (₹35,00,000 Milestone Contract)
 * 7. CyberShield Statutory Legal Notice Framing (BNS 2023, BSA 2023 Sec 63, IT Rules 2021)
 */

const assert = require("assert");
const { cadreDeviceTelemetryService } = require("./cadreDeviceTelemetryService");
const { constituencyIntelligenceService } = require("./constituencyIntelligenceService");
const { constituencyCommercialService } = require("./constituencyCommercialService");
const legalNoticeGenerator = require("../../scripts/cybershield/legal-notice-generator");

async function runCadreFieldPwaTests() {
  console.log("=== STARTING CADRE FIELD PWA & FORENSIC INTEGRATION TESTS ===");

  // TEST 1: Register Authorized Field Device
  console.log("Test 1: Field Device Registration & Token Hashing...");
  const regResult = cadreDeviceTelemetryService.registerDevice({
    deviceId: "GRD-TEST-CADRE-999",
    boothId: 99,
    areaId: "north-suburbs",
    agentId: "CADRE-TEST-999",
    agentName: "Field Test Agent",
    deviceToken: "secure_random_cadre_field_token_999",
    appVersion: "GARUDA-CADRE-PWA-v2.5.0"
  });
  assert.strictEqual(regResult.success, true);
  assert.strictEqual(regResult.deviceId, "GRD-TEST-CADRE-999");
  assert.strictEqual(regResult.boothId, 99);
  assert.strictEqual(regResult.authorizationStatus, "AUTHORIZED");
  console.log("✔ Field device registration verified.");

  // TEST 2: Safe Device Metadata Inspection (Zero Secret Leakage)
  console.log("Test 2: Safe Device Metadata Inspection (Zero Credential Exposure)...");
  const info = cadreDeviceTelemetryService.getDeviceInfo("GRD-TEST-CADRE-999");
  assert.ok(info, "Device info must exist");
  assert.strictEqual(info.deviceId, "GRD-TEST-CADRE-999");
  assert.strictEqual(info.boothId, 99);
  assert.strictEqual(info.authorizationStatus, "AUTHORIZED");
  // CRITICAL: verify no token or tokenHash is exposed in public info
  assert.strictEqual(info.plainToken, undefined, "plainToken must NOT be present in deviceInfo");
  assert.strictEqual(info.tokenHash, undefined, "tokenHash must NOT be present in deviceInfo");
  assert.strictEqual(info.deviceToken, undefined, "deviceToken must NOT be present in deviceInfo");
  console.log("✔ Zero credential exposure in public device info verified.");

  // TEST 3: Cryptographic Token Verification
  console.log("Test 3: Cryptographic Token Verification (Valid vs Invalid)...");
  const validAuth = cadreDeviceTelemetryService.verifyDevice({
    deviceId: "GRD-TEST-CADRE-999",
    deviceToken: "secure_random_cadre_field_token_999"
  });
  assert.strictEqual(validAuth.verified, true);
  assert.strictEqual(validAuth.deviceId, "GRD-TEST-CADRE-999");

  const invalidAuth = cadreDeviceTelemetryService.verifyDevice({
    deviceId: "GRD-TEST-CADRE-999",
    deviceToken: "wrong_tampered_token"
  });
  assert.strictEqual(invalidAuth.verified, false);
  assert.strictEqual(invalidAuth.code, "INVALID_CREDENTIALS");
  console.log("✔ Cryptographic token verification verified.");

  // TEST 4: Anti-Replay Defense (Reject timestamp older than 5 minutes)
  console.log("Test 4: Anti-Replay Defense (> 5 minutes clock-skew / replay)...");
  const expiredTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString(); // 6 mins ago
  const replayResult = cadreDeviceTelemetryService.ingestHeartbeat({
    deviceId: "GRD-TEST-CADRE-999",
    boothId: 99,
    timestamp: expiredTimestamp,
    deviceToken: "secure_random_cadre_field_token_999"
  });
  assert.strictEqual(replayResult.success, false);
  assert.strictEqual(replayResult.code, "TIMESTAMP_REJECTED");
  console.log("✔ Stale replay payload (>5m) successfully rejected.");

  // TEST 5: Hardware Metric Normalization (Preserve UNAVAILABLE, never guess)
  console.log("Test 5: Hardware Metric Normalization (Anti-Fabrication)...");
  const cleanHeartbeat = cadreDeviceTelemetryService.ingestHeartbeat({
    deviceId: "GRD-TEST-CADRE-999",
    boothId: 99,
    timestamp: new Date().toISOString(),
    battery: "UNAVAILABLE",
    networkType: "UNAVAILABLE",
    signalStrength: "UNAVAILABLE",
    deviceToken: "secure_random_cadre_field_token_999"
  });
  assert.strictEqual(cleanHeartbeat.success, true);
  assert.strictEqual(cleanHeartbeat.freshness, "LIVE");

  const boothRecord = cadreDeviceTelemetryService.getDeviceForBooth(99);
  assert.strictEqual(boothRecord.truthState, "REAL");
  assert.strictEqual(boothRecord.telemetry.battery, "UNAVAILABLE");
  assert.strictEqual(boothRecord.telemetry.networkType, "UNAVAILABLE");
  assert.strictEqual(boothRecord.telemetry.signalStrength, "UNAVAILABLE");
  console.log("✔ UNAVAILABLE metric normalization preserved without fabrication.");

  // TEST 6: 12-Section Strategic Dossier Rigor & Citations
  console.log("Test 6: 12-Section Dossier Citation Rigor (SOURCE, DATE, TRUTH STATE, METHODOLOGY, CONFIDENCE)...");
  const brief = constituencyIntelligenceService.generateConstituencyBrief({
    id: "thane-148",
    name: "Thane (148)",
    canonicalName: "148 - Thane Assembly Constituency",
    district: "Thane",
    state: "Maharashtra",
    type: "Urban Mega-Hub"
  });

  assert.strictEqual(brief.sections.length, 12, "Must contain exactly 12 intelligence sections");
  for (const sec of brief.sections) {
    assert.ok(sec.title && sec.title.length > 3, "Section must have valid title");
    assert.ok(sec.content && sec.content.length > 10, "Section must have valid content");
    assert.ok(sec.source && sec.source.length > 2, `Section '${sec.title}' must cite SOURCE`);
    assert.ok(sec.date && sec.date.length >= 4, `Section '${sec.title}' must cite DATE`);
    assert.ok(sec.truthState && ["REAL", "VERIFIED", "CALCULATED", "INFERRED", "PARTIAL", "UNAVAILABLE"].includes(sec.truthState), `Section '${sec.title}' must have valid TRUTH STATE`);
    assert.ok(sec.methodology && sec.methodology.length > 5, `Section '${sec.title}' must cite METHODOLOGY`);
    assert.ok(sec.confidence && sec.confidence.length > 2, `Section '${sec.title}' must cite CONFIDENCE`);
  }
  console.log("✔ All 12 sections strictly document SOURCE, DATE, TRUTH STATE, METHODOLOGY, and CONFIDENCE.");

  // TEST 7: Commercial Sovereign Flagship (₹35,00,000 Milestone Retainer)
  console.log("Test 7: Sovereign Flagship Commercial Plan (₹35,00,000 Retainer)...");
  const plansData = constituencyCommercialService.getPlans("INR");
  const flagship = plansData.plans.find(p => p.id === "garuda-flagship");
  assert.ok(flagship, "garuda-flagship plan must exist in catalog");
  assert.strictEqual(flagship.price, 3500000, "Price must be exactly Rs. 35,00,000");
  assert.ok(flagship.milestones, "Milestones structure must be defined");
  assert.ok(flagship.milestones.onboarding.includes("50%"), "Onboarding milestone must be 50%");
  assert.ok(flagship.milestones.operationalSprint.includes("30%"), "Sprint milestone must be 30%");
  assert.ok(flagship.milestones.delivery.includes("20%"), "Delivery milestone must be 20%");
  assert.ok(flagship.clientAdSpendNotice.includes("billed directly by Meta"), "Ad spend separation notice required");
  console.log("✔ Sovereign Flagship (₹35L) with 50/30/20 milestone structure verified.");

  // TEST 8: CyberShield Statutory Framing (BNS 2023, BSA 2023 Sec 63, IT Rules 2021)
  console.log("Test 8: CyberShield Statutory Framing & Draft Disclaimer...");
  const mockDossier = {
    incidentId: "CS-TEST-2026-001",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    captureTimestamp: "2026-10-03T12:00:00Z",
    rawPayload: {
      targetHandle: "official_candidate",
      perpetratorHandle: "hostile_troll_99",
      perpetratorId: "troll_id_999",
      platform: "instagram",
      postUrl: "https://instagram.com/p/test123",
      commentId: "cmt_999888",
      rawText: "Unlawful defamatory threat statement"
    },
    classification: {
      severityLevel: 4,
      legalSectionsTriggered: ["BNS 2023 Section 351", "IT Act Section 67"]
    }
  };

  const warning = legalNoticeGenerator.generateTrollWarning(mockDossier);
  assert.ok(warning.includes("SYSTEM-GENERATED DRAFT — REQUIRES INDEPENDENT LEGAL REVIEW"), "Troll warning must carry disclaimer banner");
  assert.ok(warning.includes("Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)"), "Warning must cite Section 63 BSA 2023");

  const grievance = legalNoticeGenerator.generateGrievanceNotice(mockDossier);
  assert.ok(grievance.includes("SYSTEM-GENERATED DRAFT — REQUIRES LEGAL REVIEW BEFORE TRANSMISSION"), "Grievance notice must carry disclaimer banner");
  assert.ok(grievance.includes("Bharatiya Nyaya Sanhita, 2023 (BNS 2023)"), "Grievance notice must cite BNS 2023");
  assert.ok(grievance.includes("Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023)"), "Grievance notice must cite BSA 2023 Section 63");

  const complaint = legalNoticeGenerator.generateCyberCrimeDraft(mockDossier);
  assert.ok(complaint.complaintDraft.disclaimer.includes("SYSTEM-GENERATED DRAFT"), "Complaint draft must carry disclaimer");
  assert.ok(complaint.complaintDraft.statutoryAct.includes("Section 63 Bharatiya Sakshya Adhiniyam, 2023"), "Complaint draft must cite BSA 2023");
  console.log("✔ CyberShield statutory framing and mandatory disclaimers verified.");

  console.log("\n🎉 ALL 8 CADRE FIELD PWA & FORENSIC INTEGRATION TESTS PASSED (100% SUCCESS)!");
}

if (require.main === module) {
  runCadreFieldPwaTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}

module.exports = { runCadreFieldPwaTests };
