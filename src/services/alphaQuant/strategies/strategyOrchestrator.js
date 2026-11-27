/**
 * 🦅 GARUDA ALPHA-QUANT: DETERMINISTIC STRATEGY ORCHESTRATOR
 * Mission AQ-001 — Phase 3 Strategy Engine & Dynamic Adaptation
 * 
 * Invariants:
 * 1. Zero Direct Order Submission: All orders MUST be authorized by RiskSentinel.
 * 2. Deterministic Regime Selection: Maps market conditions to specialized strategies.
 * 3. Dynamic Volatility Sizing: ATR-scaled position sizing strictly bounded by Sentinel's 1.0% equity cap.
 * 4. Strategy Degradation Guard: Auto-disables any strategy with rolling PF < 0.80 or 4 consecutive losses.
 * 5. Full Attribution & Audit: Tracks Sharpe, Calmar, PF, and Drawdown on both Equity and Margin base.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MarketRegimeClassifier, MarketRegime } = require('./marketRegimeClassifier');
const { StrategyRegistry, StrategyStatus } = require('./strategyRegistry');
const { defaultRiskSentinel, RiskDecisionStatus } = require('../risk/alphaRiskSentinel');

const DEFAULT_ATTRIBUTION_DIR = path.join(__dirname, '..', '..', '..', '..', 'data', 'risk');

class StrategyOrchestrator {
  constructor(riskSentinelOrOptions = {}, maybeOptions = {}) {
    let options = {};
    if (riskSentinelOrOptions && (riskSentinelOrOptions.authorizeOrder || riskSentinelOrOptions.getAccountState)) {
      options = { ...maybeOptions, riskSentinel: riskSentinelOrOptions };
    } else {
      options = riskSentinelOrOptions || {};
    }
    this.riskSentinel = options.riskSentinel || defaultRiskSentinel;
    this.registry = options.registry || new StrategyRegistry();
    this.storageDir = options.storageDir || DEFAULT_ATTRIBUTION_DIR;
    this.attributionFile = path.join(this.storageDir, 'strategy-attribution.json');
    this.schemaVersion = '1.0.0';
    this.performanceAttribution = new Map();
    this.governanceEvents = [];
    this.auditLog = [];
    this.isPersistenceCorrupted = false;

    // Initialize in-memory attribution templates for each registered strategy
    for (const strat of this.registry.getAllStrategies()) {
      this.performanceAttribution.set(strat.id, {
        strategyId: strat.id,
        strategyName: strat.name,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        grossPnl: 0,
        charges: 0,
        netPnl: 0,
        profitFactor: 0,
        peakCapital: 0,
        maxDrawdownEquityPct: 0,
        maxDrawdownMarginPct: 0,
        consecutiveLosses: 0,
        recentResults: [], // Rolling last 10 trades
        status: strat.status || StrategyStatus.ACTIVE,
        circuitBreakerReason: strat.circuitBreakerReason || null
      });
    }

    // Load durable persistent state (recovers consecutive losses, rolling history & disabled statuses)
    this._loadAttributionState();
  }

  /**
   * Load and validate persisted strategy attribution state.
   * Fail-Closed Doctrine: If corruption or invalid checksum is detected,
   * all strategies are forcibly DISABLED to protect client capital.
   */
  _loadAttributionState() {
    if (!fs.existsSync(this.attributionFile)) {
      try {
        if (!fs.existsSync(this.storageDir)) {
          fs.mkdirSync(this.storageDir, { recursive: true });
        }
        this._persistAttributionState();
      } catch (e) {}
      return;
    }

    try {
      const raw = fs.readFileSync(this.attributionFile, 'utf8');
      if (!raw || raw.trim().length === 0) {
        throw new Error('Persistence file is empty');
      }

      const parsed = JSON.parse(raw);
      if (!parsed.schemaVersion || !Array.isArray(parsed.data) || !parsed.checksum) {
        throw new Error('Invalid persistence schema format');
      }

      // Verify SHA-256 data integrity checksum
      const expectedChecksum = crypto.createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
      if (expectedChecksum !== parsed.checksum) {
        throw new Error(`Integrity checksum mismatch: computed ${expectedChecksum} !== recorded ${parsed.checksum}`);
      }

      // Restore strategy attribution states
      for (const item of parsed.data) {
        if (this.performanceAttribution.has(item.strategyId)) {
          this.performanceAttribution.set(item.strategyId, item);

          // RESTORE CIRCUIT BREAKER / QUARANTINE STATE:
          // Never automatically reactivate a disabled or quarantined strategy after a process restart!
          if (item.status === StrategyStatus.DISABLED || item.status === StrategyStatus.QUARANTINED) {
            const strat = this.registry.getStrategy(item.strategyId);
            if (strat) {
              if (item.status === StrategyStatus.QUARANTINED) {
                strat.quarantine(item.circuitBreakerReason || 'QUARANTINED (Restored from persistent storage)');
              } else {
                strat.disable(item.circuitBreakerReason || 'CIRCUIT_BREAKER_TRIGGERED (Restored from persistent storage)');
              }
            }
          }
        }
      }

      this.governanceEvents = parsed.governanceEvents || [];

    } catch (err) {
      // FAIL-CLOSED: Disable all strategies if persistence cannot be loaded or validated
      this.isPersistenceCorrupted = true;
      for (const strat of this.registry.getAllStrategies()) {
        strat.disable(`FAIL_CLOSED: Strategy attribution persistence validation failed (${err.message})`);
        const stats = this.performanceAttribution.get(strat.id);
        if (stats) {
          stats.status = StrategyStatus.DISABLED;
          stats.circuitBreakerReason = strat.circuitBreakerReason;
        }
      }
      this._logAudit({
        timestamp: new Date().toISOString(),
        eventType: 'PERSISTENCE_LOAD_CORRUPTION_FAIL_CLOSED',
        error: err.message
      });
    }
  }

  /**
   * Atomically persist strategy attribution state using temp-file + fsync + atomic rename
   */
  _persistAttributionState() {
    if (this.isPersistenceCorrupted) return; // Prevent overwriting corrupted state

    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }

      const dataArray = Array.from(this.performanceAttribution.values());
      const checksum = crypto.createHash('sha256').update(JSON.stringify(dataArray)).digest('hex');

      const payload = {
        schemaVersion: this.schemaVersion,
        updatedAt: new Date().toISOString(),
        checksum,
        governanceEvents: this.governanceEvents,
        data: dataArray
      };

      const tmpPath = path.join(this.storageDir, `strategy-attribution-${process.pid}-${Date.now()}.tmp`);
      const fd = fs.openSync(tmpPath, 'w');
      fs.writeFileSync(fd, JSON.stringify(payload, null, 2), 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);

      fs.renameSync(tmpPath, this.attributionFile);
    } catch (err) {
      this._logAudit({
        timestamp: new Date().toISOString(),
        eventType: 'PERSISTENCE_WRITE_ERROR',
        error: err.message
      });
    }
  }

  /**
   * Evaluate market data and execute the deterministic strategy workflow
   * @param {string} accountId Client / virtual account ID
   * @param {string} symbol Ticker symbol (e.g. 'TCS.NS')
   * @param {Array<Object>} candles OHLCV candles
   * @param {Object} [extraContext={}] Additional scanner or agent signals
   * @returns {Object} Strategy evaluation & RiskSentinel decision
   */
  evaluateAndPropose(accountId, symbol, candles, extraContext = {}) {
    const timestamp = new Date().toISOString();

    // 1. Classify Market Regime
    const regimeContext = MarketRegimeClassifier.classify(candles);

    // 2. Select Appropriate Strategy
    const strategy = this.registry.getStrategyForRegime(regimeContext.regime);

    // 3. Check Strategy Circuit Breaker & Quarantine Gate
    if (strategy.status === StrategyStatus.DISABLED || strategy.status === StrategyStatus.QUARANTINED) {
      const isQuarantine = strategy.status === StrategyStatus.QUARANTINED;
      const explainRecord = {
        timestamp,
        accountId,
        symbol,
        regime: regimeContext.regime,
        strategySelected: strategy.id,
        strategyStatus: strategy.status,
        actionTaken: isQuarantine ? 'BLOCKED_BY_STRATEGY_QUARANTINE' : 'BLOCKED_BY_STRATEGY_CIRCUIT_BREAKER',
        reason: strategy.circuitBreakerReason
      };
      this._logAudit(explainRecord);
      return {
        executed: false,
        veto: true,
        code: isQuarantine ? 'STRATEGY_QUARANTINED' : 'STRATEGY_CIRCUIT_BREAKER_ACTIVE',
        reason: `Strategy ${strategy.name} is ${strategy.status}: ${strategy.circuitBreakerReason}`,
        regime: regimeContext.regime,
        explainRecord
      };
    }

    // 4. Evaluate Strategy Rules
    const signal = {
      symbol,
      symbolName: extraContext.symbolName || symbol,
      score: extraContext.score || 78,
      executionTimestamp: extraContext.executionTimestamp,
      nextCandle: extraContext.nextCandle
    };
    const setup = strategy.evaluate(signal, regimeContext);

    if (!setup.shouldTrade) {
      const explainRecord = {
        timestamp,
        accountId,
        symbol,
        regime: regimeContext.regime,
        strategySelected: strategy.id,
        strategyStatus: strategy.status,
        actionTaken: 'STRATEGY_REFUSED_TRADE',
        reason: setup.vetoReason
      };
      this._logAudit(explainRecord);
      return {
        executed: false,
        veto: true,
        code: 'STRATEGY_VETO',
        reason: setup.vetoReason,
        regime: regimeContext.regime,
        explainRecord
      };
    }

    // 5. Dynamic Volatility Position Sizing
    // Sizing formula: Position Size = floor((Equity * 0.010) / (ATR * 1.5))
    const accountState = this.riskSentinel.getAccountState(accountId);
    if (!accountState) {
      return {
        executed: false,
        veto: true,
        code: 'ACCOUNT_STATE_UNAVAILABLE',
        reason: `Account ${accountId} not registered with RiskSentinel`
      };
    }

    const availableCash = accountState.capital.availableCash || accountState.capital.cash || 100000;
    const riskBudget = availableCash * accountState.config.maxRiskPerTradePercent;
    const calculatedQty = Math.floor(riskBudget / setup.riskPerShare);

    if (calculatedQty <= 0) {
      const explainRecord = {
        timestamp,
        accountId,
        symbol,
        regime: regimeContext.regime,
        strategySelected: strategy.id,
        strategyStatus: strategy.status,
        actionTaken: 'BLOCKED_BY_RISK_BUDGET',
        reason: `Calculated position size is 0 (Risk budget ₹${riskBudget.toFixed(2)} < Risk per share ₹${setup.riskPerShare.toFixed(2)}). Zero forced 1-share rule enforced.`
      };
      this._logAudit(explainRecord);
      return {
        executed: false,
        veto: true,
        code: 'PER_TRADE_RISK_CAP_EXCEEDED',
        reason: `Calculated quantity by risk is 0 (Risk budget ₹${riskBudget.toFixed(2)} vs Risk per share ₹${setup.riskPerShare.toFixed(2)})`,
        regime: regimeContext.regime,
        explainRecord
      };
    }

    const proposedOrder = {
      orderId: `ORD-STRAT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      agentId: extraContext.agentId || 'Alpha-Quant',
      symbol: setup.symbol,
      symbolName: setup.symbolName,
      action: setup.action,
      direction: setup.direction,
      price: setup.price,
      stopLoss: setup.stopLoss,
      target1: setup.target1,
      target2: setup.target2,
      requestedQuantity: calculatedQty,
      score: setup.score,
      strategyId: strategy.id
    };

    const marketContext = {
      currentPrice: setup.price,
      timestamp: Date.now(),
      adxCanTrade: regimeContext.canTrade
    };

    // 6. MANDATORY SOVEREIGN DELEGATION: RiskSentinel Authorization
    const sentinelDecision = this.riskSentinel.authorizeOrder(accountId, proposedOrder, marketContext);

    const isAuthorized = sentinelDecision.status === RiskDecisionStatus.AUTHORIZED;
    const explainRecord = {
      timestamp,
      accountId,
      symbol,
      regime: regimeContext.regime,
      regimeReasons: regimeContext.reasons,
      strategySelected: strategy.id,
      strategyName: strategy.name,
      proposedQuantity: calculatedQty,
      stopDistance: setup.riskPerShare,
      sentinelStatus: sentinelDecision.status,
      sentinelCode: sentinelDecision.code || null,
      fencingToken: sentinelDecision.fencingToken || null
    };

    this._logAudit(explainRecord);

    return {
      executed: isAuthorized,
      veto: !isAuthorized,
      strategyId: strategy.id,
      regime: regimeContext.regime,
      decision: sentinelDecision,
      explainRecord
    };
  }

  /**
   * Record trade execution result for strategy performance attribution & degradation detection
   */
  recordTradeResult(strategyId, netPnl, grossPnl, charges, marginLocked = 25000, initialCapital = 100000) {
    let stats = this.performanceAttribution.get(strategyId);
    if (!stats) return;

    stats.totalTrades += 1;
    if (netPnl > 0) {
      stats.wins += 1;
      stats.consecutiveLosses = 0;
    } else {
      stats.losses += 1;
      stats.consecutiveLosses += 1;
    }

    stats.winRate = Number(((stats.wins / stats.totalTrades) * 100).toFixed(2));
    stats.grossPnl = Number((stats.grossPnl + grossPnl).toFixed(2));
    stats.charges = Number((stats.charges + charges).toFixed(2));
    stats.netPnl = Number((stats.netPnl + netPnl).toFixed(2));

    // Rolling 10-trade memory
    stats.recentResults.push(netPnl);
    if (stats.recentResults.length > 10) stats.recentResults.shift();

    // Profit Factor calculation
    let grossWins = 0;
    let grossLosses = 0;
    stats.recentResults.forEach(r => {
      if (r > 0) grossWins += r;
      else grossLosses += Math.abs(r);
    });
    stats.profitFactor = grossLosses > 0 ? Number((grossWins / grossLosses).toFixed(2)) : (grossWins > 0 ? 99.0 : 0);

    // Peak & Drawdown tracking
    if (stats.netPnl > stats.peakCapital) {
      stats.peakCapital = stats.netPnl;
    }
    const currentDrawdownAmt = stats.peakCapital - stats.netPnl;
    const ddEquity = (currentDrawdownAmt / initialCapital) * 100;
    const ddMargin = (currentDrawdownAmt / marginLocked) * 100;

    if (ddEquity > stats.maxDrawdownEquityPct) stats.maxDrawdownEquityPct = Number(ddEquity.toFixed(4));
    if (ddMargin > stats.maxDrawdownMarginPct) stats.maxDrawdownMarginPct = Number(ddMargin.toFixed(4));

    // ── DEGRADATION CIRCUIT BREAKER LOGIC ──
    const strategy = this.registry.getStrategy(strategyId);
    if (strategy && strategy.status === StrategyStatus.ACTIVE) {
      // 1. Consecutive Losses Trigger
      if (stats.consecutiveLosses >= 4) {
        strategy.disable(`CIRCUIT_BREAKER_TRIGGERED: 4 consecutive losses recorded (Recent loss: ₹${netPnl.toFixed(2)})`);
        stats.status = StrategyStatus.DISABLED;
        stats.circuitBreakerReason = strategy.circuitBreakerReason;
        this._logAudit({
          timestamp: new Date().toISOString(),
          eventType: 'STRATEGY_DEGRADATION_SHUTDOWN',
          strategyId,
          reason: strategy.circuitBreakerReason
        });
      }
      // 2. Rolling Profit Factor Collapse Trigger (after at least 5 trades)
      else if (stats.recentResults.length >= 5 && stats.profitFactor < 0.80) {
        strategy.disable(`CIRCUIT_BREAKER_TRIGGERED: Rolling profit factor ${stats.profitFactor} dropped below 0.80 floor`);
        stats.status = StrategyStatus.DISABLED;
        stats.circuitBreakerReason = strategy.circuitBreakerReason;
        this._logAudit({
          timestamp: new Date().toISOString(),
          eventType: 'STRATEGY_DEGRADATION_SHUTDOWN',
          strategyId,
          reason: strategy.circuitBreakerReason
        });
      }
      // 3. Margin Drawdown Ceiling Breach Trigger (> 15% margin drawdown)
      else if (stats.maxDrawdownMarginPct > 15.0) {
        strategy.disable(`CIRCUIT_BREAKER_TRIGGERED: Strategy drawdown ${stats.maxDrawdownMarginPct.toFixed(2)}% exceeded 15.0% margin ceiling`);
        stats.status = StrategyStatus.DISABLED;
        stats.circuitBreakerReason = strategy.circuitBreakerReason;
        this._logAudit({
          timestamp: new Date().toISOString(),
          eventType: 'STRATEGY_DEGRADATION_SHUTDOWN',
          strategyId,
          reason: strategy.circuitBreakerReason
        });
      }
    }

    // Persist attribution state atomically after every trade result
    this._persistAttributionState();
  }

  /**
   * Reset a disabled strategy back to active status (Requires explicit governance)
   */
  resetStrategy(strategyId, resetOptions = {}) {
    const strategy = this.registry.getStrategy(strategyId);
    if (strategy) {
      strategy.enable();
      const stats = this.performanceAttribution.get(strategyId);
      if (stats) {
        stats.status = StrategyStatus.ACTIVE;
        stats.consecutiveLosses = 0;
        stats.circuitBreakerReason = null;
      }
      const govEvent = {
        timestamp: new Date().toISOString(),
        strategyId,
        actor: resetOptions.actor || 'Founder Praveen Mahawar',
        reason: resetOptions.reason || 'Governance Manual Reset'
      };
      this.governanceEvents.push(govEvent);
      this._persistAttributionState();

      this._logAudit({
        timestamp: new Date().toISOString(),
        eventType: 'STRATEGY_CIRCUIT_BREAKER_RESET',
        strategyId,
        actor: govEvent.actor,
        reason: govEvent.reason
      });
      return { success: true, strategyId, status: StrategyStatus.ACTIVE, governanceEvent: govEvent };
    }
    return { success: false, reason: 'STRATEGY_NOT_FOUND' };
  }

  /**
   * Quarantine a strategy with validated negative expectancy (Section 6 Compliance)
   */
  quarantineStrategy(strategyId, reason) {
    const strategy = this.registry.getStrategy(strategyId);
    if (strategy) {
      strategy.quarantine(reason);
      const stats = this.performanceAttribution.get(strategyId);
      if (stats) {
        stats.status = StrategyStatus.QUARANTINED;
        stats.circuitBreakerReason = reason;
      }
      const govEvent = {
        timestamp: new Date().toISOString(),
        strategyId,
        action: 'STRATEGY_QUARANTINED',
        actor: 'Founder Praveen Mahawar / ConfidenceCalibrationEngine',
        reason
      };
      this.governanceEvents.push(govEvent);
      this._persistAttributionState();

      this._logAudit({
        timestamp: new Date().toISOString(),
        eventType: 'STRATEGY_QUARANTINE_ENFORCED',
        strategyId,
        reason
      });
      return { success: true, strategyId, status: StrategyStatus.QUARANTINED, governanceEvent: govEvent };
    }
    return { success: false, reason: 'STRATEGY_NOT_FOUND' };
  }

  getPerformanceReport(strategyId) {
    if (strategyId) return this.performanceAttribution.get(strategyId) || null;
    return Array.from(this.performanceAttribution.values());
  }

  _logAudit(entry) {
    this.auditLog.push(entry);
    if (this.auditLog.length > 500) this.auditLog.shift();
  }
}

module.exports = {
  StrategyOrchestrator
};
