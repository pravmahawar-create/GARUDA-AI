/**
 * 🦅 GARUDA ALPHA-QUANT: DETERMINISTIC SUPERTREND ENGINE
 * Mission AQ-001 — Phase 1 Mathematical Foundation
 * 
 * Invariants:
 * 1. 100% Deterministic: Zero LLM dependency or non-deterministic mathematical operations.
 * 2. Wilder True Range (TR) & Average True Range (ATR).
 * 3. Bounded Precision: Numerical outputs rounded to 4 decimals for ATR, 2 decimals for Price bands.
 * 4. Warm-Up Guard: First 'period' candles strictly return null / NEUTRAL.
 * 5. Trailing Band Monotonicity: Lower band never decreases during uptrend; Upper band never increases during downtrend.
 */

class SuperTrendEngine {
  /**
   * Calculate SuperTrend (period, multiplier) for a sequence of OHLCV candles
   * @param {Array<Object>} candles Array of { open, high, low, close, ... }
   * @param {number} [period=7] ATR lookback period
   * @param {number} [multiplier=3] ATR multiplier for band distance
   * @returns {Array<Object>} Array of { value, direction, upperBand, lowerBand, atr }
   */
  static calculateSuperTrend(candles, period = 7, multiplier = 3) {
    if (!Array.isArray(candles) || candles.length === 0) {
      return [];
    }

    const len = candles.length;
    const results = new Array(len);
    const tr = new Array(len);

    // 1. Calculate True Range for every candle
    for (let i = 0; i < len; i++) {
      const c = candles[i];
      if (!c || typeof c.high !== 'number' || typeof c.low !== 'number' || typeof c.close !== 'number') {
        tr[i] = 0;
        continue;
      }

      if (i === 0) {
        tr[i] = Math.max(0, c.high - c.low);
      } else {
        const prevC = candles[i - 1]?.close ?? c.open;
        tr[i] = Math.max(
          c.high - c.low,
          Math.abs(c.high - prevC),
          Math.abs(c.low - prevC)
        );
      }
    }

    // 2. Warm-Up Phase: Candles 0 to period - 1 return null / NEUTRAL
    const warmupLimit = Math.min(period, len);
    for (let i = 0; i < warmupLimit; i++) {
      results[i] = {
        value: null,
        direction: 'NEUTRAL',
        upperBand: null,
        lowerBand: null,
        atr: null
      };
    }

    if (len <= period) {
      return results;
    }

    // 3. Initial ATR at index = period (Simple average of first 'period' TRs: 1 to period)
    let trSum = 0;
    for (let i = 1; i <= period; i++) {
      trSum += tr[i];
    }
    let prevAtr = period > 0 ? (trSum / period) : 0;

    let prevFub = 0;
    let prevFlb = 0;
    let prevDir = 'NEUTRAL';

    // 4. Sequential Iterative Calculation
    for (let i = period; i < len; i++) {
      const c = candles[i];
      if (!c || typeof c.high !== 'number' || typeof c.low !== 'number' || typeof c.close !== 'number') {
        results[i] = { ...results[i - 1] };
        continue;
      }

      // Wilder smoothing for ATR
      let atr;
      if (i === period) {
        atr = prevAtr;
      } else {
        atr = (prevAtr * (period - 1) + tr[i]) / period;
      }
      prevAtr = atr;

      const hl2 = (c.high + c.low) / 2;
      const bub = Number((hl2 + (multiplier * atr)).toFixed(2));
      const blb = Number((hl2 - (multiplier * atr)).toFixed(2));

      let fub, flb;
      const prevC = candles[i - 1]?.close ?? c.open;

      if (i === period) {
        fub = bub;
        flb = blb;
      } else {
        // Upper Band Trailing Rule: Never move up during a downtrend
        fub = (bub < prevFub || prevC > prevFub) ? bub : prevFub;
        // Lower Band Trailing Rule: Never move down during an uptrend
        flb = (blb > prevFlb || prevC < prevFlb) ? blb : prevFlb;
      }

      let dir;
      let stValue;

      if (i === period) {
        if (c.close > fub) {
          dir = 'BULLISH';
          stValue = flb;
        } else if (c.close < flb) {
          dir = 'BEARISH';
          stValue = fub;
        } else {
          dir = (c.close >= hl2) ? 'BULLISH' : 'BEARISH';
          stValue = (dir === 'BULLISH') ? flb : fub;
        }
      } else {
        if (prevDir === 'BULLISH') {
          if (c.close < flb) {
            dir = 'BEARISH';
            stValue = fub;
          } else {
            dir = 'BULLISH';
            stValue = flb;
          }
        } else { // prevDir === 'BEARISH'
          if (c.close > fub) {
            dir = 'BULLISH';
            stValue = flb;
          } else {
            dir = 'BEARISH';
            stValue = fub;
          }
        }
      }

      prevFub = fub;
      prevFlb = flb;
      prevDir = dir;

      results[i] = {
        value: stValue,
        direction: dir,
        upperBand: fub,
        lowerBand: flb,
        atr: Number(atr.toFixed(4))
      };
    }

    return results;
  }
}

module.exports = { SuperTrendEngine };
