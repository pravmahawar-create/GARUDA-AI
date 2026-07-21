const { normalizeFields, normalizeRelativePath } = require("./EngineeringBrain");

const ALLOWED_TEMPLATES = Object.freeze(["required_fields_validator"]);

function validateProposal(proposal = {}) {
  if (proposal.schemaVersion !== "1.0") throw new Error("Engineering proposal schemaVersion must be 1.0");
  if (!proposal.intentId || typeof proposal.intentId !== "string" || proposal.intentId.length > 120) {
    throw new Error("Engineering proposal requires a bounded intentId");
  }
  if (!proposal.artifactSpec || typeof proposal.artifactSpec !== "object" || Array.isArray(proposal.artifactSpec)) {
    throw new Error("Engineering proposal requires a structured artifactSpec");
  }
  const spec = proposal.artifactSpec;
  if (!ALLOWED_TEMPLATES.includes(spec.template)) throw new Error("Engineering proposal template is not allow-listed");
  const artifactSpec = {
    template: spec.template,
    modulePath: normalizeRelativePath(spec.modulePath),
    testPath: normalizeRelativePath(spec.testPath, { testFile: true }),
    requiredFields: normalizeFields(spec.requiredFields)
  };
  return {
    schemaVersion: "1.0",
    intentId: proposal.intentId,
    summary: String(proposal.summary || "").slice(0, 500),
    confidence: Number.isFinite(proposal.confidence) ? Math.max(0, Math.min(1, proposal.confidence)) : null,
    artifactSpec,
    policy: {
      rawCodeAccepted: false,
      allowedTemplate: artifactSpec.template,
      newFileOnly: true,
      isolatedValidationRequired: true
    }
  };
}

module.exports = { ALLOWED_TEMPLATES, validateProposal };
