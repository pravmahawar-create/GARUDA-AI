const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const MANIFEST_PATH = path.join(__dirname, "..", "..", "data", "boilerplate-store-manifest.json");
const ZIP_PATH = path.join(__dirname, "..", "..", "public", "downloads", "garuda-sovereign-ai-starter.zip");

/**
 * GET /api/boilerplate/info
 * Returns distribution metadata, pricing, SHA-256 integrity, and file counts.
 */
router.get("/info", (req, res) => {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      // Auto-generate if manifest does not exist
      const { packageBoilerplate } = require("../../scripts/package-boilerplate");
      packageBoilerplate();
    }

    const manifestData = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    return res.json({
      success: true,
      data: manifestData
    });
  } catch (err) {
    console.error("[Boilerplate Route Error]:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/boilerplate/download
 * Serves verified distribution zip archive directly to client.
 */
router.get("/download", (req, res) => {
  try {
    if (!fs.existsSync(ZIP_PATH)) {
      const { packageBoilerplate } = require("../../scripts/package-boilerplate");
      packageBoilerplate();
    }

    res.setHeader("Content-Disposition", 'attachment; filename="garuda-sovereign-ai-starter.zip"');
    res.setHeader("Content-Type", "application/zip");
    return res.sendFile(ZIP_PATH);
  } catch (err) {
    console.error("[Boilerplate Download Error]:", err.message);
    return res.status(500).json({ success: false, error: "Download packaging failed" });
  }
});

/**
 * POST /api/boilerplate/checkout
 * Generates an escrow order or payment gateway intent for the starter kit.
 */
router.post("/checkout", async (req, res) => {
  try {
    const { license = "standard", customerEmail, customerPhone } = req.body || {};
    const isExtended = license === "extended";
    const amountInr = isExtended ? 7999 : 3999;
    const amountUsd = isExtended ? 99 : 49;

    const paymentUrl = `https://razorpay.me/@garudaosincompany?amount=${amountInr}`;

    return res.json({
      success: true,
      license,
      amountInr,
      amountUsd,
      paymentUrl,
      whatsappFounderDirect: "+919098750362",
      message: `Initiate ${license.toUpperCase()} License for GARUDA Sovereign AI Starter Kit (₹${amountInr} / $${amountUsd})`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
