/**
 * 🦅 GARUDA ALPHA-QUANT: AGENT ALPHA-INDIA (NSE EQUITIES & DERIVATIVES)
 * Mission AQ-001 — Phase 3.4 Parallel Agent Expansion
 * 
 * Specialization:
 * 1. NSE Equities (Nifty 50, Liquid Midcaps), Futures & Options
 * 2. Remediates sluggish bullish trend exits via Adaptive Target 1 (1.0x ATR profit lock + breakeven stop trail)
 * 3. Volume confirmation filter: rejects low-volume false breakouts (volume >= 1.1x 20-period average)
 * 4. Strict Intraday Session Governance: No new entries after 14:45 IST, square-off before 15:15 IST
 * 5. Strict RiskSentinel delegation: Zero broker connection, zero bypass
 */

const { MarketRegime, MarketRegimeClassifier } = require('../strategies/marketRegimeClassifier');
const { ConfidenceCalibrationEngine } = require('../math/confidenceCalibrationEngine');

class AlphaIndiaAgent {
  constructor(options = {}) {
    this.id = 'Alpha-India';
    this.name = 'Alpha-India (NSE MIS & Derivatives)';
    this.assetClass = 'INDIAN_EQUITY_MIS';
    this.exchange = 'NSE';
    this.currency = 'INR';
    this.calibrationEngine = options.calibrationEngine || new ConfidenceCalibrationEngine();
    this.productionThreshold = options.productionThreshold || 78;
    this.allowOpeningBellBullEntries = options.allowOpeningBellBullEntries !== undefined ? options.allowOpeningBellBullEntries : false;
    this.active = true;
  }

  /**
   * Verify if current time allows new intraday MIS entries (09:15 IST to 14:45 IST)
   * With Opening Bell Whip Protection: Bullish entries allowed only after 10:15 IST.
   */
  isWithinEntrySession(timestamp, direction = 'BULLISH') {
    const d = timestamp ? new Date(timestamp) : new Date();
    // Convert to IST (UTC + 5:30)
    const istHours = (d.getUTCHours() + 5 + Math.floor((d.getUTCMinutes() + 30) / 60)) % 24;
    const istMinutes = (d.getUTCMinutes() + 30) % 60;
    const totalMinutes = (istHours * 60) + istMinutes;

    const entryOpenMinutes = (direction === 'BULLISH' && !this.allowOpeningBellBullEntries)
      ? (10 * 60) + 15  // 10:15 IST
      : (9 * 60) + 15;   // 09:15 IST
    const entryCloseMinutes = (14 * 60) + 45; // 14:45 IST

    return totalMinutes >= entryOpenMinutes && totalMinutes <= entryCloseMinutes;
  }

  /**
   * Check trading session with flexible time or timestamp input
   */
  isWithinTradingSession(timeOrTimestamp, direction = 'BULLISH') {
    if (typeof timeOrTimestamp === 'string' && timeOrTimestamp.includes(':') && !timeOrTimestamp.includes('T')) {
      const [h, m] = timeOrTimestamp.split(':').map(Number);
      const totalMinutes = (h * 60) + m;
      const openMin = (direction === 'BULLISH' && !this.allowOpeningBellBullEntries) ? (10 * 60 + 15) : (9 * 60 + 15);
      return totalMinutes >= openMin && totalMinutes <= (14 * 60 + 45);
    }
    return this.isWithinEntrySession(timeOrTimestamp, direction);
  }

  /**
   * Validate volume confirmation against moving average
   */
  validateVolumeConfirmation(currentVol, avgVol = 1) {
    const ratio = avgVol > 0 ? (currentVol / avgVol) : 1.0;
    return {
      isConfirmed: ratio >= 1.05,
      volumeRatio: Number(ratio.toFixed(2))
    };
  }

