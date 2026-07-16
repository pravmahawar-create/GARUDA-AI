const { ProjectMemoryEngine } = require("./core/ProjectMemoryEngine");

function usage() {
  console.log("Usage: npm run dev:memory -- <latest|incomplete|summary>");
}

function main() {
  const command = String(process.argv[2] || "").trim().toLowerCase();
  const memoryEngine = new ProjectMemoryEngine();

  if (!command) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (command === "latest") {
    const latest = memoryEngine.getLatestRecord();
    console.log(JSON.stringify({ command, latest }, null, 2));
    return;
  }

  if (command === "incomplete") {
    const incomplete = memoryEngine.getIncompleteWork();
    console.log(JSON.stringify({ command, incomplete }, null, 2));
    return;
  }

  if (command === "summary") {
    const summary = memoryEngine.buildMemorySummary();
    console.log(JSON.stringify({ command, summary }, null, 2));
    return;
  }

  usage();
  process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error("[Memory] Failed:", error.message);
  process.exitCode = 1;
}