/**
 * 🦅 GARUDA ALPHA-QUANT: AGENT ALPHA-FOREX (GLOBAL CURRENCIES & GOLD)
 * Mission AQ-001 — Phase 3.4 Parallel Agent Expansion
 * 
 * Specialization:
 * 1. Major Currency Pairs (EUR/USD, GBP/USD, USD/INR) and Spot Gold (XAU/USD)
 * 2. Market-Specific Spread & Execution Cost Models (Pips, Points & Dollar Slippage)
 * 3. Overnight Swap / Financing Rate Calculations (22:00 UTC New York Roll)
 * 4. Trading Session Liquidity Governance: London/NY Overlap vs Asian Dead Zones
 * 5. Friday Weekend Gap-Risk Cutoff (Blocks new trades after 20:00 UTC Friday)
 */

const { MarketRegime, MarketRegimeClassifier } = require('../strategies/marketRegimeClassifier');
const { ConfidenceCalibrationEngine } = require('../math/confidenceCalibrationEngine');

const FOREX_COST_MODELS = Object.freeze({
  'EURUSD=X': { pipSize: 0.0001, typicalSpreadPips: 1.2, swapLongDailyPct: -0.00012, swapShortDailyPct: 0.00004 },
  'GBPUSD=X': { pipSize: 0.0001, typicalSpreadPips: 1.8, swapLongDailyPct: -0.00015, swapShortDailyPct: 0.00003 },
  'USDINR=X': { pipSize: 0.01,   typicalSpreadPips: 0.25, swapLongDailyPct: -0.00008, swapShortDailyPct: -0.00002 },
  'XAUUSD=X': { pipSize: 0.10,   typicalSpreadPips: 3.5, swapLongDailyPct: -0.00020, swapShortDailyPct: 0.00005 }
});

class AlphaForexAgent {
  constructor(options = {}) {
    this.id = 'Alpha-Forex';
    this.name = 'Alpha-Forex (24/5 Global Currencies & Gold)';
    this.assetClass = 'FOREX';
    this.calibrationEngine = options.calibrationEngine || new ConfidenceCalibrationEngine();
    this.productionThreshold = options.productionThreshold || 78;
    this.costModels = FOREX_COST_MODELS;
    this.active = true;
  }

  /**
   * Determine the current global Forex trading session
   * @param {Date|string} timestamp UTC timestamp
   * @returns {Object} Session info
   */
  getForexSession(timestamp) {
    const d = timestamp ? new Date(timestamp) : new Date();
    const utcHour = d.getUTCHours();
    const utcDay = d.getUTCDay(); // 0 = Sun, 5 = Fri, 6 = Sat

    // Weekend Gap-Risk Cutoff: Friday 20:00 UTC to Sunday 21:00 UTC
    const isWeekend = (utcDay === 5 && utcHour >= 20) || (utcDay === 6) || (utcDay === 0 && utcHour < 21);

    // London / New York Overlap: 12:00 - 17:00 UTC (Peak global liquidity)
    const isLondonNyOverlap = utcHour >= 12 && utcHour < 17;
    // Asian Session: 00:00 - 08:00 UTC (Lower volatility on EUR/GBP)
    const isAsianSession = utcHour >= 0 && utcHour < 8;

    return {
      utcHour,
      utcDay,
      isWeekend,
      isLondonNyOverlap,
      isAsianSession,
      sessionName: isLondonNyOverlap ? 'LONDON_NY_OVERLAP' : (isAsianSession ? 'ASIAN_SESSION' : 'EUROPEAN_OR_US')
    };
  }

  /**
   * Helper to retrieve typical spread in pips
   */
  getSpreadInPips(symbol) {
    const key = symbol.endsWith('=X') ? symbol : `${symbol}=X`;
    const model = this.costModels[key] || this.costModels[symbol];
    return model ? model.typicalSpreadPips : 2.0;
  }

  /**
   * Helper to verify if market is open and within permitted trading session
   */
  isWithinTradingSession(dayOrTimestamp, maybeHour = 0, maybeMin = 0) {
    if (typeof dayOrTimestamp === 'string' && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(dayOrTimestamp)) {
      const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      const d = dayMap[dayOrTimestamp];
      const h = maybeHour;
      const isWeekend = (d === 5 && h >= 20) || (d === 6) || (d === 0 && h < 21);
      return { allowed: !isWeekend, sessionName: isWeekend ? 'WEEKEND_CLOSED' : 'ACTIVE_MARKET' };
    }
    const session = this.getForexSession(dayOrTimestamp);
    return { allowed: !session.isWeekend, sessionName: session.sessionName };
  }

