/**
 * 🦅 GARUDA Alpha-Quant: 5-Factor Institutional Confluence Scorer
 * Calculates high-conviction probability score (0% to 100%).
 * Strictly filters out low-conviction noise: ONLY triggers when Score >= 75%.
 */

class ConfluenceScorer {
  constructor(options = {}) {
    this.minConfidenceThreshold = options.minConfidenceThreshold || 75; // 75% Hard rule
  }

  /**
   * Evaluate a single candle setup with surrounding context
   */
  evaluateSetup(currentCandle, history, benchmarkCandle = null, options = {}) {
    if (!currentCandle || !history || history.length < 20) {
      return { isQualified: false, score: 0, reason: 'Insufficient historical data' };
    }

    const {
      close, high, low, open,
      ema9, ema21, ema50, ema200,
      rsi, macd, macdSignal, macdHist,
      volume, volumeRatio, vwap, atr, time
    } = currentCandle;

    const prevCandle = history[history.length - 1];

    // ==========================================
    // 0. TIME-OF-DAY INSTITUTIONAL FILTER (IST)
    // ==========================================
    const is24x7 = Boolean(options.is24x7 || options.assetClass === 'Crypto' || options.assetClass === 'Forex');
    if (!is24x7 && time instanceof Date) {
      const totalMinutesIST = (time.getUTCHours() * 60 + time.getUTCMinutes() + 330) % 1440;
      // Morning Window: 9:45 AM (585m) to 11:30 AM (690m)
      // Afternoon Window: 1:15 PM (795m) to 2:45 PM (885m)
      const inHighProbabilityWindow = (totalMinutesIST >= 585 && totalMinutesIST <= 690) ||
                                      (totalMinutesIST >= 795 && totalMinutesIST <= 885);

      if (!inHighProbabilityWindow) {
        return {
          isQualified: false,
          score: 0,
          direction: 'NEUTRAL',
          action: 'HOLD',
          reason: 'Outside high-conviction institutional window (Avoiding opening chop & lunch lull)'
        };
      }
    }

    // Benchmark trend classification: BULLISH, BEARISH, or SIDEWAYS
    let niftyTrend = 'SIDEWAYS';
    if (benchmarkCandle && benchmarkCandle.ema9 && benchmarkCandle.ema21) {
      if (benchmarkCandle.ema9 > benchmarkCandle.ema21 && benchmarkCandle.close >= benchmarkCandle.ema21) {
        niftyTrend = 'BULLISH';
      } else if (benchmarkCandle.ema9 < benchmarkCandle.ema21 && benchmarkCandle.close <= benchmarkCandle.ema21) {
        niftyTrend = 'BEARISH';
      }
    }

    const candleRange = high - low;
    const isStrongBullCandle = candleRange > 0 && ((close - low) / candleRange) >= 0.65 && close > open;
    const isStrongBearCandle = candleRange > 0 && ((high - close) / candleRange) >= 0.65 && close < open;

    // Over-extension check (distance from 21 EMA > 1.2% is chasing)
    const isOverExtended = ema21 ? (Math.abs(close - ema21) / ema21) > 0.012 : false;

    // ==========================================
    // 1. BULLISH SCORING PASS
    // ==========================================
    let bullScore = 0;
    const bullFactors = [];

    // Factor 1: Trend Alignment (Max 20 pts)
    if (ema9 && ema21 && ema50) {
      if (ema9 > ema21 && ema21 > ema50) {
        bullScore += 15;
        bullFactors.push('Strong Bullish Trend: 9 EMA > 21 EMA > 50 EMA');
      } else if (ema9 > ema21) {
        bullScore += 10;
        bullFactors.push('Short-term Bullish Momentum: 9 EMA > 21 EMA');
      }

      if (ema200 && close > ema200) {
        bullScore += 5;
        bullFactors.push('Above 200 EMA Baseline (Long-Term Bullish)');
      }
    }

    // Factor 2: Momentum - RSI & MACD (Max 20 pts)
    if (rsi != null) {
      if (rsi >= 54 && rsi <= 67) {
        bullScore += 10;
        bullFactors.push(`RSI Ideal Bullish Sweet-Spot (${rsi}) — High Velocity`);
      } else if (rsi > 50 && rsi < 54) {
        bullScore += 5;
        bullFactors.push(`RSI Bullish Bias (${rsi})`);
      }
    }

    if (macdHist != null && macdSignal != null) {
      if (macd > macdSignal && macdHist > 0) {
        bullScore += 10;
        bullFactors.push('MACD Line above Signal & Histogram Positive');
      } else if (macdHist > (prevCandle.macdHist || 0)) {
        bullScore += 5;
        bullFactors.push('MACD Histogram Expanding Green');
      }
    }

    // Factor 3: Institutional Volume Surge (Max 25 pts)
    if (volumeRatio >= 1.8 && isStrongBullCandle) {
      bullScore += 25;
      bullFactors.push(`Massive Institutional Volume Surge (${volumeRatio}x 20-period avg) with Conviction Close`);
    } else if (volumeRatio >= 1.4) {
      bullScore += 18;
      bullFactors.push(`High Institutional Participation (${volumeRatio}x avg volume)`);
    } else if (volumeRatio >= 1.15) {
      bullScore += 10;
      bullFactors.push(`Above Average Volume (${volumeRatio}x avg volume)`);
    }

    // Factor 4: VWAP & Price Action Breakout (Max 20 pts)
    if (vwap) {
      const recentHighs = history.slice(-5).map(c => c.high);
      const prev5High = Math.max(...recentHighs);

      if (close > vwap && close >= prev5High && isStrongBullCandle) {
        bullScore += 20;
        bullFactors.push('Decisive Price Action Breakout above 5-Candle High & VWAP');
      } else if (close > vwap && low >= vwap * 0.998) {
        bullScore += 12;
        bullFactors.push('Price strongly respecting VWAP as institutional support');
      }
    }

    // Factor 5: Benchmark / Market Tide Confluence (Max 15 pts)
    if (benchmarkCandle && benchmarkCandle.ema9 && benchmarkCandle.ema21) {
      if (benchmarkCandle.ema9 > benchmarkCandle.ema21 && benchmarkCandle.close > benchmarkCandle.open) {
        bullScore += 15;
        bullFactors.push('Market Tide Alignment: Nifty 50 Benchmark is Bullish');
      } else if (benchmarkCandle.close > (benchmarkCandle.vwap || benchmarkCandle.open)) {
        bullScore += 8;
        bullFactors.push('Nifty 50 in green territory');
      }
    } else {
      bullScore += 8;
    }

    // Deduct penalty if overextended or weak wick
    if (isOverExtended) {
      bullScore -= 20;
    }
    if (!isStrongBullCandle && bullScore > 0) {
      bullScore -= 10;
    }

    // ==========================================
    // 2. BEARISH SCORING PASS
    // ==========================================
    let bearScore = 0;
    const bearFactors = [];

    // Factor 1: Trend Alignment (Max 20 pts)
    if (ema9 && ema21 && ema50) {
      if (ema9 < ema21 && ema21 < ema50) {
        bearScore += 15;
        bearFactors.push('Strong Bearish Trend: 9 EMA < 21 EMA < 50 EMA');
      } else if (ema9 < ema21) {
        bearScore += 10;
        bearFactors.push('Short-term Bearish Momentum: 9 EMA < 21 EMA');
      }

      if (ema200 && close < ema200) {
        bearScore += 5;
        bearFactors.push('Below 200 EMA Baseline (Long-Term Bearish)');
      }
    }

    // Factor 2: Momentum - RSI & MACD (Max 20 pts)
    if (rsi != null) {
      if (rsi >= 33 && rsi <= 46) {
        bearScore += 10;
        bearFactors.push(`RSI Ideal Bearish Breakdown Zone (${rsi})`);
      } else if (rsi < 50 && rsi > 46) {
        bearScore += 5;
        bearFactors.push(`RSI Bearish Bias (${rsi})`);
      }
    }

    if (macdHist != null && macdSignal != null) {
      if (macd < macdSignal && macdHist < 0) {
        bearScore += 10;
        bearFactors.push('MACD Line below Signal & Histogram Negative');
      } else if (macdHist < (prevCandle.macdHist || 0)) {
        bearScore += 5;
        bearFactors.push('MACD Histogram Expanding Red');
      }
    }

    // Factor 3: Institutional Volume Surge (Max 25 pts)
    if (volumeRatio >= 1.8 && isStrongBearCandle) {
      bearScore += 25;
      bearFactors.push(`Massive Institutional Selling Volume (${volumeRatio}x 20-period avg)`);
    } else if (volumeRatio >= 1.4) {
      bearScore += 18;
      bearFactors.push(`High Institutional Distribution (${volumeRatio}x avg volume)`);
    } else if (volumeRatio >= 1.15) {
      bearScore += 10;
      bearFactors.push(`Above Average Volume (${volumeRatio}x avg volume)`);
    }

    // Factor 4: VWAP & Price Action Breakdown (Max 20 pts)
    if (vwap) {
      const recentLows = history.slice(-5).map(c => c.low);
      const prev5Low = Math.min(...recentLows);

      if (close < vwap && close <= prev5Low && isStrongBearCandle) {
        bearScore += 20;
        bearFactors.push('Decisive Price Action Breakdown below 5-Candle Low & VWAP');
      } else if (close < vwap) {
        bearScore += 12;
        bearFactors.push('Price rejected by VWAP resistance');
      }
    }

    // Factor 5: Benchmark / Market Tide Confluence (Max 15 pts)
    if (benchmarkCandle && benchmarkCandle.ema9 && benchmarkCandle.ema21) {
      if (benchmarkCandle.ema9 < benchmarkCandle.ema21 && benchmarkCandle.close < benchmarkCandle.open) {
        bearScore += 15;
        bearFactors.push('Market Tide Alignment: Nifty 50 Benchmark is Bearish');
      } else if (benchmarkCandle.close < (benchmarkCandle.vwap || benchmarkCandle.open)) {
        bearScore += 8;
        bearFactors.push('Nifty 50 in red territory');
      }
    } else {
      bearScore += 8;
    }

    // Factor 6: ADX Trend Strength & Anti-Chop Guard (Max 15 pts)
    const adx = currentCandle.adx;
    if (adx != null) {
      if (adx >= 25) {
        bullScore += 15;
        bearScore += 15;
        bullFactors.push(`Strong Directional Trend (ADX: ${adx} ≥ 25)`);
        bearFactors.push(`Strong Directional Trend (ADX: ${adx} ≥ 25)`);
      } else if (adx < 20) {
        bullScore -= 25;
        bearScore -= 25;
        bullFactors.push(`Low Trend Strength (ADX: ${adx} < 20) — Sideways Chop Risk`);
        bearFactors.push(`Low Trend Strength (ADX: ${adx} < 20) — Sideways Chop Risk`);
      }
    }

    // Deduct penalty if overextended, weak wick, or opposing Nifty tide
    if (isOverExtended) {
      bearScore -= 20;
    }
    if (!isStrongBearCandle && bearScore > 0) {
      bearScore -= 10;
    }
    // Hard Institutional Tape Defense: Never fight the primary benchmark tide
    if (niftyTrend === 'BEARISH') {
      bullScore = 0; // Strictly zero buy signals in a falling tide
    }
    // Factor 7: Big-3 Heavyweights Confluence (Reliance, HDFC Bank, ICICI Bank)
    if (options.heavyweights && Array.isArray(options.heavyweights) && options.heavyweights.length > 0) {
      let bullHeavyweightCount = 0;
      let bearHeavyweightCount = 0;

      for (const hw of options.heavyweights) {
        if (!hw.candle) continue;
        const hwClose = hw.candle.close;
        const hwOpen = hw.candle.open;
        const hwVwap = hw.candle.vwap || hwOpen;
        const hwEma9 = hw.candle.ema9;
        const hwEma21 = hw.candle.ema21;

        const isHwBull = hwClose >= hwOpen && hwClose >= hwVwap && (!hwEma9 || hwEma9 >= (hwEma21 || 0));
        const isHwBear = hwClose <= hwOpen && hwClose <= hwVwap && (!hwEma9 || hwEma9 <= (hwEma21 || 0));

        if (isHwBull) bullHeavyweightCount++;
        if (isHwBear) bearHeavyweightCount++;
      }

      if (bullHeavyweightCount >= 2) {
        bullFactors.push(`Big-3 Heavyweights Confirmation (${bullHeavyweightCount}/3 Green Institutional Support)`);
      } else if (bearHeavyweightCount >= 2) {
        bullScore = 0; // VETO: Never buy Call if 2 of top 3 heavyweights are falling!
        bullFactors.push(`Heavyweights Divergence (${bearHeavyweightCount}/3 Red Dragging Down) — Trap Filtered`);
      }

      if (bearHeavyweightCount >= 2) {
        bearFactors.push(`Big-3 Heavyweights Breakdown Confirmation (${bearHeavyweightCount}/3 Red Dragging Down)`);
      } else if (bullHeavyweightCount >= 2) {
        bearScore = 0; // VETO: Never buy Put if 2 of top 3 heavyweights are rising!
        bearFactors.push(`Heavyweights Divergence (${bullHeavyweightCount}/3 Green Supporting) — Short Trap Filtered`);
      }
    }

    // Factor 8: Multi-Timeframe Fractal Matrix Gate (15m Macro Alignment)
    if (options.macro15m) {
      const macro = options.macro15m.macroTrend;
      if (macro === 'BULLISH') {
        bullScore += 15;
        bullFactors.push('Multi-Timeframe Fractal Alignment: 15m Macro Trend is Strongly Bullish (+15 Pts)');
        bearScore = 0; // VETO: Never short against 15m Bullish Tide!
        bearFactors.push('VETO: 15m Macro Trend is Bullish — Counter-trend Put Short Blocked');
      } else if (macro === 'BEARISH') {
        bearScore += 15;
        bearFactors.push('Multi-Timeframe Fractal Alignment: 15m Macro Trend is Strongly Bearish (+15 Pts)');
        bullScore = 0; // VETO: Never buy call against 15m Bearish Tide!
        bullFactors.push('VETO: 15m Macro Trend is Bearish — Counter-trend Call Buy Blocked');
      }
    }

    // Factor 9: Market Breadth Advance/Decline Gate
    if (options.marketBreadth) {
      const breadth = options.marketBreadth.breadth;
      if (breadth === 'STRONG_BULLISH') {
        bullScore += 10;
        bullFactors.push(`Broad Institutional Participation: ${options.marketBreadth.advancePercent}% Constituents Green`);
        bearScore = 0; // VETO: Do not short against broad market buying tide
      } else if (breadth === 'STRONG_BEARISH') {
        bearScore += 10;
        bearFactors.push(`Broad Institutional Selling: ${100 - options.marketBreadth.advancePercent}% Constituents Red`);
        bullScore = 0; // VETO: Do not buy calls when entire market is dumping
      }
    }

    // Factor 10: Option Chain PCR & Gamma Squeeze Gate
    if (options.optionChain) {
      const oc = options.optionChain;
      if (oc.gammaSqueezeRisk) {
        bullScore += 15;
        bullFactors.push(`Gamma Squeeze Imminent: Spot crossing Call Wall (₹${oc.callResistanceWall}) — Call Writers Trapped`);
      }
      if (oc.pcr < 0.65) {
        // Extreme Oversold -> Veto fresh Put buying (Short Trap)
        bearScore = 0;
        bearFactors.push(`VETO: Extreme Oversold PCR (${oc.pcr}) — Short covering bounce trap filtered`);
        bullScore += 10;
        bullFactors.push(`Oversold Contrarian Tail: PCR (${oc.pcr}) ripe for mean-reversion bounce`);
      } else if (oc.pcr > 1.45) {
        // Extreme Overbought -> Veto fresh Call buying (Long Trap)
        bullScore = 0;
        bullFactors.push(`VETO: Extreme Overbought PCR (${oc.pcr}) — Retail Long Trap filtered at top`);
        bearScore += 10;
        bearFactors.push(`Overbought Fatigue: PCR (${oc.pcr}) ripe for profit-taking pullback`);
      }
    }

    // Determine winning side
    const isBull = bullScore >= bearScore;
    const finalScore = Math.max(0, isBull ? bullScore : bearScore);
    const direction = isBull ? 'BULLISH' : 'BEARISH';
    const action = isBull ? 'BUY' : 'SELL';
    const factors = isBull ? bullFactors : bearFactors;

    const isQualified = finalScore >= this.minConfidenceThreshold;

    // Dynamic Risk & Targets with Volatility Breathing Room & Quick Breakeven Lock
    const effectiveAtr = atr || (close * 0.006);
    const recentLows = history.slice(-4).map(c => c.low);
    const recentHighs = history.slice(-4).map(c => c.high);
    const swingLow = Math.min(...recentLows);
    const swingHigh = Math.max(...recentHighs);

    let stopLoss, target1, target2, riskAmount;
    if (isBull) {
      stopLoss = Number((swingLow - (effectiveAtr * 0.35)).toFixed(2));
      riskAmount = Number((close - stopLoss).toFixed(2));
      // Guard against abnormal risk
      if (riskAmount < close * 0.003 || riskAmount > close * 0.035) {
        return { isQualified: false, score: 0, reason: 'Risk amount outside safe parameters' };
      }
      target1 = Number((close + riskAmount * 0.9).toFixed(2)); // Quick 1:1 Partial Profit & Breakeven Lock
      target2 = Number((close + riskAmount * 1.8).toFixed(2)); // 1:1.8 R:R Jackpot
    } else {
      stopLoss = Number((swingHigh + (effectiveAtr * 0.35)).toFixed(2));
      riskAmount = Number((stopLoss - close).toFixed(2));
      if (riskAmount < close * 0.003 || riskAmount > close * 0.035) {
        return { isQualified: false, score: 0, reason: 'Risk amount outside safe parameters' };
      }
      target1 = Number((close - riskAmount * 0.9).toFixed(2));
      target2 = Number((close - riskAmount * 1.8).toFixed(2));
    }

    return {
      isQualified,
      score: finalScore,
      direction,
      action,
      time: currentCandle.time,
      price: close,
      stopLoss,
      target1,
      target2,
      riskPerShare: riskAmount,
      rewardPerShare: Number((riskAmount * 2.0).toFixed(2)),
      riskRewardRatio: '1:2.0',
      factors,
      romanHindiSummary: this.buildRomanHindiSummary(direction, close, finalScore, factors, stopLoss, target1, target2)
    };
  }

  buildRomanHindiSummary(direction, price, score, factors, sl, t1, t2) {
    const dirText = direction === 'BULLISH' ? 'Bullish (Kareedna / BUY)' : 'Bearish (Bechna / SELL)';
    return `Ye setup ${score}% strong ${dirText} probability show kar raha hai. ` +
      `Entry: ₹${price} | Stop-Loss: ₹${sl} | Target 1: ₹${t1} | Target 2: ₹${t2}. ` +
      `Kyunki: ${factors.slice(0, 2).join(' aur ')}.`;
  }
}

module.exports = {
  ConfluenceScorer
};
