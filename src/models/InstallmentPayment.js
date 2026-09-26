const mongoose = require("mongoose");

const InstallmentPaymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // Idempotency key
    customerId: { type: String, required: true },
    planId: String,
    customerName: String,
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    mode: { type: String, default: "cash", enum: ["cash", "upi", "bank"] },
    notes: String,
    receiptNumber: String,
    deviceId: String,
    syncedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.models.InstallmentPayment || mongoose.model("InstallmentPayment", InstallmentPaymentSchema);
