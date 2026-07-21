const discoveryService = require("../services/opportunityDiscoveryService");
const executionMissionService = require("../services/revenueExecutionMissionService");

function sendError(res, error, fallback) { return res.status(error.statusCode || 500).json({ success: false, message: error.message || fallback }); }
exports.list = async (req, res) => { try { return res.json({ success: true, data: await discoveryService.listCandidates(req.query || {}) }); } catch (error) { return sendError(res, error, "Failed to list discovery candidates"); } };
exports.run = async (_req, res) => { try { return res.json({ success: true, data: await discoveryService.runDiscoveryCycle() }); } catch (error) { return sendError(res, error, "Failed to run discovery cycle"); } };
exports.decide = async (req, res) => { try { return res.json({ success: true, data: await discoveryService.decideCandidate(req.params.id, req.body || {}, { founderApproved: req.get("x-garuda-founder-approved") }) }); } catch (error) { return sendError(res, error, "Failed to update candidate decision"); } };
exports.createExecutionMission = async (req, res) => { try { return res.status(201).json({ success: true, data: await executionMissionService.createFromApprovedCandidate(req.params.id, { founderApproved: req.get("x-garuda-founder-approved") }) }); } catch (error) { return sendError(res, error, "Failed to create execution mission"); } };
exports.listExecutionMissions = async (req, res) => { try { return res.json({ success: true, data: await executionMissionService.listMissions(req.query || {}) }); } catch (error) { return sendError(res, error, "Failed to list execution missions"); } };
