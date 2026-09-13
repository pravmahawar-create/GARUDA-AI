/**
 * 🦅 GARUDA Alpha-Quant: 24/7 Global Autonomous Trading Daemon
 * Runs continuously 24 hours a day, 365 days a year.
 * Rotates automatically across Indian Equities, Global Forex 24/5, and Crypto 24/7.
 * Anchored in Universe #12 (Finance Universe).
 */

const fs = require('fs');
const path = require('path');
const { MarketDataFeed, DEFAULT_SYMBOLS, BENCHMARK_SYMBOL } = require('./marketDataFeed');
const { CryptoFeed, CRYPTO_PAIRS } = require('./cryptoFeed');
const { ForexFeed, FOREX_PAIRS } = require('./forexFeed');
const { ConfluenceScorer } = require('./confluenceScorer');
const { PaperTradingEngine } = require('./paperTradingEngine');
const { TelegramQuantNotifier } = require('./telegramQuantNotifier');

const LEDGER_24X7_PATH = path.join(__dirname, '..', '..', '..', 'data', 'garuda-24x7-quant-ledger.json');
const USD_INR_RATE = 87.0;

class Global24x7QuantDaemon {
  constructor(options = {}) {
    this.pollIntervalSeconds = options.pollIntervalSeconds || 60; // Check every 60 seconds
    this.minConfidenceThreshold = options.minConfidenceThreshold || 82; // 82%+ Ultra Confluence
    this.maxDailyTrades = options.maxDailyTrades || 5; // Max 5 sniper trades per day
    this.dailyProfitTargetInr = options.dailyProfitTargetInr || 2500; // 2.5% daily target on ₹1L (₹2,500)
    this.dailyMaxLossInr = options.dailyMaxLossInr || 1200; // Max 1.2% loss circuit breaker
    this.initialCapital = options.initialCapital || 100000;
    this.sendTelegramAlerts = options.sendTelegramAlerts || false;

    // Sub-Feeds
    this.indiaFeed = new MarketDataFeed();
    this.cryptoFeed = new CryptoFeed();
    this.forexFeed = new ForexFeed();

    // Universal Scorer
    this.scorer = new ConfluenceScorer({ minConfidenceThreshold: this.minConfidenceThreshold });

    // Unified 24/7 Paper Trading Engine
    this.paperEngine = new PaperTradingEngine(this.initialCapital);
    this.notifier = new TelegramQuantNotifier();

    this.isRunning = false;
    this.timer = null;
    this.dailyTradesCount = 0;
    this.currentDateStr = new Date().toDateString();
    this.isProfitLockedToday = false;
    this.isLossLockedToday = false;
    this.isEmergencyPaused = false;
    this.eventLog = [];

    this.addLog('SYSTEM_BOOT', 'GLOBAL', 'GARUDA 24/7 Global Quant Swarm initialized with ₹1,00,000 virtual capital.');
  }

