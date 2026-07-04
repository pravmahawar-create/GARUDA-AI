const fs = require("fs");
const path = require("path");
const { scanRepository } = require("../src/motherCore/scanner/scannerEngine");
const { createTaskQueue } = require("../src/motherCore/tasks/taskQueueEngine");

const report = scanRepository(process.cwd());
const taskQueue = createTaskQueue(report);

const finalReport = {
  ...report,
  taskQueue,
  motherCoreDecision: taskQueue.length
    ? "Scanner ne open tasks detect kiye hain."
    : "Repository validated. Mother Core next planning ke liye ready hai."
};

fs.mkdirSync(path.join(process.cwd(), "reports"), { recursive: true });

fs.writeFileSync(
  path.join(process.cwd(), "reports", "mother-core-scan-report.json"),
  JSON.stringify(finalReport, null, 2)
);

console.log("GARUDA Scanner Engine completed.");
console.log("Files scanned:", finalReport.summary.totalFiles);
console.log("Findings:", finalReport.summary.findings);
console.log("Tasks created:", taskQueue.length);
console.log("Decision:", finalReport.motherCoreDecision);
