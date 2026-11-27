/**
 * 🦅 GARUDA ALPHA-QUANT: DETERMINISTIC MARKET REGIME CLASSIFIER
 * Mission AQ-001 — Phase 3 Strategy Engine & Dynamic Adaptation
 * 
 * Classifies market conditions into discrete deterministic regimes:
 * 1. TRENDING_BULLISH: High ADX (>=22), Bullish SuperTrend, Price > EMA20 > EMA50
 * 2. TRENDING_BEARISH: High ADX (>=22), Bearish SuperTrend, Price < EMA20 < EMA50
 * 3. CHOP_SIDEWAYS: ADX < 22, BBW compressed -> Hard Veto Enforced
 * 4. VOLATILITY_EXPANSION: ATR spike > 1.4x baseline, expanding Bollinger Bands
 * 5. MEAN_REVERTING: Moderate ADX, RSI extremes (<30 or >70) at outer Bollinger Bands
 */

const { SuperTrendEngine } = require('../math/superTrendEngine');
const { ADXRegimeEngine } = require('../math/adxRegimeEngine');

const MarketRegime = Object.freeze({
  TRENDING_BULLISH: 'TRENDING_BULLISH',
  TRENDING_BEARISH: 'TRENDING_BEARISH',
  CHOP_SIDEWAYS: 'CHOP_SIDEWAYS',
  VOLATILITY_EXPANSION: 'VOLATILITY_EXPANSION',
  MEAN_REVERTING: 'MEAN_REVERTING',
  WARMING_UP: 'WARMING_UP'
});

const RegimePriority = Object.freeze({
  GATE_1_HARD_CHOP_VETO: 1,       // ADX < 22 -> Zero trading across ANY strategy (Non-negotiable)
  GATE_2_VOLATILITY_EXPANSION: 2, // ATR spike & BB expansion -> Breakout Strategy
  GATE_3_DIRECTIONAL_TREND: 3,    // ADX >= 22 & Directional -> Trend Momentum Strategy
  GATE_4_MEAN_REVERSION: 4        // Statistical extreme -> Strictly Quarantined due to negative expectancy
});

class MarketRegimeClassifier {
  /**
   * Calculate Exponential Moving Average (EMA)
   */
  static calculateEMA(candles, period) {
    if (!Array.isArray(candles) || candles.length < period) return new Array(candles.length).fill(null);
    const k = 2 / (period + 1);
    const ema = new Array(candles.length).fill(null);

    // Initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += candles[i].close;
    }
    ema[period - 1] = sum / period;

