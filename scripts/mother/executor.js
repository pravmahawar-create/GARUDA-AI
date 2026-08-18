const { routeTask } = require("./router");
const { extractExplicitRepoPaths } = require("./goalEngine");
const { requiresFounderApproval } = require("../../src/motherCore/approval/approvalPolicy");
const { evaluateConstitutionGate } = require("./constitution");
const { think } = require("./thinker");
const { validate } = require("./validator");
const { build } = require("./builder");
const { executeRevenueTask } = require("./revenueEngine");
const LocalBrainWorker = require("../dev-agent/workers/LocalBrainWorker");
const EngineeringBrain = require("../dev-agent/core/EngineeringBrain");
const ReviewerBrain = require("../dev-agent/core/ReviewerBrain");
const ArchitectBrain = require("../dev-agent/core/ArchitectBrain");
const GovernedEngineeringLoop = require("../dev-agent/core/GovernedEngineeringLoop");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const CAPABILITIES = Object.freeze({
  READ: "READ",
  SEARCH: "SEARCH",
  WRITE_PATCH: "WRITE_PATCH",
  PATCH_EXISTING_FILE: "PATCH_EXISTING_FILE",
  COMMAND_EXECUTION: "COMMAND_EXECUTION",
  TEST_DISCOVERY: "TEST_DISCOVERY",
  TEST_EXECUTION: "TEST_EXECUTION",
  DIFF_INSPECTION: "DIFF_INSPECTION",
  CODE_REVIEW: "CODE_REVIEW"
});

const EXECUTOR_CAPABILITIES = Object.freeze({
  thinker: [CAPABILITIES.READ, CAPABILITIES.SEARCH],
  validator: [CAPABILITIES.READ],
  test: [CAPABILITIES.READ, CAPABILITIES.TEST_DISCOVERY, CAPABILITIES.TEST_EXECUTION, CAPABILITIES.COMMAND_EXECUTION],
  builder: [CAPABILITIES.COMMAND_EXECUTION],
  mother: [CAPABILITIES.READ, CAPABILITIES.SEARCH],
  revenue: [CAPABILITIES.READ, CAPABILITIES.SEARCH],
  engineering: [CAPABILITIES.READ, CAPABILITIES.DIFF_INSPECTION, CAPABILITIES.TEST_EXECUTION],
  review: [CAPABILITIES.READ, CAPABILITIES.DIFF_INSPECTION, CAPABILITIES.CODE_REVIEW],
  architect: [CAPABILITIES.READ, CAPABILITIES.SEARCH],
  engineering_loop: [CAPABILITIES.READ, CAPABILITIES.SEARCH, CAPABILITIES.WRITE_PATCH, CAPABILITIES.PATCH_EXISTING_FILE, CAPABILITIES.TEST_DISCOVERY, CAPABILITIES.TEST_EXECUTION, CAPABILITIES.DIFF_INSPECTION, CAPABILITIES.CODE_REVIEW, CAPABILITIES.COMMAND_EXECUTION],
  patch: [CAPABILITIES.READ, CAPABILITIES.WRITE_PATCH, CAPABILITIES.DIFF_INSPECTION, CAPABILITIES.TEST_EXECUTION],
  git: [CAPABILITIES.READ, CAPABILITIES.SEARCH],
  general: [CAPABILITIES.READ, CAPABILITIES.SEARCH]
});

function normalizeTaskText(task = "") {
  return String(task || "").trim();
}

