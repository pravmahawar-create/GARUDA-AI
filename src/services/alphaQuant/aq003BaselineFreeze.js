/**
 * 🦅 GARUDA ALPHA-QUANT — MISSION AQ-003
 * Phase 1: Baseline Freeze, SHA-256 Fingerprinting & Historical P&L Reconciliation
 *
 * Invariants:
 * 1. AQ-002 strategy parameters & RiskSentinel limits are FROZEN (zero optimization).
 * 2. Canonical historical files (garuda-alpha-quant-ledger.json, strategy-attribution.json,
 *    data/historical/*) are NEVER mutated.
 * 3. Any change to frozen parameters or source hashes fails integrity verification.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const AQ003_DIR = path.join(ROOT_DIR, 'data', 'aq003');
const FREEZE_PATH = path.join(AQ003_DIR, 'aq003-baseline-freeze.json');

const FROZEN_AGENT_CONFIGS = Object.freeze({
  'Alpha-India': Object.freeze({
    id: 'Alpha-India',
    assetClass: 'INDIAN_EQUITY_MIS',
    exchange: 'NSE',
    currency: 'INR',
    productionThreshold: 78,
    allowOpeningBellBullEntries: false,
    adxChopVeto: 22,
    superTrend: { period: 7, multiplier: 3 },
    volumeFilterRatio: 1.05,
    stopAtrMultiplier: 1.25,
    target1AtrMultiplier: 1.0,
    target2AtrMultiplier: 2.5,
    sessionWindowIST: { bullOpen: '10:15', bearOpen: '09:15', entryClose: '14:45', squareOff: '15:15' },
    leverage: 5.0,
    instruments: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'LT.NS']
  }),
  'Alpha-Crypto': Object.freeze({
    id: 'Alpha-Crypto',
    assetClass: 'CRYPTO',
    exchange: 'BINANCE_SPOT_PERP_SIM',
    currency: 'USD_TO_INR',
    productionThreshold: 78,
    adxChopVeto: 22,
    superTrend: { period: 7, multiplier: 3 },
    stopAtrMultiplier: 2.5,
    target1AtrMultiplier: 2.0,
    target2AtrMultiplier: 4.5,
    standardFundingRatePer8h: 0.0001,
    takerFeePercent: 0.001,
    weekendHaircutPercent: 0.30,
    sessionWindow: 'CONTINUOUS_24_7',
    leverage: 1.0,
    instruments: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']
  }),
  'Alpha-Forex': Object.freeze({
    id: 'Alpha-Forex',
    assetClass: 'FOREX',
    exchange: 'GLOBAL_24_5_AND_GOLD',
    currency: 'USD_TO_INR',
    productionThreshold: 78,
    adxChopVeto: 22,
    superTrend: { period: 7, multiplier: 3 },
    stopAtrMultiplier: 1.5,
    target1AtrMultiplier: 1.2,
    target2AtrMultiplier: 2.8,
    maxSpreadToAtrRatio: 0.15,
    weekendCutoffUtc: { fridayCloseHour: 20, sundayOpenHour: 21 },
    leverage: 5.0,
    instruments: ['EURUSD=X', 'GBPUSD=X', 'USDINR=X', 'GC=F']
  }),
  'Alpha-Positional-Swing': Object.freeze({
    id: 'Alpha-Positional-Swing',
    assetClass: 'INDIAN_EQUITY_CNC',
    exchange: 'NSE_CNC',
    currency: 'INR',
    productionThreshold: 78,
    adxChopVeto: 22,
    superTrend: { period: 7, multiplier: 3 },
    longOnly: true,
    maxPositionEquityCapPercent: 0.05,
    gapRiskSlippagePercent: 0.005,
    stopAtrMultiplier: 2.0,
    target1AtrMultiplier: 3.0,
    target2AtrMultiplier: 6.0,
    maxHoldingDays: 7,
    leverage: 1.0,
    instruments: ['RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 'LT.NS', 'SUNPHARMA.NS']
  }),
  'Alpha-RiskSentinel': Object.freeze({
    id: 'Alpha-RiskSentinel',
    authority: 'MANDATORY_SINGLE_PORTFOLIO_AUTHORITY',
    initialCapital: 100000,
    maxRiskPerTradePercent: 0.010,
    maxDailyLoss: 1500,
    profitRatchetThreshold: 2500,
    profitRatchetFloorPercent: 0.60,
    profitRatchetHardFloor: 1500,
    maxConcurrentPositions: 3,
    maxDailyOrders: 20,
    maxAggregateLeverage: 2.5,
    misMarginLeverage: 5.0,
    maxSectorGrossExposurePercent: 0.25,
    maxSectorMarginExposurePercent: 0.25,
    maxSectorPositions: 2,
    correlationDampingFactor: 0.50,
    maxAggregateStopLossRiskPercent: 0.05,
    maxCorrelationThreshold: 0.70,
    maxDataStaleSeconds: 60,
    slippagePercent: 0.0004,
    chargesPercent: 0.0003,
    minConfidenceScore: 78
  })
});

const SOURCE_FILES = Object.freeze({
  'Alpha-India': 'src/services/alphaQuant/agents/alphaIndiaAgent.js',
  'Alpha-Crypto': 'src/services/alphaQuant/agents/alphaCryptoAgent.js',
  'Alpha-Forex': 'src/services/alphaQuant/agents/alphaForexAgent.js',
  'Alpha-Positional-Swing': 'src/services/alphaQuant/agents/alphaPositionalSwingAgent.js',
  'Alpha-RiskSentinel': 'src/services/alphaQuant/risk/alphaRiskSentinel.js',
  MarketRegimeClassifier: 'src/services/alphaQuant/strategies/marketRegimeClassifier.js',
  ConfidenceCalibrationEngine: 'src/services/alphaQuant/math/confidenceCalibrationEngine.js',
  ConfluenceScorer: 'src/services/alphaQuant/confluenceScorer.js'
});

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256File(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
}

function getGitHeadCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch (e) {
    return 'UNKNOWN';
  }
}

function collectDatasetProvenance() {
  const histDir = path.join(ROOT_DIR, 'data', 'historical');
  if (!fs.existsSync(histDir)) return { directoryExists: false, files: [] };
  const files = fs.readdirSync(histDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(name => {
      const full = path.join(histDir, name);
      const st = fs.statSync(full);
      return {
        name,
        sizeBytes: st.size,
        mtimeIso: st.mtime.toISOString(),
        sha256: sha256File(full)
      };
    });
  return {
    directoryExists: true,
    fileCount: files.length,
    manifestHash: sha256Text(JSON.stringify(files)),
    files
  };
}

/**
 * Resolve historical P&L reconciliation discrepancies in read-only mode
 * WITHOUT mutating canonical historical files.
 */
