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
 * Generates payment intent for LemonSqueezy / Gumroad / Razorpay / GitHub + Dost referral
 */
router.post("/checkout", async (req, res) => {
  try {
    const { license = "standard", customerEmail, customerPhone, gateway, ref } = req.body || {};
    const isExtended = license === "extended";
    const amountInr = isExtended ? 7999 : 3999;
    const amountUsd = isExtended ? 99 : 49;
    const slug = isExtended ? "garuda-sovereign-agency" : "garuda-sovereign-starter";

    // Multi-gateway URLs — all point to same product, different global rails
    const razorpayUrl = `https://razorpay.me/@garudaosincompany?amount=${amountInr}`;
    const lemonSqueezyUrl = process.env.LEMONSQUEEZY_STORE_URL
      ? `${process.env.LEMONSQUEEZY_STORE_URL}/${slug}`
      : `https://garudaos.lemonsqueezy.com/checkout/buy/${isExtended ? "agency-extended" : "starter-standard"}`;
    const gumroadUrl = `https://gumroad.com/l/${slug}`;
    const githubMarketplaceUrl = `https://github.com/marketplace?type=apps&query=garuda+${slug}`;

    // Dost referral passthrough
    const dostRef = ref ? String(ref).slice(0, 40) : null;
    const selectedGateway = String(gateway || "razorpay").toLowerCase();
    let paymentUrl = razorpayUrl;
    if (selectedGateway === "lemonsqueezy" || selectedGateway === "lemon") paymentUrl = lemonSqueezyUrl;
    else if (selectedGateway === "gumroad") paymentUrl = gumroadUrl;
    else if (selectedGateway === "github") paymentUrl = githubMarketplaceUrl;

    // Append Dost ref for attribution (all gateways support ?ref=)
    const withRef = (url) => dostRef ? `${url}${url.includes("?") ? "&" : "?"}ref=${encodeURIComponent(dostRef)}` : url;

    return res.json({
      success: true,
      license,
      amountInr,
      amountUsd,
      paymentUrl: withRef(paymentUrl),
      gateways: {
        razorpay: withRef(razorpayUrl),
        lemonsqueezy: withRef(lemonSqueezyUrl),
        gumroad: withRef(gumroadUrl),
        github: githubMarketplaceUrl,
      },
      dostRef,
      supportEmail: "praveen@garudaos.in",
      supportPortal: "https://www.garudaos.in/chat",
      message: `Initiate ${license.toUpperCase()} License for GARUDA Sovereign AI Starter Kit (₹${amountInr} / $${amountUsd}) via ${selectedGateway}`,
      sha256: req.manifestSha256 || undefined,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/boilerplate/marketplaces
 * Returns all distribution channels for frontend store
 */
router.get("/marketplaces", (req, res) => {
  const ref = req.query.ref ? String(req.query.ref).slice(0, 40) : null;
  const withRef = (u) => ref ? `${u}${u.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}` : u;
  return res.json({
    success: true,
    marketplaces: [
      { id: "razorpay", name: "Razorpay (India)", url: withRef("https://razorpay.me/@garudaosincompany"), badge: "INR Instant", primary: true },
      { id: "lemonsqueezy", name: "LemonSqueezy (Global Cards + PayPal)", url: withRef(process.env.LEMONSQUEEZY_STORE_URL || "https://garudaos.lemonsqueezy.com"), badge: "USD/EUR Global", primary: true },
      { id: "gumroad", name: "Gumroad", url: withRef("https://gumroad.com/l/garuda-sovereign-starter"), badge: "Creator Economy" },
      { id: "github", name: "GitHub Marketplace", url: "https://github.com/marketplace/search?query=garuda", badge: "Developer" },
      { id: "dost", name: "GARUDA Dost Rozgar", url: withRef("https://www.garudaos.in/dost"), badge: "Refer & Earn 30%" },
    ],
    ref,
  });
});

module.exports = router;
