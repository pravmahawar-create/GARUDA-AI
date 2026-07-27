const revenueService = require("../services/revenueService");
const revenueConversionService = require("../services/revenueConversionService");
const settlementService = require("../services/settlementService");
const motherIntegration = require("../services/motherRevenueIntegrationService");
const platformAuth = require("../services/motherPlatformAuthService");
const dealTrackerService = require("../services/dealTrackerService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback
  });
}

exports.list = async (req, res) => {
  try {
    const items = await revenueService.listRevenue(req.query || {});
    return res.json({
      success: true,
      data: items
    });
  } catch (error) {
    return sendError(res, error, "Failed to list revenue records");
  }
};

exports.create = async (req, res) => {
  try {
    const result = await revenueService.createRevenue(req.body || {});
    return res.status(201).json({
      success: true,
      data: result.record,
      workflow: result.workflow
    });
  } catch (error) {
    return sendError(res, error, "Failed to create revenue record");
  }
};

exports.update = async (req, res) => {
  try {
    const result = await revenueService.updateRevenue(req.params.id, req.body || {});
    return res.json({
      success: true,
      data: result.record,
      workflow: result.workflow
    });
  } catch (error) {
    return sendError(res, error, "Failed to update revenue record");
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await revenueService.deleteRevenue(req.params.id);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return sendError(res, error, "Failed to delete revenue record");
  }
};

exports.metrics = async (_req, res) => {
  try {
    const metrics = await revenueService.getRevenueMetrics();
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    return sendError(res, error, "Failed to compute revenue metrics");
  }
};

exports.analytics = async (req, res) => {
  try {
    const monthsBack = Number(req.query.monthsBack) || 6;
    const analytics = await revenueService.getRevenueAnalytics({ monthsBack });
    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    return sendError(res, error, "Failed to compute revenue analytics");
  }
};

exports.settlement = async (_req, res) => {
  try {
    const summary = await revenueService.getSettlementSummary();
    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    return sendError(res, error, "Failed to compute settlement summary");
  }
};

exports.previewConversion = async (req, res) => {
  try {
    const preview = await revenueConversionService.previewConversion(
      req.params.opportunityId,
      req.body || {}
    );
    return res.json({ success: true, data: preview });
  } catch (error) {
    return sendError(res, error, "Failed to preview revenue conversion");
  }
};

exports.executeConversion = async (req, res) => {
  try {
    const result = await revenueConversionService.executeConversion(
      req.params.opportunityId,
      req.body || {},
      { founderApproved: req.get("x-garuda-founder-approved") }
    );
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to execute revenue conversion");
  }
};

exports.previewSettlement = async (req, res) => {
  try {
    const preview = await settlementService.previewSettlement(req.params.revenueRecordId, req.body || {});
    return res.json({ success: true, data: preview });
  } catch (error) {
    return sendError(res, error, "Failed to preview settlement");
  }
};

exports.createSettlement = async (req, res) => {
  try {
    const ledger = await settlementService.createSettlement(req.params.revenueRecordId, req.body || {}, { founderApproved: req.get("x-garuda-founder-approved") });
    return res.status(201).json({ success: true, data: ledger });
  } catch (error) {
    return sendError(res, error, "Failed to create settlement");
  }
};

exports.listSettlements = async (req, res) => {
  try {
    return res.json({ success: true, data: await settlementService.listSettlements(req.query || {}) });
  } catch (error) {
    return sendError(res, error, "Failed to list settlements");
  }
};

exports.updateSettlementStatus = async (req, res) => {
  try {
    const ledger = await settlementService.updateSettlementStatus(req.params.id, req.body || {}, { founderApproved: req.get("x-garuda-founder-approved") });
    return res.json({ success: true, data: ledger });
  } catch (error) {
    return sendError(res, error, "Failed to update settlement");
  }
};

exports.listCandidates = async (req, res) => {
  try {
    const candidates = motherIntegration.listMissionCandidates(req.query || {});
    return res.json({ success: true, data: candidates });
  } catch (error) {
    return sendError(res, error, "Failed to list mission candidates");
  }
};

exports.getCandidate = async (req, res) => {
  try {
    const candidate = motherIntegration.getMissionCandidate(req.params.id);
    return res.json({ success: true, data: candidate });
  } catch (error) {
    return sendError(res, error, "Failed to get mission candidate");
  }
};

exports.recordCandidateDecision = async (req, res) => {
  try {
    const payload = {
      missionCandidateId: req.params.id,
      founderDecision: req.body.founderDecision || req.body.decision,
      founderReason: req.body.founderReason || req.body.reason,
      instructions: req.body.instructions
    };
    const result = motherIntegration.recordFounderDecision(payload);
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to record Founder decision");
  }
};

exports.getCandidateAuditTrail = async (req, res) => {
  try {
    const audit = motherIntegration.getDecisionAuditTrail(req.params.id);
    return res.json({ success: true, data: audit });
  } catch (error) {
    return sendError(res, error, "Failed to get candidate decision audit trail");
  }
};

exports.getConnectorRequirements = async (req, res) => {
  try {
    const reqs = platformAuth.getCredentialRequirements(req.params.id);
    return res.json({ success: true, data: reqs });
  } catch (error) {
    return sendError(res, error, "Failed to get connector requirements");
  }
};

exports.getConnectorAuthStatus = async (req, res) => {
  try {
    const status = platformAuth.validateConnectorAuthentication(req.params.id, process.env);
    return res.json({ success: true, data: status });
  } catch (error) {
    return sendError(res, error, "Failed to get connector authentication status");
  }
};

exports.validateConnectorCredentials = async (req, res) => {
  try {
    const customEnv = req.body.env ? { ...process.env, ...req.body.env } : process.env;
    const result = platformAuth.validateConnectorAuthentication(req.params.id, customEnv);
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to validate connector credentials");
  }
};

exports.getMissionConnectorReadiness = async (req, res) => {
  try {
    const connectorId = req.query.connectorId || "generic_email";
    const readiness = platformAuth.evaluateConnectorReadiness(req.params.id, connectorId, process.env);
    return res.json({ success: true, data: readiness });
  } catch (error) {
    return sendError(res, error, "Failed to get mission connector readiness");
  }
};

exports.prepareSmtpAction = async (req, res) => {
  try {
    const proposal = platformAuth.prepareGovernedSmtpAction(req.params.id, { env: process.env });
    return res.json({ success: true, data: proposal });
  } catch (error) {
    return sendError(res, error, "Failed to prepare SMTP action");
  }
};

exports.executeSmtpAction = async (req, res) => {
  try {
    const { authorizationPhrase } = req.body || {};
    const result = await platformAuth.executeGovernedSmtpAction(req.params.id, authorizationPhrase, { env: process.env });
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to execute SMTP action");
  }
};

/* DEAL TRACKER API CONTROLLER METHODS */
exports.submitDeal = async (req, res) => {
  try {
    const result = dealTrackerService.recordDealSubmission(req.body || {}, { founderApproved: true });
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to record deal submission");
  }
};

exports.getDealMetrics = async (_req, res) => {
  try {
    const metrics = dealTrackerService.getRealityMetrics();
    return res.json({ success: true, data: metrics });
  } catch (error) {
    return sendError(res, error, "Failed to fetch deal metrics");
  }
};

exports.recordDealResponse = async (req, res) => {
  try {
    const result = dealTrackerService.recordClientResponse(req.body || {}, { founderApproved: true });
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to record client response");
  }
};
