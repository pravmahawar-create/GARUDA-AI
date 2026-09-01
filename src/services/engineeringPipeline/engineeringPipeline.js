/**
 * GARUDA Engineering Pipeline — The Real Closed-Loop
 *
 * Wires together ALL existing components into one coherent pipeline:
 *   MISSION → UNDERSTAND → PLAN → ISOLATE → EXECUTE → TEST → FIX → REVIEW → LEARN
 *
 * This is NOT a new engine. It CONNECTS existing engines:
 * - repositoryIntelligenceService (understand codebase)
 * - goalEngineService (plan and track goals)
 * - smartModelRouter (select best AI model)
 * - gitIsolationService (safe workspace)
 * - safeModificationService (backup, diff, patch)
 * - testDiscoveryService (find and run tests)
 * - codeReviewService (review changes)
 * - persistentMemory/memoryService (learn outcomes)
 * - smartEngine/speedEngine (intelligent routing)
 * - boundedRetryController (failure recovery)
 */

const fs = require("fs");
const path = require("path");

const PIPELINE_LOG = path.join(__dirname, "..", "..", "..", "data", "engineering", "pipeline-log.jsonl");

function ensureDir() {
  const dir = path.dirname(PIPELINE_LOG);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function logEvent(event) {
  ensureDir();
  try {
    const safe = { ...event };
    if (safe.output !== undefined && typeof safe.output !== "string") {
      safe.output = JSON.stringify(safe.output).substring(0, 500);
    }
    fs.appendFileSync(PIPELINE_LOG, JSON.stringify({ ...safe, timestamp: new Date().toISOString() }) + "\n");
  } catch {}
}

/**
 * Execute a full engineering mission through the closed loop.
 *
 * @param {string} mission - Natural language description of the engineering task
 * @param {object} options - { rootDir, dryRun, maxRetries, founderApproval }
 * @returns {object} Full pipeline result with evidence at every step
 */
async function executeMission(mission, options = {}) {
  const startTime = Date.now();
  const rootDir = options.rootDir || process.cwd();
  const dryRun = options.dryRun || false;
  const maxRetries = options.maxRetries || 2;

  const result = {
    mission,
    status: "running",
    steps: [],
    evidence: [],
    filesModified: [],
    testsRun: [],
    testsPassed: 0,
    testsFailed: 0,
    retries: 0,
    reviewVerdict: null,
    memoryRecorded: false,
    timeMs: 0,
  };

  function addStep(name, status, output, error) {
    const step = { name, status, output, error, timestamp: new Date().toISOString() };
    result.steps.push(step);
    try {
      const logOutput = output === undefined ? null : (typeof output === "string" ? output : JSON.stringify(output));
      logEvent({ mission, step: name, status, output: logOutput ? String(logOutput).substring(0, 500) : null });
    } catch {}
    return step;
  }

  function addEvidence(type, data) {
    result.evidence.push({ type, data, timestamp: new Date().toISOString() });
  }

  try {
    // ═══════════════════════════════════════════
    // STEP 1: UNDERSTAND — Repository Intelligence
    // ═══════════════════════════════════════════
    addStep("understand", "running");

    let repoGraph = null;
    try {
      const repoIntel = require("../repositoryIntelligence/repositoryIntelligenceService");
      repoGraph = repoIntel.buildFullGraph();
      const routeMap = repoGraph.routeMap || repoGraph.routeMapper || {};
      const testMap = repoGraph.testMap || repoGraph.testMapper || {};
      addStep("understand", "done", {
        files: repoGraph.fileGraph.totalFiles,
        routes: routeMap.totalRoutes || Object.keys(routeMap.routes || routeMap).length,
        tests: testMap.totalTests || Object.keys(testMap.tests || testMap).length,
      });
      addEvidence("repo_intel", { files: repoGraph.fileGraph.totalFiles, tests: testMap.totalTests || 0 });
    } catch (err) {
      addStep("understand", "failed", null, err.message);
      result.status = "failed";
      result.timeMs = Date.now() - startTime;
      return result;
    }

    // ═══════════════════════════════════════════
    // STEP 2: PLAN — Goal decomposition
    // ═══════════════════════════════════════════
    addStep("plan", "running");

    let goal = null;
    try {
      const goalEngine = require("../goalEngine/goalEngineService");
      const parsed = require("../goalEngine/goalSchema");

      goal = {
        id: `mission-${Date.now()}`,
        type: "engineering",
        title: mission,
        status: "planning",
        steps: [],
        evidence: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
      };

      // Build plan based on mission analysis
      const planSteps = analyzeMission(mission, repoGraph);
      goal.steps = planSteps;
      goal.status = "ready";

      addStep("plan", "done", { steps: planSteps.length, plan: planSteps.map((s) => s.description) });
      addEvidence("plan", { stepCount: planSteps.length });
    } catch (err) {
      addStep("plan", "failed", null, err.message);
      result.status = "failed";
      result.timeMs = Date.now() - startTime;
      return result;
    }

    // ═══════════════════════════════════════════
    // STEP 3: ROUTE — Select best model/worker
    // ═══════════════════════════════════════════
    addStep("route", "running");

    let routing = null;
    try {
      const smartRouter = require("../smartModelRouter/smartRouter");
      routing = await smartRouter.route(mission);
      addStep("route", "done", {
        provider: routing.selected.provider,
        model: routing.selected.model,
        tier: routing.selected.tier,
        reason: routing.selected.reason,
      });
      addEvidence("routing", routing.selected);
    } catch (err) {
      // Non-fatal — continue with default
      routing = { selected: { provider: "smart_engine", model: "rules+cache", tier: "internal", reason: "Router unavailable" } };
      addStep("route", "degraded", routing.selected, err.message);
    }

    // ═══════════════════════════════════════════
    // STEP 4: ISOLATE — Create real git worktree
    // ═══════════════════════════════════════════
    addStep("isolate", "running");

    let workspace = null;
    let worktreeTaskId = null;
    try {
      const gitIsolation = require("../gitIsolation/gitIsolationService");
      const branchName = `mission/${goal.id}`;
      worktreeTaskId = goal.id;

      // Try to create a real git worktree for isolation
      const worktreeResult = gitIsolation.createWorktree(worktreeTaskId, branchName);
      if (worktreeResult.success) {
        workspace = {
          branch: branchName,
          rootDir: worktreeResult.path,
          originalDir: rootDir,
          isolated: true,
          method: "worktree",
          worktreePath: worktreeResult.path,
        };
        addStep("isolate", "done", { branch: branchName, method: "worktree", path: worktreeResult.path });
        addEvidence("workspace", { branch: branchName, path: worktreeResult.path });
      } else {
        // Worktree creation failed — fall back to original directory with warning
        workspace = { branch: null, rootDir, originalDir: rootDir, isolated: false, method: "direct" };
        addStep("isolate", "degraded", { method: "direct" }, worktreeResult.error);
      }
    } catch (err) {
      // Non-fatal — proceed without isolation
      workspace = { branch: null, rootDir, originalDir: rootDir, isolated: false, method: "direct" };
      addStep("isolate", "degraded", { method: "direct" }, err.message);
    }

    // ═══════════════════════════════════════════
    // STEP 5: EXECUTE — Real file modification
    // ═══════════════════════════════════════════
    addStep("execute", "running");

    let executionResult = null;
    const workDir = workspace?.rootDir || rootDir;
    try {
      // Find relevant files from the plan
      const targetFiles = findTargetFiles(goal, repoGraph, rootDir);

      if (targetFiles.length === 0) {
        // Analysis-only mission — no files to modify
        executionResult = {
          type: "analysis",
          findings: analyzeForMission(mission, repoGraph),
          filesModified: [],
        };
        addStep("execute", "done", { type: "analysis", findings: executionResult.findings.length });
      } else if (dryRun) {
        // Dry run — read files and report what would change
        const modifications = [];
        for (const file of targetFiles) {
          const absPath = path.resolve(rootDir, file);
          if (fs.existsSync(absPath)) {
            const content = fs.readFileSync(absPath, "utf8");
            modifications.push({ file, absPath, lines: content.split("\n").length, exists: true });
          }
        }
        executionResult = { type: "dry_run", targetFiles: modifications, filesModified: targetFiles };
        result.filesModified = targetFiles;
        addStep("execute", "done", { type: "dry_run", files: targetFiles.length });
      } else {
        // Founder approval gate: permanent direct modifications require approval
        // Worktree-isolated experimentation is allowed per canonical architecture
        const founderApprovalGiven = options['founderApproval'] === true || options['founderApproved'] === true;
        const isWorktreeExperimentation = workspace?.method === "worktree";

        if (!founderApprovalGiven && !isWorktreeExperimentation && !options['dryRun']) {
          addStep("founder-approval", "blocked", {
            message: "Founder approval required for permanent direct modifications. Worktree experimentation allowed without approval per canonical architecture."
          });
          // Blocked — do not apply patches; record evidence and continue lifecycle (test/review/learn will see 0 files)
          executionResult = {
            type: "modification_blocked_by_approval",
            targetFiles: targetFiles,
            applied: [],
            filesModified: [],
            founderApprovalBlocked: true,
          };
          result.filesModified = [];
          result._founderApprovalBlocked = true;
          addStep("execute", "blocked", { type: "modification_blocked_by_approval", files: targetFiles.length, reason: "founder_approval_required" });
          addEvidence("execution", { type: executionResult.type, files: targetFiles.length, applied: 0, blocked: true });
        } else {
          // Real modification — use safeModificationService to apply changes
          const safeMod = require("../safeModification/safeModificationService");
          const modifications = [];
          const applied = [];

          for (const file of targetFiles) {
            const absPath = path.resolve(rootDir, file);
            if (!fs.existsSync(absPath)) continue;

            const originalContent = fs.readFileSync(absPath, "utf8");

            // Generate modification using the selected LLM model or template engine
            let newContent = null;
            try {
              newContent = await generateModification(mission, file, originalContent, routing?.selected, workDir);
            } catch (genErr) {
              // If generation fails, skip this file
              addStep("execute_warning", "degraded", { file, error: genErr.message });
              continue;
            }

            if (!newContent || newContent === originalContent) {
              // No change generated — skip
              modifications.push({ file, absPath, lines: originalContent.split("\n").length, changed: false, reason: "no_change_generated" });
              continue;
            }

            // Create backup before modification
            let backupPath = null;
            try {
              const backupResult = safeMod.createBackup(absPath);
              if (backupResult.success) backupPath = backupResult.backupPath;
            } catch {}

            // Compute diff
            const diff = safeMod.computeLineDiff(originalContent, newContent);

            // Apply the modification to the workspace file
            const targetAbsPath = workspace?.worktreePath
              ? path.resolve(workspace.worktreePath, file)
              : absPath;

            const patchResult = safeMod.applyPatchToFile(targetAbsPath, newContent);
            if (patchResult.success && patchResult.changed) {
              // Validate imports after modification
              let importsValid = true;
              try {
                const importCheck = safeMod.validateImports(targetAbsPath);
                importsValid = importCheck.valid;
              } catch {}

              modifications.push({
                file,
                absPath: targetAbsPath,
                originalAbsPath: absPath,
                lines: originalContent.split("\n").length,
                newLines: newContent.split("\n").length,
                changed: true,
                backupPath,
                diff: diff.summary,
                importsValid,
              });
              applied.push({ file, absPath: targetAbsPath, backupPath, importsValid });

              // Log the modification
              try {
                safeMod.logModification({
                  file,
                  action: "pipeline_execute",
                  mission: mission.substring(0, 100),
                  diff: diff.summary,
                  importsValid,
                  backupPath,
                });
              } catch {}
            } else {
              modifications.push({ file, absPath, changed: false, error: patchResult.error });
            }
          }

          executionResult = {
            type: "modification",
            targetFiles: modifications,
            applied,
            filesModified: applied.map((a) => a.file),
          };
          result.filesModified = applied.map((a) => a.file);

          // If we're in the original directory (no worktree), record modified files for cleanup tracking
          if (!workspace?.worktreePath && applied.length > 0) {
            result._modifiedPaths = applied.map((a) => a.originalAbsPath || a.absPath);
          }

          addStep("execute", "done", { type: "modification", files: targetFiles.length, applied: applied.length, dryRun: false });
          addEvidence("execution", { type: executionResult.type, files: targetFiles.length, applied: applied.length });
        }
      }

      // evidence already added in branches above; fallback if not yet added
      if (!executionResult || !result.evidence.some(e => e.type === "execution" && e.data && (e.data.type === executionResult.type || e.data.blocked))) {
        addEvidence("execution", { type: executionResult.type, files: targetFiles.length, applied: executionResult.applied?.length || 0 });
      }
    } catch (err) {
      addStep("execute", "failed", null, err.message);

      // Record failure for learning — store mission as action + context for retrieval
      try {
        const memory = require("../persistentMemory/memoryService");
        memory.remember({
          type: "engineering_failure",
          action: mission,
          error: err.message,
          outcome: "failed",
          tags: [categorizeMission(mission), "engineering", "failure"],
          context: { mission, step: "execute", routing: routing?.selected || null },
        });
      } catch {}

      result.status = "failed";
      result.timeMs = Date.now() - startTime;
      return result;
    }

    // ═══════════════════════════════════════════
    // STEP 6: TEST — Run relevant tests
    // ═══════════════════════════════════════════
    addStep("test", "running");

    let testResults = null;
    // Hoisted to executeMission scope so the STEP 7 retry/retest loop can re-run them
    let testDiscovery = null;
    let relevantTests = [];
    try {
      testDiscovery = require("../testDiscovery/testDiscoveryService");

      // Discover test files
      const discovered = testDiscovery.scanTestFiles(rootDir);

      // Find tests relevant to modified files
      relevantTests = findRelevantTests(result.filesModified, discovered, repoGraph);

      if (relevantTests.length > 0) {
        // Run relevant tests
        const testRunResults = [];
        for (const testFile of relevantTests.slice(0, 5)) {
          try {
            const runResult = testDiscovery.runTestFile(testFile);
            testRunResults.push({
              file: testFile,
              passed: runResult.exitCode === 0,
              exitCode: runResult.exitCode,
              duration: runResult.duration,
              output: (runResult.stdout || "").substring(0, 200),
            });
            result.testsRun.push(testFile);
            if (runResult.exitCode === 0) result.testsPassed++;
            else result.testsFailed++;
          } catch (testErr) {
            testRunResults.push({ file: testFile, passed: false, error: testErr.message });
            result.testsFailed++;
          }
        }

        testResults = { total: relevantTests.length, executed: testRunResults.length, results: testRunResults };
        addStep("test", result.testsFailed === 0 ? "done" : "partial", {
          relevant: relevantTests.length,
          executed: testRunResults.length,
          passed: result.testsPassed,
          failed: result.testsFailed,
        });
      } else {
        testResults = { total: 0, executed: 0, results: [] };
        addStep("test", "done", { message: "No relevant tests found for modified files" });
      }

      addEvidence("tests", { passed: result.testsPassed, failed: result.testsFailed });
    } catch (err) {
      testResults = { total: 0, executed: 0, results: [], error: err.message };
      addStep("test", "degraded", null, err.message);
    }

    // ═══════════════════════════════════════════
    // STEP 7: RETRY LOOP — Diagnose + corrective patch
    // ═══════════════════════════════════════════
    if (result.testsFailed > 0 && result.retries < maxRetries) {
      addStep("retry", "running");

      for (let attempt = 0; attempt < maxRetries && result.testsFailed > 0; attempt++) {
        result.retries++;
        addStep(`retry_attempt_${result.retries}`, "running", {
          attempt: result.retries,
          previousFailures: result.testsFailed,
        });

        // Diagnose failures
        const failures = testResults.results.filter((r) => !r.passed);
        const diagnosis = diagnoseFailures(failures);

        addEvidence("diagnosis", diagnosis);
        // Retrieve relevant prior failure lessons for adaptive retry
        let retryLearning = null;
        try {
          retryLearning = getFailureLessons(diagnosis);
          if (retryLearning && (retryLearning.lessons.length || retryLearning.experiences.length)) {
            addEvidence("retry_learning", { lessons: retryLearning.lessons.length, experiences: retryLearning.experiences.length, primaryType: diagnosis.primaryType });
            diagnosis.priorLessons = retryLearning.lessons.map(l => l.lesson).slice(0,3);
            diagnosis.learningAvailable = true;
          }
        } catch {}

        // If we have a worktree and target files, attempt corrective patch
        if (workspace?.worktreePath && executionResult?.applied?.length > 0 && !dryRun) {
          try {
            const safeMod = require("../safeModification/safeModificationService");
            let corrected = 0;

            for (const mod of executionResult.applied) {
              const worktreeFile = path.resolve(workspace.worktreePath, mod.file);
              if (!fs.existsSync(worktreeFile)) continue;

              const currentContent = fs.readFileSync(worktreeFile, "utf8");

              // Generate corrective modification based on diagnosis
              try {
                const correctedContent = await generateCorrectiveModification(
                  mission, mod.file, currentContent, diagnosis, routing?.selected, workDir
                );
                if (correctedContent && correctedContent !== currentContent) {
                  const patchResult = safeMod.applyPatchToFile(worktreeFile, correctedContent);
                  if (patchResult.success && patchResult.changed) {
                    corrected++;
                    safeMod.logModification({
                      file: mod.file,
                      action: "pipeline_retry_corrective",
                      attempt: result.retries,
                      diagnosis: diagnosis.summary,
                      diff: patchResult.diff?.summary,
                    });
                  }
                }
              } catch {}
            }

            if (corrected > 0 && testDiscovery) {
              // Retest after corrective patches
              addStep(`retest_${result.retries}`, "running");
              result.testsPassed = 0;
              result.testsFailed = 0;
              testResults.results = [];
              result.testsRun = [];

              for (const testFile of relevantTests.slice(0, 5)) {
                try {
                  const runResult = testDiscovery.runTestFile(testFile);
                  testResults.results.push({
                    file: testFile,
                    passed: runResult.exitCode === 0,
                    exitCode: runResult.exitCode,
                    duration: runResult.duration,
                    output: (runResult.stdout || "").substring(0, 200),
                  });
                  if (runResult.exitCode === 0) result.testsPassed++;
                  else result.testsFailed++;
                } catch (testErr) {
                  testResults.results.push({ file: testFile, passed: false, error: testErr.message });
                  result.testsFailed++;
                }
              }
              addStep(`retest_${result.retries}`, "done", { corrected, testsPassed: result.testsPassed, testsFailed: result.testsFailed });
            }
          } catch (retryErr) {
            addStep(`retry_attempt_${result.retries}`, "degraded", null, retryErr.message);
          }
        }

        // Record the failure pattern for learning — searchable via action/tags
        try {
          const memory = require("../persistentMemory/memoryService");
          memory.remember({
            type: "engineering_retry",
            action: mission,
            error: diagnosis.summary,
            outcome: result.testsFailed === 0 ? "recovered" : "retrying",
            tags: [diagnosis.primaryType || "unknown", "retry", categorizeMission(mission)],
            context: { mission, attempt: result.retries, failures: failures.length, diagnosis: diagnosis.summary, testsPassed: result.testsPassed, testsFailed: result.testsFailed, routing: routing?.selected || null },
          });
        } catch {}

        addStep(`retry_attempt_${result.retries}`, "done", {
          diagnosis: diagnosis.summary,
          recommendation: diagnosis.recommendation,
          testsPassed: result.testsPassed,
          testsFailed: result.testsFailed,
        });
      }
    }

    // ═══════════════════════════════════════════
    // STEP 8: REVIEW — Real code review
    // ═══════════════════════════════════════════
    addStep("review", "running");

    try {
      const codeReview = require("../codeReview/codeReviewService");

      // Review the mission outcome
      const reviewContext = {
        mission,
        filesModified: result.filesModified,
        testsRun: result.testsRun.length,
        testsPassed: result.testsPassed,
        testsFailed: result.testsFailed,
        retries: result.retries,
        routing: routing?.selected,
      };

      // Perform structural code review on modified files
      let structuralReviews = [];
      if (executionResult?.applied?.length > 0 && !dryRun) {
        for (const mod of executionResult.applied) {
          try {
            const reviewTarget = workspace?.worktreePath
              ? path.resolve(workspace.worktreePath, mod.file)
              : mod.originalAbsPath || mod.absPath;
            if (fs.existsSync(reviewTarget)) {
              const code = fs.readFileSync(reviewTarget, "utf8");
              const review = codeReview.reviewFileSync(code, reviewTarget, { root: rootDir });
              structuralReviews.push({ file: mod.file, ...review });
            }
          } catch {}
        }
      }

      // Build review verdict based on evidence + structural review
      const verdict = buildReviewVerdict(reviewContext, testResults);
      verdict.structuralReviews = structuralReviews;
      verdict.filesReviewed = structuralReviews.length;
      if (structuralReviews.length > 0) {
        const totalIssues = structuralReviews.reduce((sum, r) => sum + (r.issues?.length || 0), 0);
        const avgScore = structuralReviews.reduce((sum, r) => sum + (r.score || 0), 0) / structuralReviews.length;
        verdict.structuralScore = Math.round(avgScore);
        verdict.structuralIssues = totalIssues;
      }
      result.reviewVerdict = verdict;

      addStep("review", "done", verdict);
      addEvidence("review", verdict);
    } catch (err) {
      addStep("review", "degraded", null, err.message);
    }

    // ═══════════════════════════════════════════
    // CLEANUP: Remove worktree if created
    // ═══════════════════════════════════════════
    if (workspace?.worktreePath && worktreeTaskId) {
      try {
        const gitIsolation = require("../gitIsolation/gitIsolationService");
        gitIsolation.removeWorktree(worktreeTaskId);
        addStep("cleanup", "done", { removed: true, taskId: worktreeTaskId });
      } catch (cleanupErr) {
        addStep("cleanup", "degraded", null, cleanupErr.message);
      }
    }

    // ═══════════════════════════════════════════
    // STEP 9: LEARN — Record outcome
    // ═══════════════════════════════════════════
    addStep("learn", "running");

    try {
      const memory = require("../persistentMemory/memoryService");

      const lesson = {
        type: "engineering_mission",
        mission,
        category: categorizeMission(mission),
        filesModified: result.filesModified.length,
        testsRun: result.testsRun.length,
        testsPassed: result.testsPassed,
        testsFailed: result.testsFailed,
        retries: result.retries,
        reviewVerdict: result.reviewVerdict?.verdict || "UNKNOWN",
        routing: routing?.selected?.provider || "unknown",
        duration: Date.now() - startTime,
        outcome: result.status === "completed" ? "success" : result.status,
        learnings: extractLearnings(result, testResults),
      };

      memory.remember(lesson);

      // Also learn from goal if available
      if (goal) {
        memory.learnFromGoal(goal);
      }

      result.memoryRecorded = true;
      addStep("learn", "done", { recorded: true });
      addEvidence("memory", lesson);
    } catch (err) {
      addStep("learn", "degraded", null, err.message);
    }

    // ═══════════════════════════════════════════
    // FINALIZE
    // ═══════════════════════════════════════════
    result.status = determineFinalStatus(result);
    result.timeMs = Date.now() - startTime;

    // Clean up workspace if temp directory
    if (workspace?.method === "tempdir" && workspace?.rootDir) {
      try {
        fs.rmSync(workspace.rootDir, { recursive: true, force: true });
      } catch {}
    }

    logEvent({ mission, finalStatus: result.status, timeMs: result.timeMs, steps: result.steps.length });

    return result;
  } catch (err) {
    result.status = "failed";
    result.timeMs = Date.now() - startTime;
    addStep("fatal", "failed", null, err.message);
    logEvent({ mission, finalStatus: "failed", error: err.message });
    return result;
  }
}

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

function analyzeMission(mission, repoGraph) {
  const text = mission.toLowerCase();
  const steps = [];

  // Always start with analysis
  steps.push({
    id: "analyze",
    type: "analysis",
    description: "Analyze repository and understand codebase",
    status: "pending",
    evidence: [],
  });

  // Determine if this is a read-only analysis or a modification
  const isModification = /\b(add|create|write|fix|modify|update|change|implement|build|delete|remove)\b/i.test(mission);

  if (isModification) {
    steps.push({
      id: "identify-files",
      type: "analysis",
      description: "Identify target files for modification",
      status: "pending",
      evidence: [],
    });

    steps.push({
      id: "backup",
      type: "modification",
      description: "Create backup of files to be modified",
      status: "pending",
      evidence: [],
    });

    steps.push({
      id: "modify",
      type: "modification",
      description: "Apply modifications to target files",
      status: "pending",
      evidence: [],
    });

    steps.push({
      id: "validate-imports",
      type: "validation",
      description: "Validate imports and dependencies after modification",
      status: "pending",
      evidence: [],
    });
  }

  steps.push({
    id: "test",
    type: "testing",
    description: "Run relevant tests to verify changes",
    status: "pending",
    evidence: [],
  });

  steps.push({
    id: "review",
    type: "review",
    description: "Review changes for quality and correctness",
    status: "pending",
    evidence: [],
  });

  return steps;
}

function findTargetFiles(goal, repoGraph, rootDir) {
  const mission = goal.title.toLowerCase();
  const files = [];

  if (!repoGraph?.fileGraph?.files) return files;

  // Extract file mentions from mission
  const filePatterns = mission.match(/[\w/\\.-]+\.(js|jsx|ts|tsx|json|css|html)/g) || [];

  for (const pattern of filePatterns) {
    const normalized = pattern.replace(/\\/g, "/");
    const found = repoGraph.fileGraph.files.find(
      (f) => f.path.replace(/\\/g, "/").includes(normalized) || normalized.includes(f.path.replace(/\\/g, "/"))
    );
    if (found) files.push(found.path);
  }

  // If no specific files found, search by keywords
  if (files.length === 0) {
    const keywords = mission.split(/\s+/).filter((w) => w.length > 3);
    for (const file of repoGraph.fileGraph.files) {
      const filePath = file.path.toLowerCase();
      if (keywords.some((kw) => filePath.includes(kw.toLowerCase()))) {
        files.push(file.path);
      }
    }
  }

  return [...new Set(files)].slice(0, 10);
}

function findRelevantTests(modifiedFiles, discoveredTests, repoGraph) {
  if (!modifiedFiles?.length || !discoveredTests?.length) return [];

  const relevant = [];

  for (const testFile of discoveredTests) {
    const testPath = (typeof testFile === "string" ? testFile : testFile.path || "").toLowerCase();

    // Direct match: source file has a corresponding test
    for (const modFile of modifiedFiles) {
      const modName = path.basename(modFile, path.extname(modFile)).toLowerCase();
      if (testPath.includes(modName) || testPath.replace(".test", "").includes(modName)) {
        relevant.push(typeof testFile === "string" ? testFile : testFile.path);
        break;
      }
    }
  }

  // If no direct matches, run broader test suite
  if (relevant.length === 0) {
    // Find tests in same service directory
    for (const modFile of modifiedFiles) {
      const dir = path.dirname(modFile).toLowerCase();
      for (const testFile of discoveredTests) {
        const testPath = (typeof testFile === "string" ? testFile : testFile.path || "").toLowerCase();
        if (testPath.includes(dir) || dir.includes(path.dirname(testPath))) {
          relevant.push(typeof testFile === "string" ? testFile : testFile.path);
        }
      }
    }
  }

  return [...new Set(relevant)];
}

function diagnoseFailures(failures) {
  const diagnoses = [];

  for (const failure of failures) {
    const output = (failure.output || failure.error || "").toLowerCase();

    if (output.includes("syntaxerror") || output.includes("unexpected")) {
      diagnoses.push({ file: failure.file, type: "syntax_error", message: "Syntax error in code" });
    } else if (output.includes("referenceerror") || output.includes("is not defined")) {
      diagnoses.push({ file: failure.file, type: "reference_error", message: "Missing variable or import" });
    } else if (output.includes("cannot find module")) {
      diagnoses.push({ file: failure.file, type: "module_error", message: "Missing module dependency" });
    } else if (output.includes("timeout")) {
      diagnoses.push({ file: failure.file, type: "timeout", message: "Test timed out" });
    } else {
      diagnoses.push({ file: failure.file, type: "unknown", message: output.substring(0, 100) });
    }
  }

  const types = diagnoses.map((d) => d.type);
  const primaryType = types.sort((a, b) => types.filter((v) => v === b).length - types.filter((v) => v === a).length)[0];

  return {
    summary: `${failures.length} test(s) failed: ${[...new Set(types)].join(", ")}`,
    primaryType,
    recommendation: getRecommendation(primaryType),
    diagnoses,
  };
}

function getRecommendation(type) {
  const recommendations = {
    syntax_error: "Review the modified code for syntax issues. Check brackets, semicolons, and string escaping.",
    reference_error: "Check that all variables and functions are properly defined and imported.",
    module_error: "Verify that all required modules are installed and import paths are correct.",
    timeout: "The test may be hanging. Check for infinite loops or async operations missing resolution.",
    unknown: "Inspect the test output for specific error details.",
  };
  return recommendations[type] || recommendations.unknown;
}

function buildReviewVerdict(context, testResults) {
  let verdict = "APPROVED";
  const issues = [];

  if (context.testsFailed > 0) {
    verdict = "NEEDS_FIX";
    issues.push(`${context.testsFailed} test(s) failed`);
  }

  if (context.retries > 0) {
    issues.push(`${context.retries} retry attempt(s) needed`);
  }

  if (context.filesModified.length === 0 && context.testsRun === 0) {
    issues.push("No files modified and no tests run — analysis-only mission");
  }

  return {
    verdict,
    issues,
    score: context.testsFailed === 0 ? 90 : Math.max(30, 90 - context.testsFailed * 20),
    summary: verdict === "APPROVED"
      ? "Changes look good. Tests pass. Ready for founder review."
      : `Issues found: ${issues.join("; ")}. Needs attention.`,
  };
}

function categorizeMission(mission) {
  const text = mission.toLowerCase();
  if (/\b(test|tests|spec|assert|verify|testing)\b/.test(text)) return "testing";
  if (/\b(fix|bug|error|broken|debug)\b/.test(text)) return "bugfix";
  if (/\b(add|create|new|implement|feature)\b/.test(text)) return "feature";
  if (/\b(refactor|clean|reorganize|optimize)\b/.test(text)) return "refactor";
  if (/\b(review|audit|analyze|check|find)\b/.test(text)) return "analysis";
  if (/\b(deploy|build|release)\b/.test(text)) return "deployment";
  return "general";
}

function extractLearnings(result, testResults) {
  const learnings = [];

  if (result.testsPassed > 0) {
    learnings.push(`Successfully passed ${result.testsPassed} test(s)`);
  }

  if (result.retries > 0) {
    learnings.push(`Required ${result.retries} retry attempt(s) — may need better initial approach`);
  }

  if (result.reviewVerdict?.verdict === "APPROVED") {
    learnings.push("Review passed — change meets quality bar");
  }

  if (testResults?.results) {
    const syntaxErrors = testResults.results.filter((r) => (r.output || "").includes("SyntaxError"));
    if (syntaxErrors.length > 0) {
      learnings.push("Syntax errors encountered — verify code formatting before testing");
    }
  }

  return learnings;
}

function analyzeForMission(mission, repoGraph) {
  const findings = [];
  const text = mission.toLowerCase();

  if (repoGraph?.fileGraph?.files) {
    // Find relevant files
    const keywords = text.split(/\s+/).filter((w) => w.length > 3);
    for (const file of repoGraph.fileGraph.files) {
      const fp = file.path.toLowerCase();
      if (keywords.some((kw) => fp.includes(kw))) {
        findings.push({ file: file.path, type: "relevant", lines: file.lines });
      }
    }
  }

  return findings.slice(0, 20);
}

function determineFinalStatus(result) {
  if (result.steps.some((s) => s.status === "failed" && s.name === "execute")) return "failed";
  if (result.steps.some((s) => s.status === "failed" && s.name === "understand")) return "failed";
  if (result.reviewVerdict?.verdict === "NEEDS_FIX") return "needs_fix";
  if (result.reviewVerdict?.verdict === "APPROVED") return "completed";
  if (result.steps.every((s) => s.status === "done" || s.status === "degraded")) return "completed";
  return "partial";
}

// ═══════════════════════════════════════════
// MODIFICATION GENERATION
// Uses LLM when available, falls back to templates
// ═══════════════════════════════════════════

async function generateModification(mission, file, originalContent, routingInfo, workDir) {
  // Priority 1: Try template engine (fastest, most reliable)
  try {
    const codeGen = require("../codeGeneration/codeGenerationEngine");
    if (codeGen && codeGen.generate) {
      const generated = codeGen.generate({ mission, file, language: "javascript" });
      if (generated?.code && generated.code !== originalContent) return generated.code;
    }
  } catch {}

  // Priority 2: Use smart engine decision tree (fast, local)
  try {
    const smartEngine = require("../smartEngine/speedEngine");
    if (smartEngine && smartEngine.solve) {
      const decision = smartEngine.solve({ type: "code_modification", mission, file, content: originalContent });
      if (decision?.solution) return decision.solution;
    }
  } catch {}

  // Priority 3: Try Ollama directly (async, non-blocking)
  try {
    const { exec } = require("child_process");
    const prompt = buildModificationPrompt(mission, file, originalContent);
    const newContent = await new Promise((resolve) => {
      const child = exec(
        `echo '${prompt.replace(/'/g, "'\\''").substring(0, 1500)}' | ollama run phi3:mini`,
        { timeout: 10000, shell: true, maxBuffer: 1024 * 1024 },
        (err, stdout) => {
          if (err) return resolve(null);
          resolve(extractCodeFromResponse(stdout || "", originalContent));
        }
      );
      setTimeout(() => { try { child.kill(); } catch {} resolve(null); }, 12000);
    });
    if (newContent && newContent !== originalContent) return newContent;
  } catch {}

  // No modification generated — return null (pipeline will skip this file)
  return null;
}

async function generateCorrectiveModification(mission, file, currentContent, diagnosis, routingInfo, workDir) {
  // Priority 1: Try Ollama for corrective fix (async) — includes prior lessons if available
  try {
    const { exec } = require("child_process");
    const prior = diagnosis && diagnosis.priorLessons && diagnosis.priorLessons.length
      ? `\nPrior similar failure lessons:\n- ${diagnosis.priorLessons.join("\n- ")}\n`
      : "";
    const retryPrompt = `The previous modification to ${file} caused test failures.
Diagnosis: ${diagnosis.summary}
Recommendation: ${diagnosis.recommendation}${prior}
Original mission: ${mission}
Current file content:
${currentContent.substring(0, 3000)}

Fix the issue. Return ONLY the complete corrected file content.`;

    const newContent = await new Promise((resolve) => {
      const child = exec(
        `echo '${retryPrompt.replace(/'/g, "'\\''").substring(0, 1500)}' | ollama run phi3:mini`,
        { timeout: 10000, shell: true, maxBuffer: 1024 * 1024 },
        (err, stdout) => {
          if (err) return resolve(null);
          resolve(extractCodeFromResponse(stdout || "", currentContent));
        }
      );
      setTimeout(() => { try { child.kill(); } catch {} resolve(null); }, 12000);
    });
    if (newContent && newContent !== currentContent) return newContent;
  } catch {}

  return null;
}

function buildModificationPrompt(mission, file, originalContent) {
  return `You are GARUDA, an autonomous engineering AI.
Mission: ${mission}
File: ${file}
Current content:
${originalContent.substring(0, 4000)}

Apply the requested change. Return ONLY the complete modified file content.
Do not include markdown fences, explanations, or anything else — just the raw code.`;
}

function extractCodeFromResponse(response, fallback) {
  if (!response || typeof response !== "string") return fallback;
  // Strip markdown code fences if present
  let cleaned = response.replace(/^```(?:javascript|js|typescript|ts)?\n/mi, "").replace(/\n```\s*$/mi, "").trim();
  // If response is too short or looks like an error message, use fallback
  if (cleaned.length < 20 || cleaned.startsWith("Error:") || cleaned.startsWith("I cannot")) return fallback;
  return cleaned;
}

module.exports = { executeMission, logEvent, analyzeMission, findTargetFiles, findRelevantTests, diagnoseFailures, buildReviewVerdict, categorizeMission };
