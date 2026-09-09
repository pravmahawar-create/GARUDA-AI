const crypto = require("crypto");
const mongoose = require("mongoose");

const memoryInvoices = new Map();

function isMongoConnected() {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}

// Ensure CorporateInvoice mongoose model
const CorporateInvoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    proposalId: { type: String, required: true, index: true },
    tenantId: { type: String, default: "tenant_founder_core", index: true },
    paymentType: { type: String, enum: ["DEPOSIT", "MILESTONE", "FINAL", "SUBSCRIPTION"], default: "DEPOSIT" },
    seller: {
      brandName: { type: String, default: "GARUDA AI OS" },
      founder: { type: String, default: "Praveen Mahawar" },
      email: { type: String, default: "praveen@garudaos.in" },
      portal: { type: String, default: "https://www.garudaos.in" },
      sacCode: { type: String, default: "998313" }
    },
    buyer: {
      name: { type: String, required: true },
      company: { type: String, default: "" },
      email: { type: String, default: "" },
      gstin: { type: String, default: "UNREGISTERED" },
      country: { type: String, default: "India" }
    },
    lineItems: [
      {
        description: String,
        sacCode: String,
        quantity: Number,
        unitRate: Number,
        amount: Number
      }
    ],
    pricing: {
      subtotal: Number,
      taxPercent: Number,
      taxAmount: Number,
      totalAmount: Number,
      currency: { type: String, default: "INR" }
    },
    paymentEvidence: {
      provider: { type: String, default: "razorpay" },
      paymentId: { type: String, required: true },
      verified: { type: Boolean, default: true },
      verifiedAt: { type: Date, default: Date.now }
    },
    status: { type: String, enum: ["PAID", "PENDING", "CANCELLED"], default: "PAID" },
    verificationHash: { type: String, required: true }
  },
  { timestamps: true }
);

CorporateInvoiceSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.invoiceId || String(ret._id);
    delete ret._id;
  }
});

const CorporateInvoice =
  mongoose.models.CorporateInvoice || mongoose.model("CorporateInvoice", CorporateInvoiceSchema);

function calculateTaxes(amount, currency = "INR", country = "India") {
  const isDomesticInr = currency.toUpperCase() === "INR" && (!country || country.toLowerCase() === "india");
  if (isDomesticInr) {
    // 18% GST (9% CGST + 9% SGST / IGST)
    const baseSubtotal = Math.round((amount / 1.18) * 100) / 100;
    const taxAmount = Math.round((amount - baseSubtotal) * 100) / 100;
    return {
      subtotal: baseSubtotal,
      taxPercent: 18,
      taxAmount,
      totalAmount: amount
    };
  }
  // Export of software services (0% IGST under LUT)
  return {
    subtotal: amount,
    taxPercent: 0,
    taxAmount: 0,
    totalAmount: amount
  };
}

/**
 * Generates an authoritative B2B corporate tax invoice for a verified proposal payment.
 */
async function generateInvoiceForProposal(proposal, paymentType = "DEPOSIT", paymentDetails = {}) {
  if (!proposal || !proposal.proposalId) {
    throw new Error("Valid proposal is required to generate corporate invoice");
  }

  const proposalId = proposal.proposalId;
  const currency = paymentDetails.currency || proposal.pricing?.currency || "INR";
  const rawAmount = Number(paymentDetails.amount) || (paymentType === "DEPOSIT" ? proposal.pricing?.depositAmount : proposal.pricing?.totalAmount);
  const paymentId = paymentDetails.paymentId || "pay_unassigned_verified";

  const year = new Date().getUTCFullYear();
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  const invoiceNumber = `GRD-INV-${year}-${hex}`;
  const invoiceId = `inv_${Date.now()}_${hex.toLowerCase()}`;

  const buyerName = proposal.client?.name || "Client";
  const buyerCompany = proposal.client?.company || proposal.client?.businessName || buyerName;
  const buyerEmail = proposal.client?.email || "";
  const buyerCountry = proposal.client?.country || "India";

  const taxCalculations = calculateTaxes(rawAmount, currency, buyerCountry);

  const description =
    paymentType === "DEPOSIT"
      ? `${proposal.project?.title || "Custom Autonomous System"} — 50% Kickoff & Architecture Deposit`
      : `${proposal.project?.title || "Custom Autonomous System"} — Final Milestone Delivery & Handover`;

  const lineItems = [
    {
      description,
      sacCode: "998313",
      quantity: 1,
      unitRate: taxCalculations.subtotal,
      amount: taxCalculations.subtotal
    }
  ];

  const payloadToHash = {
    invoiceNumber,
    proposalId,
    amount: rawAmount,
    currency,
    paymentId,
    buyerName,
    timestamp: new Date().toISOString()
  };

  const verificationHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payloadToHash))
    .digest("hex");

  const invoiceDoc = {
    id: invoiceId,
    invoiceId,
    invoiceNumber,
    proposalId,
    tenantId: proposal.tenantId || "tenant_founder_core",
    paymentType,
    seller: {
      brandName: "GARUDA AI OS",
      founder: "Praveen Mahawar",
      email: "praveen@garudaos.in",
      portal: "https://www.garudaos.in",
      sacCode: "998313"
    },
    buyer: {
      name: buyerName,
      company: buyerCompany,
      email: buyerEmail,
      gstin: proposal.client?.gstin || "UNREGISTERED",
      country: buyerCountry
    },
    lineItems,
    pricing: {
      subtotal: taxCalculations.subtotal,
      taxPercent: taxCalculations.taxPercent,
      taxAmount: taxCalculations.taxAmount,
      totalAmount: rawAmount,
      currency
    },
    paymentEvidence: {
      provider: paymentDetails.provider || "razorpay",
      paymentId,
      verified: true,
      verifiedAt: new Date()
    },
    status: "PAID",
    verificationHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  memoryInvoices.set(invoiceId, invoiceDoc);

  if (isMongoConnected()) {
    try {
      await CorporateInvoice.create(invoiceDoc);
    } catch {}
  }

  return invoiceDoc;
}

/**
 * Retrieve invoice by invoiceId or invoiceNumber
 */
async function getInvoice(identifier) {
  if (!identifier) return null;

  if (isMongoConnected()) {
    try {
      const doc = await CorporateInvoice.findOne({
        $or: [{ invoiceId: identifier }, { invoiceNumber: identifier }]
      });
      if (doc) return doc.toJSON ? doc.toJSON() : doc;
    } catch {}
  }

  for (const inv of memoryInvoices.values()) {
    if (inv.invoiceId === identifier || inv.invoiceNumber === identifier) {
      return inv;
    }
  }

  return null;
}

/**
 * List all invoices for a given proposal
 */
async function listInvoicesForProposal(proposalId) {
  if (!proposalId) return [];

  const results = [];
  const seenIds = new Set();

  if (isMongoConnected()) {
    try {
      const docs = await CorporateInvoice.find({ proposalId }).sort({ createdAt: -1 });
      for (const doc of docs) {
        const item = doc.toJSON ? doc.toJSON() : doc;
        seenIds.add(item.invoiceId);
        results.push(item);
      }
    } catch {}
  }

  for (const inv of memoryInvoices.values()) {
    if (inv.proposalId === proposalId && !seenIds.has(inv.invoiceId)) {
      seenIds.add(inv.invoiceId);
      results.push(inv);
    }
  }

  return results;
}

module.exports = {
  CorporateInvoice,
  generateInvoiceForProposal,
  getInvoice,
  listInvoicesForProposal,
  calculateTaxes,
  _resetMemoryStore: () => memoryInvoices.clear()
};
