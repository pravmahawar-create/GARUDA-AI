/**
 * 🦅 GARUDA Alpha-Quant: Master Autonomous Orchestrator & Daemon
 * Coordinates data feeds, 5-factor scoring, paper execution,
 * and executive reporting.
 */

try { require('dotenv').config(); } catch (e) {}

const { MarketDataFeed, DEFAULT_SYMBOLS, BENCHMARK_SYMBOL } = require('./marketDataFeed');
const { ConfluenceScorer } = require('./confluenceScorer');
const { PaperTradingEngine } = require('./paperTradingEngine');
const { TelegramQuantNotifier } = require('./telegramQuantNotifier');

class AlphaQuantDaemon {
  constructor(options = {}) {
    this.marketDataFeed = new MarketDataFeed();
    this.minConfidenceThreshold = options.minConfidenceThreshold || 78; // 78% Institutional threshold
    this.scorer = new ConfluenceScorer({ minConfidenceThreshold: this.minConfidenceThreshold });
    this.paperEngine = new PaperTradingEngine(options.initialCapital || 100000);
    this.notifier = new TelegramQuantNotifier();
    this.symbols = options.symbols || DEFAULT_SYMBOLS;
    this.sendTelegramAlerts = options.sendTelegramAlerts || false;
  }

  /**
   * Run a complete, rigorous historical simulation across recent 5-minute trading sessions
   */
  async runHistoricalSimulation(range = '5d') {
    console.log(`\n======================================================`);
    console.log(`🦅 GARUDA Alpha-Quant: Historical Paper Simulation (${range})`);
    console.log(`Initial Virtual Capital: ₹${this.paperEngine.wallet.initialCapital.toLocaleString('en-IN')}`);
    console.log(`Confidence Gate: ≥75% Confluence Required`);
    console.log(`======================================================\n`);

    // 1. Fetch Benchmark (Nifty 50)
    console.log(`[1/3] Fetching Nifty 50 benchmark data (${BENCHMARK_SYMBOL})...`);
    const benchCandlesRaw = await this.marketDataFeed.fetchCandles(BENCHMARK_SYMBOL, '5m', range);
    const benchCandles = this.marketDataFeed.enrichIndicators(benchCandlesRaw);
    console.log(`✓ Benchmark data loaded: ${benchCandles.length} candles.`);

    // 2. Fetch All Symbols Data
    console.log(`[2/3] Fetching tick candles for ${this.symbols.length} bluechip securities...`);
    const securitiesData = [];

    for (const item of this.symbols) {
      const raw = await this.marketDataFeed.fetchCandles(item.symbol, '5m', range);
      const enriched = this.marketDataFeed.enrichIndicators(raw);
      if (enriched.length >= 50) {
        securitiesData.push({
          ...item,
          candles: enriched
        });
        console.log(`  ✓ ${item.name} (${item.symbol}): ${enriched.length} valid 5m candles.`);
      } else {
        console.warn(`  ✗ ${item.symbol}: Insufficient candle data (${enriched.length})`);
      }
    }

    // 3. Sequential Time-Stepped Replay Simulation
    console.log(`\n[3/3] Simulating live tick-by-tick market conditions...`);
    let signalsGenerated = 0;
    let qualifiedSignalsCount = 0;

    // Determine the minimum common length
    const minLength = Math.min(...securitiesData.map(s => s.candles.length));

    // Reset ledger for fresh simulation
    this.paperEngine.resetLedger();

    for (let i = 25; i < minLength; i++) {
      const benchCandle = benchCandles[i] || null;

      for (const sec of securitiesData) {
        const currentCandle = sec.candles[i];
        const history = sec.candles.slice(Math.max(0, i - 25), i);

        // A. Update any existing open positions for this symbol
        const closed = this.paperEngine.updatePositionsWithCandle(sec.symbol, currentCandle);
        for (const c of closed) {
          console.log(`  🎯 [TRADE CLOSED] ${c.symbolName}: ${c.exitReason} | Net P&L: ₹${c.netPnl}`);
          if (this.sendTelegramAlerts) {
            await this.notifier.notifyTradeClosed(c);
          }
        }

        // B. Evaluate new setup
        const signal = this.scorer.evaluateSetup(currentCandle, history, benchCandle);
        signalsGenerated++;

        if (signal.isQualified) {
          qualifiedSignalsCount++;
          const exec = this.paperEngine.processSignal(signal, sec.symbol, sec.name);
          if (exec.executed) {
            console.log(`  ⚡ [SIGNAL TRIGGERED] ${sec.name} @ ₹${signal.price} | Score: ${signal.score}% | Target: ₹${signal.target2} | SL: ₹${signal.stopLoss}`);
            if (this.sendTelegramAlerts) {
              await this.notifier.notifySignalTriggered(signal, sec.symbol, sec.name, exec.position.quantity);
            }
          }
        }
      }
    }

    // Force square off any remaining positions at latest market prices
    const latestPrices = {};
    securitiesData.forEach(s => {
      const lastC = s.candles[minLength - 1];
      if (lastC) latestPrices[s.symbol] = lastC.close;
    });
    this.paperEngine.squareOffRemaining(latestPrices);

    const stats = this.paperEngine.calculateStatistics();

    console.log(`\n======================================================`);
    console.log(`🦅 GARUDA Alpha-Quant: Simulation Results Dossier`);
    console.log(`======================================================`);
    console.log(`Total Candles Scanned: ${minLength * securitiesData.length}`);
    console.log(`Total Scored Setups: ${signalsGenerated}`);
    console.log(`Setups Filtered by 75% Rule: ${signalsGenerated - qualifiedSignalsCount} (Capital Protected)`);
    console.log(`Qualified High-Probability Setups (≥75%): ${qualifiedSignalsCount}`);
    console.log(`------------------------------------------------------`);
    console.log(`Total Executed Trades: ${stats.totalTrades}`);
    console.log(`Winning Trades: ${stats.winCount} | Losing Trades: ${stats.lossCount}`);
    console.log(`Win Rate: ${stats.winRatePercent}%`);
    console.log(`Net Realized P&L: ₹${stats.netPnl.toLocaleString('en-IN')}`);
    console.log(`ROI on Capital: ${stats.roiPercent}%`);
    console.log(`Profit Factor: ${stats.profitFactor}`);
    console.log(`Max Drawdown: ${stats.maxDrawdownPercent}%`);
    console.log(`Final Portfolio Balance: ₹${stats.currentWalletBalance.toLocaleString('en-IN')}`);
    console.log(`======================================================\n`);

    return {
      stats,
      signalsGenerated,
      qualifiedSignalsCount,
      ledger: this.paperEngine.closedTrades
    };
  }

