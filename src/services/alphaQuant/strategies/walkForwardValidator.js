/**
 * 🦅 GARUDA ALPHA-QUANT: DETERMINISTIC WALK-FORWARD VALIDATOR
 * Mission AQ-001 — Phase 3 Strategy Engine & Dynamic Adaptation (Phase 3.2 Hardened)
 * 
 * Provides rigorous Walk-Forward and Out-of-Sample validation:
 * 1. Timestamp-Based Chronological Splits with Boundary Purge & Configurable Embargo
 * 2. Multi-Window Rolling Out-of-Sample Evaluation
 * 3. Bar-by-Bar Historical Candle Strategy Simulation Engine (Zero Ledger Dependence)
 * 4. Realistic Friction Accounting: Brokerage, STT, Exchange Fees, Slippage & T1 Partial Bookings
 * 5. Walk-Forward Efficiency (WFE = OOS_Net / IS_Net) & Overfitting Detection
 */

class WalkForwardValidator {
  /**
   * Naive Index-based Split (Legacy compatibility)
   */
  static splitTrades(trades, inSampleRatio = 0.60) {
    if (!Array.isArray(trades) || trades.length === 0) {
      return { inSample: [], outOfSample: [] };
    }
    const splitIdx = Math.floor(trades.length * inSampleRatio);
    return {
      inSample: trades.slice(0, splitIdx),
      outOfSample: trades.slice(splitIdx)
    };
  }

  /**
   * Strict Timestamp-Based Chronological Partitioning with Boundary Purging & Embargo Window.
   * Eliminates temporal overlap and lookahead leakage between In-Sample and Out-of-Sample.
   * 
   * @param {Array<Object>} trades Chronologically ordered trade records
   * @param {number|string} splitTimestamp Cutoff timestamp separating IS and OOS
   * @param {number} [embargoPeriodMs=0] Post-boundary buffer window to eliminate serial correlation
   * @returns {Object} { inSample, outOfSample, purgedTrades, embargoedTrades }
   */
  static splitTradesChronological(trades, splitTimestamp, embargoPeriodMs = 0) {
    if (!Array.isArray(trades) || trades.length === 0) {
      return { inSample: [], outOfSample: [], purgedTrades: [], embargoedTrades: [] };
    }

    const splitTime = typeof splitTimestamp === 'string' ? new Date(splitTimestamp).getTime() : splitTimestamp;
    const embargoEndTime = splitTime + embargoPeriodMs;

    const inSample = [];
    const outOfSample = [];
    const purgedTrades = [];
    const embargoedTrades = [];

    for (const trade of trades) {
      const entryTime = new Date(trade.entryTime).getTime();
      const exitTime = new Date(trade.exitTime).getTime();

      // Case 1: In-Sample Trade (Completed strictly before or at split boundary)
      if (exitTime <= splitTime) {
        inSample.push(trade);
      }
      // Case 2: Boundary-Crossing Trade (Opened before boundary, closed after boundary)
      // STRICT PURGE: Must never contribute to either IS (lookahead) or OOS (unclean entry)
      else if (entryTime < splitTime && exitTime > splitTime) {
        purgedTrades.push({
          ...trade,
          purgeReason: 'BOUNDARY_CROSSING_OVERLAP'
        });
      }
      // Case 3: Embargoed Trade (Opened during the post-boundary embargo window)
      else if (entryTime >= splitTime && entryTime < embargoEndTime) {
        embargoedTrades.push({
          ...trade,
          embargoReason: 'WITHIN_EMBARGO_BUFFER'
        });
      }
      // Case 4: Pure Out-of-Sample Trade (Opened strictly after the boundary and embargo window)
      else if (entryTime >= embargoEndTime) {
        outOfSample.push(trade);
      }
    }

    return {
      inSample,
      outOfSample,
      purgedTrades,
      embargoedTrades,
      splitTimestamp: new Date(splitTime).toISOString(),
      embargoEndTime: new Date(embargoEndTime).toISOString()
    };
  }

  /**
   * Split trade sequence into multiple rolling chronological windows (Walk-Forward Rolling Folds)
   */
  static splitTradesRollingWindows(trades, windowCount = 3, inSampleRatio = 0.60, embargoPeriodMs = 0) {
    if (!Array.isArray(trades) || trades.length === 0) return [];
    const sorted = [...trades].sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());

    const totalSpanMs = new Date(sorted[sorted.length - 1].exitTime).getTime() - new Date(sorted[0].entryTime).getTime();
    const windowSpanMs = totalSpanMs / windowCount;
    const startTime = new Date(sorted[0].entryTime).getTime();

