const { GarudaBibleLoader } = require("./core/GarudaBibleLoader");
const { GarudaBibleValidator } = require("./core/GarudaBibleValidator");

function usage() {
  console.log("Usage: node scripts/dev-agent/run-bible.js <validate|summary|context|chapter <id>|worker <brain>|mother>");
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

function buildSummary(loader) {
  const payload = loader.loadAll({ onlyActive: false, requireRequired: true });
  const activeCount = payload.chapters.filter((chapter) => chapter.status === "active").length;

  return {
    command: "summary",
    engine: "GARUDA Bible CLI v1",
    generatedAt: new Date().toISOString(),
    version: payload.version,
    basePath: payload.basePath,
    totalChapters: payload.chapters.length,
    activeChapters: activeCount,
    inactiveChapters: payload.chapters.length - activeCount,
    chapterIds: payload.chapters.map((chapter) => chapter.chapterId),
    sourcePaths: payload.sourcePaths
  };
}

function main() {
  const command = String(process.argv[2] || "").trim().toLowerCase();
  const arg = String(process.argv[3] || "").trim();

  const loader = new GarudaBibleLoader();
  const validator = new GarudaBibleValidator({ loader });

  if (!command) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (command === "validate") {
    const result = validator.validate();
    printJson({ command, result });
    if (!result.ok) {
      process.exitCode = 1;
    }
    return;
  }

  if (command === "summary") {
    printJson(buildSummary(loader));
    return;
  }

  if (command === "context") {
    const context = loader.loadCompactContext({ onlyActive: true, requireRequired: true });
    printJson({ command, context });
    return;
  }

  if (command === "chapter") {
    if (!arg) {
      throw new Error("chapter command requires chapter id, e.g. chapter 04_SYSTEM_ARCHITECTURE");
    }

    const chapter = loader.loadChapter(arg, { allowInactive: true });
    printJson({ command, chapterId: arg, chapter });
    return;
  }

  if (command === "worker") {
    if (!arg) {
      throw new Error("worker command requires worker/brain type, e.g. worker architect");
    }

    const workerContext = loader.loadWorkerContext(arg, { requireRequired: true });
    printJson({ command, worker: arg, context: workerContext });
    return;
  }

  if (command === "mother") {
    const motherContext = loader.loadMotherContext({ requireRequired: true });
    printJson({ command, context: motherContext });
    return;
  }

  usage();
  process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error("[Bible] Failed:", error.message);
  process.exitCode = 1;
}
