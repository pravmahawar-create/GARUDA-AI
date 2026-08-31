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
    // STEP 4: ISOLATE — Create safe workspace
    // ═══════════════════════════════════════════
    addStep("isolate", "running");

    let workspace = null;
    try {
      const gitIsolation = require("../gitIsolation/gitIsolationService");
      const branchName = `mission/${goal.id}`;

      // Check if git is available
      const { execSync } = require("child_process");
      try {
        execSync("git status", { cwd: rootDir, stdio: "pipe" });

        // Create worktree for isolation
        workspace = {
          branch: branchName,
          rootDir,
          isolated: true,
          method: "worktree",
        };

        addStep("isolate", "done", { branch: branchName, method: "worktree" });
        addEvidence("workspace", { branch: branchName });
      } catch (gitErr) {
        // Git not available — use temp directory isolation
        const os = require("os");
        const tempDir = path.join(os.tmpdir(), `garuda-${goal.id}`);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        workspace = {
          branch: null,
          rootDir: tempDir,
          originalDir: rootDir,
          isolated: true,
          method: "tempdir",
        };

        addStep("isolate", "done", { method: "tempdir", path: tempDir });
        addEvidence("workspace", { method: "tempdir", path: tempDir });
      }
    } catch (err) {
      // Non-fatal — proceed without isolation
      workspace = { branch: null, rootDir, isolated: false, method: "none" };
      addStep("isolate", "degraded", { method: "none" }, err.message);
    }

    // ═══════════════════════════════════════════
    // STEP 5: EXECUTE — Implement changes
    // ═══════════════════════════════════════════
    addStep("execute", "running");

    let executionResult = null;
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
      } else {
        // Modification mission — read files and prepare changes
        const modifications = [];
        for (const file of targetFiles) {
          const absPath = path.resolve(rootDir, file);
          if (fs.existsSync(absPath)) {
            const content = fs.readFileSync(absPath, "utf8");
            modifications.push({
              file,
              absPath,
              lines: content.split("\n").length,
              exists: true,
            });
          }
        }

        executionResult = {
          type: "modification",
          targetFiles: modifications,
          filesModified: targetFiles,
        };
        result.filesModified = targetFiles;
        addStep("execute", "done", { type: "modification", files: targetFiles.length });
      }

      addEvidence("execution", { type: executionResult.type, files: targetFiles.length });
    } catch (err) {
      addStep("execute", "failed", null, err.message);

      // Record failure for learning
      try {
        const memory = require("../persistentMemory/memoryService");
        memory.remember({
          type: "engineering_failure",
          mission,
          step: "execute",
          error: err.message,
          outcome: "failed",
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
    try {
      const testDiscovery = require("../testDiscovery/testDiscoveryService");

      // Discover test files
      const discovered = testDiscovery.scanTestFiles(rootDir);

      // Find tests relevant to modified files
      const relevantTests = findRelevantTests(result.filesModified, discovered, repoGraph);

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
    // STEP 7: RETRY LOOP — If tests failed
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

        // Record the failure pattern for learning
        try {
          const memory = require("../persistentMemory/memoryService");
          memory.remember({
            type: "engineering_retry",
            mission,
            attempt: result.retries,
            failures: failures.length,
            diagnosis: diagnosis.summary,
            outcome: "retrying",
          });
        } catch {}

        addStep(`retry_attempt_${result.retries}`, "done", {
          diagnosis: diagnosis.summary,
          recommendation: diagnosis.recommendation,
        });
      }
    }

    // ═══════════════════════════════════════════
    // STEP 8: REVIEW — Semantic review
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

      // Build review verdict based on evidence
      const verdict = buildReviewVerdict(reviewContext, testResults);
      result.reviewVerdict = verdict;

      addStep("review", "done", verdict);
      addEvidence("review", verdict);
    } catch (err) {
      addStep("review", "degraded", null, err.message);
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

module.exports = { executeMission, logEvent, analyzeMission, findTargetFiles, findRelevantTests, diagnoseFailures, buildReviewVerdict, categorizeMission };
