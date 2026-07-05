const { execSync } = require("child_process");

function scan() {
  console.log("[Scanner] Starting...");

  try {
    const status = execSync("git status --short", {
      encoding: "utf8"
    }).trim();

    console.log(status || "Working tree clean");
  } catch {
    console.log("Scanner failed.");
  }
}

module.exports = { scan };