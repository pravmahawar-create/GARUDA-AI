const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const SafeCommandRunner = require("./SafeCommandRunner");

const ALLOWED_ROOTS = ["src/generated/", "universes/"];

function normalizeRelativePath(value, { testFile = false } = {}) {
  const normalized = String(value || "").replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.includes("../") || path.isAbsolute(normalized)) {
    throw new Error("Artifact path must stay inside the approved workspace");
  }
  if (!ALLOWED_ROOTS.some((root) => normalized.startsWith(root))) {
    throw new Error(`Artifact path must start with one of: ${ALLOWED_ROOTS.join(", ")}`);
  }
  if (testFile ? !/\.test\.js$/i.test(normalized) : !/\.js$/i.test(normalized) || /\.test\.js$/i.test(normalized)) {
    throw new Error(testFile ? "Test artifact must end with .test.js" : "Module artifact must end with .js");
  }
  return normalized;
}

function normalizeFields(fields) {
  if (!Array.isArray(fields) || fields.length < 1 || fields.length > 20) throw new Error("requiredFields must contain 1 to 20 fields");
  const normalized = fields.map((field) => String(field).trim()).filter(Boolean);
  if (normalized.length !== fields.length || new Set(normalized).size !== normalized.length) throw new Error("requiredFields must be unique non-empty strings");
  return normalized;
}

function renderRequiredFieldsValidator(requiredFields) {
  const fieldsLiteral = JSON.stringify(requiredFields);
  return `const REQUIRED_FIELDS = Object.freeze(${fieldsLiteral});\n\nfunction validateRequiredFields(input = {}) {\n  const value = input && typeof input === "object" ? input : {};\n  const missing = REQUIRED_FIELDS.filter((field) => value[field] === undefined || value[field] === null || value[field] === "");\n  return { valid: missing.length === 0, missing };\n}\n\nmodule.exports = { REQUIRED_FIELDS, validateRequiredFields };\n`;
}

function renderValidatorTest(modulePath, testPath, requiredFields) {
  const relativeModule = path.posix.relative(path.posix.dirname(testPath), modulePath);
  const requirePath = relativeModule.startsWith(".") ? relativeModule : `./${relativeModule}`;
  const validInput = Object.fromEntries(requiredFields.map((field) => [field, `sample_${field}`]));
  return `const assert = require("assert");\nconst { validateRequiredFields } = require(${JSON.stringify(requirePath)});\n\nconst valid = validateRequiredFields(${JSON.stringify(validInput)});\nassert.strictEqual(valid.valid, true);\nassert.deepStrictEqual(valid.missing, []);\n\nconst invalid = validateRequiredFields({});\nassert.strictEqual(invalid.valid, false);\nassert.deepStrictEqual(invalid.missing, ${JSON.stringify(requiredFields)});\n\nconsole.log("Generated required-fields validator passed.");\n`;
}

function newFilePatch(relativePath, content) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return [
    `diff --git a/${relativePath} b/${relativePath}`,
    "new file mode 100644",
    "--- /dev/null",
    `+++ b/${relativePath}`,
    `@@ -0,0 +1,${lines.length} @@`,
    ...lines.map((line) => `+${line}`),
    ""
  ].join("\n");
}

class EngineeringBrain {
  constructor({ rootDir = process.cwd(), intelligenceProvider = null } = {}) {
    this.rootDir = fs.realpathSync(rootDir);
    this.intelligenceProvider = intelligenceProvider;
  }

  validateArtifacts(artifacts, testFiles, metadata = {}) {
    for (const artifact of artifacts) {
      if (fs.existsSync(path.join(this.rootDir, artifact.path))) throw new Error(`New-file-only policy rejected existing target: ${artifact.path}`);
    }
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-engineering-"));
    artifacts.forEach((artifact) => {
      const target = path.join(workspace, artifact.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, artifact.content, "utf8");
      artifact.sha256 = crypto.createHash("sha256").update(artifact.content).digest("hex");
    });
    const runner = new SafeCommandRunner({ rootDir: workspace });
    const evidence = [...artifacts.map((artifact) => runner.runSyntaxCheck(artifact.path)), ...testFiles.map((testFile) => runner.runNodeTest(testFile))];
    const passed = evidence.every((item) => item.status === "PASSED" && item.targetModified === false);
    const patch = artifacts.map((artifact) => newFilePatch(artifact.path, artifact.content)).join("\n");
    return {
      engine: "GARUDA Engineering Brain v1",
      status: passed ? "ARTIFACT_READY_FOR_REVIEW" : "VALIDATION_FAILED",
      workspace,
      artifacts: artifacts.map(({ path: artifactPath, kind, sha256, content }) => ({ path: artifactPath, kind: kind || "generated", sha256, content })),
      patch,
      patchSha256: crypto.createHash("sha256").update(patch).digest("hex"),
      evidence,
      sourceTreeModified: artifacts.some((artifact) => fs.existsSync(path.join(this.rootDir, artifact.path))),
      requiresFounderApprovalToApply: true,
      commitPushDeployAllowed: false,
      ...metadata
    };
  }

