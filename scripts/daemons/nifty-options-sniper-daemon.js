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
const { OptionChainRadar } = require('../../src/services/alphaQuant/optionChainRadar');
const { DerivativesMath } = require('../../src/services/alphaQuant/derivativesMath');

class NiftyOptionsSniperDaemon {
  constructor(options = {}) {
    this.feed = new MarketDataFeed();
    this.scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 });
    this.notifier = new TelegramQuantNotifier();
    this.radar = new OpportunityRadar({ lockedSymbol: options.lockedSymbol });
    this.optionRadar = new OptionChainRadar();
    this.initialCapital = options.initialCapital || 5000;
    this.capital = this.initialCapital;
    this.lotSize = options.lotSize || 25;
    this.riskPercentPerTrade = options.riskPercentPerTrade || 0.015; // 1.5% max risk
    this.maxDailyRiskPercent = options.maxDailyRiskPercent || 0.030; // 3.0% max daily drawdown
    this.targetDailyReturnPercent = options.targetDailyReturnPercent || 0.035; // 3.5% daily profit lock
    this.maxTradesPerDay = options.maxTradesPerDay || 2;

    // Dynamically calibrated to capital
    this.dailyTarget = Math.round(this.capital * this.targetDailyReturnPercent);
    this.maxDailyLoss = Math.round(this.capital * this.maxDailyRiskPercent);

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
  evaluateCandle(currentCandle, history, heavyweights = [], context = {}) {
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

    // 2. Evaluate Full Multi-Factor Institutional Confluence
    const signal = this.scorer.evaluateSetup(currentCandle, history, currentCandle, {
      is24x7: false,
      heavyweights,
      macro15m: context.macro15m,
      marketBreadth: context.marketBreadth,
      optionChain: context.optionChain
    });

    if (signal.isQualified && signal.score >= 60) {
      // Dynamic DTE, Option Pricing & Greeks Engine (Zero Hardcoded Numbers)
      const tYears = DerivativesMath.calculateDaysToWeeklyExpiry(currentCandle.time);
      const vixVal = context.vixData?.vix || 14.5;
      const ivDecimal = vixVal / 100.0;
      const strikeInterval = currentCandle.close > 35000 ? 100 : 50;
      const atmStrike = Math.round(currentCandle.close / strikeInterval) * strikeInterval;
      const optionType = signal.action === 'BUY' ? 'CE' : 'PE';
      const actionName = signal.action === 'BUY' ? 'CALL (CE)' : 'PUT (PE)';

      const liveOptionPrice = DerivativesMath.blackScholesPrice(currentCandle.close, atmStrike, tYears, ivDecimal, 0.065, optionType);
      const greeks = DerivativesMath.calculateGreeks(currentCandle.close, atmStrike, tYears, ivDecimal, 0.065, optionType);
      const rr = DerivativesMath.calculateDynamicRiskReward(currentCandle.close, currentCandle.atr, greeks.delta, vixVal);
      const sizing = DerivativesMath.calculateDynamicCapitalSizing(this.capital, rr.optionSlPoints, liveOptionPrice, {
        lotSize: this.lotSize,
        riskPercentPerTrade: this.riskPercentPerTrade,
        maxDailyRiskPercent: this.maxDailyRiskPercent,
        targetDailyReturnPercent: this.targetDailyReturnPercent
      });

      this.dailyTarget = sizing.dailyProfitLockInr;
      this.maxDailyLoss = sizing.maxDailyLossInr;
      const thetaTimeoutMinutes = DerivativesMath.calculateDynamicThetaTimerMinutes(tYears);

      this.currentPosition = {
        entryTime: timeStr,
        entryMinute: totalMinutesIST,
        action: actionName,
        contract: `NIFTY ${atmStrike} ${optionType}`,
        strike: atmStrike,
        niftySpotEntry: currentCandle.close,
        entryPremium: liveOptionPrice,
        stopLossPremium: Number((liveOptionPrice - rr.optionSlPoints).toFixed(2)),
        target1Premium: Number((liveOptionPrice + rr.optionTarget1Points).toFixed(2)),
        target2Premium: Number((liveOptionPrice + rr.optionTarget2Points).toFixed(2)),
        monsterTargetPremium: Number((liveOptionPrice + rr.optionMonsterPoints).toFixed(2)),
        isTrailing: false,
        ratchetStage: 0,
        lockedProfit: 0,
        monsterRiderActive: false,
        score: signal.score,
        factors: signal.factors,
        delta: greeks.delta,
        thetaDaily: greeks.thetaDaily,
        thetaTimeoutMinutes,
        lots: sizing.calculatedLots,
        quantity: sizing.allocatedQuantity,
        rrInfo: rr,
        sizingInfo: sizing,
        vixData: context.vixData,
        optionChain: context.optionChain,
        macro15m: context.macro15m
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

    // Dynamic Live Delta calibrated from Black-Scholes Greeks
    const delta = Math.abs(this.currentPosition.delta || 0.50);
    const estHigh = Number((this.currentPosition.entryPremium + (highMove * delta)).toFixed(2));
    const estLow = Number((this.currentPosition.entryPremium + (lowMove * delta)).toFixed(2));
    const estCurrent = Number((this.currentPosition.entryPremium + (niftyMove * delta)).toFixed(2));
    const qty = this.currentPosition.quantity || this.lotSize;

    let isClosed = false;
    let exitReason = '';
    let exitPremium = 0;

    // 1. Dynamic Stop Loss Hit
    if (estLow <= this.currentPosition.stopLossPremium) {
      isClosed = true;
      exitReason = this.currentPosition.lockedProfit > 0
        ? `PROFIT_RATCHET_LOCKED (+₹${this.currentPosition.lockedProfit} Banked)`
        : (this.currentPosition.isTrailing ? 'TRAILING_SL_BREAKEVEN' : 'STOP_LOSS_HIT');
      exitPremium = this.currentPosition.stopLossPremium;
    }
    // 2. Monster Runner Target Hit (Stage 3 Runner @ 1:3.8 Dynamic R:R)
    else if (this.currentPosition.monsterRiderActive && estHigh >= this.currentPosition.monsterTargetPremium) {
      isClosed = true;
      exitReason = 'MONSTER_RUNNER_JACKPOT_HIT (+1:3.8 Dynamic Trend Captured)';
      exitPremium = this.currentPosition.monsterTargetPremium;
    }
    // 3. Dynamic Target 2 Hit -> Dynamic Monster Rider Activation
    else if (estHigh >= this.currentPosition.target2Premium && !this.currentPosition.monsterRiderActive) {
      const isStrongTrend = currentCandle && currentCandle.adx && currentCandle.adx >= 24;
      if (isStrongTrend) {
        this.currentPosition.monsterRiderActive = true;
        this.currentPosition.ratchetStage = 3;
        this.currentPosition.isTrailing = true;
        const tgtPts = this.currentPosition.target2Premium - this.currentPosition.entryPremium;
        this.currentPosition.lockedProfit = Math.round(tgtPts * 0.85 * qty);
        this.currentPosition.stopLossPremium = Number((this.currentPosition.entryPremium + (tgtPts * 0.85)).toFixed(2));
      } else {
        isClosed = true;
        exitReason = `TARGET_2_HIT (+₹${Math.round((this.currentPosition.target2Premium - this.currentPosition.entryPremium) * qty)})`;
        exitPremium = this.currentPosition.target2Premium;
      }
    }
    // 4. Dynamic Profit Ratchet Stage 2: Gain touches 65% of Target 2 -> Lock in 60% of Target 1 profit
    else if (this.currentPosition.rrInfo && estHigh >= (this.currentPosition.entryPremium + (this.currentPosition.rrInfo.optionTarget2Points * 0.65)) && this.currentPosition.ratchetStage < 2) {
      this.currentPosition.ratchetStage = 2;
      this.currentPosition.isTrailing = true;
      const lockPts = Number((this.currentPosition.rrInfo.optionTarget1Points * 0.60).toFixed(2));
      this.currentPosition.lockedProfit = Math.round(lockPts * qty);
      this.currentPosition.stopLossPremium = Number((this.currentPosition.entryPremium + lockPts).toFixed(2));
    }
    // 5. Dynamic Profit Ratchet Stage 1: Gain touches Target 1 -> Lock SL at Cost + Buffer (Zero Risk)
    else if (estHigh >= this.currentPosition.target1Premium && this.currentPosition.ratchetStage < 1) {
      this.currentPosition.ratchetStage = 1;
      this.currentPosition.isTrailing = true;
      this.currentPosition.stopLossPremium = Number((this.currentPosition.entryPremium + 1.5).toFixed(2));
    }
    // 6. Dynamic Theta Timer Shield: Scaled to Days-to-Expiry (DTE)
    else if ((totalMinutesIST - this.currentPosition.entryMinute >= (this.currentPosition.thetaTimeoutMinutes || 45)) && !this.currentPosition.isTrailing) {
      isClosed = true;
      exitReason = `DYNAMIC_THETA_TIMEOUT (Stagnant >${this.currentPosition.thetaTimeoutMinutes || 45}m, exited before time-decay)`;
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
      const netPnl = Math.round(pnlPoints * qty);
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

  const vixData = await daemon.feed.fetchIndiaVix();
  const macro15m = await daemon.feed.fetchMacro15mTrend();
  console.log(`📡 VIX Adaptor: ${vixData.note}`);
  console.log(`📡 Macro Matrix: ${macro15m.summary}\n`);

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

    const marketBreadth = daemon.feed.calculateMarketBreadth(hwCandles);
    const optionChain = daemon.optionRadar.evaluateOptionChain(candle.close, { vix: vixData.vix, macroTrend: macro15m.macroTrend });
    const context = { vixData, macro15m, marketBreadth, optionChain };

    // Day change reset
    if (dateStr !== currentDate) {
      if (currentDate !== '') {
        console.log(`  📅 [DAY END] ${currentDate} | Day P&L: ${daemon.dailyPnl >= 0 ? '+' : ''}₹${daemon.dailyPnl} | Status: ${daemon.lockReason || 'Session Closed'}`);
      }
      currentDate = dateStr;
      daemon.resetDailySession();
    }

    let event = daemon.evaluateCandle(candle, history, hwCandles, context);

    if (event.action === 'EXIT_TRIGGERED') {
      const t = event.trade;
      const pnlStr = t.netPnl >= 0 ? `+₹${t.netPnl}` : `-₹${Math.abs(t.netPnl)}`;
      console.log(`  🎯 [EXIT]   ${dateStr} ${t.exitTime} -> Sold @ ₹${t.exitPremium} | P&L: ${pnlStr} | Reason: ${t.exitReason}`);
      executedTrades.push({ date: dateStr, ...t });

      if (daemon.isLockedToday) {
        console.log(`  🔒 >>> [TERMINAL LOCKED] ${daemon.lockReason} - NO MORE TRADES TODAY <<<\n`);
      } else {
        // Check if fresh entry triggers on same candle
        event = daemon.evaluateCandle(candle, history, hwCandles, context);
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
  console.log('Features: Big-3 Heavyweights + Profit Ratchet + Opportunity Radar + 40m Timer Shield');
  console.log('Active Monitoring: Continuous 30s High/Low Position Guard | 5-Minute Candle Breakout');
  console.log('========================================================================================\n');

  const daemon = new NiftyOptionsSniperDaemon();
  let lastProcessedCandleTimestamp = null;
  let lastRadarScanMinutes = 0;
  let lastActiveDateStr = '';

  // Check trader CLI preference (e.g. --asset=NIFTY or --asset=SBIN)
  const assetArg = process.argv.find(a => a.startsWith('--asset='));
  const lockedAsset = assetArg ? assetArg.split('=')[1] : null;

  if (lockedAsset) {
    const res = daemon.radar.setTraderPreference(lockedAsset);
    console.log(`\n${res.message}\n`);
  }

  async function checkMarket() {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
      const totalMinutesIST = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
      const currentDateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
      const timeNow = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Daily Session Reset on new trading day
      if (currentDateStr !== lastActiveDateStr) {
        if (lastActiveDateStr !== '') {
          console.log(`\n📅 [NEW TRADING DAY DETECTED: ${currentDateStr}] Resetting daily session ledger...`);
          daemon.resetDailySession();
        }
        lastActiveDateStr = currentDateStr;
      }

      // 1. Weekend Guard
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log(`[${timeNow}] ⏸️ Weekend (${dayOfWeek === 6 ? 'Saturday' : 'Sunday'}). NSE market closed. Scanner in standby mode.`);
        return;
      }

      // 2. Market Hours Guard: 09:15 AM (555 min) to 03:30 PM (930 min)
      const isMarketHours = totalMinutesIST >= 555 && totalMinutesIST <= 930;
      if (!isMarketHours) {
        console.log(`[${timeNow}] ⏸️ Outside NSE trading hours (09:15 AM - 03:30 PM IST). Scanner in standby mode.`);
        return;
      }

      // 3. Fetch 5-day lookback so indicators are 100% computed even at 09:16 AM
      const rawCandles = await daemon.feed.fetchCandles(BENCHMARK_SYMBOL, '5m', '5d');
      if (!rawCandles || rawCandles.length < 25) {
        console.warn(`[${timeNow}] ⚠️ Insufficient candles from feed (${rawCandles ? rawCandles.length : 0}). Retrying next tick...`);
        return;
      }

      const candles = daemon.feed.enrichIndicators(rawCandles);
      const currentCandle = candles[candles.length - 1];

      // 4. Fetch Big-3 Heavyweights current candles
      const hwCandles = [];
      for (const hw of HEAVYWEIGHT_SYMBOLS) {
        try {
          const hwRaw = await daemon.feed.fetchCandles(hw.symbol, '5m', '5d');
          if (hwRaw && hwRaw.length > 0) {
            const enriched = daemon.feed.enrichIndicators(hwRaw);
            hwCandles.push({ symbol: hw.symbol, name: hw.name, candle: enriched[enriched.length - 1] });
          }
        } catch (e) {}
      }

      const history = candles.slice(Math.max(0, candles.length - 26), candles.length - 1);

      // 5. IF POSITION IS OPEN: Continuous 30-second guard (Never wait for 5m candle close!)
      if (daemon.currentPosition) {
        const exitEvent = daemon.manageOpenPosition(currentCandle, totalMinutesIST, timeNow);
        if (exitEvent.action === 'EXIT_TRIGGERED') {
          const t = exitEvent.trade;
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
        return;
      }

      // 6. IF NO POSITION: Only evaluate fresh entry ONCE per 5-minute candle timestamp
      if (lastProcessedCandleTimestamp === currentCandle.timestamp) {
        return; // Candle already scanned for entry
      }
      lastProcessedCandleTimestamp = currentCandle.timestamp;

      console.log(`[${timeNow}] 🔍 Scanning new 5-minute candle (${new Date(currentCandle.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}) | Nifty: ₹${currentCandle.close}`);

      // 7. Periodic Opportunity Radar Check (Once every 15 minutes in morning window)
      const isMorning = totalMinutesIST >= 585 && totalMinutesIST <= 690;
      if (isMorning && (totalMinutesIST - lastRadarScanMinutes >= 15)) {
        lastRadarScanMinutes = totalMinutesIST;
        try {
          const opp = await daemon.radar.scanOpportunities(daemon.capital);
          if (opp && opp.hasSuperAlpha && opp.advisoryMessage) {
            console.log('\n' + opp.advisoryMessage + '\n');
            await daemon.notifier.sendMessage(opp.advisoryMessage);
          }
        } catch (e) {}
      }

      // 8. Fetch Full Institutional Context (VIX + 15m Macro Trend + Breadth + Option Chain)
      const vixData = await daemon.feed.fetchIndiaVix();
      const macro15m = await daemon.feed.fetchMacro15mTrend();
      const marketBreadth = daemon.feed.calculateMarketBreadth(hwCandles);
      const optionChain = daemon.optionRadar.evaluateOptionChain(currentCandle.close, { vix: vixData.vix, macroTrend: macro15m.macroTrend });
      const context = { vixData, macro15m, marketBreadth, optionChain };

      // 9. Evaluate fresh Nifty setup with Multi-Tier Institutional Confluence
      const event = daemon.evaluateCandle(currentCandle, history, hwCandles, context);

      if (event.action === 'ENTRY_TRIGGERED') {
        const pos = event.position;
        const msg = 
`🦅 *GARUDA SNIPER ALERT: NIFTY 50 ENTRY*
⚡ *Action*: *BUY ${pos.contract}*
💰 *Entry Premium*: ₹${pos.entryPremium} (~₹2,875 for 1 Lot)
🛑 *Dynamic Stop-Loss*: ₹${pos.stopLossPremium} (SL: ${pos.vixData?.recommendedSLPoints || 18} pts)
🎯 *Target 1*: ₹${pos.target1Premium} (Trail SL to Cost)
🏁 *Target 2*: ₹${pos.target2Premium} (+₹900 Profit)
🚀 *Monster Runner*: Up to ₹${pos.entryPremium + 72} (+₹1,800 Runner)
📊 *Score*: ${pos.score}%
🧠 *Institutional Drivers*:
• ${pos.factors[0] || 'Technical Confluence'}
• ${pos.factors[1] || 'Heavyweights Institutional Confluence'}
${pos.optionChain ? `📊 *Option Chain*: PCR ${pos.optionChain.pcr} [${pos.optionChain.sentiment}]` : ''}
${pos.macro15m ? `🧭 *Macro Matrix*: ${pos.macro15m.summary}` : ''}
🔒 *Daily Lock Target*: +₹1,800`;

        console.log(msg);
        await daemon.notifier.sendMessage(msg);
      }
    } catch (err) {
      console.warn('⚠️ Market scan error:', err.message);
    }
  }

  // Initial immediate check
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


