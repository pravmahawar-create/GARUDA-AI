const crypto = require("crypto");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { Subscription } = require("../models/Subscription");
const { UsageMeter } = require("../models/UsageMeter");
const { Tenant } = require("../models/Tenant");

const PLAN_CATALOG = {
  personal: {
    planId: "personal",
    name: "Sovereign Personal",
    priceInr: 0,
    priceUsd: 0,
    interval: "monthly",
    limits: {
      maxTokensPerMonth: 500000,
      maxGenerationsPerMonth: 50,
      maxProjects: 3,
      seats: 1
    },
    features: [
      "Local Sovereign Model Inference",
      "Single Seat",
      "Standard Execution Engine",
      "Community Platform Access"
    ]
  },
  creator: {
    planId: "creator",
    name: "Creator Pro",
    priceInr: 1499,
    priceUsd: 19,
    interval: "monthly",
    limits: {
      maxTokensPerMonth: 2000000,
      maxGenerationsPerMonth: 250,
      maxProjects: 10,
      seats: 2
    },
    features: [
      "Cloud & Local Sovereign Inference",
      "2 Team Seats",
      "Priority Autonomous Execution",
      "Tenant API Key Access",
      "Verified Email Support"
    ]
  },
  sme: {
    planId: "sme",
    name: "SME Commercial",
    priceInr: 4999,
    priceUsd: 59,
    interval: "monthly",
    limits: {
      maxTokensPerMonth: 10000000,
      maxGenerationsPerMonth: 1000,
      maxProjects: 50,
      seats: 10
    },
    features: [
      "Full Autonomous Multi-Agent Pipeline",
      "10 Team Seats & Role Scoping",
      "Enterprise High-Throughput API Keys",
      "Custom Workflow Automation",
      "Priority Response SLA"
    ]
  },
  enterprise: {
    planId: "enterprise",
    name: "Enterprise Titan",
    priceInr: 19999,
    priceUsd: 249,
    interval: "monthly",
    limits: {
      maxTokensPerMonth: 50000000,
      maxGenerationsPerMonth: 5000,
      maxProjects: 9999,
      seats: 50
    },
    features: [
      "Dedicated High-Velocity GPU Clusters",
      "Air-Gapped Sovereign Deployment",
      "Unlimited Autonomous Workflows",
      "Custom Enterprise Connectors",
      "Dedicated Strategic Escalation to Founder"
    ]
  }
};

// In-memory fallback stores for offline/test environments
const memorySubscriptions = new Map();
const memoryUsageMeters = new Map();
const pendingUpiPayments = new Map();

const PENDING_FILE = path.join(__dirname, "../../data/pending_upi_payments.json");

function getPendingUpiPayments() {
  const unique = new Map();
  for (const item of pendingUpiPayments.values()) {
    if (item && item.orderId) {
      unique.set(item.orderId, item);
    }
  }
  return Array.from(unique.values());
}

function loadPendingPayments() {
  try {
    if (fs.existsSync(PENDING_FILE)) {
      const data = JSON.parse(fs.readFileSync(PENDING_FILE, "utf8"));
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.orderId) pendingUpiPayments.set(item.orderId, item);
          if (item.utr) pendingUpiPayments.set(item.utr, item);
        }
      }
    }
  } catch {
    // Graceful fallback
  }
}

