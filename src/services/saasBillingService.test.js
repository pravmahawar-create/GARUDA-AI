const assert = require("assert");
const saasBillingService = require("./saasBillingService");

async function runTests() {
  console.log("▶ Running saasBillingService unit tests...");

  saasBillingService._resetMemoryStore();

  // Test 1: getPlanCatalog
  const catalog = saasBillingService.getPlanCatalog();
  assert(Array.isArray(catalog), "Plan catalog should be an array");
  assert.strictEqual(catalog.length, 4, "Should offer 4 plans");
  const planIds = catalog.map(p => p.planId);
  assert(planIds.includes("personal"), "Includes personal plan");
  assert(planIds.includes("creator"), "Includes creator plan");
  assert(planIds.includes("sme"), "Includes sme plan");
  assert(planIds.includes("enterprise"), "Includes enterprise plan");
  console.log("✓ Plan catalog verified (personal, creator, sme, enterprise)");

  // Test 2: getSubscription defaults to personal
  const sub = await saasBillingService.getSubscription("tenant_test_101");
  assert.strictEqual(sub.tenantId, "tenant_test_101");
  assert.strictEqual(sub.plan, "personal");
  assert.strictEqual(sub.status, "active");
  console.log("✓ Default personal subscription verified");

  // Test 3: getUsage and limits
  const usage = await saasBillingService.getUsage("tenant_test_101");
  assert.strictEqual(usage.tenantId, "tenant_test_101");
  assert.strictEqual(usage.limits.maxTokensPerMonth, 500000);
  assert.strictEqual(usage.tokenUsage.totalTokens, 0);
  console.log("✓ Usage meter initialized with plan limits");

  // Test 4: recordUsage
  const updatedUsage = await saasBillingService.recordUsage("tenant_test_101", {
    tokens: 2500,
    images: 2,
    videos: 1,
    apiHits: 10
  });
  assert.strictEqual(updatedUsage.tokenUsage.totalTokens, 2500);
  assert.strictEqual(updatedUsage.generationUsage.images, 2);
  assert.strictEqual(updatedUsage.generationUsage.videos, 1);
  assert.strictEqual(updatedUsage.apiHits, 10);
  console.log("✓ Usage record and increment verified");

  // Test 5: createSubscriptionOrder
  const order = await saasBillingService.createSubscriptionOrder({
    tenantId: "tenant_test_101",
    plan: "creator",
    interval: "monthly",
    currency: "INR"
  });
  assert.strictEqual(order.success, true);
  assert.strictEqual(order.amount, 1499);
  assert(order.orderId.startsWith("order_sub_"));
  console.log("✓ Subscription order creation verified");

  // Test 6: activateSubscription updates plan and usage limits
  const activation = await saasBillingService.activateSubscription({
    tenantId: "tenant_test_101",
    plan: "sme",
    interval: "monthly",
    paymentId: "pay_rzp_mock_12345",
    orderId: order.orderId
  });
  assert.strictEqual(activation.success, true);
  assert.strictEqual(activation.subscription.plan, "sme");
  assert.strictEqual(activation.subscription.status, "active");

  const newUsage = await saasBillingService.getUsage("tenant_test_101");
  assert.strictEqual(newUsage.limits.maxTokensPerMonth, 10000000);
  assert.strictEqual(newUsage.limits.maxGenerationsPerMonth, 1000);
  console.log("✓ Subscription activation and limit upgrade verified");

  console.log("All saasBillingService tests passed successfully!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
