const express = require("express");
const webhookController = require("../controllers/webhookController");

const router = express.Router();

// Raw body REQUIRED for Razorpay HMAC signature verification
router.post("/payment/razorpay", express.raw({ type: "application/json" }), webhookController.receiveRazorpay);

module.exports = router;