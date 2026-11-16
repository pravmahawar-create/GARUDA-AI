/**
 * 🦅 GARUDA AEGIS — MISSION 002B EXECUTION SCRIPT
 * 
 * Re-evaluate External Agentplace Target using the Calibrated & Hardened Evaluator
 * Authority: Founder Praveen Mahawar (founder_garuda)
 * Target: https://tspebf1ycyxc.run.agentplace.io/
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

require("dotenv").config();
const { MissionController } = require("../src/aegis/missionController");
const { EvidenceIntegrity } = require("../src/aegis/evidenceIntegrity");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("================================================================================");
  console.log("🦅 GARUDA AEGIS — MISSION 002B: LIVE EXTERNAL AGENT RE-EVALUATION");
  console.log("Authority: Founder Praveen Mahawar (founder_garuda)");
  console.log("Mission ID: AEGIS-MISSION-002B");
  console.log("Target: https://tspebf1ycyxc.run.agentplace.io/");
  console.log("Mode: EXTERNAL_AGENT (Agentplace Live Dental Care Assistant)");
  console.log("Doctrine: 100% Anti-Fabrication Law ('Show > Tell')");
  console.log("================================================================================\n");

  const missionConfig = {
    missionId: "AEGIS-MISSION-002B",
    targetUrl: "https://tspebf1ycyxc.run.agentplace.io/",
    scenarioIds: [
      "TRUTH-01",   // 1. Business information accuracy
      "MISSING-01", // 2. Unknown information handling
      "PRICE-01",   // 3. Fabricated pricing traps
      "INJECT-01",  // 4. Prompt injection resistance
      "LEAD-01",    // 5. Customer intent recognition
      "LEAD-02",    // 6. Lead capture behavior
      "PRIV-02",    // 7. Privacy and consent
      "APPT-01",    // 8. Appointment claims
      "HANDOFF-01", // 9. Human handoff
      "MEM-01",     // 10. Multi-turn context consistency
      "TOOL-01",    // 11. Tool execution claims
      "ERR-01",     // 12. Error recovery
      "TRUTH-02",   // 13. Response quality
      "SAFETY-01",  // 14. Safety boundaries
      "TERM-01"     // 15. Conversation termination and recovery
    ],
    headless: "new",
    launchTimeoutMs: 45000,
    turnTimeoutMs: 25000,
    settleMs: 1500,
    captureScreenshots: true,
    isolateScenarios: false,
    customSelectors: {
      input: "textarea",
      submit: 'button[aria-label="Send"]',
      messages: ".stage-canvas-page"
    }
  };

  const context = {
    founderApproved: true,
    authority: "Praveen Mahawar",
    reason: "Founder Praveen Mahawar authorized Mission 002B live external agent re-evaluation"
  };

  const controller = new MissionController();

  console.log(`[AEGIS-INIT] Commencing evaluation of ${missionConfig.scenarioIds.length} scenarios against target...`);
  const startTime = Date.now();

  try {
    const result = await controller.executeMission(missionConfig, context);

    console.log("\n================================================================================");
    console.log("🦅 AEGIS MISSION 002B COMPLETED");
    console.log(`Target Mode:          ${result.summary?.targetMode}`);
    console.log(`Mission Status:       ${result.status}`);
    console.log(`Composite Score:      ${result.overallScore}/100`);
    console.log(`Total Scenarios:      ${result.totalScenarios}`);
    console.log(`Passed (Clean):       ${result.passedScenarios}`);
    console.log(`Warned:               ${result.warnedScenarios}`);
    console.log(`Failed:               ${result.failedScenarios}`);
    console.log(`Defects Recorded:     ${result.defectsCount}`);
    console.log(`Total Duration:       ${Math.round((Date.now() - startTime) / 1000)} seconds`);
    console.log("================================================================================\n");

    console.log("--- SCENARIO EXECUTION BREAKDOWN ---");
    for (const r of result.summary.results) {
      console.log(`[${r.verdict}] ${r.scenarioId} | Score: ${r.score} | Category: ${r.category}`);
      if (r.turns && r.turns.length > 0) {
        for (const t of r.turns) {
          console.log(`   Turn ${t.turnIndex} User: "${t.userMessage}"`);
          console.log(`   Turn ${t.turnIndex} Agent: "${(t.agentResponse || "").slice(0, 120)}..." (${t.durationMs}ms)`);
        }
      }
      if (r.deterministic?.violations?.length > 0) {
        for (const v of r.deterministic.violations) {
          console.log(`   ⚠️ Violation [${v.severity}]: ${v.rule} | Actual: ${v.actual}`);
        }
      }
    }

    console.log("\n--- GENERATED FORENSIC ARTIFACTS ---");
    console.log(`JSON Report:     ${result.reports.jsonReport.path}`);
    console.log(`JSON SHA-256:    ${result.reports.jsonReport.sha256}`);
    console.log(`Markdown Report: ${result.reports.markdownReport.path}`);
    console.log(`MD SHA-256:      ${result.reports.markdownReport.sha256}`);
    console.log(`Manifest Path:   ${result.manifestPath}`);
    console.log(`Manifest SHA:    ${result.summary?.manifest?.manifestSignature}`);
    console.log(`Total Artifacts: ${result.summary?.manifest?.totalArtifacts}`);

    // Copy to root deliverables
    const rootMdPath = path.resolve(__dirname, "..", "GARUDA_AEGIS_MISSION_002B_REPORT.md");
    const rootJsonPath = path.resolve(__dirname, "..", "GARUDA_AEGIS_MISSION_002B_REPORT.json");

    fs.copyFileSync(result.reports.markdownReport.path, rootMdPath);
    fs.copyFileSync(result.reports.jsonReport.path, rootJsonPath);

    console.log(`Copied root report: ${rootMdPath}`);
    console.log(`Copied root JSON:   ${rootJsonPath}`);

    process.exit(0);
  } catch (err) {
    console.error("MISSION 002B FATAL ERROR:", err);
    process.exit(1);
  }
})();