function reconcileHistoricalBaselines() {
  const discrepancies = [];

  // 1. Canonical paper ledger (data/garuda-alpha-quant-ledger.json)
  const legacyLedgerPath = path.join(ROOT_DIR, 'data', 'garuda-alpha-quant-ledger.json');
  let legacySummary = null;
  if (fs.existsSync(legacyLedgerPath)) {
    const rawText = fs.readFileSync(legacyLedgerPath, 'utf8');
    const ledger = JSON.parse(rawText);
    const closedTrades = Array.isArray(ledger.closedTrades) ? ledger.closedTrades : [];
    const openPositions = Array.isArray(ledger.openPositions) ? ledger.openPositions : [];

    const sumClosedNetPnl = Number(closedTrades.reduce((a, t) => a + (Number(t.netPnl) || 0), 0).toFixed(2));
    const sumClosedGrossPnl = Number(closedTrades.reduce((a, t) => a + (Number(t.grossPnl) || 0), 0).toFixed(2));
    const sumClosedCharges = Number(closedTrades.reduce((a, t) => a + (Number(t.charges) || 0), 0).toFixed(2));

    // Check individual trade gross - charges != netPnl (caused by partial T1 exit not included in closedRecord.grossPnl)
    const tradeDiscrepancies = [];
    for (const t of closedTrades) {
      const expectedSimpleNet = Number(((t.grossPnl || 0) - (t.charges || 0)).toFixed(2));
      const diff = Number(((t.netPnl || 0) - expectedSimpleNet).toFixed(2));
      if (Math.abs(diff) > 0.01) {
        tradeDiscrepancies.push({
          tradeId: t.id,
          symbol: t.symbol,
          recordedGrossPnl: t.grossPnl,
          recordedCharges: t.charges,
          recordedNetPnl: t.netPnl,
          unreportedPartialT1NetPnl: diff,
          explanation: 'PaperTradingEngine recorded T1 50% partial exit net gain in totalNetPnl without adding partial gross/charges to closedRecord.grossPnl.'
        });
      }
    }

    // Check corrupted null open position & null wallet cash
    const corruptPositions = openPositions.filter(p => p.quantity == null || p.marginLocked == null);
    if (ledger.wallet?.cash == null || corruptPositions.length > 0) {
      discrepancies.push({
        source: 'data/garuda-alpha-quant-ledger.json',
        severity: 'CRITICAL',
        type: 'NULL_CASH_AND_POSITION_SIZING_NAN',
        recordedWalletCash: ledger.wallet?.cash ?? null,
        corruptOpenPositions: corruptPositions.map(p => ({ id: p.id, symbol: p.symbol, quantity: p.quantity, marginLocked: p.marginLocked })),
        reconstructedInitialDeposit: ledger.wallet?.initialCapital || 100000,
        reconstructedRealizedPnl: sumClosedNetPnl,
        reconstructedValidOpenMargin: Number(openPositions.filter(p => p.marginLocked != null).reduce((a, p) => a + p.marginLocked, 0).toFixed(2)),
        reconstructedExpectedCashBeforeCorruptTrade: Number(((ledger.wallet?.initialCapital || 100000) + sumClosedNetPnl - openPositions.filter(p => p.marginLocked != null).reduce((a, p) => a + p.marginLocked, 0)).toFixed(2)),
        rootCause: 'PaperTradingEngine.processSignal() computed Math.max(signal.riskPerShare, ...) when signal.riskPerShare was undefined -> NaN quantity/marginLocked -> wallet.cash became NaN -> JSON serialized as null.',
        resolution: 'Preserved historical file untouched; AQ-003 engine strictly guards finite positive riskPerShare and delegates all margin accounting to AlphaRiskSentinel.'
      });
    }

    if (tradeDiscrepancies.length > 0) {
      discrepancies.push({
        source: 'data/garuda-alpha-quant-ledger.json',
        severity: 'MEDIUM',
        type: 'PARTIAL_EXIT_GROSS_NET_MISMATCH',
        affectedTradesCount: tradeDiscrepancies.length,
        affectedTrades: tradeDiscrepancies,
        resolution: 'Preserved historical file untouched; AQ-003 ledger explicitly logs PARTIAL_FILL and PARTIAL_EXIT events separately with full gross + charges + net breakdown.'
      });
    }

    legacySummary = {
      sha256: sha256Text(rawText),
      updatedAt: ledger.updatedAt,
      closedTradesCount: closedTrades.length,
      openPositionsCount: openPositions.length,
      recordedRealizedPnl: ledger.wallet?.realizedPnl ?? null,
      sumClosedNetPnl,
      sumClosedGrossPnl,
      sumClosedCharges,
      walletRealizedVsClosedSumVariance: Number(((ledger.wallet?.realizedPnl || 0) - sumClosedNetPnl).toFixed(2))
    };
  }

  // 2. Corrected simulation baseline (data/historical/simulated-trades-corrected.json)
  const simCorrectedPath = path.join(ROOT_DIR, 'data', 'historical', 'simulated-trades-corrected.json');
  let simSummary = null;
  if (fs.existsSync(simCorrectedPath)) {
    const rawText = fs.readFileSync(simCorrectedPath, 'utf8');
    const sim = JSON.parse(rawText);
    simSummary = {
      sha256: sha256Text(rawText),
      generatedAt: sim.generatedAt,
      executionModel: sim.executionModel,
      baselineMetrics: sim.baselineMetrics,
      filter1Metrics: sim.filter1Metrics
    };
    if ((sim.baselineMetrics?.oos?.marginDrawdown || 0) > 25) {
      discrepancies.push({
        source: 'data/historical/simulated-trades-corrected.json',
        severity: 'HIGH',
        type: 'HISTORICAL_OOS_MARGIN_DRAWDOWN_ABOVE_25_GATE',
        oosCount: sim.baselineMetrics.oos.count,
        oosProfitFactor: sim.baselineMetrics.oos.profitFactor,
        oosMarginDrawdownPct: sim.baselineMetrics.oos.marginDrawdown,
        resolution: 'Preserved as AQ-002 historical baseline. AQ-003 tracks live forward OOS margin drawdown separately per agent and consolidated portfolio against the <25% gate.'
      });
    }
  }

  // 3. Strategy attribution (data/risk/strategy-attribution.json)
  const stratPath = path.join(ROOT_DIR, 'data', 'risk', 'strategy-attribution.json');
  let stratSummary = null;
  if (fs.existsSync(stratPath)) {
    const rawText = fs.readFileSync(stratPath, 'utf8');
    const sa = JSON.parse(rawText);
    stratSummary = {
      sha256: sha256Text(rawText),
      updatedAt: sa.updatedAt,
      governanceEventsCount: Array.isArray(sa.governanceEvents) ? sa.governanceEvents.length : 0,
      strategies: (sa.data || []).map(s => ({
        strategyId: s.strategyId,
        totalTrades: s.totalTrades,
        netPnl: s.netPnl,
        profitFactor: s.profitFactor,
        status: s.status
      }))
    };
  }

  return {
    reconciledAt: new Date().toISOString(),
    canonicalFilesModified: false,
    discrepancyCount: discrepancies.length,
    discrepancies,
    baselines: {
      legacyPaperLedger: legacySummary,
      simulatedCorrected: simSummary,
      strategyAttribution: stratSummary
    }
  };
}

