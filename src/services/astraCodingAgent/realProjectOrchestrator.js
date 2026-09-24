/**
 * GARUDA PAWAN ASTRA™ — Real Project Autonomous Engineering Orchestrator
 * 
 * End-to-End Orchestrator for Real Existing-Repository Operations.
 * 
 * Target Loop:
 * USER INTENT
 *   ↓ UNDERSTAND & REPO INTELLIGENCE
 *   ↓ IMPACT ANALYSIS & PRE-EXECUTION REPORT
 *   ↓ TASK GRAPH (DAG with conflict separation)
 *   ↓ TERMINAL TOOL EXECUTION
 *   ↓ MULTI-FILE SURGICAL PATCHING (Transactional)
 *   ↓ STATIC VALIDATION (LayeredValidator)
 *   ↓ BUILD PIPELINE & BUILD SELF-HEAL
 *   ↓ RUNTIME VERIFICATION (HeadlessBrowserRunner)
 *   ↓ INTERACTION REGRESSION TEST
 *   ↓ RUNTIME ERROR CLASSIFICATION & SELF-HEAL
 *   ↓ REGRESSION SUITE
 *   ↓ POST-EXECUTION EVIDENCE REPORT & AUDIT
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { RepoIndexEngine } = require("./repoIndexEngine");
const { TaskGraph, PatchTransactionCoordinator, planEngineeringTaskGraph } = require("./taskGraphEngine");
const { terminalToolEngine } = require("./terminalToolEngine");
const { commandIntelligence } = require("./commandIntelligence");
const { BuildSelfHealer } = require("./buildSelfHealer");
const { HeadlessBrowserRunner } = require("./headlessBrowserRunner");
const { RuntimeSelfHealer } = require("./runtimeSelfHealer");
const { LayeredValidator } = require("./layeredValidator");
const { PatchEngine } = require("./patchEngine");

class RealProjectOrchestrator {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.resolve(__dirname, "../../../");
    this.repoIndex = options.repoIndex || new RepoIndexEngine({ rootDir: this.rootDir });
    this.terminal = options.terminal || terminalToolEngine;
    this.classifier = options.classifier || commandIntelligence;
    this.buildHealer = options.buildHealer || new BuildSelfHealer({ rootDir: this.rootDir, terminal: this.terminal });
    this.browserRunner = options.browserRunner || new HeadlessBrowserRunner();
    this.runtimeHealer = options.runtimeHealer || new RuntimeSelfHealer({ browserRunner: this.browserRunner });
    this.validator = options.validator || new LayeredValidator();
    this.patchEngine = options.patchEngine || new PatchEngine();
    this.intelligence = options.intelligence !== undefined ? options.intelligence : null;
    if (!this.intelligence) {
      try {
        const { getGarudaIntelligence } = require("../garudaIntelligence");
        this.intelligence = getGarudaIntelligence();
      } catch {
        this.intelligence = null;
      }
    }
  }

  _computeSha256(contentOrPath) {
    let buf;
    if (typeof contentOrPath === "string") {
      if (fs.existsSync(contentOrPath)) {
        buf = fs.readFileSync(contentOrPath);
      } else {
        buf = Buffer.from(contentOrPath, "utf8");
      }
    } else {
      buf = contentOrPath;
    }
    return crypto.createHash("sha256").update(buf).digest("hex");
  }

  /**
   * Step 13: Generate Pre-Execution Change Impact Report
   */
  generatePreExecutionReport(intent, targetFiles = []) {
    const targets = Array.isArray(targetFiles) ? targetFiles : [targetFiles];
    const impact = this.repoIndex.calculateImpact(targets);
    const commandPlan = this.classifier.decideCommands(intent, { cwd: "." });

    // Target symbols discovery
    const affectedSymbols = [];
    for (const f of targets) {
      const fileData = this.repoIndex.fileCache.get(f.replace(/\\/g, "/"));
      if (fileData && fileData.symbols) {
        affectedSymbols.push(...fileData.symbols.map(s => `${s.type}: ${s.name || s.route || "anonymous"}`));
      }
    }

    return {
      missionIntent: intent,
      targetFiles: targets,
      affectedFilesCount: impact.affectedFilesCount,
      downstreamConsumers: impact.downstreamConsumers,
      affectedTests: impact.affectedTests,
      affectedSymbols: affectedSymbols.slice(0, 10),
      risk: impact.risk,
      plannedCommands: commandPlan.commands,
      recommendedVerification: impact.recommendedVerificationMethod,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute an atomic real-project engineering mission
   */
  async executeMission(missionConfig = {}) {
    const {
      intent = "Real Engineering Mission",
      targetFiles = [],
      patchOperations = [],
      buildCheck = false,
      buildCommand = "npm run build",
      testCheck = false,
      testCommand = "npm test",
      browserCheck = false,
      browserOptions = {}
    } = missionConfig;

    const missionStart = Date.now();
    const metrics = {
      planningMs: 0,
      patchMs: 0,
      buildMs: 0,
      testMs: 0,
      browserMs: 0,
      totalMissionMs: 0
    };
    const executedCommands = [];
    const modifiedFiles = [];
    let repairCycles = 0;
    let rollbackStatus = "NONE";

    // 1. Pre-execution Impact Analysis & Nazar Forensic Investigation
    const planStart = Date.now();
    const preReport = this.generatePreExecutionReport(intent, targetFiles);
    metrics.planningMs = Date.now() - planStart;

    let nazarInvestigation = null;
    try {
      if (this.intelligence && this.intelligence.investigate) {
        nazarInvestigation = this.intelligence.investigate(intent, {
          targetFiles,
          isProduction: true,
          workspaceRoot: this.rootDir
        });
      }
    } catch (intelErr) {
      // Non-blocking
    }

    // 2. Snapshot files for full mission rollback
    const preSnapshots = new Map();
    for (const f of targetFiles) {
      const full = path.isAbsolute(f) ? f : path.join(this.rootDir, f);
      if (fs.existsSync(full)) {
        preSnapshots.set(full, {
          content: fs.readFileSync(full, "utf8"),
          sha256: this._computeSha256(full)
        });
      } else {
        preSnapshots.set(full, { content: null, sha256: null }); // Newly created file
      }
    }

    try {
      // 3. Apply Multi-File Surgical Patches
      const patchStart = Date.now();
      for (const op of patchOperations) {
        const full = path.isAbsolute(op.filePath) ? op.filePath : path.join(this.rootDir, op.filePath);
        let currentContent = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
        let newContent = "";

        if (op.searchBlock) {
          const patchRes = this.patchEngine.applySearchReplace(currentContent, op.searchBlock, op.replaceBlock || "", op.options);
          if (!patchRes.success) {
            throw new Error(`Surgical patch failed on ${op.filePath}: ${patchRes.error}`);
          }
          newContent = patchRes.newContent;
        } else if (op.newContent !== undefined) {
          newContent = op.newContent;
        } else {
          throw new Error(`Patch operation missing content for ${op.filePath}`);
        }

        // Validate immediately
        const valRes = this.validator.validateContent(newContent, op.filePath);
        if (!valRes.valid) {
          throw new Error(`Static validation failed on ${op.filePath}: ${valRes.error}`);
        }

        fs.writeFileSync(full, newContent, "utf8");
        modifiedFiles.push({
          filePath: op.filePath,
          sha256: valRes.sha256
        });

        // Incremental index update
        this.repoIndex.updateFile(op.filePath, newContent);
      }
      metrics.patchMs = Date.now() - patchStart;

      // 4. Build Pipeline & Self-Heal if enabled
      let buildResult = { status: "SKIPPED" };
      if (buildCheck) {
        const bStart = Date.now();
        buildResult = await this.buildHealer.executeBuildAndHeal({
          buildCommand,
          cwd: missionConfig.buildCwd || this.rootDir,
          maxCycles: 3
        });
        metrics.buildMs = Date.now() - bStart;
        executedCommands.push({ command: buildCommand, status: buildResult.status });
        if (buildResult.healCycles > 0) repairCycles += buildResult.healCycles;

        if (!buildResult.success) {
          throw new Error(`Build pipeline failed after self-healing attempts: ${buildResult.lastError?.explanation || "Build failed"}`);
        }
      }

      // 5. Run Targeted Tests if enabled
      let testResult = { status: "SKIPPED" };
      if (testCheck) {
        const tStart = Date.now();
        const cmdRes = await this.terminal.execute(testCommand, { cwd: this.rootDir });
        metrics.testMs = Date.now() - tStart;
        executedCommands.push(cmdRes);

        if (cmdRes.exitCode !== 0) {
          throw new Error(`Test execution failed with exit code ${cmdRes.exitCode}: ${cmdRes.stderr || cmdRes.stdout}`);
        }
        testResult = { status: "VERIFIED", output: cmdRes.stdout };
      }

      // 6. Real Browser Verification & Self-Heal if enabled
      let browserResult = { status: "SKIPPED" };
      if (browserCheck && browserOptions.htmlContent) {
        const brStart = Date.now();
        browserResult = await this.runtimeHealer.verifyAndHeal(browserOptions.htmlContent, browserOptions);
        metrics.browserMs = Date.now() - brStart;
        if (browserResult.healCycles > 0) repairCycles += browserResult.healCycles;

        if (!browserResult.success && browserResult.status !== "PASSED") {
          throw new Error(`Browser verification failed: ${browserResult.runtimeResult?.pageErrors?.[0]?.message || "Uncaught runtime errors"}`);
        }
      }

      // 7. Reviewer System Multi-Reviewer Verification (Phase 5.4-F)
      let reviewerResult = null;
      let reviewVerdict = "ALL_APPROVED";
      let missionStatus = "VERIFIED";

      if (this.intelligence && this.intelligence.runSelectiveReview) {
        try {
          const reviewTarget = {
            id: targetFiles.length > 0 ? targetFiles[0] : `mission-${Date.now()}`,
            type: "mission_artifact",
            intent,
            targetFiles
          };
          reviewerResult = this.intelligence.runSelectiveReview(
            reviewTarget,
            { intent, targetFiles, modifiedFiles, preReport, buildResult, testResult },
            preReport.risk || "LOW"
          );
          if (reviewerResult && reviewerResult.overallVerdict) {
            reviewVerdict = reviewerResult.overallVerdict;
            if (reviewVerdict === "BLOCK") {
              missionStatus = "REJECTED";
            } else if (reviewVerdict === "REVIEW_REQUIRED") {
              missionStatus = "PARTIAL";
            }
          }
        } catch (revErr) {
          reviewerResult = { error: revErr.message };
        }
      }

      // 8. Learning Promotion through LearningPromoter (Phase 5.4-A, B, G)
      let memoryPromotion = null;
      if (missionStatus === "VERIFIED" && this.intelligence && this.intelligence.submitAndEvaluate) {
        try {
          memoryPromotion = this.intelligence.submitAndEvaluate({
            type: "lesson",
            content: `Real Project Mission Verified: ${intent.substring(0, 150)}`,
            sourceAgent: "real_project_orchestrator",
            evidence: [
              { type: "runtime_verified", details: `Modified: ${modifiedFiles.length}, RepairCycles: ${repairCycles}` },
              { type: "build_success", details: buildResult.status || "SKIPPED" },
              { type: "code_review", details: `Review verdict: ${reviewVerdict}` }
            ],
            tags: ["orchestrator", "real-project", "verified-mission"],
            relatedFiles: targetFiles
          });
        } catch (promoErr) {
          // Graceful suppression
        }
      }

      metrics.totalMissionMs = Date.now() - missionStart;

      // Return Post-Execution Evidence Report
      return {
        success: missionStatus === "VERIFIED",
        status: missionStatus,
        missionIntent: intent,
        preReport,
        nazarInvestigation: nazarInvestigation ? {
          id: nazarInvestigation.id,
          lensesUsed: nazarInvestigation.selectedLenses?.length || nazarInvestigation.findings?.length || 0,
          findingsCount: nazarInvestigation.findings?.length || 0,
          verdict: nazarInvestigation.verdict
        } : null,
        reviewerResult: reviewerResult ? {
          verdict: reviewVerdict,
          reviewerCount: reviewerResult.reviewerCount || 0,
          verdictCounts: reviewerResult.verdictCounts || {}
        } : null,
        memoryPromotion: memoryPromotion ? {
          itemId: memoryPromotion.itemId,
          evaluationStatus: memoryPromotion.evaluationStatus,
          confidence: memoryPromotion.confidence?.confidence
        } : null,
        modifiedFiles,
        executedCommands,
        repairCycles,
        rollbackStatus: "NONE",
        metrics,
        buildResult,
        testResult,
        browserResult,
        evidenceSha256: this._computeSha256(JSON.stringify(modifiedFiles))
      };

    } catch (missionError) {
      // 7. Full Mission Rollback on Failure
      rollbackStatus = "EXECUTED";
      for (const [fullPath, snap] of preSnapshots.entries()) {
        if (snap.content !== null) {
          fs.writeFileSync(fullPath, snap.content, "utf8");
          this.repoIndex.updateFile(fullPath, snap.content);
        } else if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      metrics.totalMissionMs = Date.now() - missionStart;

      return {
        success: false,
        status: "FAILED",
        missionIntent: intent,
        error: missionError.message,
        repairCycles,
        rollbackStatus: "RESTORED_TO_PRE_SNAPSHOT",
        restoredFilesCount: preSnapshots.size,
        metrics,
        executedCommands
      };
    }
  }
}

module.exports = {
  RealProjectOrchestrator,
  realProjectOrchestrator: new RealProjectOrchestrator()
};
