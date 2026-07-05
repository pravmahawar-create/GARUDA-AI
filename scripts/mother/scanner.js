const { execSync } = require("child_process");

function scan() {
  console.log("[Scanner] Starting...");

  const result = {
    clean: true,
    changes: []
  };

  try {
    const output = execSync("git status --short", {
      encoding: "utf8"
    }).trim();

    if (output) {
      result.clean = false;
      result.changes = output.split("\n");

      result.changes.forEach(line => console.log(line));
    } else {
      console.log("Working tree clean");
    }
  } catch {
    console.log("Scanner failed.");
  }

  return result;
}

module.exports = { scan };