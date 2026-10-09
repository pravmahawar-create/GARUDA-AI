/**
 * 🦅 GARUDA Alpha-Quant: Weekly Nifty 50 Options (CE / PE) Paper Trading Backtest
 * Simulates real 5-minute Nifty 50 tick candles for this week (5-Oct to 9-Oct).
 * Uses 1 Lot Nifty (25 Qty) ATM Options with 5-Factor Institutional Confluence.
 */

const { MarketDataFeed, BENCHMARK_SYMBOL } = require('../src/services/alphaQuant/marketDataFeed');
const { ConfluenceScorer } = require('../src/services/alphaQuant/confluenceScorer');

async function runNiftyWeeklyBacktest() {
  console.log('========================================================================================');
  console.log('🦅 GARUDA Alpha-Quant: Nifty 50 CE / PE Weekly Paper Trading Report (Real 5m Candles)');
  console.log('Starting Capital: ₹5,000 | Trade Sizing: 1 Lot Nifty (25 Qty) ATM Contract');
  console.log('Strategy: 5-Factor Confluence (EMA Fan, VWAP, RSI Sweet-spot, MACD Momentum, ADX)');
  console.log('Time Windows: Morning (9:45 - 11:30 AM IST) & Afternoon (1:15 - 2:45 PM IST)');
  console.log('Risk-to-Reward: Strict 18-Point SL (~₹450) | 20-Point Tgt-1 (Breakeven Lock) | 36-Point Tgt-2');
  console.log('========================================================================================\n');

  const feed = new MarketDataFeed();
  const scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 }); // 60% threshold calibrated for index volatility

  console.log('📡 Fetching real 5-minute historical Nifty 50 candles (^NSEI)...');
  const rawCandles = await feed.fetchCandles(BENCHMARK_SYMBOL, '5m', '5d');

  if (!rawCandles || rawCandles.length < 50) {
    console.error('❌ Insufficient historical candles received from market feed.');
    return;
  }

  const candles = feed.enrichIndicators(rawCandles);

  // Calibrate range volatility proxy for index volume (since ^NSEI cash index has 0 raw volume)
  candles.forEach(c => {
    const range = c.high - c.low;
    if (c.atr && range > c.atr * 1.1) {
      c.volumeRatio = 1.6;
    } else {
      c.volumeRatio = 1.0;
    }
  });

  console.log(`✓ Loaded and enriched ${candles.length} candles across this week.\n`);

  let capital = 5000;
  const initialCapital = 5000;
  const lotSize = 25; // 1 lot of Nifty
  const tradeLog = [];
  let currentPosition = null;

  for (let i = 25; i < candles.length; i++) {
    const currentCandle = candles[i];
    const history = candles.slice(Math.max(0, i - 25), i);

    const candleDate = new Date(currentCandle.time);
    const totalMinutesIST = (candleDate.getUTCHours() * 60 + candleDate.getUTCMinutes() + 330) % 1440;
    const timeStr = candleDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const dateStr = candleDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

    // 1. Manage Active Trade
    if (currentPosition) {
      let isClosed = false;
      let exitReason = '';
      let optionExitPremium = 0;

      // Option Delta approximation (~0.52 for ATM)
      const niftyMove = currentPosition.action === 'CALL (CE)'
        ? (currentCandle.close - currentPosition.niftyEntry)
        : (currentPosition.niftyEntry - currentCandle.close);

      const highNiftyMove = currentPosition.action === 'CALL (CE)'
        ? (currentCandle.high - currentPosition.niftyEntry)
        : (currentPosition.niftyEntry - currentCandle.low);

      const lowNiftyMove = currentPosition.action === 'CALL (CE)'
        ? (currentCandle.low - currentPosition.niftyEntry)
        : (currentPosition.niftyEntry - currentCandle.high);

      const estOptionHigh = Number((currentPosition.entryPremium + (highNiftyMove * 0.52)).toFixed(2));
      const estOptionLow = Number((currentPosition.entryPremium + (lowNiftyMove * 0.52)).toFixed(2));
      const estOptionCurrent = Number((currentPosition.entryPremium + (niftyMove * 0.52)).toFixed(2));

      // Check Stop-Loss Hit
      if (estOptionLow <= currentPosition.stopLossPremium) {
        isClosed = true;
        exitReason = currentPosition.isTrailing ? 'TRAILING_SL_BREAKEVEN' : 'STOP_LOSS_HIT';
        optionExitPremium = currentPosition.stopLossPremium;
      }
      // Check Target 2 Hit (Jackpot runner ~ +36 pts gain)
      else if (estOptionHigh >= currentPosition.target2Premium) {
        isClosed = true;
        exitReason = 'TARGET_2_JACKPOT_HIT';
        optionExitPremium = currentPosition.target2Premium;
      }
      // Check Target 1 Hit (+20 pts gain) -> Trail SL to Breakeven
      else if (estOptionHigh >= currentPosition.target1Premium && !currentPosition.isTrailing) {
        currentPosition.isTrailing = true;
        currentPosition.stopLossPremium = currentPosition.entryPremium + 1.5; // Breakeven lock + minor slippage buffer
      }
      // EOD Auto Square-off at 3:15 PM IST (915 mins)
      else if (totalMinutesIST >= 915) {
        isClosed = true;
        exitReason = 'INTRADAY_EOD_SQUARE_OFF';
        optionExitPremium = Math.max(1, estOptionCurrent);
      }

      if (isClosed) {
        const pnlPerShare = Number((optionExitPremium - currentPosition.entryPremium).toFixed(2));
        const netPnl = Math.round(pnlPerShare * lotSize);
        capital += netPnl;

        tradeLog.push({
          date: currentPosition.dateStr,
          entryTime: currentPosition.entryTime,
          exitTime: timeStr,
          action: currentPosition.action,
          strike: currentPosition.strike,
          niftyEntry: currentPosition.niftyEntry,
          niftyExit: currentCandle.close,
          entryPremium: currentPosition.entryPremium,
          exitPremium: optionExitPremium,
          pnlPoints: pnlPerShare,
          netPnl,
          capitalAfter: capital,
          exitReason
        });

        currentPosition = null;
      }
    }

    // 2. Look for Fresh High-Probability Entry (if no open trade)
    if (!currentPosition) {
      const signal = scorer.evaluateSetup(currentCandle, history, currentCandle, { is24x7: false });

      if (signal.isQualified && signal.score >= 60) {
        const atmStrike = Math.round(currentCandle.close / 50) * 50;
        const actionType = signal.action === 'BUY' ? 'CALL (CE)' : 'PUT (PE)';
        const basePremium = 115.0; // Typical liquid ATM Nifty option price
        const slPoints = 18.0;
        const tgt1Points = 20.0;
        const tgt2Points = 36.0;

        currentPosition = {
          dateStr,
          entryTime: timeStr,
          action: actionType,
          strike: `NIFTY ${atmStrike} ${actionType === 'CALL (CE)' ? 'CE' : 'PE'}`,
          niftyEntry: currentCandle.close,
          entryPremium: basePremium,
          stopLossPremium: basePremium - slPoints,
          target1Premium: basePremium + tgt1Points,
          target2Premium: basePremium + tgt2Points,
          isTrailing: false,
          score: signal.score,
          factors: signal.factors
        };
      }
    }
  }

  // Summary Metrics Table
  console.log('---------------------------------------------------------------------------------------------------------------');
  console.log('| # | Date        | Entry  | Exit   | Contract        | Strike          | Entry₹ | Exit₹ | Net P&L (₹) | Exit Type         |');
  console.log('---------------------------------------------------------------------------------------------------------------');

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let totalPnl = 0;

  tradeLog.forEach((t, idx) => {
    if (t.netPnl > 60) wins++;
    else if (t.netPnl < -60) losses++;
    else breakevens++;
    totalPnl += t.netPnl;

    const pnlFormatted = t.netPnl >= 0 ? `+₹${t.netPnl}` : `-₹${Math.abs(t.netPnl)}`;
    const statusIcon = t.netPnl > 60 ? '🟢 WIN ' : (t.netPnl < -60 ? '🔴 LOSS' : '⚪ BE  ');

    console.log(
      `| ${(idx + 1).toString().padEnd(2)}| ${t.date.padEnd(12)}| ${t.entryTime.padEnd(7)}| ${t.exitTime.padEnd(7)}| ${t.action.padEnd(16)}| ${t.strike.padEnd(16)}| ₹${t.entryPremium.toFixed(1).padEnd(6)}| ₹${t.exitPremium.toFixed(1).padEnd(6)}| ${pnlFormatted.padEnd(12)}| ${statusIcon} (${t.exitReason.slice(0, 11)}) |`
    );
  });

  console.log('---------------------------------------------------------------------------------------------------------------\n');

  const winRate = tradeLog.length > 0 ? ((wins / tradeLog.length) * 100).toFixed(1) : 0;
  const roi = (((capital - initialCapital) / initialCapital) * 100).toFixed(1);

  console.log('📊 ================= FINAL WEEKLY PERFORMANCE DOSSIER =================');
  console.log(`💰 Starting Capital:        ₹${initialCapital.toLocaleString('en-IN')}`);
  console.log(`💵 Ending Capital:          ₹${capital.toLocaleString('en-IN')}`);
  console.log(`📈 Net Realized P&L:        ${totalPnl >= 0 ? '+' : ''}₹${totalPnl.toLocaleString('en-IN')}`);
  console.log(`🚀 Net Weekly ROI:          ${roi}%`);
  console.log(`🎯 Total Trades Taken:      ${tradeLog.length}`);
  console.log(`🏆 Winning Trades:          ${wins}`);
  console.log(`🛑 Losing Trades:           ${losses}`);
  console.log(`⚖️ Breakeven / Flat:        ${breakevens}`);
  console.log(`🔥 Realized Win Rate:       ${winRate}%`);
  console.log('========================================================================\n');
}

runNiftyWeeklyBacktest().catch(console.error);
