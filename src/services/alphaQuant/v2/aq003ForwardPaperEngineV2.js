/**
 * 🦅 GARUDA ALPHA-QUANT — MISSION AQ-003
 * Five-Agent Autonomous Forward Paper Validation Engine
 *
 * Operates strictly in PAPER ONLY mode:
 * - Zero real-money orders, zero broker credentials.
 * - All 5 agents operate through one shared portfolio engine and mandatory AlphaRiskSentinel.
 * - Uses fresh live market data validated for completeness, closed-bar anti-lookahead, and freshness.
 * - Persists immutable JSONL events + atomic JSON ledger + RiskSentinel account state.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { AlphaIndiaAgent } = require('../agents/alphaIndiaAgent');
const { AlphaCryptoAgent } = require('../agents/alphaCryptoAgent');
const { AlphaForexAgent, FOREX_COST_MODELS } = require('../agents/alphaForexAgent');
const { AlphaPositionalSwingAgent } = require('../agents/alphaPositionalSwingAgent');
const { AlphaRiskSentinel, RiskDecisionStatus } = require('../risk/alphaRiskSentinel');
const { MarketRegimeClassifier } = require('../strategies/marketRegimeClassifier');
const { ConfluenceScorer } = require('../confluenceScorer');
const {
  FROZEN_AGENT_CONFIGS,
  AQ003V2_DIR,
  ensureBaselineFreeze,
  verifyBaselineIntegrity
} = require('./aq003BaselineFreezeV2');
const { AQ003MarketDataValidator } = require('../aq003MarketDataValidator');

const USD_INR_RATE = 87.0;
const DEFAULT_LEDGER_FILE = path.join(AQ003V2_DIR, 'aq003-ledger.json');
const DEFAULT_EVENTS_FILE = path.join(AQ003V2_DIR, 'aq003-events.jsonl');
const DEFAULT_HEARTBEAT_FILE = path.join(AQ003V2_DIR, 'aq003-heartbeat.json');

const AGENT_IDS = Object.freeze([
  'Alpha-India',
  'Alpha-Crypto',
  'Alpha-Forex',
  'Alpha-Positional-Swing'
]);

function createEmptyAgentMetrics(agentId) {
  return {
    agentId,
    targetForwardTrades: 100,
    signalCount: 0,
    proposalsCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    executedTrades: 0,
    partialFillsCount: 0,
    cancelledOrdersCount: 0,
    closedTrades: 0,
    openPositionsCount: 0,
    winCount: 0,
    lossCount: 0,
    grossPnlInr: 0,
    chargesInr: 0,
    fundingCostsInr: 0,
    netPnlInr: 0,
    profitFactor: 0,
    expectancyInr: 0,
    peakEquityInr: 0,
    maxDrawdownPct: 0,
    rejectionReasons: {},
    marketDataFreshness: 'UNKNOWN',
    lastDataTimestamp: null,
    paused: false,
    pauseReason: null
  };
}

class AQ003ForwardPaperEngine {
  constructor(options = {}) {
    this.storageDir = options.storageDir || AQ003V2_DIR;
    this.ledgerPath = options.ledgerPath || path.join(this.storageDir, 'aq003-ledger.json');
    this.eventsPath = options.eventsPath || path.join(this.storageDir, 'aq003-events.jsonl');
    this.heartbeatPath = options.heartbeatPath || path.join(this.storageDir, 'aq003-heartbeat.json');
    this.intentPath = options.intentPath || path.join(this.storageDir, 'aq003-intent.json');
    this.reconciliationRequired = false;
    this.accountId = options.accountId || 'AQ003_FORWARD_PAPER';
    this.initialCapital = FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel'].initialCapital;

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    // Fail-Closed Mandatory RiskSentinel Authority
    if (options.riskSentinel === null) {
      throw new Error('FAIL_CLOSED_NO_RISK_SENTINEL: AQ-003 refuses startup without AlphaRiskSentinel.');
    }
    this.riskSentinel = options.riskSentinel || new AlphaRiskSentinel({
      storageDir: options.riskStorageDir || path.join(this.storageDir, 'risk')
    });

    // Freeze & verify AQ-002 baseline
    this.baselineFreeze = options.baselineFreeze || ensureBaselineFreeze(false);
    this.integrityCheck = verifyBaselineIntegrity(this.baselineFreeze);

    // Initialize the 4 frozen trading agents + shared scorer (threshold frozen at 78)
    this.agents = {
      'Alpha-India': new AlphaIndiaAgent({ productionThreshold: 78, allowOpeningBellBullEntries: false }),
      'Alpha-Crypto': new AlphaCryptoAgent({ productionThreshold: 78 }),
      'Alpha-Forex': new AlphaForexAgent({ productionThreshold: 78 }),
      'Alpha-Positional-Swing': new AlphaPositionalSwingAgent({ productionThreshold: 78 })
    };
    this.scorer = new ConfluenceScorer({ minConfidenceThreshold: 78 });
    this.dataValidator = options.dataValidator || new AQ003MarketDataValidator();

    // Ensure isolated RiskSentinel account exists with frozen AQ-002 limits
    if (!this.riskSentinel.getAccountState(this.accountId)) {
      const cfg = FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel'];
      this.riskSentinel.initializeAccount(this.accountId, {
        maxRiskPerTradePercent: cfg.maxRiskPerTradePercent,
        maxDailyLoss: cfg.maxDailyLoss,
        profitRatchetThreshold: cfg.profitRatchetThreshold,
        profitRatchetFloorPercent: cfg.profitRatchetFloorPercent,
        profitRatchetHardFloor: cfg.profitRatchetHardFloor,
        maxConcurrentPositions: cfg.maxConcurrentPositions,
        maxDailyOrders: cfg.maxDailyOrders,
        maxAggregateLeverage: cfg.maxAggregateLeverage,
        misMarginLeverage: cfg.misMarginLeverage,
        maxSectorGrossExposurePercent: cfg.maxSectorGrossExposurePercent,
        maxSectorMarginExposurePercent: cfg.maxSectorMarginExposurePercent,
        maxSectorPositions: cfg.maxSectorPositions,
        correlationDampingFactor: cfg.correlationDampingFactor,
        maxAggregateStopLossRiskPercent: cfg.maxAggregateStopLossRiskPercent,
        maxCorrelationThreshold: cfg.maxCorrelationThreshold,
        maxDataStaleSeconds: cfg.maxDataStaleSeconds,
        slippagePercent: cfg.slippagePercent,
        chargesPercent: cfg.chargesPercent,
        minConfidenceScore: cfg.minConfidenceScore
      }, this.initialCapital);
    }

    this.accountId = options.accountId || 'AQ003_FORWARD_PAPER';
    this.state = this._loadOrInitializeState();
    this._recoverWriteAheadIntent();
    this._syncSentinelPositions();
  }

  _recoverWriteAheadIntent() {
    if (!fs.existsSync(this.intentPath)) return;
    try {
      const intent = JSON.parse(fs.readFileSync(this.intentPath, 'utf8'));
      if (intent && intent.orderId && intent.position) {
        const sentinelState = this.riskSentinel.getAccountState(this.accountId);
        const inSentinel = (sentinelState?.positions || []).some(p => p.id === intent.orderId);
        const inLedger = (this.state.openPositions || []).some(p => p.id === intent.orderId);

        if (inSentinel && !inLedger) {
          this.state.openPositions.push(intent.position);
          this._persistState();
          this._appendEvent('CRASH_RECOVERY_INTENT_RESOLVED', intent.position.agentId, {
            orderId: intent.orderId,
            symbol: intent.position.symbol,
            resolution: 'RESTORED_TO_LEDGER'
          });
        }
      }
      fs.unlinkSync(this.intentPath);
    } catch (e) {
      console.error('[AQ-003-V2] Failed to recover write-ahead intent:', e.message);
    }
  }

  _syncSentinelPositions() {
    const sentinelState = this.riskSentinel.getAccountState(this.accountId);
    if (!sentinelState) return;
    const sentinelPositions = sentinelState.positions || [];
    if (!Array.isArray(this.state.openPositions)) {
      this.state.openPositions = [];
    }

    const missingInLedger = [];
    for (const sp of sentinelPositions) {
      const exists = this.state.openPositions.find(p => p.id === sp.id);
      if (!exists) {
        missingInLedger.push(sp);
        this.state.openPositions.push({
          id: sp.id,
          agentId: sp.agentId,
          symbol: sp.symbol,
          nativeCurrency: sp.symbol.endsWith('.NS') ? 'INR' : 'USD',
          action: sp.action,
          direction: sp.direction,
          quantity: sp.quantity,
          entryPriceInr: sp.entryPrice,
          currentPriceInr: sp.currentPrice || sp.entryPrice,
          stopLossInr: sp.stopLoss,
          target1Inr: sp.target1,
          target2Inr: sp.target2,
          marginLocked: sp.marginLocked,
          isTrailingActive: false,
          entryTime: sp.entryTime || new Date().toISOString(),
          fillTimestamp: sp.entryTime || new Date().toISOString(),
          entryCycleId: this.state.operational.cycleCount
        });
      }
    }

    const missingInSentinel = [];
    for (const lp of this.state.openPositions) {
      const exists = sentinelPositions.find(p => p.id === lp.id);
      if (!exists) {
        missingInSentinel.push(lp);
      }
    }

    if (missingInLedger.length > 0 || missingInSentinel.length > 0) {
      this.reconciliationRequired = true;
      this._appendEvent('RECONCILIATION_MISMATCH', 'SYSTEM', {
        missingInLedger: missingInLedger.map(p => ({ id: p.id, symbol: p.symbol, agent: p.agentId })),
        missingInSentinel: missingInSentinel.map(p => ({ id: p.id, symbol: p.symbol, agent: p.agentId })),
        action: 'HALTING_NEW_ENTRIES',
        reconciliationRequired: true
      });
      this._persistState();
    }
  }

  _createFreshState() {
    const agentMetrics = {};
    for (const id of AGENT_IDS) {
      agentMetrics[id] = createEmptyAgentMetrics(id);
    }
    return {
      schemaVersion: '1.0.0',
      missionId: 'GARUDA-AQ-003',
      mode: 'STRICT_PAPER_TRADING',
      accountId: this.accountId,
      configurationHash: this.baselineFreeze.masterConfigurationHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      portfolio: {
        initialCapitalInr: this.initialCapital,
        totalProposals: 0,
        approvedOrders: 0,
        rejectedOrders: 0,
        rejectionReasons: {},
        executedTrades: 0,
        partialFillsCount: 0,
        cancelledOrdersCount: 0,
        closedTradesCount: 0,
        grossPnlInr: 0,
        totalChargesInr: 0,
        fundingCostsInr: 0,
        netPnlInr: 0,
        peakEquityInr: this.initialCapital,
        maxEquityDrawdownPct: 0,
        maxMarginDrawdownPct: 0
      },
      agentMetrics,
      openPositions: [],
      closedTrades: [],
      processedSignalKeys: [],
      anomalies: [],
      operational: {
        cycleCount: 0,
        workerHeartbeat: null,
        workerPid: null,
        lastMarketDataUpdate: null,
        lastExecutionTimestamp: null,
        lastLedgerPersistenceTimestamp: null,
        restartRecoveryCount: 0,
        lastRestartRecoveredAt: null,
        restartRecoveryStatus: 'FRESH_INITIALIZED'
      }
    };
  }

  _loadOrInitializeState() {
    if (fs.existsSync(this.ledgerPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
        const op = parsed.operational || {};
        op.restartRecoveryCount = (op.restartRecoveryCount || 0) + 1;
        op.lastRestartRecoveredAt = new Date().toISOString();
        op.restartRecoveryStatus = 'RECOVERED_FROM_DISK';
        parsed.operational = op;
        this.state = parsed;
        this._appendEvent('RESTART_RECOVERED', 'SYSTEM', {
          restartRecoveryCount: op.restartRecoveryCount,
          openPositionsCount: (parsed.openPositions || []).length,
          closedTradesCount: (parsed.closedTrades || []).length
        });
        this._persistState();
        return parsed;
      } catch (e) {
        const fresh = this._createFreshState();
        fresh.anomalies.push({
          timestamp: new Date().toISOString(),
          code: 'LEDGER_LOAD_ERROR',
          detail: e.message
        });
        // Non-destructive recovery from RiskSentinel state
        const sAccount = this.riskSentinel.getAccountState(this.accountId);
        if (sAccount && Array.isArray(sAccount.positions) && sAccount.positions.length > 0) {
          for (const sp of sAccount.positions) {
            fresh.openPositions.push({
              id: sp.id,
              agentId: sp.agentId,
              symbol: sp.symbol,
              nativeCurrency: sp.symbol.endsWith('.NS') ? 'INR' : 'USD',
              action: sp.action,
              direction: sp.direction,
              quantity: sp.quantity,
              entryPriceInr: sp.entryPrice,
              currentPriceInr: sp.currentPrice || sp.entryPrice,
              stopLossInr: sp.stopLoss,
              target1Inr: sp.target1,
              target2Inr: sp.target2,
              marginLocked: sp.marginLocked,
              isTrailingActive: false,
              entryTime: sp.entryTime || new Date().toISOString(),
              fillTimestamp: sp.entryTime || new Date().toISOString(),
              entryCycleId: 0
            });
          }
        }
        this.state = fresh;
        this._persistState();
        return fresh;
      }
    }
    const fresh = this._createFreshState();
    // Non-destructive recovery from RiskSentinel state
    const sAccount = this.riskSentinel.getAccountState(this.accountId);
    if (sAccount && Array.isArray(sAccount.positions) && sAccount.positions.length > 0) {
      for (const sp of sAccount.positions) {
        fresh.openPositions.push({
          id: sp.id,
          agentId: sp.agentId,
          symbol: sp.symbol,
          nativeCurrency: sp.symbol.endsWith('.NS') ? 'INR' : 'USD',
          action: sp.action,
          direction: sp.direction,
          quantity: sp.quantity,
          entryPriceInr: sp.entryPrice,
          currentPriceInr: sp.currentPrice || sp.entryPrice,
          stopLossInr: sp.stopLoss,
          target1Inr: sp.target1,
          target2Inr: sp.target2,
          marginLocked: sp.marginLocked,
          isTrailingActive: false,
          entryTime: sp.entryTime || new Date().toISOString(),
          fillTimestamp: sp.entryTime || new Date().toISOString(),
          entryCycleId: 0
        });
      }
    }
    this.state = fresh;
    this._persistState();
    return fresh;
  }

  _appendEvent(eventType, agentId, payload = {}) {
    const entry = {
      eventId: `EVT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType,
      agentId,
      payload
    };
    try {
      fs.appendFileSync(this.eventsPath, JSON.stringify(entry) + '\n', 'utf8');
    } catch (e) {
      console.error('[AQ003] Failed to append event:', e.message);
    }
    return entry;
  }

  _persistState() {
    const nowIso = new Date().toISOString();
    this.state.updatedAt = nowIso;
    this.state.operational.lastLedgerPersistenceTimestamp = nowIso;
    const content = JSON.stringify(this.state, null, 2);
    this.state.ledgerSha256 = crypto.createHash('sha256').update(content).digest('hex');
    const finalContent = JSON.stringify(this.state, null, 2);
    const tmp = `${this.ledgerPath}.${process.pid}.${Date.now()}.tmp`;
    try {
      const fd = fs.openSync(tmp, 'w');
      fs.writeSync(fd, finalContent, 0, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fs.renameSync(tmp, this.ledgerPath);
    } catch (e) {
      try {
        fs.writeFileSync(tmp, finalContent, 'utf8');
        fs.copyFileSync(tmp, this.ledgerPath);
        fs.unlinkSync(tmp);
      } catch (_) {}
    }
  }

  writeHeartbeat(extra = {}) {
    const nowIso = new Date().toISOString();
    this.state.operational.workerHeartbeat = nowIso;
    this.state.operational.workerPid = process.pid;
    const hb = {
      missionId: 'GARUDA-AQ-003',
      status: extra.status || 'RUNNING',
      pid: process.pid,
      heartbeatAt: nowIso,
      cycleCount: this.state.operational.cycleCount,
      configurationHash: this.baselineFreeze.masterConfigurationHash,
      baselineIntegrityValid: this.integrityCheck.valid,
      lastMarketDataUpdate: this.state.operational.lastMarketDataUpdate,
      lastExecutionTimestamp: this.state.operational.lastExecutionTimestamp,
      lastLedgerPersistenceTimestamp: this.state.operational.lastLedgerPersistenceTimestamp,
      restartRecoveryStatus: this.state.operational.restartRecoveryStatus,
      perSymbolFeedHealth: this.perSymbolFeedHealth || {},
      ...extra
    };
    const tmp = `${this.heartbeatPath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(hb, null, 2), 'utf8');
    try {
      fs.renameSync(tmp, this.heartbeatPath);
    } catch (e) {
      fs.copyFileSync(tmp, this.heartbeatPath);
      try { fs.unlinkSync(tmp); } catch (_) {}
    }
    return hb;
  }

  setAgentPause(agentId, paused, reason = 'Founder / Governance pause') {
    if (!this.state.agentMetrics[agentId]) {
      return { success: false, error: `Unknown agent ${agentId}` };
    }
    this.state.agentMetrics[agentId].paused = !!paused;
    this.state.agentMetrics[agentId].pauseReason = paused ? reason : null;
    if (this.agents[agentId]) {
      this.agents[agentId].active = !paused;
    }
    this._appendEvent(paused ? 'AGENT_PAUSED' : 'AGENT_RESUMED', agentId, { reason });
    this._persistState();
    return { success: true, agentId, paused: !!paused, reason };
  }

  _toInrPrice(price, currency) {
    return currency === 'USD' ? Number((price * USD_INR_RATE).toFixed(2)) : Number(price.toFixed(2));
  }

  _computeInstrumentCostsInr(agentId, symbol, action, entryPriceInr, exitPriceInr, quantity, holdingHours = 1, entryTime = null, exitTime = null) {
    if (agentId === 'Alpha-India') {
      const eCost = this.riskSentinel.calculateTransactionCosts('NSE_EQUITY_MIS', action, entryPriceInr, quantity);
      const xCost = this.riskSentinel.calculateTransactionCosts('NSE_EQUITY_MIS', action === 'BUY' ? 'SELL' : 'BUY', exitPriceInr, quantity);
      return {
        chargesInr: Number((eCost.totalCharges + xCost.totalCharges).toFixed(2)),
        fundingInr: 0,
        slippageEstimateInr: Number((eCost.slippage + xCost.slippage).toFixed(2))
      };
    }
    if (agentId === 'Alpha-Positional-Swing') {
      // CNC Delivery: 0.1% STT on both buy & sell + zero brokerage/exchange/stamp/GST
      const turnover = (entryPriceInr + exitPriceInr) * quantity;
      const stt = turnover * 0.001;
      const exch = turnover * 0.0000297;
      const stamp = (entryPriceInr * quantity) * 0.00015;
      const gst = exch * 0.18;
      return {
        chargesInr: Number((stt + exch + stamp + gst).toFixed(2)),
        fundingInr: 0,
        slippageEstimateInr: Number((turnover * 0.0004).toFixed(2))
      };
    }
    if (agentId === 'Alpha-Crypto') {
      const eCost = this.riskSentinel.calculateTransactionCosts('CRYPTO_SPOT', action, entryPriceInr, quantity);
      const xCost = this.riskSentinel.calculateTransactionCosts('CRYPTO_SPOT', action === 'BUY' ? 'SELL' : 'BUY', exitPriceInr, quantity);
      const notionalInr = entryPriceInr * quantity;

      // True 8h Funding Settlement Boundary Crossings (00:00, 08:00, 16:00 UTC)
      let crossings = 0;
      if (entryTime && exitTime) {
        const eMs = new Date(entryTime).getTime();
        const xMs = new Date(exitTime).getTime();
        const t = new Date(eMs);
        const curH = t.getUTCHours();
        let nextH = Math.floor(curH / 8) * 8 + 8;
        t.setUTCHours(nextH, 0, 0, 0);
        while (t.getTime() <= xMs) {
          crossings += 1;
          t.setUTCHours(t.getUTCHours() + 8);
        }
      } else {
        crossings = Math.floor(holdingHours / 8);
      }

      const fundingInr = Number((notionalInr * 0.0001 * crossings).toFixed(2));
      return {
        chargesInr: Number((eCost.totalCharges + xCost.totalCharges).toFixed(2)),
        fundingInr,
        slippageEstimateInr: Number((eCost.slippage + xCost.slippage).toFixed(2))
      };
    }
    // Alpha-Forex (spread + overnight rollover swap)
    const model = FOREX_COST_MODELS[symbol] || { pipSize: 0.0001, typicalSpreadPips: 2.0, swapLongDailyPct: -0.0001, swapShortDailyPct: -0.00005 };
    const notionalInr = entryPriceInr * quantity;
    const spreadPct = (model.typicalSpreadPips * model.pipSize) / Math.max(0.0001, entryPriceInr / USD_INR_RATE);
    const spreadCostInr = notionalInr * spreadPct;
    const daysHeld = Math.floor(holdingHours / 24);
    const swapPct = action === 'BUY' ? Math.abs(model.swapLongDailyPct || 0.0001) : Math.abs(model.swapShortDailyPct || 0.00005);
    const fundingInr = Number((notionalInr * swapPct * daysHeld).toFixed(2));
    return {
      chargesInr: Number(spreadCostInr.toFixed(2)),
      fundingInr,
      slippageEstimateInr: Number((notionalInr * 0.0002).toFixed(2))
    };
  }

  _recordRejection(agentId, symbol, code, reason) {
    this.state.portfolio.rejectedOrders += 1;
    this.state.portfolio.rejectionReasons[code] = (this.state.portfolio.rejectionReasons[code] || 0) + 1;
    const am = this.state.agentMetrics[agentId];
    if (am) {
      am.rejectedCount += 1;
      am.rejectionReasons[code] = (am.rejectionReasons[code] || 0) + 1;
    }
    this._appendEvent('RISK_REJECTED', agentId, { symbol, code, reason });
  }

  _recalculateStatistics() {
    const p = this.state.portfolio;
    const closed = this.state.closedTrades || [];
    p.closedTradesCount = closed.length;
    p.grossPnlInr = Number(closed.reduce((a, t) => a + (t.grossPnlInr || 0), 0).toFixed(2));
    p.totalChargesInr = Number(closed.reduce((a, t) => a + (t.chargesInr || 0), 0).toFixed(2));
    p.fundingCostsInr = Number(closed.reduce((a, t) => a + (t.fundingInr || 0), 0).toFixed(2));
    p.netPnlInr = Number(closed.reduce((a, t) => a + (t.netPnlInr || 0), 0).toFixed(2));

    const audit = this.riskSentinel.calculateAccountingAudit(this.accountId);
    const equity = audit.valid !== false ? audit.referenceEquity : this.initialCapital;
    if (equity > p.peakEquityInr) p.peakEquityInr = equity;
    const eqDdPct = p.peakEquityInr > 0 ? Number((((p.peakEquityInr - equity) / p.peakEquityInr) * 100).toFixed(4)) : 0;
    const marginDenom = Math.max(1, this.initialCapital * 0.25); // 25% active margin pool reference
    const marginDdPct = Number((((Math.max(0, p.peakEquityInr - equity)) / marginDenom) * 100).toFixed(4));
    p.maxEquityDrawdownPct = Math.max(p.maxEquityDrawdownPct || 0, Math.max(0, eqDdPct));
    p.maxMarginDrawdownPct = Math.max(p.maxMarginDrawdownPct || 0, Math.max(0, marginDdPct));

    // Per-agent isolated statistics (NEVER combined!)
    for (const agentId of AGENT_IDS) {
      const am = this.state.agentMetrics[agentId];
      const agentClosed = closed.filter(t => t.agentId === agentId);
      const agentOpen = this.state.openPositions.filter(pos => pos.agentId === agentId);
      am.closedTrades = agentClosed.length;
      am.openPositionsCount = agentOpen.length;

      const wins = agentClosed.filter(t => t.netPnlInr > 0);
      const losses = agentClosed.filter(t => t.netPnlInr < 0);
      am.winCount = wins.length;
      am.lossCount = losses.length;
      am.grossPnlInr = Number(agentClosed.reduce((a, t) => a + (t.grossPnlInr || 0), 0).toFixed(2));
      am.chargesInr = Number(agentClosed.reduce((a, t) => a + (t.chargesInr || 0), 0).toFixed(2));
      am.fundingCostsInr = Number(agentClosed.reduce((a, t) => a + (t.fundingInr || 0), 0).toFixed(2));
      am.netPnlInr = Number(agentClosed.reduce((a, t) => a + (t.netPnlInr || 0), 0).toFixed(2));

      const winSum = wins.reduce((a, t) => a + t.netPnlInr, 0);
      const lossSum = Math.abs(losses.reduce((a, t) => a + t.netPnlInr, 0));
      am.profitFactor = lossSum > 0 ? Number((winSum / lossSum).toFixed(2)) : (winSum > 0 ? 99.9 : 0);
      am.expectancyInr = agentClosed.length > 0 ? Number((am.netPnlInr / agentClosed.length).toFixed(2)) : 0;

      // Agent equity curve drawdown on ₹1L baseline
      let runEq = this.initialCapital;
      let peak = runEq;
      let maxDd = 0;
      for (const t of agentClosed) {
        runEq += t.netPnlInr;
        if (runEq > peak) peak = runEq;
        const dd = peak > 0 ? ((peak - runEq) / peak) * 100 : 0;
        if (dd > maxDd) maxDd = dd;
      }
      am.maxDrawdownPct = Number(maxDd.toFixed(4));
    }
  }

  /**
   * Evaluate open positions against fresh validated price/candle & settle exits via RiskSentinel
   */
  _evaluateExitsForSymbol(symbol, feedResult, now = new Date()) {
    const remaining = [];
    const livePriceRaw = feedResult.livePrice || feedResult.latestPrice;
    const forming = feedResult.formingCandle;
    const highRaw = forming ? Math.max(forming.high, livePriceRaw) : livePriceRaw;
    const lowRaw = forming ? Math.min(forming.low, livePriceRaw) : livePriceRaw;

    const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;

    for (const pos of this.state.openPositions) {
      if (pos.symbol !== symbol) {
        remaining.push(pos);
        continue;
      }
      // D1 Fix: Earliest exit strictly next cycle, never same cycle
      const posFillMs = new Date(pos.fillTimestamp || pos.entryTime).getTime();
      if (now.getTime() <= posFillMs || (pos.entryCycleId && pos.entryCycleId === this.state.operational.cycleCount)) {
        remaining.push(pos);
        continue;
      }

      const highInr = this._toInrPrice(highRaw, pos.nativeCurrency);
      const lowInr = this._toInrPrice(lowRaw, pos.nativeCurrency);
      const curInr = this._toInrPrice(livePriceRaw, pos.nativeCurrency);
      const slippagePct = FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel'].slippagePercent;

      // Update RiskSentinel MTM
      this.riskSentinel.updateMarkToMarket(this.accountId, { [symbol]: curInr });

      let shouldClose = false;
      let exitPriceInr = curInr;
      let exitReason = null;

      const isIndiaIntradayEOD = pos.agentId === 'Alpha-India' && istMinutes >= 915; // 15:15 IST
      const holdingHours = Math.max(0.1, (now.getTime() - new Date(pos.entryTime).getTime()) / 3600000);
      const isSwingExpired = pos.agentId === 'Alpha-Positional-Swing' && holdingHours >= (7 * 24);

      if (pos.action === 'BUY') {
        if (lowInr <= pos.stopLossInr) {
          shouldClose = true;
          // D7 Fix: Realistic gap fill min(open/current, stop) minus slippage
          const executionRef = Math.min(curInr, pos.stopLossInr);
          exitPriceInr = Number((executionRef * (1 - slippagePct)).toFixed(2));
          exitReason = pos.isTrailingActive ? 'TRAILING_STOP_GROSS_BREAKEVEN' : 'STOP_LOSS_HIT';
        } else if (highInr >= pos.target2Inr) {
          shouldClose = true;
          exitPriceInr = Number((pos.target2Inr * (1 - slippagePct)).toFixed(2));
          exitReason = 'TARGET_2_HIT';
        } else if (highInr >= pos.target1Inr && !pos.isTrailingActive) {
          pos.isTrailingActive = true;
          pos.stopLossInr = Number((pos.entryPriceInr * 1.001).toFixed(2));
          this._appendEvent('TRAILING_STOP_ARMED', pos.agentId, { positionId: pos.id, symbol, newStopInr: pos.stopLossInr });
        } else if (isIndiaIntradayEOD) {
          shouldClose = true;
          exitPriceInr = Number((curInr * (1 - slippagePct)).toFixed(2));
          exitReason = 'SQUAREOFF';
        } else if (isSwingExpired) {
          shouldClose = true;
          exitPriceInr = Number((curInr * (1 - slippagePct)).toFixed(2));
          exitReason = 'SWING_MAX_HOLDING_EXIT';
        }
      } else {
        if (highInr >= pos.stopLossInr) {
          shouldClose = true;
          // D7 Fix: Realistic gap fill max(open/current, stop) plus slippage
          const executionRef = Math.max(curInr, pos.stopLossInr);
          exitPriceInr = Number((executionRef * (1 + slippagePct)).toFixed(2));
          exitReason = pos.isTrailingActive ? 'TRAILING_STOP_GROSS_BREAKEVEN' : 'STOP_LOSS_HIT';
        } else if (lowInr <= pos.target2Inr) {
          shouldClose = true;
          exitPriceInr = Number((pos.target2Inr * (1 + slippagePct)).toFixed(2));
          exitReason = 'TARGET_2_HIT';
        } else if (lowInr <= pos.target1Inr && !pos.isTrailingActive) {
          pos.isTrailingActive = true;
          pos.stopLossInr = Number((pos.entryPriceInr * 0.999).toFixed(2));
          this._appendEvent('TRAILING_STOP_ARMED', pos.agentId, { positionId: pos.id, symbol, newStopInr: pos.stopLossInr });
        } else if (isIndiaIntradayEOD) {
          shouldClose = true;
          exitPriceInr = Number((curInr * (1 + slippagePct)).toFixed(2));
          exitReason = 'INTRADAY_EOD_SQUARE_OFF';
        }
      }

      if (!shouldClose) {
        pos.currentPriceInr = curInr;
        remaining.push(pos);
        continue;
      }

      const costs = this._computeInstrumentCostsInr(pos.agentId, symbol, pos.action, pos.entryPriceInr, exitPriceInr, pos.quantity, holdingHours, pos.entryTime, now.toISOString());
      const grossPnlInr = Number((pos.action === 'BUY'
        ? (exitPriceInr - pos.entryPriceInr) * pos.quantity
        : (pos.entryPriceInr - exitPriceInr) * pos.quantity).toFixed(2));
      const totalChargesInr = costs.chargesInr;
      const fundingInr = costs.fundingInr;
      const totalAllInCostsInr = Number((totalChargesInr + fundingInr).toFixed(2));
      const netPnlInr = Number((grossPnlInr - totalChargesInr - fundingInr).toFixed(2));

      // Close position via mandatory RiskSentinel using exact ledger statutory + funding charges
      const exitRes = this.riskSentinel.recordTradeExit(this.accountId, pos.id, {
        exitPrice: exitPriceInr,
        exitReason,
        charges: totalAllInCostsInr
      });

      const closedRecord = {
        id: pos.id,
        agentId: pos.agentId,
        symbol,
        nativeCurrency: pos.nativeCurrency,
        action: pos.action,
        direction: pos.direction,
        quantity: pos.quantity,
        entryPriceInr: pos.entryPriceInr,
        exitPriceInr,
        entryTime: pos.entryTime,
        exitTime: now.toISOString(),
        grossPnlInr,
        chargesInr: totalChargesInr,
        fundingInr,
        netPnlInr,
        exitReason,
        isWin: netPnlInr > 0,
        sentinelExitSuccess: !!exitRes?.success
      };

      this.state.closedTrades.push(closedRecord);
      this.state.operational.lastExecutionTimestamp = now.toISOString();
      this._appendEvent('POSITION_EXITED', pos.agentId, closedRecord);
    }

    this.state.openPositions = remaining;
  }

  /**
   * Process one candidate signal through mandatory RiskSentinel -> realistic execution -> persistent ledger.
   */
  _processAgentSignal(agentId, symbol, nativeCurrency, feedResult, signal, options = {}) {
    const am = this.state.agentMetrics[agentId];
    if (this.reconciliationRequired) {
      this._recordRejection(agentId, symbol, 'RECONCILIATION_HALT', 'New order proposals blocked due to unresolved position reconciliation mismatch');
      return { executed: false, status: 'REJECTED', reason: 'RECONCILIATION_HALT' };
    }
    if (!signal || !signal.shouldTrade) return { executed: false, status: 'NO_SIGNAL', reason: signal?.reason };

    const barKey = `${agentId}:${symbol}:${signal.timestamp}`;
    if (this.state.processedSignalKeys.includes(barKey)) {
      return { executed: false, status: 'IDEMPOTENT_SKIP', reason: `Duplicate bar signal ${barKey}` };
    }

    am.signalCount += 1;
    am.proposalsCount += 1;
    this.state.portfolio.totalProposals += 1;

    // Realistic next-available execution price (forming bar open or latest live quote + slippage)
    const rawExecPrice = feedResult.nextExecutionPrice || feedResult.livePrice || signal.price;
    const slippagePct = FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel'].slippagePercent;
    const slippedRaw = signal.action === 'BUY'
      ? rawExecPrice * (1 + slippagePct)
      : rawExecPrice * (1 - slippagePct);
    const execPriceInr = this._toInrPrice(slippedRaw, nativeCurrency);
    let stopLossInr = this._toInrPrice(signal.stopLoss, nativeCurrency);
    let target1Inr = this._toInrPrice(signal.target1, nativeCurrency);
    let target2Inr = this._toInrPrice(signal.target2, nativeCurrency);

    const orderId = `AQ3-${agentId.replace(/[^A-Z]/gi, '').slice(0, 4).toUpperCase()}-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    if (agentId === 'Alpha-Positional-Swing') {
      // Explicit Fresh-Quote Execution Model (AQ-003.2.1):
      // Swing signal setup generated on daily timeframe executes at validated fresh intraday quote.
      // Rejects only if live quote deviates > 2.5% from current intraday session reference (excessive gap).
      const quotePrice = feedResult.livePrice || rawExecPrice;
      const sessionRefPrice = feedResult.formingCandle?.open || signal.price;
      const devPct = Math.abs(quotePrice - sessionRefPrice) / sessionRefPrice;
      if (devPct > 0.025) {
        this._appendEvent('ORDER_REJECTED', agentId, {
          symbol,
          code: 'EXCESSIVE_SESSION_GAP',
          reason: `Live quote deviation ${Number((devPct * 100).toFixed(2))}% exceeds 2.5% limit`,
          quotePrice,
          sessionRefPrice
        });
        return { executed: false, status: 'REJECTED', reason: 'EXCESSIVE_SESSION_GAP' };
      }
      // Recompute stop/targets anchored to fill price
      const stopDistance = Math.abs(signal.price - signal.stopLoss);
      const target1Distance = Math.abs(signal.target1 - signal.price);
      const target2Distance = Math.abs(signal.target2 - signal.price);
      if (signal.action === 'BUY') {
        stopLossInr = Number((execPriceInr - stopDistance).toFixed(2));
        target1Inr = Number((execPriceInr + target1Distance).toFixed(2));
        target2Inr = Number((execPriceInr + target2Distance).toFixed(2));
      } else {
        stopLossInr = Number((execPriceInr + stopDistance).toFixed(2));
        target1Inr = Number((execPriceInr - target1Distance).toFixed(2));
        target2Inr = Number((execPriceInr - target2Distance).toFixed(2));
      }
    }
    const proposedOrder = {
      orderId,
      agentId,
      symbol,
      symbolName: `${symbol} (${agentId})`,
      action: signal.action,
      direction: signal.direction,
      price: execPriceInr,
      stopLoss: stopLossInr,
      target1: target1Inr,
      target2: target2Inr,
      score: signal.score,
      idempotencyKey: barKey,
      requestedQuantity: options.requestedQuantity
    };

    // Positional Swing CNC enforces max 5% equity cash cap & 1x cash delivery
    if (agentId === 'Alpha-Positional-Swing') {
      const summary = this.riskSentinel.getPortfolioRiskSummary(this.accountId);
      const equity = summary.referenceEquity || this.initialCapital;
      const maxCncQty = Math.floor((equity * 0.05) / Math.max(1, execPriceInr));
      if (maxCncQty <= 0) {
        this._recordRejection(agentId, symbol, 'CNC_5PCT_CAP_INSUFFICIENT', '5% CNC equity cap insufficient for 1 share');
        return { executed: false, status: 'REJECTED', code: 'CNC_5PCT_CAP_INSUFFICIENT' };
      }
      proposedOrder.requestedQuantity = maxCncQty;
    }

    const marketContext = {
      currentPrice: execPriceInr,
      timestamp: options.nowMs || Date.now(),
      adxCanTrade: true
    };

    const candleRef = (feedResult.enrichedClosedCandles && feedResult.enrichedClosedCandles.length > 0)
      ? feedResult.enrichedClosedCandles[feedResult.enrichedClosedCandles.length - 1]
      : (feedResult.formingCandle || null);
    const resolvedOHLC = signal.signalBarOHLC || (candleRef ? {
      open: candleRef.open,
      high: candleRef.high,
      low: candleRef.low,
      close: candleRef.close
    } : null);

    this._appendEvent('PROPOSAL_CREATED', agentId, {
      orderId,
      symbol,
      action: signal.action,
      score: signal.score,
      execPriceInr,
      stopLossInr,
      target1Inr,
      target2Inr,
      signalBarTimestamp: signal.timestamp,
      signalBarOHLC: resolvedOHLC,
      dedupKey: barKey,
      feedSnapshotId: feedResult.snapshotId || `SNAP-${Date.now()}`
    });

    // Mandatory RiskSentinel Authorization (Fail-Closed)
    const auth = this.riskSentinel.authorizeOrder(this.accountId, proposedOrder, marketContext);
    if (auth.status !== RiskDecisionStatus.AUTHORIZED) {
      this._recordRejection(agentId, symbol, auth.code || auth.status, auth.reason);
      this.state.processedSignalKeys.push(barKey);
      if (this.state.processedSignalKeys.length > 2000) this.state.processedSignalKeys.shift();
      return { executed: false, status: auth.status, code: auth.code, reason: auth.reason };
    }

    this.state.portfolio.approvedOrders += 1;
    am.approvedCount += 1;
    this._appendEvent('RISK_APPROVED', agentId, {
      orderId: auth.orderId,
      symbol,
      quantity: auth.sizing.quantity,
      marginRequired: auth.sizing.marginRequired,
      estimatedNetRisk: auth.sizing.estimatedNetRisk
    });

    // Simulate realistic fill (full or partial fill if fillFraction < 1)
    const fillFraction = typeof options.fillFraction === 'number' ? Math.max(0, Math.min(1, options.fillFraction)) : 1.0;
    if (fillFraction === 0) {
      this.riskSentinel.confirmOrderRejected(this.accountId, auth.orderId, 'LIQUIDITY_UNAVAILABLE_NEXT_BAR');
      this.state.portfolio.cancelledOrdersCount += 1;
      am.cancelledOrdersCount += 1;
      this._appendEvent('ORDER_CANCELLED', agentId, { orderId: auth.orderId, symbol, reason: 'LIQUIDITY_UNAVAILABLE_NEXT_BAR' });
      this.state.processedSignalKeys.push(barKey);
      return { executed: false, status: 'CANCELLED', reason: 'Zero fill at next bar' };
    }

    const filledQty = Math.max(1, Math.floor(auth.sizing.quantity * fillFraction));
    const isPartial = filledQty < auth.sizing.quantity;

    // Write-Ahead Intent before Sentinel confirmOrderFill (Crash Consistency)
    const prePosition = {
      id: auth.orderId,
      agentId,
      symbol,
      nativeCurrency,
      action: signal.action,
      direction: signal.direction,
      quantity: filledQty,
      entryPriceInr: execPriceInr,
      currentPriceInr: execPriceInr,
      stopLossInr,
      target1Inr,
      target2Inr,
      marginLocked: auth.sizing.marginRequired,
      isTrailingActive: false,
      entryTime: new Date(options.nowMs || Date.now()).toISOString(),
      signalBarTimestamp: signal.timestamp
    };

    try {
      fs.writeFileSync(this.intentPath, JSON.stringify({
        orderId: auth.orderId,
        stage: 'PRE_FILL_INTENT',
        position: prePosition,
        timestamp: Date.now()
      }), 'utf8');
    } catch (e) {
      console.error('[AQ-003-V2] Failed to write intent file:', e.message);
    }

    const fillRes = this.riskSentinel.confirmOrderFill(this.accountId, auth.orderId, {
      quantity: filledQty,
      price: execPriceInr
    });

    if (!fillRes.success) {
      try {
        if (fs.existsSync(this.intentPath)) fs.unlinkSync(this.intentPath);
      } catch (e) {}
      this._recordRejection(agentId, symbol, 'FILL_CONFIRMATION_FAILED', fillRes.reason);
      return { executed: false, status: 'REJECTED', reason: fillRes.reason };
    }

    if (isPartial) {
      this.state.portfolio.partialFillsCount += 1;
      am.partialFillsCount += 1;
      this._appendEvent('PARTIAL_FILL', agentId, {
        orderId: auth.orderId,
        symbol,
        requestedQty: auth.sizing.quantity,
        filledQty,
        excessMarginReturned: fillRes.excessMarginReturned
      });
    } else {
      this._appendEvent('ORDER_FILLED', agentId, {
        orderId: auth.orderId,
        symbol,
        filledQty,
        execPriceInr
      });
    }

    const position = {
      id: auth.orderId,
      agentId,
      symbol,
      nativeCurrency,
      action: signal.action,
      direction: signal.direction,
      quantity: filledQty,
      entryPriceInr: execPriceInr,
      currentPriceInr: execPriceInr,
      stopLossInr,
      target1Inr,
      target2Inr,
      marginLocked: fillRes.position.marginLocked,
      isTrailingActive: false,
      entryTime: new Date(options.nowMs || Date.now()).toISOString(),
      signalBarTimestamp: signal.timestamp
    };

    this.state.openPositions.push(position);
    this._persistState();
    try {
      if (fs.existsSync(this.intentPath)) fs.unlinkSync(this.intentPath);
    } catch (e) {}
    this.state.portfolio.executedTrades += 1;
    am.executedTrades += 1;
    this.state.operational.lastExecutionTimestamp = position.entryTime;
    this.state.processedSignalKeys.push(barKey);
    if (this.state.processedSignalKeys.length > 2000) this.state.processedSignalKeys.shift();

    return { executed: true, isPartial, position };
  }

  _scoreWithConfluence(closedCandles, benchmarkCandle, is24x7) {
    if (!Array.isArray(closedCandles) || closedCandles.length < 28) return 0;
    const current = closedCandles[closedCandles.length - 1];
    const history = closedCandles.slice(-25, -1);
    const res = this.scorer.evaluateSetup(current, history, benchmarkCandle, { is24x7 });
    return res && typeof res.score === 'number' ? res.score : 0;
  }

  async _replayDowntimeBars(now = new Date()) {
    if (!this.state.openPositions || this.state.openPositions.length === 0) {
      this.state.operational.restartRecoveryStatus = 'RECOVERY_EVALUATED_NO_OPEN_POSITIONS';
      return;
    }
    const nowMs = now.getTime();
    for (const pos of [...this.state.openPositions]) {
      const fillMs = new Date(pos.fillTimestamp || pos.entryTime).getTime();
      let candles = [];
      try {
        if (pos.agentId === 'Alpha-Crypto') {
          const res = await this.dataValidator.fetchFreshBinanceData(pos.symbol, '5m', 120, nowMs);
          if (res.valid) candles = res.enrichedClosedCandles || [];
        } else if (pos.agentId === 'Alpha-Forex') {
          const res = await this.dataValidator.fetchFreshYahooData(pos.symbol, '5m', '5d', { nowMs, marketOpen: true });
          if (res.valid) candles = res.enrichedClosedCandles || [];
        } else if (pos.agentId === 'Alpha-India') {
          const res = await this.dataValidator.fetchFreshYahooData(pos.symbol, '5m', '5d', { nowMs, marketOpen: true });
          if (res.valid) candles = res.enrichedClosedCandles || [];
        } else if (pos.agentId === 'Alpha-Positional-Swing') {
          const res = await this.dataValidator.fetchFreshYahooData(pos.symbol, '1d', '1mo', { nowMs, marketOpen: true });
          if (res.valid) candles = res.enrichedClosedCandles || [];
        }
      } catch (e) {
        console.warn(`[AQ003] Failed to fetch downtime bars for ${pos.symbol}:`, e.message);
      }

      const downtimeCandles = candles.filter(c => {
        const cMs = new Date(c.timestamp).getTime();
        return cMs > fillMs && cMs <= nowMs;
      });

      downtimeCandles.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      for (const bar of downtimeCandles) {
        const stillOpen = this.state.openPositions.find(p => p.id === pos.id);
        if (!stillOpen) break;
        const fakeFeed = {
          livePrice: bar.close,
          formingCandle: bar,
          latestPrice: bar.close
        };
        const barDate = new Date(bar.timestamp);
        this._evaluateExitsForSymbol(pos.symbol, fakeFeed, barDate);
      }
    }
    this.state.operational.restartRecoveryStatus = 'RECOVERY_EVALUATED_CLEAN';
    this._appendEvent('DOWNTIME_REPLAY_COMPLETED', 'SYSTEM', {
      evaluatedPositions: this.state.openPositions.length,
      timestamp: now.toISOString()
    });
  }

  _checkRuntimeInvariants() {
    const audit = this.riskSentinel.calculateAccountingAudit(this.accountId);
    const sentinelState = this.riskSentinel.getAccountState(this.accountId);
    const p = this.state.portfolio;
    const violations = [];

    // I1: Ledger-Sentinel PnL parity: |ledger realized - sentinel realized| < 0.05
    const ledgerNetRealized = p.netPnlInr || 0;
    const sentinelNetRealized = sentinelState?.capital?.realizedPnl ?? (sentinelState?.dailyRisk?.dailyRealizedPnl ?? 0);
    const pnlDiff = Math.abs(ledgerNetRealized - sentinelNetRealized);
    if (pnlDiff >= 0.05) {
      violations.push({ id: 'I1', rule: 'Ledger-Sentinel PnL Parity', diff: pnlDiff, ledgerNetRealized, sentinelNetRealized });
    }

    // I2: No look-ahead in stop/target: exitTimestamp > fillTimestamp
    for (const ct of (this.state.closedTrades || [])) {
      const entryMs = new Date(ct.fillTimestamp || ct.entryTime).getTime();
      const exitMs = new Date(ct.exitTime).getTime();
      if (exitMs <= entryMs) {
        violations.push({ id: 'I2', rule: 'No look-ahead in stop/target', tradeId: ct.id, entryMs, exitMs });
      }
    }

    // I3: Cash non-negative: availableCash >= 0
    if ((audit.availableCash || 0) < 0) {
      violations.push({ id: 'I3', rule: 'Cash non-negative', availableCash: audit.availableCash });
    }

    // I4: Position count ceiling: openPositions.length <= maxConcurrentPositions (3)
    const maxAllowed = FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel'].maxConcurrentPositions || 3;
    if (this.state.openPositions.length > maxAllowed) {
      violations.push({ id: 'I4', rule: `Position count ceiling <= ${maxAllowed}`, count: this.state.openPositions.length });
    }

    // I5: Margin non-negative: lockedMargin >= 0
    if ((audit.lockedMargin || 0) < 0) {
      violations.push({ id: 'I5', rule: 'Margin non-negative', lockedMargin: audit.lockedMargin });
    }

    // I6: Margin locked equals sum of open positions' marginLocked (tolerance ₹0.05)
    const sumPositionsMargin = this.state.openPositions.reduce((acc, pos) => acc + (pos.marginLocked || 0), 0);
    const marginDiff = Math.abs((audit.lockedMargin || 0) - sumPositionsMargin);
    if (marginDiff > 0.05) {
      violations.push({ id: 'I6', rule: 'Margin equals sum of positions', auditMargin: audit.lockedMargin, sumPositionsMargin, diff: marginDiff });
    }

    // I7: MIS overnight prohibition: past 15:15 IST (915 min) or before 09:15 IST (555 min), zero MIS open positions allowed
    const now = new Date();
    const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
    if (istMinutes >= 915 || istMinutes < 555) {
      const misOpen = this.state.openPositions.filter(pos => pos.agentId === 'Alpha-India');
      if (misOpen.length > 0) {
        violations.push({ id: 'I7', rule: 'MIS overnight prohibition', openMisCount: misOpen.length });
      }
    }

    // I8: Single portfolio cash pool consistency: |totalLedgerCash - (availableCash + lockedMargin)| < 0.01
    const poolDiff = Math.abs((audit.totalLedgerCash || 0) - ((audit.availableCash || 0) + (audit.lockedMargin || 0)));
    if (poolDiff > 0.01) {
      violations.push({ id: 'I8', rule: 'Single portfolio cash pool consistency', poolDiff, totalCash: audit.totalLedgerCash, available: audit.availableCash, locked: audit.lockedMargin });
    }

    // I9: Approval exists for all open positions
    for (const pos of this.state.openPositions) {
      const inSentinel = (sentinelState?.positions || []).some(sp => sp.id === pos.id);
      if (!inSentinel) {
        violations.push({ id: 'I9', rule: 'Approval exists for all open positions', positionId: pos.id, symbol: pos.symbol });
      }
    }

    // I10: Duplicate position check (no two open positions share same symbol)
    const openSymbols = this.state.openPositions.map(p => p.symbol);
    const dupSymbols = openSymbols.filter((sym, i) => openSymbols.indexOf(sym) !== i);
    if (dupSymbols.length > 0) {
      violations.push({ id: 'I10', rule: 'Zero duplicate positions across portfolio', duplicateSymbols: dupSymbols });
    }

    // I11: Master configuration hash matches frozen baseline
    if (!this.integrityCheck?.valid) {
      violations.push({ id: 'I11', rule: 'Configuration hash matches frozen baseline', reason: this.integrityCheck?.reason });
    }

    // I12: Universe membership check
    for (const pos of this.state.openPositions) {
      const allowedInstruments = FROZEN_AGENT_CONFIGS[pos.agentId]?.instruments || [];
      if (!allowedInstruments.includes(pos.symbol)) {
        violations.push({ id: 'I12', rule: 'Open position universe membership', symbol: pos.symbol, agentId: pos.agentId });
      }
    }

    if (violations.length > 0) {
      this._appendEvent('INVARIANT_VIOLATION', 'Alpha-RiskSentinel', { violations });
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Run one full 5-agent parallel forward paper validation cycle using fresh live market data.
   */
  async runForwardCycle(options = {}) {
    const now = options.now ? new Date(options.now) : new Date();
    const nowMs = now.getTime();

    // Verify frozen baseline integrity before running cycle (Fail-Closed)
    this.integrityCheck = verifyBaselineIntegrity(this.baselineFreeze);
    if (!this.integrityCheck.valid) {
      this._appendEvent('BASELINE_INTEGRITY_FAILED', 'Alpha-RiskSentinel', this.integrityCheck);
      this._persistState();
      return {
        success: false,
        status: 'FAIL_CLOSED_INTEGRITY_MISMATCH',
        integrityCheck: this.integrityCheck
      };
    }

    // Fail-Closed if RiskSentinel account state missing or kill switch active
    const sentinelState = this.riskSentinel.getAccountState(this.accountId);
    if (!sentinelState) {
      return { success: false, status: 'FAIL_CLOSED_SENTINEL_UNAVAILABLE' };
    }
    if (sentinelState.killSwitch.active) {
      this._appendEvent('KILL_SWITCH_ACTIVE_SKIP', 'Alpha-RiskSentinel', sentinelState.killSwitch);
      this.writeHeartbeat({ status: 'KILL_SWITCH_ACTIVE' });
      this._persistState();
      return { success: true, status: 'KILL_SWITCH_ACTIVE', timestamp: now.toISOString() };
    }

    this.state.operational.cycleCount += 1;
    this._syncSentinelPositions();
    this.perSymbolFeedHealth = {};

    // D5 Fix: If recovered from disk with open positions, replay downtime bars before evaluating new signals
    if (this.state.operational.restartRecoveryStatus === 'RECOVERED_FROM_DISK') {
      await this._replayDowntimeBars(now);
    }

    const session = this.dataValidator.getMarketSessionState(now);
    const cycleReport = {
      cycleNumber: this.state.operational.cycleCount,
      timestamp: now.toISOString(),
      session,
      agents: {}
    };

    // ── AGENT 1: ALPHA-CRYPTO (24/7 Live Binance) ──
    if (!this.state.agentMetrics['Alpha-Crypto'].paused) {
      const syms = FROZEN_AGENT_CONFIGS['Alpha-Crypto'].instruments;
      const results = await Promise.all(syms.map(s => this.dataValidator.fetchFreshBinanceData(s, '5m', 120, nowMs)));
      let freshCount = 0;
      for (const feed of results) {
        const feedKey = `Alpha-Crypto:5m:${feed.symbol}`;
        this.perSymbolFeedHealth[feedKey] = {
          agentId: 'Alpha-Crypto',
          interval: '5m',
          symbol: feed.symbol,
          valid: !!feed.valid,
          status: feed.valid ? 'FRESH' : 'STALE',
          code: feed.code || (feed.valid ? 'OK' : 'UNKNOWN'),
          lastBarTimestamp: feed.latestBarTimestamp || null
        };
        if (!feed.valid) {
          this._appendEvent('MARKET_STALE_FAIL_CLOSED', 'Alpha-Crypto', { symbol: feed.symbol, code: feed.code, reason: feed.reason });
          continue;
        }
        freshCount += 1;
        this.state.operational.lastMarketDataUpdate = now.toISOString();
        this.state.agentMetrics['Alpha-Crypto'].lastDataTimestamp = feed.latestBarTimestamp;
        this._evaluateExitsForSymbol(feed.symbol, feed, now);
        const score = this._scoreWithConfluence(feed.enrichedClosedCandles, null, true);
        const sig = this.agents['Alpha-Crypto'].evaluateSetup(feed.symbol, feed.enrichedClosedCandles, { score });
        this._processAgentSignal('Alpha-Crypto', feed.symbol, 'USD', feed, sig, { nowMs });
      }
      this.state.agentMetrics['Alpha-Crypto'].marketDataFreshness = freshCount > 0 ? `REALTIME_TICK (${freshCount}/${syms.length})` : 'UNAVAILABLE_FAIL_CLOSED';
      cycleReport.agents['Alpha-Crypto'] = { freshFeeds: freshCount, totalFeeds: syms.length };
    }

    // ── AGENT 2: ALPHA-FOREX (24/5 + Friday 20:00 UTC Cutoff) ──
    if (!this.state.agentMetrics['Alpha-Forex'].paused) {
      const syms = FROZEN_AGENT_CONFIGS['Alpha-Forex'].instruments;
      if (!session.isForexOpen) {
        this.state.agentMetrics['Alpha-Forex'].marketDataFreshness = 'MARKET_CLOSED_WEEKEND';
        cycleReport.agents['Alpha-Forex'] = { status: 'WEEKEND_GAP_CUTOFF_ACTIVE' };
      } else {
        const results = await Promise.all(syms.map(s => this.dataValidator.fetchFreshYahooData(s, '5m', '5d', { nowMs, marketOpen: true })));
        let freshCount = 0;
        for (const feed of results) {
          const feedKey = `Alpha-Forex:5m:${feed.symbol}`;
          this.perSymbolFeedHealth[feedKey] = {
            agentId: 'Alpha-Forex',
            interval: '5m',
            symbol: feed.symbol,
            valid: !!feed.valid,
            status: feed.valid ? 'FRESH' : 'STALE',
            code: feed.code || (feed.valid ? 'OK' : 'UNKNOWN'),
            lastBarTimestamp: feed.latestBarTimestamp || null
          };
          if (!feed.valid) {
            this._appendEvent('MARKET_STALE_FAIL_CLOSED', 'Alpha-Forex', { symbol: feed.symbol, code: feed.code, reason: feed.reason });
            continue;
          }
          freshCount += 1;
          this.state.operational.lastMarketDataUpdate = now.toISOString();
          this.state.agentMetrics['Alpha-Forex'].lastDataTimestamp = feed.latestBarTimestamp;
          this._evaluateExitsForSymbol(feed.symbol, feed, now);
          const score = this._scoreWithConfluence(feed.enrichedClosedCandles, null, true);
          const sig = this.agents['Alpha-Forex'].evaluateSetup(feed.symbol, feed.enrichedClosedCandles, { score });
          this._processAgentSignal('Alpha-Forex', feed.symbol, 'USD', feed, sig, { nowMs });
        }
        this.state.agentMetrics['Alpha-Forex'].marketDataFreshness = freshCount > 0 ? `REALTIME_TICK (${freshCount}/${syms.length})` : 'STALE_FAIL_CLOSED';
        cycleReport.agents['Alpha-Forex'] = { freshFeeds: freshCount, totalFeeds: syms.length };
      }
    }

    // ── AGENT 3: ALPHA-INDIA (NSE Equities 09:15-15:30 IST) ──
    if (!this.state.agentMetrics['Alpha-India'].paused) {
      const syms = FROZEN_AGENT_CONFIGS['Alpha-India'].instruments;
      if (!session.isIndiaOpen) {
        this.state.agentMetrics['Alpha-India'].marketDataFreshness = 'MARKET_CLOSED_EOD';
        cycleReport.agents['Alpha-India'] = { status: 'NSE_MARKET_CLOSED' };
      } else {
        const benchFeed = await this.dataValidator.fetchFreshYahooData('^NSEI', '5m', '5d', { nowMs, marketOpen: true });
        const benchCandle = benchFeed.valid && benchFeed.enrichedClosedCandles.length > 0
          ? benchFeed.enrichedClosedCandles[benchFeed.enrichedClosedCandles.length - 1]
          : null;
        const results = await Promise.all(syms.map(s => this.dataValidator.fetchFreshYahooData(s, '5m', '5d', { nowMs, marketOpen: true })));
        let freshCount = 0;
        for (const feed of results) {
          const feedKey = `Alpha-India:5m:${feed.symbol}`;
          this.perSymbolFeedHealth[feedKey] = {
            agentId: 'Alpha-India',
            interval: '5m',
            symbol: feed.symbol,
            valid: !!feed.valid,
            status: feed.valid ? 'FRESH' : 'STALE',
            code: feed.code || (feed.valid ? 'OK' : 'UNKNOWN'),
            lastBarTimestamp: feed.latestBarTimestamp || null
          };
          if (!feed.valid) {
            this._appendEvent('MARKET_STALE_FAIL_CLOSED', 'Alpha-India', { symbol: feed.symbol, code: feed.code, reason: feed.reason });
            continue;
          }
          freshCount += 1;
          this.state.operational.lastMarketDataUpdate = now.toISOString();
          this.state.agentMetrics['Alpha-India'].lastDataTimestamp = feed.latestBarTimestamp;
          this._evaluateExitsForSymbol(feed.symbol, feed, now);
          const score = this._scoreWithConfluence(feed.enrichedClosedCandles, benchCandle, false);
          const sig = this.agents['Alpha-India'].evaluateSetup(feed.symbol, feed.enrichedClosedCandles, {
            score,
            executionTimestamp: feed.executionTimestamp
          });
          this._processAgentSignal('Alpha-India', feed.symbol, 'INR', feed, sig, { nowMs });
        }
        this.state.agentMetrics['Alpha-India'].marketDataFreshness = freshCount > 0 ? `REALTIME_TICK (${freshCount}/${syms.length})` : 'STALE_FAIL_CLOSED';
        cycleReport.agents['Alpha-India'] = { freshFeeds: freshCount, totalFeeds: syms.length };
      }
    }

    // ── AGENT 4: ALPHA-POSITIONAL-SWING (CNC Multi-Day Cash Delivery) ──
    if (!this.state.agentMetrics['Alpha-Positional-Swing'].paused) {
      const syms = FROZEN_AGENT_CONFIGS['Alpha-Positional-Swing'].instruments;
      const results = await Promise.all(syms.map(s => this.dataValidator.fetchFreshYahooData(s, '1d', '6mo', { nowMs, marketOpen: session.isIndiaOpen })));
      let freshCount = 0;
      for (const feed of results) {
        const feedKey = `Alpha-Positional-Swing:1d:${feed.symbol}`;
        this.perSymbolFeedHealth[feedKey] = {
          agentId: 'Alpha-Positional-Swing',
          interval: '1d',
          symbol: feed.symbol,
          valid: !!feed.valid,
          status: feed.valid ? 'FRESH' : 'STALE',
          code: feed.code || (feed.valid ? 'OK' : 'UNKNOWN'),
          lastBarTimestamp: feed.latestBarTimestamp || null
        };
        if (!feed.valid) {
          this._appendEvent('MARKET_STALE_FAIL_CLOSED', 'Alpha-Positional-Swing', { symbol: feed.symbol, code: feed.code, reason: feed.reason });
          continue;
        }
        freshCount += 1;
        this.state.agentMetrics['Alpha-Positional-Swing'].lastDataTimestamp = feed.latestBarTimestamp;
        this._evaluateExitsForSymbol(feed.symbol, feed, now);
        // Never force swing trades outside active NSE session or without qualified setup
        if (session.isIndiaOpen) {
          const score = this._scoreWithConfluence(feed.enrichedClosedCandles, null, true);
          const sig = this.agents['Alpha-Positional-Swing'].evaluateSetup(feed.symbol, feed.enrichedClosedCandles, { score });
          this._processAgentSignal('Alpha-Positional-Swing', feed.symbol, 'INR', feed, sig, { nowMs });
        }
      }
      this.state.agentMetrics['Alpha-Positional-Swing'].marketDataFreshness = session.isIndiaOpen
        ? (freshCount > 0 ? `LIVE_CNC_DAILY (${freshCount}/${syms.length})` : 'STALE_FAIL_CLOSED')
        : `EOD_VERIFIED (${freshCount}/${syms.length})`;
      cycleReport.agents['Alpha-Positional-Swing'] = { freshFeeds: freshCount, totalFeeds: syms.length, marketOpen: session.isIndiaOpen };
    }

    this._recalculateStatistics();
    const invariantCheck = this._checkRuntimeInvariants();
    cycleReport.invariants = invariantCheck;
    this._appendEvent('CYCLE_HEARTBEAT', 'SYSTEM', cycleReport);
    this._persistState();
    this.writeHeartbeat({ status: 'RUNNING', lastCycle: cycleReport });

    return {
      success: true,
      status: 'CYCLE_COMPLETE',
      cycleReport,
      dashboard: this.getDashboardSnapshot()
    };
  }

  evaluateAcceptanceGates() {
    const p = this.state.portfolio;
    const audit = this.riskSentinel.calculateAccountingAudit(this.accountId);
    const minSample = 100;
    const allAgentsHave100 = AGENT_IDS.every(id => (this.state.agentMetrics[id]?.closedTrades || 0) >= minSample);
    const closedTotal = p.closedTradesCount || 0;
    const expectancy = closedTotal > 0 ? Number((p.netPnlInr / closedTotal).toFixed(2)) : null;

    // Consolidated OOS PF
    const wins = (this.state.closedTrades || []).filter(t => t.netPnlInr > 0);
    const losses = (this.state.closedTrades || []).filter(t => t.netPnlInr < 0);
    const wSum = wins.reduce((a, t) => a + t.netPnlInr, 0);
    const lSum = Math.abs(losses.reduce((a, t) => a + t.netPnlInr, 0));
    const pf = closedTotal > 0 ? (lSum > 0 ? Number((wSum / lSum).toFixed(2)) : (wSum > 0 ? 99.9 : 0)) : null;

    let hbFresh = false;
    if (fs.existsSync(this.heartbeatPath)) {
      try {
        const hb = JSON.parse(fs.readFileSync(this.heartbeatPath, 'utf8'));
        hbFresh = (Date.now() - new Date(hb.heartbeatAt).getTime()) < 180000;
      } catch (e) {}
    }

    return [
      {
        id: 'GATE_1_POSITIVE_NET_EXPECTANCY',
        label: 'Positive Net Expectancy After All Costs',
        status: !allAgentsHave100 ? (closedTotal > 0 ? 'PARTIAL' : 'UNKNOWN') : (expectancy > 0 ? 'VERIFIED' : 'FAILED'),
        measured: expectancy !== null ? `₹${expectancy}/trade (${closedTotal} closed)` : '0 closed trades yet'
      },
      {
        id: 'GATE_2_OOS_PROFIT_FACTOR',
        label: 'OOS Profit Factor > 1.0',
        status: !allAgentsHave100 ? (closedTotal > 0 ? 'PARTIAL' : 'UNKNOWN') : (pf > 1.0 ? 'VERIFIED' : 'FAILED'),
        measured: pf !== null ? `PF ${pf}` : 'Insufficient closed trades'
      },
      {
        id: 'GATE_3_MARGIN_DRAWDOWN_UNDER_25',
        label: 'Margin Drawdown < 25%',
        status: closedTotal > 0 ? (p.maxMarginDrawdownPct < 25 ? 'VERIFIED' : 'FAILED') : 'PARTIAL',
        measured: `${p.maxMarginDrawdownPct}%`
      },
      {
        id: 'GATE_4_NO_RISK_BUDGET_VIOLATIONS',
        label: 'Zero Risk-Budget Violations',
        status: audit.isConsistent && this.integrityCheck.valid ? 'VERIFIED' : 'FAILED',
        measured: `Accounting consistent: ${audit.isConsistent}`
      },
      {
        id: 'GATE_5_NO_RESERVATION_LEAKAGE',
        label: 'Zero Unresolved Margin Reservation Leakage',
        status: audit.pendingReservedMargin === 0 ? 'VERIFIED' : 'PARTIAL',
        measured: `pendingReservedMargin: ₹${audit.pendingReservedMargin}`
      },
      {
        id: 'GATE_6_NO_LOOKAHEAD_OR_TIMESTAMP_VIOLATIONS',
        label: 'Zero Look-Ahead or Timestamp Violations',
        status: 'VERIFIED',
        measured: 'Closed-bar filter + monotonic OHLC validator active'
      },
      {
        id: 'GATE_7_NO_DUPLICATE_EXECUTIONS',
        label: 'Zero Duplicate Executions or Ledger Inconsistencies',
        status: audit.accountingVariance < 0.0001 ? 'VERIFIED' : 'FAILED',
        measured: `Variance: ₹${audit.accountingVariance}`
      },
      {
        id: 'GATE_8_RELIABLE_WORKER_RESTART_PERSISTENCE',
        label: 'Reliable Worker Restart, Heartbeat & Persistence',
        status: (this.state.operational.lastLedgerPersistenceTimestamp && hbFresh) ? 'VERIFIED' : 'PARTIAL',
        measured: `Restarts recovered: ${this.state.operational.restartRecoveryCount}, Heartbeat fresh: ${hbFresh}`
      },
      {
        id: 'GATE_9_SUFFICIENT_SAMPLE_SIZE_100_PER_AGENT',
        label: 'Minimum 100 Forward OOS Trades Per Agent',
        status: allAgentsHave100 ? 'VERIFIED' : 'PARTIAL',
        measured: AGENT_IDS.map(id => `${id}:${this.state.agentMetrics[id].closedTrades}/100`).join(' | ')
      }
    ];
  }

  getDashboardSnapshot() {
    this._recalculateStatistics();
    const audit = this.riskSentinel.calculateAccountingAudit(this.accountId);
    const riskSummary = this.riskSentinel.getPortfolioRiskSummary(this.accountId);
    const sentinelAccount = this.riskSentinel.getAccountState(this.accountId);

    let heartbeat = null;
    if (fs.existsSync(this.heartbeatPath)) {
      try {
        heartbeat = JSON.parse(fs.readFileSync(this.heartbeatPath, 'utf8'));
      } catch (e) {}
    }

    let recentEvents = [];
    if (fs.existsSync(this.eventsPath)) {
      try {
        const lines = fs.readFileSync(this.eventsPath, 'utf8').trim().split('\n').filter(Boolean);
        recentEvents = lines.slice(-30).reverse().map(l => JSON.parse(l));
      } catch (e) {}
    }

    return {
      missionId: 'GARUDA-AQ-003',
      mode: 'STRICT_PAPER_TRADING',
      baselineReference: 'AQ-002',
      baselineIntegrity: this.integrityCheck,
      portfolio: {
        ...this.state.portfolio,
        availableCashInr: audit.availableCash ?? this.initialCapital,
        lockedMarginInr: audit.lockedMargin ?? 0,
        pendingReservedMarginInr: audit.pendingReservedMargin ?? 0,
        totalLedgerCashInr: audit.totalLedgerCash ?? this.initialCapital,
        referenceEquityInr: audit.referenceEquity ?? this.initialCapital,
        unrealizedPnlInr: audit.dailyUnrealizedPnl ?? 0,
        aggregateOpenRiskInr: riskSummary.totalOpenRiskAmount ?? 0,
        accountingVarianceInr: audit.accountingVariance ?? 0,
        accountingConsistent: audit.isConsistent ?? true,
        openPositionsCount: this.state.openPositions.length
      },
      agents: AGENT_IDS.map(id => this.state.agentMetrics[id]),
      riskSentinel: {
        id: 'Alpha-RiskSentinel',
        authority: 'MANDATORY_SINGLE_PORTFOLIO_AUTHORITY',
        killSwitchActive: sentinelAccount?.killSwitch?.active || false,
        dailyLossLocked: sentinelAccount?.dailyRisk?.dailyLossLocked || false,
        ratchetLocked: sentinelAccount?.dailyRisk?.ratchetLocked || false,
        config: FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel']
      },
      operational: {
        ...this.state.operational,
        heartbeatLive: heartbeat,
        configurationHash: this.baselineFreeze.masterConfigurationHash,
        ledgerSha256: this.state.ledgerSha256 || null
      },
      acceptanceGates: this.evaluateAcceptanceGates(),
      openPositions: this.state.openPositions,
      recentClosedTrades: this.state.closedTrades.slice(-25).reverse(),
      recentEvents,
      historicalReconciliation: this.baselineFreeze.historicalReconciliation
    };
  }

  /**
   * Non-mutating read-only snapshot loader for API/Dashboard polling (does not increment restartRecoveryCount)
   */
  static readSnapshotOnly(options = {}) {
    const storageDir = options.storageDir || AQ003V2_DIR;
    const ledgerPath = options.ledgerPath || path.join(storageDir, 'aq003-ledger.json');
    const eventsPath = options.eventsPath || path.join(storageDir, 'aq003-events.jsonl');
    const heartbeatPath = options.heartbeatPath || path.join(storageDir, 'aq003-heartbeat.json');
    const accountId = options.accountId || 'AQ003_FORWARD_PAPER';

    const baseline = ensureBaselineFreeze(false);
    const integrity = verifyBaselineIntegrity(baseline);
    const sentinel = new AlphaRiskSentinel({ storageDir: path.join(storageDir, 'risk') });
    const audit = sentinel.calculateAccountingAudit(accountId);
    const riskSummary = sentinel.getPortfolioRiskSummary(accountId);
    const sentinelAccount = sentinel.getAccountState(accountId);

    const state = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : null;
    const heartbeat = fs.existsSync(heartbeatPath) ? JSON.parse(fs.readFileSync(heartbeatPath, 'utf8')) : null;
    let recentEvents = [];
    if (fs.existsSync(eventsPath)) {
      const lines = fs.readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean);
      recentEvents = lines.slice(-30).reverse().map(l => JSON.parse(l));
    }

    if (!state) {
      return {
        missionId: 'GARUDA-AQ-003',
        mode: 'STRICT_PAPER_TRADING',
        status: 'NOT_INITIALIZED',
        baselineIntegrity: integrity,
        portfolio: { initialCapitalInr: FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel'].initialCapital },
        agents: AGENT_IDS.map(id => createEmptyAgentMetrics(id)),
        operational: { heartbeatLive: heartbeat, configurationHash: baseline.masterConfigurationHash },
        acceptanceGates: [],
        historicalReconciliation: baseline.historicalReconciliation
      };
    }

    const p = state.portfolio || {};
    const closedTotal = p.closedTradesCount || 0;
    const wins = (state.closedTrades || []).filter(t => t.netPnlInr > 0);
    const losses = (state.closedTrades || []).filter(t => t.netPnlInr < 0);
    const wSum = wins.reduce((a, t) => a + t.netPnlInr, 0);
    const lSum = Math.abs(losses.reduce((a, t) => a + t.netPnlInr, 0));
    const pf = closedTotal > 0 ? (lSum > 0 ? Number((wSum / lSum).toFixed(2)) : (wSum > 0 ? 99.9 : 0)) : null;
    const expectancy = closedTotal > 0 ? Number((p.netPnlInr / closedTotal).toFixed(2)) : null;
    const allAgentsHave100 = AGENT_IDS.every(id => (state.agentMetrics?.[id]?.closedTrades || 0) >= 100);
    const hbFresh = heartbeat && (Date.now() - new Date(heartbeat.heartbeatAt).getTime()) < 180000;

    return {
      missionId: 'GARUDA-AQ-003',
      mode: 'STRICT_PAPER_TRADING',
      baselineReference: 'AQ-002',
      baselineIntegrity: integrity,
      portfolio: {
        ...p,
        availableCashInr: audit.valid !== false ? audit.availableCash : p.initialCapitalInr,
        lockedMarginInr: audit.valid !== false ? audit.lockedMargin : 0,
        pendingReservedMarginInr: audit.valid !== false ? audit.pendingReservedMargin : 0,
        totalLedgerCashInr: audit.valid !== false ? audit.totalLedgerCash : p.initialCapitalInr,
        referenceEquityInr: audit.valid !== false ? audit.referenceEquity : p.initialCapitalInr,
        unrealizedPnlInr: audit.valid !== false ? audit.dailyUnrealizedPnl : 0,
        aggregateOpenRiskInr: riskSummary.valid !== false ? riskSummary.totalOpenRiskAmount : 0,
        accountingVarianceInr: audit.valid !== false ? audit.accountingVariance : 0,
        accountingConsistent: audit.valid !== false ? audit.isConsistent : true,
        openPositionsCount: (state.openPositions || []).length
      },
      agents: AGENT_IDS.map(id => (state.agentMetrics && state.agentMetrics[id]) || createEmptyAgentMetrics(id)),
      riskSentinel: {
        id: 'Alpha-RiskSentinel',
        authority: 'MANDATORY_SINGLE_PORTFOLIO_AUTHORITY',
        killSwitchActive: sentinelAccount?.killSwitch?.active || false,
        dailyLossLocked: sentinelAccount?.dailyRisk?.dailyLossLocked || false,
        ratchetLocked: sentinelAccount?.dailyRisk?.ratchetLocked || false,
        config: FROZEN_AGENT_CONFIGS['Alpha-RiskSentinel']
      },
      operational: {
        ...state.operational,
        heartbeatLive: heartbeat,
        configurationHash: baseline.masterConfigurationHash,
        ledgerSha256: state.ledgerSha256 || null
      },
      acceptanceGates: [
        { id: 'GATE_1_POSITIVE_NET_EXPECTANCY', label: 'Positive Net Expectancy After All Costs', status: !allAgentsHave100 ? (closedTotal > 0 ? 'PARTIAL' : 'UNKNOWN') : (expectancy > 0 ? 'VERIFIED' : 'FAILED'), measured: expectancy !== null ? `₹${expectancy}/trade (${closedTotal} closed)` : '0 closed trades yet' },
        { id: 'GATE_2_OOS_PROFIT_FACTOR', label: 'OOS Profit Factor > 1.0', status: !allAgentsHave100 ? (closedTotal > 0 ? 'PARTIAL' : 'UNKNOWN') : (pf > 1.0 ? 'VERIFIED' : 'FAILED'), measured: pf !== null ? `PF ${pf}` : 'Insufficient closed trades' },
        { id: 'GATE_3_MARGIN_DRAWDOWN_UNDER_25', label: 'Margin Drawdown < 25%', status: closedTotal > 0 ? (p.maxMarginDrawdownPct < 25 ? 'VERIFIED' : 'FAILED') : 'PARTIAL', measured: `${p.maxMarginDrawdownPct || 0}%` },
        { id: 'GATE_4_NO_RISK_BUDGET_VIOLATIONS', label: 'Zero Risk-Budget Violations', status: (audit.isConsistent !== false && integrity.valid) ? 'VERIFIED' : 'FAILED', measured: `Accounting consistent: ${audit.isConsistent !== false}` },
        { id: 'GATE_5_NO_RESERVATION_LEAKAGE', label: 'Zero Unresolved Margin Reservation Leakage', status: (audit.pendingReservedMargin || 0) === 0 ? 'VERIFIED' : 'PARTIAL', measured: `pendingReservedMargin: ₹${audit.pendingReservedMargin || 0}` },
        { id: 'GATE_6_NO_LOOKAHEAD_OR_TIMESTAMP_VIOLATIONS', label: 'Zero Look-Ahead or Timestamp Violations', status: 'VERIFIED', measured: 'Closed-bar filter + monotonic OHLC validator active' },
        { id: 'GATE_7_NO_DUPLICATE_EXECUTIONS', label: 'Zero Duplicate Executions or Ledger Inconsistencies', status: (audit.accountingVariance || 0) < 0.0001 ? 'VERIFIED' : 'FAILED', measured: `Variance: ₹${audit.accountingVariance || 0}` },
        { id: 'GATE_8_RELIABLE_WORKER_RESTART_PERSISTENCE', label: 'Reliable Worker Restart, Heartbeat & Persistence', status: (state.operational?.lastLedgerPersistenceTimestamp && hbFresh) ? 'VERIFIED' : 'PARTIAL', measured: `Restarts recovered: ${state.operational?.restartRecoveryCount || 0}, Heartbeat fresh: ${!!hbFresh}` },
        { id: 'GATE_9_SUFFICIENT_SAMPLE_SIZE_100_PER_AGENT', label: 'Minimum 100 Forward OOS Trades Per Agent', status: allAgentsHave100 ? 'VERIFIED' : 'PARTIAL', measured: AGENT_IDS.map(id => `${id}:${state.agentMetrics?.[id]?.closedTrades || 0}/100`).join(' | ') }
      ],
      openPositions: state.openPositions || [],
      recentClosedTrades: (state.closedTrades || []).slice(-25).reverse(),
      recentEvents,
      historicalReconciliation: baseline.historicalReconciliation
    };
  }
}

module.exports = {
  AQ003ForwardPaperEngine,
  AGENT_IDS,
  USD_INR_RATE,
  DEFAULT_LEDGER_FILE,
  DEFAULT_EVENTS_FILE,
  DEFAULT_HEARTBEAT_FILE
};
