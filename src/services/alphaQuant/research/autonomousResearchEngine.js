/**
 * 🦅 GARUDA ALPHA-QUANT: AUTONOMOUS QUANTITATIVE RESEARCH & ENGINEERING ENGINE
 * Mission AQ-001 — Autonomous Profitability Research & Engineering Mission
 * 
 * CORE DOCTRINE:
 * "The default is EXECUTE, TEST, MEASURE, ITERATE."
 * "OBSERVE -> DIAGNOSE -> HYPOTHESIZE -> IMPLEMENT -> TEST -> BACKTEST -> VALIDATE -> COMPARE -> RETAIN OR REVERT."
 * "Report performance separately for each of the five agents. Never use Alpha-India results as proof of Forex, Crypto or Swing."
 * "Where historical data is insufficient, explicitly mark INSUFFICIENT DATA."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { WalkForwardValidator } = require('../strategies/walkForwardValidator');
const { StrategyOrchestrator } = require('../strategies/strategyOrchestrator');
const { StrategyRegistry, StrategyStatus } = require('../strategies/strategyRegistry');
const { MarketRegime, MarketRegimeClassifier } = require('../strategies/marketRegimeClassifier');
const { MarketCoverageRegistry, MarketTier } = require('../marketCoverageRegistry');
const { ConfidenceCalibrationEngine } = require('../math/confidenceCalibrationEngine');
const { AlphaRiskSentinel, RiskDecisionStatus } = require('../risk/alphaRiskSentinel');

const DEFAULT_HISTORICAL_DIR = path.join(__dirname, '..', '..', '..', '..', 'data', 'historical');
const DEFAULT_RESEARCH_DIR = path.join(__dirname, '..', '..', '..', '..', 'data', 'quant');
const RESEARCH_LEDGER_PATH = path.join(DEFAULT_RESEARCH_DIR, 'research_ledger.json');

class AutonomousResearchEngine {
  constructor(options = {}) {
    this.historicalDir = options.historicalDir || DEFAULT_HISTORICAL_DIR;
    this.researchDir = options.researchDir || DEFAULT_RESEARCH_DIR;
    this.ledgerPath = options.ledgerPath || RESEARCH_LEDGER_PATH;
    this.marketRegistry = new MarketCoverageRegistry();
    this.calibrationEngine = new ConfidenceCalibrationEngine();
    this.ledger = this.loadLedger();
  }

  /**
   * Load or initialize the persistent research ledger
   */
  loadLedger() {
    if (fs.existsSync(this.ledgerPath)) {
      try {
        const raw = fs.readFileSync(this.ledgerPath, 'utf8');
        return JSON.parse(raw);
      } catch (e) {}
    }

    const initialLedger = {
      version: '1.0.0',
      missionId: 'AQ-001-AUTONOMOUS-RESEARCH',
      missionType: 'AUTONOMOUS_PROFITABILITY_RESEARCH',
      authority: 'Founder Praveen Mahawar',
      tradingMode: 'PAPER_ONLY',
      lastUpdated: new Date().toISOString(),
      activeStrategyVersions: {
        STRAT_TREND_MOMENTUM: 'v1.1-adaptive-t1',
        STRAT_BREAKOUT_VOLATILITY: 'v1.0-baseline',
        STRAT_MEAN_REVERSION: 'v1.0-quarantined',
        STRAT_CHOP_SHIELD: 'v1.0-capital-defense'
      },
      agentStatus: {
        'Alpha-India': { status: 'OPERATIONAL', marketCoverage: 'NSE_LARGE_CAP', dataAvailable: true, outOfSampleValidated: false },
        'Alpha-Forex': { status: 'OPERATIONAL', marketCoverage: 'GLOBAL_FOREX_MAJORS', dataAvailable: true, outOfSampleValidated: false },
        'Alpha-Crypto': { status: 'OPERATIONAL', marketCoverage: 'CRYPTO_LIQUID_MAJORS', dataAvailable: true, outOfSampleValidated: false },
        'Alpha-Positional-Swing': { status: 'VALIDATED_RESEARCH', marketCoverage: 'INDIAN_EQUITY_CNC', dataAvailable: true, outOfSampleValidated: false },
        'Alpha-RiskSentinel': { status: 'OPERATIONAL', marketCoverage: 'UNIVERSAL', dataAvailable: true, outOfSampleValidated: true }
      },
      experiments: [],
      baselines: {},
      retainedImprovements: [],
      revertedExperiments: [],
      outstandingBlockers: [],
      nextPlannedActions: []
    };

    this.saveLedger(initialLedger);
    return initialLedger;
  }

  /**
   * Atomically save research ledger to disk
   */
  saveLedger(ledger = this.ledger) {
    if (!fs.existsSync(this.researchDir)) {
      fs.mkdirSync(this.researchDir, { recursive: true });
    }
    ledger.lastUpdated = new Date().toISOString();
    const tmp = `${this.ledgerPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(ledger, null, 2), 'utf8');
    fs.renameSync(tmp, this.ledgerPath);
  }

  /**
   * Load historical candlestick file for a given symbol
   */
  loadCandlesForSymbol(symbol) {
    // Normalization to filename format
    const cleanSym = symbol.replace('=', '_').replace('-', '-').replace('.', '_');
    const filename = `${cleanSym}_1h_6mo.json`;
    const filePath = path.join(this.historicalDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.candles || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Scan all available historical files in data/historical
   */
  getAvailableDatasets() {
    if (!fs.existsSync(this.historicalDir)) return [];
    const files = fs.readdirSync(this.historicalDir).filter(f => f.endsWith('_1h_6mo.json'));
    const datasets = [];

    for (const f of files) {
      const fullPath = path.join(this.historicalDir, f);
      const stat = fs.statSync(fullPath);
      let symbol = f.replace('_1h_6mo.json', '').replace('_NS', '.NS').replace('_X', '=X');
      let assetClass = 'INDIA_EQUITY';
      if (symbol.includes('-USD')) assetClass = 'CRYPTO';
      else if (symbol.includes('=X')) assetClass = 'FOREX';

      datasets.push({
        filename: f,
        symbol,
        assetClass,
        sizeBytes: stat.size,
        fullPath
      });
    }

    return datasets;
  }

  /**
   * Run multi-instrument bar-by-bar simulation across a specific universe
   */
  runMultiInstrumentSimulation(instruments, orchestrator, accountId, options = {}) {
    const results = [];
    const allTrades = [];

    for (const inst of instruments) {
      const candles = this.loadCandlesForSymbol(inst.symbol);
      if (!candles || candles.length < 28) continue;

      const sim = WalkForwardValidator.simulateStrategyOnCandles(candles, orchestrator, accountId, {
        symbol: inst.symbol,
        slippagePercent: options.slippagePercent !== undefined ? options.slippagePercent : 0.0004,
        chargesPercent: options.chargesPercent !== undefined ? options.chargesPercent : 0.0003,
        score: options.score || 78,
        enableT1ScaleOut: options.enableT1ScaleOut !== undefined ? options.enableT1ScaleOut : true,
        initialCapital: options.initialCapital || 100000,
        marginBase: options.marginBase || 25000
      });

      if (sim.simulatedTrades && sim.simulatedTrades.length > 0) {
        allTrades.push(...sim.simulatedTrades);
      }

      results.push({
        symbol: inst.symbol,
        assetClass: inst.assetClass,
        candleCount: candles.length,
        tradeCount: sim.tradeCount,
        netPnl: sim.totalNetPnl
      });
    }

    // Sort all trades chronologically
    allTrades.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());

    // Comprehensive performance metrics across all executed trades
    const metrics = WalkForwardValidator.evaluatePerformance(allTrades, options.initialCapital || 100000, options.marginBase || 25000);

    return {
      totalInstrumentsTested: instruments.length,
      activeInstrumentsWithTrades: results.filter(r => r.tradeCount > 0).length,
      totalTrades: allTrades.length,
      trades: allTrades,
      metrics,
      instrumentResults: results
    };
  }

  /**
   * Record a quantitative research experiment in the ledger
   */
  recordExperiment(experiment) {
    const record = {
      id: `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      hypothesis: experiment.hypothesis,
      agentId: experiment.agentId,
      strategyTarget: experiment.strategyTarget,
      parameterChanges: experiment.parameterChanges || {},
      acceptanceCriteria: experiment.acceptanceCriteria,
      results: experiment.results,
      decision: experiment.decision, // RETAINED, REVERTED, BLOCKED
      rationale: experiment.rationale
    };

    this.ledger.experiments.push(record);
    if (experiment.decision === 'RETAINED') {
      this.ledger.retainedImprovements.push(record);
    } else if (experiment.decision === 'REVERTED') {
      this.ledger.revertedExperiments.push(record);
    }

    this.saveLedger();
    return record;
  }
}

module.exports = {
  AutonomousResearchEngine
};
