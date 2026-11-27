/**
 * 🦅 GARUDA ALPHA-QUANT: DETERMINISTIC STRATEGY REGISTRY
 * Mission AQ-001 — Phase 3 Strategy Engine & Dynamic Adaptation
 * 
 * Provides discrete, deterministic trading strategy models:
 * 1. TREND_MOMENTUM_ALPHA: Captures persistent multi-hour trends aligned with SuperTrend & ADX
 * 2. MEAN_REVERSION_ELIXIR: Exploits statistical extremes at Bollinger boundaries
 * 3. BREAKOUT_VOLATILITY_HARVESTER: Capitalizes on high-momentum volatility expansions
 * 4. CHOP_CAPITAL_PRESERVATION_SHIELD: Zero-trade capital defense when ADX < 22
 */

const { MarketRegime } = require('./marketRegimeClassifier');

const StrategyStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  DEGRADED: 'DEGRADED',
  DISABLED: 'DISABLED',
  QUARANTINED: 'QUARANTINED'
});

class BaseStrategy {
  constructor(id, name, allowedRegimes, minScore = 78) {
    this.id = id;
    this.name = name;
    this.allowedRegimes = allowedRegimes;
    this.minScore = minScore;
    this.status = StrategyStatus.ACTIVE;
    this.circuitBreakerReason = null;
    this.disabledAt = null;
    this.quarantinedAt = null;
  }

  isRegimeAllowed(regime) {
    return this.allowedRegimes.includes(regime);
  }

  disable(reason) {
    this.status = StrategyStatus.DISABLED;
    this.circuitBreakerReason = reason;
    this.disabledAt = new Date().toISOString();
  }

  quarantine(reason) {
    this.status = StrategyStatus.QUARANTINED;
    this.circuitBreakerReason = reason;
    this.quarantinedAt = new Date().toISOString();
  }

  enable() {
    this.status = StrategyStatus.ACTIVE;
    this.circuitBreakerReason = null;
    this.disabledAt = null;
    this.quarantinedAt = null;
  }
}

/**
 * Strategy 1: Trend Momentum Alpha
 */
class TrendMomentumStrategy extends BaseStrategy {
  constructor(minScore = 78) {
    super('STRAT_TREND_MOMENTUM', 'Trend Momentum Alpha', [
      MarketRegime.TRENDING_BULLISH,
      MarketRegime.TRENDING_BEARISH
    ], minScore);
  }

  evaluate(signal, regimeContext) {
    if (this.status === StrategyStatus.DISABLED) {
      return {
        shouldTrade: false,
        strategyId: this.id,
        vetoReason: `Strategy is DISABLED by circuit breaker: ${this.circuitBreakerReason}`
      };
    }

    if (!this.isRegimeAllowed(regimeContext.regime)) {
      return {
        shouldTrade: false,
        strategyId: this.id,
        vetoReason: `Regime ${regimeContext.regime} not supported by Trend Momentum Strategy`
      };
    }

    const direction = regimeContext.regime === MarketRegime.TRENDING_BULLISH ? 'BULLISH' : 'BEARISH';
    const action = direction === 'BULLISH' ? 'BUY' : 'SELL';
    const price = regimeContext.indicators.price;
    const atr = regimeContext.indicators.atr || (price * 0.01);

    // Stop Loss at 1.5x ATR
    const stopDistance = Number((atr * 1.5).toFixed(2));
    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(2))
      : Number((price + stopDistance).toFixed(2));

    // Adaptive T1 Profit Lock (Phase 3.4 Remediated):
    // For Bullish trades, take 50% profit at 1.0x ATR to eliminate pullback stopouts before 2.25x ATR
    const target1Distance = direction === 'BULLISH'
      ? Number((atr * 1.0).toFixed(2))
      : Number((stopDistance * 1.5).toFixed(2));

    const target1 = direction === 'BULLISH'
      ? Number((price + target1Distance).toFixed(2))
      : Number((price - target1Distance).toFixed(2));

    const target2 = direction === 'BULLISH'
      ? Number((price + (stopDistance * 3.0)).toFixed(2))
      : Number((price - (stopDistance * 3.0)).toFixed(2));