function buildBaselineFreezeSnapshot() {
  const agentFingerprints = {};
  for (const [agentId, cfg] of Object.entries(FROZEN_AGENT_CONFIGS)) {
    const configHash = sha256Text(JSON.stringify(cfg));
    const relPath = SOURCE_FILES[agentId];
    const sourceHash = relPath ? sha256File(path.join(ROOT_DIR, relPath)) : null;
    agentFingerprints[agentId] = {
      agentId,
      configHash,
      sourcePath: relPath || null,
      sourceSha256: sourceHash,
      frozenConfig: cfg
    };
  }

  const sharedModuleHashes = {};
  for (const [name, relPath] of Object.entries(SOURCE_FILES)) {
    if (!FROZEN_AGENT_CONFIGS[name]) {
      sharedModuleHashes[name] = {
        path: relPath,
        sha256: sha256File(path.join(ROOT_DIR, relPath))
      };
    }
  }

  const masterConfigurationHash = sha256Text(JSON.stringify(
    Object.keys(agentFingerprints).sort().map(k => ({
      id: k,
      configHash: agentFingerprints[k].configHash,
      sourceSha256: agentFingerprints[k].sourceSha256
    }))
  ));

  return {
    missionId: 'GARUDA-AQ-003',
    baselineReference: 'AQ-002',
    frozenAt: new Date().toISOString(),
    gitHeadCommit: getGitHeadCommit(),
    masterConfigurationHash,
    agentFingerprints,
    sharedModuleHashes,
    datasetProvenance: collectDatasetProvenance(),
    historicalReconciliation: reconcileHistoricalBaselines()
  };
}