    for (let i = period; i < candles.length; i++) {
      ema[i] = (candles[i].close * k) + (ema[i - 1] * (1 - k));
    }
    return ema;
  }

  /**
   * Calculate Relative Strength Index (Wilder RSI 14)
   */
  static calculateRSI(candles, period = 14) {
    if (!Array.isArray(candles) || candles.length <= period) return new Array(candles.length).fill(null);
    const rsi = new Array(candles.length).fill(null);

    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

    for (let i = period + 1; i < candles.length; i++) {
      const diff = candles[i].close - candles[i - 1].close;
      const currentGain = diff > 0 ? diff : 0;
      const currentLoss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = ((avgGain * (period - 1)) + currentGain) / period;
      avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

      if (avgLoss === 0) {
        rsi[i] = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi[i] = Number((100 - (100 / (1 + rs))).toFixed(2));
      }
    }
    return rsi;
  }

  /**
   * Calculate Bollinger Bands (period=20, stdDev=2)
   */
  static calculateBollingerBands(candles, period = 20, multiplier = 2) {
    if (!Array.isArray(candles) || candles.length < period) return new Array(candles.length).fill(null);
    const bands = new Array(candles.length).fill(null);

    for (let i = period - 1; i < candles.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += candles[j].close;
      }
      const mean = sum / period;

      let varianceSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        varianceSum += Math.pow(candles[j].close - mean, 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);
      const upper = mean + (multiplier * stdDev);
      const lower = mean - (multiplier * stdDev);
      const width = mean > 0 ? ((upper - lower) / mean) * 100 : 0;

      bands[i] = {
        middle: Number(mean.toFixed(2)),
        upper: Number(upper.toFixed(2)),
        lower: Number(lower.toFixed(2)),
        bandwidth: Number(width.toFixed(4)),
        stdDev: Number(stdDev.toFixed(4))
      };
    }
    return bands;
  }

  /**
   * Classify the current market regime for a candle series
   * @param {Array<Object>} candles OHLCV candles
   * @returns {Object} Deterministic Regime Classification
   */
  static classify(candles) {
    if (!Array.isArray(candles) || candles.length < 28) {
      return {
        regime: MarketRegime.WARMING_UP,
        canTrade: false,
        chopVetoActive: true,
        adx: null,
        superTrendDirection: 'NEUTRAL',
        reasons: ['Insufficient candles for regime classification (minimum 28 required for Wilder ADX smoothing)']
      };
    }

    const lastIdx = candles.length - 1;
    const currentCandle = candles[lastIdx];

    // Compute indicators deterministically
    const superTrendSeries = SuperTrendEngine.calculateSuperTrend(candles, 7, 3);
    const adxSeries = ADXRegimeEngine.calculateADX(candles, 14, 22);
    const ema20Series = this.calculateEMA(candles, 20);
    const ema50Series = this.calculateEMA(candles, 50);
    const rsiSeries = this.calculateRSI(candles, 14);
    const bbSeries = this.calculateBollingerBands(candles, 20, 2);

    const st = superTrendSeries[lastIdx] || { direction: 'NEUTRAL', value: null, atr: 0 };
    const adxObj = adxSeries[lastIdx] || { adx: 0, canTrade: false, isChop: true };
    const ema20 = ema20Series[lastIdx];
    const ema50 = ema50Series[lastIdx];
    const rsi = rsiSeries[lastIdx];
    const bb = bbSeries[lastIdx] || { upper: currentCandle.close * 1.05, lower: currentCandle.close * 0.95, bandwidth: 2.0 };

    const adxVal = adxObj.adx != null ? adxObj.adx : 0;
    const currentPrice = currentCandle.close;
    const reasons = [];

    // Calculate rolling baseline ATR (last 20 candles)
    let sumAtr = 0;
    let countAtr = 0;
    for (let i = Math.max(0, lastIdx - 20); i <= lastIdx; i++) {
      if (superTrendSeries[i] && superTrendSeries[i].atr) {
        sumAtr += superTrendSeries[i].atr;
        countAtr++;
      }
    }
    const baselineAtr = countAtr > 0 ? (sumAtr / countAtr) : (st.atr || 1);
    const currentAtr = st.atr || baselineAtr;
    const atrRatio = baselineAtr > 0 ? (currentAtr / baselineAtr) : 1.0;

    // 1. HARD CHOP VETO RULE (ADX < 22)
    if (adxVal < 22 || adxObj.canTrade === false) {
      reasons.push(`ADX ${adxVal.toFixed(2)} is below 22.0 chop threshold`);
      if (bb.bandwidth < 1.5) reasons.push(`Bollinger Bandwidth ${bb.bandwidth.toFixed(2)}% indicates extreme compression`);
      return {
        regime: MarketRegime.CHOP_SIDEWAYS,
        canTrade: false,
        chopVetoActive: true,
        adx: adxVal,
        superTrendDirection: st.direction,
        indicators: {
          price: currentPrice,
          adx: adxVal,
          atr: currentAtr,
          atrRatio: Number(atrRatio.toFixed(2)),
          rsi: rsi,
          ema20: ema20 ? Number(ema20.toFixed(2)) : null,
          ema50: ema50 ? Number(ema50.toFixed(2)) : null,
          bollinger: bb
        },
        reasons
      };
    }

    // 2. VOLATILITY EXPANSION RULE
    if (atrRatio >= 1.40 && bb.bandwidth >= 4.0) {
      reasons.push(`ATR expansion: current ATR ${currentAtr.toFixed(2)} is ${(atrRatio * 100).toFixed(0)}% of baseline`);
      reasons.push(`Bollinger Bandwidth expanded to ${bb.bandwidth.toFixed(2)}%`);
      return {
        regime: MarketRegime.VOLATILITY_EXPANSION,
        canTrade: true,
        chopVetoActive: false,
        adx: adxVal,
        superTrendDirection: st.direction,
        indicators: {
          price: currentPrice,
          adx: adxVal,
          atr: currentAtr,
          atrRatio: Number(atrRatio.toFixed(2)),
          rsi: rsi,
          ema20: ema20 ? Number(ema20.toFixed(2)) : null,
          ema50: ema50 ? Number(ema50.toFixed(2)) : null,
          bollinger: bb
        },
        reasons
      };
    }

    // 3. MEAN REVERTING RULE
    if (rsi != null && (rsi <= 28 || rsi >= 72) && (currentPrice <= bb.lower || currentPrice >= bb.upper)) {
      reasons.push(`RSI ${rsi.toFixed(1)} is at extreme overbought/oversold`);
      reasons.push(`Price ₹${currentPrice} is outside Bollinger Bands [${bb.lower} - ${bb.upper}]`);
      return {
        regime: MarketRegime.MEAN_REVERTING,
        canTrade: true,
        chopVetoActive: false,
        adx: adxVal,
        superTrendDirection: st.direction,
        indicators: {
          price: currentPrice,
          adx: adxVal,
          atr: currentAtr,
          atrRatio: Number(atrRatio.toFixed(2)),
          rsi: rsi,
          ema20: ema20 ? Number(ema20.toFixed(2)) : null,
          ema50: ema50 ? Number(ema50.toFixed(2)) : null,
          bollinger: bb
        },
        reasons
      };
    }

    // 4. TRENDING BULLISH RULE
    if (st.direction === 'BULLISH' && ema20 != null && ema50 != null && currentPrice >= ema20 && ema20 >= ema50) {
      reasons.push(`ADX ${adxVal.toFixed(2)} >= 22 confirms strong trend strength`);
      reasons.push(`SuperTrend is BULLISH at ₹${st.value}`);
      reasons.push(`Price (₹${currentPrice}) >= EMA20 (₹${ema20.toFixed(2)}) >= EMA50 (₹${ema50.toFixed(2)})`);
      return {
        regime: MarketRegime.TRENDING_BULLISH,
        canTrade: true,
        chopVetoActive: false,
        adx: adxVal,
        superTrendDirection: 'BULLISH',
        indicators: {
          price: currentPrice,
          adx: adxVal,
          atr: currentAtr,
          atrRatio: Number(atrRatio.toFixed(2)),
          rsi: rsi,
          ema20: Number(ema20.toFixed(2)),
          ema50: Number(ema50.toFixed(2)),
          bollinger: bb
        },
        reasons
      };
    }

    // 5. TRENDING BEARISH RULE
    if (st.direction === 'BEARISH' && ema20 != null && ema50 != null && currentPrice <= ema20 && ema20 <= ema50) {
      reasons.push(`ADX ${adxVal.toFixed(2)} >= 22 confirms strong trend strength`);
      reasons.push(`SuperTrend is BEARISH at ₹${st.value}`);
      reasons.push(`Price (₹${currentPrice}) <= EMA20 (₹${ema20.toFixed(2)}) <= EMA50 (₹${ema50.toFixed(2)})`);
      return {
        regime: MarketRegime.TRENDING_BEARISH,
        canTrade: true,
        chopVetoActive: false,
        adx: adxVal,
        superTrendDirection: 'BEARISH',
        indicators: {
          price: currentPrice,
          adx: adxVal,
          atr: currentAtr,
          atrRatio: Number(atrRatio.toFixed(2)),
          rsi: rsi,
          ema20: Number(ema20.toFixed(2)),
          ema50: Number(ema50.toFixed(2)),
          bollinger: bb
        },
        reasons
      };
    }

    // Default Fallback when signals are mixed but ADX >= 22
    reasons.push(`ADX ${adxVal.toFixed(2)} >= 22, but moving averages and SuperTrend are not aligned in single direction`);
    return {
      regime: st.direction === 'BULLISH' ? MarketRegime.TRENDING_BULLISH : MarketRegime.TRENDING_BEARISH,
      canTrade: true,
      chopVetoActive: false,
      adx: adxVal,
      superTrendDirection: st.direction,
      indicators: {
        price: currentPrice,
        adx: adxVal,
        atr: currentAtr,
        atrRatio: Number(atrRatio.toFixed(2)),
        rsi: rsi,
        ema20: ema20 ? Number(ema20.toFixed(2)) : null,
        ema50: ema50 ? Number(ema50.toFixed(2)) : null,
        bollinger: bb
      },
      reasons
    };
  }
}

module.exports = {
  MarketRegimeClassifier,
  MarketRegime,
  RegimePriority
};
