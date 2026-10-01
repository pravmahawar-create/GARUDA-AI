/**
 * 🦅 GARUDA OS — PREPAID SAAS FUEL TANK SERVICE
 * Metered Technology Licensing Credit Management
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 6 & 13
 */

const { validateLedgerSeparation } = require("./zeroCustodyEnforcer");

class FuelTankService {
  constructor() {
    this.merchantBalances = new Map(); // merchantId -> balanceNumber
  }

  /**
   * Top up the merchant's prepaid software maintenance balance
   * @param {string} merchantId
   * @param {number} amount - Amount in USD/INR of software license credits
   * @param {object} metadata - Payment reference for the software invoice
   */
  topUp(merchantId, amount, metadata = {}) {
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new Error("Top up amount must be a positive number");
    }

    validateLedgerSeparation("GARUDA_SAAS_CREDITS", {
      representsCustomerPrincipal: false,
      action: "TOP_UP_SOFTWARE_CREDITS",
      amount: numAmount
    });

    const current = this.merchantBalances.get(merchantId) || 0;
    const next = Math.round((current + numAmount) * 100) / 100;
    this.merchantBalances.set(merchantId, next);

    return {
      merchantId,
      previousBalance: current,
      newBalance: next,
      creditedAmount: numAmount,
      invoiceRef: metadata.invoiceRef || null,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Checks if merchant has sufficient software credits to create a new payment intent
   */
  hasSufficientFuel(merchantId) {
    const balance = this.merchantBalances.get(merchantId) || 0;
    return balance > 0;
  }

  /**
   * Deducts metered SaaS technology fee upon verified settlement
   * @param {string} merchantId
   * @param {number} orchestratedVolume - Gross amount settled in bank
   * @param {number} ratePercent - Agreed technology fee rate (e.g. 0.15% = 0.0015)
   */
  deductSaaSFee(merchantId, orchestratedVolume, ratePercent = 0.0015) {
    const feeAmount = Math.round((orchestratedVolume * ratePercent) * 100) / 100;
    const current = this.merchantBalances.get(merchantId) || 0;

    validateLedgerSeparation("GARUDA_SAAS_CREDITS", {
      representsCustomerPrincipal: false,
      action: "METERED_SAAS_DEDUCTION",
      feeAmount
    });

    // We allow balance to dip slightly negative or to zero without aborting an in-flight settlement,
    // but future new payment requests will be gated until refueled.
    const next = Math.round((current - feeAmount) * 100) / 100;
    this.merchantBalances.set(merchantId, next);

    return {
      merchantId,
      orchestratedVolume,
      ratePercent,
      feeDeducted: feeAmount,
      remainingBalance: next,
      lowFuelWarning: next <= 100,
      suspendedForNewOrders: next <= 0,
      timestamp: new Date().toISOString()
    };
  }

  getBalance(merchantId) {
    return this.merchantBalances.get(merchantId) || 0;
  }
}

const defaultFuelTank = new FuelTankService();

module.exports = {
  FuelTankService,
  defaultFuelTank
};
