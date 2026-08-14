const crypto = require("crypto");

function fail(message) { throw Object.assign(new Error(message), { statusCode: 400 }); }

function researchAgent(mission, workPackages) {
  if (!mission || !mission.candidateId) fail("Mission and candidateId are required");

  const notes = {
    research: {
      summary: `Research conducted for mission ${String(mission.missionKey || mission.candidateId)}`,
      opportunityTitle: String(mission.opportunity && mission.opportunity.title || ""),
      candidateId: String(mission.candidateId),
      workPackageCount: Array.isArray(workPackages) ? workPackages.length : 0,
      taskTitles: Array.isArray(workPackages) ? workPackages.map((t) => t.title || "unnamed").filter(Boolean) : [],
      findings: [],
      evidenceGaps: [],
      generatedAt: new Date().toISOString(),
      agent: "ResearchAgent",
    },
  };

  if (!mission.architecturePlan || typeof mission.architecturePlan !== "object") mission.architecturePlan = {};
  mission.architecturePlan.researchNotes = notes;

  return notes;
}

module.exports = { researchAgent };