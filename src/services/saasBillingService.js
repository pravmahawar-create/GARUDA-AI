const crypto = require("crypto");
const mongoose = require("mongoose");
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

  if (isDbConnected()) {
    try {
      const sub = await Subscription.findOne({ tenantId, status: "active" }).sort({ createdAt: -1 });
      if (sub) return sub.toJSON ? sub.toJSON() : sub;
    } catch {
      // Fall back to memory
    }
  }

  if (memorySubscriptions.has(tenantId)) {
    return memorySubscriptions.get(tenantId);
  }

  // Default to personal tier
  const defaultSub = {
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

  memorySubscriptions.set(tenantId, defaultSub);
  return defaultSub;
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

  return {
    success: true,
    tenantId,
    plan,
    interval,
    amount,
    currency: currency.toUpperCase(),
    orderId,
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
  provider = "razorpay"
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
      activatedAt: now.toISOString()
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

module.exports = {
  PLAN_CATALOG,
  getPlanCatalog,
  getPlanDetails,
  getSubscription,
  getUsage,
  recordUsage,
  createSubscriptionOrder,
  activateSubscription,
  getCurrentMonthPeriod,
  _resetMemoryStore: () => {
    memorySubscriptions.clear();
    memoryUsageMeters.clear();
  }
};
