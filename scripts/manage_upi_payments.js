#!/usr/bin/env node
/**
 * GARUDA AI - Sovereign Domestic UPI Payment Admin Management
 * 
 * Allows Founder Praveen to review submitted UTR transaction IDs,
 * cross-verify with HDFC/GPay statement, and approve/activate or reject subscriptions.
 * 
 * Usage:
 *   node scripts/manage_upi_payments.js list
 *   node scripts/manage_upi_payments.js approve <utr_or_orderId>
 *   node scripts/manage_upi_payments.js reject <utr_or_orderId> [reason]
 */

const saasBillingService = require("../src/services/saasBillingService");

async function main() {
  const [,, command, targetRef, ...restArgs] = process.argv;

  if (!command || command === "list" || command === "status") {
    console.log("\n📋 [GARUDA UPI ADMIN] Pending Domestic UPI Payment Queue:\n");
    const pendingList = saasBillingService.getPendingUpiPayments();
    
    if (pendingList.length === 0) {
      console.log("  No pending UPI submissions in queue.\n");
      return;
    }

    console.log(`  Found ${pendingList.length} submission(s):\n`);
    pendingList.forEach((item, idx) => {
      const statusIcon = item.status === "approved" ? "✓" : item.status === "rejected" ? "✗" : "⏳";
      console.log(`  [${idx + 1}] ${statusIcon} Status: ${item.status.toUpperCase()}`);
      console.log(`      Order ID:     ${item.orderId}`);
      console.log(`      Tenant ID:    ${item.tenantId}`);
      console.log(`      Plan:         ${item.plan.toUpperCase()} (₹${item.amount})`);
      console.log(`      UTR Ref:      ${item.utr}`);
      console.log(`      Submitted At: ${item.submittedAt}`);
      if (item.verifiedBy) console.log(`      Verified By:  ${item.verifiedBy} at ${item.verifiedAt}`);
      if (item.rejectionReason) console.log(`      Reason:       ${item.rejectionReason}`);
      console.log("  " + "─".repeat(50));
    });
    console.log("\n  To approve: node scripts/manage_upi_payments.js approve <UTR_or_OrderId>");
    console.log("  To reject:  node scripts/manage_upi_payments.js reject <UTR_or_OrderId> [reason]\n");
    return;
  }

  if (command === "approve") {
    if (!targetRef) {
      console.error("❌ Error: Target UTR or Order ID is required.\nUsage: node scripts/manage_upi_payments.js approve <UTR_or_OrderId>");
      process.exit(1);
    }

    try {
      console.log(`\n🔍 Verifying UTR/Order: "${targetRef}" against HDFC credit...`);
      const res = await saasBillingService.confirmUpiPayment({
        orderId: targetRef,
        utr: targetRef,
        approvedBy: "Founder Praveen Mahawar"
      });

      console.log("\n🎉 [APPROVAL SUCCESSFUL]");
      console.log(`✓ Tenant ID:    ${res.subscription.tenantId}`);
      console.log(`✓ Plan:         ${res.subscription.plan.toUpperCase()}`);
      console.log(`✓ Status:       ${res.subscription.status.toUpperCase()}`);
      console.log(`✓ Provider:     ${res.subscription.provider}`);
      console.log(`✓ UTR Ref:      ${res.subscription.metadata?.utr}`);
      console.log(`✓ Period End:   ${res.subscription.currentPeriodEnd}`);
      console.log("\nSubscription is now ACTIVE and usage meter has been upgraded.\n");
    } catch (err) {
      console.error(`\n❌ Approval Failed: ${err.message}\n`);
      process.exit(1);
    }
    return;
  }

  if (command === "reject") {
    if (!targetRef) {
      console.error("❌ Error: Target UTR or Order ID is required.\nUsage: node scripts/manage_upi_payments.js reject <UTR_or_OrderId> [reason]");
      process.exit(1);
    }

    const reason = restArgs.join(" ") || "No matching credit found in HDFC account";

    try {
      console.log(`\n🔍 Rejecting UTR/Order: "${targetRef}"...`);
      const res = await saasBillingService.rejectUpiPayment({
        orderId: targetRef,
        utr: targetRef,
        reason,
        rejectedBy: "Founder Praveen Mahawar"
      });

      console.log("\n🚫 [SUBMISSION REJECTED]");
      console.log(`✗ UTR Ref: ${res.pendingPayment.utr}`);
      console.log(`✗ Tenant:  ${res.pendingPayment.tenantId}`);
      console.log(`✗ Status:  REJECTED`);
      console.log(`✗ Reason:  ${reason}\n`);
    } catch (err) {
      console.error(`\n❌ Rejection Failed: ${err.message}\n`);
      process.exit(1);
    }
    return;
  }

  console.log(`Unknown command: ${command}`);
  console.log("Usage: node scripts/manage_upi_payments.js [list|approve|reject]");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
