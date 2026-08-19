const { normalizeFields, normalizeRelativePath } = require("./EngineeringBrain");

const ALLOWED_TEMPLATES = Object.freeze(["required_fields_validator", "generic_code_task"]);

const MAX_TARGET_FILES = 10;
const MAX_FILE_CONTENT_CHARS = 64 * 1024;
const MAX_TASK_CHARS = 2000;

function boundedSummary(value) {
  return String(value || "").trim().slice(0, 500);
}

function normalizeGenericCodeTask(spec) {
  const task = String(spec.task || "").trim();
  if (!task) throw new Error("Generic code task requires a task description");
  if (task.length > MAX_TASK_CHARS) throw new Error(`Generic code task description exceeds ${MAX_TASK_CHARS} characters`);

  const targetFiles = Array.isArray(spec.targetFiles)
    ? spec.targetFiles.map((p) => normalizeRelativePath(String(p), { testFile: /\.test\.js$/i.test(String(p)) }))
    : [];
  if (!targetFiles.length || targetFiles.length > MAX_TARGET_FILES) throw new Error(`targetFiles must contain 1 to ${MAX_TARGET_FILES} paths`);

  const plan = spec.implementationPlan;
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new Error("implementationPlan must be an object");
  const planSummary = String(plan.summary || "").trim().slice(0, 500);
  const steps = Array.isArray(plan.steps)
    ? plan.steps.map((s) => String(s).trim().slice(0, 500)).filter(Boolean)
    : [];
  if (!planSummary) throw new Error("implementationPlan.summary is required");
  if (!steps.length) throw new Error("implementationPlan.steps must be a non-empty array");

  const proposedChanges = Array.isArray(spec.proposedChanges) ? spec.proposedChanges : [];
  if (!proposedChanges.length || proposedChanges.length > MAX_TARGET_FILES) {
    throw new Error(`proposedChanges must contain 1 to ${MAX_TARGET_FILES} file changes`);
  }

  const files = proposedChanges.map((change) => {
    if (!change || typeof change !== "object" || Array.isArray(change)) throw new Error("proposedChanges entries must be objects");
    const rawPath = String(change.path || "");
    const isTest = /\.test\.js$/i.test(rawPath);
    const filePath = normalizeRelativePath(rawPath, { testFile: isTest });
    const content = String(change.content ?? "");
    if (!content.trim()) throw new Error(`proposed change ${filePath} has empty content`);
    if (content.length > MAX_FILE_CONTENT_CHARS) throw new Error(`proposed change ${filePath} exceeds ${MAX_FILE_CONTENT_CHARS} characters`);
    if (!targetFiles.includes(filePath)) throw new Error(`proposed change path not declared in targetFiles: ${filePath}`);
    return { path: filePath, kind: isTest ? "test" : "module", content };
  });

  if (!files.some((f) => f.kind === "module")) throw new Error("generic_code_task requires at least one non-test module file");
  if (!files.some((f) => f.kind === "test")) throw new Error("generic_code_task requires at least one *.test.js file");

  const tests = Array.isArray(spec.verification && spec.verification.tests)
    ? spec.verification.tests.map((t) => normalizeRelativePath(String(t), { testFile: true }))
    : [];
  if (!tests.length) throw new Error("verification.tests must be a non-empty array of *.test.js paths");
  for (const testPath of tests) {
    if (!files.some((f) => f.path === testPath)) throw new Error(`verification test not among proposedChanges: ${testPath}`);
  }

  return {
    template: "generic_code_task",
    task,
    targetFiles,
    implementationPlan: { summary: planSummary, steps },
    proposedChanges: files,
    verification: { tests }
  };
}

function validateProposal(proposal = {}) {
  if (proposal.schemaVersion !== "1.0") throw new Error("Engineering proposal schemaVersion must be 1.0");
  if (!proposal.intentId || typeof proposal.intentId !== "string" || proposal.intentId.length > 120) {
    throw new Error("Engineering proposal requires a bounded intentId");
  }
  if (!proposal.artifactSpec || typeof proposal.artifactSpec !== "object" || Array.isArray(proposal.artifactSpec)) {
    throw new Error("Engineering proposal requires a structured artifactSpec");
  }
  const spec = proposal.artifactSpec;
  if (!ALLOWED_TEMPLATES.includes(spec.template)) throw new Error("Engineering proposal template is not allow-listed");

  if (spec.template === "generic_code_task") {
    const artifactSpec = normalizeGenericCodeTask(spec);
    return {
      schemaVersion: "1.0",
      intentId: proposal.intentId,
      summary: boundedSummary(proposal.summary),
      confidence: Number.isFinite(proposal.confidence) ? Math.max(0, Math.min(1, proposal.confidence)) : null,
      artifactSpec,
      policy: {
        rawCodeAccepted: false,
        allowedTemplate: artifactSpec.template,
        newFileOnly: true,
        isolatedValidationRequired: true,
        maxFiles: MAX_TARGET_FILES,
        maxFileContentChars: MAX_FILE_CONTENT_CHARS
      }
    };
  }

  const artifactSpec = {
    template: spec.template,
    modulePath: normalizeRelativePath(spec.modulePath),
    testPath: normalizeRelativePath(spec.testPath, { testFile: true }),
    requiredFields: normalizeFields(spec.requiredFields)
  };
  return {
    schemaVersion: "1.0",
    intentId: proposal.intentId,
    summary: boundedSummary(proposal.summary),
    confidence: Number.isFinite(proposal.confidence) ? Math.max(0, Math.min(1, proposal.confidence)) : null,
    artifactSpec,
    policy: {
      rawCodeAccepted: false,
      allowedTemplate: artifactSpec.template,
      newFileOnly: true,
      isolatedValidationRequired: true
    }
  };
}

module.exports = { ALLOWED_TEMPLATES, validateProposal, normalizeGenericCodeTask };
