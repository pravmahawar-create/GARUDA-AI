/**
 * 🦅 GARUDA ALPHA-QUANT: MULTI-AGENT STRATEGY ANALYZER
 * Mission AQ-001 — Phase 3.4 Parallel Agent Expansion
 * 
 * Coordinates and cross-verifies strategy proposals across all 5 specialized trading agents:
 * 1. Alpha-India: NSE MIS Equities & F&O
 * 2. Alpha-Forex: 24/5 Global Currencies & Gold
 * 3. Alpha-Crypto: 24/7 Digital Assets & Funding Drag Management
 * 4. Alpha-Positional-Swing: CNC Multi-Day Delivery & Gap-Risk Governance
 * 5. Alpha-RiskSentinel: Shared Sovereign Portfolio-Level Risk Authority
 * 
 * Constitutional Guard:
 * All agents submit proposals to the MultiAgentStrategyAnalyzer;
 * All authorized proposals MUST pass through RiskSentinel. Zero bypass allowed.
 */

const { defaultRiskSentinel, RiskDecisionStatus } = require('../risk/alphaRiskSentinel');
const { MarketCoverageRegistry } = require('../marketCoverageRegistry');
const { ConfidenceCalibrationEngine } = require('../math/confidenceCalibrationEngine');
const { AlphaIndiaAgent } = require('../agents/alphaIndiaAgent');
const { AlphaForexAgent } = require('../agents/alphaForexAgent');
const { AlphaCryptoAgent } = require('../agents/alphaCryptoAgent');
const { AlphaPositionalSwingAgent } = require('../agents/alphaPositionalSwingAgent');

class MultiAgentStrategyAnalyzer {
  constructor(options = {}) {
    this.riskSentinel = options.riskSentinel || defaultRiskSentinel;
    this.marketRegistry = options.marketRegistry || new MarketCoverageRegistry();
    this.calibrationEngine = options.calibrationEngine || new ConfidenceCalibrationEngine();
    
    // Instantiate the 4 specialized trading agents
    this.agents = new Map([
      ['Alpha-India', new AlphaIndiaAgent({ calibrationEngine: this.calibrationEngine })],
      ['Alpha-Forex', new AlphaForexAgent({ calibrationEngine: this.calibrationEngine })],
      ['Alpha-Crypto', new AlphaCryptoAgent({ calibrationEngine: this.calibrationEngine })],
      ['Alpha-Positional-Swing', new AlphaPositionalSwingAgent({ calibrationEngine: this.calibrationEngine })]
    ]);

    this.registeredAgents = new Map([
      ['Alpha-India', { name: 'Alpha-India (NSE MIS & Derivatives)', assetClass: 'INDIAN_EQUITY_MIS', active: true }],
      ['Alpha-Forex', { name: 'Alpha-Forex (24/5 Global FX & Gold)', assetClass: 'FOREX', active: true }],
      ['Alpha-Crypto', { name: 'Alpha-Crypto (24/7 Binance Spot & Perps)', assetClass: 'CRYPTO', active: true }],
      ['Alpha-Positional-Swing', { name: 'Alpha-Positional-Swing (CNC Delivery)', assetClass: 'INDIAN_EQUITY_CNC', active: true }],
      ['Alpha-RiskSentinel', { name: 'Alpha-RiskSentinel (Shared Portfolio Authority)', assetClass: 'ALL_ASSETS', active: true }]
    ]);

    this.proposalHistory = [];
  }

