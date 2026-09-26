/**
 * 🦅 GARUDA Global Alpha Swarm: Multi-Asset 24/7 Autonomous Trading Orchestrator
 * Anchored in Universe #12 (Finance Universe)
 * Commands specialized agents for India Equities, Forex 24/5, and Crypto 24/7.
 */

const fs = require('fs');
const path = require('path');
const { MarketDataFeed, DEFAULT_SYMBOLS, BENCHMARK_SYMBOL } = require('./marketDataFeed');
const { CryptoFeed, CRYPTO_PAIRS } = require('./cryptoFeed');
const { ForexFeed, FOREX_PAIRS } = require('./forexFeed');
const { ConfluenceScorer } = require('./confluenceScorer');
const { PaperTradingEngine } = require('./paperTradingEngine');
const { TelegramQuantNotifier } = require('./telegramQuantNotifier');

const GLOBAL_LEDGER_PATH = path.join(__dirname, '..', '..', '..', 'data', 'garuda-global-quant-ledger.json');

class GlobalQuantSwarm {
  constructor(options = {}) {
    this.minConfidenceThreshold = options.minConfidenceThreshold || 82; // 82%+ Ultra Confluence
    this.maxDailyTrades = options.maxDailyTrades || 5; // Max 5 sniper trades per day
    this.initialCapital = options.initialCapital || 100000;

    // Sub-Feeds
    this.indiaFeed = new MarketDataFeed();
    this.cryptoFeed = new CryptoFeed();
    this.forexFeed = new ForexFeed();

    // Universal Scorer
    this.scorer = new ConfluenceScorer({ minConfidenceThreshold: this.minConfidenceThreshold });

    // Multi-Asset Paper Engines
    this.indiaPaper = new PaperTradingEngine(this.initialCapital);
    this.cryptoPaper = new PaperTradingEngine(this.initialCapital);
    this.forexPaper = new PaperTradingEngine(this.initialCapital);

    this.notifier = new TelegramQuantNotifier();
  }

  /**
   * Get 24/7 live pulse across all 3 asset classes right now
   */
  async getLivePulse() {
    const USD_INR_RATE = 87.0; // Reference USD to INR rate

    const pulse = {
      timestamp: new Date().toISOString(),
      activeUniverse: 'Universe #12: Finance Universe (Quant Alpha Swarm)',
      governance: {
        minConfidenceThreshold: `${this.minConfidenceThreshold}% (Ultra-Confluence)`,
        maxDailyTrades: this.maxDailyTrades,
        targetDailyGrowth: '1.0% - 2.0% Daily (₹1,000 - ₹2,000 per day on ₹1,00,000 capital)',
        riskPolicy: 'Market-Neutral (Bullish Long & Bearish Short)'
      },
      markets: {
        india: {
          name: 'NSE / BSE Equities & Nifty 50',
          status: this.isIndianMarketOpen() ? 'LIVE (OPEN)' : 'CLOSED (Opens 9:15 AM Mon-Fri IST)',
          currency: 'INR (₹)',
          symbolsTracked: DEFAULT_SYMBOLS.length
        },
        forex: {
          name: 'Global Currencies & Commodities',
          status: 'LIVE 24/5 (Mon-Fri)',
          currency: 'USD ($) converted to INR (₹)',
          symbolsTracked: FOREX_PAIRS.length
        },
        crypto: {
          name: 'Crypto 24/7/365 Non-Stop',
          status: 'LIVE 24/7/365 (ACTIVE RIGHT NOW)',
          currency: 'USD ($) converted to INR (₹)',
          symbolsTracked: CRYPTO_PAIRS.length
        }
      },
      liveQuotes: []
    };

    // 1. Fetch live Crypto quotes (active 24/7) with direct Rupee values
    for (const cp of CRYPTO_PAIRS) {
      try {
        const candles = await this.cryptoFeed.fetchCandles(cp, '5m', '1d');
        const enriched = this.cryptoFeed.enrichIndicators(candles || []);
        if (enriched && enriched.length >= 25) {
          const last = enriched[enriched.length - 1];
          const hist = enriched.slice(-25, -1);
          const signal = this.scorer.evaluateSetup(last, hist, null, { assetClass: 'Crypto', is24x7: true });
          pulse.liveQuotes.push({
            assetClass: 'Crypto (24/7)',
            symbol: cp.symbol,
            name: cp.name,
            priceUsd: `$${last.close.toLocaleString('en-US')}`,
            priceInr: `₹${Number((last.close * USD_INR_RATE).toFixed(2)).toLocaleString('en-IN')}`,
            trend: last.ema9 > last.ema21 ? 'BULLISH' : 'BEARISH',
            score: signal.score,
            isQualified: signal.isQualified,
            direction: signal.direction
          });
        }
      } catch (e) {}
    }

    // 2. Fetch live Forex quotes with direct Rupee values
    for (const fp of FOREX_PAIRS.slice(0, 3)) {
      try {
        const candles = await this.forexFeed.fetchCandles(fp, '5m', '1d');
        const enriched = this.forexFeed.enrichIndicators(candles || []);
        if (enriched && enriched.length >= 25) {
          const last = enriched[enriched.length - 1];
          const hist = enriched.slice(-25, -1);
          const signal = this.scorer.evaluateSetup(last, hist, null, { assetClass: 'Forex', is24x7: true });
          pulse.liveQuotes.push({
            assetClass: 'Forex (24/5)',
            symbol: fp.symbol,
            name: fp.name,
            priceUsd: `$${last.close}`,
            priceInr: `₹${Number((last.close * USD_INR_RATE).toFixed(2)).toLocaleString('en-IN')}`,
            trend: last.ema9 > last.ema21 ? 'BULLISH' : 'BEARISH',
            score: signal.score,
            isQualified: signal.isQualified,
            direction: signal.direction
          });
        }
      } catch (e) {}
    }

    return pulse;
  }

  isIndianMarketOpen() {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) return false;

    const totalMinutesIST = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
    return totalMinutesIST >= 555 && totalMinutesIST <= 930; // 9:15 AM to 3:30 PM IST
  }
}

module.exports = {
  GlobalQuantSwarm,
  GLOBAL_LEDGER_PATH
};
