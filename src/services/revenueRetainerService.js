/**
 * GARUDA Revenue Retainer Service
 * Option 3 — Revenue Expansion
 *
 * Converts one-off delivered client projects into recurring high-margin monthly retainers
 * for SLA monitoring, model tuning, continuous autonomous agent feature expansion,
 * and dedicated workforce pods.
 */

const crypto = require("crypto");
const mongoose = require("mongoose");
const Opportunity = require("../models/Opportunity");

let telegramBotService;
try {
  telegramBotService = require("./telegramBotService");
} catch {
  telegramBotService = null;
}

let persistentProposalService;
try {
  persistentProposalService = require("./persistentProposalService");
} catch {
  persistentProposalService = null;
}

const RETAINER_TIERS = {
  sentinel: {
    tierId: "sentinel",
    name: "GARUDA Sovereign Sentinel",
    priceInr: 15000,
    priceUsd: 199,
    interval: "monthly",
    recommendedForMaxBudget: 35000,
    deliverables: [
      "24/7 Agent Uptime & Autonomous Health Monitoring",
      "Prompt Drift Calibration & Self-Healing Patches",
      "Weekly Security & API Deprecation Updates",
      "Vector Memory Retention & Cold-Start Minimization"
    ]
  },
  growth_pod: {
    tierId: "growth_pod",
    name: "GARUDA Growth & Acceleration Pod",
    priceInr: 45000,
    priceUsd: 599,
    interval: "monthly",
    recommendedForMaxBudget: 120000,
    deliverables: [
      "Everything in Sentinel Tier",
      "Weekly Feature Iterations & Pipeline Expansions",
      "Continuous Conversion & Autonomous Lead Funnel Optimization",
      "Priority Cloud GPU Throughput & Low-Latency Routing",
      "Bi-Weekly Strategic Engineering Review"
    ]
  },
  titan_workforce: {
    tierId: "titan_workforce",
    name: "GARUDA Dedicated Autonomous Workforce",
    priceInr: 95000,
    priceUsd: 1199,
    interval: "monthly",
    recommendedForMaxBudget: Infinity,
    deliverables: [
      "Everything in Growth Pod Tier",
      "Full Dedicated Multi-Agent Fleet Exclusively Aligned to Client",
      "Custom Proprietary LLM LoRA Fine-Tuning & Quantization",
      "Air-Gapped Sovereign On-Premises Architecture Support",
      "Private System Escalation & Direct Founder Strategic Hotline"
    ]
  }
};

const memoryRetainers = new Map();

function isMongoConnected() {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}

function recommendRetainerTier(originalBudget) {
  const budget = Number(originalBudget) || 0;
  if (budget <= 35000) return RETAINER_TIERS.sentinel;
  if (budget <= 120000) return RETAINER_TIERS.growth_pod;
  return RETAINER_TIERS.titan_workforce;
}

/**
 * Scans delivered/closed client projects and generates retainer propositions.
 */
async function scanForRetainerOpportunities() {
  const candidates = [];
  const existingRetainers = new Set(Array.from(memoryRetainers.keys()));

  // 1. Fetch from persistent proposal storage
  if (persistentProposalService && typeof persistentProposalService.listProposals === "function") {
    try {
      const proposals = await persistentProposalService.listProposals();
      for (const p of proposals) {
        if (p.status === "CLOSED" || p.status === "FINAL_PAID") {
          candidates.push(p);
        }
      }
    } catch {}
  }

  const generatedOpportunities = [];

  for (const candidate of candidates) {
    const proposalId = candidate.proposalId || candidate.id;
    if (existingRetainers.has(proposalId)) continue;

    const originalBudget = candidate.pricing?.totalAmount || 25000;
    const recommendedTier = recommendRetainerTier(originalBudget);

    const retainerOpportunity = {
      retainerId: `ret_${proposalId}_${crypto.randomBytes(3).toString("hex")}`,
      proposalId,
      client: candidate.client || { name: "Client" },
      projectTitle: candidate.project?.title || "Autonomous Project",
      recommendedTier,
      proposedMonthlyInr: recommendedTier.priceInr,
      currency: candidate.pricing?.currency || "INR",
      status: "PROPOSED",
      generatedAt: new Date().toISOString()
    };

    memoryRetainers.set(proposalId, retainerOpportunity);
    generatedOpportunities.push(retainerOpportunity);

    // Save to Opportunity collection
    if (isMongoConnected()) {
      try {
        await Opportunity.findOneAndUpdate(
          { sourceId: proposalId, opportunityType: "retainer" },
          {
            $set: {
              title: `Recurring Retainer — ${candidate.project?.title || "Client Project"} (${recommendedTier.name})`,
              company: candidate.client?.company || candidate.client?.name || "Client",
              stage: "qualified",
              opportunityType: "retainer",
              value: recommendedTier.priceInr,
              currency: candidate.pricing?.currency || "INR",
              probability: 70,
              tenantId: candidate.tenantId || "tenant_founder_core",
              metadata: {
                proposalId,
                tierId: recommendedTier.tierId,
                tierName: recommendedTier.name,
                interval: "monthly",
                deliverables: recommendedTier.deliverables
              }
            }
          },
          { upsert: true }
        );
      } catch {}
    }

    // Founder private Telegram notification
    if (telegramBotService && typeof telegramBotService.sendFounderAlert === "function") {
      try {
        await telegramBotService.sendFounderAlert(
          "🔄 RECURRING RETAINER OPPORTUNITY GENERATED",
          `Client: ${candidate.client?.name || "Client"} (${candidate.client?.company || "Company"})\n` +
          `Delivered Project: ${candidate.project?.title}\n` +
          `Recommended Retainer: ${recommendedTier.name}\n` +
          `Recurring MRR: ₹${recommendedTier.priceInr.toLocaleString("en-IN")}/mo\n` +
          `Status: Auto-Added to Opportunity Funnel`
        );
      } catch {}
    }
  }

  return {
    scannedCount: candidates.length,
    retainersGenerated: generatedOpportunities.length,
    opportunities: generatedOpportunities
  };
}

/**
 * Creates and confirms a retainer agreement for an existing proposal.
 */
async function confirmRetainerAgreement(proposalId, tierKey = "growth_pod") {
  if (!proposalId) throw new Error("proposalId is required");
  const tier = RETAINER_TIERS[tierKey] || RETAINER_TIERS.growth_pod;

  const agreement = {
    agreementId: `agr_ret_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    proposalId,
    tier,
    monthlyAmount: tier.priceInr,
    currency: "INR",
    interval: "monthly",
    status: "ACTIVE",
    startDate: new Date(),
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    deliverables: tier.deliverables
  };

  memoryRetainers.set(proposalId, agreement);

  if (isMongoConnected()) {
    try {
      await Opportunity.updateOne(
        { "metadata.proposalId": proposalId },
        { $set: { stage: "won", probability: 100 } }
      );
    } catch {}
  }

  return agreement;
}

module.exports = {
  RETAINER_TIERS,
  recommendRetainerTier,
  scanForRetainerOpportunities,
  confirmRetainerAgreement,
  _resetMemoryStore: () => memoryRetainers.clear()
};
