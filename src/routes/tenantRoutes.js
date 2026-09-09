const express = require("express");
const tenantMembershipService = require("../services/tenantMembershipService");
const saasBillingService = require("../services/saasBillingService");

const router = express.Router();

function getTenantId(req) {
  return (
    req.garudaContext?.tenantId ||
    req.get("x-garuda-tenant-id") ||
    req.query.tenantId ||
    "tenant_founder_core"
  );
}

// GET /api/tenants/current - Workspace summary and seat limits
router.get("/current", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const sub = await saasBillingService.getSubscription(tenantId);
    const planInfo = saasBillingService.getPlanDetails(sub.plan);
    const members = await tenantMembershipService.listTenantMembers(tenantId);

    return res.json({
      success: true,
      data: {
        tenantId,
        plan: sub.plan,
        subscriptionStatus: sub.status,
        maxSeats: planInfo.limits?.seats || 1,
        currentSeats: members.length,
        membersCount: members.length,
        features: planInfo.features
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tenants/members - List members of workspace
router.get("/members", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const members = await tenantMembershipService.listTenantMembers(tenantId);
    return res.json({ success: true, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tenants/invites - Invite a new team member
router.post("/invites", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { email, role } = req.body || {};
    const invitedByUserId = req.garudaContext?.userId || "user_core_admin";

    const invite = await tenantMembershipService.inviteTenantMember({
      tenantId,
      email,
      role,
      invitedByUserId
    });
    return res.status(201).json({ success: true, data: invite });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message,
      code: error.code || null
    });
  }
});

// POST /api/tenants/invites/:inviteId/accept - Accept invitation
router.post("/invites/:inviteId/accept", async (req, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.body?.userId || req.garudaContext?.userId || `user_${Date.now()}`;

    const accepted = await tenantMembershipService.acceptInvitation(inviteId, userId);
    return res.json({ success: true, data: accepted });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
});

// DELETE /api/tenants/members/:membershipId - Revoke member
router.delete("/members/:membershipId", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { membershipId } = req.params;
    const requestedByUserId = req.garudaContext?.userId || "user_core_admin";

    const result = await tenantMembershipService.revokeTenantMember(
      tenantId,
      membershipId,
      requestedByUserId
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message });
  }
});

module.exports = router;