function ensureBaselineFreeze(forceRebuild = false) {
  if (!fs.existsSync(AQ003_DIR)) {
    fs.mkdirSync(AQ003_DIR, { recursive: true });
  }
  if (!forceRebuild && fs.existsSync(FREEZE_PATH)) {
    return JSON.parse(fs.readFileSync(FREEZE_PATH, 'utf8'));
  }
  const snapshot = buildBaselineFreezeSnapshot();
  const tmp = `${FREEZE_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.renameSync(tmp, FREEZE_PATH);
  return snapshot;
}

function verifyBaselineIntegrity(snapshot = null) {
  const baseline = snapshot || ensureBaselineFreeze(false);
  const mismatches = [];

  for (const [agentId, cfg] of Object.entries(FROZEN_AGENT_CONFIGS)) {
    const expected = baseline.agentFingerprints?.[agentId];
    if (!expected) {
      mismatches.push({ agentId, reason: 'MISSING_FROZEN_FINGERPRINT' });
      continue;
    }
    const currentConfigHash = sha256Text(JSON.stringify(cfg));
    if (currentConfigHash !== expected.configHash) {
      mismatches.push({ agentId, reason: 'CONFIG_HASH_MISMATCH', expected: expected.configHash, actual: currentConfigHash });
    }
    const relPath = SOURCE_FILES[agentId];
    if (relPath) {
      const currentSrcHash = sha256File(path.join(ROOT_DIR, relPath));
      if (currentSrcHash !== expected.sourceSha256) {
        mismatches.push({ agentId, reason: 'SOURCE_CODE_HASH_MISMATCH', expected: expected.sourceSha256, actual: currentSrcHash });
      }
    }
  }

  return {
    valid: mismatches.length === 0,
    masterConfigurationHash: baseline.masterConfigurationHash,
    mismatches,
    checkedAt: new Date().toISOString()
  };
}

module.exports = {
  FROZEN_AGENT_CONFIGS,
  SOURCE_FILES,
  AQ003_DIR,
  FREEZE_PATH,
  buildBaselineFreezeSnapshot,
  ensureBaselineFreeze,
  verifyBaselineIntegrity,
  reconcileHistoricalBaselines
};
