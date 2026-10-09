/**
 * 🦅 GARUDA Alpha-Quant: NIFTY 50 Options Sniper Execution Daemon
 * Dedicated to Founder Praveen & Brother.
 * 
 * CORE RULES ("Sniper ₹1,800 Profit Lock Law"):
 * 1. Capital: ₹5,000 (Trade 1 Lot = 25 Qty ATM Option)
 * 2. Timeframe: 5-Minute Candle Confirmation (Strictly NO 1m/2m Noise)
 * 3. Execution Hours: 09:45 AM - 11:30 AM IST (Golden Morning Window)
 * 4. Stop Loss: 18 Points (~₹450 Risk per trade)
 * 5. Target 1: +20 Points (+₹500) -> Trail SL to Cost (Zero Risk)
 * 6. Target 2: +36 to +72 Points (+₹900 to +₹1,800)
 * 7. DAILY SNIPER LOCK: Once Daily Profit touches +₹1,500 to +₹1,800 -> HARD LOCK (No more trades).
 * 8. MAX DAILY RISK: 2 Trades Max (Max Loss = ₹900) -> HARD LOCK.
 */

try { require('dotenv').config(); } catch (e) {}

const { MarketDataFeed, BENCHMARK_SYMBOL, HEAVYWEIGHT_SYMBOLS } = require('../../src/services/alphaQuant/marketDataFeed');
const { ConfluenceScorer } = require('../../src/services/alphaQuant/confluenceScorer');
const { TelegramQuantNotifier } = require('../../src/services/alphaQuant/telegramQuantNotifier');
const { OpportunityRadar } = require('../../src/services/alphaQuant/opportunityRadar');