function savePendingPayments() {
  try {
    const list = getPendingUpiPayments();
    fs.writeFileSync(PENDING_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch {
    // Graceful fallback
  }
}

loadPendingPayments();

function getCurrentMonthPeriod() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function getPlanCatalog() {
  return Object.values(PLAN_CATALOG);
}

function getPlanDetails(planId) {
  return PLAN_CATALOG[planId] || PLAN_CATALOG.personal;
}

async function getSubscription(tenantId) {
  if (!tenantId) {
    throw new Error("tenantId is required");
  }

  let sub = null;
  if (isDbConnected()) {
    try {
      const dbSub = await Subscription.findOne({ tenantId, status: "active" }).sort({ createdAt: -1 });
      if (dbSub) sub = dbSub.toJSON ? dbSub.toJSON() : dbSub;
    } catch {
      // Fall back to memory
    }
  }

  if (!sub && memorySubscriptions.has(tenantId)) {
    sub = memorySubscriptions.get(tenantId);
  }

  if (!sub) {
    // Default to personal tier
    sub = {
      id: `sub_${tenantId}_default`,
      subscriptionId: `sub_${tenantId}_default`,
      tenantId,
      plan: "personal",
      status: "active",
      interval: "monthly",
      amount: 0,
      currency: "INR",
      provider: "manual",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      planDetails: PLAN_CATALOG.personal
    };
    memorySubscriptions.set(tenantId, sub);
  }

  // Check if there is an unapproved pending UPI verification for this tenant
  const pending = Array.from(pendingUpiPayments.values()).find(
    (p) => p && p.tenantId === tenantId && p.status === "pending_verification"
  );
  if (pending) {
    return {
      ...sub,
      pendingPayment: {
        orderId: pending.orderId,
        plan: pending.plan,
        amount: pending.amount,
        utr: pending.utr,
        status: pending.status,
        submittedAt: pending.submittedAt
      }
    };
  }

  return sub;
}

async function getUsage(tenantId, periodMonth = getCurrentMonthPeriod()) {
  if (!tenantId) {
    throw new Error("tenantId is required");
  }

  const key = `${tenantId}:${periodMonth}`;

  if (isDbConnected()) {
    try {
      const meter = await UsageMeter.findOne({ tenantId, periodMonth });
      if (meter) return meter.toJSON ? meter.toJSON() : meter;
    } catch {
      // Fall back to memory
    }
  }

  if (memoryUsageMeters.has(key)) {
    return memoryUsageMeters.get(key);
  }

  // Determine current plan limits
  const currentSub = await getSubscription(tenantId);
  const planInfo = getPlanDetails(currentSub.plan);

  const defaultMeter = {
    id: `meter_${tenantId}_${periodMonth}`,
    meterId: `meter_${tenantId}_${periodMonth}`,
    tenantId,
    periodMonth,
    tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    generationUsage: { images: 0, videos: 0, audioMinutes: 0 },
    apiHits: 0,
    activeProjectsCount: 0,
    limits: {
      maxTokensPerMonth: planInfo.limits.maxTokensPerMonth,
      maxGenerationsPerMonth: planInfo.limits.maxGenerationsPerMonth,
      maxProjects: planInfo.limits.maxProjects
    },
    lastIncrementAt: new Date()
  };

  memoryUsageMeters.set(key, defaultMeter);
  return defaultMeter;
}

async function recordUsage(tenantId, deltas = {}) {
  if (!tenantId) return null;
  const periodMonth = getCurrentMonthPeriod();
  const key = `${tenantId}:${periodMonth}`;
  const meter = await getUsage(tenantId, periodMonth);

  const tokensToAdd = Math.max(0, Number(deltas.tokens || 0));
  const imagesToAdd = Math.max(0, Number(deltas.images || 0));
  const videosToAdd = Math.max(0, Number(deltas.videos || 0));
  const apiHitsToAdd = Math.max(0, Number(deltas.apiHits || 0));

  meter.tokenUsage.totalTokens += tokensToAdd;
  meter.generationUsage.images += imagesToAdd;
  meter.generationUsage.videos += videosToAdd;
  meter.apiHits += apiHitsToAdd;
  meter.lastIncrementAt = new Date();

  memoryUsageMeters.set(key, meter);

  if (isDbConnected()) {
    try {
      await UsageMeter.findOneAndUpdate(
        { tenantId, periodMonth },
        {
          $inc: {
            "tokenUsage.totalTokens": tokensToAdd,
            "generationUsage.images": imagesToAdd,
            "generationUsage.videos": videosToAdd,
            apiHits: apiHitsToAdd
          },
          $set: { lastIncrementAt: new Date() }
        },
        { upsert: true }
      );
    } catch {
      // Offline tolerance
    }
  }

  return meter;
}

async function createSubscriptionOrder({ tenantId, plan, interval = "monthly", currency = "INR" }) {
  if (!tenantId) throw new Error("tenantId is required");
  const planInfo = PLAN_CATALOG[plan];
  if (!planInfo) throw new Error(`Invalid plan: ${plan}`);

  const amount = currency.toUpperCase() === "USD" ? planInfo.priceUsd : planInfo.priceInr;
  const orderId = `order_sub_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const isDomestic = currency.toUpperCase() === "INR";
  const upiId = "pravmahawar@okhdfcbank";
  const upiUri = isDomestic && amount > 0
    ? `upi://pay?pa=${upiId}&pn=GARUDA%20OS&am=${amount}&cu=INR&tn=GARUDA%20${encodeURIComponent(planInfo.name)}%20${orderId}`
    : null;

  return {
    success: true,
    tenantId,
    plan,
    interval,
    amount,
    currency: currency.toUpperCase(),
    orderId,
    domesticPayment: isDomestic ? {
      method: "UPI",
      upiId,
      payeeName: "Praveen Mahawar / GARUDA OS",
      upiUri,
      instructions: "Pay directly via Google Pay / PhonePe / Paytm / BHIM to pravmahawar@okhdfcbank and submit your transaction UTR for verification."
    } : null,
    keyId: process.env.RAZORPAY_KEY_ID_LIVE || process.env.RAZORPAY_KEY_ID_TEST || "rzp_test_placeholder",
    notes: {
      planName: planInfo.name,
      description: `GARUDA SaaS ${planInfo.name} Subscription`
    }
  };
}

async function activateSubscription({
  tenantId,
  plan,
  interval = "monthly",
  paymentId,
  orderId,
  provider = "upi",
  metadata = {}
}) {
  if (!tenantId) throw new Error("tenantId is required");
  const planInfo = PLAN_CATALOG[plan];
  if (!planInfo) throw new Error(`Invalid plan: ${plan}`);

  const subscriptionId = `sub_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const periodDays = interval === "yearly" ? 365 : 30;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  const subDoc = {
    id: subscriptionId,
    subscriptionId,
    tenantId,
    plan,
    status: "active",
    interval,
    amount: planInfo.priceInr,
    currency: "INR",
    provider,
    providerSubscriptionId: paymentId || orderId || null,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    planDetails: planInfo,
    metadata: {
      paymentId,
      orderId,
      activatedAt: now.toISOString(),
      ...metadata
    }
  };

  memorySubscriptions.set(tenantId, subDoc);

  // Update memory meter limits
  const periodMonth = getCurrentMonthPeriod();
  const key = `${tenantId}:${periodMonth}`;
  const meter = await getUsage(tenantId, periodMonth);
  meter.limits = {
    maxTokensPerMonth: planInfo.limits.maxTokensPerMonth,
    maxGenerationsPerMonth: planInfo.limits.maxGenerationsPerMonth,
    maxProjects: planInfo.limits.maxProjects
  };
  memoryUsageMeters.set(key, meter);

  if (isDbConnected()) {
    try {
      // Deactivate old active subscriptions
      await Subscription.updateMany(
        { tenantId, status: "active" },
        { $set: { status: "canceled" } }
      );

      // Create new active subscription
      await Subscription.create({
        subscriptionId,
        tenantId,
        plan,
        status: "active",
        interval,
        amount: planInfo.priceInr,
        currency: "INR",
        provider,
        providerSubscriptionId: paymentId || orderId || null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        metadata: subDoc.metadata
      });

      // Update Tenant plan
      await Tenant.updateOne(
        { tenantId },
        { $set: { plan } }
      );

      // Update UsageMeter limits for this period
      await UsageMeter.findOneAndUpdate(
        { tenantId, periodMonth },
        {
          $set: {
            limits: meter.limits
          }
        },
        { upsert: true }
      );
    } catch {
      // Graceful fallback
    }
  }

  return {
    success: true,
    subscription: subDoc
  };
}

async function submitUpiPayment({ tenantId, plan, interval = "monthly", orderId, utr, metadata = {} }) {
  if (!tenantId) throw new Error("tenantId is required");
  const planInfo = PLAN_CATALOG[plan];
  if (!planInfo) throw new Error(`Invalid plan: ${plan}`);

  if (!utr || typeof utr !== "string") {
    throw new Error("Valid UPI reference number (UTR) is required");
  }

  const cleanUtr = utr.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleanUtr.length < 6 || cleanUtr.length > 24) {
    throw new Error("Invalid UTR number length. UPI transaction references are typically 12 digits.");
  }

  // Prevent reuse of already approved UTR
  for (const item of pendingUpiPayments.values()) {
    if (item && item.utr === cleanUtr && item.status === "approved") {
      throw new Error("This UTR has already been verified and credited.");
    }
  }

  const subOrderId = orderId || `order_sub_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const pendingDoc = {
    id: `upi_${cleanUtr}_${Date.now()}`,
    orderId: subOrderId,
    tenantId,
    plan,
    interval,
    amount: planInfo.priceInr,
    currency: "INR",
    provider: "upi",
    utr: cleanUtr,
    status: "pending_verification",
    submittedAt: new Date().toISOString(),
    verifiedAt: null,
    verifiedBy: null,
    planDetails: planInfo,
    metadata: {
      ...metadata,
      utr: cleanUtr,
      submittedAt: new Date().toISOString()
    }
  };

  pendingUpiPayments.set(subOrderId, pendingDoc);
  pendingUpiPayments.set(cleanUtr, pendingDoc);
  savePendingPayments();

  if (isDbConnected()) {
    try {
      await Subscription.create({
        subscriptionId: pendingDoc.id,
        tenantId,
        plan,
        status: "pending_verification",
        interval,
        amount: planInfo.priceInr,
        currency: "INR",
        provider: "upi",
        providerSubscriptionId: `upi_${cleanUtr}`,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: pendingDoc.metadata
      });
    } catch {
      // Offline fallback
    }
  }

  console.log(`[UPI AUDIT] UTR ${cleanUtr} submitted by tenant ${tenantId} for ${plan} (₹${pendingDoc.amount}). Pending human verification against HDFC account.`);

  return {
    success: true,
    status: "pending_verification",
    message: "UTR reference submitted successfully. Our team will verify credit in HDFC account and activate the subscription.",
    pendingPayment: pendingDoc
  };
}

async function confirmUpiPayment({ orderId, utr, approvedBy = "founder_praveen" }) {
  const key = (orderId || utr || "").trim();
  let pending = pendingUpiPayments.get(key);
  if (!pending && utr) {
    const cleanUtr = utr.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    pending = pendingUpiPayments.get(cleanUtr);
  }
  if (!pending) {
    for (const item of pendingUpiPayments.values()) {
      if (item && (item.orderId === key || item.utr === key)) {
        pending = item;
        break;
      }
    }
  }

  if (!pending) {
    throw new Error(`Pending UPI payment not found for reference: ${key}`);
  }

  // Activate the subscription
  const activation = await activateSubscription({
    tenantId: pending.tenantId,
    plan: pending.plan,
    interval: pending.interval,
    paymentId: `upi_${pending.utr}`,
    orderId: pending.orderId,
    provider: "upi",
    metadata: {
      utr: pending.utr,
      verifiedBy: approvedBy,
      verifiedAt: new Date().toISOString(),
      verifiedAmount: pending.amount
    }
  });

  pending.status = "approved";
  pending.verifiedBy = approvedBy;
  pending.verifiedAt = new Date().toISOString();
  savePendingPayments();

  console.log(`[UPI AUDIT] ✓ UTR ${pending.utr} approved by ${approvedBy}. Tenant ${pending.tenantId} activated on ${pending.plan}.`);

  return {
    success: true,
    status: "active",
    message: `Subscription activated successfully for ${pending.tenantId} (${pending.plan}) after human bank verification.`,
    subscription: activation.subscription
  };
}

async function rejectUpiPayment({ orderId, utr, reason = "Payment not credited to bank account", rejectedBy = "founder_praveen" }) {
  const key = (orderId || utr || "").trim();
  let pending = pendingUpiPayments.get(key);
  if (!pending && utr) {
    const cleanUtr = utr.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    pending = pendingUpiPayments.get(cleanUtr);
  }
  if (!pending) {
    for (const item of pendingUpiPayments.values()) {
      if (item && (item.orderId === key || item.utr === key)) {
        pending = item;
        break;
      }
    }
  }

  if (!pending) {
    throw new Error(`Pending UPI payment not found for reference: ${key}`);
  }

  pending.status = "rejected";
  pending.rejectedBy = rejectedBy;
  pending.rejectedAt = new Date().toISOString();
  pending.rejectionReason = reason;
  savePendingPayments();

  if (isDbConnected()) {
    try {
      await Subscription.updateOne(
        { providerSubscriptionId: `upi_${pending.utr}`, status: "pending_verification" },
        { $set: { status: "rejected", "metadata.rejectionReason": reason } }
      );
    } catch {}
  }

  console.log(`[UPI AUDIT] ✗ UTR ${pending.utr} rejected by ${rejectedBy}: ${reason}`);

  return {
    success: true,
    status: "rejected",
    message: `Payment rejected: ${reason}`,
    pendingPayment: pending
  };
}

module.exports = {
  PLAN_CATALOG,
  getPlanCatalog,
  getPlanDetails,
  getSubscription,
  getUsage,
  recordUsage,
  createSubscriptionOrder,
  activateSubscription,
  submitUpiPayment,
  confirmUpiPayment,
  rejectUpiPayment,
  getPendingUpiPayments,
  getCurrentMonthPeriod,
  _resetMemoryStore: () => {
    memorySubscriptions.clear();
    memoryUsageMeters.clear();
    pendingUpiPayments.clear();
  }
};
