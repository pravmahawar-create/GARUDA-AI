/**
 * 🦅 GARUDA OS — MERCHANT OPERATIONS ROUTES (/api/merchant/*) (PHASE 11)
 * Connects Classic Operations Terminal (/merchant-classic) to shared Enterprise
 * engines with fail-closed Legal Eligibility, BSA Sec 63 Evidence & Permitted Attribution.
 */

const express = require("express");
const router = express.Router();
const merchantOpsController = require("../controllers/merchantOpsController");
const authContextService = require("../services/authContextService");

async function requireMerchantAuth(req, res, next) {
  try {
    let context = req.garudaContext;
    if (!context) {
      context = await authContextService.resolveRequestContext(req);
      req.garudaContext = context;
    }
    if (!context || context.actorType === "anonymous") {
      return res.status(401).json({
        success: false,
        error: "AUTHENTICATION_REQUIRED",
        message: "Verified tenant or founder credentials required."
      });
    }
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function requireFounderOnly(req, res, next) {
  try {
    let context = req.garudaContext;
    if (!context) {
      context = await authContextService.resolveRequestContext(req);
      req.garudaContext = context;
    }
    if (context && context.role === "platform_founder" && context.isFounderApproved === true) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: "FOUNDER_APPROVAL_REQUIRED",
      message: "Action strictly restricted to Platform Founder authorization."
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Isolated Operational Simulation Sandbox for Classic Merchant Terminal
router.get("/simulation/state", merchantOpsController.getSimState);
router.post("/simulation/reset", merchantOpsController.resetSimState);
router.post("/simulation/actions/:action", merchantOpsController.runSimAction);

// Authenticated Live Legal Eligibility & Configurable Tax Rules
router.get("/eligibility", requireMerchantAuth, merchantOpsController.listEligibility);
router.post("/eligibility", requireMerchantAuth, merchantOpsController.declareEligibility);
router.post("/eligibility/:merchantId/review", requireFounderOnly, merchantOpsController.reviewEligibility);
router.get("/tax-config", requireMerchantAuth, merchantOpsController.getTaxConfig);
router.post("/tax-config", requireMerchantAuth, merchantOpsController.setTaxConfig);

// Authenticated Eligibility-Gated Checkout Intents (Shared with Enterprise Orchestrator)
router.get("/checkout/intents", requireMerchantAuth, merchantOpsController.listCheckoutIntents);
router.post("/checkout/intents", requireMerchantAuth, merchantOpsController.createCheckoutIntent);

// Authenticated BSA Section 63 Evidence & Signatory Workflow
router.get("/evidence/cases", requireMerchantAuth, merchantOpsController.listEvidenceCases);
router.post("/evidence/cases", requireMerchantAuth, merchantOpsController.createEvidenceCase);
router.post("/evidence/cases/:caseId/records", requireMerchantAuth, merchantOpsController.ingestEvidenceRecord);
router.get("/evidence/cases/:caseId/verify", requireMerchantAuth, merchantOpsController.verifyEvidenceCase);
router.get("/evidence/cases/:caseId/export", requireMerchantAuth, merchantOpsController.exportEvidenceCase);
router.post("/evidence/cases/:caseId/part-a-sign", requireMerchantAuth, merchantOpsController.signEvidencePartA);
router.post("/evidence/cases/:caseId/part-b-sign", requireMerchantAuth, merchantOpsController.signEvidencePartB);

// Authenticated Permitted Growth & Consent Attribution
router.get("/campaigns", requireMerchantAuth, merchantOpsController.listCampaigns);
router.post("/campaigns", requireMerchantAuth, merchantOpsController.createCampaign);
router.post("/campaigns/:campaignId/events", requireMerchantAuth, merchantOpsController.recordCampaignEvent);

module.exports = router;