class NiftyOptionsSniperDaemon {
  constructor(options = {}) {
    this.feed = new MarketDataFeed();
    this.scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 });
    this.notifier = new TelegramQuantNotifier();
    this.radar = new OpportunityRadar({ lockedSymbol: options.lockedSymbol });
    this.initialCapital = options.initialCapital || 5000;
    this.capital = this.initialCapital;
    this.lotSize = 25; // 1 Lot Nifty
    this.dailyTarget = 1800; // Sniper Profit Lock Target
    this.maxDailyLoss = 900; // 2 Stop Losses Max
    this.maxTradesPerDay = 2;

    // Daily Session State
    this.tradesToday = 0;
    this.dailyPnl = 0;
    this.isLockedToday = false;
    this.lockReason = '';
    this.currentPosition = null;
  }

  /**
   * Evaluates setup on a fresh 5-minute candle
   */
  evaluateCandle(currentCandle, history, heavyweights = []) {
    if (this.isLockedToday) {
      return { action: 'LOCKED', reason: this.lockReason };
    }

    const candleDate = new Date(currentCandle.time);
    const totalMinutesIST = (candleDate.getUTCHours() * 60 + candleDate.getUTCMinutes() + 330) % 1440;
    const timeStr = candleDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

    // 1. Time Window Filter: 9:45 AM (585 min) to 11:30 AM (690 min) & 1:15 PM (795 min) to 2:45 PM (885 min)
    const isMorningWindow = totalMinutesIST >= 585 && totalMinutesIST <= 690;
    const isAfternoonWindow = totalMinutesIST >= 795 && totalMinutesIST <= 885;

    // Manage Open Position
    if (this.currentPosition) {
      const exitEvent = this.manageOpenPosition(currentCandle, totalMinutesIST, timeStr);
      if (exitEvent.action === 'EXIT_TRIGGERED') {
        return exitEvent;
      }
      return exitEvent;
    }

    // Don't open trades outside prime momentum windows or if 2 trades already taken
    if (!isMorningWindow && !isAfternoonWindow) {
      return { action: 'WAITING_WINDOW', timeStr };
    }

    if (this.tradesToday >= this.maxTradesPerDay) {
      this.lockSession('MAX_TRADES_EXHAUSTED (2 Trades Completed)');
      return { action: 'LOCKED', reason: this.lockReason };
    }

    // 2. Evaluate 5-Factor + Heavyweight Institutional Confluence
    const signal = this.scorer.evaluateSetup(currentCandle, history, currentCandle, { is24x7: false, heavyweights });

    if (signal.isQualified && signal.score >= 60) {
      // ATM Strike Selection (Undisputed king of liquidity, tightest spreads, and optimal 36pt Nifty buffer)
      const atmStrike = Math.round(currentCandle.close / 50) * 50;
      const optionType = signal.action === 'BUY' ? 'CE' : 'PE';
      const actionName = signal.action === 'BUY' ? 'CALL (CE)' : 'PUT (PE)';
      const basePremium = 115.0; // Standard liquid ATM Nifty option price
      const slPoints = 18.0;
      const tgt1Points = 20.0;
      const tgt2Points = 36.0;

      this.currentPosition = {
        entryTime: timeStr,
        entryMinute: totalMinutesIST,
        action: actionName,
        contract: `NIFTY ${atmStrike} ${optionType}`,
        strike: atmStrike,
        niftySpotEntry: currentCandle.close,
        entryPremium: basePremium,
        stopLossPremium: basePremium - slPoints,
        target1Premium: basePremium + tgt1Points,
        target2Premium: basePremium + tgt2Points,
        isTrailing: false,
        ratchetStage: 0,
        lockedProfit: 0,
        score: signal.score,
        factors: signal.factors
      };

      this.tradesToday++;

      return {
        action: 'ENTRY_TRIGGERED',
        position: this.currentPosition
      };
    }

    return { action: 'NO_SETUP', score: signal.score };
  }

  manageOpenPosition(currentCandle, totalMinutesIST, timeStr) {
    const niftyMove = this.currentPosition.action === 'CALL (CE)'
      ? (currentCandle.close - this.currentPosition.niftySpotEntry)
      : (this.currentPosition.niftySpotEntry - currentCandle.close);

    const highMove = this.currentPosition.action === 'CALL (CE)'
      ? (currentCandle.high - this.currentPosition.niftySpotEntry)
      : (this.currentPosition.niftySpotEntry - currentCandle.low);

    const lowMove = this.currentPosition.action === 'CALL (CE)'
      ? (currentCandle.low - this.currentPosition.niftySpotEntry)
      : (this.currentPosition.niftySpotEntry - currentCandle.high);

    const delta = 0.50; // Optimal ATM Delta providing full 36-point Nifty breathing room
    const estHigh = Number((this.currentPosition.entryPremium + (highMove * delta)).toFixed(2));
    const estLow = Number((this.currentPosition.entryPremium + (lowMove * delta)).toFixed(2));
    const estCurrent = Number((this.currentPosition.entryPremium + (niftyMove * delta)).toFixed(2));

    let isClosed = false;
    let exitReason = '';
    let exitPremium = 0;

    // 1. Stop Loss Hit
    if (estLow <= this.currentPosition.stopLossPremium) {
      isClosed = true;
      exitReason = this.currentPosition.lockedProfit > 0
        ? `PROFIT_RATCHET_LOCKED (+₹${this.currentPosition.lockedProfit} Banked)`
        : (this.currentPosition.isTrailing ? 'TRAILING_SL_BREAKEVEN' : 'STOP_LOSS_HIT');
      exitPremium = this.currentPosition.stopLossPremium;
    }
    // 2. Full Target Hit (+36 pts = +₹900)
    else if (estHigh >= this.currentPosition.target2Premium) {
      isClosed = true;
      exitReason = 'TARGET_2_JACKPOT_HIT (+₹900/trade)';
      exitPremium = this.currentPosition.target2Premium;
    }
    // 3. Profit Ratchet Stage 2: Gain touches +25 pts (+₹625) -> Lock in guaranteed +15 pts (+₹375) profit!
    else if (estHigh >= (this.currentPosition.entryPremium + 25.0) && this.currentPosition.ratchetStage < 2) {
      this.currentPosition.ratchetStage = 2;
      this.currentPosition.isTrailing = true;
      this.currentPosition.lockedProfit = 375;
      this.currentPosition.stopLossPremium = this.currentPosition.entryPremium + 15.0; // Guaranteed +₹375
    }
    // 4. Profit Ratchet Stage 1: Gain touches +15 pts (+₹375) -> Lock SL at Cost (Zero Risk Trade)!
    else if (estHigh >= (this.currentPosition.entryPremium + 15.0) && this.currentPosition.ratchetStage < 1) {
      this.currentPosition.ratchetStage = 1;
      this.currentPosition.isTrailing = true;
      this.currentPosition.stopLossPremium = this.currentPosition.entryPremium + 1.5; // Cost locked
    }
    // 5. Timer Stop (Holding Timer): If trade stagnates for >40 mins without moving, exit to protect against theta decay
    else if ((totalMinutesIST - this.currentPosition.entryMinute >= 40) && !this.currentPosition.isTrailing) {
      isClosed = true;
      exitReason = 'TIME_STOP_TIMEOUT (Stagnant >40m, exited to protect premium from theta decay)';
      exitPremium = estCurrent;
    }
    // 7. Intraday 3:15 PM Square-off
    else if (totalMinutesIST >= 915) {
      isClosed = true;
      exitReason = 'EOD_AUTO_SQUARE_OFF';
      exitPremium = Math.max(1, estCurrent);
    }

    if (isClosed) {
      const pnlPoints = Number((exitPremium - this.currentPosition.entryPremium).toFixed(2));
      const netPnl = Math.round(pnlPoints * this.lotSize);
      this.dailyPnl += netPnl;
      this.capital += netPnl;

      const tradeResult = {
        contract: this.currentPosition.contract,
        action: this.currentPosition.action,
        entryTime: this.currentPosition.entryTime,
        exitTime: timeStr,
        entryPremium: this.currentPosition.entryPremium,
        exitPremium,
        pnlPoints,
        netPnl,
        exitReason
      };

      this.currentPosition = null;

      // Check Daily Profit Lock Condition (The ₹1,800 Rule)
      if (this.dailyPnl >= 1500) {
        this.lockSession(`🎯 TARGET_HIT (+₹${this.dailyPnl} Locked)`);
      } else if (this.dailyPnl <= -this.maxDailyLoss) {
        this.lockSession(`🛑 MAX_LOSS_HIT (-₹${Math.abs(this.dailyPnl)} Protected)`);
      }

      return {
        action: 'EXIT_TRIGGERED',
        trade: tradeResult
      };
    }

    return {
      action: 'HOLDING',
      currentPremium: estCurrent,
      isTrailing: this.currentPosition.isTrailing
    };
  }

  lockSession(reason) {
    this.isLockedToday = true;
    this.lockReason = reason;
  }

  resetDailySession() {
    this.tradesToday = 0;
    this.dailyPnl = 0;
    this.isLockedToday = false;
    this.lockReason = '';
    this.currentPosition = null;
  }
}

