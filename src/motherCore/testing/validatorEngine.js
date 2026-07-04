const { execSync } = require("child_process");

function run(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: "utf8" }).trim() };
  } catch (error) {
    return { ok: false, output: String(error.stdout || error.stderr || error.message).trim() };
  }
}

function validateProject(scanReport) {
  const jsFiles = [
    "scripts/garuda-mother-build.js",
    "scripts/garuda-agent.js",
    ...scanReport.required
      .filter(item => item.exists && item.file.endsWith(".js"))
      .map(item => item.file)
  ];

  const uniqueFiles = [...new Set(jsFiles)];

  const syntaxChecks = uniqueFiles.map(file => {
    const result = run("node -c " + file);
    return {
      file,
      ok: result.ok,
      output: result.output
    };
  });

  const failed = syntaxChecks.filter(item => !item.ok);

  return {
    engine: "GARUDA Validator Engine v1",
    status: failed.length ? "failed" : "passed",
    totalChecks: syntaxChecks.length,
    failedChecks: failed.length,
    syntaxChecks
  };
}

module.exports = { validateProject };
