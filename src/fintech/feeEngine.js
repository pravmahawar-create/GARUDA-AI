/**
 * 🦅 GARUDA OS — DYNAMIC MULTI-TIER FEE CALCULATION ENGINE
 * Explicitly Demarcates Estimated Bank/Rail Fees from Contractual SaaS Licensing
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 15 & 18
 */

const VALUE_STATUS = Object.freeze({
  LIVE: "LIVE",
  CONTRACTUAL: "CONTRACTUAL",
  ESTIMATED: "ESTIMATED",
  UNKNOWN: "UNKNOWN"
});

class DynamicFeeEngine {
  /**
   * Calculates detailed fee breakdown for a transaction
   * @param {object} params
   * @returns {object} Full fee breakdown with itemized statuses
   */
  calculateFees({
    amount,
    currency = "USD",
    clearingRail = "FEDWIRE",
    merchantContract = {}
  }) {
    const grossAmount = Number(amount);
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      throw new Error("Invalid transaction amount for fee calculation");
    }

    // 1. Dynamic Interbank & Rail Fee estimation
    let railFee = 0;
    let bankFee = 0;
    let expectedLatency = "1 - 2 Business Days";
    let railStatus = VALUE_STATUS.ESTIMATED;

    switch (clearingRail.toUpperCase()) {
      case "FEDWIRE":
        railFee = 15.00;
        bankFee = 12.00;
        expectedLatency = "15 - 45 Minutes";
        break;
      case "ACH":
      case "SAME_DAY_ACH":
        railFee = 1.50;
        bankFee = 0.50;
        expectedLatency = "Same Business Day to 1 Business Day";
        break;
      case "FASTER_PAYMENTS":
      case "FPS":
        railFee = 0.50;
        bankFee = 0.50;
        expectedLatency = "15 - 30 Seconds";
        break;
      case "SEPA_INSTANT":
        railFee = 0.80;
        bankFee = 0.70;
        expectedLatency = "5 - 10 Seconds";
        break;
      case "UAE_IPI_AANI":
        railFee = 1.00; // AED
        bankFee = 0.50;
        expectedLatency = "10 - 30 Seconds";
        break;
      case "RTGS":
        railFee = 0.20; // ~$0.20 (₹15)
        bankFee = 0.10;
        expectedLatency = "Instant (Real-Time Gross Settlement)";
        break;
      case "SWIFT":
      default:
        railFee = 35.00;
        bankFee = 25.00;
        expectedLatency = "1 - 3 Business Days";
        break;
    }

    // 2. Foreign Exchange (FX) Spread Estimation (0 for same currency)
    const fxCost = 0.00; // Same currency domestic clearing rail

    // 3. Contractual GARUDA SaaS Fee (e.g. 0.15% = 0.0015)
    const saasRate = merchantContract.saasRate || 0.0015;
    const garudaSaaSFee = Math.round((grossAmount * saasRate) * 100) / 100;

    // 4. Statutory Taxes (VAT / GST on the software fee, if applicable)
    const taxRate = merchantContract.taxRate || 0.00;
    const taxes = Math.round((garudaSaaSFee * taxRate) * 100) / 100;

    // Total Cost
    const totalDeductedCost = Math.round((railFee + bankFee + fxCost + garudaSaaSFee + taxes) * 100) / 100;
    const merchantNetProceeds = Math.round((grossAmount - totalDeductedCost) * 100) / 100;

    return {
      grossAmount: { value: grossAmount, currency, status: VALUE_STATUS.LIVE },
      bankFee: { value: bankFee, currency, status: railStatus },
      railFee: { value: railFee, currency, status: railStatus },
      fxCost: { value: fxCost, currency, status: VALUE_STATUS.ESTIMATED },
      garudaSaaSFee: { value: garudaSaaSFee, ratePercent: saasRate * 100, currency, status: VALUE_STATUS.CONTRACTUAL },
      taxes: { value: taxes, currency, status: VALUE_STATUS.ESTIMATED },
      totalCost: { value: totalDeductedCost, currency, status: VALUE_STATUS.ESTIMATED },
      merchantNetProceeds: { value: merchantNetProceeds, currency, status: VALUE_STATUS.ESTIMATED },
      expectedSettlementWindow: expectedLatency,
      disclaimer: "Interbank and rail fees are estimates based on standard bank clearing tariffs. Final net credit reflects actual receiving institution ledger settlement."
    };
  }
}

const defaultFeeEngine = new DynamicFeeEngine();

module.exports = {
  VALUE_STATUS,
  DynamicFeeEngine,
  defaultFeeEngine
};
