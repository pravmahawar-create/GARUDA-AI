const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { brainRegistry } = require("../dev-agent/core/BrainRegistry");
const { WORKER_CAPABILITY_REGISTRY } = require("../dev-agent/core/WorkforceRouter");

const CAPABILITY_STATUS = Object.freeze({
  CONNECTED: "CONNECTED",
  PARTIAL: "PARTIAL",
  DISCONNECTED: "DISCONNECTED",
  BROKEN: "BROKEN",
  PLACEHOLDER: "PLACEHOLDER",
  MISSING: "MISSING",
  UNKNOWN: "UNKNOWN"
});

const SELF_DEVELOPMENT_TARGET_SOURCE = Object.freeze({
  FOUNDER_EXPLICIT_TARGET: "FOUNDER_EXPLICIT_TARGET",
  GARUDA_CAPABILITY_SELECTED_TARGET: "GARUDA_CAPABILITY_SELECTED_TARGET"
});

const STATUS_RANK = Object.freeze({
  CONNECTED: 0,
  PARTIAL: 1,
  DISCONNECTED: 2,
  BROKEN: 3,
  PLACEHOLDER: 4,
  MISSING: 5,
  UNKNOWN: 6
});

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function fileExists(rootDir, relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function textContains(filePath, needle) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.includes(needle);
  } catch {
    return false;
  }
}

function normalizeTimestamp(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeCapabilityStatus(value) {
  const upper = String(value || "").trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(CAPABILITY_STATUS, upper)) {
    return CAPABILITY_STATUS[upper];
  }
  return CAPABILITY_STATUS.UNKNOWN;
}

function capabilityRecord(input = {}) {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    purpose: input.purpose,
    implementationLocations: Array.isArray(input.implementationLocations) ? input.implementationLocations : [],
    relatedTests: Array.isArray(input.relatedTests) ? input.relatedTests : [],
    ownershipConfidence: Number.isFinite(input.ownershipConfidence) ? input.ownershipConfidence : 0,
    evidenceSource: Array.isArray(input.evidenceSource) ? input.evidenceSource : [],
    status: normalizeCapabilityStatus(input.status),
    runtimeReachable: Boolean(input.runtimeReachable),
    capabilitiesProvided: Array.isArray(input.capabilitiesProvided) ? input.capabilitiesProvided : [],
    capabilitiesRequired: Array.isArray(input.capabilitiesRequired) ? input.capabilitiesRequired : [],
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    consumers: Array.isArray(input.consumers) ? input.consumers : [],
    health: {
      score: Number.isFinite(input.health && input.health.score) ? input.health.score : 0,
      reason: input.health && input.health.reason ? input.health.reason : "no_health_evidence"
    },
    verificationEvidence: Array.isArray(input.verificationEvidence) ? input.verificationEvidence : [],
    lastVerifiedAt: normalizeTimestamp(input.lastVerifiedAt),
    confidence: Number.isFinite(input.confidence) ? input.confidence : 0,
    knownFailures: Array.isArray(input.knownFailures) ? input.knownFailures : [],
    governanceBoundary: {
      founderApprovalRequiredForWrite: Boolean(
        input.governanceBoundary && input.governanceBoundary.founderApprovalRequiredForWrite
      ),
      externalActionsAllowed: Boolean(
        input.governanceBoundary && input.governanceBoundary.externalActionsAllowed
      ),
      paidApiAllowed: Boolean(input.governanceBoundary && input.governanceBoundary.paidApiAllowed)
    },
    improvementEligibility: {
      eligible: Boolean(input.improvementEligibility && input.improvementEligibility.eligible),
      reason: input.improvementEligibility && input.improvementEligibility.reason
        ? input.improvementEligibility.reason
        : "not_evaluated",
      requiredEngineeringCapabilities: Array.isArray(
        input.improvementEligibility && input.improvementEligibility.requiredEngineeringCapabilities
      )
        ? input.improvementEligibility.requiredEngineeringCapabilities
        : []
    }
  };
}

function normalizeRepoPath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function uniquePaths(paths = []) {
  return Array.from(new Set((Array.isArray(paths) ? paths : []).map(normalizeRepoPath).filter(Boolean)));
}

function discoverTestsByReference(rootDir, implementationLocations = []) {
  const roots = ["scripts", "src", "test", "tests"];
  const tokens = uniquePaths(implementationLocations)
    .map((location) => {
      const parsed = path.parse(location);
      return [parsed.base, parsed.name].filter(Boolean);
    })
    .flat()
    .map((token) => String(token).toLowerCase())
    .filter((token) => token.length >= 4);

  if (!tokens.length) {
    return [];
  }

  const found = new Set();
  const maxFilesToScan = 2000;
  let scanned = 0;

  function walk(dir, depth = 0) {
    if (depth > 5 || !fs.existsSync(dir) || scanned > maxFilesToScan) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (scanned > maxFilesToScan) {
        return;
      }

      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "dist", "coverage"].includes(entry.name)) {
          continue;
        }
        walk(absolute, depth + 1);
        continue;
      }

      if (!entry.isFile() || !/\.(test|spec)\.(c?js|mjs)$/i.test(entry.name)) {
        continue;
      }

      scanned += 1;
      try {
        const content = fs.readFileSync(absolute, "utf8").toLowerCase();
        if (tokens.some((token) => content.includes(token))) {
          found.add(normalizeRepoPath(path.relative(rootDir, absolute)));
        }
      } catch {
        // Non-fatal: unreadable files are skipped.
      }
    }
  }

  roots.forEach((root) => walk(path.join(rootDir, root)));
  return Array.from(found);
}

