function createTaskQueue(scanReport) {
  return scanReport.findings.map((finding, index) => ({
    id: "GARUDA-TASK-" + String(index + 1).padStart(3, "0"),
    status: "open",
    priority: finding.severity === "high" ? "P1" : "P2",
    source: "scanner_engine",
    type: finding.type,
    title: finding.message,
    file: finding.file || null,
    createdAt: new Date().toISOString()
  }));
}

module.exports = { createTaskQueue };
