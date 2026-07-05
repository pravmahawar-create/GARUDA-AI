const { execSync } = require("child_process");

function getContext() {
  let clean = true;
  let changes = [];

  try {
    const output = execSync("git status --short", {
      encoding: "utf8"
    }).trim();

    if (output) {
      clean = false;
      changes = output.split("\n");
    }
  } catch {}

  return {
    timestamp: new Date().toISOString(),
    clean,
    changes,
    platform: process.platform,
    node: process.version
  };
}

module.exports = { getContext };