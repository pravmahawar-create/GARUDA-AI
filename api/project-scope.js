const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

let attributionService;
try {
  attributionService = require("../src/services/acquisitionAttributionService");
} catch {
  attributionService = null;
}

let telegramBotService;
try {
  telegramBotService = require("../src/services/telegramBotService");
} catch {
  telegramBotService = null;
}

let capabilityRegistryService;
try {
  capabilityRegistryService = require("../src/services/capabilityRegistryService");
} catch {
  capabilityRegistryService = null;
}

let revenueValueModelService;
try {
  revenueValueModelService = require("../src/services/revenueValueModelService");
} catch {
  revenueValueModelService = null;
}

const inMemoryScopes = new Map();

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const scopeId = req.query.id || (req.url && req.url.split("/").pop());
    const scope = inMemoryScopes.get(scopeId);
    if (!scope) {
      return res.status(404).json({ success: false, message: "Project scope not found." });
    }
    return res.status(200).json({ success: true, proposal: scope });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { requirements, email, name, phone, contact, budget, timeline, service, attribution: clientAttr } = req.body || {};
    const cleanRequirements = String(requirements || "").trim();

    if (!cleanRequirements || cleanRequirements.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Project requirements are required for scoping (minimum 5 characters)."
      });
    }

    const scopeId = `scope_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const assessment = capabilityRegistryService ? capabilityRegistryService.matchDemandUniversal({
      title: cleanRequirements.slice(0, 100),
      description: cleanRequirements
    }) : { capabilityMatchScore: 85 };

    const valueEstimate = revenueValueModelService ? revenueValueModelService.estimateValueFromEvidence(cleanRequirements, {
      valueType: "estimated_project_value"
    }) : { estimatedINR: 25000 };

    const bestCap = (assessment && assessment.bestCapability) || {
      name: "Custom Governed Software Engineering",
      category: "Software Engineering",
      estimatedDeliveryTime: "3-7 business days",
      confidenceScore: 85
    };

    const statedBudget = Number(budget) || null;
    const estimatedINR = statedBudget || valueEstimate.estimatedINR || (bestCap.confidenceScore ? Math.round(bestCap.confidenceScore * 250) : 25000);
    const estimatedUSD = Math.round(estimatedINR / 85);

    const milestones = estimatedINR >= 30000
      ? [
          { milestone: "Milestone 1 — Advance / Architecture & Core Build", amountINR: Math.round(estimatedINR / 2), percentage: 50 },
          { milestone: "Milestone 2 — Final Delivery, Automated QA & Deployment", amountINR: estimatedINR - Math.round(estimatedINR / 2), percentage: 50 }
        ]
      : [
          { milestone: "Milestone 1 — Complete Governed Delivery & Acceptance", amountINR: estimatedINR, percentage: 100 }
        ];

    let attribution = null;
    if (attributionService) {
      attribution = attributionService.resolveAttribution({ req, body: req.body, attribution: clientAttr });
    } else {
      attribution = clientAttr || null;
    }

    const proposal = {
      scopeId,
      customer: {
        name: String(name || "Prospective Client").trim(),
        email: String(email || (contact && contact.includes("@") ? contact : "")).trim() || null,
        phone: String(phone || (contact && !contact.includes("@") ? contact : "")).trim() || null,
        contact: String(contact || email || phone || "anon").trim(),
        service: service || "custom-ai-development",
        attribution: attribution || null
      },
      requirements: cleanRequirements,
      capabilityMatch: {
        name: bestCap.name,
        category: bestCap.category,
        matchScore: assessment ? assessment.capabilityMatchScore : 85,
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

    const leadRecord = {
      id: `lead_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      name: proposal.customer.name,
      email: proposal.customer.email,
      phone: proposal.customer.phone,
      contact: proposal.customer.contact,
      source: (attribution && attribution.summary) || "project_scope_form",
      attribution: attribution || null,
      scopeId,
      service: proposal.customer.service,
      requirements: cleanRequirements,
      estimatedINR,
      status: "new",
      capturedAt: new Date().toISOString()
    };

    // Save lead record in JSON fallback
    try {
      const file = path.join(__dirname, "..", "data", "leads.json");
      const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { leads: [] };
      if (!Array.isArray(existing.leads)) existing.leads = [];
      existing.leads.push(leadRecord);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(existing, null, 2), "utf8");
    } catch {}

    // Notify Founder Telegram
    if (telegramBotService) {
      try {
        await telegramBotService.notifyLeadCaptured({
          ...leadRecord,
          message: `Project Scope Form: ${cleanRequirements.slice(0, 140)} (Estimated: ₹${estimatedINR.toLocaleString("en-IN")})`
        });
      } catch {}
    }

    return res.status(201).json({
      success: true,
      leadId: leadRecord.id,
      proposal
    });
  } catch (err) {
    console.error("Project Scope Inbound Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to generate project scope."
    });
  }
};