  /**
   * Get an instantiated agent instance
   * @param {string} agentId e.g. 'Alpha-India'
   * @returns {Object|null}
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }

  /**
   * Evaluate a multi-agent strategy proposal with MarketCoverage and RiskSentinel validation
   * @param {string} agentId Identifier of proposing agent
   * @param {string} accountId Client / virtual account ID
   * @param {Object} proposal Proposed trade setup
   * @param {Object} marketContext Live tick and regime metrics
   * @returns {Object} Deterministic decision
   */
  evaluateAgentProposal(agentId, accountId, proposal, marketContext = {}) {
    const timestamp = new Date().toISOString();
    const agentConfig = this.registeredAgents.get(agentId);

    if (!agentConfig) {
      return {
        status: 'REJECTED',
        code: 'UNREGISTERED_AGENT',
        reason: `Agent ${agentId} is not registered with MultiAgentStrategyAnalyzer`,
        timestamp
      };
    }

    if (!agentConfig.active) {
      return {
        status: 'REJECTED',
        code: 'AGENT_INACTIVE',
        reason: `Agent ${agentId} is currently deactivated`,
        timestamp
      };
    }

    // 1. Market Coverage Eligibility Gate (Section 5 Compliance)
    const marketCheck = this.marketRegistry.validateInstrumentEligibility(proposal.symbol);
    if (!marketCheck.isEligible) {
      return {
        agentId,
        agentName: agentConfig.name,
        status: 'REJECTED',
        code: marketCheck.code,
        reason: marketCheck.reason,
        timestamp
      };
    }

    // 2. Cross-asset confirmation alignment check
    let crossAssetBoost = 0;
    if (proposal.crossAssetSignal) {
      if (proposal.crossAssetSignal.isAligned) {
        crossAssetBoost = 2; // +2 confluence points for macro alignment
      }
    }

    const effectiveScore = Math.min(100, (proposal.score || 78) + crossAssetBoost);
    
    // 3. Confidence Calibration Gate (Section 6 Compliance)
    const calibration = this.calibrationEngine.calibrateScore(effectiveScore);
    if (!calibration.isQualified) {
      return {
        agentId,
        agentName: agentConfig.name,
        status: 'REJECTED',
        code: 'CONFIDENCE_CALIBRATION_BELOW_THRESHOLD',
        reason: calibration.qualificationReason,
        timestamp
      };
    }

    const preparedOrder = {
      orderId: proposal.orderId || `ORD-${agentId.toUpperCase()}-${Date.now()}`,
      symbol: proposal.symbol,
      symbolName: proposal.symbolName || proposal.symbol,
      action: proposal.action,
      direction: proposal.direction,
      price: proposal.price,
      stopLoss: proposal.stopLoss,
      target1: proposal.target1,
      target2: proposal.target2,
      requestedQuantity: proposal.requestedQuantity || 1,
      score: effectiveScore,
      calibratedProbability: calibration.calibratedProbability,
      agentId,
      assetClass: agentConfig.assetClass
    };

    // 4. MANDATORY SOVEREIGN GATE: Submit to RiskSentinel (Agent E)
    const sentinelDecision = this.riskSentinel.authorizeOrder(accountId, preparedOrder, marketContext);

    const result = {
      agentId,
      agentName: agentConfig.name,
      accountId,
      effectiveScore,
      calibratedProbability: calibration.calibratedProbability,
      sentinelDecision,
      isAuthorized: sentinelDecision.status === RiskDecisionStatus.AUTHORIZED,
      timestamp
    };

    this.proposalHistory.push(result);
    if (this.proposalHistory.length > 500) this.proposalHistory.shift();

    return result;
  }

  getAgentStatus(agentId) {
    return this.registeredAgents.get(agentId) || null;
  }

  /**
   * Autonomous pipeline: Route market candles to the specialized agent and submit to RiskSentinel
   */
  evaluateMarketCandles(accountId, symbol, candles, options = {}) {
    const timestamp = new Date().toISOString();
    let designatedAgentId = 'Alpha-India';
    if (symbol.includes('-USD') || symbol.includes('USDT')) {
      designatedAgentId = 'Alpha-Crypto';
    } else if (symbol.includes('=X') || symbol.includes('USD')) {
      designatedAgentId = 'Alpha-Forex';
    } else if (options.mode === 'SWING' || options.isDelivery === true) {
      designatedAgentId = 'Alpha-Positional-Swing';
    }

    const agentInstance = this.agents.get(designatedAgentId);
    if (!agentInstance) {
      return {
        executed: false,
        veto: true,
        code: 'AGENT_UNAVAILABLE',
        reason: `Specialized agent ${designatedAgentId} not available`,
        timestamp
      };
    }

    // Step 1: Agent evaluates setup using its market-specific rules
    const setup = agentInstance.evaluateSetup(symbol, candles, options);
    if (!setup.shouldTrade) {
      return {
        executed: false,
        veto: true,
        agentId: designatedAgentId,
        code: setup.code || 'STRATEGY_REFUSED',
        reason: setup.reason,
        timestamp
      };
    }

    // Step 2: Submit to RiskSentinel through evaluateAgentProposal
    const marketContext = {
      currentPrice: setup.price,
      timestamp: Date.now(),
      adxCanTrade: true
    };

    const proposalResult = this.evaluateAgentProposal(designatedAgentId, accountId, setup, marketContext);
    return {
      executed: proposalResult.isAuthorized,
      veto: !proposalResult.isAuthorized,
      agentId: designatedAgentId,
      setup,
      decision: proposalResult.sentinelDecision,
      timestamp
    };
  }

  listAgents() {
    return Array.from(this.registeredAgents.entries()).map(([id, cfg]) => ({ id, ...cfg }));
  }
}

module.exports = {
  MultiAgentStrategyAnalyzer
};