function normalizeRepoPath(value = "") {
  return String(value || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function uniquePaths(paths = []) {
  return Array.from(new Set((Array.isArray(paths) ? paths : []).map(normalizeRepoPath).filter(Boolean)));
}

function filterExistingTestFiles(filePaths = []) {
  return uniquePaths(filePaths).filter((candidate) => {
    if (!candidate) {
      return false;
    }
    const absolutePath = path.isAbsolute(candidate)
      ? candidate
      : path.join(process.cwd(), candidate);
    return fs.existsSync(absolutePath);
  });
}

function gatherCapabilityScope(item = {}) {
  const context = item.capabilityContext || (item.loopRequest && item.loopRequest.capabilityContext) || null;
  const scope = item.scope || (item.loopRequest && item.loopRequest.scope) || null;
  const capabilityId = (context && context.capabilityId) || (scope && scope.capabilityId) || null;
  const allowedImplementationLocations = uniquePaths(
    (scope && scope.allowedImplementationLocations)
    || (context && context.implementationLocations)
    || []
  );
  const relatedTestLocations = uniquePaths(
    (scope && scope.relatedTestLocations)
    || (context && context.relatedTests)
    || []
  );
  const scopeExpansions = Array.isArray(scope && scope.scopeExpansions) ? scope.scopeExpansions : [];
  return {
    capabilityId,
    allowedImplementationLocations,
    relatedTestLocations,
    scopeExpansionPolicy: (scope && scope.scopeExpansionPolicy) || "explicit_reason_required",
    scopeExpansions
  };
}

function mapApprovedScopeExpansions(scope = {}) {
  const approved = new Map();
  (scope.scopeExpansions || []).forEach((entry) => {
    if (!entry || !entry.path) {
      return;
    }
    const normalizedPath = normalizeRepoPath(entry.path);
    if (!normalizedPath) {
      return;
    }
    const explicitApproved = entry.approved === true || entry.status === "APPROVED";
    const hasReason = typeof entry.why === "string" && entry.why.trim().length > 0;
    const hasRelationship = typeof entry.relationship === "string" && entry.relationship.trim().length > 0;
    const hasEffect = typeof entry.expectedEffect === "string" && entry.expectedEffect.trim().length > 0;
    if (explicitApproved && hasReason && hasRelationship && hasEffect) {
      approved.set(normalizedPath, {
        path: normalizedPath,
        why: entry.why,
        relationship: entry.relationship,
        expectedEffect: entry.expectedEffect,
        approved: true
      });
    }
  });
  return approved;
}

function attributeCapabilityDiff(scope = {}, filesChanged = []) {
  const normalizedChanged = uniquePaths(filesChanged);
  const allowedSet = new Set(uniquePaths(scope.allowedImplementationLocations));
  const approvedExpansions = mapApprovedScopeExpansions(scope);
  const approvedExpansionSet = new Set(Array.from(approvedExpansions.keys()));

  const filesWithinCapabilitySurface = normalizedChanged.filter((file) => allowedSet.has(file));
  const filesOutsideCapabilitySurface = normalizedChanged.filter((file) => !allowedSet.has(file));
  const filesWithinApprovedExpansion = filesOutsideCapabilitySurface.filter((file) => approvedExpansionSet.has(file));
  const unauthorizedOutside = filesOutsideCapabilitySurface.filter((file) => !approvedExpansionSet.has(file));

  return {
    selectedCapability: scope.capabilityId || null,
    knownImplementationLocations: uniquePaths(scope.allowedImplementationLocations),
    filesChanged: normalizedChanged,
    filesWithinCapabilitySurface,
    filesOutsideCapabilitySurface,
    filesWithinApprovedExpansion,
    unauthorizedOutside,
    scopeExpansions: Array.from(approvedExpansions.values()),
    relevantDiff: uniquePaths([...filesWithinCapabilitySurface, ...filesWithinApprovedExpansion]),
    unrelatedDiff: unauthorizedOutside,
    hasSelectedCapabilityImplementationChange: filesWithinCapabilitySurface.length > 0
  };
}

function inferTargetSlug(item = {}) {
  const taskText = normalizeTaskText(item.task);
  const match = taskText.match(/\bfor\s+([a-zA-Z0-9_\-\.\/]+)\b/i)
    || taskText.match(/\bof\s+([a-zA-Z0-9_\-\.\/]+)\b/i)
    || taskText.match(/\bmodule\s+([a-zA-Z0-9_\-\.\/]+)\b/i)
    || taskText.match(/\bnamed\s+([a-zA-Z0-9_\-\.\/]+)\b/i);
  const candidate = match ? match[1] : "autonomyImprovement";
  return String(candidate).replace(/\.(js|ts|json)$/i, "").replace(/[^a-zA-Z0-9_\-]/g, "") || "autonomyImprovement";
}

function hasNegativeWriteConstraint(taskText = "") {
  const text = normalizeTaskText(taskText).toLowerCase();
  if (!text) {
    return false;
  }

  const explicitNegationPattern = /\b(?:do not|don't|dont|never|no|without|avoid|stop)\b/i;
  const writeTermPattern = /\b(?:modify|modifying|edit|editing|write|writes|writing|change|changes|changing|patch|patching|create|creating|delete|deleting|commit|committing|push|pushing|file|files|anything|code)\b/i;
  const readOnlyPattern = /\b(?:read-only|read only|read_only|no writes?|no changes?|no edits?|no modifications?|without changing|without modifying|without editing|don't commit|don't push|don't modify|don't write|dont commit|dont push|dont modify|dont write)\b/i;

  if (readOnlyPattern.test(text)) {
    return true;
  }

  if (!explicitNegationPattern.test(text)) {
    return false;
  }

  return writeTermPattern.test(text);
}

function inferRequiredCapabilities(item = {}, initialRoute = "general") {
  const taskText = normalizeTaskText(item.task).toLowerCase();
  const required = new Set([CAPABILITIES.READ]);
  const isReviewTask = /\breview\b/.test(taskText);
  const isReadOnlyAudit = hasNegativeWriteConstraint(taskText) || /\b(read-only|read_only_audit|read_only)\b/i.test(taskText) || item.readOnly === true;
  const writeIntentPattern = /\b(?:implement(?:ing|ed)?|create(?:d|s|ing)?|modify(?:ing|ied|ies)?|update(?:d|s|ing)?|fix(?:es|ed|ing)?|refactor(?:ed|ing|s)?|repair(?:ed|ing|s)?|patch(?:es|ed|ing)?|write(?:s|n|ing|ten)?)\b/;

  if (/inspect|analy|search|scan|discover/.test(taskText)) {
    required.add(CAPABILITIES.SEARCH);
  }

  if (!isReviewTask && !isReadOnlyAudit && writeIntentPattern.test(taskText)) {
    required.add(CAPABILITIES.WRITE_PATCH);
    required.add(CAPABILITIES.DIFF_INSPECTION);
  }

  if (/review/.test(taskText)) {
    required.add(CAPABILITIES.DIFF_INSPECTION);
    required.add(CAPABILITIES.CODE_REVIEW);
  }

  if (!isReadOnlyAudit && (/\b(test|verify|validation|spec)\b/.test(taskText) || initialRoute === "test")) {
    required.add(CAPABILITIES.TEST_DISCOVERY);
    required.add(CAPABILITIES.TEST_EXECUTION);
    required.add(CAPABILITIES.COMMAND_EXECUTION);
  }

  return Array.from(required);
}

function hasAllCapabilities(route, requiredCapabilities = []) {
  const advertised = new Set(EXECUTOR_CAPABILITIES[route] || []);
  return requiredCapabilities.every((capability) => advertised.has(capability));
}

function isVerificationIntent(initialRoute, taskText = "", requiredCapabilities = []) {
  const normalizedTask = normalizeTaskText(taskText).toLowerCase();
  const hasVerificationSignal = /\b(test|tests|testing|spec|unit test|integration test|verify|verification|validation|check)\b/.test(normalizedTask);
  const requiresTestExecution = (requiredCapabilities || []).includes(CAPABILITIES.TEST_EXECUTION);
  return requiresTestExecution && (hasVerificationSignal || initialRoute === "test" || initialRoute === "validator");
}

function chooseCapabilityCompatibleRoute(initialRoute, requiredCapabilities = [], taskText = "") {
  if (hasAllCapabilities(initialRoute, requiredCapabilities)) {
    return initialRoute;
  }

  const requiredSet = new Set(requiredCapabilities || []);
  const verificationIntent = isVerificationIntent(initialRoute, taskText, requiredCapabilities);
  if (verificationIntent && hasAllCapabilities("test", [CAPABILITIES.READ, CAPABILITIES.TEST_DISCOVERY, CAPABILITIES.TEST_EXECUTION, CAPABILITIES.COMMAND_EXECUTION])) {
    return "test";
  }

  let preferredOrder = ["review", "test", "architect", "thinker", "mother", "general", "engineering_loop"];

  if (requiredSet.has(CAPABILITIES.WRITE_PATCH)) {
    preferredOrder = ["engineering_loop", "review", "test", "architect", "thinker", "mother", "general"];
  } else if (requiredSet.has(CAPABILITIES.CODE_REVIEW)) {
    preferredOrder = ["review", "engineering_loop", "test", "architect", "thinker", "mother", "general"];
  } else if (requiredSet.has(CAPABILITIES.TEST_EXECUTION)) {
    preferredOrder = ["test", "engineering_loop", "review", "architect", "thinker", "mother", "general"];
  }

  const found = preferredOrder.find((route) => hasAllCapabilities(route, requiredCapabilities));
  return found || null;
}

function discoverTestsNearTarget(targetSlug, relatedPaths = []) {
  const roots = ["src/generated", "src/services", "scripts", "test", "tests"];
  const discovered = [];

  function walk(dir, maxDepth = 4, depth = 0) {
    if (depth > maxDepth || !fs.existsSync(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) {
          continue;
        }
        walk(fullPath, maxDepth, depth + 1);
        continue;
      }

      if (!entry.isFile() || !/\.(test|spec)\.(c?js|mjs)$/i.test(entry.name)) {
        continue;
      }

      const relative = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");
      const lower = relative.toLowerCase();
      const relatedMatch = relatedPaths.some((candidate) => {
        const normalized = String(candidate || "").replace(/\\/g, "/").toLowerCase().replace(/\.(js|ts|tsx|jsx)$/i, "");
        return normalized && lower.includes(path.basename(normalized));
      });

      if (targetSlug && !entry.name.toLowerCase().includes(targetSlug.toLowerCase()) && !relatedMatch) {
        continue;
      }

      discovered.push(relative);
    }
  }

  for (const root of roots) {
    const dir = path.join(process.cwd(), root);
    if (!fs.existsSync(dir)) {
      continue;
    }
    walk(dir);
  }

  return Array.from(new Set(discovered));
}

function discoverTestTargets(item = {}) {
  const capabilityScope = gatherCapabilityScope(item);
  const capabilityRelatedTests = filterExistingTestFiles(capabilityScope.relatedTestLocations);
  if (capabilityRelatedTests.length) {
    return { discovered: capabilityRelatedTests, source: "capability_related_tests" };
  }

  const explicit = filterExistingTestFiles(Array.isArray(item.testFiles) ? item.testFiles.filter(Boolean) : []);
  if (explicit.length) {
    return { discovered: explicit, source: "explicit" };
  }

  const fromVerificationPlan = filterExistingTestFiles(
    item.loopRequest
      && item.loopRequest.verificationPlan
      && Array.isArray(item.loopRequest.verificationPlan.testsDiscovered)
      ? item.loopRequest.verificationPlan.testsDiscovered.filter(Boolean)
      : []
  );
  if (fromVerificationPlan.length) {
    return { discovered: fromVerificationPlan, source: "verification_plan" };
  }

  const fromFiles = filterExistingTestFiles(
    Array.isArray(item.files)
      ? item.files.filter((file) => /\.test\.(c?js|mjs)$/i.test(String(file || "")))
      : []
  );
  if (fromFiles.length) {
    return { discovered: fromFiles, source: "task_files" };
  }

  const fromChangedScope = Array.isArray(item.changedFiles)
    ? item.changedFiles
      .map((filePath) => String(filePath || "").replace(/\.(js|ts|tsx|jsx)$/i, ".test.js"))
      .filter((candidate) => fs.existsSync(path.join(process.cwd(), candidate)))
    : [];
  if (fromChangedScope.length) {
    return { discovered: fromChangedScope, source: "changed_scope" };
  }

  const targetSlug = inferTargetSlug(item);
  const relatedPaths = [...capabilityScope.allowedImplementationLocations];
  if (item.loopRequest) {
    const engineeringSpec = item.loopRequest.engineeringSpec
      || (item.loopRequest.architectureRequest && item.loopRequest.architectureRequest.engineeringSpec);
    if (engineeringSpec) {
      if (engineeringSpec.modulePath) {
        relatedPaths.push(engineeringSpec.modulePath);
      }
      if (engineeringSpec.testPath) {
        relatedPaths.push(engineeringSpec.testPath);
      }
    }
  }

  const deterministicCandidates = [
    `src/generated/${targetSlug}.test.js`,
    `src/services/${targetSlug}.test.js`,
    `scripts/mother/${targetSlug}.test.js`
  ].filter((candidate) => fs.existsSync(path.join(process.cwd(), candidate)));

  if (deterministicCandidates.length) {
    return { discovered: deterministicCandidates, source: "deterministic_candidates" };
  }

  const nearby = discoverTestsNearTarget(targetSlug, relatedPaths);
  if (nearby.length) {
    return { discovered: nearby.slice(0, 6), source: "nearby_discovery" };
  }

  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (parsed && parsed.scripts && parsed.scripts.test) {
        return { discovered: [], source: "package_script", script: "test" };
      }
    } catch (error) {
      return { discovered: [], source: "package_script_invalid", parseError: error.message };
    }
  }

  return { discovered: [], source: "none" };
}

