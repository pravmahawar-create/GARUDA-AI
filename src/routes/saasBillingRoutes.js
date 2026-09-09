const express = require("express");
const saasBillingService = require("../services/saasBillingService");
const tenantApiKeyService = require("../services/tenantApiKeyService");

const router = express.Router();

function getTenantId(req) {
  return (
    req.garudaContext?.tenantId ||
    req.get("x-garuda-tenant-id") ||
    req.query.tenantId ||
    "tenant_founder_core"
  );
}

// GET /api/billing/plans - Plan catalog
router.get("/plans", (_req, res) => {
  try {
    const plans = saasBillingService.getPlanCatalog();
    return res.json({ success: true, data: plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/billing/subscription - Current active subscription
router.get("/subscription", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const subscription = await saasBillingService.getSubscription(tenantId);
    return res.json({ success: true, data: subscription });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/billing/usage - Current monthly usage & limits
router.get("/usage", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const usage = await saasBillingService.getUsage(tenantId);
    return res.json({ success: true, data: usage });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/billing/subscribe - Prepare order for plan upgrade
router.post("/subscribe", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { plan, interval, currency } = req.body || {};
    if (!plan) {
      return res.status(400).json({ success: false, message: "plan is required" });
    }

    const order = await saasBillingService.createSubscriptionOrder({
      tenantId,
      plan,
      interval,
      currency
    });
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/billing/activate - Activate subscription after payment verification
router.post("/activate", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { plan, interval, paymentId, orderId, provider } = req.body || {};
    if (!plan) {
      return res.status(400).json({ success: false, message: "plan is required" });
    }

    const result = await saasBillingService.activateSubscription({
      tenantId,
      plan,
      interval,
      paymentId,
      orderId,
      provider
    });
    return res.json({ success: true, data: result.subscription });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/billing/api-keys - List tenant API keys
router.get("/api-keys", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const keys = await tenantApiKeyService.listTenantApiKeys(tenantId);
    return res.json({ success: true, data: keys });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/billing/api-keys - Create a new tenant API key
router.post("/api-keys", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { name, scopes, rateLimitPerMinute } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }
    const createdByUserId = req.garudaContext?.userId || "user_core_admin";

    const key = await tenantApiKeyService.generateApiKey(
      tenantId,
      name,
      createdByUserId,
      { scopes, rateLimitPerMinute }
    );
    return res.status(201).json({ success: true, data: key });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/billing/api-keys/:id - Revoke an API key
router.delete("/api-keys/:id", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const result = await tenantApiKeyService.revokeApiKey(req.params.id, tenantId);
    if (!result || !result.success) {
      return res.status(404).json({ success: false, message: "API key not found or not belonging to tenant" });
    }
    return res.json({ success: true, message: "API key revoked successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
