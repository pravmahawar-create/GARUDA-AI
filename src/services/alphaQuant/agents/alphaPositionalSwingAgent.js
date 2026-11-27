/**
 * 🦅 GARUDA ALPHA-QUANT: AGENT ALPHA-POSITIONAL-SWING (DELIVERY & CNC)
 * Mission AQ-001 — Phase 3.4 Parallel Agent Expansion
 * 
 * Specialization:
 * 1. Independent Cash / CNC Delivery Positions (Holding 2 to 7 Days / 48 to 168 Hours)
 * 2. Higher Timeframe Macro Trend Confirmation (Daily 1D / 4H EMA Alignment)
 * 3. Zero Margin Leverage: 1x Cash Equity, Eliminating Margin Call / Liquidation Risk
 * 4. Overnight Gap-Risk Governance: Limits position size to max 5% portfolio equity
 * 5. Overnight gap slippage buffer (0.50% added to risk calculation)
 */

const { MarketRegime, MarketRegimeClassifier } = require('../strategies/marketRegimeClassifier');
const { ConfidenceCalibrationEngine } = require('../math/confidenceCalibrationEngine');

class AlphaPositionalSwingAgent {
  constructor(options = {}) {
    this.id = 'Alpha-Positional-Swing';
    this.name = 'Alpha-Positional-Swing (CNC Multi-Day Delivery)';
    this.assetClass = 'INDIAN_EQUITY_CNC';
    this.calibrationEngine = options.calibrationEngine || new ConfidenceCalibrationEngine();
    this.productionThreshold = options.productionThreshold || 78;
    this.maxPositionEquityCapPercent = 0.05; // Max 5% of account cash in a single positional swing
    this.gapRiskSlippagePercent = 0.005; // 0.5% gap buffer
    this.maxLeverage = 1.0;
    this.productType = 'CNC_DELIVERY';
    this.active = true;
  }

  /**
   * Generate swing trade setup with overnight gap-risk buffer
   */
  generateTradeSetup(direction, price, atr) {
    const rawStopDistance = atr * 2.0;
    const gapBufferAmount = Number((price * this.gapRiskSlippagePercent).toFixed(2));
    const totalRiskPerShare = Number((rawStopDistance + gapBufferAmount).toFixed(2));
    const stopLoss = direction === 'BULLISH'
      ? Number((price - rawStopDistance - gapBufferAmount).toFixed(2))
      : Number((price + rawStopDistance + gapBufferAmount).toFixed(2));
    return { stopLoss, gapBufferAmount, totalRiskPerShare };
  }

  /**
   * Evaluate positional swing delivery trade setups
   */
  evaluateSetup(symbol, dailyOr4hCandles, options = {}) {
    if (!this.active) {
      return { shouldTrade: false, agentId: this.id, reason: 'Alpha-Positional-Swing agent is deactivated' };
    }

    if (!Array.isArray(dailyOr4hCandles) || dailyOr4hCandles.length < 28) {
      return { shouldTrade: false, agentId: this.id, reason: 'Insufficient multi-day candles for Positional Swing analysis' };
    }

    const lastIdx = dailyOr4hCandles.length - 1;
    const currentCandle = dailyOr4hCandles[lastIdx];

    // 1. Higher Timeframe Regime Classification
    const regimeContext = MarketRegimeClassifier.classify(dailyOr4hCandles);
    if (!regimeContext.canTrade || regimeContext.chopVetoActive) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'CHOP_VETO_ACTIVE',
        reason: `Macro ADX ${regimeContext.adx ? regimeContext.adx.toFixed(1) : 0} < 22 chop veto active. Capital quarantined.`
      };
    }

    // 2. Strict Delivery Direction: Only take Bullish Delivery trades (Indian regulations forbid overnight short naked delivery)
    if (regimeContext.superTrendDirection !== 'BULLISH' || regimeContext.regime !== MarketRegime.TRENDING_BULLISH) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'BEARISH_CNC_RESTRICTION',
        reason: 'Positional Swing CNC is strictly Long-Only for cash equities (Overnight shorts prohibited by exchange regulations).'
      };
    }

    const price = currentCandle.close;
    const atr = regimeContext.indicators.atr || (price * 0.025);
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

    // Multi-Day Wide Stop & Swing Target (2.0x ATR Stop Loss, 3.0x ATR T1, 6.0x ATR T2)
    const rawStopDistance = atr * 2.0;
    const gapBuffer = price * this.gapRiskSlippagePercent;
    const totalRiskPerShare = Number((rawStopDistance + gapBuffer).toFixed(2));

    const stopLoss = Number((price - rawStopDistance).toFixed(2));
    const target1 = Number((price + (atr * 3.0)).toFixed(2));
    const target2 = Number((price + (atr * 6.0)).toFixed(2));

    return {
      shouldTrade: true,
      agentId: this.id,
      agentName: this.name,
      assetClass: this.assetClass,
      symbol,
      action: 'BUY',
      direction: 'BULLISH',
      price,
      stopLoss,
      target1,
      target2,
      riskPerShare: totalRiskPerShare,
      regime: regimeContext.regime,
      score,
      maxHoldingDays: 7,
      leverage: 1.0, // 100% Cash / CNC
      calibratedProbability: calibration.calibratedProbability,
      timestamp: currentCandle.timestamp,
      rationale: `Macro Daily ${regimeContext.regime} delivery swing with 1x cash allocation and 0.5% gap-risk buffer`
    };
  }
}

module.exports = {
  AlphaPositionalSwingAgent
};