    return {
      shouldTrade: true,
      strategyId: this.id,
      strategyName: this.name,
      symbol: signal.symbol,
      symbolName: signal.symbolName || signal.symbol,
      action,
      direction,
      price,
      stopLoss,
      target1,
      target2,
      riskPerShare: stopDistance,
      regime: regimeContext.regime,
      score: signal.score || this.minScore,
      rationale: `Aligned with ${direction} regime, SuperTrend, and ADX ${regimeContext.adx.toFixed(1)}`
    };
  }
}

/**
 * Strategy 2: Mean Reversion Elixir (QUARANTINED)
 * Strictly quarantined under Section 3 & 6 Directives due to validated negative expectancy
 * (-₹10,529.54, 5.56% win rate, PF 0.17) caused by counter-trend fading of ADX >= 22 trends.
 */
class MeanReversionStrategy extends BaseStrategy {
  constructor(minScore = 78) {
    super('STRAT_MEAN_REVERSION', 'Mean Reversion Elixir', [
      MarketRegime.MEAN_REVERTING
    ], minScore);
    this.status = StrategyStatus.QUARANTINED;
    this.circuitBreakerReason = 'QUARANTINED: Validated negative expectancy (-₹10,529.54, 5.56% win rate, PF 0.17) when fading ADX >= 22 trends. Section 6 Compliance.';
    this.quarantinedAt = new Date().toISOString();
  }

  evaluate(signal, regimeContext) {
    if (this.status === StrategyStatus.DISABLED || this.status === StrategyStatus.QUARANTINED) {
      return {
        shouldTrade: false,
        strategyId: this.id,
        vetoReason: `Strategy is ${this.status}: ${this.circuitBreakerReason}`
      };
    }

    if (!this.isRegimeAllowed(regimeContext.regime)) {
      return {
        shouldTrade: false,
        strategyId: this.id,
        vetoReason: `Regime ${regimeContext.regime} not supported by Mean Reversion Strategy`
      };
    }

    const bb = regimeContext.indicators.bollinger;
    const price = regimeContext.indicators.price;
    const rsi = regimeContext.indicators.rsi;
    const atr = regimeContext.indicators.atr || (price * 0.01);

    // If price <= lower band and RSI <= 30 -> BUY
    // If price >= upper band and RSI >= 70 -> SELL
    let action = 'BUY';
    let direction = 'BULLISH';
    if (price >= bb.upper || rsi >= 70) {
      action = 'SELL';
      direction = 'BEARISH';
    }

    const stopDistance = Number((atr * 1.0).toFixed(2));
    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(2))
      : Number((price + stopDistance).toFixed(2));

    // Target is reversion to the Bollinger Middle Band
    const target1 = bb.middle;
    const target2 = direction === 'BULLISH'
      ? Number((price + (stopDistance * 2.0)).toFixed(2))
      : Number((price - (stopDistance * 2.0)).toFixed(2));

    return {
      shouldTrade: true,
      strategyId: this.id,
      strategyName: this.name,
      symbol: signal.symbol,
      symbolName: signal.symbolName || signal.symbol,
      action,
      direction,
      price,
      stopLoss,
      target1,
      target2,
      riskPerShare: stopDistance,
      regime: regimeContext.regime,
      score: signal.score || this.minScore,
      rationale: `Statistical extreme: RSI ${rsi} and price at outer Bollinger band`
    };
  }
}

/**
 * Strategy 3: Breakout Volatility Harvester
 */
class BreakoutVolatilityStrategy extends BaseStrategy {
  constructor(minScore = 78) {
    super('STRAT_BREAKOUT_VOLATILITY', 'Breakout Volatility Harvester', [
      MarketRegime.VOLATILITY_EXPANSION
    ], minScore);
    this.nseStatus = StrategyStatus.QUARANTINED;
    this.nseQuarantineReason = 'Indian Equity Breakout Volatility quarantined: 4.0x ATR target buys into exhaustion; requires pre-breakout contraction squeeze filter. Section 6 Compliance.';
  }

