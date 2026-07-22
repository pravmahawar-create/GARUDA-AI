const service = require("../services/affiliateConversionPilotService");

function error(res, err) { return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Affiliate pilot request failed" }); }
function requireFounder(req) {
  if (req.get("x-garuda-founder-approved") !== "true") throw Object.assign(new Error("Founder approval is required for this exact affiliate action"), { statusCode: 403 });
}
function mutation(handler, statusCode = 200) {
  return async (req, res) => { try { requireFounder(req); return res.status(statusCode).json({ success: true, data: await handler(req) }); } catch (err) { return error(res, err); } };
}

exports.list = async (_req, res) => { try { return res.json({ success: true, data: await service.listCases() }); } catch (err) { return error(res, err); } };
exports.get = async (req, res) => { try { return res.json({ success: true, data: await service.getCase(req.params.id) }); } catch (err) { return error(res, err); } };
exports.events = async (req, res) => { try { return res.json({ success: true, data: await service.listEvents(req.params.id) }); } catch (err) { return error(res, err); } };
exports.status = async (_req, res) => { try { return res.json({ success: true, data: await service.status() }); } catch (err) { return error(res, err); } };
exports.createOffer = mutation((req) => service.createOffer(req.body || {}), 201);
exports.draftCampaign = mutation((req) => service.draftCampaign(req.params.id, req.body || {}), 201);
exports.approveHandoff = mutation((req) => service.approveHandoff(req.params.id, req.body || {}));
exports.recordPublication = mutation((req) => service.recordPublication(req.params.id, req.body || {}));
exports.recordConversion = mutation((req) => service.recordConversion(req.params.id, req.body || {}));
exports.verifyCommission = mutation((req) => service.verifyCommission(req.params.id, req.body || {}));
exports.recordPayment = mutation((req) => service.recordPayment(req.params.id, req.body || {}));