  addLog(action, market, message, details = {}) {
    const entry = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      action,
      market,
      message,
      details
    };
    this.eventLog.unshift(entry);
    if (this.eventLog.length > 60) this.eventLog.pop();
    return entry;
  }

  /**
   * Determine which markets are active right now
   */
  getActiveMarkets() {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = Sun, 6 = Sat
    const totalMinutesIST = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;

    // 1. Indian Stock Market (Mon-Fri 9:15 AM - 3:30 PM IST)
    const isIndiaOpen = (utcDay >= 1 && utcDay <= 5) && (totalMinutesIST >= 555 && totalMinutesIST <= 930);

    // 2. Forex 24/5 (Sunday 21:00 UTC to Friday 21:00 UTC)
    let isForexOpen = false;
    if (utcDay >= 1 && utcDay <= 4) {
      isForexOpen = true; // Mon, Tue, Wed, Thu full day
    } else if (utcDay === 0 && now.getUTCHours() >= 21) {
      isForexOpen = true; // Sunday opens at 21:00 UTC
    } else if (utcDay === 5 && now.getUTCHours() < 21) {
      isForexOpen = true; // Friday closes at 21:00 UTC
    }

    // 3. Crypto 24/7/365 (Always active)
    const isCryptoOpen = true;

    return {
      isIndiaOpen,
      isForexOpen,
      isCryptoOpen,
      currentSession: isIndiaOpen ? 'INDIAN_EQUITY_SESSION' : (isForexOpen ? 'GLOBAL_FOREX_SESSION' : 'CRYPTO_WEEKEND_SESSION')
    };
  }

  /**
   * Reset daily limits at midnight
   */
  checkDailyRollover() {
    const todayStr = new Date().toDateString();
    if (todayStr !== this.currentDateStr) {
      console.log(`[24x7 Daemon] Midnight rollover: ${this.currentDateStr} -> ${todayStr}. Resetting daily counters.`);
      this.currentDateStr = todayStr;
      this.dailyTradesCount = 0;
      this.isProfitLockedToday = false;
      this.isLossLockedToday = false;
    }
  }

  /**
   * Single unified scan and execution step across active 24/7 markets
   */
  async runCycle() {
    this.checkDailyRollover();
    const active = this.getActiveMarkets();

    // Sovereign Kill Switch check (Supreme Founder Control)
    if (this.isEmergencyPaused) {
      return {
        status: 'EMERGENCY_PAUSED',
        message: '🛑 Sovereign Kill Switch ENGAGED by Founder Praveen. All trading agents halted.',
        timestamp: new Date().toISOString()
      };
    }

    // Circuit breaker checks
    if (this.isProfitLockedToday) {
      return { status: 'PROFIT_LOCKED', message: `Daily target of ₹${this.dailyProfitTargetInr} already achieved! Desk locked.` };
    }
    if (this.isLossLockedToday) {
      return { status: 'LOSS_LOCKED', message: `Daily risk cap of ₹${this.dailyMaxLossInr} reached. Capital preserved.` };
    }
    if (this.dailyTradesCount >= this.maxDailyTrades) {
      return { status: 'MAX_DAILY_TRADES', message: `Max ${this.maxDailyTrades} daily sniper trades reached.` };
    }

    const findings = [];

    // ─────────────────────────────────────────────
    // 1. SCAN CRYPTO (24/7/365 Non-Stop Active)
    // ─────────────────────────────────────────────
    if (active.isCryptoOpen) {
      for (const cp of CRYPTO_PAIRS) {
        try {
          const candles = await this.cryptoFeed.fetchCandles(cp, '5m', '1d');
          const enriched = this.cryptoFeed.enrichIndicators(candles || []);
          if (enriched && enriched.length >= 25) {
            const current = enriched[enriched.length - 1];
            const history = enriched.slice(-25, -1);

            // Update open positions
            const closed = this.paperEngine.updatePositionsWithCandle(cp.symbol, current);
            for (const c of closed) {
              await this.handleTradeClosure(c);
            }

            // Evaluate new setup
            const signal = this.scorer.evaluateSetup(current, history);
            findings.push({ assetClass: 'Crypto', symbol: cp.symbol, name: cp.name, signal });

            if (signal.isQualified && signal.score >= this.minConfidenceThreshold) {
              await this.executeSignal(signal, cp.symbol, cp.name, 'Crypto');
            }
          }
        } catch (e) {}
      }
    }

    // ─────────────────────────────────────────────
    // 2. SCAN FOREX (24/5 Active Weekdays)
    // ─────────────────────────────────────────────
    if (active.isForexOpen) {
      for (const fp of FOREX_PAIRS.slice(0, 3)) { // EUR/USD, GBP/USD, Gold
        try {
          const candles = await this.forexFeed.fetchCandles(fp, '5m', '1d');
          const enriched = this.forexFeed.enrichIndicators(candles || []);
          if (enriched && enriched.length >= 25) {
            const current = enriched[enriched.length - 1];
            const history = enriched.slice(-25, -1);

            const closed = this.paperEngine.updatePositionsWithCandle(fp.symbol, current);
            for (const c of closed) {
              await this.handleTradeClosure(c);
            }

            const signal = this.scorer.evaluateSetup(current, history);
            findings.push({ assetClass: 'Forex', symbol: fp.symbol, name: fp.name, signal });

            if (signal.isQualified && signal.score >= this.minConfidenceThreshold) {
              await this.executeSignal(signal, fp.symbol, fp.name, 'Forex');
            }
          }
        } catch (e) {}
      }
    }

    // ─────────────────────────────────────────────
    // 3. SCAN INDIA EQUITIES (Mon-Fri 9:15-15:30 IST)
    // ─────────────────────────────────────────────
    if (active.isIndiaOpen) {
      try {
        const benchRaw = await this.indiaFeed.fetchCandles(BENCHMARK_SYMBOL, '5m', '1d');
        const benchEnriched = this.indiaFeed.enrichIndicators(benchRaw || []);
        const benchCandle = benchEnriched.slice(-1)[0] || null;

        for (const sec of DEFAULT_SYMBOLS) {
          const candles = await this.indiaFeed.fetchCandles(sec.symbol, '5m', '1d');
          const enriched = this.indiaFeed.enrichIndicators(candles || []);
          if (enriched && enriched.length >= 25) {
            const current = enriched[enriched.length - 1];
            const history = enriched.slice(-25, -1);

            const closed = this.paperEngine.updatePositionsWithCandle(sec.symbol, current);
            for (const c of closed) {
              await this.handleTradeClosure(c);
            }

            const signal = this.scorer.evaluateSetup(current, history, benchCandle);
            findings.push({ assetClass: 'India', symbol: sec.symbol, name: sec.name, signal });

            if (signal.isQualified && signal.score >= this.minConfidenceThreshold) {
              await this.executeSignal(signal, sec.symbol, sec.name, 'India');
            }
          }
        }
      } catch (e) {}
    }

    // Check circuit breakers on today's P&L
    this.evaluateCircuitBreakers();

    return {
      timestamp: new Date().toISOString(),
      activeMarkets: active,
      dailyTradesCount: this.dailyTradesCount,
      openPositions: this.paperEngine.openPositions.length,
      walletBalance: this.paperEngine.wallet.cash,
      findingsScanned: findings.length
    };
  }

  async executeSignal(signal, symbol, name, assetClass) {
    if (this.dailyTradesCount >= this.maxDailyTrades) return;

    const exec = this.paperEngine.processSignal(signal, symbol, name);
    if (exec.executed) {
      this.dailyTradesCount++;
      const priceInr = assetClass !== 'India'
        ? `₹${Number((signal.price * USD_INR_RATE).toFixed(2)).toLocaleString('en-IN')}`
        : `₹${signal.price}`;

      console.log(`⚡ [24x7 SNIPER] [${assetClass}] ${name} @ ${priceInr} | Score: ${signal.score}% | Target: ₹${signal.target2} | SL: ₹${signal.stopLoss}`);
      this.addLog('SNIPER_ORDER_EXECUTED', assetClass, `⚡ Sniper Entry: ${name} (${signal.direction}) @ ${priceInr} [Confluence: ${signal.score}%]. SL: ₹${signal.stopLoss} | T2: ₹${signal.target2}`, {
        symbol,
        score: signal.score,
        priceInr,
        target2: signal.target2,
        stopLoss: signal.stopLoss,
        quantity: exec.position?.quantity
      });
      
      if (this.sendTelegramAlerts) {
        await this.notifier.notifySignalTriggered(signal, symbol, name, exec.position.quantity);
      }
    }
  }

  async handleTradeClosure(closedTrade) {
    console.log(`🎯 [TRADE CLOSED] ${closedTrade.symbolName}: ${closedTrade.exitReason} | Net P&L: ₹${closedTrade.netPnl}`);
    const isWin = closedTrade.netPnl >= 0;
    this.addLog(isWin ? 'TRADE_EXIT_PROFIT' : 'TRADE_EXIT_LOSS', 'PORTFOLIO', `${isWin ? '🎯 Profit Booked' : '🛑 Stop Protected'}: ${closedTrade.symbolName} exited via ${closedTrade.exitReason}. Net P&L: ₹${Number(closedTrade.netPnl.toFixed(2)).toLocaleString('en-IN')}`, closedTrade);
    if (this.sendTelegramAlerts) {
      await this.notifier.notifyTradeClosed(closedTrade);
    }
  }

  evaluateCircuitBreakers() {
    const todayTrades = this.paperEngine.closedTrades.filter(t => new Date(t.exitTime).toDateString() === this.currentDateStr);
    const todayPnl = todayTrades.reduce((acc, t) => acc + t.netPnl, 0);

    // 1. Daily Profit Target Lock (+2.5% = ₹2,500)
    if (todayPnl >= this.dailyProfitTargetInr && !this.isProfitLockedToday) {
      this.isProfitLockedToday = true;
      console.log(`🏆 [PROFIT LOCK TRIGGERED] Today's P&L: +₹${todayPnl.toLocaleString('en-IN')} reached target! Trading paused for the day.`);
      this.addLog('PROFIT_CIRCUIT_LOCKED', 'SOVEREIGN_RISK', `🏆 Daily Growth Target Reached (+₹${todayPnl.toLocaleString('en-IN')}). Desk auto-locked for the day to preserve capital.`);
      if (this.sendTelegramAlerts) {
        this.notifier.sendMessage(`🦅 *GARUDA Alpha-Quant: Daily Target Achieved!* 🏆\nToday's Net Gain: *+₹${todayPnl.toLocaleString('en-IN')}*\n_Trading auto-paused to lock in profits._`);
      }
    }

    // 2. Daily Loss Circuit Breaker (-₹1,200)
    if (todayPnl <= -this.dailyMaxLossInr && !this.isLossLockedToday) {
      this.isLossLockedToday = true;
      console.log(`🛑 [LOSS CIRCUIT BREAKER] Today's loss reached -₹${Math.abs(todayPnl)}. Capital defense activated. Trading paused.`);
      this.addLog('CAPITAL_DEFENSE_LOCKED', 'SOVEREIGN_RISK', `🛑 Capital Defense Triggered: Daily loss reached -₹${Math.abs(todayPnl)}. Swarm paused to protect capital.`);
      if (this.sendTelegramAlerts) {
        this.notifier.sendMessage(`🦅 *GARUDA Alpha-Quant: Circuit Breaker Activated* 🛑\nDaily Loss Limit reached (-₹${Math.abs(todayPnl)}).\n_Capital defense mode on. Trading paused._`);
      }
    }
  }

  /**
   * Founder Sovereign Kill Switch: Pause or Resume trading immediately
   */
  setEmergencyPause(pause) {
    this.isEmergencyPaused = !!pause;
    const msg = this.isEmergencyPaused
      ? '🛑 Sovereign Kill Switch ENGAGED by Founder Praveen. All 4 trading agents halted immediately.'
      : '✅ Sovereign Kill Switch DISENGAGED by Founder Praveen. 24/7 Swarm resumed autonomous operation.';
    this.addLog(
      this.isEmergencyPaused ? 'SOVEREIGN_KILL_SWITCH_ENGAGED' : 'SOVEREIGN_KILL_SWITCH_DISENGAGED',
      'SOVEREIGN_COMMAND',
      msg
    );
    console.log(`[SOVEREIGN COMMAND] ${msg}`);
    return this.isEmergencyPaused;
  }

  /**
   * Start 24/7 non-stop polling daemon
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`🦅 GARUDA 24/7 Global Quant Daemon started. Polling every ${this.pollIntervalSeconds}s non-stop.`);
    this.addLog('SWARM_STARTED', 'SYSTEM', `24/7 Global Quant Swarm started with ${this.pollIntervalSeconds}s tick polling.`);

    const loop = async () => {
      if (!this.isRunning) return;
      try {
        await this.runCycle();
      } catch (err) {
        console.error('[24x7 Daemon] Cycle error:', err.message);
      }
      if (this.isRunning) {
        this.timer = setTimeout(loop, this.pollIntervalSeconds * 1000);
      }
    };

    loop();
  }

  /**
   * Stop daemon
   */
  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('🦅 GARUDA 24/7 Global Quant Daemon stopped.');
    this.addLog('SWARM_STOPPED', 'SYSTEM', '24/7 Global Quant Swarm stopped.');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isEmergencyPaused: this.isEmergencyPaused,
      activeMarkets: this.getActiveMarkets(),
      dailyTradesCount: this.dailyTradesCount,
      maxDailyTrades: this.maxDailyTrades,
      dailyProfitTargetInr: this.dailyProfitTargetInr,
      dailyMaxLossInr: this.dailyMaxLossInr,
      isProfitLockedToday: this.isProfitLockedToday,
      isLossLockedToday: this.isLossLockedToday,
      wallet: this.paperEngine.wallet,
      stats: this.paperEngine.calculateStatistics(),
      openPositions: this.paperEngine.openPositions,
      closedTrades: this.paperEngine.closedTrades.slice(-15).reverse(),
      eventLog: this.eventLog.slice(0, 40)
    };
  }
}

module.exports = {
  Global24x7QuantDaemon,
  LEDGER_24X7_PATH
};