  /**
   * Run a single live market scan across all symbols
   */
  async scanLiveMarket() {
    console.log(`[AlphaQuant] Scanning live market for 75%+ high-conviction setups...`);
    const benchCandlesRaw = await this.marketDataFeed.fetchCandles(BENCHMARK_SYMBOL, '5m', '1d');
    const benchCandles = this.marketDataFeed.enrichIndicators(benchCandlesRaw);
    const benchCandle = benchCandles.slice(-1)[0] || null;

    const liveFindings = [];

    for (const item of this.symbols) {
      const raw = await this.marketDataFeed.fetchCandles(item.symbol, '5m', '2d');
      const enriched = this.marketDataFeed.enrichIndicators(raw);
      if (enriched.length < 25) continue;

      const currentCandle = enriched.slice(-1)[0];
      const history = enriched.slice(-25, -1);

      const signal = this.scorer.evaluateSetup(currentCandle, history, benchCandle);
      liveFindings.push({
        symbol: item.symbol,
        name: item.name,
        price: currentCandle.close,
        signal
      });

      if (signal.isQualified) {
        console.log(`🔥 [LIVE HIGH CONVICTION] ${item.name}: ${signal.score}% ${signal.direction}`);
      }
    }

    return liveFindings;
  }
}

module.exports = {
  AlphaQuantDaemon
};
