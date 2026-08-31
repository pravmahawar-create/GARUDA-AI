/**
 * GARUDA Engineering Pipeline — Tests
 * Verifies the closed-loop pipeline actually works.
 */

const { executeMission, analyzeMission, findTargetFiles, findRelevantTests, diagnoseFailures, buildReviewVerdict, categorizeMission } = require("./engineeringPipeline");

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) { passed++; console.log(`  PASS: ${name}`); }
  else { failed++; console.log(`  FAIL: ${name}`); }
}

async function testAnalyzeMission() {
  console.log("\n--- analyzeMission ---");

  const repoGraph = {
    fileGraph: { totalFiles: 100, files: [{ path: "src/app.js", lines: 50 }, { path: "src/routes/api.js", lines: 30 }] },
    routeMapper: { totalRoutes: 10 },
    testMapper: { totalTests: 25 },
  };

  const analysisSteps = analyzeMission("Analyze the codebase for issues", repoGraph);
  assert(analysisSteps.length > 0, "Analysis mission produces steps");
  assert(analysisSteps[0].type === "analysis", "First step is analysis");

  const modSteps = analyzeMission("Add a new function to app.js", repoGraph);
  assert(modSteps.some((s) => s.type === "modification"), "Modification mission includes modification steps");
  assert(modSteps.some((s) => s.type === "testing"), "Modification mission includes testing step");
}

async function testFindTargetFiles() {
  console.log("\n--- findTargetFiles ---");

  const repoGraph = {
    fileGraph: {
      files: [
        { path: "src/app.js", lines: 50 },
        { path: "src/services/healthService.js", lines: 100 },
        { path: "src/routes/api.js", lines: 30 },
      ],
    },
  };

  const goal = { title: "Fix the healthService.js file" };
  const files = findTargetFiles(goal, repoGraph, process.cwd());
  assert(files.length > 0, "Finds target files from mission description");
  assert(files.some((f) => f.includes("healthService")), "Correctly identifies healthService.js");

  const goal2 = { title: "Analyze the codebase" };
  const files2 = findTargetFiles(goal2, repoGraph, process.cwd());
  assert(Array.isArray(files2), "Returns array even for analysis missions");
}

async function testFindRelevantTests() {
  console.log("\n--- findRelevantTests ---");

  const modifiedFiles = ["src/services/healthService.js"];
  const discoveredTests = [
    "src/services/healthService.test.js",
    "src/services/memoryService.test.js",
    "src/routes/api.test.js",
  ];

  const relevant = findRelevantTests(modifiedFiles, discoveredTests, null);
  assert(relevant.length > 0, "Finds relevant tests");
  assert(relevant.some((t) => t.includes("healthService")), "Maps healthService.js to its test");

  const noTests = findRelevantTests([], discoveredTests, null);
  assert(noTests.length === 0, "Returns empty for no modified files");
}

async function testDiagnoseFailures() {
  console.log("\n--- diagnoseFailures ---");

  const syntaxFailures = [
    { file: "test.js", output: "SyntaxError: Unexpected token" },
  ];
  const diag = diagnoseFailures(syntaxFailures);
  assert(diag.summary.includes("1 test(s) failed"), "Reports failure count");
  assert(diag.primaryType === "syntax_error", "Identifies syntax errors");
  assert(diag.recommendation.length > 0, "Provides recommendation");

  const refFailures = [
    { file: "test.js", output: "ReferenceError: foo is not defined" },
  ];
  const diag2 = diagnoseFailures(refFailures);
  assert(diag2.primaryType === "reference_error", "Identifies reference errors");

  const moduleFailures = [
    { file: "test.js", output: "Cannot find module 'xyz'" },
  ];
  const diag3 = diagnoseFailures(moduleFailures);
  assert(diag3.primaryType === "module_error", "Identifies module errors");
}