    const folds = [];
    for (let w = 0; w < windowCount; w++) {
      const windowStart = startTime + (w * (windowSpanMs * 0.5)); // 50% overlap sliding window
      const splitTime = windowStart + (windowSpanMs * inSampleRatio);
      const windowEnd = windowStart + windowSpanMs;

      const windowTrades = sorted.filter(t => {
        const et = new Date(t.entryTime).getTime();
        return et >= windowStart && et <= windowEnd;
      });

      const foldSplit = this.splitTradesChronological(windowTrades, splitTime, embargoPeriodMs);
      folds.push({
        foldIndex: w + 1,
        windowStart: new Date(windowStart).toISOString(),
        windowEnd: new Date(windowEnd).toISOString(),
        splitTime: new Date(splitTime).toISOString(),
        inSample: foldSplit.inSample,
        outOfSample: foldSplit.outOfSample,
        purgedTrades: foldSplit.purgedTrades,
        embargoedTrades: foldSplit.embargoedTrades
      });
    }
    return folds;
  }

  /**
   * Deterministic Wilson Score Interval (95% CI) for Binomial Win Rate
   * Closed-form, asymmetric, mathematically bounded in [0, 100]%
   * 
   * @param {number} wins Successful trades
   * @param {number} total Total trades
   * @param {number} [confidenceZ=1.95996] Normal distribution critical Z (1.95996 for 95%)
   * @returns {Object} { lower, upper, pointEstimate, confidence }
   */
  static calculateWilsonScoreInterval(wins, total, confidenceZ = 1.95996) {
    if (typeof total !== 'number' || total <= 0) {
      return { lower: 0, upper: 0, pointEstimate: 0, confidence: 0.95 };
    }
    const p = Math.max(0, Math.min(1, wins / total));
    const z2 = confidenceZ * confidenceZ;
    const denominator = 1 + (z2 / total);
    const center = p + (z2 / (2 * total));
    const margin = confidenceZ * Math.sqrt((p * (1 - p) / total) + (z2 / (4 * total * total)));
    const lower = Math.max(0, Number(((center - margin) / denominator * 100).toFixed(2)));
    const upper = Math.min(100, Number(((center + margin) / denominator * 100).toFixed(2)));
    const pointEstimate = Number((p * 100).toFixed(2));
    return { lower, upper, pointEstimate, confidence: 0.95 };
  }

  /**
   * Canonical Historical P&L Calculation Engine (Section C Foundation)
   * 
   * Gross P&L = Leg 1 (T1 Partial) + Leg 2 (Final Exit)
   * Net P&L = Gross P&L - (Statutory Turnover Charges + Slippage)
   * 
   * @param {Object} trade Execution record
   * @returns {Object} Reconciled P&L breakdown
   */
  static calculateCanonicalPnL(trade) {
    if (!trade) return { grossPnl: 0, charges: 0, slippage: 0, totalFriction: 0, netPnl: 0 };
    
    // Leg 1: T1 Partial scale-out (if occurred)
    const leg1Gross = trade.partialGrossPnl || 0;
    const leg1Charges = trade.partialCharges || 0;
    const leg1Slip = trade.partialSlippage || 0;

    // Leg 2: Final Exit
    let leg2Gross = 0;
    const exitPrice = trade.exitPrice != null ? trade.exitPrice : trade.entryPrice;
    const remainingQty = trade.remainingQuantity != null ? trade.remainingQuantity : (trade.initialQuantity || trade.quantity || 1);
    
    if (trade.direction === 'BULLISH') {
      leg2Gross = (exitPrice - trade.entryPrice) * remainingQty;
    } else {
      leg2Gross = (trade.entryPrice - exitPrice) * remainingQty;
    }

    const slippagePct = trade.slippagePct !== undefined ? trade.slippagePct : 0.0004;
    const chargesPct = trade.chargesPct !== undefined ? trade.chargesPct : 0.0003;

    const leg2Slip = (exitPrice * slippagePct + trade.entryPrice * slippagePct) * remainingQty;
    const leg2Charges = (exitPrice + trade.entryPrice) * chargesPct * remainingQty;

    const totalGross = Number((leg1Gross + leg2Gross).toFixed(2));
    const totalSlippage = Number((leg1Slip + leg2Slip).toFixed(2));
    const totalStatutoryCharges = Number((leg1Charges + leg2Charges).toFixed(2));
    const totalFriction = Number((totalSlippage + totalStatutoryCharges).toFixed(2));
    const netPnl = Number((totalGross - totalFriction).toFixed(2));

    return {
      leg1Gross: Number(leg1Gross.toFixed(2)),
      leg2Gross: Number(leg2Gross.toFixed(2)),
      grossPnl: totalGross,
      charges: totalStatutoryCharges,
      slippage: totalSlippage,
      totalFriction,
      netPnl,
      isWin: netPnl > 0
    };
  }

  /**
   * Compute comprehensive performance and risk metrics for a trade slice (Section D Compliance)
   */
  static evaluatePerformance(trades, initialCapital = 100000, marginBase = 25000) {
    if (!Array.isArray(trades) || trades.length === 0) {
      return {
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        wilsonScoreInterval: { lower: 0, upper: 0, pointEstimate: 0, confidence: 0.95 },
        grossPnl: 0,
        charges: 0,
        slippage: 0,
        netPnl: 0,
        profitFactor: 0,
        maxDrawdownAmount: 0,
        maxDrawdownEquityPct: 0,
        maxDrawdownMarginPct: 0,
        expectancyPerTrade: 0,
        realizedRiskRewardRatio: 0,
        avgHoldingDurationHours: 0,
        transactionCostDragPct: 0,
        performanceByRegime: {},
        strategyAttribution: {}
      };
    }

    let wins = 0;
    let losses = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let totalCharges = 0;
    let totalSlippage = 0;
    let netPnl = 0;
    let totalHoldingMs = 0;

    let equity = initialCapital;
    let peakEquity = initialCapital;
    let maxDdAmt = 0;

    const regimeGroups = {};
    const strategyGroups = {};

    for (const t of trades) {
      const net = t.netPnl != null ? t.netPnl : (t.grossPnl - (t.charges || 0));
      const gross = t.grossPnl != null ? t.grossPnl : net;
      const chg = t.charges || 0;
      const slip = t.slippage || 0;

      totalCharges += chg;
      totalSlippage += slip;
      netPnl += net;
      equity += net;

      // Track holding time
      if (t.entryTime && t.exitTime) {
        const ms = new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime();
        if (ms > 0) totalHoldingMs += ms;
      }

      // Track Peak & Drawdown
      if (equity > peakEquity) {
        peakEquity = equity;
      }
      const dd = peakEquity - equity;
      if (dd > maxDdAmt) {
        maxDdAmt = dd;
      }

      // Classify Win/Loss by Net P&L (true economic outcome)
      if (net > 0) {
        wins++;
      } else {
        losses++;
      }

      // Classify Gross Cashflow strictly by Gross P&L sign
      // Prevents scratch trades (gross > 0, net <= 0) from distorting grossLoss
      if (gross > 0) {
        grossProfit += gross;
      } else {
        grossLoss += Math.abs(gross);
      }

      // Group by Regime
      const reg = t.regime || 'UNSPECIFIED';
      if (!regimeGroups[reg]) {
        regimeGroups[reg] = { tradeCount: 0, wins: 0, losses: 0, grossPnl: 0, charges: 0, netPnl: 0 };
      }
      regimeGroups[reg].tradeCount++;
      if (net > 0) regimeGroups[reg].wins++; else regimeGroups[reg].losses++;
      regimeGroups[reg].grossPnl += gross;
      regimeGroups[reg].charges += chg;
      regimeGroups[reg].netPnl += net;

      // Group by Strategy
      const strat = t.strategyId || 'UNSPECIFIED';
      if (!strategyGroups[strat]) {
        strategyGroups[strat] = { tradeCount: 0, wins: 0, losses: 0, grossPnl: 0, charges: 0, netPnl: 0, consecutiveLosses: 0, maxLossStreak: 0 };
      }
      strategyGroups[strat].tradeCount++;
      if (net > 0) {
        strategyGroups[strat].wins++;
        strategyGroups[strat].consecutiveLosses = 0;
      } else {
        strategyGroups[strat].losses++;
        strategyGroups[strat].consecutiveLosses++;
        if (strategyGroups[strat].consecutiveLosses > strategyGroups[strat].maxLossStreak) {
          strategyGroups[strat].maxLossStreak = strategyGroups[strat].consecutiveLosses;
        }
      }
      strategyGroups[strat].grossPnl += gross;
      strategyGroups[strat].charges += chg;
      strategyGroups[strat].netPnl += net;
    }

    const tradeCount = trades.length;
    const winRate = Number(((wins / tradeCount) * 100).toFixed(2));
    const wilsonScoreInterval = this.calculateWilsonScoreInterval(wins, tradeCount, 1.95996);
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 99.0 : 0);
    const maxDrawdownEquityPct = Number(((maxDdAmt / initialCapital) * 100).toFixed(4));
    const maxDrawdownMarginPct = Number(((maxDdAmt / marginBase) * 100).toFixed(4));
    const expectancyPerTrade = Number((netPnl / tradeCount).toFixed(2));

    const avgWin = wins > 0 ? (grossProfit / wins) : 0;
    const avgLoss = losses > 0 ? (grossLoss / losses) : 0;
    const realizedRiskRewardRatio = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : (avgWin > 0 ? 99.0 : 0);

    const avgHoldingDurationHours = Number((totalHoldingMs / (tradeCount * 3600000)).toFixed(2));
    const transactionCostDragPct = grossProfit > 0 ? Number(((totalCharges / grossProfit) * 100).toFixed(2)) : 0;

    // Polish regime breakdown
    const performanceByRegime = {};
    for (const [k, v] of Object.entries(regimeGroups)) {
      const rWr = Number(((v.wins / v.tradeCount) * 100).toFixed(2));
      performanceByRegime[k] = {
        tradeCount: v.tradeCount,
        wins: v.wins,
        losses: v.losses,
        winRate: rWr,
        grossPnl: Number(v.grossPnl.toFixed(2)),
        charges: Number(v.charges.toFixed(2)),
        netPnl: Number(v.netPnl.toFixed(2))
      };
    }

    // Polish strategy breakdown
    const strategyAttribution = {};
    for (const [k, v] of Object.entries(strategyGroups)) {
      const sWr = Number(((v.wins / v.tradeCount) * 100).toFixed(2));
      strategyAttribution[k] = {
        tradeCount: v.tradeCount,
        wins: v.wins,
        losses: v.losses,
        winRate: sWr,
        grossPnl: Number(v.grossPnl.toFixed(2)),
        charges: Number(v.charges.toFixed(2)),
        netPnl: Number(v.netPnl.toFixed(2)),
        maxLossStreak: v.maxLossStreak
      };
    }

    return {
      tradeCount,
      winCount: wins,
      lossCount: losses,
      winRate,
      wilsonScoreInterval,
      grossPnl: Number((grossProfit - grossLoss).toFixed(2)),
      charges: Number(totalCharges.toFixed(2)),
      slippage: Number(totalSlippage.toFixed(2)),
      netPnl: Number(netPnl.toFixed(2)),
      profitFactor,
      maxDrawdownAmount: Number(maxDdAmt.toFixed(2)),
      maxDrawdownEquityPct,
      maxDrawdownMarginPct,
      expectancyPerTrade,
      realizedRiskRewardRatio,
      avgHoldingDurationHours,
      transactionCostDragPct,
      performanceByRegime,
      strategyAttribution
    };
  }

  /**
   * Run a single-fold or multi-fold walk-forward validation (Legacy Index-based)
   */
  static runValidation(trades, inSampleRatio = 0.60, initialCapital = 100000, marginBase = 25000) {
    const { inSample, outOfSample } = this.splitTrades(trades, inSampleRatio);

    const isMetrics = this.evaluatePerformance(inSample, initialCapital, marginBase);
    const oosMetrics = this.evaluatePerformance(outOfSample, initialCapital, marginBase);

    let wfe = 0;
    if (isMetrics.expectancyPerTrade > 0) {
      wfe = Number((oosMetrics.expectancyPerTrade / isMetrics.expectancyPerTrade).toFixed(4));
    } else if (isMetrics.netPnl !== 0) {
      wfe = Number((oosMetrics.netPnl / isMetrics.netPnl).toFixed(4));
    }

    let overfittingRisk = 'LOW';
    const warnings = [];

    if (oosMetrics.profitFactor < 1.0) {
      overfittingRisk = 'HIGH';
      warnings.push(`Out-of-sample profit factor ${oosMetrics.profitFactor} is unprofitable (< 1.0)`);
    }

    if (wfe < 0.50 && isMetrics.netPnl > 0) {
      if (overfittingRisk !== 'HIGH') {
        overfittingRisk = 'ELEVATED';
      }
      warnings.push(`Walk-Forward Efficiency ${wfe} is below 0.50 benchmark, indicating substantial forward decay`);
    }

    if (oosMetrics.maxDrawdownMarginPct > isMetrics.maxDrawdownMarginPct * 1.5) {
      warnings.push(`Out-of-sample drawdown ${oosMetrics.maxDrawdownMarginPct}% significantly expanded relative to in-sample ${isMetrics.maxDrawdownMarginPct}%`);
    }

    return {
      timestamp: new Date().toISOString(),
      datasetTotalTrades: trades.length,
      inSampleCount: inSample.length,
      outOfSampleCount: outOfSample.length,
      inSampleMetrics: isMetrics,
      outOfSampleMetrics: oosMetrics,
      walkForwardEfficiency: wfe,
      overfittingRisk,
      warnings,
      isRobust: overfittingRisk === 'LOW' && oosMetrics.profitFactor >= 1.10
    };
  }

  /**
   * Run Strict Chronological Walk-Forward Validation with Purged Overlaps & Embargo
   */
  static runChronologicalValidation(trades, splitTimestamp, embargoPeriodMs = 0, initialCapital = 100000, marginBase = 25000) {
    const split = this.splitTradesChronological(trades, splitTimestamp, embargoPeriodMs);

    const isMetrics = this.evaluatePerformance(split.inSample, initialCapital, marginBase);
    const oosMetrics = this.evaluatePerformance(split.outOfSample, initialCapital, marginBase);

    let wfe = 0;
    if (isMetrics.expectancyPerTrade > 0) {
      wfe = Number((oosMetrics.expectancyPerTrade / isMetrics.expectancyPerTrade).toFixed(4));
    } else if (isMetrics.netPnl !== 0) {
      wfe = Number((oosMetrics.netPnl / isMetrics.netPnl).toFixed(4));
    }

    let overfittingRisk = 'LOW';
    const warnings = [];

    if (oosMetrics.profitFactor < 1.0) {
      overfittingRisk = 'HIGH';
      warnings.push(`Out-of-sample profit factor ${oosMetrics.profitFactor} is unprofitable (< 1.0)`);
    }

    if (wfe < 0.50 && isMetrics.netPnl > 0) {
      if (overfittingRisk !== 'HIGH') {
        overfittingRisk = 'ELEVATED';
      }
      warnings.push(`Walk-Forward Efficiency ${wfe} is below 0.50 benchmark, indicating forward decay`);
    }

    return {
      timestamp: new Date().toISOString(),
      datasetTotalTrades: trades.length,
      splitTimestamp: split.splitTimestamp,
      embargoPeriodMs,
      inSampleCount: split.inSample.length,
      outOfSampleCount: split.outOfSample.length,
      purgedCount: split.purgedTrades.length,
      embargoedCount: split.embargoedTrades.length,
      inSampleMetrics: isMetrics,
      outOfSampleMetrics: oosMetrics,
      walkForwardEfficiency: wfe,
      overfittingRisk,
      warnings,
      isRobust: overfittingRisk === 'LOW' && oosMetrics.profitFactor >= 1.10
    };
  }

  /**
   * Bar-by-Bar Historical Candle Strategy Simulation Engine
   * Executes Phase 3 strategies on raw OHLCV candles through StrategyOrchestrator and RiskSentinel.
   * Completely eliminates synthetic reliance on the legacy 32-trade ledger.
   * 
   * @param {Array<Object>} candles Raw historical OHLCV candles
   * @param {Object} orchestrator StrategyOrchestrator instance
   * @param {string} accountId Account ID registered in RiskSentinel
   * @param {Object} [options={}] Simulation options
   * @returns {Object} { simulatedTrades, tradeCount, totalNetPnl, orchestratorReport }
   */
  static simulateStrategyOnCandles(candles, orchestrator, accountId, options = {}) {
    if (!Array.isArray(candles) || candles.length < 28) {
      return { simulatedTrades: [], tradeCount: 0, totalNetPnl: 0 };
    }

    const symbol = options.symbol || 'TCS.NS';
    const warmupBars = options.warmupBars || 28;
    const slippagePct = options.slippagePercent !== undefined ? options.slippagePercent : 0.0004;
    const chargesPct = options.chargesPercent !== undefined ? options.chargesPercent : 0.0003;
    const enableT1ScaleOut = options.enableT1ScaleOut !== undefined ? options.enableT1ScaleOut : true;

    const simulatedTrades = [];
    let activeTrade = null;

    const maxLookbackBars = options.maxLookbackBars || 150;

    for (let i = warmupBars; i < candles.length; i++) {
      const currentCandle = candles[i];
      const historyWindow = candles.slice(Math.max(0, i - maxLookbackBars), i + 1);

      // 1. Manage Active Position (Check Stops, Targets, Trailing SL)
      if (activeTrade) {
        let isClosed = false;
        let exitPrice = currentCandle.close;
        let exitReason = 'INTRADAY_EOD_SQUARE_OFF';

        if (activeTrade.direction === 'BULLISH') {
          // Check Target 1 (Partial 50% scale-out + breakeven stop trail)
          if (!activeTrade.t1Hit && currentCandle.high >= activeTrade.target1 && enableT1ScaleOut) {
            activeTrade.t1Hit = true;
            const halfQty = Math.max(1, Math.floor(activeTrade.quantity / 2));
            const t1Gross = (activeTrade.target1 - activeTrade.entryPrice) * halfQty;
            const t1Slip = (activeTrade.target1 * slippagePct + activeTrade.entryPrice * slippagePct) * halfQty;
            const t1Chg = (activeTrade.target1 + activeTrade.entryPrice) * chargesPct * halfQty;
            activeTrade.partialGrossPnl += t1Gross;
            activeTrade.partialCharges += (t1Slip + t1Chg);
            activeTrade.partialNetPnl += (t1Gross - (t1Slip + t1Chg));
            activeTrade.quantity -= halfQty;
            activeTrade.stopLoss = activeTrade.entryPrice; // Trailing stop to breakeven!
          }

          // Check Target 2 Jackpot
          if (currentCandle.high >= activeTrade.target2) {
            isClosed = true;
            exitPrice = activeTrade.target2;
            exitReason = 'TARGET_2_JACKPOT_HIT';
          }
          // Check Stop Loss
          else if (currentCandle.low <= activeTrade.stopLoss) {
            isClosed = true;
            exitPrice = activeTrade.stopLoss;
            exitReason = activeTrade.t1Hit ? 'TRAILING_STOP_LOSS_BREAKEVEN' : 'STOP_LOSS_HIT';
          }
        } else {
          // BEARISH (SHORT) Logic
          if (!activeTrade.t1Hit && currentCandle.low <= activeTrade.target1 && enableT1ScaleOut) {
            activeTrade.t1Hit = true;
            const halfQty = Math.max(1, Math.floor(activeTrade.quantity / 2));
            const t1Gross = (activeTrade.entryPrice - activeTrade.target1) * halfQty;
            const t1Slip = (activeTrade.target1 * slippagePct + activeTrade.entryPrice * slippagePct) * halfQty;
            const t1Chg = (activeTrade.target1 + activeTrade.entryPrice) * chargesPct * halfQty;
            activeTrade.partialGrossPnl += t1Gross;
            activeTrade.partialCharges += (t1Slip + t1Chg);
            activeTrade.partialNetPnl += (t1Gross - (t1Slip + t1Chg));
            activeTrade.quantity -= halfQty;
            activeTrade.stopLoss = activeTrade.entryPrice; // Trailing stop to breakeven!
          }

          if (currentCandle.low <= activeTrade.target2) {
            isClosed = true;
            exitPrice = activeTrade.target2;
            exitReason = 'TARGET_2_JACKPOT_HIT';
          } else if (currentCandle.high >= activeTrade.stopLoss) {
            isClosed = true;
            exitPrice = activeTrade.stopLoss;
            exitReason = activeTrade.t1Hit ? 'TRAILING_STOP_LOSS_BREAKEVEN' : 'STOP_LOSS_HIT';
          }
        }

        // Close Position if triggered or reached end of candles
        if (isClosed || i === candles.length - 1) {
          const finalLegGross = activeTrade.direction === 'BULLISH'
            ? (exitPrice - activeTrade.entryPrice) * activeTrade.quantity
            : (activeTrade.entryPrice - exitPrice) * activeTrade.quantity;
          const finalLegSlip = (exitPrice * slippagePct + activeTrade.entryPrice * slippagePct) * activeTrade.quantity;
          const finalLegChg = (exitPrice + activeTrade.entryPrice) * chargesPct * activeTrade.quantity;
          const finalLegCharges = finalLegSlip + finalLegChg;

          const totalGross = Number((activeTrade.partialGrossPnl + finalLegGross).toFixed(2));
          const totalCharges = Number((activeTrade.partialCharges + finalLegCharges).toFixed(2));
          const totalNet = Number((totalGross - totalCharges).toFixed(2));

          const tradeRecord = {
            id: `SIM-TRD-${simulatedTrades.length + 1}`,
            symbol: activeTrade.symbol,
            direction: activeTrade.direction,
            action: activeTrade.action,
            initialQuantity: activeTrade.initialQuantity,
            entryPrice: activeTrade.entryPrice,
            exitPrice: Number(exitPrice.toFixed(2)),
            entryTime: activeTrade.entryTime,
            exitTime: currentCandle.timestamp,
            grossPnl: totalGross,
            charges: totalCharges,
            netPnl: totalNet,
            exitReason,
            strategyId: activeTrade.strategyId,
            regime: activeTrade.regime || 'UNSPECIFIED',
            isWin: totalNet > 0
          };

          simulatedTrades.push(tradeRecord);

          // Record in orchestrator performance attribution & circuit breaker
          const marginBase = options.marginBase || 25000;
          const initialCapital = options.initialCapital || 100000;
          orchestrator.recordTradeResult(
            activeTrade.strategyId,
            totalNet,
            totalGross,
            totalCharges,
            marginBase,
            initialCapital
          );

          // Release margin in risk sentinel
          if (orchestrator.riskSentinel && orchestrator.riskSentinel.confirmOrderFill) {
            const acc = orchestrator.riskSentinel.getAccountState(accountId);
            if (acc) {
              const posIdx = acc.positions.findIndex(p => p.id === activeTrade.orderId);
              if (posIdx !== -1) {
                acc.positions.splice(posIdx, 1);
                acc.capital.lockedMargin = Math.max(0, Number((acc.capital.lockedMargin - activeTrade.marginRequired).toFixed(2)));
                acc.capital.availableCash = Number((acc.capital.availableCash + activeTrade.marginRequired + totalNet).toFixed(2));
                acc.capital.cash = acc.capital.availableCash;
                acc.capital.realizedPnl = Number((acc.capital.realizedPnl + totalNet).toFixed(2));
              }
            }
          }

          activeTrade = null;
        }
      }

      // 2. Evaluate New Trade Setup if flat (Next-Bar Open Execution & Timestamp Alignment)
      if (!activeTrade) {
        // Prevent duplicate execution and reject signals when no next candle exists (Mandates 1 & 5)
        if (i + 1 < candles.length) {
          const nextCandle = candles[i + 1];
          const executionTimestamp = nextCandle.timestamp;
          const simScore = options.score !== undefined ? options.score : 78;

          // Filter 1 Opening Bell Check (if enabled in options or default)
          const isOpeningBellNse = (symbol.endsWith('.NS') || (!symbol.includes('-USD') && !symbol.includes('=X'))) &&
            (executionTimestamp.includes('03:45:') || executionTimestamp.includes('T03:45'));
          const skipBullishOpeningBell = options.filterOpeningBellBullish === true && isOpeningBellNse;

          const proposal = orchestrator.evaluateAndPropose(accountId, symbol, historyWindow, {
            score: simScore,
            executionTimestamp,
            nextCandle,
            agentId: options.agentId
          });

          if (proposal.executed && proposal.decision) {
            const ord = proposal.decision.order;

            // Opening-bell filter placement: If rejected after reservation, safely release reservation (Phase 1 Mandate 3)
            if (skipBullishOpeningBell && ord.direction === 'BULLISH') {
              if (orchestrator.riskSentinel && orchestrator.riskSentinel.confirmOrderRejected) {
                orchestrator.riskSentinel.confirmOrderRejected(accountId, ord.orderId, 'OPENING_BELL_FILTER_VETO');
              }
              continue;
            }

            // 1. Next-Bar OPEN execution fill price (Mandate 1)
            const actualFillPrice = Number(nextCandle.open.toFixed(2));

            // 2. Recalculate stop-loss, target 1 and target 2 from actual fill price (Mandate 4)
            const ordBasePrice = (ord.entryPrice !== undefined && ord.entryPrice !== null) ? ord.entryPrice : (ord.price || actualFillPrice);
            const stopDistance = Math.abs(ordBasePrice - ord.stopLoss);
            const target1Distance = Math.abs(ord.target1 - ordBasePrice);
            const target2Distance = Math.abs(ord.target2 - ordBasePrice);

            const decimals = actualFillPrice < 1 ? 6 : (actualFillPrice < 50 ? 4 : 2);

            const recalculatedStopLoss = ord.direction === 'BULLISH'
              ? Number((actualFillPrice - stopDistance).toFixed(decimals))
              : Number((actualFillPrice + stopDistance).toFixed(decimals));

            const recalculatedTarget1 = ord.direction === 'BULLISH'
              ? Number((actualFillPrice + target1Distance).toFixed(decimals))
              : Number((actualFillPrice - target1Distance).toFixed(decimals));

            const recalculatedTarget2 = ord.direction === 'BULLISH'
              ? Number((actualFillPrice + target2Distance).toFixed(decimals))
              : Number((actualFillPrice - target2Distance).toFixed(decimals));

            // 3. Recalculate quantity & margin constraints from actual fill price (Mandate 4 & Zero Forced 1-Share)
            const accState = orchestrator.riskSentinel ? orchestrator.riskSentinel.getAccountState(accountId) : null;
            const availableCash = accState ? (accState.capital.availableCash || accState.capital.cash || 100000) : 100000;
            const maxRiskPct = accState ? (accState.config.maxRiskPerTradePercent || 0.01) : 0.01;
            const riskBudget = availableCash * maxRiskPct;
            const recalculatedQty = stopDistance > 0 ? Math.floor(riskBudget / stopDistance) : ord.quantity;

            // Zero forced 1-share rule (Phase 1 Mandate 4): reject if risk budget exceeded
            if (recalculatedQty <= 0) {
              if (orchestrator.riskSentinel && orchestrator.riskSentinel.confirmOrderRejected) {
                orchestrator.riskSentinel.confirmOrderRejected(accountId, ord.orderId, 'PER_TRADE_RISK_CAP_EXCEEDED');
              }
              continue;
            }

            const leverage = (ordBasePrice > 0 && ord.marginRequired > 0)
              ? ((ordBasePrice * ord.quantity) / ord.marginRequired)
              : 5;
            const recalculatedMargin = Number(((actualFillPrice * recalculatedQty) / leverage).toFixed(2));

            // 4. Confirm fill in RiskSentinel with recalculated parameters (Mandate 6)
            if (orchestrator.riskSentinel && orchestrator.riskSentinel.confirmOrderFill) {
              orchestrator.riskSentinel.confirmOrderFill(accountId, ord.orderId, {
                quantity: recalculatedQty,
                price: actualFillPrice
              });
            }

            activeTrade = {
              orderId: ord.orderId,
              agentId: ord.agentId || options.agentId || 'Alpha-Quant',
              symbol: ord.symbol,
              action: ord.action,
              direction: ord.direction,
              entryPrice: actualFillPrice,
              stopLoss: recalculatedStopLoss,
              target1: recalculatedTarget1,
              target2: recalculatedTarget2,
              quantity: recalculatedQty,
              initialQuantity: recalculatedQty,
              marginRequired: recalculatedMargin,
              strategyId: proposal.strategyId,
              regime: proposal.regime || (proposal.decision && proposal.decision.regime) || 'UNSPECIFIED',
              entryTime: executionTimestamp, // Bar i+1 OPEN timestamp (Mandate 2)
              t1Hit: false,
              partialGrossPnl: 0,
              partialCharges: 0,
              partialNetPnl: 0
            };
          }
        }
      }
    }

    const totalNetPnl = Number(simulatedTrades.reduce((sum, t) => sum + t.netPnl, 0).toFixed(2));

    return {
      simulatedTrades,
      tradeCount: simulatedTrades.length,
      totalNetPnl,
      attribution: orchestrator.getPerformanceReport()
    };
  }

  /**
   * Unified Chronological Multi-Asset Portfolio Universe Simulation Engine
   * Mission AQ-002: Portfolio-Level Risk & Drawdown Remediation
   * 
   * Steps through time across all instruments in the universe chronologically.
   * Enforces portfolio-level risk limits, shared sector caps, and correlation damping in real time.
   */
  static simulatePortfolioUniverse(instrumentsWithCandles, orchestrator, accountId, options = {}) {
    if (!Array.isArray(instrumentsWithCandles) || instrumentsWithCandles.length === 0) {
      return { simulatedTrades: [], tradeCount: 0, totalNetPnl: 0, rejections: [] };
    }

    const slippagePct = options.slippagePercent !== undefined ? options.slippagePercent : 0.0004;
    const chargesPct = options.chargesPercent !== undefined ? options.chargesPercent : 0.0003;
    const enableT1ScaleOut = options.enableT1ScaleOut !== undefined ? options.enableT1ScaleOut : true;
    const warmupBars = options.warmupBars || 28;
    const maxLookbackBars = options.maxLookbackBars || 150;

    // Index candles by symbol and build timestamp timeline
    const timestampSet = new Set();
    const candleMap = new Map();

    for (const inst of instrumentsWithCandles) {
      const map = new Map();
      for (let i = 0; i < inst.candles.length; i++) {
        const c = inst.candles[i];
        map.set(c.timestamp, { candle: c, index: i });
        if (i >= warmupBars) {
          timestampSet.add(c.timestamp);
        }
      }
      candleMap.set(inst.symbol, {
        candles: inst.candles,
        byTime: map,
        assetClass: inst.assetClass || (inst.symbol.includes('-USD') ? 'CRYPTO' : (inst.symbol.includes('=X') ? 'FOREX' : 'INDIA_EQUITY'))
      });
    }

    const sortedTimes = Array.from(timestampSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const activeTrades = new Map();
    const simulatedTrades = [];
    const rejections = [];

    for (let tIdx = 0; tIdx < sortedTimes.length; tIdx++) {
      const currentTime = sortedTimes[tIdx];

      // 1. Process active trades exits
      for (const [sym, active] of Array.from(activeTrades.entries())) {
        const instData = candleMap.get(sym);
        const item = instData.byTime.get(currentTime);
        if (!item) continue;
        const candle = item.candle;

        let isClosed = false;
        let exitPrice = candle.close;
        let exitReason = 'HOLDING';

        if (active.direction === 'BULLISH') {
          if (!active.t1Hit && candle.high >= active.target1 && enableT1ScaleOut) {
            active.t1Hit = true;
            const halfQty = Math.max(1, Math.floor(active.quantity / 2));
            const t1Gross = (active.target1 - active.entryPrice) * halfQty;
            const t1Slip = (active.target1 * slippagePct + active.entryPrice * slippagePct) * halfQty;
            const t1Chg = (active.target1 + active.entryPrice) * chargesPct * halfQty;
            active.partialGrossPnl += t1Gross;
            active.partialCharges += (t1Slip + t1Chg);
            active.partialNetPnl += (t1Gross - (t1Slip + t1Chg));
            active.quantity -= halfQty;
            active.stopLoss = active.entryPrice;
          }

          if (candle.high >= active.target2) {
            isClosed = true;
            exitPrice = active.target2;
            exitReason = 'TARGET_2_JACKPOT_HIT';
          } else if (candle.low <= active.stopLoss) {
            isClosed = true;
            exitPrice = active.stopLoss;
            exitReason = active.t1Hit ? 'TRAILING_STOP_LOSS_BREAKEVEN' : 'STOP_LOSS_HIT';
          }
        } else {
          if (!active.t1Hit && candle.low <= active.target1 && enableT1ScaleOut) {
            active.t1Hit = true;
            const halfQty = Math.max(1, Math.floor(active.quantity / 2));
            const t1Gross = (active.entryPrice - active.target1) * halfQty;
            const t1Slip = (active.target1 * slippagePct + active.entryPrice * slippagePct) * halfQty;
            const t1Chg = (active.target1 + active.entryPrice) * chargesPct * halfQty;
            active.partialGrossPnl += t1Gross;
            active.partialCharges += (t1Slip + t1Chg);
            active.partialNetPnl += (t1Gross - (t1Slip + t1Chg));
            active.quantity -= halfQty;
            active.stopLoss = active.entryPrice;
          }

          if (candle.low <= active.target2) {
            isClosed = true;
            exitPrice = active.target2;
            exitReason = 'TARGET_2_JACKPOT_HIT';
          } else if (candle.high >= active.stopLoss) {
            isClosed = true;
            exitPrice = active.stopLoss;
            exitReason = active.t1Hit ? 'TRAILING_STOP_LOSS_BREAKEVEN' : 'STOP_LOSS_HIT';
          }
        }

        if (isClosed || item.index === instData.candles.length - 1) {
          const finalLegGross = active.direction === 'BULLISH'
            ? (exitPrice - active.entryPrice) * active.quantity
            : (active.entryPrice - exitPrice) * active.quantity;
          const finalLegSlip = (exitPrice * slippagePct + active.entryPrice * slippagePct) * active.quantity;
          const finalLegChg = (exitPrice + active.entryPrice) * chargesPct * active.quantity;
          const finalLegCharges = finalLegSlip + finalLegChg;

          const totalGross = Number((active.partialGrossPnl + finalLegGross).toFixed(2));
          const totalCharges = Number((active.partialCharges + finalLegCharges).toFixed(2));
          const totalNet = Number((totalGross - totalCharges).toFixed(2));

          const tradeRecord = {
            id: `PORT-TRD-${simulatedTrades.length + 1}`,
            symbol: active.symbol,
            direction: active.direction,
            action: active.action,
            agentId: active.agentId,
            initialQuantity: active.initialQuantity,
            entryPrice: active.entryPrice,
            exitPrice: Number(exitPrice.toFixed(2)),
            entryTime: active.entryTime,
            exitTime: candle.timestamp,
            grossPnl: totalGross,
            charges: totalCharges,
            netPnl: totalNet,
            exitReason,
            strategyId: active.strategyId,
            regime: active.regime || 'UNSPECIFIED',
            isWin: totalNet > 0
          };

          simulatedTrades.push(tradeRecord);
          activeTrades.delete(sym);

          // Settle margin in RiskSentinel
          if (orchestrator.riskSentinel) {
            const acc = orchestrator.riskSentinel.getAccountState(accountId);
            if (acc) {
              const posIdx = acc.positions.findIndex(p => p.id === active.orderId);
              if (posIdx !== -1) {
                acc.positions.splice(posIdx, 1);
                acc.capital.lockedMargin = Math.max(0, Number((acc.capital.lockedMargin - active.marginRequired).toFixed(2)));
                acc.capital.availableCash = Number((acc.capital.availableCash + active.marginRequired + totalNet).toFixed(2));
                acc.capital.cash = acc.capital.availableCash;
                acc.capital.realizedPnl = Number((acc.capital.realizedPnl + totalNet).toFixed(2));
                acc.capital.totalLedgerCash = Number((acc.capital.availableCash + acc.capital.lockedMargin + acc.capital.pendingReservedMargin).toFixed(2));
                if (acc.capital.totalLedgerCash > acc.capital.peakCapital) acc.capital.peakCapital = acc.capital.totalLedgerCash;
              }
            }
          }
        }
      }

      // 2. Process signals for flat instruments
      for (const inst of instrumentsWithCandles) {
        if (activeTrades.has(inst.symbol)) continue;

        const instData = candleMap.get(inst.symbol);
        const item = instData.byTime.get(currentTime);
        if (!item || item.index < warmupBars || item.index >= instData.candles.length - 1) continue;

        const nextCandle = instData.candles[item.index + 1];
        const executionTimestamp = nextCandle.timestamp;

        // Filter 1 opening bell check
        const isOpeningBellNse = (inst.symbol.endsWith('.NS') || (!inst.symbol.includes('-USD') && !inst.symbol.includes('=X'))) &&
          (executionTimestamp.includes('03:45:') || executionTimestamp.includes('T03:45'));

        const historyWindow = instData.candles.slice(Math.max(0, item.index - maxLookbackBars), item.index + 1);

        const agentId = inst.assetClass === 'CRYPTO' ? 'Alpha-Crypto' :
          inst.assetClass === 'FOREX' ? 'Alpha-Forex' : 'Alpha-India';

        const proposal = orchestrator.evaluateAndPropose(accountId, inst.symbol, historyWindow, {
          score: options.score !== undefined ? options.score : 78,
          executionTimestamp,
          nextCandle,
          agentId
        });

        if (!proposal.executed) {
          rejections.push({
            symbol: inst.symbol,
            time: currentTime,
            reason: proposal.reason,
            code: proposal.code
          });
          continue;
        }

        const ord = proposal.decision.order;

        // Filter 1 Opening Bell Check
        if (options.filterOpeningBellBullish === true && isOpeningBellNse && ord.direction === 'BULLISH') {
          if (orchestrator.riskSentinel && orchestrator.riskSentinel.confirmOrderRejected) {
            orchestrator.riskSentinel.confirmOrderRejected(accountId, ord.orderId, 'OPENING_BELL_FILTER_VETO');
          }
          rejections.push({ symbol: inst.symbol, time: currentTime, code: 'OPENING_BELL_FILTER_VETO' });
          continue;
        }

        const actualFillPrice = Number(nextCandle.open.toFixed(2));
        const ordBasePrice = (ord.entryPrice !== undefined && ord.entryPrice !== null) ? ord.entryPrice : (ord.price || actualFillPrice);
        const stopDistance = Math.abs(ordBasePrice - ord.stopLoss);
        const target1Distance = Math.abs(ord.target1 - ordBasePrice);
        const target2Distance = Math.abs(ord.target2 - ordBasePrice);

        const decimals = actualFillPrice < 1 ? 6 : (actualFillPrice < 50 ? 4 : 2);
        const recalculatedStopLoss = ord.direction === 'BULLISH'
          ? Number((actualFillPrice - stopDistance).toFixed(decimals))
          : Number((actualFillPrice + stopDistance).toFixed(decimals));
        const recalculatedTarget1 = ord.direction === 'BULLISH'
          ? Number((actualFillPrice + target1Distance).toFixed(decimals))
          : Number((actualFillPrice - target1Distance).toFixed(decimals));
        const recalculatedTarget2 = ord.direction === 'BULLISH'
          ? Number((actualFillPrice + target2Distance).toFixed(decimals))
          : Number((actualFillPrice - target2Distance).toFixed(decimals));

        const accState = orchestrator.riskSentinel ? orchestrator.riskSentinel.getAccountState(accountId) : null;
        const availableCash = accState ? (accState.capital.availableCash || 100000) : 100000;
        const maxRiskPct = accState ? (accState.config.maxRiskPerTradePercent || 0.01) : 0.01;
        const riskBudget = availableCash * maxRiskPct;
        const recalculatedQty = stopDistance > 0 ? Math.floor(riskBudget / stopDistance) : 0;

        if (recalculatedQty <= 0) {
          if (orchestrator.riskSentinel && orchestrator.riskSentinel.confirmOrderRejected) {
            orchestrator.riskSentinel.confirmOrderRejected(accountId, ord.orderId, 'PER_TRADE_RISK_CAP_EXCEEDED');
          }
          rejections.push({ symbol: inst.symbol, time: currentTime, code: 'PER_TRADE_RISK_CAP_EXCEEDED' });
          continue;
        }

        const leverage = (ordBasePrice > 0 && ord.marginRequired > 0)
          ? ((ordBasePrice * ord.quantity) / ord.marginRequired)
          : 5;
        const recalculatedMargin = Number(((actualFillPrice * recalculatedQty) / leverage).toFixed(2));

        if (orchestrator.riskSentinel && orchestrator.riskSentinel.confirmOrderFill) {
          orchestrator.riskSentinel.confirmOrderFill(accountId, ord.orderId, {
            quantity: recalculatedQty,
            price: actualFillPrice
          });
        }

        activeTrades.set(inst.symbol, {
          orderId: ord.orderId,
          agentId,
          symbol: ord.symbol,
          action: ord.action,
          direction: ord.direction,
          entryPrice: actualFillPrice,
          stopLoss: recalculatedStopLoss,
          target1: recalculatedTarget1,
          target2: recalculatedTarget2,
          quantity: recalculatedQty,
          initialQuantity: recalculatedQty,
          marginRequired: recalculatedMargin,
          strategyId: proposal.strategyId,
          regime: proposal.regime || 'UNSPECIFIED',
          entryTime: executionTimestamp,
          t1Hit: false,
          partialGrossPnl: 0,
          partialCharges: 0,
          partialNetPnl: 0
        });
      }
    }

    const totalNetPnl = Number(simulatedTrades.reduce((sum, t) => sum + t.netPnl, 0).toFixed(2));
    const fullMetrics = WalkForwardValidator.evaluatePerformance(simulatedTrades, options.initialCapital || 100000, options.marginBase || 25000);

    return {
      simulatedTrades,
      tradeCount: simulatedTrades.length,
      totalNetPnl,
      metrics: fullMetrics,
      rejections
    };
  }
}

module.exports = {
  WalkForwardValidator
};
