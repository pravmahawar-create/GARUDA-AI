const discoveryService = require("../services/opportunityDiscoveryService");

function sendError(res, error, fallback) { return res.status(error.statusCode || 500).json({ success: false, message: error.message || fallback }); }
exports.list = async (req, res) => { try { return res.json({ success: true, data: await discoveryService.listCandidates(req.query || {}) }); } catch (error) { return sendError(res, error, "Failed to list discovery candidates"); } };
exports.run = async (_req, res) => { try { return res.json({ success: true, data: await discoveryService.runDiscoveryCycle() }); } catch (error) { return sendError(res, error, "Failed to run discovery cycle"); } };