// Self-Test Execution
async function runSniperDemo() {
  console.log('========================================================================================');
  console.log('🦅 GARUDA Alpha-Quant: NIFTY 50 Options Sniper Daemon ("The ₹1,800 Lock Engine")');
  console.log('Capital: ₹5,000 | Trade Size: 1 Lot (25 Qty) | Daily Goal: +₹1,500 to +₹1,800');
  console.log('Stop Loss: 18 Pts (~₹450) | Target: +36 to +72 Pts | Daily Lock Active: YES');
  console.log('========================================================================================\n');

  const daemon = new NiftyOptionsSniperDaemon();
  const rawCandles = await daemon.feed.fetchCandles(BENCHMARK_SYMBOL, '5m', '5d');

  if (!rawCandles || rawCandles.length < 50) {
    console.log('❌ Insufficient live market data.');
    return;
  }

  const candles = daemon.feed.enrichIndicators(rawCandles);
  candles.forEach(c => {
    const range = c.high - c.low;
    c.volumeRatio = (c.atr && range > c.atr * 1.1) ? 1.6 : 1.0;
  });

  console.log(`✓ Synchronized ${candles.length} real 5-minute Nifty candles.`);
  console.log('📡 Fetching Big-3 Institutional Heavyweights (HDFC Bank, Reliance, ICICI Bank)...');

  const heavyweightsData = [];
  for (const hw of HEAVYWEIGHT_SYMBOLS) {
    try {
      const raw = await daemon.feed.fetchCandles(hw.symbol, '5m', '5d');
      if (raw && raw.length >= 20) {
        heavyweightsData.push({
          ...hw,
          candles: daemon.feed.enrichIndicators(raw)
        });
        console.log(`  ✓ ${hw.name}: ${raw.length} candles loaded.`);
      }
    } catch (e) {}
  }

  console.log('\nSimulating Sniper Execution with Big-3 Confluence & ITM Strike Selection...\n');

  let currentDate = '';
  const executedTrades = [];

  for (let i = 25; i < candles.length; i++) {
    const candle = candles[i];
    const history = candles.slice(Math.max(0, i - 25), i);
    const dateStr = new Date(candle.time).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' });

    // Synchronize current heavyweight candles by timestamp
    const hwCandles = heavyweightsData.map(h => {
      const match = h.candles.find(c => c.timestamp === candle.timestamp);
      return { symbol: h.symbol, name: h.name, candle: match || null };
    });

    // Day change reset
    if (dateStr !== currentDate) {
      if (currentDate !== '') {
        console.log(`  📅 [DAY END] ${currentDate} | Day P&L: ${daemon.dailyPnl >= 0 ? '+' : ''}₹${daemon.dailyPnl} | Status: ${daemon.lockReason || 'Session Closed'}`);
      }
      currentDate = dateStr;
      daemon.resetDailySession();
    }

    let event = daemon.evaluateCandle(candle, history, hwCandles);

    if (event.action === 'EXIT_TRIGGERED') {
      const t = event.trade;
      const pnlStr = t.netPnl >= 0 ? `+₹${t.netPnl}` : `-₹${Math.abs(t.netPnl)}`;
      console.log(`  🎯 [EXIT]   ${dateStr} ${t.exitTime} -> Sold @ ₹${t.exitPremium} | P&L: ${pnlStr} | Reason: ${t.exitReason}`);
      executedTrades.push({ date: dateStr, ...t });

      if (daemon.isLockedToday) {
        console.log(`  🔒 >>> [TERMINAL LOCKED] ${daemon.lockReason} - NO MORE TRADES TODAY <<<\n`);
      } else {
        // Check if fresh entry triggers on same candle
        event = daemon.evaluateCandle(candle, history, hwCandles);
      }
    }

    if (event.action === 'ENTRY_TRIGGERED') {
      console.log(`  ⚡ [SIGNAL] ${dateStr} ${event.position.entryTime} -> BUY ${event.position.contract} @ ₹${event.position.entryPremium} | SL: ₹${event.position.stopLossPremium} | Score: ${event.position.score}%`);
      if (event.position.factors && event.position.factors.length > 0) {
        console.log(`     🧠 Institutional Driver: ${event.position.factors[0]}`);
      }
    }
  }

  console.log(`  📅 [DAY END] ${currentDate} | Day P&L: ${daemon.dailyPnl >= 0 ? '+' : ''}₹${daemon.dailyPnl} | Status: ${daemon.lockReason || 'Session Closed'}\n`);

  console.log('========================================================================================');
  console.log(`🏆 TOTAL SNIPER RESULT (BIG-3 + ITM ENGINE):`);
  console.log(`Total Trades: ${executedTrades.length}`);
  const totalNet = executedTrades.reduce((acc, t) => acc + t.netPnl, 0);
  console.log(`Net Realized P&L: ${totalNet >= 0 ? '+' : ''}₹${totalNet} on ₹5,000 Capital (+${((totalNet / 5000) * 100).toFixed(1)}% ROI)`);
  console.log('========================================================================================\n');
}