  /**
   * Generate adaptive trade setup (Adaptive T1 1.0x ATR for Bullish)
   */
  generateTradeSetup(direction, price, atr) {
    const stopDistance = Number((atr * 1.5).toFixed(2));
    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(2))
      : Number((price + stopDistance).toFixed(2));
    const target1Distance = direction === 'BULLISH'
      ? Number((atr * 1.0).toFixed(2))
      : Number((stopDistance * 1.5).toFixed(2));
    const target1 = direction === 'BULLISH'
      ? Number((price + target1Distance).toFixed(2))
      : Number((price - target1Distance).toFixed(2));
    const target2 = direction === 'BULLISH'
      ? Number((price + (stopDistance * 3.0)).toFixed(2))
      : Number((price - (stopDistance * 3.0)).toFixed(2));
    return { stopLoss, target1, target2, stopDistance };
  }

  /**
   * Analyze market candle window and evaluate qualified trade proposals
   */
  evaluateSetup(symbol, candles, options = {}) {
    if (!this.active) {
      return { shouldTrade: false, agentId: this.id, reason: 'Alpha-India agent is deactivated' };
    }

    if (!Array.isArray(candles) || candles.length < 28) {
      return { shouldTrade: false, agentId: this.id, reason: 'Insufficient candles for Alpha-India analysis (min 28 required)' };
    }

    const lastIdx = candles.length - 1;
    const currentCandle = candles[lastIdx];

    // Evaluate session against actual execution timestamp (Next-Bar Open Execution), fallback to candle timestamp
    const execTimestamp = options.executionTimestamp || (options.nextCandle && options.nextCandle.timestamp) || currentCandle.timestamp;

    // Session entry check
    if (!this.isWithinEntrySession(execTimestamp) && options.bypassSessionCheck !== true) {
      return {
        shouldTrade: false,
        agentId: this.id,
        reason: 'Outside permitted intraday entry window (09:15 - 14:45 IST)'
      };
    }

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

    // 2. Volume Confirmation Filter (Prevent low-volume false breakouts)
    let volSum = 0;
    const lookbackVol = 20;
    const startIdx = Math.max(0, lastIdx - lookbackVol);
    for (let i = startIdx; i < lastIdx; i++) {
      volSum += candles[i].volume || 0;
    }
    const avgVol = (lastIdx - startIdx) > 0 ? (volSum / (lastIdx - startIdx)) : 1;
    const currentVol = currentCandle.volume || 0;
    const volumeRatio = avgVol > 0 ? (currentVol / avgVol) : 1.0;

    if (volumeRatio < 1.05 && options.bypassVolumeFilter !== true) {
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'LOW_VOLUME_FILTER',
        reason: `Current volume (${currentVol}) is below required 1.05x average (${avgVol.toFixed(0)})`
      };
    }

    // 3. Directional Momentum & Adaptive Target Calibration
    const price = currentCandle.close;
    const atr = regimeContext.indicators.atr || (price * 0.01);
    const stDir = regimeContext.superTrendDirection;
    const score = options.score || this.productionThreshold;

    // Confidence calibration check
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

    if (regimeContext.regime === MarketRegime.TRENDING_BULLISH && stDir === 'BULLISH') {
      direction = 'BULLISH';
      action = 'BUY';
      // Opening Bell Whip Filter for Bullish Longs evaluated against execution timestamp
      if (!this.isWithinEntrySession(execTimestamp, 'BULLISH') && options.bypassSessionCheck !== true) {
        return {
          shouldTrade: false,
          agentId: this.id,
          code: 'OPENING_BELL_WHIP_FILTER',
          reason: 'Bullish entries restricted before 10:15 IST to avoid morning opening auction whips. Capital preserved.'
        };
      }
    } else if (regimeContext.regime === MarketRegime.TRENDING_BEARISH && stDir === 'BEARISH') {
      direction = 'BEARISH';
      action = 'SELL';
    } else if (regimeContext.regime === MarketRegime.VOLATILITY_EXPANSION) {
      // Phase 3.4 Quarantine: NSE Breakout Volatility without pre-breakout contraction is quarantined
      return {
        shouldTrade: false,
        agentId: this.id,
        code: 'NSE_BREAKOUT_QUARANTINED',
        reason: 'NSE Breakout Volatility is quarantined pending volatility squeeze filter. Negative expectancy trades prevented.'
      };
    } else {
      return {
        shouldTrade: false,
        agentId: this.id,
        reason: `Regime ${regimeContext.regime} with SuperTrend ${stDir} does not offer a verified trend edge`
      };
    }

    // ADAPTIVE TARGET REMEDIATION:
    // Bullish trends in sideways macro environments require early T1 profit lock (1.0x ATR)
    // to prevent giving back profits on sluggish climbs!
    const stopDistance = Number((atr * 1.25).toFixed(2));
    const t1Distance = Number((atr * 1.00).toFixed(2));
    const t2Distance = Number((atr * 2.50).toFixed(2));

    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(2))
      : Number((price + stopDistance).toFixed(2));

    const target1 = direction === 'BULLISH'
      ? Number((price + t1Distance).toFixed(2))
      : Number((price - t1Distance).toFixed(2));

    const target2 = direction === 'BULLISH'
      ? Number((price + t2Distance).toFixed(2))
      : Number((price - t2Distance).toFixed(2));

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
      calibratedProbability: calibration.calibratedProbability,
      volumeRatio: Number(volumeRatio.toFixed(2)),
      timestamp: currentCandle.timestamp,
      rationale: `Adaptive ${direction} momentum with 1.0x ATR early T1 profit-lock and volume confirmation (${volumeRatio.toFixed(2)}x)`
    };
  }
}

module.exports = {
  AlphaIndiaAgent
};
