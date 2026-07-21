const mongoose = require("mongoose");
const { Opportunity, OPP_STAGES } = require("../models/Opportunity");

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeOpportunityInput(payload = {}) {
  return {
    title: typeof payload.title === "string" ? payload.title.trim() : undefined,
    client: typeof payload.client === "string" ? payload.client.trim() : undefined,
    source: typeof payload.source === "string" ? payload.source.trim() : undefined,
    stage: payload.stage,
    potentialValue: payload.potentialValue,
    currency: typeof payload.currency === "string"
      ? payload.currency.trim().toUpperCase()
      : undefined,
    probability: payload.probability,
    expectedCloseDate: parseDate(payload.expectedCloseDate),
    notes: typeof payload.notes === "string" ? payload.notes.trim() : undefined,
    tags: Array.isArray(payload.tags)
      ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : undefined
  };
}

function validateOpportunityInput(payload = {}, { partial = false } = {}) {
  const data = normalizeOpportunityInput(payload);

  for (const field of ["title", "client"]) {
    if ((!partial || data[field] !== undefined) && !data[field]) {
      const error = new Error(`${field} is required`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (!partial || data.potentialValue !== undefined) {
    if (
      typeof data.potentialValue !== "number" ||
      Number.isNaN(data.potentialValue) ||
      data.potentialValue < 0
    ) {
      const error = new Error("potentialValue must be a non-negative number");
      error.statusCode = 400;
      throw error;
    }
  }

  if (data.stage !== undefined && !OPP_STAGES.includes(data.stage)) {
    const error = new Error(`stage must be one of: ${OPP_STAGES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  if (
    data.probability !== undefined &&
    (
      typeof data.probability !== "number" ||
      data.probability < 0 ||
      data.probability > 100
    )
  ) {
    const error = new Error("probability must be between 0 and 100");
    error.statusCode = 400;
    throw error;
  }

  if (payload.expectedCloseDate !== undefined && !data.expectedCloseDate) {
    const error = new Error("expectedCloseDate must be a valid ISO date");
    error.statusCode = 400;
    throw error;
  }

  return data;
}

async function listOpportunities(filters = {}) {
  const query = {};
  if (filters.stage && OPP_STAGES.includes(filters.stage)) query.stage = filters.stage;
  if (filters.source) query.source = String(filters.source).trim();
  if (filters.client) {
    query.client = { $regex: String(filters.client).trim(), $options: "i" };
  }

  const items = await Opportunity.find(query).sort({
    expectedCloseDate: 1,
    createdAt: -1
  });
  return items.map((item) => item.toJSON());
}

async function createOpportunity(payload = {}) {
  const data = validateOpportunityInput(payload);
  const item = await Opportunity.create({
    ...data,
    source: data.source || "direct",
    stage: data.stage || "prospect",
    currency: data.currency || "INR",
    probability: data.probability ?? 25,
    notes: data.notes || "",
    tags: data.tags || []
  });
  return item.toJSON();
}

async function updateOpportunity(id, payload = {}) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) {
    const error = new Error("Invalid opportunity id");
    error.statusCode = 400;
    throw error;
  }

  const item = await Opportunity.findById(id);
  if (!item) {
    const error = new Error("Opportunity not found");
    error.statusCode = 404;
    throw error;
  }

  const data = validateOpportunityInput(payload, { partial: true });
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) item[key] = value;
  });
  await item.save();
  return item.toJSON();
}

async function getOpportunityMetrics() {
  const [byStage, totals] = await Promise.all([
    Opportunity.aggregate([
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
          potentialValue: { $sum: "$potentialValue" }
        }
      }
    ]),
    Opportunity.aggregate([
      {
        $group: {
          _id: null,
          pipelineValue: { $sum: "$potentialValue" },
          weightedPipelineValue: {
            $sum: {
              $multiply: ["$potentialValue", { $divide: ["$probability", 100] }]
            }
          }
        }
      }
    ])
  ]);

  return {
    totalOpportunities: byStage.reduce((sum, row) => sum + row.count, 0),
    pipelineValue: totals[0]?.pipelineValue || 0,
    weightedPipelineValue: Math.round(totals[0]?.weightedPipelineValue || 0),
    byStage: byStage.map((row) => ({
      stage: row._id,
      count: row.count,
      potentialValue: row.potentialValue
    }))
  };
}

module.exports = {
  listOpportunities,
  createOpportunity,
  updateOpportunity,
  getOpportunityMetrics,
  validateOpportunityInput,
  OPP_STAGES
};
