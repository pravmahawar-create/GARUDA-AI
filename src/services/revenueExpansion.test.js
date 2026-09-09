/**
 * GARUDA Option 3 — Revenue Expansion Test Suite
 * Tests Corporate B2B Invoices & Post-Delivery Recurring Retainers
 */

const assert = require("assert");
const corporateInvoiceService = require("./corporateInvoiceService");
const revenueRetainerService = require("./revenueRetainerService");

async function runTests() {
  console.log("▶ Running Revenue Expansion Test Suite (Invoices & Retainers)...");

  corporateInvoiceService._resetMemoryStore();
  revenueRetainerService._resetMemoryStore();

  // --- 1. Domestic Indian B2B Invoice (18% GST calculation) ---
  console.log("\n--- 1. Domestic Indian B2B Corporate Invoice ---");
  const domesticProposal = {
    proposalId: "prop_test_domestic_01",
    client: {
      name: "Rajesh Sharma",
      company: "Sharma Infra Projects Pvt Ltd",
      email: "rajesh@sharmainfra.com",
      country: "India",
      gstin: "23AABCU9603R1ZM"
    },
    project: {
      title: "Autonomous Logistics & Dispatch Bot"
    },
    pricing: {
      totalAmount: 118000,
      depositAmount: 59000,
      currency: "INR"
    }
  };

  const depositInvoice = await corporateInvoiceService.generateInvoiceForProposal(
    domesticProposal,
    "DEPOSIT",
    {
      amount: 59000,
      paymentId: "pay_rzp_mock_dom_01",
      provider: "razorpay"
    }
  );

  assert(depositInvoice.invoiceNumber.startsWith("GRD-INV-"), "Invoice number should start with GRD-INV-");
  assert.strictEqual(depositInvoice.status, "PAID");
  assert.strictEqual(depositInvoice.pricing.totalAmount, 59000);
  assert.strictEqual(depositInvoice.pricing.taxPercent, 18, "Domestic INR invoice must have 18% GST");
  assert(depositInvoice.pricing.subtotal > 0, "Subtotal must be positive");
  assert(depositInvoice.pricing.taxAmount > 0, "Tax amount must be positive");
  assert.strictEqual(
    Math.round((depositInvoice.pricing.subtotal + depositInvoice.pricing.taxAmount) * 100) / 100,
    59000,
    "Subtotal + Tax must equal Total Amount"
  );
  assert.strictEqual(depositInvoice.verificationHash.length, 64, "SHA-256 hash must be 64 characters hex");
  assert.strictEqual(depositInvoice.seller.sacCode, "998313", "SAC code for software services must be 998313");
  console.log(`✔ Domestic Invoice Verified: ${depositInvoice.invoiceNumber} (Total: ₹${depositInvoice.pricing.totalAmount}, GST 18%: ₹${depositInvoice.pricing.taxAmount})`);

  // --- 2. International Export Invoice (0% GST with LUT) ---
  console.log("\n--- 2. International Export Corporate Invoice (0% GST under LUT) ---");
  const exportProposal = {
    proposalId: "prop_test_export_02",
    client: {
      name: "Marcus Vance",
      company: "Vance Cybernetics LLC",
      email: "marcus@vancecyber.com",
      country: "United States"
    },
    project: {
      title: "Autonomous Agent Workflow Pipeline"
    },
    pricing: {
      totalAmount: 5000,
      depositAmount: 2500,
      currency: "USD"
    }
  };

  const exportInvoice = await corporateInvoiceService.generateInvoiceForProposal(
    exportProposal,
    "DEPOSIT",
    {
      amount: 2500,
      paymentId: "pay_stripe_mock_exp_02",
      provider: "stripe"
    }
  );

  assert.strictEqual(exportInvoice.pricing.currency, "USD");
  assert.strictEqual(exportInvoice.pricing.taxPercent, 0, "Export of software services must be 0% tax");
  assert.strictEqual(exportInvoice.pricing.taxAmount, 0);
  assert.strictEqual(exportInvoice.pricing.subtotal, 2500);
  console.log(`✔ Export Invoice Verified: ${exportInvoice.invoiceNumber} (Total: $${exportInvoice.pricing.totalAmount}, Tax: 0%)`);

  // --- 3. Invoice Retrieval & Proposal Listing ---
  console.log("\n--- 3. Invoice Retrieval & Listing ---");
  const retrieved = await corporateInvoiceService.getInvoice(depositInvoice.invoiceId);
  assert.strictEqual(retrieved.invoiceNumber, depositInvoice.invoiceNumber);

  const proposalInvoices = await corporateInvoiceService.listInvoicesForProposal("prop_test_domestic_01");
  assert.strictEqual(proposalInvoices.length, 1);
  console.log(`✔ Invoice listing and retrieval verified (${proposalInvoices.length} invoice found for proposal)`);

  // --- 4. Retainer Tier Recommendation Logic ---
  console.log("\n--- 4. Retainer Tier Recommendation Logic ---");
  const smallTier = revenueRetainerService.recommendRetainerTier(20000);
  assert.strictEqual(smallTier.tierId, "sentinel", "Budgets <= 35k recommend Sentinel tier");
  assert.strictEqual(smallTier.priceInr, 15000);

  const midTier = revenueRetainerService.recommendRetainerTier(75000);
  assert.strictEqual(midTier.tierId, "growth_pod", "Budgets <= 120k recommend Growth Pod tier");
  assert.strictEqual(midTier.priceInr, 45000);

  const titanTier = revenueRetainerService.recommendRetainerTier(250000);
  assert.strictEqual(titanTier.tierId, "titan_workforce", "High-value budgets recommend Titan Workforce tier");
  assert.strictEqual(titanTier.priceInr, 95000);
  console.log("✔ Retainer recommendations verified (Sentinel ₹15k, Growth Pod ₹45k, Titan Workforce ₹95k)");

  // --- 5. Retainer Agreement Confirmation ---
  console.log("\n--- 5. Retainer Agreement Confirmation ---");
  const agreement = await revenueRetainerService.confirmRetainerAgreement("prop_test_domestic_01", "growth_pod");
  assert.strictEqual(agreement.status, "ACTIVE");
  assert.strictEqual(agreement.monthlyAmount, 45000);
  assert.strictEqual(agreement.tier.tierId, "growth_pod");
  assert(agreement.nextBillingDate instanceof Date);
  console.log(`✔ Retainer agreement confirmed: ₹${agreement.monthlyAmount}/mo, next billing: ${agreement.nextBillingDate.toISOString().slice(0, 10)}`);

  console.log("\n ALL REVENUE EXPANSION TESTS PASSED CLEANLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
