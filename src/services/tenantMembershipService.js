const crypto = require("crypto");
const mongoose = require("mongoose");
const { TenantMembership, VALID_ROLES } = require("../models/TenantMembership");
const saasBillingService = require("./saasBillingService");

const memoryMembershipStore = new Map();

function isMongoConnected() {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}

/**
 * List all members and pending invites for a tenant.
 */
async function listTenantMembers(tenantId) {
  if (!tenantId) throw new Error("tenantId is required");

  const results = [];
  const seenIds = new Set();

  if (isMongoConnected()) {
    try {
      const docs = await TenantMembership.find({
        tenantId,
        status: { $in: ["active", "invited"] }
      }).sort({ createdAt: 1 });

      for (const doc of docs) {
        const item = doc.toJSON ? doc.toJSON() : doc;
        seenIds.add(item.membershipId);
        results.push(item);
      }
    } catch {
      // Fall through to memory
    }
  }

  for (const m of memoryMembershipStore.values()) {
    if (m.tenantId === tenantId && ["active", "invited"].includes(m.status) && !seenIds.has(m.membershipId)) {
      seenIds.add(m.membershipId);
      results.push(m);
    }
  }

  return results;
}

/**
 * Invite a new member to the tenant.
 * Enforces subscription seat limits!
 */
async function inviteTenantMember({ tenantId, email, role = "tenant_member", invitedByUserId = "founder" }) {
  if (!tenantId) throw new Error("tenantId is required");
  if (!email || !String(email).includes("@")) throw new Error("A valid email is required to invite a member");

  const normalizedRole = String(role).trim().toLowerCase();
  const assignableRoles = ["tenant_admin", "tenant_member", "tenant_viewer"];
  if (!assignableRoles.includes(normalizedRole)) {
    throw new Error(`Invalid role. Assignable roles are: ${assignableRoles.join(", ")}`);
  }

  // Check seat limits against current subscription
  const currentSub = await saasBillingService.getSubscription(tenantId);
  const planInfo = saasBillingService.getPlanDetails(currentSub.plan);
  const maxSeats = planInfo.limits?.seats || 1;

  const currentMembers = await listTenantMembers(tenantId);
  if (currentMembers.length >= maxSeats) {
    const err = new Error(
      `Seat limit reached for ${planInfo.name} (${maxSeats} max seats). Upgrade your subscription plan to invite more team members.`
    );
    err.statusCode = 403;
    err.code = "SEAT_LIMIT_REACHED";
    err.currentSeats = currentMembers.length;
    err.maxSeats = maxSeats;
    throw err;
  }

  // Check if member already exists
  const existing = currentMembers.find(
    (m) => String(m.userId).toLowerCase() === String(email).toLowerCase() || m.email === email
  );
  if (existing) {
    const err = new Error("User or email is already a member or invited to this workspace");
    err.statusCode = 409;
    throw err;
  }

  const membershipId = `mship_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const inviteToken = crypto.randomBytes(16).toString("hex");

  const membershipDoc = {
    id: membershipId,
    membershipId,
    tenantId,
    userId: email.toLowerCase(),
    email: email.toLowerCase(),
    role: normalizedRole,
    status: "invited",
    inviteToken,
    invitedBy: invitedByUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  memoryMembershipStore.set(membershipId, membershipDoc);

  if (isMongoConnected()) {
    try {
      await TenantMembership.create({
        membershipId,
        tenantId,
        userId: email.toLowerCase(),
        role: normalizedRole,
        status: "invited"
      });
    } catch {
      // Memory fallback
    }
  }

  return {
    success: true,
    membershipId,
    tenantId,
    email: email.toLowerCase(),
    role: normalizedRole,
    status: "invited",
    inviteToken,
    inviteUrl: `https://www.garudaos.in/accept-invite?token=${inviteToken}&tenant=${tenantId}`
  };
}

/**
 * Accept an invitation using the membership ID or token.
 */
async function acceptInvitation(membershipIdOrToken, acceptingUserId) {
  if (!membershipIdOrToken) throw new Error("Invitation token or membershipId is required");
  if (!acceptingUserId) throw new Error("acceptingUserId is required");

  let found = null;
  for (const m of memoryMembershipStore.values()) {
    if ((m.membershipId === membershipIdOrToken || m.inviteToken === membershipIdOrToken) && m.status === "invited") {
      found = m;
      break;
    }
  }

  if (!found && isMongoConnected()) {
    try {
      const doc = await TenantMembership.findOne({
        membershipId: membershipIdOrToken,
        status: "invited"
      });
      if (doc) found = doc.toJSON ? doc.toJSON() : doc;
    } catch (err) { console.warn("[auto-recovery] suppressed error in tenantMembershipService.js:", String(err.message).slice(0,80)); }
  }

  if (!found) {
    const err = new Error("Valid pending invitation not found");
    err.statusCode = 404;
    throw err;
  }

  found.status = "active";
  found.userId = acceptingUserId;
  found.updatedAt = new Date();
  memoryMembershipStore.set(found.membershipId, found);

  if (isMongoConnected()) {
    try {
      await TenantMembership.updateOne(
        { membershipId: found.membershipId },
        { $set: { status: "active", userId: acceptingUserId } }
      );
    } catch (err) { console.warn("[auto-recovery] suppressed error in tenantMembershipService.js:", String(err.message).slice(0,80)); }
  }

  return {
    success: true,
    membershipId: found.membershipId,
    tenantId: found.tenantId,
    userId: acceptingUserId,
    role: found.role,
    status: "active"
  };
}

/**
 * Revoke or remove a team member.
 */
async function revokeTenantMember(tenantId, membershipId, requestedByUserId) {
  if (!tenantId || !membershipId) {
    throw new Error("tenantId and membershipId are required");
  }

  let found = memoryMembershipStore.get(membershipId);
  if (!found && isMongoConnected()) {
    try {
      const doc = await TenantMembership.findOne({ tenantId, membershipId });
      if (doc) found = doc.toJSON ? doc.toJSON() : doc;
    } catch (err) { console.warn("[auto-recovery] suppressed error in tenantMembershipService.js:", String(err.message).slice(0,80)); }
  }

  if (!found || found.tenantId !== tenantId) {
    const err = new Error("Membership not found in this tenant");
    err.statusCode = 404;
    throw err;
  }

  if (found.role === "platform_founder") {
    const err = new Error("Cannot revoke platform founder membership");
    err.statusCode = 403;
    throw err;
  }

  found.status = "revoked";
  found.updatedAt = new Date();
  memoryMembershipStore.set(membershipId, found);

  if (isMongoConnected()) {
    try {
      await TenantMembership.updateOne(
        { tenantId, membershipId },
        { $set: { status: "revoked" } }
      );
    } catch (err) { console.warn("[auto-recovery] suppressed error in tenantMembershipService.js:", String(err.message).slice(0,80)); }
  }

  return { success: true, membershipId, status: "revoked" };
}

module.exports = {
  listTenantMembers,
  inviteTenantMember,
  acceptInvitation,
  revokeTenantMember,
  _resetMemoryStore: () => memoryMembershipStore.clear()
};