function discoverRelatedTests(rootDir, implementationLocations = []) {
  const related = new Set();
  const normalizedLocations = uniquePaths(implementationLocations);

  normalizedLocations.forEach((location) => {
    const parsed = path.parse(location);
    const siblingCandidates = [
      path.join(parsed.dir, `${parsed.name}.test.js`),
      path.join(parsed.dir, `${parsed.name}.spec.js`),
      path.join(parsed.dir, `${parsed.base.replace(/\.(js|mjs|cjs)$/i, "")}.test.js`),
      path.join(parsed.dir, `${parsed.base.replace(/\.(js|mjs|cjs)$/i, "")}.spec.js`)
    ].map((candidate) => normalizeRepoPath(candidate));

    siblingCandidates.forEach((candidate) => {
      if (fileExists(rootDir, candidate)) {
        related.add(candidate);
      }
    });
  });

  if (!related.size) {
    discoverTestsByReference(rootDir, normalizedLocations).forEach((testPath) => related.add(testPath));
  }

  return Array.from(related);
}

function loadLatestMissionEvidence(rootDir) {
  const reportPath = path.join(rootDir, "reports", "mother-cycle-report.json");
  return readJsonSafe(reportPath);
}

function extractCapabilityIdFromTask(task) {
  const contextId = task && task.capabilityContext && task.capabilityContext.capabilityId
    ? task.capabilityContext.capabilityId
    : null;
  if (contextId) {
    return contextId;
  }

  const taskText = String(task && (task.task || task.description || task.name || "") || "");
  const match = taskText.match(/([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+)/);
  return match ? match[1] : null;
}

function resolvePreviousMissionEvidence(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const latestReport = loadLatestMissionEvidence(rootDir);
  const validation = latestReport && latestReport.validation && latestReport.validation.passed === true
    ? latestReport.validation
    : null;
  const executedTasks = Array.isArray(latestReport && latestReport.executedTasks)
    ? latestReport.executedTasks
    : [];

  let capabilityTarget = null;
  let targetId = null;

  if (latestReport && latestReport.goal && latestReport.goal.capabilityTarget) {
    capabilityTarget = latestReport.goal.capabilityTarget;
  } else {
    const executionEntries = Array.isArray(latestReport && latestReport.executionResults)
      ? Object.values(latestReport.executionResults).flatMap((entry) => Array.isArray(entry) ? entry : [entry])
      : [];
    const taskEvidence = executionEntries.find((entry) => entry && entry.evidence && entry.evidence.capabilityAttribution);
    const attribution = taskEvidence && taskEvidence.evidence && taskEvidence.evidence.capabilityAttribution
      ? taskEvidence.evidence.capabilityAttribution
      : null;
    if (attribution && attribution.selectedCapability) {
      capabilityTarget = { id: attribution.selectedCapability };
    }
    if (!capabilityTarget) {
      const fallbackTask = executedTasks.find((task) => extractCapabilityIdFromTask(task));
      const fallbackTargetId = fallbackTask ? extractCapabilityIdFromTask(fallbackTask) : null;
      if (fallbackTargetId) {
        capabilityTarget = { id: fallbackTargetId };
      }
    }
  }

  targetId = capabilityTarget && capabilityTarget.id ? capabilityTarget.id : null;

  if (!validation || !targetId) {
    return null;
  }

  const hadSuccessfulCapabilityTouchpoint = executedTasks.some((task) => {
    const taskText = String(task && task.task ? task.task : "").toLowerCase();
    return task && task.status === "SUCCESS" && (
      taskText.includes("modify or connect") ||
      taskText.includes("refresh capability state") ||
      taskText.includes("discover and execute verification") ||
      taskText.includes("review actual")
    );
  });

  if (!hadSuccessfulCapabilityTouchpoint) {
    return null;
  }

  return {
    rootDir,
    validation,
    goal: {
      capabilityTarget: {
        id: targetId,
        name: capabilityTarget.name || null,
        previousStatus: capabilityTarget.previousStatus || null,
        expectedImprovement: capabilityTarget.expectedImprovement || null
      }
    },
    executedTasks,
    source: "persisted_mother_cycle_report"
  };
}

function summarizeBrainAvailability() {
  const workers = brainRegistry.getTrustedWorkers();
  const workerTypes = workers.map((worker) => worker.type);
  const capabilities = workers.flatMap((worker) => worker.capabilities || []);
  return {
    workerTypes,
    capabilities: Array.from(new Set(capabilities))
  };
}

function evaluateGoalGrounding(rootDir, latestReport) {
  const files = [
    "scripts/mother/goalEngine.js",
    "scripts/mother/taskDecomposer.js",
    "scripts/mother/mother.js"
  ];

  const allExist = files.every((item) => fileExists(rootDir, item));
  const goalEnginePath = path.join(rootDir, "scripts", "mother", "goalEngine.js");
  const legacyForCapture = textContains(goalEnginePath, "\\bfor\\s+");
  const reportGoal = latestReport && latestReport.goal ? latestReport.goal : null;
  const reportTarget = reportGoal && reportGoal.targetName ? String(reportGoal.targetName) : "";
  const reportIntent = reportGoal && reportGoal.intent ? String(reportGoal.intent) : "";

  let status = CAPABILITY_STATUS.PARTIAL;
  const knownFailures = [];
  const evidence = [];

  evidence.push({
    type: "filesystem",
    id: "goal_grounding_files_present",
    success: allExist,
    details: files
  });

  if (!allExist) {
    status = CAPABILITY_STATUS.MISSING;
    knownFailures.push("goal_grounding_modules_missing");
  }

  if (reportIntent === "self_development_improvement" && reportTarget.toLowerCase() === "that") {
    status = CAPABILITY_STATUS.BROKEN;
    knownFailures.push("meta_prompt_target_injection_that");
    evidence.push({
      type: "mission_report",
      id: "that_failure_observed",
      success: false,
      details: { reportIntent, reportTarget }
    });
  }

  if (legacyForCapture) {
    evidence.push({
      type: "source_pattern",
      id: "legacy_for_capture_rule",
      success: false,
      details: "goalEngine still contains a broad 'for <token>' artifact extraction fallback"
    });
    if (status !== CAPABILITY_STATUS.BROKEN) {
      status = CAPABILITY_STATUS.PARTIAL;
    }
  }

  return capabilityRecord({
    id: "mother.goal_target_grounding",
    name: "Self-development target grounding",
    category: "mother_cognition",
    purpose: "Convert meta self-development objective into evidence-grounded capability target selection.",
    implementationLocations: files,
    relatedTests: discoverRelatedTests(rootDir, files),
    ownershipConfidence: 0.95,
    evidenceSource: ["filesystem", "runtime_report"],
    status,
    runtimeReachable: allExist,
    capabilitiesProvided: ["SELF_DEVELOPMENT_META_GROUNDING", "TARGET_PROVENANCE"],
    capabilitiesRequired: ["READ", "SEARCH"],
    dependencies: ["mother.capability_body_snapshot", "mother.capability_prioritization"],
    consumers: ["scripts/mother/mother.js", "scripts/mother/taskDecomposer.js"],
    health: {
      score: status === CAPABILITY_STATUS.CONNECTED ? 95 : status === CAPABILITY_STATUS.BROKEN ? 20 : 55,
      reason: status === CAPABILITY_STATUS.BROKEN
        ? "historical target injection observed"
        : "requires runtime evidence grounding"
    },
    verificationEvidence: evidence,
    lastVerifiedAt: latestReport && latestReport.generatedAt ? latestReport.generatedAt : new Date().toISOString(),
    confidence: 90,
    knownFailures,
    governanceBoundary: {
      founderApprovalRequiredForWrite: true,
      externalActionsAllowed: false,
      paidApiAllowed: false
    },
    improvementEligibility: {
      eligible: status !== CAPABILITY_STATUS.CONNECTED,
      reason: status === CAPABILITY_STATUS.CONNECTED ? "already_connected" : "meta_target_grounding_requires_improvement",
      requiredEngineeringCapabilities: ["READ", "WRITE_PATCH", "DIFF_INSPECTION", "TEST_EXECUTION"]
    }
  });
}

function evaluateEngineeringHands(rootDir, latestReport) {
  const files = [
    "scripts/mother/executor.js",
    "scripts/dev-agent/core/GovernedEngineeringLoop.js",
    "scripts/dev-agent/core/EngineeringBrain.js",
    "scripts/dev-agent/core/ReviewerBrain.js"
  ];
  const allExist = files.every((item) => fileExists(rootDir, item));
  const executedTasks = Array.isArray(latestReport && latestReport.executedTasks)
    ? latestReport.executedTasks
    : [];

  const hasEngineeringSuccess = executedTasks.some(
    (task) => task && task.route === "engineering_loop" && task.status === "SUCCESS"
  );
  const hasReviewSuccess = executedTasks.some(
    (task) => task && task.route === "review" && task.status === "SUCCESS"
  );
  const hasTestSuccess = executedTasks.some(
    (task) => task && task.route === "test" && task.status === "SUCCESS"
  );

  let status = CAPABILITY_STATUS.PARTIAL;
  if (!allExist) {
    status = CAPABILITY_STATUS.MISSING;
  } else if (hasEngineeringSuccess && hasReviewSuccess && hasTestSuccess) {
    status = CAPABILITY_STATUS.CONNECTED;
  }

  return capabilityRecord({
    id: "mother.engineering_hands",
    name: "Governed engineering execution chain",
    category: "mother_execution",
    purpose: "Execute inspect-implement-review-test loops with evidence and governance boundaries.",
    implementationLocations: files,
    relatedTests: discoverRelatedTests(rootDir, files),
    ownershipConfidence: 0.9,
    evidenceSource: ["filesystem", "mission_report"],
    status,
    runtimeReachable: allExist,
    capabilitiesProvided: ["WRITE_PATCH", "TEST_EXECUTION", "DIFF_INSPECTION", "CODE_REVIEW"],
    capabilitiesRequired: ["READ"],
    dependencies: ["mother.worker_routing"],
    consumers: ["scripts/mother/mother.js"],
    health: {
      score: status === CAPABILITY_STATUS.CONNECTED ? 96 : status === CAPABILITY_STATUS.MISSING ? 10 : 70,
      reason: status === CAPABILITY_STATUS.CONNECTED
        ? "recent engineering, review, and test evidence observed"
        : "partial execution evidence"
    },
    verificationEvidence: [
      {
        type: "filesystem",
        id: "engineering_hands_files_present",
        success: allExist,
        details: files
      },
      {
        type: "mission_report",
        id: "engineering_loop_success_recent",
        success: hasEngineeringSuccess,
        details: { hasEngineeringSuccess, hasReviewSuccess, hasTestSuccess }
      }
    ],
    lastVerifiedAt: latestReport && latestReport.generatedAt ? latestReport.generatedAt : new Date().toISOString(),
    confidence: 95,
    knownFailures: [],
    governanceBoundary: {
      founderApprovalRequiredForWrite: true,
      externalActionsAllowed: false,
      paidApiAllowed: false
    },
    improvementEligibility: {
      eligible: false,
      reason: "core capability is already connected and healthy",
      requiredEngineeringCapabilities: []
    }
  });
}

function evaluateRevenueBridge(rootDir, latestReport) {
  const files = [
    "src/services/revenueBridgeClient.js"
  ];
  const allExist = files.every((item) => fileExists(rootDir, item));
  const bridgeState = latestReport && latestReport.revenueBridge ? latestReport.revenueBridge : null;
  const evaluated = Boolean(bridgeState && bridgeState.engaged);
  const evaluationOk = Boolean(bridgeState && bridgeState.evaluation && bridgeState.evaluation.ok);

  let status = CAPABILITY_STATUS.PARTIAL;
  if (!allExist) {
    status = CAPABILITY_STATUS.MISSING;
  } else if (evaluated && evaluationOk) {
    status = CAPABILITY_STATUS.CONNECTED;
  } else if (evaluated && !evaluationOk) {
    status = CAPABILITY_STATUS.DISCONNECTED;
  }

  return capabilityRecord({
    id: "mother.revenue_bridge_connectivity",
    name: "Mother to Revenue bridge connectivity",
    category: "integration",
    purpose: "Enable Mother runtime to query governed revenue capability and readiness evidence.",
    implementationLocations: files,
    relatedTests: discoverRelatedTests(rootDir, files),
    ownershipConfidence: 0.9,
    evidenceSource: ["filesystem", "mission_report"],
    status,
    runtimeReachable: allExist,
    capabilitiesProvided: ["REVENUE_CAPABILITY_SNAPSHOT", "REVENUE_WORK_EVALUATION"],
    capabilitiesRequired: ["COMMAND_EXECUTION"],
    dependencies: ["backend.mother_bridge_api"],
    consumers: ["scripts/mother/mother.js"],
    health: {
      score: status === CAPABILITY_STATUS.CONNECTED ? 90 : status === CAPABILITY_STATUS.DISCONNECTED ? 30 : 65,
      reason: evaluationOk ? "bridge evaluation succeeded" : "bridge not recently verified"
    },
    verificationEvidence: [
      {
        type: "filesystem",
        id: "revenue_bridge_client_exists",
        success: allExist,
        details: files
      },
      {
        type: "mission_report",
        id: "bridge_evaluation_state",
        success: evaluationOk,
        details: bridgeState || null
      }
    ],
    lastVerifiedAt: latestReport && latestReport.generatedAt ? latestReport.generatedAt : null,
    confidence: 85,
    knownFailures: evaluationOk ? [] : ["bridge_not_verified_in_latest_cycle"],
    governanceBoundary: {
      founderApprovalRequiredForWrite: true,
      externalActionsAllowed: false,
      paidApiAllowed: false
    },
    improvementEligibility: {
      eligible: status === CAPABILITY_STATUS.DISCONNECTED || status === CAPABILITY_STATUS.PARTIAL,
      reason: status === CAPABILITY_STATUS.CONNECTED ? "healthy" : "integration_needs_verification_or_repair",
      requiredEngineeringCapabilities: ["READ", "TEST_EXECUTION", "COMMAND_EXECUTION"]
    }
  });
}

function evaluateBodySnapshotCapability(rootDir) {
  const files = [
    "scripts/mother/bodyAwareness.js",
    "scripts/mother/mother.js"
  ];
  const allExist = files.every((item) => fileExists(rootDir, item));
  const status = allExist ? CAPABILITY_STATUS.CONNECTED : CAPABILITY_STATUS.PARTIAL;
  return capabilityRecord({
    id: "mother.capability_body_snapshot",
    name: "Runtime body capability snapshot",
    category: "mother_cognition",
    purpose: "Produce queryable capability/organ state with evidence and freshness.",
    implementationLocations: files,
    relatedTests: discoverRelatedTests(rootDir, files),
    ownershipConfidence: 0.95,
    evidenceSource: ["filesystem"],
    status,
    runtimeReachable: allExist,
    capabilitiesProvided: ["BODY_STATE_QUERY", "CAPABILITY_CLASSIFICATION"],
    capabilitiesRequired: ["READ", "SEARCH"],
    dependencies: ["mother.engineering_hands", "mother.worker_routing"],
    consumers: ["scripts/mother/mother.js", "scripts/mother/goalEngine.js"],
    health: {
      score: allExist ? 90 : 40,
      reason: allExist ? "body awareness runtime available" : "body awareness runtime incomplete"
    },
    verificationEvidence: [
      {
        type: "filesystem",
        id: "body_awareness_module_presence",
        success: allExist,
        details: files
      }
    ],
    lastVerifiedAt: new Date().toISOString(),
    confidence: 92,
    knownFailures: [],
    governanceBoundary: {
      founderApprovalRequiredForWrite: true,
      externalActionsAllowed: false,
      paidApiAllowed: false
    },
    improvementEligibility: {
      eligible: false,
      reason: "cognition-layer baseline capability",
      requiredEngineeringCapabilities: []
    }
  });
}

function evaluateWorkerRouting(rootDir) {
  const files = [
    "scripts/dev-agent/core/BrainRegistry.js",
    "scripts/dev-agent/core/WorkforceRouter.js",
    "scripts/mother/executor.js"
  ];
  const allExist = files.every((item) => fileExists(rootDir, item));
  const workforceTypes = Object.keys(WORKER_CAPABILITY_REGISTRY || {});
  const status = allExist && workforceTypes.length > 0 ? CAPABILITY_STATUS.CONNECTED : CAPABILITY_STATUS.PARTIAL;
  const brainSummary = summarizeBrainAvailability();

  return capabilityRecord({
    id: "mother.worker_routing",
    name: "Worker and capability routing",
    category: "orchestration",
    purpose: "Route execution to compatible workers and enforce capability-aware governance.",
    implementationLocations: files,
    relatedTests: discoverRelatedTests(rootDir, files),
    ownershipConfidence: 0.9,
    evidenceSource: ["filesystem", "registry"],
    status,
    runtimeReachable: allExist,
    capabilitiesProvided: ["CAPABILITY_AWARE_ROUTING", "WORKER_SELECTION"],
    capabilitiesRequired: ["READ", "SEARCH"],
    dependencies: [],
    consumers: ["scripts/mother/mother.js", "scripts/mother/executor.js"],
    health: {
      score: status === CAPABILITY_STATUS.CONNECTED ? 92 : 55,
      reason: status === CAPABILITY_STATUS.CONNECTED
        ? "brain registry and worker capability map detected"
        : "routing surface incomplete"
    },
    verificationEvidence: [
      {
        type: "filesystem",
        id: "worker_routing_files_present",
        success: allExist,
        details: files
      },
      {
        type: "registry",
        id: "worker_registry_detected",
        success: workforceTypes.length > 0,
        details: {
          workerTypes: workforceTypes,
          registeredBrains: brainSummary.workerTypes
        }
      }
    ],
    lastVerifiedAt: new Date().toISOString(),
    confidence: 90,
    knownFailures: [],
    governanceBoundary: {
      founderApprovalRequiredForWrite: true,
      externalActionsAllowed: false,
      paidApiAllowed: false
    },
    improvementEligibility: {
      eligible: false,
      reason: "routing baseline already connected",
      requiredEngineeringCapabilities: []
    }
  });
}

function getCurrentBodyState(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const latestReport = loadLatestMissionEvidence(rootDir);

  const capabilities = [
    evaluateGoalGrounding(rootDir, latestReport),
    evaluateBodySnapshotCapability(rootDir),
    evaluateEngineeringHands(rootDir, latestReport),
    evaluateWorkerRouting(rootDir),
    evaluateRevenueBridge(rootDir, latestReport)
  ];

  const summary = capabilities.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const payload = {
    generatedAt: new Date().toISOString(),
    rootDir,
    evidenceSources: [
      "filesystem",
      "brain_registry",
      "workforce_router_registry",
      "latest_mother_cycle_report"
    ],
    capabilities,
    summary
  };

  const snapshotId = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return {
    engine: "GARUDA Body Awareness v1",
    snapshotId,
    ...payload
  };
}

function computeCandidateScore(capability, availableCapabilities) {
  const severityBase = {
    [CAPABILITY_STATUS.BROKEN]: 100,
    [CAPABILITY_STATUS.DISCONNECTED]: 90,
    [CAPABILITY_STATUS.PLACEHOLDER]: 80,
    [CAPABILITY_STATUS.PARTIAL]: 70,
    [CAPABILITY_STATUS.MISSING]: 50,
    [CAPABILITY_STATUS.UNKNOWN]: 40
  };

  const base = severityBase[capability.status] || 0;
  const dependentWeight = Math.min(20, (capability.consumers || []).length * 5);
  const dependencyWeight = Math.min(10, (capability.dependencies || []).length * 3);
  const providedWeight = Math.min(10, (capability.capabilitiesProvided || []).length * 2);
  const leverageWeight = Math.min(30, 10 + dependentWeight + dependencyWeight + providedWeight);
  const verificationWeight = Math.min(15, (capability.verificationEvidence || []).length * 4);
  const governancePenalty = capability.governanceBoundary.founderApprovalRequiredForWrite ? 5 : 0;

  const required = capability.improvementEligibility.requiredEngineeringCapabilities || [];
  const unavailable = required.filter((cap) => !availableCapabilities.has(cap));
  const capabilityFeasibilityPenalty = unavailable.length ? 100 : 0;

  const score = base + dependentWeight + leverageWeight + verificationWeight - governancePenalty - capabilityFeasibilityPenalty;

  return {
    score,
    unavailable,
    components: {
      severity: base,
      dependents: dependentWeight,
      selfDevelopmentLeverage: leverageWeight,
      verificationFeasibility: verificationWeight,
      governancePenalty,
      unavailableCapabilityPenalty: capabilityFeasibilityPenalty
    }
  };
}

function getAvailableEngineeringCapabilities() {
  return new Set([
    "READ",
    "SEARCH",
    "WRITE_PATCH",
    "COMMAND_EXECUTION",
    "TEST_DISCOVERY",
    "TEST_EXECUTION",
    "DIFF_INSPECTION",
    "CODE_REVIEW"
  ]);
}

function generateSelfDevelopmentCandidates(snapshot = {}, options = {}) {
  const availableCapabilities = options.availableEngineeringCapabilities
    ? new Set(options.availableEngineeringCapabilities)
    : getAvailableEngineeringCapabilities();

  const previousMissionEvidence = options.previousMissionEvidence || null;
  const previousTargetId = previousMissionEvidence && previousMissionEvidence.goal && previousMissionEvidence.goal.capabilityTarget
    ? previousMissionEvidence.goal.capabilityTarget.id
    : null;
  const previousTargetCompleted = Boolean(
    previousTargetId && previousMissionEvidence && previousMissionEvidence.validation && previousMissionEvidence.validation.passed
  );

  const capabilities = Array.isArray(snapshot.capabilities) ? snapshot.capabilities : [];
  const candidates = [];
  const excluded = [];

  capabilities.forEach((capability) => {
    const needsImprovement = [
      CAPABILITY_STATUS.BROKEN,
      CAPABILITY_STATUS.DISCONNECTED,
      CAPABILITY_STATUS.PARTIAL,
      CAPABILITY_STATUS.PLACEHOLDER
    ].includes(capability.status);

    const hasEvidence = Array.isArray(capability.verificationEvidence) && capability.verificationEvidence.length > 0;
    const implementationLocations = uniquePaths(capability.implementationLocations);
    const relatedTests = uniquePaths(capability.relatedTests);
    const hasImplementationSurface = implementationLocations.length > 0;
    const hasVerificationPath = relatedTests.length > 0 || hasEvidence;
    const eligible = capability.improvementEligibility && capability.improvementEligibility.eligible;

    if (previousTargetCompleted && capability.id === previousTargetId) {
      excluded.push({
        capabilityId: capability.id,
        reason: "recently_completed"
      });
      return;
    }

    if (!needsImprovement || !hasEvidence || !eligible) {
      excluded.push({
        capabilityId: capability.id,
        reason: !needsImprovement
          ? "already_healthy_or_unknown"
          : !hasEvidence
            ? "insufficient_evidence"
            : "improvement_not_eligible"
      });
      return;
    }

    if (!hasImplementationSurface) {
      excluded.push({
        capabilityId: capability.id,
        reason: "IMPLEMENTATION_SURFACE_UNKNOWN"
      });
      return;
    }

    if (!hasVerificationPath) {
      excluded.push({
        capabilityId: capability.id,
        reason: "VERIFICATION_PATH_UNKNOWN"
      });
      return;
    }

    const score = computeCandidateScore(capability, availableCapabilities);
    if (score.unavailable.length > 0) {
      excluded.push({
        capabilityId: capability.id,
        reason: "required_engineering_capability_unavailable",
        missingCapabilities: score.unavailable
      });
      return;
    }

    candidates.push({
      capabilityId: capability.id,
      name: capability.name,
      previousStatus: capability.status,
      implementationLocations,
      relatedTests,
      runtimeConsumers: Array.isArray(capability.consumers) ? capability.consumers : [],
      dependencies: Array.isArray(capability.dependencies) ? capability.dependencies : [],
      ownershipConfidence: capability.ownershipConfidence,
      evidenceSource: capability.evidenceSource,
      priorityScore: score.score,
      scoreComponents: score.components,
      selectionReasons: [
        `status=${capability.status}`,
        `health_score=${capability.health.score}`,
        `consumers=${(capability.consumers || []).length}`,
        `verification_evidence=${(capability.verificationEvidence || []).length}`
      ],
      supportingEvidence: capability.verificationEvidence,
      requiredCapabilities: capability.improvementEligibility.requiredEngineeringCapabilities,
      expectedImprovement: `${capability.status} -> ${CAPABILITY_STATUS.CONNECTED}`,
      verificationHints: {
        relatedTests,
        evidenceIds: (capability.verificationEvidence || []).map((item) => item.id || item.type || "unknown")
      },
      verificationPlan: [
        "Run governed engineering implementation task",
        "Run discovered relevant tests",
        "Refresh body snapshot and verify capability status transition"
      ]
    });
  });

  candidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.capabilityId.localeCompare(b.capabilityId);
  });

  return {
    candidates,
    excluded,
    availableEngineeringCapabilities: Array.from(availableCapabilities)
  };
}

