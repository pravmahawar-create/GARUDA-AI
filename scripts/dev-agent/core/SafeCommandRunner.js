const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_TIMEOUT_MS = 120000;
const MAX_OUTPUT_BYTES = 1024 * 1024;

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function safeEnvironment() {
  const env = { NODE_ENV: "test", CI: "1" };
  ["PATH", "Path", "SYSTEMROOT", "SystemRoot", "COMSPEC", "ComSpec", "PATHEXT", "NODE_PATH", "HOME", "USERPROFILE", "TMP", "TEMP"].forEach((key) => {
    if (process.env[key]) env[key] = process.env[key];
  });
  return env;
}

class SafeCommandRunner {
  constructor({ rootDir = process.cwd(), timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.rootDir = fs.realpathSync(rootDir);
    this.timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(100, Number(timeoutMs) || DEFAULT_TIMEOUT_MS));
  }

  resolveTarget(filePath, { testOnly = false } = {}) {
    if (!filePath || typeof filePath !== "string") throw new Error("A target file is required");
    const absolutePath = path.resolve(this.rootDir, filePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      throw new Error(`Target file does not exist: ${filePath}`);
    }
    const realPath = fs.realpathSync(absolutePath);
    const relative = path.relative(this.rootDir, realPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Target file is outside the approved workspace");
    if (!/\.(c?js|mjs)$/i.test(realPath)) throw new Error("Only JavaScript targets are allowed");
    if (testOnly && !/\.test\.(c?js|mjs)$/i.test(realPath)) throw new Error("Test execution requires a *.test.js target");
    return { absolutePath: realPath, relativePath: relative.replace(/\\/g, "/") };
  }

  executeNode(args, target) {
    const startedAt = new Date();
    const beforeHash = sha256File(target.absolutePath);
    const result = spawnSync(process.execPath, args, {
      cwd: this.rootDir,
      env: safeEnvironment(),
      shell: false,
      encoding: "utf8",
      timeout: this.timeoutMs,
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true
    });
    const completedAt = new Date();
    const afterHash = sha256File(target.absolutePath);
    const timedOut = Boolean(result.error && result.error.code === "ETIMEDOUT");
    const exitCode = typeof result.status === "number" ? result.status : null;
    const status = !result.error && exitCode === 0 ? "PASSED" : "FAILED";
    const evidence = {
      runner: "GARUDA SafeCommandRunner v1",
      status,
      executable: path.basename(process.execPath),
      arguments: args.map(String),
      targetFile: target.relativePath,
      exitCode,
      signal: result.signal || null,
      timedOut,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || ""),
      error: result.error ? { code: result.error.code || "EXECUTION_ERROR", message: result.error.message } : null,
      targetHashBefore: beforeHash,
      targetHashAfter: afterHash,
      targetModified: beforeHash !== afterHash,
      shellUsed: false
    };
    evidence.evidenceId = crypto.createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
    return evidence;
  }

  runSyntaxCheck(filePath) {
    const target = this.resolveTarget(filePath);
    return this.executeNode(["--check", target.absolutePath], target);
  }

  runNodeTest(filePath) {
    const target = this.resolveTarget(filePath, { testOnly: true });
    return this.executeNode([target.absolutePath], target);
  }
}

module.exports = SafeCommandRunner;
module.exports.SafeCommandRunner = SafeCommandRunner;
module.exports.safeEnvironment = safeEnvironment;
