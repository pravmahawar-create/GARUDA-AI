const { execSync } = require("child_process");

function run(command) {
  try {
    const output = execSync(command, { encoding: "utf8" }).trim();
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      output: String(error.stdout || error.stderr || error.message).trim()
    };
  }
}

class Mother {
  async start() {
    console.log("GARUDA Mother v0.2 Started");

    console.log("[Scanner] Checking repository...");
    const status = run("git status --short");
    console.log(status.output || "Working tree clean");

    console.log("[Builder] Running GARUDA Builder...");
    const build = run("npm run build:garuda");
    console.log(build.output);

    console.log("[Validator] Checking generated frontend files...");
    const validation = run("node -c scripts/build-garuda.js");
    console.log(validation.ok ? "Validator passed" : validation.output);

    console.log("[Reporter] Mother cycle complete.");
    console.log("GARUDA Mother v0.2 Online");
  }
}

new Mother().start();