function resolveScriptFromPackageJson(scriptName = "test") {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const parsed = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const script = parsed && parsed.scripts && typeof parsed.scripts[scriptName] === "string" ? parsed.scripts[scriptName] : "";
    return { script };
  } catch {
    return { script: "" };
  }
}

function isRecursiveTestScript(script = "") {
  return /\btest:mother\b|\bmother\.js\b|scripts[\\/]mother[\\/]mother\.js\b/i.test(String(script || ""));
}

function moduleCandidatesForSyntaxCheck(item = {}) {
  const slug = inferTargetSlug(item);
  const candidates = [
    `src/generated/${slug}.js`,
    `src/services/${slug}.js`,
    `scripts/mother/${slug}.js`,
    `src/routes/${slug}.js`
  ];
  const spec = item.loopRequest && item.loopRequest.architectureRequest
    ? item.loopRequest.architectureRequest.engineeringSpec
    : null;
  if (spec && spec.modulePath) candidates.push(spec.modulePath);
  if (spec && spec.testPath) candidates.push(spec.testPath);
  if (Array.isArray(item.relatedPaths)) candidates.push(...item.relatedPaths);
  const existing = uniquePaths(candidates).filter((candidate) => {
    const abs = path.join(process.cwd(), candidate);
    return fs.existsSync(abs) && fs.statSync(abs).isFile() && /\.js$/.test(candidate);
  });
  if (!existing.length && fs.existsSync(path.join(process.cwd(), "scripts/mother/mother.js"))) {
    existing.push("scripts/mother/mother.js");
  }
  return existing.slice(0, 8);
}

