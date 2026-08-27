const mongoose = require("mongoose");

const BillingCompanySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gstin: String,
    address: String,
    phone: String,
    gstRate: Number,
    nextInvoiceNo: Number,
    nextKacchaNo: Number,
    templateId: String,
    bankName: String,
    bankHolder: String,
    bankAccount: String,
    bankIfsc: String,
    upiId: String,
    createdAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.models.BillingCompany || mongoose.model("BillingCompany", BillingCompanySchema);