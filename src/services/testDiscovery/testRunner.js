const { execSync } = require("child_process");
const path = require("path");

function runTestFile(filePath, options = {}) {
  const { timeoutMs = 30000, cwd = process.cwd() } = options;
  const absolutePath = path.resolve(filePath);
  const start = Date.now();
  try {
    const stdout = execSync(`node "${absolutePath}"`, {
      cwd,
      timeout: timeoutMs,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test", CI: "1" }
    });
    return {
      file: filePath,
      status: "PASSED",
      exitCode: 0,
      durationMs: Date.now() - start,
      stdout: stdout || "",
      stderr: ""
    };
  } catch (err) {
    return {
      file: filePath,
      status: "FAILED",
      exitCode: err.status || 1,
      durationMs: Date.now() - start,
      stdout: err.stdout || "",
      stderr: err.stderr || err.message || "",
      timedOut: err.killed || false
    };
  }
}

function runMultipleTests(files, options = {}) {
  const { parallel = false, timeoutMs = 30000 } = options;
  const results = [];
  for (const file of files) {
    const result = runTestFile(file, { timeoutMs });
    results.push(result);
    if (!parallel && result.status === "FAILED" && options.stopOnFirstFailure) break;
  }
  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      durationMs: results.reduce((sum, r) => sum + r.durationMs, 0)
    }
  };
}

module.exports = { runTestFile, runMultipleTests };