async function testBuildReviewVerdict() {
  console.log("\n--- buildReviewVerdict ---");

  const passing = buildReviewVerdict(
    { testsFailed: 0, retries: 0, filesModified: ["app.js"], testsRun: 5 },
    null
  );
  assert(passing.verdict === "APPROVED", "Approves when tests pass");
  assert(passing.score > 80, "High score for passing");

  const failing = buildReviewVerdict(
    { testsFailed: 3, retries: 1, filesModified: ["app.js"], testsRun: 5 },
    null
  );
  assert(failing.verdict === "NEEDS_FIX", "Needs fix when tests fail");
  assert(failing.score < 80, "Lower score for failures");
}

async function testCategorizeMission() {
  console.log("\n--- categorizeMission ---");

  assert(categorizeMission("Fix the login bug") === "bugfix", "Categorizes bugfix");
  assert(categorizeMission("Add a new API endpoint") === "feature", "Categorizes feature");
  assert(categorizeMission("Refactor the database layer") === "refactor", "Categorizes refactor");
  assert(categorizeMission("Review the security audit") === "analysis", "Categorizes analysis");
  assert(categorizeMission("Run all tests") === "testing", "Categorizes testing");
}

async function testExecuteMission() {
  console.log("\n--- executeMission (analysis-only) ---");

  // Analysis-only mission — should not modify anything
  const result = await executeMission("Analyze the orchestrator service for potential issues", {
    rootDir: process.cwd(),
    dryRun: true,
  });

  assert(result.status !== undefined, "Returns a status");
  assert(result.steps.length > 0, "Has steps");
  assert(result.timeMs >= 0, "Records execution time");
  assert(result.evidence.length > 0, "Collects evidence");

  // Check that understand step ran (may have multiple entries: running + done)
  const understandSteps = result.steps.filter((s) => s.name === "understand");
  assert(understandSteps.length > 0, "Has understand step");
  assert(understandSteps.some((s) => s.status === "done"), "Understand step completed");

  // Check that plan step ran
  const planSteps = result.steps.filter((s) => s.name === "plan");
  assert(planSteps.length > 0, "Has plan step");

  // Check that route step ran
  const routeSteps = result.steps.filter((s) => s.name === "route");
  assert(routeSteps.length > 0, "Has route step");

  // Check that review step ran
  const reviewSteps = result.steps.filter((s) => s.name === "review");
  assert(reviewSteps.length > 0, "Has review step");

  // Check that learn step ran
  const learnSteps = result.steps.filter((s) => s.name === "learn");
  assert(learnSteps.length > 0, "Has learn step");

  console.log(`  INFO: Pipeline completed in ${result.timeMs}ms with ${result.steps.length} steps`);
  console.log(`  INFO: Status: ${result.status}`);
  console.log(`  INFO: Steps: ${result.steps.map((s) => `${s.name}:${s.status}`).join(", ")}`);
}

async function testExecuteMissionWithGit() {
  console.log("\n--- executeMission (with git worktree) ---");

  const result = await executeMission("Find all files related to the goal engine", {
    rootDir: process.cwd(),
  });

  assert(result.steps.length > 0, "Pipeline runs");
  assert(result.timeMs > 0, "Takes measurable time");

  const isolateSteps = result.steps.filter((s) => s.name === "isolate");
  if (isolateSteps.length > 0) {
    assert(isolateSteps.some((s) => s.status === "done"), "Isolation step completed");
  }
}

async function testPipelineLog() {
  console.log("\n--- Pipeline logging ---");

  const fs = require("fs");
  const path = require("path");
  const logPath = path.join(__dirname, "..", "..", "..", "data", "engineering", "pipeline-log.jsonl");

  // The previous test should have written to the log
  if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    assert(lines.length > 0, "Pipeline log has entries");
    const lastEntry = JSON.parse(lines[lines.length - 1]);
    assert(lastEntry.mission !== undefined, "Log entries have mission field");
    assert(lastEntry.timestamp !== undefined, "Log entries have timestamp");
  } else {
    assert(false, "Pipeline log file was not created");
  }
}

async function runTests() {
  console.log("=== GARUDA Engineering Pipeline Tests ===");

  await testAnalyzeMission();
  await testFindTargetFiles();
  await testFindRelevantTests();
  await testDiagnoseFailures();
  await testBuildReviewVerdict();
  await testCategorizeMission();
  await testExecuteMission();
  await testExecuteMissionWithGit();
  await testPipelineLog();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