  evaluate(signal, regimeContext) {
    if (this.status === StrategyStatus.DISABLED || this.status === StrategyStatus.QUARANTINED) {
      return {
        shouldTrade: false,
        strategyId: this.id,
        vetoReason: `Strategy is ${this.status}: ${this.circuitBreakerReason}`
      };
    }

    // Explicit NSE Equity Quarantine: Rejects proposals on Indian equities while allowing crypto/forex expansion
    const isNseSymbol = signal && signal.symbol && (signal.symbol.endsWith('.NS') || (!signal.symbol.includes('-USD') && !signal.symbol.includes('=X')));
    if (isNseSymbol && this.nseStatus === StrategyStatus.QUARANTINED) {
      return {
        shouldTrade: false,
        strategyId: this.id,
        vetoReason: `Strategy is QUARANTINED on Indian Equities: ${this.nseQuarantineReason}`
      };
    }

    if (!this.isRegimeAllowed(regimeContext.regime)) {
      return {
        shouldTrade: false,
        strategyId: this.id,
        vetoReason: `Regime ${regimeContext.regime} not supported by Breakout Strategy`
      };
    }

    const price = regimeContext.indicators.price;
    const atr = regimeContext.indicators.atr || (price * 0.01);
    const direction = regimeContext.superTrendDirection === 'BULLISH' ? 'BULLISH' : 'BEARISH';
    const action = direction === 'BULLISH' ? 'BUY' : 'SELL';

    // Stop Loss at 1.5x ATR (Calibrated down from 2.0x ATR)
    const stopDistance = Number((atr * 1.5).toFixed(2));
    const stopLoss = direction === 'BULLISH'
      ? Number((price - stopDistance).toFixed(2))
      : Number((price + stopDistance).toFixed(2));

    // Breakout Adaptive T1 Scale-Out (Phase 3.4 Remediated):
    // Lock in 50% profit at 1.0x stopDistance (1.5x ATR) instead of unattainable 4.0x ATR target
    const target1 = direction === 'BULLISH'
      ? Number((price + stopDistance).toFixed(2))
      : Number((price - stopDistance).toFixed(2));

    const target2 = direction === 'BULLISH'
      ? Number((price + (stopDistance * 2.5)).toFixed(2))
      : Number((price - (stopDistance * 2.5)).toFixed(2));

    return {
      shouldTrade: true,
      strategyId: this.id,
      strategyName: this.name,
      symbol: signal.symbol,
      symbolName: signal.symbolName || signal.symbol,
      action,
      direction,
      price,
      stopLoss,
      target1,
      target2,
      riskPerShare: stopDistance,
      regime: regimeContext.regime,
      score: signal.score || this.minScore,
      rationale: `Volatility expansion: ATR ratio ${regimeContext.indicators.atrRatio}x baseline`
    };
  }
}

/**
 * Strategy 4: Chop Capital Preservation Shield
 */
class ChopShieldStrategy extends BaseStrategy {
  constructor() {
    super('STRAT_CHOP_SHIELD', 'Chop Capital Preservation Shield', [
      MarketRegime.CHOP_SIDEWAYS,
      MarketRegime.WARMING_UP
    ], 0);
  }

  evaluate(signal, regimeContext) {
    return {
      shouldTrade: false,
      strategyId: this.id,
      strategyName: this.name,
      regime: regimeContext.regime,
      vetoReason: 'CHOP_SHIELD_ACTIVE: ADX < 22 or warming up. Capital strictly quarantined to prevent transaction fee churn.'
    };
  }
}

class StrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this.register(new TrendMomentumStrategy());
    this.register(new MeanReversionStrategy());
    this.register(new BreakoutVolatilityStrategy());
    this.register(new ChopShieldStrategy());
  }

  register(strategy) {
    this.strategies.set(strategy.id, strategy);
  }

  getStrategy(id) {
    return this.strategies.get(id);
  }

  getStrategyForRegime(regime) {
    for (const strategy of this.strategies.values()) {
      if (strategy.isRegimeAllowed(regime)) {
        return strategy;
      }
    }
    // Default fallback to Chop Shield for unknown/unsupported regimes
    return this.strategies.get('STRAT_CHOP_SHIELD');
  }

  getAllStrategies() {
    return Array.from(this.strategies.values());
  }
}

module.exports = {
  StrategyRegistry,
  StrategyStatus,
  TrendMomentumStrategy,
  MeanReversionStrategy,
  BreakoutVolatilityStrategy,
  ChopShieldStrategy
};
