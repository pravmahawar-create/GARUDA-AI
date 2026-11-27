/**
 * 🦅 GARUDA ALPHA-QUANT: AGENT ALPHA-CRYPTO (24/7 DIGITAL ASSETS)
 * Mission AQ-001 — Phase 3.4 Parallel Agent Expansion
 * 
 * Specialization:
 * 1. High-Liquidity Digital Assets (BTC, ETH, SOL, BNB, XRP, ADA, DOGE)
 * 2. 24/7 Continuous Volatility Buffer: 2.5x ATR stops to prevent wick stop-outs
 * 3. Perpetual Funding Rate Drag Accounting (0.01% per 8-hour rollover)
 * 4. Weekend Liquidity Haircut: Reduces position sizing by 30% on Saturdays & Sundays
 * 5. Open Interest / Liquidation Sweep Expansion Filtering
 */

const { MarketRegime, MarketRegimeClassifier } = require('../strategies/marketRegimeClassifier');
const { ConfidenceCalibrationEngine } = require('../math/confidenceCalibrationEngine');

class AlphaCryptoAgent {
  constructor(options = {}) {
    this.id = 'Alpha-Crypto';
    this.name = 'Alpha-Crypto (24/7 Binance Spot & Perps)';
    this.assetClass = 'CRYPTO';
    this.calibrationEngine = options.calibrationEngine || new ConfidenceCalibrationEngine();
    this.productionThreshold = options.productionThreshold || 78;
    this.standardFundingRatePer8h = options.standardFundingRatePer8h || 0.0001; // 0.01% per 8h
    this.weekendHaircutPercent = 0.30; // 30% sizing haircut on weekends
    this.active = true;
  }

  /**
   * Check if current bar falls on the weekend (UTC Saturday/Sunday)
   */
  isWeekendLiquidityHaircutActive(timestamp) {
    const d = timestamp ? new Date(timestamp) : new Date();
    const day = d.getUTCDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Check if trading is permitted (Crypto trades 24/7 continuously)
   */
  isWithinTradingSession(dayOrTimestamp) {
    return { allowed: true, is24x7: true, session: 'CONTINUOUS_24_7' };
  }

  /**
   * Get liquidity multiplier taking into account 30% weekend haircut
   */
  getLiquidityMultiplier(dayOrTimestamp) {
    let isWeekend = false;
    if (typeof dayOrTimestamp === 'string' && (dayOrTimestamp === 'Saturday' || dayOrTimestamp === 'Sunday')) {
      isWeekend = true;
    } else {
      isWeekend = this.isWeekendLiquidityHaircutActive(dayOrTimestamp);
    }
    return isWeekend ? (1 - this.weekendHaircutPercent) : 1.0;
  }

  /**
   * Generate crypto setup with 2.5x ATR continuous volatility wick buffer
   */
  generateTradeSetup(direction, price, atr) {
    const stopDistance = Number((atr * 2.5).toFixed(2));
    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(2))
      : Number((price + stopDistance).toFixed(2));
    return { stopLoss, stopDistance };
  }

  /**
   * Calculate cumulative funding drag for a projected holding time
   * @param {number} notional Position gross notional
   * @param {number} holdingHours Projected holding duration in hours
   * @returns {number} Estimated funding cost
   */
  calculateFundingDrag(notional, holdingHours = 24) {
    const eightHourIntervals = Math.max(1, Math.ceil(holdingHours / 8));
    return Number((notional * this.standardFundingRatePer8h * eightHourIntervals).toFixed(2));
  }

  /**
   * Evaluate digital asset setups with 24/7 continuous volatility governance
   */
  evaluateSetup(symbol, candles, options = {}) {
    if (!this.active) {
      return { shouldTrade: false, agentId: this.id, reason: 'Alpha-Crypto agent is deactivated' };
    }

    if (!Array.isArray(candles) || candles.length < 28) {
      return { shouldTrade: false, agentId: this.id, reason: 'Insufficient candles for Alpha-Crypto analysis' };
    }

    const lastIdx = candles.length - 1;
    const currentCandle = candles[lastIdx];
    const isWeekend = this.isWeekendLiquidityHaircutActive(currentCandle.timestamp);

    // 1. Regime Classification & Hard Chop Veto
    const regimeContext = MarketRegimeClassifier.classify(candles);
    if (!regimeContext.canTrade || regimeContext.chopVetoActive) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'CHOP_VETO_ACTIVE',
        reason: `ADX ${regimeContext.adx ? regimeContext.adx.toFixed(1) : 0} < 22 chop veto active. Capital preserved.`
      };
    }

    const price = currentCandle.close;
    const atr = regimeContext.indicators.atr || (price * 0.02);
    const score = options.score || this.productionThreshold;

    const calibration = this.calibrationEngine.calibrateScore(score);
    if (!calibration.isQualified) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'CONFIDENCE_BELOW_THRESHOLD',
        reason: calibration.qualificationReason
      };
    }

    let direction = null;
    let action = null;

    if (regimeContext.regime === MarketRegime.TRENDING_BULLISH && regimeContext.superTrendDirection === 'BULLISH') {
      direction = 'BULLISH';
      action = 'BUY';
    } else if (regimeContext.regime === MarketRegime.TRENDING_BEARISH && regimeContext.superTrendDirection === 'BEARISH') {
      direction = 'BEARISH';
      action = 'SELL';
    } else if (regimeContext.regime === MarketRegime.VOLATILITY_EXPANSION) {
      direction = regimeContext.superTrendDirection === 'BULLISH' ? 'BULLISH' : 'BEARISH';
      action = direction === 'BULLISH' ? 'BUY' : 'SELL';
    } else {
      return {
        shouldTrade: false,
        agentId: this.id,
        reason: `Crypto regime ${regimeContext.regime} lacks high-probability momentum confluence`
      };
    }

    // 24/7 CONTINUOUS VOLATILITY BUFFER:
    // Crypto assets suffer violent wick sweeps. Stop loss is buffered to 2.5x ATR
    // to prevent getting flushed before trend continuation!
    const stopDistance = Number((atr * 2.50).toFixed(2));
    const t1Distance = Number((atr * 2.00).toFixed(2));
    const t2Distance = Number((atr * 4.50).toFixed(2));

    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(2))
      : Number((price + stopDistance).toFixed(2));

    const target1 = direction === 'BULLISH'
      ? Number((price + t1Distance).toFixed(2))
      : Number((price - t1Distance).toFixed(2));

    const target2 = direction === 'BULLISH'
      ? Number((price + t2Distance).toFixed(2))
      : Number((price - t2Distance).toFixed(2));

    const sizeMultiplier = isWeekend ? (1.0 - this.weekendHaircutPercent) : 1.0;

    return {
      shouldTrade: true,
      agentId: this.id,
      agentName: this.name,
      assetClass: this.assetClass,
      symbol,
      action,
      direction,
      price,
      stopLoss,
      target1,
      target2,
      riskPerShare: stopDistance,
      regime: regimeContext.regime,
      score,
      isWeekendHaircutActive: isWeekend,
      sizeMultiplier,
      calibratedProbability: calibration.calibratedProbability,
      timestamp: currentCandle.timestamp,
      rationale: `24/7 Crypto ${direction} momentum with 2.5x ATR wick buffer (Weekend Haircut: ${isWeekend ? '30%' : 'None'})`
    };
  }
}

module.exports = {
  AlphaCryptoAgent
};
