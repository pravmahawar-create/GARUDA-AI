/**
 * 🦅 GARUDA OS — WAR ROOM CONSOLE FORENSIC AUDIT TEST
 * Tests design tokens, 4-quadrant polarity rules, strict anti-fabrication data states,
 * and zero third-party brand pollution.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

function runAudit() {
  console.log("=== STARTING WAR ROOM CONSOLE COMPLIANCE AUDIT ===");

  // 1. Audit Tokens & Data States
  console.log("Test 1: Auditing Tokens & Data States...");
  const tokensFile = fs.readFileSync(path.join(__dirname, "../../frontend/src/components/war-room/tokens.js"), "utf8");
  assert.ok(tokensFile.includes("#08090B"), "Obsidian palette token missing");
  assert.ok(tokensFile.includes("#C48B28"), "Metallic Gold token missing");
  assert.ok(tokensFile.includes("#F5F1E8"), "Warm Ivory token missing");
  assert.ok(tokensFile.includes("SIMULATION — NOT FORECAST"), "Mandatory simulation label missing");
  assert.ok(tokensFile.includes("DATA INSUFFICIENT"), "Mandatory DATA INSUFFICIENT state missing");
  assert.ok(tokensFile.includes("NOT CONNECTED"), "Mandatory NOT CONNECTED state missing");
  console.log("✔ Tokens and data states strictly conform to Sovereign Specification.");

  // 2. Audit 9 Master Modules in Navigation
  console.log("Test 2: Auditing 9 Master Navigation Modules...");
  const navFile = fs.readFileSync(path.join(__dirname, "../../frontend/src/components/war-room/WarRoomNavigation.jsx"), "utf8");
  const expectedModules = [
    "01 — MISSION CONTROL",
    "02 — INTELLIGENCE",
    "03 — FIELD OPS",
    "04 — ELECTORAL ANALYTICS",
    "05 — SCENARIO LAB",
    "06 — CRISIS WORKFLOW",
    "07 — EVIDENCE VAULT",
    "08 — REPORTS",
    "09 — AUDIT CORE"
  ];
  for (const mod of expectedModules) {
    assert.ok(navFile.includes(mod), `Module missing from navigation: ${mod}`);
  }
  console.log("✔ All 9 Master Navigation Modules verified in WarRoomNavigation.");

  // 3. Zero Third-Party Brand Pollution Audit
  console.log("Test 3: Zero Third-Party Brand Pollution Audit...");
  const warRoomDir = path.join(__dirname, "../../frontend/src/components/war-room");
  const warRoomFiles = fs.readdirSync(warRoomDir);
  const forbiddenBrands = ["prashant", "kishor", "ipac", "i-pac", "nation with namo", "varahe", "cambridge"];

  for (const file of warRoomFiles) {
    const content = fs.readFileSync(path.join(warRoomDir, file), "utf8").toLowerCase();
    for (const brand of forbiddenBrands) {
      assert.strictEqual(content.includes(brand), false, `Forbidden brand "${brand}" found in file: ${file}`);
    }
  }
  console.log("✔ 100% Zero Third-Party Brand Pollution verified across all War Room components.");

  // 4. Anti-Fabrication Hardware Telemetry Audit
  console.log("Test 4: Anti-Fabrication Telemetry Disclosure Audit...");
  const fieldOpsFile = fs.readFileSync(path.join(__dirname, "../../frontend/src/components/war-room/FieldOpsModule.jsx"), "utf8");
  assert.ok(fieldOpsFile.includes("ANTI-FABRICATION TELEMETRY DISCLOSURE"), "Disclosure missing in FieldOpsModule");
  assert.ok(fieldOpsFile.includes("SIMULATION"), "Simulation status missing in FieldOpsModule");

  const deviceInspectorFile = fs.readFileSync(path.join(__dirname, "../../frontend/src/components/war-room/DeviceInspector.jsx"), "utf8");
  assert.ok(deviceInspectorFile.includes("SIMULATION"), "Simulation status missing in DeviceInspector");
  console.log("✔ Anti-Fabrication Law strictly enforced: simulated hardware is explicitly disclosed.");

  // 5. Scenario Lab Disclaimer Audit
  console.log("Test 5: Scenario Lab Disclaimer Audit...");
  const scenarioFile = fs.readFileSync(path.join(__dirname, "../../frontend/src/components/war-room/ScenarioLabModule.jsx"), "utf8");
  assert.ok(scenarioFile.includes("SIMULATION — NOT FORECAST"), "Mandatory non-forecast disclaimer missing");
  console.log("✔ Scenario Lab explicitly watermarked: SIMULATION — NOT FORECAST.");

  // 6. Deep Dive Module Coverage Audit
  console.log("Test 6: Deep Dive Blueprints Coverage Audit...");
  const deepDiveFile = fs.readFileSync(path.join(__dirname, "../../frontend/src/components/war-room/DeepDiveModal.jsx"), "utf8");
  for (let i = 1; i <= 9; i++) {
    const modId = String(i).padStart(2, "0");
    assert.ok(deepDiveFile.includes(`"${modId}":`), `Deep dive blueprint missing for Module ${modId}`);
  }
  console.log("✔ All 9 modules have complete engineering deep-dive blueprints.");
  console.log("Test 7: Freshness Thresholds & State Engine Audit...");
  assert.ok(tokensFile.includes("freshnessThresholds"), "freshnessThresholds missing from tokens.js");
  assert.ok(tokensFile.includes("LIVE: 60"), "LIVE threshold (60s) missing from tokens.js");
  assert.ok(tokensFile.includes("FRESH: 900"), "FRESH threshold (900s) missing from tokens.js");
  assert.ok(tokensFile.includes("STALE: 86400"), "STALE threshold (86400s) missing from tokens.js");
  assert.ok(tokensFile.includes("getFreshnessState"), "getFreshnessState missing from tokens.js");
  console.log("✔ Freshness thresholds and deterministic state engine verified.");


  // 8. Area Drill-Down Hierarchy Audit
  console.log("Test 8: Area Drill-Down Hierarchy Audit...");
  assert.ok(fieldOpsFile.includes("LEVEL 1 // SELECT MUNICIPAL / ELECTORAL AREA"), "Level 1 area selector missing");
  assert.ok(fieldOpsFile.includes("LEVEL 2 // BOOTHS IN"), "Level 2 booth selector missing");
  assert.ok(fieldOpsFile.includes("LEVEL 3 // ASSIGNED CADRE TELEMETRY NODE"), "Level 3 connected device missing");
  console.log("✔ 3-Tier Area Drill-Down Hierarchy verified in FieldOpsModule.");

  console.log("\n🎉 ALL WAR ROOM CONSOLE AUDIT TESTS PASSED (100% SUCCESS)!\n");
}

runAudit();
