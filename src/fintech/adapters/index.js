/**
 * 🦅 GARUDA OS — PAYMENT PROVIDER REGISTRY
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 10
 * Controlled Pilot Mandate: Multi-Adapter Registry & Health Diagnostics
 */

const { PaymentProviderAdapter, PROVIDER_STATUSES } = require("./PaymentProviderAdapter");
const { MockBankAdapter } = require("./MockBankAdapter");
const { WioBankAdapter } = require("./WioBankAdapter");
const { IciciCorporateAdapter } = require("./IciciCorporateAdapter");
const { ModulrUkAdapter } = require("./ModulrUkAdapter");

const registry = new Map();

// Register built-in adapters
const mockAdapter = new MockBankAdapter();
const wioAdapter = new WioBankAdapter({
  apiKey: process.env.WIO_API_KEY,
  merchantId: process.env.WIO_MERCHANT_ID
});
const iciciAdapter = new IciciCorporateAdapter({
  corpId: process.env.ICICI_CORP_ID,
  clientCert: process.env.ICICI_CLIENT_CERT
});
const modulrAdapter = new ModulrUkAdapter({
  apiToken: process.env.MODULR_API_TOKEN,
  hmacSecret: process.env.MODULR_HMAC_SECRET
});

registry.set(mockAdapter.providerId, mockAdapter);
registry.set(wioAdapter.providerId, wioAdapter);
registry.set(iciciAdapter.providerId, iciciAdapter);
registry.set(modulrAdapter.providerId, modulrAdapter);

function getProvider(providerId) {
  const provider = registry.get(providerId);
  if (!provider) {
    throw new Error(`UNKNOWN_PROVIDER: No payment adapter registered for ID "${providerId}"`);
  }
  return provider;
}

function listProviders() {
  return Array.from(registry.values()).map(p => p.getStatus());
}

async function checkAllProvidersHealth() {
  const results = [];
  for (const adapter of registry.values()) {
    try {
      const health = await adapter.healthCheck();
      results.push(health);
    } catch (err) {
      results.push({
        providerId: adapter.providerId,
        providerName: adapter.providerName,
        status: "ERROR",
        error: err.message
      });
    }
  }
  return results;
}

module.exports = {
  registry,
  getProvider,
  listProviders,
  checkAllProvidersHealth,
  PaymentProviderAdapter,
  PROVIDER_STATUSES,
  MockBankAdapter,
  WioBankAdapter,
  IciciCorporateAdapter,
  ModulrUkAdapter
};