function selectSelfDevelopmentTarget(snapshot = {}, options = {}) {
  const generated = generateSelfDevelopmentCandidates(snapshot, options);
  const selected = generated.candidates[0] || null;

  if (!selected) {
    const implementationUnknown = generated.excluded.some((entry) => entry.reason === "IMPLEMENTATION_SURFACE_UNKNOWN");
    return {
      status: implementationUnknown ? "IMPLEMENTATION_SURFACE_UNKNOWN" : "NO_ELIGIBLE_SELF_DEVELOPMENT_TARGET",
      selectedCapability: null,
      targetSource: SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET,
      selectionReasons: [implementationUnknown
        ? "No eligible candidate has credible implementation ownership evidence."
        : "No eligible improvement candidate met evidence and capability requirements."],
      supportingEvidence: [],
      candidates: generated.candidates,
      excludedCandidates: generated.excluded,
      snapshotId: snapshot.snapshotId || null
    };
  }

  return {
    status: "TARGET_SELECTED",
    selectedCapability: selected,
    targetSource: SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET,
    selectionReasons: selected.selectionReasons,
    supportingEvidence: selected.supportingEvidence,
    candidates: generated.candidates,
    excludedCandidates: generated.excluded,
    snapshotId: snapshot.snapshotId || null
  };
}

