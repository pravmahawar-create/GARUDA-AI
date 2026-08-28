const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const mongoose = require("mongoose");
const capabilityRegistryService = require("../services/capabilityRegistryService");
const revenueValueModelService = require("../services/revenueValueModelService");
const inboundResponseService = require("../services/inboundResponseService");
const telegramBotService = require("../services/telegramBotService");

const inMemoryScopes = new Map();

router.post("/project-scope", async (req, res) => {
  try {
    const { requirements, email, name, phone, budget, timeline } = req.body || {};
    const cleanRequirements = String(requirements || "").trim();

    if (!cleanRequirements) {
      return res.status(400).json({
        success: false,
        message: "Project requirements are required for scoping."
      });
    }

    const scopeId = `scope_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const assessment = capabilityRegistryService.matchDemandUniversal({
      title: cleanRequirements.slice(0, 100),
      description: cleanRequirements
    });

    const valueEstimate = revenueValueModelService.estimateValueFromEvidence(cleanRequirements, {
      valueType: "estimated_project_value"
    });

    const bestCap = assessment.bestCapability || {
      name: "Custom Governed Software Engineering",
      category: "Software Engineering",
      estimatedDeliveryTime: "3-7 business days",
      confidenceScore: 85
    };

    const statedBudget = Number(budget) || null;
    const estimatedINR = statedBudget || valueEstimate.estimatedINR || (bestCap.confidenceScore ? Math.round(bestCap.confidenceScore * 250) : 15000);
    const estimatedUSD = Math.round(estimatedINR / 85);

    const milestones = estimatedINR >= 30000
      ? [
          { milestone: "Milestone 1 — Advance / Architecture & Core Build", amountINR: Math.round(estimatedINR / 2), percentage: 50 },
          { milestone: "Milestone 2 — Final Delivery, Automated QA & Deployment", amountINR: estimatedINR - Math.round(estimatedINR / 2), percentage: 50 }
        ]
      : [
          { milestone: "Milestone 1 — Complete Governed Delivery & Acceptance", amountINR: estimatedINR, percentage: 100 }
        ];

    const attributionService = require("../services/acquisitionAttributionService");
    const attribution = req.body.attribution || attributionService.resolveAttribution({ req, body: req.body });

    const proposal = {
      scopeId,
      customer: {
        name: String(name || "Prospective Client").trim(),
        email: String(email || "").trim() || null,
        phone: String(phone || "").trim() || null,
        contact: String(contact || email || phone || "anon").trim(),
        attribution
      },
      requirements: cleanRequirements,
      capabilityMatch: {
        name: bestCap.name,
        category: bestCap.category,
        matchScore: assessment.capabilityMatchScore,
        canExecuteAutonomously: bestCap.canMotherExecuteAutonomously || false
      },
      deliverables: [
        "Complete source code repository with clean architecture & tests",
        "Deterministic QA & Automated Validation report with evidence logs",
        "Verified SHA-256 artifact manifest & production delivery package",
        "Deployment guide & post-launch warranty support"
      ],
      pricing: {
        currency: "INR",
        totalINR: estimatedINR,
        totalUSD: estimatedUSD,
        pricingModel: estimatedINR >= 30000 ? "milestone_based" : "fixed_price",
        milestones
      },
      estimatedTimeline: timeline || bestCap.estimatedDeliveryTime || "3-7 business days",
      status: "SCOPED",
      createdAt: new Date().toISOString()
    };

    inMemoryScopes.set(scopeId, proposal);

    // Save lead record in MongoDB / JSON fallback
    const leadRecord = {
      id: `lead_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      name: proposal.customer.name,
      email: proposal.customer.email,
      phone: proposal.customer.phone,
      contact: proposal.customer.contact,
      source: attribution.summary || "project_scope_form",
      attribution,
      scopeId,
      requirements: cleanRequirements,
      estimatedINR,
      status: "new",
      capturedAt: new Date().toISOString()
    };

    try {
      if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.collection("inboundleads").insertOne(leadRecord);
      }
    } catch {}

    try {
      const fs = require("fs");
      const path = require("path");
      const file = path.join(__dirname, "..", "..", "data", "leads.json");
      const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { leads: [] };
      if (!Array.isArray(existing.leads)) existing.leads = [];
      existing.leads.push(leadRecord);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(existing, null, 2), "utf8");
    } catch {}

    // Notify Founder Telegram of incoming scoped lead with rich attribution
    try {
      await telegramBotService.notifyLeadCaptured({
        ...leadRecord,
        message: `Project Scope Form: ${cleanRequirements.slice(0, 140)} (Estimated: ₹${estimatedINR.toLocaleString("en-IN")})`
      });
    } catch {}

    return res.status(201).json({
      success: true,
      leadId: leadRecord.id,
      proposal
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to generate project scope."
    });
  }
});

router.get("/project-scope/:id", (req, res) => {
  const scope = inMemoryScopes.get(req.params.id);
  if (!scope) {
    return res.status(404).json({ success: false, message: "Project scope not found." });
  }
  return res.json({ success: true, proposal: scope });
});

router.post("/response", async (req, res) => {
  try {
    const result = await inboundResponseService.processInboundResponse(req.body, {
      founderApproved: req.get("x-garuda-founder-approved") === "true"
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
