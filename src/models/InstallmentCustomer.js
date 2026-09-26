const mongoose = require("mongoose");

const InstallmentCustomerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: String,
    address: String,
    notes: String,
    status: { type: String, default: "active", enum: ["active", "completed", "archived"] },
    deviceId: String,
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.models.InstallmentCustomer || mongoose.model("InstallmentCustomer", InstallmentCustomerSchema);
