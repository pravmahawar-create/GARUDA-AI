const mongoose = require("mongoose");

const BillingLineSchema = new mongoose.Schema(
  {
    name: String,
    qty: Number,
    unit: String,
    rate: Number,
    amount: Number,
    hsn: String
  },
  { _id: false }
);

const BillingInvoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    invoiceNo: { type: Number, required: true, unique: true },
    customerId: String,
    customerName: String,
    date: String,
    items: [BillingLineSchema],
    totals: { type: mongoose.Schema.Types.Mixed },
    transport: { type: mongoose.Schema.Types.Mixed },
    status: String,
    paidAmount: Number,
    createdAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.models.BillingInvoice || mongoose.model("BillingInvoice", BillingInvoiceSchema);