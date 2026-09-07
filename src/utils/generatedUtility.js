import { Platform } from 'react-native';

/**
 * GST Utility for cloth business
 * Provides functions to calculate GST, total amount, and format currency.
 */

/**
 * Calculate GST amount for a given base price.
 * @param {number} basePrice - The price before tax.
 * @param {number} gstRate - GST rate in percent (e.g., 5 for 5%).
 * @returns {number} GST amount rounded to two decimals.
 */
export const calculateGST = (basePrice, gstRate) => {
  if (typeof basePrice !== 'number' || typeof gstRate !== 'number') {
    throw new TypeError('basePrice and gstRate must be numbers');
  }
  const gst = (basePrice * gstRate) / 100;
  return Math.round(gst * 100) / 100;
};

/**
 * Calculate total price including GST.
 * @param {number} basePrice - The price before tax.
 * @param {number} gstRate - GST rate in percent.
 * @returns {number} Total price rounded to two decimals.
 */
export const calculateTotal = (basePrice, gstRate) => {
  const gst = calculateGST(basePrice, gstRate);
  const total = basePrice + gst;
  return Math.round(total * 100) / 100;
};

/**
 * Format a number as currency string based on device locale.
 * @param {number} amount - Amount to format.
 * @param {string} [currency='INR'] - Currency code.
 * @returns {string} Formatted currency string.
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (typeof amount !== 'number') {
    throw new TypeError('amount must be a number');
  }
  const locale = Platform.OS === 'ios' ? 'en-IN' : 'en-IN'; // fallback for Android
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Helper to parse user input (string) into a numeric value.
 * Removes any non‑numeric characters except decimal point.
 * @param {string} input
 * @returns {number}
 */
export const parsePriceInput = (input) => {
  if (typeof input !== 'string') return 0;
  const numeric = input.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numeric);
  return isNaN(parsed) ? 0 : parsed;
};

// Example usage (can be removed in production):
// const base = 1000;
// const gstRate = 5; // 5%
// console.log('GST:', calculateGST(base, gstRate));
// console.log('Total:', calculateTotal(base, gstRate));
// console.log('Formatted:', formatCurrency(calculateTotal(base, gstRate)));
