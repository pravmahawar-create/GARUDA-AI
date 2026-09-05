/**
 * Calculate exponential growth.
 *
 * @param {number} initialValue - Starting amount (must be >= 0).
 * @param {number} growthRate - Growth rate per period (e.g., 0.05 for 5%).
 * @param {number} periods - Number of periods (must be a non‑negative integer).
 * @returns {number} Final value after applying exponential growth.
 * @throws {TypeError|RangeError} When inputs are invalid.
 */
function calculateExponentialGrowth(initialValue, growthRate, periods) {
  // ----- Validation -----
  if (typeof initialValue !== 'number' || typeof growthRate !== 'number' || typeof periods !== 'number') {
    throw new TypeError('All arguments must be numbers.');
  }
  if (!Number.isFinite(initialValue) || !Number.isFinite(growthRate) || !Number.isFinite(periods)) {
    throw new TypeError('Arguments must be finite numbers.');
  }
  if (initialValue < 0) {
    throw new RangeError('initialValue cannot be negative.');
  }
  if (!Number.isInteger(periods) || periods < 0) {
    throw new RangeError('periods must be a non‑negative integer.');
  }

  // ----- Calculation -----
  // final = initial * (1 + growthRate) ^ periods
  return initialValue * Math.pow(1 + growthRate, periods);
}

module.exports = {
  calculateExponentialGrowth,
};