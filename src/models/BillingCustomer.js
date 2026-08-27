const mongoose = require("mongoose");

const BillingCustomerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    mobile: String,
    gstin: String,
    address: String,
    creditLimit: Number,
    createdAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.models.BillingCustomer || mongoose.model("BillingCustomer", BillingCustomerSchema);