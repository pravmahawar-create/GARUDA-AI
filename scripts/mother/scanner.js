const { execSync } = require("child_process");

function scan() {
  console.log("[Scanner] Starting...");

  const result = {
    clean: true,
    changes: [],
    summary: {
      modified: 0,
      untracked: 0,
      deleted: 0,
      renamed: 0
    }
  };

  try {
    const output = execSync("git status --short", {
      encoding: "utf8"
    }).trim();

    if (!output) {
      console.log("Working tree clean");
      return result;
    }

    result.clean = false;
    result.changes = output.split("\n");

    result.changes.forEach((line) => {
      console.log(line);

      const status = line.substring(0, 2).trim();

      if (status.includes("M")) result.summary.modified++;
      if (status.includes("??")) result.summary.untracked++;
      if (status.includes("D")) result.summary.deleted++;
      if (status.includes("R")) result.summary.renamed++;
    });

    console.log("\n[Scanner Summary]");
    console.log("Modified :", result.summary.modified);
    console.log("Untracked:", result.summary.untracked);
    console.log("Deleted  :", result.summary.deleted);
    console.log("Renamed  :", result.summary.renamed);
  } catch (err) {
    result.clean = false;
    result.error = err.message;
    console.log("[Scanner] Failed:", err.message);
  }

  return result;
}

module.exports = { scan };