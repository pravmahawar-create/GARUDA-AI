const razorpayPaymentLinkService = require("../services/razorpayPaymentLinkService");

function error(res, err) {
  return res.status(err.statusCode || 500).json({ success: false, message: err.message || "Payment link request failed" });
}

exports.config = async (_req, res) => {
  try {
    return res.json({ success: true, data: razorpayPaymentLinkService.getProviderConfig() });
  } catch (err) {
    return error(res, err);
  }
};

exports.generate = async (req, res) => {
  try {
    const founderApproved = req.get("x-garuda-founder-approved") === "true" || req.body?.founderApproved === true;
    if (!founderApproved) {
      throw Object.assign(new Error("Founder approval is required to create a payment link"), { statusCode: 403 });
    }
    const data = await razorpayPaymentLinkService.generatePaymentLink(req.body || {}, {
      founderApproved
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return error(res, err);
  }
};