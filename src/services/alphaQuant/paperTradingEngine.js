/**
 * 🦅 GARUDA Alpha-Quant: Autonomous Paper Trading Engine
 * Manages virtual portfolio (₹1,00,000), 5x MIS margin sizing,
 * automatic target/SL management, and transparent ledger logging.
 */

const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, '..', '..', '..', 'data', 'garuda-alpha-quant-ledger.json');

class PaperTradingEngine {
  constructor(initialCapital = 100000) {
    this.initialCapital = initialCapital;
    this.maxRiskPerTradePercent = 0.015; // 1.5% max risk per trade (₹1,500 on ₹1L)
    this.slippagePercent = 0.0004; // 0.04% realistic slippage
    this.chargesPercent = 0.0003; // 0.03% STT + exchange turnover fees
    this.intradayLeverage = 5; // 5x MIS leverage (20% margin required)
    this.loadLedger();
  }

  loadLedger() {
    try {
      if (fs.existsSync(LEDGER_PATH)) {
        const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
        const data = JSON.parse(raw);
        this.wallet = data.wallet || {
          initialCapital: this.initialCapital,
          cash: this.initialCapital,
          realizedPnl: 0,
          peakCapital: this.initialCapital
        };
        this.openPositions = data.openPositions || [];
        this.closedTrades = data.closedTrades || [];
        return;
      }
    } catch (e) {
      console.warn('[PaperTradingEngine] Error loading ledger, initializing fresh:', e.message);
    }

    this.wallet = {
      initialCapital: this.initialCapital,
      cash: this.initialCapital,
      realizedPnl: 0,
      peakCapital: this.initialCapital
    };
    this.openPositions = [];
    this.closedTrades = [];
    this.saveLedger();
  }

  resetLedger() {
    this.wallet = {
      initialCapital: this.initialCapital,
      cash: this.initialCapital,
      realizedPnl: 0,
      peakCapital: this.initialCapital
    };
    this.openPositions = [];
    this.closedTrades = [];
    this.saveLedger();
  }