function runSyntaxCheck(files = []) {
  const startedAt = Date.now();
  const results = files.map((file) => {
    const abs = path.join(process.cwd(), file);
    const result = spawnSync(process.execPath, ["--check", abs], {
      cwd: process.cwd(),
      encoding: "utf8",
      windowsHide: true,
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
      shell: false
    });
    return {
      targetFile: file,
      status: result.status === 0 && !result.error ? "PASSED" : "FAILED",
      exitCode: typeof result.status === "number" ? result.status : null,
      error: result.error ? result.error.code || result.error.message : null,
      stderr: String(result.stderr || "").slice(0, 2000),
      durationMs: Date.now() - startedAt,
      source: "syntax_check"
    };
  });
  const passed = results.length > 0 && results.every((entry) => entry.status === "PASSED");
  return { passed, results };
}

function runPackageTestScript(scriptName = "test", item = {}) {
  const { script } = resolveScriptFromPackageJson(scriptName);

  // Recursion guard: if the npm script shells back into mother (e.g. this repo's
  // "test": "npm run test:mother && ..." where test:mother runs mother.js), running
  // it would recurse forever. Fall back to bounded syntax validation instead.
  if (isRecursiveTestScript(script)) {
    const syntax = runSyntaxCheck(moduleCandidatesForSyntaxCheck(item));
    return {
      targetFile: `npm run ${scriptName}`,
      status: syntax.passed ? "PASSED" : "FAILED",
      exitCode: null,
      signal: null,
      stdout: "",
      stderr: syntax.passed ? "" : syntax.results.map((r) => `node --check ${r.targetFile}: ${r.status}`).join("\n"),
      shellUsed: false,
      command: process.execPath,
      arguments: ["--check"],
      durationMs: syntax.results.reduce((sum, r) => sum + (r.durationMs || 0), 0),
      source: "package_script_syntax_bounded",
      recursionGuard: true,
      syntaxChecks: syntax.results
    };
  }

  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `npm run ${scriptName}`]
    : ["run", scriptName];
  const startedAt = Date.now();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 6 * 1024 * 1024,
    shell: false
  });

  const durationMs = Date.now() - startedAt;
  const passed = result.status === 0 && !result.error;
  return {
    targetFile: `npm run ${scriptName}`,
    status: passed ? "PASSED" : "FAILED",
    exitCode: typeof result.status === "number" ? result.status : null,
    signal: result.signal || null,
    error: result.error ? result.error.code || result.error.message : null,
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
    shellUsed: false,
    command: command,
    arguments: args,
    durationMs,
    source: "package_script"
  };
}

