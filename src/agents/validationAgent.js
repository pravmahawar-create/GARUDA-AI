const crypto = require("crypto");

function fail(message) { throw Object.assign(new Error(message), { statusCode: 400 }); }

function validationAgent(mission, proposalOutput, acceptanceCriteria) {
  if (!mission || !mission.candidateId) fail("Mission and candidateId are required");
  if (!proposalOutput || !proposalOutput.proposal) fail("Proposal output is required");

  const criteria = Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [];
  const issues = [];

  const proposal = proposalOutput.proposal;

  // Check for missing deliverables
  if (!proposal.deliverables || proposal.deliverables.length === 0) {
    issues.push("No deliverables defined in proposal");
  }

  // Check for missing acceptance criteria mapping
  if (!proposal.acceptanceCriteria || proposal.acceptanceCriteria.length === 0) {
    issues.push("No acceptance criteria defined in proposal");
  }

  // Check for undefined/score fields that could be unsupported claims
  if (proposal.scope && typeof proposal.scope !== "string") {
    issues.push("Scope field has unexpected type");
  }

  // Basic validity check: proposal must have core fields
  const requiredFields = ["missionKey", "candidateId", "opportunityTitle", "deliverableType", "scope", "acceptanceCriteria"];
  const missingFields = requiredFields.filter((f) => !proposal[f]);
  if (missingFields.length > 0) {
    issues.push(`Missing required proposal fields: ${missingFields.join(", ")}`);
  }

  const result = {
    validation: {
      missionKey: String(mission.missionKey || ""),
      candidateId: String(mission.candidateId),
      overallPass: issues.length === 0,
      issues: issues,
      criteriaChecked: criteria.slice(0, 10), // cap checked criteria
      validatedAt: new Date().toISOString(),
      agent: "ValidationAgent",
    },
  };

  if (!mission.governance || typeof mission.governance !== "object") mission.governance = {};
  mission.governance.validationResult = result;

  return result;
}

module.exports = { validationAgent };