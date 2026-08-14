const crypto = require("crypto");

function fail(message) { throw Object.assign(new Error(message), { statusCode: 400 }); }

function proposalAgent(mission, researchOutput) {
  if (!mission || !mission.candidateId) fail("Mission and candidateId are required");
  if (!researchOutput || !researchOutput.research) fail("Research output is required");

  const brief = mission.realWorkIntake && mission.realWorkIntake.brief;
  const acceptanceCriteria = mission.realWorkIntake && mission.realWorkIntake.brief
    ? mission.realWorkIntake.brief.acceptanceCriteria
    : [];

  const proposal = {
    proposal: {
      missionKey: String(mission.missionKey || ""),
      candidateId: String(mission.candidateId),
      opportunityTitle: String(mission.opportunity && mission.opportunity.title || ""),
      deliverableType: brief && brief.deliverableType ? String(brief.deliverableType) : "not specified",
      scope: researchOutput && researchOutput.research ? `Research-informed scope for: ${String(researchOutput.research.opportunityTitle || "unknown")}` : "scope not defined",
      deliverables: Array.isArray(mission.workPackages) ? mission.workPackages.map((t) => ({ title: t.title, status: t.status })) : [],
      acceptanceCriteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [],
      assumptions: researchOutput && researchOutput.research && researchOutput.research.findings
        ? researchOutput.research.findings.slice(0, 5).map((f) => String(f || ""))
        : ["No specific assumptions documented"],
      timeline: "To be determined with founder review",
      generatedAt: new Date().toISOString(),
      agent: "ProposalAgent",
    },
  };

  if (!mission.executionEvidence || typeof mission.executionEvidence !== "object") mission.executionEvidence = {};
  mission.executionEvidence.proposalDraft = proposal;

  return proposal;
}

module.exports = { proposalAgent };