function buildEngineeringLoopRequest(item = {}, founderApproved = false) {
  if (item.loopRequest && typeof item.loopRequest === "object") {
    return {
      ...item.loopRequest,
      founderApproved: Boolean(founderApproved || item.loopRequest.founderApproved),
      founderApprovalToken: Boolean(founderApproved || item.loopRequest.founderApprovalToken)
    };
  }

  const targetSlug = inferTargetSlug(item);
  return {
    goalId: `mother-loop-${targetSlug}`,
    goal: normalizeTaskText(item.task) || `Implement governed artifact for ${targetSlug}`,
    founderApproved: Boolean(founderApproved),
    architectureRequest: {
      goalId: `mother-loop-${targetSlug}`,
      goal: normalizeTaskText(item.task) || `Implement governed artifact for ${targetSlug}`,
      engineeringSpec: {
        template: "required_fields_validator",
        modulePath: `src/generated/${targetSlug}.js`,
        testPath: `src/generated/${targetSlug}.test.js`,
        requiredFields: ["id", "status", "timestamp"]
      }
    },
    verificationPlan: {
      changedCapability: targetSlug,
      testsDiscovered: discoverTestsNearTarget(targetSlug).slice(0, 6),
      commandsPlanned: [],
      expectedObservableBehavior: "targeted verification evidence should be captured"
    },
    capabilityContext: item.capabilityContext || null,
    scope: item.scope || null
  };
}

function extractFilesChanged(result = {}) {
  if (!result || !result.output) {
    return [];
  }

  if (Array.isArray(result.output.appliedFiles)) {
    return result.output.appliedFiles;
  }

  if (result.output.finalArtifact && Array.isArray(result.output.finalArtifact.artifacts)) {
    return result.output.finalArtifact.artifacts.map((item) => item.path).filter(Boolean);
  }

  return [];
}

function buildStructuredEvidence(item, route, executedRoute, requiredCapabilities, result, status, reason) {
  const output = result && result.output ? result.output : {};
  const filesChanged = extractFilesChanged(result);
  const capabilityScope = gatherCapabilityScope(item);
  const capabilityAttribution = capabilityScope.capabilityId
    ? attributeCapabilityDiff(capabilityScope, filesChanged)
    : null;
  const testsEvidence = output && output.evidence ? output.evidence : (output && output.verification ? output.verification : []);
  const testsExecuted = Array.isArray(testsEvidence)
    ? testsEvidence.map((entry) => entry.targetFile || entry.command || "unknown")
    : [];
  const testResults = Array.isArray(testsEvidence)
    ? testsEvidence.map((entry) => ({
        target: entry.targetFile || entry.command || "unknown",
        status: entry.status || "UNKNOWN",
        exitCode: entry.exitCode
      }))
    : [];

  return {
    missionId: String(item.missionId || "mother-engineering-mission"),
    taskId: String(item.id || item.step || item.task || "task"),
    executor: executedRoute,
    requiredCapabilities,
    capabilitiesUsed: EXECUTOR_CAPABILITIES[executedRoute] || [],
    filesInspected: Array.isArray(output.fileSample)
      ? output.fileSample.map((file) => (file && file.path ? file.path : file)).filter(Boolean)
      : [],
    filesChanged,
    diffEvidence: output && output.finalArtifact && output.finalArtifact.patch
      ? { patchSha256: output.finalArtifact.patchSha256, hasPatch: true }
      : (output && output.patchSha256 ? { patchSha256: output.patchSha256, hasPatch: true } : { hasPatch: false }),
    commandsExecuted: Array.isArray(testsEvidence)
      ? testsEvidence.map((entry) => ({ command: entry.command || "node", arguments: entry.arguments || [] }))
      : [],
    testsDiscovered: Array.isArray(output.testsDiscovered) ? output.testsDiscovered : [],
    testsExecuted,
    testResults,
    capabilityAttribution,
    reviewVerdict: output && output.finalReview ? output.finalReview.verdict : (output && output.verdict ? output.verdict : null),
    repairAttempts: output && Array.isArray(output.attempts) ? output.attempts.length : 0,
    verification: {
      status,
      success: status === "SUCCESS",
      reason
    },
    failureReason: status === "SUCCESS" ? null : reason,
    remainingWork: status === "SUCCESS" ? [] : ["diagnose", "replan", "retry_or_block"]
  };
}

