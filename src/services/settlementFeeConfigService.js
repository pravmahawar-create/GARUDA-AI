const DEFAULT_PROVIDER_FEE_RATES = Object.freeze({
  razorpay: 2,
  stripe: 2.9,
  manual: 0
});

const PROVIDER_FEE_ENV_VARS = Object.freeze({
  razorpay: "RAZORPAY_FEE_RATE_PERCENT",
  stripe: "STRIPE_FEE_RATE_PERCENT",
  manual: null
});

function fail(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function normalizeProvider(provider) {
  return String(provider || "manual").toLowerCase().trim();
}

function isSupportedProvider(provider) {
  return Object.prototype.hasOwnProperty.call(DEFAULT_PROVIDER_FEE_RATES, provider);
}

function validateFeeRate(value, provider) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    fail(`Fee rate for provider '${provider}' must be between 0 and 100`);
  }
  return rate;
}

function getProviderFeeRate(provider, env = process.env) {
  const p = normalizeProvider(provider);
  if (!isSupportedProvider(p)) {
    fail(`Unsupported settlement provider '${p}'. Supported: ${Object.keys(DEFAULT_PROVIDER_FEE_RATES).join(", ")}`);
  }
  const fallback = DEFAULT_PROVIDER_FEE_RATES[p];
  const envVar = PROVIDER_FEE_ENV_VARS[p];
  const value = envVar ? (env[envVar] !== undefined && env[envVar] !== "" ? env[envVar] : fallback) : fallback;
  return validateFeeRate(value, p);
}

function getAllProviderFeeRates(env = process.env) {
  return Object.keys(DEFAULT_PROVIDER_FEE_RATES).reduce((acc, provider) => {
    acc[provider] = getProviderFeeRate(provider, env);
    return acc;
  }, {});
}

module.exports = {
  DEFAULT_PROVIDER_FEE_RATES,
  PROVIDER_FEE_ENV_VARS,
  normalizeProvider,
  isSupportedProvider,
  validateFeeRate,
  getProviderFeeRate,
  getAllProviderFeeRates
};