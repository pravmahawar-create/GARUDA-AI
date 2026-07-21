const capabilityRegistry = require("../services/capabilityRegistryService");
const revenueOrchestrator = require("../services/revenueOrchestratorService");

exports.list = async (req, res, next) => {
  try {
    const filters = {
      universe: req.query.universe,
      readiness: req.query.readiness,
      eligible: req.query.eligible === undefined ? undefined : req.query.eligible === "true"
    };
    res.json({ success: true, data: capabilityRegistry.listCapabilities(filters) });
  } catch (error) { next(error); }
};

exports.summary = async (_req, res, next) => {
  try { res.json({ success: true, data: capabilityRegistry.getRegistrySummary() }); }
  catch (error) { next(error); }
};

exports.match = async (req, res, next) => {
  try {
    const data = revenueOrchestrator.matchDemand(req.body, { minimumScore: req.body.minimumScore });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};
