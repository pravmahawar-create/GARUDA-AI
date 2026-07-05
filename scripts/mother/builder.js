const { execSync } = require("child_process");

function build() {
  console.log("[Builder] Starting...");

  try {
    execSync("npm run build:garuda", {
      stdio: "inherit"
    });

    console.log("[Builder] Build completed.");
  } catch {
    console.log("[Builder] Build failed.");
  }
}

module.exports = { build };