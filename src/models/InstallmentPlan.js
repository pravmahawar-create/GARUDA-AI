const mongoose = require("mongoose");

const InstallmentPlanSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: String,
    itemDescription: String,
    totalAmount: { type: Number, required: true },
    downPayment: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    installmentAmount: { type: Number, required: true },
    frequency: { type: String, default: "weekly", enum: ["daily", "weekly", "monthly", "custom"] },
    customDays: Number,
    preferredDay: String,
    startDate: String,
    totalInstallments: Number,
    status: { type: String, default: "active", enum: ["active", "completed", "defaulted"] },
    nextDueDate: String,
    nextInstallmentAmount: Number,
    deviceId: String,
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.models.InstallmentPlan || mongoose.model("InstallmentPlan", InstallmentPlanSchema);
