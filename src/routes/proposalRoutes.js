const express = require("express");
const router = express.Router();
const clientProposalService = require("../services/clientProposalService");

// 1. Create Proposal
router.post("/", async (req, res) => {
  try {
    const founderApproved = req.get("x-garuda-founder-approved") === "true" || req.body?.founderApproved === true;
    const proposal = await clientProposalService.createProposal(req.body || {}, { founderApproved });
    return res.status(201).json({ success: true, proposal, data: proposal });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 2. Funnel Metrics
router.get("/metrics/funnel", (req, res) => {
  const metrics = clientProposalService.getCommercialFunnelMetrics();
  return res.json({ success: true, metrics, data: metrics });
});

// 3. Get Proposal by ID (Supports sanitized public view)
router.get("/:proposalId", async (req, res) => {
  try {
    const isPublicView = req.query.public === "true" || !req.get("x-garuda-founder-approved");
    const proposal = await clientProposalService.getProposal(req.params.proposalId, { isPublicView });
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found" });
    }
    return res.json({ success: true, proposal, data: proposal });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 4. Client Accepts Proposal
router.post("/:proposalId/accept", async (req, res) => {
  try {
    const clientSignature = {
      name: req.body?.name,
      email: req.body?.email,
      ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1"
    };
    const proposal = await clientProposalService.acceptProposal(req.params.proposalId, clientSignature);
    return res.json({ success: true, proposal, data: proposal });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 5. Deposit Payment Verification (Enforces Anti-Fabrication Law)
router.post("/:proposalId/verify-deposit", async (req, res) => {
  try {
    const result = await clientProposalService.recordDepositPayment(req.params.proposalId, req.body || {});
    return res.status(result.verified ? 200 : 422).json({ ...result, data: result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 6. Complete Milestone Delivery
router.post("/:proposalId/delivery", async (req, res) => {
  try {
    const proposal = await clientProposalService.completeDelivery(req.params.proposalId, req.body || {});
    return res.json({ success: true, proposal });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 7. Client Final Acceptance Sign-Off
router.post("/:proposalId/final-accept", async (req, res) => {
  try {
    const proposal = await clientProposalService.recordFinalAcceptance(req.params.proposalId, req.body || {});
    return res.json({ success: true, proposal });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// 8. Final Payment Settlement
router.post("/:proposalId/final-payment", async (req, res) => {
  try {
    const proposal = await clientProposalService.recordFinalPayment(req.params.proposalId, req.body || {});
    return res.json({ success: true, proposal });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