  saveLedger() {
    try {
      const dir = path.dirname(LEDGER_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const data = {
        updatedAt: new Date().toISOString(),
        wallet: this.wallet,
        statistics: this.calculateStatistics(),
        openPositions: this.openPositions,
        closedTrades: this.closedTrades
      };
      fs.writeFileSync(LEDGER_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[PaperTradingEngine] Error saving ledger:', e.message);
    }
  }

  /**
   * Evaluate and execute a high-probability signal
   */
  processSignal(signal, symbol, symbolName) {
    if (!signal.isQualified || signal.score < 75) {
      return { executed: false, reason: `Confidence score ${signal.score}% is below 75% threshold` };
    }

    // Check if we already have an open position in this symbol
    const existing = this.openPositions.find(p => p.symbol === symbol);
    if (existing) {
      return { executed: false, reason: `Position already open for ${symbol}` };
    }

    // Maximum 3 concurrent open positions to protect capital
    if (this.openPositions.length >= 3) {
      return { executed: false, reason: 'Max concurrent positions (3) reached. Preserving cash.' };
    }

    // Calculate Position Sizing
    const totalCapital = this.wallet.cash;
    const maxRiskBudget = totalCapital * this.maxRiskPerTradePercent; // e.g. ₹1,500
    const riskPerShare = Math.max(signal.riskPerShare, signal.price * 0.004);

    let quantity = Math.floor(maxRiskBudget / riskPerShare);

    // Capital allocation cap: max 35% of total capital value per position
    const maxSharesByCapital = Math.floor((totalCapital * 0.35 * this.intradayLeverage) / signal.price);
    quantity = Math.min(quantity, maxSharesByCapital);

    if (quantity <= 0) {
      return { executed: false, reason: 'Insufficient margin to purchase at least 1 share safely' };
    }

    // Apply realistic slippage on entry
    const entryPriceWithSlippage = signal.action === 'BUY'
      ? Number((signal.price * (1 + this.slippagePercent)).toFixed(2))
      : Number((signal.price * (1 - this.slippagePercent)).toFixed(2));

    const totalOrderValue = entryPriceWithSlippage * quantity;
    const marginRequired = Number((totalOrderValue / this.intradayLeverage).toFixed(2));

    if (marginRequired > this.wallet.cash) {
      return { executed: false, reason: 'Margin required exceeds available cash' };
    }

    this.wallet.cash = Number((this.wallet.cash - marginRequired).toFixed(2));

    const position = {
      id: `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      symbol,
      symbolName,
      direction: signal.direction,
      action: signal.action,
      score: signal.score,
      quantity,
      entryPrice: entryPriceWithSlippage,
      stopLoss: signal.stopLoss,
      target1: signal.target1,
      target2: signal.target2,
      marginLocked: marginRequired,
      isTrailingActive: false,
      entryTime: signal.time ? new Date(signal.time).toISOString() : new Date().toISOString(),
      factors: signal.factors,
      romanHindiSummary: signal.romanHindiSummary
    };

    this.openPositions.push(position);
    this.saveLedger();

    return {
      executed: true,
      position,
      message: `[AUTO-${signal.action}] ${quantity} shares of ${symbolName} @ ₹${entryPriceWithSlippage} (Score: ${signal.score}%)`
    };
  }

  /**
   * Update open positions against incoming candle price
   */
  updatePositionsWithCandle(symbol, candle) {
    const closedThisStep = [];
    const remainingPositions = [];

    const totalMinutesIST = (candle.time.getUTCHours() * 60 + candle.time.getUTCMinutes() + 330) % 1440;
    const isEODSquareOff = totalMinutesIST >= 915; // 3:15 PM IST square-off

    for (const pos of this.openPositions) {
      if (pos.symbol !== symbol) {
        remainingPositions.push(pos);
        continue;
      }

      let isClosed = false;
      let exitReason = null;
      let exitPrice = null;

      if (pos.action === 'BUY') {
        // 1. Check Stop-Loss
        if (candle.low <= pos.stopLoss) {
          isClosed = true;
          exitPrice = Number((pos.stopLoss * (1 - this.slippagePercent)).toFixed(2));
          exitReason = pos.isTrailingActive ? 'TRAILING_STOP_LOSS_BREAKEVEN' : 'STOP_LOSS_HIT';
        }
        // 2. Check Target 2 (Full Profit Jackpot)
        else if (candle.high >= pos.target2) {
          isClosed = true;
          exitPrice = Number((pos.target2 * (1 - this.slippagePercent)).toFixed(2));
          exitReason = 'TARGET_2_JACKPOT_HIT';
        }
        // 3. Check Target 1 (Book 50% Partial Profit & Move Remaining SL to Breakeven)
        else if (candle.high >= pos.target1 && !pos.isTrailingActive) {
          pos.isTrailingActive = true;
          const bookQty = Math.floor(pos.quantity / 2);
          if (bookQty > 0) {
            const partialExitPrice = Number((pos.target1 * (1 - this.slippagePercent)).toFixed(2));
            const grossGain = (partialExitPrice - pos.entryPrice) * bookQty;
            const charges = Number(((pos.entryPrice + partialExitPrice) * bookQty * this.chargesPercent).toFixed(2));
            const netGain = Number((grossGain - charges).toFixed(2));
            const releasedMargin = Number(((pos.marginLocked * bookQty) / pos.quantity).toFixed(2));

            this.wallet.cash = Number((this.wallet.cash + releasedMargin + netGain).toFixed(2));
            this.wallet.realizedPnl = Number((this.wallet.realizedPnl + netGain).toFixed(2));

            pos.quantity -= bookQty;
            pos.marginLocked = Number((pos.marginLocked - releasedMargin).toFixed(2));
            pos.realizedPartial = (pos.realizedPartial || 0) + netGain;
          }
          pos.stopLoss = Number((pos.entryPrice * 1.001).toFixed(2));
          pos.trailingNotes = `Target 1 hit! 50% booked. SL moved to Breakeven (₹${pos.stopLoss}).`;
        }
        // 4. Intraday End of Day Square Off
        else if (isEODSquareOff) {
          isClosed = true;
          exitPrice = candle.close;
          exitReason = 'INTRADAY_EOD_SQUARE_OFF';
        }
      } else if (pos.action === 'SELL') {
        // 1. Check Stop-Loss
        if (candle.high >= pos.stopLoss) {
          isClosed = true;
          exitPrice = Number((pos.stopLoss * (1 + this.slippagePercent)).toFixed(2));
          exitReason = pos.isTrailingActive ? 'TRAILING_STOP_LOSS_BREAKEVEN' : 'STOP_LOSS_HIT';
        }
        // 2. Check Target 2
        else if (candle.low <= pos.target2) {
          isClosed = true;
          exitPrice = Number((pos.target2 * (1 + this.slippagePercent)).toFixed(2));
          exitReason = 'TARGET_2_JACKPOT_HIT';
        }
        // 3. Check Target 1 (Book 50% & Trail)
        else if (candle.low <= pos.target1 && !pos.isTrailingActive) {
          pos.isTrailingActive = true;
          const bookQty = Math.floor(pos.quantity / 2);
          if (bookQty > 0) {
            const partialExitPrice = Number((pos.target1 * (1 + this.slippagePercent)).toFixed(2));
            const grossGain = (pos.entryPrice - partialExitPrice) * bookQty;
            const charges = Number(((pos.entryPrice + partialExitPrice) * bookQty * this.chargesPercent).toFixed(2));
            const netGain = Number((grossGain - charges).toFixed(2));
            const releasedMargin = Number(((pos.marginLocked * bookQty) / pos.quantity).toFixed(2));

            this.wallet.cash = Number((this.wallet.cash + releasedMargin + netGain).toFixed(2));
            this.wallet.realizedPnl = Number((this.wallet.realizedPnl + netGain).toFixed(2));

            pos.quantity -= bookQty;
            pos.marginLocked = Number((pos.marginLocked - releasedMargin).toFixed(2));
            pos.realizedPartial = (pos.realizedPartial || 0) + netGain;
          }
          pos.stopLoss = Number((pos.entryPrice * 0.999).toFixed(2));
        }
        // 4. Intraday End of Day Square Off
        else if (isEODSquareOff) {
          isClosed = true;
          exitPrice = candle.close;
          exitReason = 'INTRADAY_EOD_SQUARE_OFF';
        }
      }

      if (isClosed) {
        // Calculate P&L
        const grossPnl = pos.action === 'BUY'
          ? (exitPrice - pos.entryPrice) * pos.quantity
          : (pos.entryPrice - exitPrice) * pos.quantity;

        const turnover = (pos.entryPrice + exitPrice) * pos.quantity;
        const totalCharges = Number((turnover * this.chargesPercent).toFixed(2));
        const netPnl = Number((grossPnl - totalCharges).toFixed(2));

        // Return margin and remaining P&L to wallet
        this.wallet.cash = Number((this.wallet.cash + pos.marginLocked + netPnl).toFixed(2));
        this.wallet.realizedPnl = Number((this.wallet.realizedPnl + netPnl).toFixed(2));
        if (this.wallet.cash > this.wallet.peakCapital) {
          this.wallet.peakCapital = this.wallet.cash;
        }

        const totalNetPnl = Number((netPnl + (pos.realizedPartial || 0)).toFixed(2));

        const closedRecord = {
          id: pos.id,
          symbol: pos.symbol,
          symbolName: pos.symbolName,
          direction: pos.direction,
          action: pos.action,
          score: pos.score,
          quantity: pos.quantity,
          entryPrice: pos.entryPrice,
          exitPrice,
          entryTime: pos.entryTime,
          exitTime: candle.time ? new Date(candle.time).toISOString() : new Date().toISOString(),
          grossPnl: Number(grossPnl.toFixed(2)),
          charges: totalCharges,
          netPnl: totalNetPnl,
          exitReason,
          isWin: totalNetPnl > 0
        };

        this.closedTrades.push(closedRecord);
        closedThisStep.push(closedRecord);
      } else {
        remainingPositions.push(pos);
      }
    }

    this.openPositions = remainingPositions;
    if (closedThisStep.length > 0) {
      this.saveLedger();
    }

    return closedThisStep;
  }

  /**
   * Force square off any open positions at the end of a simulation
   */
  squareOffRemaining(latestPrices = {}) {
    const closed = [];
    for (const pos of this.openPositions) {
      const exitPrice = latestPrices[pos.symbol] || pos.entryPrice;
      const grossPnl = pos.action === 'BUY'
        ? (exitPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - exitPrice) * pos.quantity;

      const turnover = (pos.entryPrice + exitPrice) * pos.quantity;
      const totalCharges = Number((turnover * this.chargesPercent).toFixed(2));
      const netPnl = Number((grossPnl - totalCharges).toFixed(2));

      this.wallet.cash = Number((this.wallet.cash + pos.marginLocked + netPnl).toFixed(2));
      this.wallet.realizedPnl = Number((this.wallet.realizedPnl + netPnl).toFixed(2));

      const closedRecord = {
        id: pos.id,
        symbol: pos.symbol,
        symbolName: pos.symbolName,
        direction: pos.direction,
        action: pos.action,
        score: pos.score,
        quantity: pos.quantity,
        entryPrice: pos.entryPrice,
        exitPrice,
        entryTime: pos.entryTime,
        exitTime: new Date().toISOString(),
        grossPnl: Number(grossPnl.toFixed(2)),
        charges: totalCharges,
        netPnl,
        exitReason: 'SIMULATION_END_SQUARE_OFF',
        isWin: netPnl > 0
      };

      this.closedTrades.push(closedRecord);
      closed.push(closedRecord);
    }

    this.openPositions = [];
    this.saveLedger();
    return closed;
  }

  /**
   * Calculate comprehensive quantitative statistics
   */
  calculateStatistics() {
    const totalTrades = this.closedTrades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winCount: 0,
        lossCount: 0,
        winRatePercent: 0,
        netPnl: 0,
        roiPercent: 0,
        profitFactor: 0,
        maxDrawdownPercent: 0,
        currentWalletBalance: this.wallet.cash
      };
    }

    const wins = this.closedTrades.filter(t => t.netPnl > 0);
    const losses = this.closedTrades.filter(t => t.netPnl < 0);
    const totalWinMoney = wins.reduce((acc, t) => acc + t.netPnl, 0);
    const totalLossMoney = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));

    const winRate = Number(((wins.length / totalTrades) * 100).toFixed(1));
    const netPnl = Number(this.closedTrades.reduce((acc, t) => acc + t.netPnl, 0).toFixed(2));
    const roi = Number(((netPnl / this.initialCapital) * 100).toFixed(2));
    const profitFactor = totalLossMoney > 0 ? Number((totalWinMoney / totalLossMoney).toFixed(2)) : (totalWinMoney > 0 ? 99.9 : 1.0);

    const maxDrawdown = Number((((this.wallet.peakCapital - this.wallet.cash) / this.wallet.peakCapital) * 100).toFixed(2));

    return {
      totalTrades,
      winCount: wins.length,
      lossCount: losses.length,
      winRatePercent: winRate,
      netPnl,
      roiPercent: roi,
      profitFactor,
      maxDrawdownPercent: Math.max(0, maxDrawdown),
      currentWalletBalance: this.wallet.cash
    };
  }
}

module.exports = {
  PaperTradingEngine,
  LEDGER_PATH
};
