/**
 * 🦅 GARUDA AEGIS — MISSION CONTROLLER
 * 
 * Top-Level Autonomous Orchestration Engine for GARUDA AEGIS:
 * 1. Accepts founder-authorized evaluation missions.
 * 2. Enforces DevelopmentApprovalGate and target authorization.
 * 3. Initializes sessions, browser drivers, and evidence collectors.
 * 4. Executes multi-turn scenario packs across the target agent.
 * 5. Coordinates Layer A (Deterministic) and Layer B (AI Cascade) evaluation auditors.
 * 6. Generates cryptographic SHA-256 evidence manifests and forensic reports.
 * 7. Inscribes mission memory synapses into persistent GARUDA memory.
 * 
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const { ExternalAgentConnector } = require("./externalAgentConnector");
const { BrowserInteractionEngine } = require("./browserInteractionEngine");
const { ScenarioEngine } = require("./scenarioEngine");
const { EvaluatorOrchestrator } = require("./evaluatorOrchestrator");
const { EvidenceCollector } = require("./evidenceCollector");
const { ReportGenerator } = require("./reportGenerator");
const { RegressionEngine } = require("./regressionEngine");
const ApprovalGate = require("../../scripts/dev-agent/core/DevelopmentApprovalGate");

class MissionController {
  constructor(options = {}) {
    this.approvalGate = options.approvalGate || new ApprovalGate();
    this.connector = options.connector || new ExternalAgentConnector(options);
    this.scenarioEngine = options.scenarioEngine || new ScenarioEngine();
    this.orchestrator = options.orchestrator || new EvaluatorOrchestrator(options);
    this.reportGenerator = options.reportGenerator || new ReportGenerator(options);
    this.regressionEngine = options.regressionEngine || new RegressionEngine(options);
  }

  /**
   * Execute an authorized AEGIS evaluation mission end-to-end
   */
  async executeMission(missionConfig = {}, context = {}) {
    const startTime = Date.now();
    const missionId = missionConfig.missionId || `AEGIS-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const targetUrl = missionConfig.targetUrl;

    // 1. Founder Approval Gate Verification
    const approval = this.approvalGate.evaluate(context);
    if (!approval.allowed) {
      return {
        success: false,
        missionId,
        status: "BLOCKED_BY_APPROVAL",
        error: approval.blockedReason,
        evaluatedAt: new Date().toISOString()
      };
    }

    // 2. Validate Target Authorization
    const auth = this.connector.validateTargetAuthorization(targetUrl, context);
    if (!auth.authorized) {
      return {
        success: false,
        missionId,
        status: "UNAUTHORIZED_TARGET",
        error: auth.reason,
        targetUrl,
        evaluatedAt: new Date().toISOString()
      };
    }

    // 3. Preflight Target Reachability
    const preflight = await this.connector.preflightCheck(targetUrl, {
      timeoutMs: missionConfig.preflightTimeoutMs || 8000,
      ...context
    });

    if (!preflight.reachable) {
      return {
        success: false,
        missionId,
        status: "TARGET_UNREACHABLE",
        error: `Target preflight failed: ${preflight.error || preflight.status}`,
        targetUrl,
        preflight,
        evaluatedAt: new Date().toISOString()
      };
    }

    // 4. Resolve Scenarios to Execute
    let scenarios = [];
    if (Array.isArray(missionConfig.scenarioIds) && missionConfig.scenarioIds.length > 0) {
      scenarios = this.scenarioEngine.filterScenarios({ ids: missionConfig.scenarioIds });
    } else if (missionConfig.category) {
      scenarios = this.scenarioEngine.getScenariosByCategory(missionConfig.category);
    } else {
      scenarios = this.scenarioEngine.getAllScenarios();
    }

    if (missionConfig.maxScenarios && scenarios.length > missionConfig.maxScenarios) {
      scenarios = scenarios.slice(0, missionConfig.maxScenarios);
    }

    // 5. Initialize Evidence Collector
    const evidenceCollector = new EvidenceCollector(missionId, {
      baseDir: missionConfig.evidenceBaseDir
    });

    // 6. Execute Scenarios sequentially with browser driver
    const results = [];
    const browser = new BrowserInteractionEngine({
      headless: missionConfig.headless !== undefined ? missionConfig.headless : "new",
      timeoutMs: missionConfig.turnTimeoutMs || 20000
    });

    try {
      // Launch browser session
      await browser.launchSession(targetUrl, {
        timeoutMs: missionConfig.launchTimeoutMs || 25000,
        settleMs: missionConfig.settleMs || 500
      });

      // Discover chat UI elements
      const controls = await browser.discoverChatControls(missionConfig.customSelectors || {});

      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        const scenarioTurns = [];
        console.log(`\n[SCENARIO ${i + 1}/${scenarios.length}] Executing ${scenario.id} (${scenario.category})...`);
        console.log(`   Prompt: "${scenario.initialMessage}"`);

        // Isolate conversation state between independent scenarios by refreshing page if requested
        if (i > 0 && missionConfig.isolateScenarios === true) {
          try {
            await browser.page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 35000 });
            if (controls.inputSelector) {
              await browser.page.waitForSelector(controls.inputSelector, { timeout: 20000 });
            }
            await new Promise(r => setTimeout(r, 1000));
          } catch (_) {}
        }

        // Turn 1: Initial Message
        const turn1 = await browser.sendMessageTurn(scenario.initialMessage, {
          inputSelector: controls.inputSelector,
          submitSelector: controls.submitSelector,
          messagesSelector: controls.messagesSelector,
          timeoutMs: missionConfig.turnTimeoutMs || 15000
        });
        scenarioTurns.push({ turnIndex: 1, ...turn1 });
        console.log(`   Turn 1 Reply (${turn1.durationMs}ms): "${(turn1.agentResponse || '').slice(0, 80)}..."`);

        // Capture Turn 1 Screenshot & DOM
        if (missionConfig.captureScreenshots !== false) {
          const screenDest = path.join(evidenceCollector.missionDir, `screen_${scenario.id}_turn1.png`);
          await browser.captureScreenshot(screenDest);
          evidenceCollector.recordScreenshot(scenario.id, 1, screenDest);
        }

        const domHtml = await browser.extractDomSnapshot();
        evidenceCollector.recordDomSnapshot(scenario.id, 1, domHtml);

        // Optional Multi-Turn Follow-Ups
        if (Array.isArray(scenario.followUpMessages) && scenario.followUpMessages.length > 0) {
          for (let f = 0; f < scenario.followUpMessages.length; f++) {
            const followUpMsg = scenario.followUpMessages[f];
            console.log(`   Follow-up Turn ${f + 2}: "${followUpMsg}"`);
            const turnN = await browser.sendMessageTurn(followUpMsg, {
              inputSelector: controls.inputSelector,
              submitSelector: controls.submitSelector,
              messagesSelector: controls.messagesSelector,
              timeoutMs: missionConfig.turnTimeoutMs || 15000
            });
            scenarioTurns.push({ turnIndex: f + 2, ...turnN });
            console.log(`   Turn ${f + 2} Reply (${turnN.durationMs}ms): "${(turnN.agentResponse || '').slice(0, 80)}..."`);
          }
        }

        // Evaluate Scenario using Deterministic + AI Auditors
        const scenarioVerdict = await this.orchestrator.evaluateScenarioResult(scenario, scenarioTurns);
        scenarioVerdict.turns = scenarioTurns;
        results.push(scenarioVerdict);
        console.log(`   Verdict: [${scenarioVerdict.verdict}] Score: ${scenarioVerdict.score}/100`);

        // Record Scenario Transcript
        evidenceCollector.recordTranscript(scenario.id, {
          scenarioId: scenario.id,
          category: scenario.category,
          objective: scenario.objective,
          turns: scenarioTurns,
          evaluation: scenarioVerdict
        });
      }

    } catch (execErr) {
      // Handled execution interruption
      results.push({
        scenarioId: "MISSION_EXECUTION_EXCEPTION",
        category: "RUNTIME",
        verdict: "FAIL",
        passed: false,
        score: 0,
        deterministic: {
          passed: false,
          violations: [{
            type: "RUNTIME_EXCEPTION",
            severity: "CRITICAL",
            rule: "Mission must run to completion without unhandled harness crash.",
            actual: execErr.message
          }]
        }
      });
    } finally {
      await browser.closeSession();
    }

    // 7. Record Detected Defects in Regression Ledger
    const defects = this.regressionEngine.recordDefects(missionId, targetUrl, results);

    // 8. Generate Evidence Manifest (SHA-256)
    const { manifestPath, manifest } = evidenceCollector.generateEvidenceManifest();

    // 9. Aggregate Quality Score & Summary (Strictly Distinguishing PASS, WARN, and FAIL)
    const totalCount = results.length;
    const passedCount = results.filter(r => r.verdict === "PASS").length;
    const warnedCount = results.filter(r => r.verdict === "WARN").length;
    const failedCount = results.filter(r => r.verdict === "FAIL").length;
    const totalScore = results.reduce((acc, r) => acc + (r.score || 0), 0);
    const overallScore = totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
    const avgLatencyMs = Math.round((Date.now() - startTime) / Math.max(1, totalCount));

    let missionStatus;
    if (failedCount > 0) {
      missionStatus = "DEFECTS_DETECTED";
    } else if (warnedCount > 0) {
      missionStatus = "PASSED_WITH_WARNINGS";
    } else {
      missionStatus = "PASSED_CLEAN";
    }

    const missionSummary = {
      missionId,
      targetUrl,
      targetMode: auth.mode,
      status: missionStatus,
      overallScore,
      totalScenarios: totalCount,
      passedScenarios: passedCount,
      warnedScenarios: warnedCount,
      failedScenarios: failedCount,
      defectsRecorded: defects.length,
      avgLatencyMs,
      completedAt: new Date().toISOString(),
      executionDurationMs: Date.now() - startTime,
      manifest,
      results
    };

    // 10. Generate JSON and Markdown Reports
    const reportArtifacts = this.reportGenerator.generateMissionReports(missionSummary);

    // 11. Inscribe Synapse into Persistent Memory
    this._inscribeMemorySynapse(missionSummary);

    return {
      success: true,
      missionId,
      status: missionSummary.status,
      overallScore,
      totalScenarios: totalCount,
      passedScenarios: passedCount,
      warnedScenarios: warnedCount,
      failedScenarios: failedCount,
      defectsCount: defects.length,
      reports: reportArtifacts,
      manifestPath,
      summary: missionSummary
    };
  }

  _inscribeMemorySynapse(summary) {
    try {
      const memoryService = require("../services/persistentMemory/memoryService");
      memoryService.remember({
        goalId: summary.missionId,
        type: "AEGIS_EVALUATION_MISSION",
        content: `Evaluated ${summary.targetUrl} across ${summary.totalScenarios} scenarios. Overall Score: ${summary.overallScore}/100. Status: ${summary.status}.`,
        metadata: {
          targetUrl: summary.targetUrl,
          score: summary.overallScore,
          defects: summary.defectsRecorded
        }
      });
    } catch (_) {}
  }
}

module.exports = { MissionController };
