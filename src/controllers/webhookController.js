const paymentWebhookService = require("../services/paymentWebhookService");

function sendError(res, error, fallback) {
  return res.status(error.statusCode || 400).json({
    success: false,
    message: error.message || fallback
  });
}

exports.receiveRazorpay = async (req, res) => {
  try {
    const rawBody = typeof req.body === "string" ? req.body : Buffer.from(req.body || "").toString("utf8");
    if (!rawBody) {
      return res.status(400).json({ success: false, message: "Raw request body is required" });
    }
    const result = await paymentWebhookService.processRazorpayWebhook(rawBody, req.headers || {});
    return res.json({ success: true, data: result });
  } catch (error) {
    return sendError(res, error, "Failed to process Razorpay webhook");
  }
};