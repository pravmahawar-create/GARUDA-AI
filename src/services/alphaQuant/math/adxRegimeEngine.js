/**
 * 🦅 GARUDA ALPHA-QUANT: DETERMINISTIC ADX REGIME & CHOP FILTER ENGINE
 * Mission AQ-001 — Phase 1 Mathematical Foundation
 * 
 * Invariants:
 * 1. 100% Deterministic: J. Welles Wilder Jr. Directional Movement Index (DMI) and ADX.
 * 2. Warm-Up Guard: Minimum 2 * period (28 candles for period=14) required before ADX is valid.
 * 3. Zero-Denominator Defense: Divisors guarded against 0 to prevent NaN and Infinity.
 * 4. Bounded Range: +DI, -DI, DX, and ADX are strictly bounded in [0, 100].
 * 5. Hard Chop Veto: When ADX < threshold (default 22), strictly vetoes trading:
 *    { isChop: true, canTrade: false, regime: 'CHOP_CONSOLIDATION', vetoReason: 'ADX_REGIME_CHOP_FILTER_ACTIVE' }
 * 6. Directional Neutrality: ADX measures trend strength only. Direction is derived from +DI vs -DI.
 */

class ADXRegimeEngine {
  /**
   * Calculate Wilder's ADX(14), +DI, -DI and Regime status for a sequence of candles
   * @param {Array<Object>} candles Array of { open, high, low, close, ... }
   * @param {number} [period=14] Smoothing period
   * @param {number} [threshold=22] Chop filter threshold (ADX < threshold = Chop)
   * @returns {Array<Object>} Array of indicator objects
   */
  static calculateADX(candles, period = 14, threshold = 22) {
    if (!Array.isArray(candles) || candles.length === 0) {
      return [];
    }

    const len = candles.length;
    const minWarmup = period * 2;

    // Guard if insufficient candles for full Wilder smoothing
    if (len < minWarmup) {
      return candles.map(() => ({
        adx: null,
        plusDI: null,
        minusDI: null,
        dx: null,
        isChop: true,
        canTrade: false,
        regime: 'WARMING_UP',
        vetoReason: 'ADX_INSUFFICIENT_WARMUP',
        trendDirection: 'NEUTRAL'
      }));
    }

    const results = new Array(len);
    const tr = new Array(len);
    const plusDM = new Array(len);
    const minusDM = new Array(len);

    tr[0] = 0;
    plusDM[0] = 0;
    minusDM[0] = 0;

    // 1. Calculate True Range and Directional Movement
    for (let i = 1; i < len; i++) {
      const c = candles[i];
      const prev = candles[i - 1];

      if (!c || !prev || typeof c.high !== 'number' || typeof c.low !== 'number' || typeof c.close !== 'number') {
        tr[i] = 0;
        plusDM[i] = 0;
        minusDM[i] = 0;
        continue;
      }

      tr[i] = Math.max(
        Math.max(0, c.high - c.low),
        Math.abs(c.high - prev.close),
        Math.abs(c.low - prev.close)
      );

      const upMove = c.high - prev.high;
      const downMove = prev.low - c.low;

      plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
      minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
    }

    // 2. Initial Summation over first 'period' candles (indices 1 to period)
    let smoothedTR = 0;
    let smoothedPlusDM = 0;
    let smoothedMinusDM = 0;

    for (let i = 1; i <= period; i++) {
      smoothedTR += tr[i];
      smoothedPlusDM += plusDM[i];
      smoothedMinusDM += minusDM[i];
    }

    const plusDI = new Array(len).fill(null);
    const minusDI = new Array(len).fill(null);
    const dx = new Array(len).fill(null);

    // 3. Compute Smoothed DMI and DX
    for (let i = period; i < len; i++) {
      if (i > period) {
        smoothedTR = smoothedTR - (smoothedTR / period) + tr[i];
        smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
        smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];
      }

      const pDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
      const mDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

      plusDI[i] = Number(Math.min(100, Math.max(0, pDI)).toFixed(4));
      minusDI[i] = Number(Math.min(100, Math.max(0, mDI)).toFixed(4));

      const diSum = pDI + mDI;
      const diDiff = Math.abs(pDI - mDI);
      dx[i] = diSum > 0 ? Number(Math.min(100, Math.max(0, (diDiff / diSum) * 100)).toFixed(4)) : 0;
    }

    // Warm-up slots prior to 2 * period - 1
    const warmupEnd = 2 * period - 1;
    for (let i = 0; i < warmupEnd; i++) {
      results[i] = {
        adx: null,
        plusDI: plusDI[i],
        minusDI: minusDI[i],
        dx: dx[i],
        isChop: true,
        canTrade: false,
        regime: 'WARMING_UP',
        vetoReason: 'ADX_INSUFFICIENT_WARMUP',
        trendDirection: (plusDI[i] !== null && minusDI[i] !== null)
          ? (plusDI[i] >= minusDI[i] ? 'BULLISH' : 'BEARISH')
          : 'NEUTRAL'
      };
    }

    // 4. Initial ADX (Simple average of DX over period: indices period to 2*period - 1)
    let dxSum = 0;
    for (let i = period; i < 2 * period; i++) {
      dxSum += (dx[i] || 0);
    }
    let prevADX = period > 0 ? (dxSum / period) : 0;

    // 5. Wilder Smoothed ADX
    for (let i = warmupEnd; i < len; i++) {
      let currentADX;
      if (i === warmupEnd) {
        currentADX = prevADX;
      } else {
        currentADX = ((prevADX * (period - 1)) + (dx[i] || 0)) / period;
      }
      prevADX = currentADX;

      const adxVal = Number(Math.min(100, Math.max(0, currentADX)).toFixed(2));
      const isChop = adxVal < threshold;
      const regime = isChop ? 'CHOP_CONSOLIDATION' : 'TRENDING';
      const canTrade = !isChop;
      const vetoReason = isChop ? 'ADX_REGIME_CHOP_FILTER_ACTIVE' : null;
      const trendDirection = (plusDI[i] >= minusDI[i]) ? 'BULLISH' : 'BEARISH';

      results[i] = {
        adx: adxVal,
        plusDI: plusDI[i],
        minusDI: minusDI[i],
        dx: dx[i],
        isChop,
        canTrade,
        regime,
        vetoReason,
        trendDirection
      };
    }

    return results;
  }

  /**
   * Evaluate the regime of the latest completed candle
   * @param {Array<Object>} candles 
   * @param {number} [period=14] 
   * @param {number} [threshold=22] 
   * @returns {Object} Latest regime state
   */
  static evaluateRegime(candles, period = 14, threshold = 22) {
    const list = this.calculateADX(candles, period, threshold);
    if (list.length === 0) {
      return {
        adx: null,
        plusDI: null,
        minusDI: null,
        isChop: true,
        canTrade: false,
        regime: 'NO_DATA',
        vetoReason: 'CANDLES_ARRAY_EMPTY',
        trendDirection: 'NEUTRAL'
      };
    }
    return list[list.length - 1];
  }
}

module.exports = { ADXRegimeEngine };
