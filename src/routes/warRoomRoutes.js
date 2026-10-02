/**
 * 🦅 GARUDA OS — CONSTITUENCY WAR ROOM & COMMERCIAL ROUTES
 * Express router for Constituency Intelligence, Rapid Response Engine,
 * Dynamic Commercial Packages, Order Lifecycle, and Payment Activation.
 */

const express = require("express");
const router = express.Router();
const { constituencyIntelligenceService } = require("../services/constituencyIntelligenceService");
const { constituencyCommercialService } = require("../services/constituencyCommercialService");

// 1. Resolve Constituency Intelligence
router.get("/resolve", (req, res) => {
  try {
    const query = req.query.q || req.query.query || "Thane 148";
    const data = constituencyIntelligenceService.resolveConstituency(query);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// 2. Generate 12-Section AI Constituency Brief
router.post("/brief", (req, res) => {
  try {
    const constituencyData = req.body || {};
    const brief = constituencyIntelligenceService.generateConstituencyBrief(constituencyData);
    return res.json({ success: true, data: brief });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Generate 15-Minute Rebuttal Package
router.post("/rebuttal", (req, res) => {
  try {
    const { issueId, constituencyData } = req.body || {};
    const rebuttal = constituencyIntelligenceService.generateRapidRebuttalPackage(issueId, constituencyData);
    return res.json({ success: true, data: rebuttal });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Commercial Plans Catalog
router.get("/plans", (req, res) => {
  try {
    const currency = req.query.currency || "INR";
    const plansData = constituencyCommercialService.getPlans(currency);
    return res.json(plansData);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Check Territorial Exclusivity
router.get("/exclusivity", (req, res) => {
  try {
    const constituency = req.query.constituency || req.query.c || "";
    const result = constituencyCommercialService.checkExclusivity(constituency);
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// 6. Create Order
router.post("/order", (req, res) => {
  try {
    const { constituency, planId, currency, billingCycle, customerDetails } = req.body || {};
    const order = constituencyCommercialService.createOrder({
      constituency,
      planId,
      currency,
      billingCycle,
      customerDetails
    });
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// 7. Verify & Activate Payment
router.post("/verify-payment", (req, res) => {
  try {
    const { orderId, paymentId, signature, provider, testMode } = req.body || {};
    const result = constituencyCommercialService.verifyAndActivatePayment({
      orderId,
      paymentId,
      signature,
      provider,
      testMode
    });
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// 8. Get Order Status
router.get("/order/:id", (req, res) => {
  try {
    const orderId = req.params.id;
    const order = constituencyCommercialService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 9. Generate Invoice
router.get("/invoice/:id", (req, res) => {
  try {
    const orderId = req.params.id;
    const invoice = constituencyCommercialService.generateInvoice(orderId);
    return res.json({ success: true, data: invoice });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
