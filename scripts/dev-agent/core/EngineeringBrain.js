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
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = fs.realpathSync(rootDir);
  }

  buildRequiredFieldsValidator(spec = {}) {
    if (spec.template !== "required_fields_validator") throw new Error("Engineering Brain v1 only supports required_fields_validator");
    const modulePath = normalizeRelativePath(spec.modulePath);
    const testPath = normalizeRelativePath(spec.testPath, { testFile: true });
    const requiredFields = normalizeFields(spec.requiredFields);
    for (const target of [modulePath, testPath]) {
      if (fs.existsSync(path.join(this.rootDir, target))) throw new Error(`New-file-only policy rejected existing target: ${target}`);
    }

    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "garuda-engineering-"));
    const moduleContent = renderRequiredFieldsValidator(requiredFields);
    const testContent = renderValidatorTest(modulePath, testPath, requiredFields);
    const artifacts = [
      { path: modulePath, content: moduleContent },
      { path: testPath, content: testContent }
    ];
    artifacts.forEach((artifact) => {
      const target = path.join(workspace, artifact.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, artifact.content, "utf8");
      artifact.sha256 = crypto.createHash("sha256").update(artifact.content).digest("hex");
    });

    const runner = new SafeCommandRunner({ rootDir: workspace });
    const evidence = [runner.runSyntaxCheck(modulePath), runner.runSyntaxCheck(testPath), runner.runNodeTest(testPath)];
    const passed = evidence.every((item) => item.status === "PASSED" && item.targetModified === false);
    const patch = artifacts.map((artifact) => newFilePatch(artifact.path, artifact.content)).join("\n");

    return {
      engine: "GARUDA Engineering Brain v1",
      status: passed ? "ARTIFACT_READY_FOR_REVIEW" : "VALIDATION_FAILED",
      template: spec.template,
      workspace,
      artifacts: artifacts.map(({ path: artifactPath, sha256 }) => ({ path: artifactPath, sha256 })),
      patch,
      patchSha256: crypto.createHash("sha256").update(patch).digest("hex"),
      evidence,
      sourceTreeModified: [modulePath, testPath].some((target) => fs.existsSync(path.join(this.rootDir, target))),
      requiresFounderApprovalToApply: true,
      commitPushDeployAllowed: false
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
