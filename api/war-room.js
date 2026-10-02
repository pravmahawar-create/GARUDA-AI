/**
 * 🦅 GARUDA OS — VERCEL SERVERLESS WAR ROOM & COMMERCIAL API
 * Primary endpoint for Constituency Intelligence, Rapid Response Engine,
 * Commercial Packages, Order Creation, and Payment Activation on Vercel.
 */

const { constituencyIntelligenceService } = require("../src/services/constituencyIntelligenceService");
const { constituencyCommercialService } = require("../src/services/constituencyCommercialService");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Parse path & parameters
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathParts = url.pathname.replace(/^\/api\/war-room\/?/, "").split("/").filter(Boolean);
  const action = pathParts[0] || (req.query && req.query.action) || "resolve";

  try {
    // 1. GET /api/war-room/resolve?q=...
    if (req.method === "GET" && (action === "resolve" || !action)) {
      const query = req.query.q || req.query.query || "Thane 148";
      const data = constituencyIntelligenceService.resolveConstituency(query);
      return res.status(200).json({ success: true, data });
    }

    // 2. POST /api/war-room/brief
    if (req.method === "POST" && action === "brief") {
      const brief = constituencyIntelligenceService.generateConstituencyBrief(req.body || {});
      return res.status(200).json({ success: true, data: brief });
    }

    // 3. POST /api/war-room/rebuttal
    if (req.method === "POST" && action === "rebuttal") {
      const { issueId, constituencyData } = req.body || {};
      const rebuttal = constituencyIntelligenceService.generateRapidRebuttalPackage(issueId, constituencyData);
      return res.status(200).json({ success: true, data: rebuttal });
    }

    // 4. GET /api/war-room/plans
    if (req.method === "GET" && action === "plans") {
      const currency = req.query.currency || "INR";
      const plansData = constituencyCommercialService.getPlans(currency);
      return res.status(200).json(plansData);
    }

    // 5. GET /api/war-room/exclusivity
    if (req.method === "GET" && action === "exclusivity") {
      const constituency = req.query.constituency || req.query.c || "";
      const result = constituencyCommercialService.checkExclusivity(constituency);
      return res.status(200).json({ success: true, data: result });
    }

    // 6. POST /api/war-room/order
    if (req.method === "POST" && action === "order") {
      const { constituency, planId, currency, billingCycle, customerDetails } = req.body || {};
      const order = constituencyCommercialService.createOrder({
        constituency,
        planId,
        currency,
        billingCycle,
        customerDetails
      });
      return res.status(201).json({ success: true, data: order });
    }

    // 7. POST /api/war-room/verify-payment
    if (req.method === "POST" && action === "verify-payment") {
      const { orderId, paymentId, signature, provider, testMode } = req.body || {};
      const result = constituencyCommercialService.verifyAndActivatePayment({
        orderId,
        paymentId,
        signature,
        provider,
        testMode
      });
      return res.status(200).json(result);
    }

    // 8. GET /api/war-room/order/:id
    if (req.method === "GET" && action === "order") {
      const orderId = pathParts[1] || req.query.id;
      const order = constituencyCommercialService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      return res.status(200).json({ success: true, data: order });
    }

    // 9. GET /api/war-room/invoice/:id
    if (req.method === "GET" && action === "invoice") {
      const orderId = pathParts[1] || req.query.id;
      const invoice = constituencyCommercialService.generateInvoice(orderId);
      return res.status(200).json({ success: true, data: invoice });
    }

    return res.status(404).json({ success: false, message: `Unknown War Room action: ${action}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