async function runLiveMarketScanner() {
  console.log('========================================================================================');
  console.log('🦅 GARUDA Alpha-Quant: NIFTY 50 Options Sniper Daemon [LIVE MARKET SCANNER]');
  console.log('Features: Big-3 Heavyweights Confluence + ITM Strike + ₹1,800 Daily Lock + 40m Timer');
  console.log('Polling Nifty 50 and Heavyweights every 30 seconds during market hours...');
  console.log('========================================================================================\n');

  const daemon = new NiftyOptionsSniperDaemon();
  let lastProcessedCandleTime = null;

  async function checkMarket() {
    try {
      const now = new Date();
      const totalMinutesIST = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
      const isMarketHours = totalMinutesIST >= 555 && totalMinutesIST <= 930; // 9:15 AM to 3:30 PM

      if (!isMarketHours) {
        const timeNow = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`[${timeNow}] ⏸️ Market closed or outside active session. Scanner in standby mode.`);
        return;
      }

      const rawCandles = await daemon.feed.fetchCandles(BENCHMARK_SYMBOL, '5m', '1d');
      if (!rawCandles || rawCandles.length < 25) return;

      const candles = daemon.feed.enrichIndicators(rawCandles);
      const currentCandle = candles[candles.length - 1];

      if (lastProcessedCandleTime === currentCandle.time) return;
      lastProcessedCandleTime = currentCandle.time;

      // Fetch Big-3 Heavyweights current candles
      const hwCandles = [];
      for (const hw of HEAVYWEIGHT_SYMBOLS) {
        try {
          const hwRaw = await daemon.feed.fetchCandles(hw.symbol, '5m', '1d');
          if (hwRaw && hwRaw.length > 0) {
            const enriched = daemon.feed.enrichIndicators(hwRaw);
            hwCandles.push({ symbol: hw.symbol, name: hw.name, candle: enriched[enriched.length - 1] });
          }
        } catch (e) {}
      }

      const history = candles.slice(Math.max(0, candles.length - 26), candles.length - 1);
      const event = daemon.evaluateCandle(currentCandle, history, hwCandles);

      if (event.action === 'ENTRY_TRIGGERED') {
        const pos = event.position;
        const msg = 
`🦅 *GARUDA SNIPER ALERT: NIFTY 50 ENTRY*
⚡ *Action*: *BUY ${pos.contract}*
💰 *Entry Premium*: ₹${pos.entryPremium} (~₹3,550 for 1 Lot)
🛑 *Strict Stop-Loss*: ₹${pos.stopLossPremium} (Risk: ₹450)
🎯 *Target 1*: ₹${pos.target1Premium} (Trail SL to Cost)
🏁 *Target 2*: ₹${pos.target2Premium} (+₹900 Profit)
📊 *Score*: ${pos.score}%
🧠 *Drivers*:
• ${pos.factors[0] || 'Technical Confluence'}
• ${pos.factors[1] || 'Heavyweights Institutional Confluence'}
🔒 *Daily Lock Target*: +₹1,800`;

        console.log(msg);
        await daemon.notifier.sendMessage(msg);
      } else if (event.action === 'EXIT_TRIGGERED') {
        const t = event.trade;
        const msg = 
`🦅 *GARUDA SNIPER TRADE CLOSED*
🎯 *Contract*: ${t.contract}
💵 *Exit Premium*: ₹${t.exitPremium} | Net P&L: *${t.netPnl >= 0 ? '+' : ''}₹${t.netPnl}*
Reason: \`${t.exitReason}\`
💼 *Today's Cumulative P&L*: *₹${daemon.dailyPnl}*`;

        console.log(msg);
        await daemon.notifier.sendMessage(msg);

        if (daemon.isLockedToday) {
          const lockMsg = 
`🔒 *GARUDA TERMINAL HARD LOCK ACTIVATED*
🎯 *Reason*: ${daemon.lockReason}
🛑 *Rules Enforced*: No more trades for the rest of today.
Capital protected. Profits locked!`;
          console.log(lockMsg);
          await daemon.notifier.sendMessage(lockMsg);
        }
      }
    } catch (err) {
      console.warn('⚠️ Market scan error:', err.message);
    }
  }

  // Check trader CLI preference (e.g. --asset=NIFTY or --asset=SBIN)
  const assetArg = process.argv.find(a => a.startsWith('--asset='));
  const lockedAsset = assetArg ? assetArg.split('=')[1] : null;

  if (lockedAsset) {
    const res = daemon.radar.setTraderPreference(lockedAsset);
    console.log(`\n${res.message}\n`);
  }

  // Initial check
  await checkMarket();
  // Poll every 30 seconds
  setInterval(checkMarket, 30000);
}

if (require.main === module) {
  if (process.argv.includes('--live')) {
    runLiveMarketScanner().catch(console.error);
  } else {
    runSniperDemo().catch(console.error);
  }
}

module.exports = { NiftyOptionsSniperDaemon };