function groundSelfDevelopmentGoal(parsedGoal, options = {}) {
  const beforeSnapshot = getCurrentBodyState(options);
  const selection = selectSelfDevelopmentTarget(beforeSnapshot, options);

  if (!selection.selectedCapability) {
    return {
      goal: {
        ...parsedGoal,
        intent: "self_development_meta",
        actionType: "analysis",
        targetName: null,
        targetSource: SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET,
        targetProvenance: {
          targetSource: SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET,
          bodySnapshotId: beforeSnapshot.snapshotId,
          selectionReasons: selection.selectionReasons,
          supportingEvidence: selection.supportingEvidence,
          previousStatus: null,
          capabilityId: null
        }
      },
      beforeSnapshot,
      selection
    };
  }

  const selected = selection.selectedCapability;
  const targetName = selected.capabilityId.replace(/[^a-zA-Z0-9_]+/g, "_").replace(/^_+|_+$/g, "");

  return {
    goal: {
      ...parsedGoal,
      intent: "self_development_improvement",
      actionType: "modification",
      domain: "mother",
      targetName,
      targetSource: SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET,
      capabilityTarget: {
        id: selected.capabilityId,
        name: selected.name,
        previousStatus: selected.previousStatus,
        expectedImprovement: selected.expectedImprovement,
        requiredCapabilities: selected.requiredCapabilities,
        implementationLocations: selected.implementationLocations,
        relatedTests: selected.relatedTests,
        ownershipConfidence: selected.ownershipConfidence,
        evidenceSource: selected.evidenceSource,
        verificationHints: selected.verificationHints,
        runtimeConsumers: selected.runtimeConsumers,
        dependencies: selected.dependencies
      },
      target: {
        source: SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET,
        capabilityId: selected.capabilityId,
        name: selected.name,
        previousStatus: selected.previousStatus,
        implementationLocations: selected.implementationLocations,
        supportingEvidence: selected.supportingEvidence,
        requiredCapabilities: selected.requiredCapabilities,
        verificationHints: selected.verificationHints
      },
      targetProvenance: {
        targetSource: SELF_DEVELOPMENT_TARGET_SOURCE.GARUDA_CAPABILITY_SELECTED_TARGET,
        capabilityId: selected.capabilityId,
        bodySnapshotId: beforeSnapshot.snapshotId,
        selectionReasons: selected.selectionReasons,
        supportingEvidence: selected.supportingEvidence,
        previousStatus: selected.previousStatus,
        priorityScore: selected.priorityScore
      }
    },
    beforeSnapshot,
    selection
  };
}

