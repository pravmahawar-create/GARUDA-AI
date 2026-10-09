/**
 * 🦅 GARUDA Alpha-Quant: NIFTY 50 Options Paper Trading Backtest (LAST WEEK: 28-Sep to 01-Oct)
 * Full Implementation of the Founder Praveen Sniper Concept:
 * 1. Capital: ₹5,000 | Size: 1 Lot Nifty (25 Qty) ATM Contract
 * 2. Strict 5-Minute Candle Confirmation
 * 3. Execution Windows: 09:45 AM - 11:30 AM & 01:15 PM - 02:45 PM
 * 4. Stop Loss: 18 Points (~₹450 per trade)
 * 5. Trailing SL: At +20 Points (+₹500), Trail SL to Cost (+1.5 buffer)
 * 6. Target 2: +36 Points (+₹900 Jackpot)
 * 7. TIMER STOP RULE: If trade remains stuck for 40-45 minutes without hitting Target or SL,
 *    exit automatically to protect capital against Theta Time Decay.
 * 8. DAILY ₹1,800 LOCK: Once daily profit reaches +₹1,500 to +₹1,800, TERMINAL HARD LOCK.
 * 9. MAX DAILY LOSS: Max 2 consecutive losses (-₹900), TERMINAL HARD LOCK.
 */

try { require('dotenv').config(); } catch (e) {}

const { MarketDataFeed, BENCHMARK_SYMBOL } = require('../src/services/alphaQuant/marketDataFeed');
const { ConfluenceScorer } = require('../src/services/alphaQuant/confluenceScorer');