function toEngineName(route) {
  const names = {
    git: "Git",
    builder: "Builder",
    validator: "Validator",
    thinker: "Thinker",
    patch: "Patch",
    test: "Test",
    revenue: "Revenue",
    engineering: "Engineering",
    review: "Reviewer",
    architect: "Architect",
    engineering_loop: "Governed Engineering Loop",
    general: "Local Brain"
  };

  return names[route] || "Local Brain";
}

function getFounderApprovalState() {
  const founderApprovalToken = process.env.GARUDA_FOUNDER_APPROVAL_TOKEN || "";
  const founderApproved =
    process.env.GARUDA_FOUNDER_APPROVED === "true" ||
    Boolean(founderApprovalToken);

  return {
    founderApproved,
    founderApprovalToken: Boolean(founderApprovalToken)
  };
}

function executeThinkerTask(item) {
  const result = think({
    projectClean: true,
    summary: {},
    buildRequired: false,
    validateRequired: false,
    tasks: [item.task]
  });

  return {
    success: true,
    output: result
  };
}

function executeValidatorTask(item) {
  const result = validate([item]);

  return {
    success: Boolean(result && result.passed),
    output: result
  };
}

function executeTestTask(item) {
  const worker = new LocalBrainWorker({ role: "tester", rootDir: process.cwd() });
  const discovery = discoverTestTargets(item);
  const testsDiscovered = Array.isArray(discovery.discovered) ? discovery.discovered : [];

  if (!testsDiscovered.length && discovery.source === "package_script" && discovery.script) {
    const scriptEvidence = runPackageTestScript(discovery.script, item);
    const passed = scriptEvidence.status === "PASSED";
    return {
      success: passed,
      output: {
        status: passed ? "PASSED" : "FAILED",
        testsDiscovered,
        discoverySource: discovery.source,
        evidence: [scriptEvidence]
      }
    };
  }

  if (!testsDiscovered.length) {
    return {
      success: false,
      skipped: true,
      reason: "test_discovery_failed",
      output: {
        status: "NOT_EXECUTED",
        testsDiscovered,
        discoverySource: discovery.source,
        evidence: []
      }
    };
  }

  const evidence = worker.runExistingTests(testsDiscovered);
  const passed = evidence.length > 0 && evidence.every((entry) => entry.status === "PASSED");
  return {
    success: passed,
    output: {
      status: passed ? "PASSED" : "FAILED",
      testsDiscovered,
      discoverySource: discovery.source,
      evidence
    }
  };
}

function executeEngineeringTask(item) {
  if (!item.artifactSpec) return { success: false, skipped: true, reason: "engineering_task_requires_artifact_spec" };
  const brain = new EngineeringBrain({ rootDir: process.cwd() });
  const output = brain.build(item.artifactSpec);
  return { success: output.status === "ARTIFACT_READY_FOR_REVIEW" && output.sourceTreeModified === false, output };
}

function executeReviewerTask(item) {
  if (!item.reviewInput) return { success: false, skipped: true, reason: "review_task_requires_engineering_output" };
  const output = new ReviewerBrain().review(item.reviewInput);
  return { success: output.verdict === "APPROVE", output, reason: output.verdict === "REQUEST_CHANGES" ? "review_requested_changes" : output.verdict === "REJECT" ? "review_rejected" : undefined };
}

function executeArchitectTask(item) {
  if (!item.architectureRequest) return { success: false, skipped: true, reason: "architect_task_requires_structured_request" };
  const output = new ArchitectBrain().plan(item.architectureRequest);
  return { success: output.status === "PLAN_READY_FOR_REVIEW" && output.governance.sourceWriteAllowed === false, output };
}