function buildSelfDevelopmentPlannedTasks(goal) {
  const capabilityTarget = goal && goal.capabilityTarget ? goal.capabilityTarget : null;
  const capabilityId = capabilityTarget && capabilityTarget.id
    ? capabilityTarget.id
    : (goal && goal.targetName ? goal.targetName : "self_development_target");
  const targetSlug = String(goal.targetName || capabilityId).replace(/[^a-zA-Z0-9_]+/g, "_");
  const implementationLocations = uniquePaths(capabilityTarget && capabilityTarget.implementationLocations);
  const relatedTests = uniquePaths(capabilityTarget && capabilityTarget.relatedTests);

  if (!implementationLocations.length) {
    return [
      {
        step: 1,
        task: `Inspect capability ownership evidence for ${capabilityId}`,
        status: "PENDING"
      },
      {
        step: 2,
        task: `Report implementation surface unknown for ${capabilityId}`,
        status: "PENDING",
        blockedReason: "IMPLEMENTATION_SURFACE_UNKNOWN"
      }
    ];
  }

  return [
    {
      step: 1,
      task: `Inspect capability implementation surface for ${capabilityId}`,
      status: "PENDING",
      capabilityContext: {
        capabilityId,
        implementationLocations,
        relatedTests
      }
    },
    {
      step: 2,
      task: `Diagnose root cause for ${capabilityId} degradation`,
      status: "PENDING",
      capabilityContext: {
        capabilityId,
        implementationLocations,
        relatedTests
      }
    },
    {
      step: 3,
      task: `Modify or connect ${capabilityId} within bounded capability scope`,
      status: "PENDING",
      capabilityContext: {
        capabilityId,
        implementationLocations,
        relatedTests
      },
      loopRequest: {
        goalId: `selfdev-${targetSlug}`,
        goal: `Implement self-development improvement for ${capabilityId}`,
        capabilityContext: {
          capabilityId,
          implementationLocations,
          relatedTests,
          requiredCapabilities: capabilityTarget.requiredCapabilities || [],
          verificationHints: capabilityTarget.verificationHints || {}
        },
        architectureRequest: {
          goalId: `selfdev-${targetSlug}`,
          goal: `Implement self-development improvement for ${capabilityId}`,
          engineeringSpec: {
            template: "capability_surface_touchpoint",
            capabilityId,
            implementationLocations,
            preferredImplementationLocations: implementationLocations,
            relatedTests,
            objective: `Create a minimal governed touchpoint inside selected capability surface for ${capabilityId}`
          }
        },
        verificationPlan: {
          changedCapability: capabilityId,
          testsDiscovered: relatedTests,
          expectedObservableBehavior: `Implementation evidence attributable to ${capabilityId}`
        },
        scope: {
          capabilityId,
          allowedImplementationLocations: implementationLocations,
          preferredImplementationLocations: implementationLocations,
          relatedTestLocations: relatedTests,
          scopeExpansionPolicy: "explicit_reason_required",
          scopeExpansions: []
        }
      }
    },
    {
      step: 4,
      task: `Inspect diff attribution for ${capabilityId}`,
      status: "PENDING",
      capabilityContext: {
        capabilityId,
        implementationLocations,
        relatedTests
      }
    },
    {
      step: 5,
      task: `Discover and execute verification for ${capabilityId}`,
      status: "PENDING",
      capabilityContext: {
        capabilityId,
        implementationLocations,
        relatedTests
      },
      testFiles: relatedTests
    },
    {
      step: 6,
      task: `Review actual ${capabilityId} change`,
      status: "PENDING",
      capabilityContext: {
        capabilityId,
        implementationLocations,
        relatedTests
      }
    },
    {
      step: 7,
      task: `Refresh capability state for ${capabilityId}`,
      status: "PENDING",
      capabilityContext: {
        capabilityId,
        implementationLocations,
        relatedTests
      }
    }
  ];
}

