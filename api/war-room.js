/**
 * 🦅 GARUDA OS — VERCEL SERVERLESS WAR ROOM & COMMERCIAL API
 * Primary endpoint for Constituency Intelligence, Rapid Response Engine,
 * Commercial Packages, Order Creation, and Payment Activation on Vercel.
 */

const { constituencyIntelligenceService } = require("../src/services/constituencyIntelligenceService");
const { constituencyCommercialService } = require("../src/services/constituencyCommercialService");
const { cadreDeviceTelemetryService } = require("../src/services/cadreDeviceTelemetryService");
const metaDirectPushService = require("../src/services/metaDirectPushService");

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

    // 2. POST /api/war-room/brief or /api/war-room/dossier/pdf
    if (req.method === "POST" && (action === "brief" || action === "dossier")) {
      const crypto = require("crypto");
      const brief = constituencyIntelligenceService.generateConstituencyBrief(req.body || {});
      const safeName = (req.body?.constituencyName || req.body?.constituencyId || req.body?.name || "CONSTITUENCY").replace(/[^a-zA-Z0-9]/g, "_");
      const hash = crypto.createHash("sha256").update(JSON.stringify(brief)).digest("hex");
      return res.status(200).json({
        success: true,
        data: {
          fileName: `GARUDA_DOSSIER_${safeName}.pdf`,
          sha256Hash: hash,
          brief,
          url: "#"
        }
      });
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

    // 10. Meta Integration Actions: /api/war-room/meta/:subAction
    if (action === "meta") {
      const subAction = pathParts[1] || req.query.subAction || "status";

      if (req.method === "GET" && subAction === "status") {
        const status = await metaDirectPushService.getConnectionStatus();
        return res.status(200).json({ success: true, data: status });
      }

      if (req.method === "GET" && subAction === "discover") {
        const result = await metaDirectPushService.discoverPages({ actor: req.query.actor });
        return res.status(200).json(result);
      }

      if (req.method === "POST" && subAction === "connect") {
        const result = await metaDirectPushService.connectPage(req.body);
        return res.status(200).json(result);
      }

      if (req.method === "POST" && subAction === "disconnect") {
        const result = await metaDirectPushService.disconnectPage(req.body);
        return res.status(200).json(result);
      }

      if (req.method === "POST" && subAction === "publish") {
        const result = await metaDirectPushService.publishControlledContent(req.body);
        const code = result.success ? 200 : (result.errorClassification === "HUMAN_APPROVAL_REQUIRED" ? 403 : 400);
        return res.status(code).json(result);
      }

      if (req.method === "GET" && subAction === "analytics") {
        const result = await metaDirectPushService.getPageAndAccountAnalytics({ actor: req.query.actor });
        return res.status(200).json(result);
      }

      if (req.method === "GET" && subAction === "audit") {
        const limit = parseInt(req.query.limit || "50", 10);
        const trail = metaDirectPushService.getAuditTrail({ limit });
        return res.status(200).json({ success: true, count: trail.length, data: trail });
      }

      return res.status(404).json({ success: false, message: `Unknown Meta sub-action: ${subAction}` });
    }

    // 11. Cadre Actions: /api/war-room/cadre/:subAction
    if (action === "cadre") {
      const subAction = pathParts[1] || req.query.subAction || "devices";

      if (req.method === "POST" && subAction === "heartbeat") {
        const authHeader = req.headers["authorization"] || req.headers["x-garuda-device-token"] || "";
        const deviceToken = authHeader.replace(/^Bearer\s+/i, "") || req.body?.deviceToken;
        const { deviceId, boothId, timestamp, appVersion, battery, networkType, signalStrength } = req.body || {};

        const result = cadreDeviceTelemetryService.ingestHeartbeat({
          deviceId,
          boothId,
          timestamp,
          appVersion,
          battery,
          networkType,
          signalStrength,
          deviceToken
        });

        const statusCode = result.success ? 200 : (
          result.code === "UNAUTHORIZED_DEVICE" || result.code === "DEVICE_REVOKED" || result.code === "INVALID_CREDENTIALS" ? 401
          : result.code === "BOOTH_MISMATCH" ? 403
          : 400
        );
        return res.status(statusCode).json(result);
      }

      if (req.method === "GET" && subAction === "device") {
        const boothId = pathParts[2] || req.query.boothId;
        const result = cadreDeviceTelemetryService.getDeviceForBooth(boothId);
        return res.status(200).json({ success: true, data: result });
      }

      if (req.method === "GET" && subAction === "devices") {
        const devices = cadreDeviceTelemetryService.getAllRegisteredDevicesSummary();
        return res.status(200).json({ success: true, totalRegistered: devices.length, data: devices });
      }

      if (req.method === "POST" && subAction === "register") {
        const { deviceId, boothId, areaId, agentId, agentName, deviceToken, appVersion } = req.body || {};
        const result = cadreDeviceTelemetryService.registerDevice({
          deviceId,
          boothId,
          areaId,
          agentId,
          agentName,
          deviceToken,
          appVersion
        });
        return res.status(201).json({ success: true, data: result });
      }

      if (req.method === "POST" && subAction === "verify") {
        const { deviceId, deviceToken } = req.body || {};
        const result = cadreDeviceTelemetryService.verifyDevice({ deviceId, deviceToken });
        const code = result.verified ? 200 : (result.code === "DEVICE_NOT_FOUND" ? 404 : 401);
        return res.status(code).json(result);
      }

      if (req.method === "GET" && subAction === "info") {
        const devId = pathParts[2] || req.query.deviceId;
        const info = cadreDeviceTelemetryService.getDeviceInfo(devId);
        if (!info) return res.status(404).json({ success: false, message: "Device not found." });
        return res.status(200).json({ success: true, data: info });
      }

      return res.status(404).json({ success: false, message: `Unknown Cadre sub-action: ${subAction}` });
    }

    // 12. Booth Registry Action: /api/war-room/booth/registry
    if (action === "booth") {
      const constituencyId = req.query.c || req.query.constituency || "thane-148";
      const data = cadreDeviceTelemetryService.getBoothRegistryMetadata(constituencyId);
      return res.status(200).json(data);
    }

    return res.status(404).json({ success: false, message: `Unknown War Room action: ${action}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