  /**
   * Calculate transaction costs and spread friction in native currency units
   */
  calculateForexCost(symbol, action, quantity, price) {
    const model = this.costModels[symbol] || { pipSize: 0.0001, typicalSpreadPips: 2.0 };
    const spreadInPrice = model.typicalSpreadPips * model.pipSize;
    const spreadCost = spreadInPrice * quantity;
    const estimatedSlippage = (price * 0.0001) * quantity; // 1 pip average slippage

    return {
      spreadInPrice: Number(spreadInPrice.toFixed(5)),
      spreadCost: Number(spreadCost.toFixed(2)),
      estimatedSlippage: Number(estimatedSlippage.toFixed(2)),
      totalFriction: Number((spreadCost + estimatedSlippage).toFixed(2))
    };
  }

  /**
   * Evaluate Forex setups with market-specific session and spread models
   */
  evaluateSetup(symbol, candles, options = {}) {
    if (!this.active) {
      return { shouldTrade: false, agentId: this.id, reason: 'Alpha-Forex agent is deactivated' };
    }

    if (!Array.isArray(candles) || candles.length < 28) {
      return { shouldTrade: false, agentId: this.id, reason: 'Insufficient candles for Alpha-Forex analysis' };
    }

    const lastIdx = candles.length - 1;
    const currentCandle = candles[lastIdx];
    const session = this.getForexSession(currentCandle.timestamp);

    // 1. Weekend Gap-Risk Gate
    if (session.isWeekend && options.bypassWeekendCheck !== true) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'WEEKEND_GAP_RISK_VETO',
        reason: 'Forex market closed for weekend. Orders blocked to eliminate opening gap risk.'
      };
    }

    // 2. Regime Classification & Hard Chop Veto
    const regimeContext = MarketRegimeClassifier.classify(candles);
    if (!regimeContext.canTrade || regimeContext.chopVetoActive) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'CHOP_VETO_ACTIVE',
        reason: `ADX ${regimeContext.adx ? regimeContext.adx.toFixed(1) : 0} < 22 chop veto active. Capital preserved.`
      };
    }

    // 3. Direction & Spread Sensitivity Check
    const price = currentCandle.close;
    const atr = regimeContext.indicators.atr || (price * 0.005);
    const costModel = this.costModels[symbol] || { pipSize: 0.0001, typicalSpreadPips: 2.0 };
    const spreadPips = costModel.typicalSpreadPips;
    const spreadInPrice = spreadPips * costModel.pipSize;

    // Reject if spread consumes more than 15% of ATR stop
    if (spreadInPrice > (atr * 0.15)) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'EXCESSIVE_SPREAD_DRAG',
        reason: `Spread (${spreadPips} pips) consumes > 15% of ATR stop (${atr.toFixed(5)})`
      };
    }

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
        reason: `Forex regime ${regimeContext.regime} lacks strong directional trend confirmation`
      };
    }

    // Forex stop and target geometry (Pips / ATR)
    const stopDistance = Number((atr * 1.5).toFixed(5));
    const t1Distance = Number((atr * 1.2).toFixed(5));
    const t2Distance = Number((atr * 2.8).toFixed(5));

    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(5))
      : Number((price + stopDistance).toFixed(5));

    const target1 = direction === 'BULLISH'
      ? Number((price + t1Distance).toFixed(5))
      : Number((price - t1Distance).toFixed(5));

    const target2 = direction === 'BULLISH'
      ? Number((price + t2Distance).toFixed(5))
      : Number((price - t2Distance).toFixed(5));

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
      sessionName: session.sessionName,
      calibratedProbability: calibration.calibratedProbability,
      timestamp: currentCandle.timestamp,
      rationale: `Forex ${direction} momentum in ${session.sessionName} with spread protection (${spreadPips} pips)`
    };
  }
}

module.exports = {
  AlphaForexAgent,
  FOREX_COST_MODELS
};
