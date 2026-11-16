const { ControlledTestAgent, MissionController } = require("../../src/aegis");

(async () => {
  const agent = new ControlledTestAgent({ mode: "MODE_TRUTHFUL" });
  const info = await agent.start();
  const controller = new MissionController();
  const res = await controller.executeMission(
    { targetUrl: info.url, maxScenarios: 3, headless: "new" },
    { founderApproved: true }
  );
  console.log("Full Mission Status:", res.status);
  console.log("Overall Score:", res.overallScore);
  console.log("Manifest Artifacts:", res.summary.manifest.totalArtifacts);
  console.log("Markdown Report Path:", res.reports.markdownReport.path);
  console.log("Markdown Report SHA-256:", res.reports.markdownReport.sha256);
  await agent.stop();
  process.exit(0);
})().catch(e => {
  console.error("Mission error:", e);
  process.exit(1);
});