function executeEngineeringLoopTask(item) {
  const approvalState = getFounderApprovalState();
  const loopRequest = buildEngineeringLoopRequest(item, approvalState.founderApproved);
  const output = new GovernedEngineeringLoop({ rootDir: process.cwd(), maxAttempts: item.maxAttempts }).run(loopRequest);
  const capabilityScope = gatherCapabilityScope(item);
  if (capabilityScope.capabilityId) {
    const changed = Array.isArray(output && output.appliedFiles) ? output.appliedFiles : [];
    const attribution = attributeCapabilityDiff(capabilityScope, changed);
    output.capabilityAttribution = attribution;

    if (attribution.unauthorizedOutside.length > 0) {
      return {
        success: false,
        output,
        reason: "UNAUTHORIZED_SCOPE_EXPANSION"
      };
    }

    const hasRelevantScopedChange = attribution.hasSelectedCapabilityImplementationChange || attribution.filesWithinApprovedExpansion.length > 0;
    if (!hasRelevantScopedChange) {
      return {
        success: false,
        output,
        reason: "NO_SELECTED_CAPABILITY_SURFACE_CHANGE"
      };
    }
  }

  const success = output.status === "COMPLETED_AND_APPLIED";
  return { success, output, reason: output.status.toLowerCase() };
}

function executeBuilderTask() {
  const result = build();

  return {
    success: true,
    output: result || { status: "BUILD_COMPLETED" }
  };
}

function executeLocalBrainTask(item) {
  const worker = new LocalBrainWorker({
    role: "executor",
    rootDir: process.cwd()
  });

  const taskText = String(item.task || "").toLowerCase();
  const explicitTargets = extractExplicitRepoPaths(item.task);
  let output;

  if (explicitTargets.length > 0) {
    const fileSample = explicitTargets.map((targetPath) => {
      const absolutePath = path.resolve(process.cwd(), targetPath);
      const relativePath = path.relative(process.cwd(), absolutePath);
      const withinRoot = relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

      return {
        path: targetPath,
        status: withinRoot && fs.existsSync(absolutePath) ? "INSPECTED" : "MISSING"
      };
    });

    output = {
      taskType: "targeted_read_only_execution",
      fileSample,
      missingTargets: fileSample.filter((file) => file.status === "MISSING").map((file) => file.path),
      summary: `Targeted read-only inspection completed for ${fileSample.length} explicit path(s) without repository expansion.`,
      report: worker.prepareReports({ summary: "Targeted read-only report prepared." })
    };
  } else if (taskText.includes("architecture")) {
    output = {
      taskType: "architecture_analysis",
      projectStructure: worker.readProjectStructure(3),
      fileSample: worker.scanFiles([]).slice(0, 50)
    };
  } else if (
    taskText.includes("missing") &&
    (taskText.includes("brain") || taskText.includes("module"))
  ) {
    const projectStructure = worker.readProjectStructure(4);
    const fileSample = worker.scanFiles([]).slice(0, 100);

    output = {
      taskType: "missing_module_analysis",
      projectStructure,
      inspectedFiles: fileSample,
      report: worker.prepareReports({
        summary: "Local Brain inspected the current project for missing brain or module coverage."
      })
    };
  } else if (
    taskText.includes("implementation plan") ||
    taskText.includes("generate plan") ||
    taskText.includes("implementation")
  ) {
    output = {
      taskType: "implementation_plan",
      report: worker.prepareReports({
        summary: `Implementation planning completed for task: ${item.task}`
      }),
      projectStructure: worker.readProjectStructure(2)
    };
  } else {
    output = {
      taskType: "general_read_only_execution",
      report: worker.prepareReports({
        summary: `Local Brain completed safe read-only execution for task: ${item.task}`
      }),
      projectStructure: worker.readProjectStructure(2),
      fileSample: worker.scanFiles([]).slice(0, 30)
    };
  }

  return {
    success: true,
    output
  };
}

function executeAvailableEngine(route, item) {
  let primaryResult = null;
  switch (route) {
    case "mother":
      primaryResult = executeLocalBrainTask(item);
      break;
    case "thinker":
      primaryResult = executeThinkerTask(item);
      break;
    case "validator":
      primaryResult = executeValidatorTask(item);
      break;
    case "test":
      primaryResult = executeTestTask(item);
      break;
    case "builder":
      primaryResult = executeBuilderTask();
      break;
    case "revenue":
      primaryResult = executeRevenueTask(item.task, { rootDir: process.cwd() });
      break;
    case "engineering":
      primaryResult = executeEngineeringTask(item);
      break;
    case "review":
      primaryResult = executeReviewerTask(item);
      break;
    case "architect":
      primaryResult = executeArchitectTask(item);
      break;
    case "engineering_loop":
      primaryResult = executeEngineeringLoopTask(item);
      break;
    case "general":
      primaryResult = executeLocalBrainTask(item);
      break;
    case "patch":
      if (item.buildResult && item.buildResult.artifacts) {
        try {
          const engBrain = new EngineeringBrain({ rootDir: process.cwd() });
          const applyRes = engBrain.applyPatchToWorkspace(item.buildResult, { founderApproved: true });
          primaryResult = { success: applyRes.status === "PATCH_APPLIED_AND_VERIFIED", output: applyRes };
        } catch (err) {
          primaryResult = { success: false, skipped: true, reason: err.message };
        }
      } else {
        primaryResult = executeLocalBrainTask(item);
      }
      break;
    case "git":
      primaryResult = executeLocalBrainTask({ ...item, task: `Inspect repository status: ${item.task}` });
      break;
    default:
      primaryResult = executeLocalBrainTask(item);
      break;
  }

  // Dynamic fallback: If primary engine returned skipped due to missing route adapter, attempt local brain execution
  if (primaryResult && primaryResult.skipped && (route === "git" || route === "patch" || !["architect", "engineering", "review", "engineering_loop", "test"].includes(route))) {
    const fallbackResult = executeLocalBrainTask(item);
    if (fallbackResult && fallbackResult.success) {
      return {
        success: true,
        fallbackExecuted: true,
        primaryReason: primaryResult.reason,
        output: fallbackResult.output
      };
    }
  }

  return primaryResult;
}