  applyPatchToWorkspace(buildResult, options = {}) {
    if (!buildResult || !Array.isArray(buildResult.artifacts) || buildResult.artifacts.length === 0) {
      throw new Error("applyPatchToWorkspace requires a buildResult with artifacts");
    }
    if (options.founderApproved !== true) {
      return { status: "FOUNDER_APPROVAL_REQUIRED", appliedFiles: [], requiresFounderApprovalToApply: true };
    }
    if (buildResult.status !== "ARTIFACT_READY_FOR_REVIEW") {
      throw new Error(`Cannot apply an artifact in state: ${buildResult.status || "unknown"}`);
    }
    const appliedFiles = [];
    for (const artifact of buildResult.artifacts) {
      const relativePath = normalizeRelativePath(artifact.path, { testFile: /\.test\.js$/i.test(artifact.path || "") });
      const targetPath = path.join(this.rootDir, relativePath);
      if (fs.existsSync(targetPath)) {
        throw new Error(`New-file-only policy rejected existing target: ${relativePath}`);
      }
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, String(artifact.content ?? ""), "utf8");
      if (artifact.sha256 && crypto.createHash("sha256").update(String(artifact.content ?? "")).digest("hex") !== artifact.sha256) {
        throw new Error(`Content fingerprint mismatch for ${relativePath} — refusing to apply tampered artifact`);
      }
      appliedFiles.push(relativePath);
    }
    const runner = new SafeCommandRunner({ rootDir: this.rootDir });
    const modules = buildResult.artifacts.filter((a) => !/\.test\.js$/i.test(a.path || ""));
    const tests = buildResult.artifacts.filter((a) => /\.test\.js$/i.test(a.path || ""));
    const evidence = [
      ...modules.map((a) => runner.runSyntaxCheck(a.path)),
      ...tests.map((a) => runner.runNodeTest(a.path))
    ];
    const verified = evidence.every((item) => item.status === "PASSED" && item.targetModified === false);
    if (!verified) {
      for (const file of appliedFiles) fs.unlinkSync(path.join(this.rootDir, file));
      return { status: "PATCH_REJECTED", appliedFiles: [], evidence, reason: "verification_failed_rollback_completed" };
    }
    return {
      status: "PATCH_APPLIED_AND_VERIFIED",
      engine: "GARUDA Engineering Brain v1",
      appliedFiles,
      evidence,
      patch: buildResult.patch || null,
      patchSha256: buildResult.patchSha256 || null,
      requiresFounderApprovalToApply: false,
      commitPushDeployAllowed: false
    };
  }

  buildRequiredFieldsValidator(spec = {}) {
    if (spec.template !== "required_fields_validator") throw new Error("Engineering Brain v1 only supports required_fields_validator");
    const modulePath = normalizeRelativePath(spec.modulePath);
    const testPath = normalizeRelativePath(spec.testPath, { testFile: true });
    const requiredFields = normalizeFields(spec.requiredFields);
    const moduleContent = renderRequiredFieldsValidator(requiredFields);
    const testContent = renderValidatorTest(modulePath, testPath, requiredFields);
    const artifacts = [
      { path: modulePath, kind: "module", content: moduleContent },
      { path: testPath, kind: "test", content: testContent }
    ];
    return this.validateArtifacts(artifacts, [testPath], { template: spec.template, intelligenceUsed: false });
  }

  buildFromIntelligence(request = {}) {
    if (!this.intelligenceProvider || typeof this.intelligenceProvider.propose !== "function") throw new Error("Engineering intelligence provider is not configured");
    const metadata = typeof this.intelligenceProvider.getMetadata === "function" ? this.intelligenceProvider.getMetadata() : null;
    if (!metadata || metadata.directWriteAllowed !== false || metadata.commandExecutionAllowed !== false || metadata.gitActionsAllowed !== false) {
      throw new Error("Engineering intelligence provider violates capability isolation contract");
    }
    const proposal = this.intelligenceProvider.propose(Object.freeze({ ...request }));
    if (proposal && typeof proposal.then === "function") throw new Error("Async providers require a dedicated bounded adapter");
    const { validateProposal } = require("./EngineeringProposalPolicy");
    const validated = validateProposal(proposal);
    const result = this.buildRequiredFieldsValidator(validated.artifactSpec);
    return {
      ...result,
      intelligenceUsed: true,
      intentId: validated.intentId,
      proposalSummary: validated.summary,
      proposalConfidence: validated.confidence,
      proposalPolicy: validated.policy,
      provider: metadata
    };
  }

  build(spec = {}) {
    return this.buildRequiredFieldsValidator(spec);
  }
}

module.exports = EngineeringBrain;
module.exports.EngineeringBrain = EngineeringBrain;
module.exports.ALLOWED_ROOTS = ALLOWED_ROOTS;
module.exports.newFilePatch = newFilePatch;
module.exports.normalizeRelativePath = normalizeRelativePath;
module.exports.normalizeFields = normalizeFields;