async function runLastWeekBacktest() {
  console.log('===================================================================================================');
  console.log('🦅 GARUDA Alpha-Quant: NIFTY 50 Options Paper Trading (LAST WEEK: 28 Sept – 01 Oct 2026)');
  console.log('Strategy: 5-Factor Institutional Confluence + Sniper ₹1,800 Lock + 40-Min Timer Stop');
  console.log('Capital: ₹5,000 | Sizing: 1 Lot (25 Qty) | SL: 18 Pts (~₹450) | Target: +36 Pts (+₹900)');
  console.log('===================================================================================================\n');

  const feed = new MarketDataFeed();
  const scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 });

  console.log('📡 Fetching historical 5-minute Nifty candles (10-day lookback)...');
  const rawCandles = await feed.fetchCandles(BENCHMARK_SYMBOL, '5m', '10d');

  if (!rawCandles || rawCandles.length < 100) {
    console.error('❌ Insufficient historical candles received.');
    return;
  }

  const allCandles = feed.enrichIndicators(rawCandles);
  allCandles.forEach(c => {
    const range = c.high - c.low;
    c.volumeRatio = (c.atr && range > c.atr * 1.1) ? 1.6 : 1.0;
  });

  // Filter specifically for LAST WEEK: 25 Sept to 01 Oct 2026
  // (02 Oct was Gandhi Jayanti holiday, 03-04 Oct was weekend)
  const lastWeekCandles = allCandles.filter(c => {
    const d = new Date(c.time);
    const dateStr = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    // Dates: 25/09/2026, 28/09/2026, 29/09/2026, 30/09/2026, 01/10/2026
    const [day, month] = dateStr.split('/');
    if (month === '09' && parseInt(day, 10) >= 28) return true;
    if (month === '10' && parseInt(day, 10) <= 1) return true;
    return false;
  });

  console.log(`✓ Isolated ${lastWeekCandles.length} candles for Last Week (28 Sept – 01 Oct).\n`);

  let capital = 5000;
  const initialCapital = 5000;
  const lotSize = 25;
  const tradeLog = [];

  let currentDate = '';
  let dailyTrades = 0;
  let dailyPnl = 0;
  let isDailyLocked = false;
  let dailyLockReason = '';
  let currentPosition = null;

  for (let i = 20; i < lastWeekCandles.length; i++) {
    const candle = lastWeekCandles[i];
    const history = lastWeekCandles.slice(Math.max(0, i - 20), i);

    const candleDate = new Date(candle.time);
    const dateStr = candleDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' });
    const timeStr = candleDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const totalMinutesIST = (candleDate.getUTCHours() * 60 + candleDate.getUTCMinutes() + 330) % 1440;

    // Day change reset
    if (dateStr !== currentDate) {
      if (currentDate !== '') {
        console.log(`  📅 [DAY SUMMARY] ${currentDate} | Day P&L: ${dailyPnl >= 0 ? '+' : ''}₹${dailyPnl} | Trades: ${dailyTrades} | ${dailyLockReason || 'Session Finished'}\n`);
      }
      currentDate = dateStr;
      dailyTrades = 0;
      dailyPnl = 0;
      isDailyLocked = false;
      dailyLockReason = '';
      currentPosition = null;
    }

    // 1. Manage Active Position
    if (currentPosition) {
      const niftyMove = currentPosition.action === 'CALL (CE)'
        ? (candle.close - currentPosition.niftyEntry)
        : (currentPosition.niftyEntry - candle.close);

      const highNiftyMove = currentPosition.action === 'CALL (CE)'
        ? (candle.high - currentPosition.niftyEntry)
        : (currentPosition.niftyEntry - candle.low);

      const lowNiftyMove = currentPosition.action === 'CALL (CE)'
        ? (candle.low - currentPosition.niftyEntry)
        : (currentPosition.niftyEntry - candle.high);

      const estHigh = Number((currentPosition.entryPremium + (highNiftyMove * 0.52)).toFixed(2));
      const estLow = Number((currentPosition.entryPremium + (lowNiftyMove * 0.52)).toFixed(2));
      const estCurrent = Number((currentPosition.entryPremium + (niftyMove * 0.52)).toFixed(2));

      let isClosed = false;
      let exitReason = '';
      let exitPremium = 0;

      // Condition 1: Stop Loss Hit (18 Pts)
      if (estLow <= currentPosition.stopLossPremium) {
        isClosed = true;
        exitReason = currentPosition.isTrailing ? 'TRAILING_SL_BREAKEVEN' : 'STOP_LOSS_HIT';
        exitPremium = currentPosition.stopLossPremium;
      }
      // Condition 2: Target 2 Hit (+36 Pts / +₹900)
      else if (estHigh >= currentPosition.target2Premium) {
        isClosed = true;
        exitReason = 'TARGET_2_JACKPOT (+₹900)';
        exitPremium = currentPosition.target2Premium;
      }
      // Condition 3: Target 1 Hit (+20 Pts) -> Trail SL to Cost
      else if (estHigh >= currentPosition.target1Premium && !currentPosition.isTrailing) {
        currentPosition.isTrailing = true;
        currentPosition.stopLossPremium = currentPosition.entryPremium + 1.5; // Cost locked
      }
      // Condition 4: TIMER STOP RULE (40 Minutes Stagnation)
      else if ((totalMinutesIST - currentPosition.entryMinute >= 40) && !currentPosition.isTrailing) {
        isClosed = true;
        exitReason = 'TIMER_STOP_TIMEOUT (40m Stagnant, Theta Protected)';
        exitPremium = estCurrent;
      }
      // Condition 5: 03:15 PM EOD Square-off
      else if (totalMinutesIST >= 915) {
        isClosed = true;
        exitReason = 'EOD_AUTO_SQUARE_OFF';
        exitPremium = Math.max(1, estCurrent);
      }

      if (isClosed) {
        const pnlPoints = Number((exitPremium - currentPosition.entryPremium).toFixed(2));
        const netPnl = Math.round(pnlPoints * lotSize);
        dailyPnl += netPnl;
        capital += netPnl;

        tradeLog.push({
          date: currentPosition.dateStr,
          entryTime: currentPosition.entryTime,
          exitTime: timeStr,
          action: currentPosition.action,
          strike: currentPosition.strike,
          entryPremium: currentPosition.entryPremium,
          exitPremium,
          pnlPoints,
          netPnl,
          exitReason
        });

        const statusIcon = netPnl > 60 ? '🟢 WIN ' : (netPnl < -60 ? '🔴 LOSS' : '⚪ BE  ');
        console.log(`  🎯 [TRADE EXIT] ${dateStr} ${timeStr} | ${currentPosition.strike} | Exit: ₹${exitPremium} | P&L: ${netPnl >= 0 ? '+' : ''}₹${netPnl} | ${statusIcon} (${exitReason})`);

        currentPosition = null;

        // Daily Lock Checks
        if (dailyPnl >= 1500) {
          isDailyLocked = true;
          dailyLockReason = `🎯 TARGET_LOCKED (+₹${dailyPnl} Banked)`;
          console.log(`  🔒 >>> [DAILY PROFIT LOCK TRIGGERED] ${dailyLockReason} - TERMINAL CLOSED TODAY <<<\n`);
        } else if (dailyPnl <= -900) {
          isDailyLocked = true;
          dailyLockReason = `🛑 MAX_LOSS_BREAKER (-₹${Math.abs(dailyPnl)} Protected)`;
          console.log(`  🔒 >>> [DAILY RISK LIMIT TRIGGERED] ${dailyLockReason} - TERMINAL CLOSED TODAY <<<\n`);
        }
      }
    }

    // 2. Fresh Signal Check (if no active position and not locked)
    if (!currentPosition && !isDailyLocked) {
      const isMorning = totalMinutesIST >= 585 && totalMinutesIST <= 690; // 9:45 to 11:30
      const isAfternoon = totalMinutesIST >= 795 && totalMinutesIST <= 885; // 1:15 to 2:45

      if ((isMorning || isAfternoon) && dailyTrades < 2) {
        const signal = scorer.evaluateSetup(candle, history, candle, { is24x7: false });

        if (signal.isQualified && signal.score >= 60) {
          const atmStrike = Math.round(candle.close / 50) * 50;
          const actionType = signal.action === 'BUY' ? 'CALL (CE)' : 'PUT (PE)';
          const basePremium = 115.0;
          const slPoints = 18.0;
          const tgt1Points = 20.0;
          const tgt2Points = 36.0;

          currentPosition = {
            dateStr,
            entryTime: timeStr,
            entryMinute: totalMinutesIST,
            action: actionType,
            strike: `NIFTY ${atmStrike} ${actionType === 'CALL (CE)' ? 'CE' : 'PE'}`,
            niftyEntry: candle.close,
            entryPremium: basePremium,
            stopLossPremium: basePremium - slPoints,
            target1Premium: basePremium + tgt1Points,
            target2Premium: basePremium + tgt2Points,
            isTrailing: false,
            score: signal.score
          };

          dailyTrades++;
          console.log(`  ⚡ [SIGNAL] ${dateStr} ${timeStr} | BUY ${currentPosition.strike} @ ₹${basePremium} | SL: ₹${basePremium - slPoints} | Conf: ${signal.score}%`);
        }
      }
    }
  }

  if (currentDate !== '') {
    console.log(`  📅 [DAY SUMMARY] ${currentDate} | Day P&L: ${dailyPnl >= 0 ? '+' : ''}₹${dailyPnl} | Trades: ${dailyTrades} | ${dailyLockReason || 'Session Finished'}\n`);
  }

  // Summary Metrics Table
  console.log('===============================================================================================================');
  console.log('| # | Date        | Entry  | Exit   | Action    | Strike          | Entry₹ | Exit₹ | Net P&L (₹) | Exit Reason       |');
  console.log('===============================================================================================================');

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
      `| ${(idx + 1).toString().padEnd(2)}| ${t.date.padEnd(12)}| ${t.entryTime.padEnd(7)}| ${t.exitTime.padEnd(7)}| ${t.action.padEnd(10)}| ${t.strike.padEnd(16)}| ₹${t.entryPremium.toFixed(1).padEnd(6)}| ₹${t.exitPremium.toFixed(1).padEnd(6)}| ${pnlFormatted.padEnd(12)}| ${statusIcon} (${t.exitReason.slice(0, 15)}) |`
    );
  });

  console.log('===============================================================================================================\n');

  const winRate = tradeLog.length > 0 ? ((wins / tradeLog.length) * 100).toFixed(1) : 0;
  const roi = (((capital - initialCapital) / initialCapital) * 100).toFixed(1);

  console.log('📊 ================= LAST WEEK PERFORMANCE DOSSIER =================');
  console.log(`💰 Starting Capital:        ₹${initialCapital.toLocaleString('en-IN')}`);
  console.log(`💵 Ending Capital:          ₹${capital.toLocaleString('en-IN')}`);
  console.log(`📈 Net Realized P&L:        ${totalPnl >= 0 ? '+' : ''}₹${totalPnl.toLocaleString('en-IN')}`);
  console.log(`🚀 Net Weekly ROI:          ${roi}%`);
  console.log(`🎯 Total Trades Taken:      ${tradeLog.length}`);
  console.log(`🏆 Winning Trades:          ${wins}`);
  console.log(`🛑 Losing Trades:           ${losses}`);
  console.log(`⚖️ Breakeven / Flat:        ${breakevens}`);
  console.log(`🔥 Win Rate:                ${winRate}%`);
  console.log('====================================================================\n');
}

runLastWeekBacktest().catch(console.error);