function execute(plannedTasks = []) {
  console.log("[Executor] Starting execution...");

  const constitutionSensitiveRoutes = new Set(["git_push", "deploy", "payment"]);
  const approvalState = getFounderApprovalState();

  let lastEngineeringArtifact = null;
  const executedTasks = [];

  plannedTasks.forEach((item) => {
    const initialRoute = routeTask(item.task);
    const requiredCapabilities = inferRequiredCapabilities(item, initialRoute);
    const compatibleRoute = chooseCapabilityCompatibleRoute(initialRoute, requiredCapabilities, item.task);
    const route = compatibleRoute || initialRoute;
    const executionItem = { ...item };

    if (route === "review" && !executionItem.reviewInput && lastEngineeringArtifact) {
      executionItem.reviewInput = lastEngineeringArtifact;
    }

    const action = {
      type: route === "git" ? "git_commit" : route,
      targetPath: item.path || item.file,
      requiresFounderApproval:
        route === "git" ||
        route === "patch" ||
        requiredCapabilities.includes(CAPABILITIES.WRITE_PATCH)
    };

    const approvalRequired = requiresFounderApproval(action, {
      founderApproved: approvalState.founderApproved,
      founderApprovalToken: approvalState.founderApprovalToken,
      rootDir: process.cwd()
    });

    const blockedByApproval = approvalRequired && !approvalState.founderApproved;

    const constitutionGate = constitutionSensitiveRoutes.has(route)
      ? evaluateConstitutionGate(route)
      : { allowed: true };

    let status = "FAILED";
    let reason = "execution_error";
    let result = null;

    if (!constitutionGate.allowed) {
      status = "BLOCKED_BY_CONSTITUTION";
      reason = "constitution_validation_failed";
    } else if (blockedByApproval) {
      status = "BLOCKED_BY_APPROVAL";
      reason = "founder_approval_required";
    } else if (!compatibleRoute) {
      status = "BLOCKED_BY_CAPABILITY";
      reason = "CAPABILITY_UNAVAILABLE";
      result = {
        success: false,
        skipped: true,
        reason: "CAPABILITY_UNAVAILABLE",
        output: {
          requiredCapabilities,
          initialRoute,
          compatibility: "no_compatible_executor"
        }
      };
    } else {
      try {
        result = executeAvailableEngine(route, executionItem);

        if (route === "engineering_loop" && result && result.output && result.output.finalArtifact) {
          lastEngineeringArtifact = result.output.finalArtifact;
        }

        if (result && result.skipped) {
          status = "SKIPPED";
          reason = result.reason || "no_safe_execution_path";
        } else if (result && result.success) {
          const filesChanged = extractFilesChanged(result);
          const writeRequired = requiredCapabilities.includes(CAPABILITIES.WRITE_PATCH);
          if (writeRequired && filesChanged.length === 0) {
            status = "FAILED";
            reason = "write_required_but_no_workspace_change_evidence";
          } else {
            status = "SUCCESS";
            reason = result.fallbackExecuted ? "executed_via_dynamic_fallback" : "executed_by_available_engine";
          }
        } else {
          status = "FAILED";
          reason = (result && result.reason) || "engine_execution_failed";
        }
      } catch (error) {
        status = "FAILED";
        reason = "engine_execution_error";
        result = {
          success: false,
          error: error.message
        };
      }
    }

    const executedTask = {
      ...item,
      route,
      selectedRoute: route,
      initialRoute,
      requiredCapabilities,
      engine: toEngineName(route),
      status,
      reason,
      result,
      evidence: buildStructuredEvidence(item, initialRoute, route, requiredCapabilities, result, status, reason),
      approvalState: {
        required: approvalRequired,
        approved: approvalState.founderApproved
      },
      executedAt: new Date().toISOString()
    };

    executedTasks.push(executedTask);
  });

  console.log("[Executor] Execution Report:");

  executedTasks.forEach((task, index) => {
    console.log(
      `${index + 1}. [${task.engine}] ${task.task} [${task.status}]`
    );
  });

  return executedTasks;
}

module.exports = { execute };
