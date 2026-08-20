const mongoose = require("mongoose");

const BillingPaymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customerId: String,
    invoiceId: String,
    amount: Number,
    date: String,
    mode: String,
    note: String,
    createdAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.models.BillingPayment || mongoose.model("BillingPayment", BillingPaymentSchema);