function compareCapabilitySnapshots(beforeSnapshot = {}, afterSnapshot = {}, capabilityId = "") {
  const before = (beforeSnapshot.capabilities || []).find((item) => item.id === capabilityId) || null;
  const after = (afterSnapshot.capabilities || []).find((item) => item.id === capabilityId) || null;

  const beforeStatus = before ? before.status : CAPABILITY_STATUS.UNKNOWN;
  const afterStatus = after ? after.status : CAPABILITY_STATUS.UNKNOWN;
  const improved = (STATUS_RANK[afterStatus] || STATUS_RANK.UNKNOWN) < (STATUS_RANK[beforeStatus] || STATUS_RANK.UNKNOWN);

  return {
    capabilityId,
    beforeStatus,
    afterStatus,
    improved,
    beforeEvidenceCount: before && Array.isArray(before.verificationEvidence) ? before.verificationEvidence.length : 0,
    afterEvidenceCount: after && Array.isArray(after.verificationEvidence) ? after.verificationEvidence.length : 0,
    evidenceDelta: {
      beforeSnapshotId: beforeSnapshot.snapshotId || null,
      afterSnapshotId: afterSnapshot.snapshotId || null,
      beforeHealth: before ? before.health : null,
      afterHealth: after ? after.health : null
    }
  };
}

module.exports = {
  CAPABILITY_STATUS,
  SELF_DEVELOPMENT_TARGET_SOURCE,
  STATUS_RANK,
  capabilityRecord,
  loadLatestMissionEvidence,
  resolvePreviousMissionEvidence,
  getCurrentBodyState,
  generateSelfDevelopmentCandidates,
  selectSelfDevelopmentTarget,
  groundSelfDevelopmentGoal,
  buildSelfDevelopmentPlannedTasks,
  compareCapabilitySnapshots
};