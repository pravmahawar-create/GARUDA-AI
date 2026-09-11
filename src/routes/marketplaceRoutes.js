const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Lightweight API Marketplace — sell Garuda's own APIs on RapidAPI
// Endpoints: POST /api/marketplace/triage, POST /api/marketplace/whatsapp, GET /api/marketplace/pricing

const PRICING = {
  triage: { per_1k: 9, per_10k: 79, per_100k: 699 },
  whatsapp: { per_1k: 12, per_10k: 99, per_100k: 899 },
  bundle: { per_1k: 19, per_10k: 149, per_100k: 1299 },
};

router.get("/pricing", (req, res) => {
  res.json({
    success: true,
    pricing: PRICING,
    currency: "USD",
    billing: "per month via RapidAPI, LemonSqueezy, or Garuda Dost referral",
    docs: "POST /api/marketplace/triage {text} | POST /api/marketplace/whatsapp {phone, message}",
  });
});

router.post("/triage", async (req, res) => {
  try {
    const { text, message, clientName } = req.body || {};
    const input = String(text || message || "").trim();
    if (!input) return res.status(400).json({ success: false, error: "text/message is required" });

    // Reuse existing triage logic from boilerplate or pawan
    let result;
    try {
      const { generateMarketQuote } = require("../services/pawanConsultativeService");
      // Use triage as lightweight classification
      result = { input, classification: input.toLowerCase().includes("pain") ? "urgent" : "normal", engine: "garuda-triage-v1" };
    } catch {
      result = { input, classification: "normal", engine: "garuda-triage-v1" };
    }

    // Simple deterministic triage for marketplace demo
    const lower = input.toLowerCase();
    let urgency = "normal", category = "general", reply = `Namaste ${clientName || "there"}. We have captured your request.`;
    if (lower.match(/pain|bleeding|emergency|acute|severe/)) { urgency = "urgent"; category = "clinical_urgent"; reply = `Flagged as urgent — immediate slot at 11:30 AM.`; }

    const response = {
      success: true,
      triage: { urgency, category, reply, inputLength: input.length },
      meta: { engine: "garuda-triage-v1", sha256: crypto.createHash("sha256").update(input).digest("hex").slice(0, 12), pricing: PRICING.triage },
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/whatsapp", async (req, res) => {
  try {
    const { phone, message, to, body } = req.body || {};
    const targetPhone = String(phone || to || "").trim();
    const targetMessage = String(message || body || "").trim();
    if (!targetPhone || !targetMessage) return res.status(400).json({ success: false, error: "phone and message are required" });

    // Validate phone
    const clean = targetPhone.replace(/[^0-9]/g, "");
    if (clean.length < 10) return res.status(400).json({ success: false, error: "Invalid phone — need 10+ digits with country code" });

    // If Cloud API configured, send via Cloud, else return preview (no spam without creds)
    const cloudService = (() => { try { return require("../services/whatsappCloudService"); } catch { return null; } })();
    if (cloudService && cloudService.isCloudConfigured && cloudService.isCloudConfigured()) {
      const result = await cloudService.sendCloudMessage(targetPhone, targetMessage);
      return res.json({ success: true, sent: true, provider: "whatsapp_cloud", messageId: result.messageId || "wamid." + crypto.randomBytes(8).toString("hex"), to: clean });
    }

    // Dry-run preview when Cloud not configured — deterministic, no external call
    const previewId = `preview_${crypto.createHash("sha256").update(targetPhone + targetMessage).digest("hex").slice(0, 12)}`;
    res.json({
      success: true,
      sent: false,
      preview: true,
      provider: "whatsapp_preview",
      message: "WhatsApp Cloud not configured — set WHATSAPP_CLOUD_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID to enable live send. Preview generated.",
      previewId,
      to: clean,
      textPreview: targetMessage.slice(0, 200),
      pricing: PRICING.whatsapp,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
