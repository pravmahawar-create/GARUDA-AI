const assert = require("assert");
const {
  DEFAULT_PROVIDER_FEE_RATES,
  normalizeProvider,
  isSupportedProvider,
  validateFeeRate,
  getProviderFeeRate,
  getAllProviderFeeRates
} = require("./settlementFeeConfigService");

assert.deepStrictEqual(normalizeProvider("  Razorpay "), "razorpay");
assert.strictEqual(isSupportedProvider("razorpay"), true);
assert.strictEqual(isSupportedProvider("stripe"), true);
assert.strictEqual(isSupportedProvider("manual"), true);
assert.strictEqual(isSupportedProvider("paypal"), false);

assert.strictEqual(validateFeeRate(2.5, "razorpay"), 2.5);
assert.throws(() => validateFeeRate(-1, "razorpay"), /between 0 and 100/);
assert.throws(() => validateFeeRate(101, "razorpay"), /between 0 and 100/);

assert.strictEqual(getProviderFeeRate("razorpay", {}), 2);
assert.strictEqual(getProviderFeeRate("stripe", {}), 2.9);
assert.strictEqual(getProviderFeeRate("manual", {}), 0);
assert.strictEqual(getProviderFeeRate("razorpay", { RAZORPAY_FEE_RATE_PERCENT: "1.75" }), 1.75);
assert.throws(() => getProviderFeeRate("paypal", {}), /Unsupported settlement provider/);
assert.throws(() => getProviderFeeRate("razorpay", { RAZORPAY_FEE_RATE_PERCENT: "abc" }), /between 0 and 100/);

const all = getAllProviderFeeRates({ RAZORPAY_FEE_RATE_PERCENT: "1.5", STRIPE_FEE_RATE_PERCENT: "3" });
assert.deepStrictEqual(all, { razorpay: 1.5, stripe: 3, manual: 0 });

assert.deepStrictEqual(DEFAULT_PROVIDER_FEE_RATES, { razorpay: 2, stripe: 2.9, manual: 0 });
console.log("Settlement fee config validation test passed.");
