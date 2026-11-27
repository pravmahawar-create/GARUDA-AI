/**
 * 🦅 GARUDA ALPHA-QUANT: MARKET COVERAGE & ASSET CLASS REGISTRY
 * Mission AQ-001 — Phase 3.4 Market Coverage Expansion & Verification
 * 
 * CORE GOVERNANCE LAW:
 * "Never classify an unsupported market as operational."
 * "Verify data licensing, availability, candle intervals, timestamps and instrument identity."
 * 
 * Defines distinct operational tiers:
 * 1. OPERATIONAL: Fully verified, live/paper executable with authorized data feed
 * 2. VALIDATED_RESEARCH: Ingested & tested on historical data; research/backtest only
 * 3. PENDING_LICENSING: Data specification known, but commercial broker feed uncertified
 * 4. UNSUPPORTED: Prohibited from trade generation or execution (e.g. illiquid penny stocks)
 */

const MarketTier = Object.freeze({
  OPERATIONAL: 'OPERATIONAL',
  VALIDATED_RESEARCH: 'VALIDATED_RESEARCH',
  PENDING_LICENSING: 'PENDING_LICENSING',
  UNSUPPORTED: 'UNSUPPORTED'
});

const DEFAULT_MARKET_UNIVERSES = [
  // ── 1. INDIAN EQUITIES & INDICES (NSE) ──
  {
    universeId: 'NSE_LARGE_CAP',
    name: 'NSE Nifty 50 & Liquid Large-Caps',
    tier: MarketTier.OPERATIONAL,
    currency: 'INR',
    exchange: 'NSE',
    supportedIntervals: ['1h', '1d', '15m'],
    sessionHours: { open: '09:15', close: '15:30', timezone: 'Asia/Kolkata' },
    licensingStatus: 'AUTHORIZED_PUBLIC_REST_V8',
    minimumLiquidityDailyTurnoverCr: 50,
    allowedInstruments: [
      'TCS.NS', 'INFY.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
      'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'LT.NS', 'TITAN.NS',
      'MARUTI.NS', 'BHARTIARTL.NS', 'BAJFINANCE.NS', 'SUNPHARMA.NS',
      'WIPRO.NS', 'NESTLEIND.NS', 'ITC.NS', 'ASIANPAINT.NS', 'HINDALCO.NS',
      'COALINDIA.NS', 'TATASTEEL.NS', 'JSWSTEEL.NS', 'ADANIPORTS.NS', 'POWERGRID.NS'
    ]
  },
  {
    universeId: 'NSE_INDICES_FNO',
    name: 'NSE Index Futures & Options (Nifty & BankNifty)',
    tier: MarketTier.VALIDATED_RESEARCH,
    currency: 'INR',
    exchange: 'NSE_FNO',
    supportedIntervals: ['1h', '15m', '5m'],
    sessionHours: { open: '09:15', close: '15:30', timezone: 'Asia/Kolkata' },
    licensingStatus: 'BROKER_API_DEPENDENT',
    allowedInstruments: ['NIFTY', 'BANKNIFTY', 'FINNIFTY']
  },

  // ── 2. GLOBAL CURRENCIES & GOLD (FOREX) ──
  {
    universeId: 'GLOBAL_FOREX_MAJORS',
    name: 'G10 Currency Pairs & Spot Gold',
    tier: MarketTier.OPERATIONAL,
    currency: 'USD',
    exchange: 'GLOBAL_FX',
    supportedIntervals: ['1h', '4h', '1d'],
    sessionHours: { open: '00:00', close: '24:00', timezone: 'UTC' }, // 24/5
    licensingStatus: 'AUTHORIZED_PUBLIC_REST_V8',
    allowedInstruments: [
      'EURUSD=X', 'EURUSD', 'EUR/USD',
      'GBPUSD=X', 'GBPUSD', 'GBP/USD',
      'USDINR=X', 'USDINR', 'USD/INR',
      'XAUUSD=X', 'XAUUSD', 'GOLD'
    ]
  },

  // ── 3. DIGITAL ASSETS (CRYPTO) ──
  {
    universeId: 'CRYPTO_LIQUID_MAJORS',
    name: 'High-Liquidity Digital Assets',
    tier: MarketTier.OPERATIONAL,
    currency: 'USDT',
    exchange: 'BINANCE_SPOT',
    supportedIntervals: ['1h', '4h', '1d', '15m'],
    sessionHours: { open: '00:00', close: '24:00', timezone: 'UTC' }, // 24/7
    licensingStatus: 'AUTHORIZED_PUBLIC_REST_V8',
    allowedInstruments: [
      'BTC-USD', 'BTCUSDT', 'BTC',
      'ETH-USD', 'ETHUSDT', 'ETH',
      'SOL-USD', 'SOLUSDT', 'SOL',
      'BNB-USD', 'BNBUSDT', 'BNB',
      'XRP-USD', 'XRPUSDT', 'XRP',
      'ADA-USD', 'ADAUSDT', 'ADA',
      'DOGE-USD', 'DOGEUSDT', 'DOGE'
    ]
  },

  // ── 4. GLOBAL EQUITIES (US / UK) ──
  {
    universeId: 'US_MEGA_TECH',
    name: 'US Mega-Cap Technology Equities',
    tier: MarketTier.VALIDATED_RESEARCH,
    currency: 'USD',
    exchange: 'NASDAQ_NYSE',
    supportedIntervals: ['1h', '1d'],
    sessionHours: { open: '09:30', close: '16:00', timezone: 'America/New_York' },
    licensingStatus: 'AUTHORIZED_PUBLIC_REST_V8',
    allowedInstruments: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA']
  },

  // ── 5. COMMODITIES (MCX / COMEX) ──
  {
    universeId: 'MCX_COMMODITIES',
    name: 'MCX Energy & Metals (Crude, Silver, Copper)',
    tier: MarketTier.PENDING_LICENSING,
    currency: 'INR',
    exchange: 'MCX',
    supportedIntervals: ['1h', '1d'],
    licensingStatus: 'PENDING_COMMERCIAL_BROKER_FEED',
    allowedInstruments: ['CRUDEOIL', 'SILVER', 'COPPER', 'NATURALGAS']
  },

  // ── 6. SMALL-CAP & PENNY STOCKS (PROHIBITED) ──
  {
    universeId: 'PENNY_AND_ILLIQUID_STOCKS',
    name: 'Low-Volume Small-Caps, SME & Penny Stocks',
    tier: MarketTier.UNSUPPORTED,
    currency: 'INR',
    exchange: 'BSE_SME_NSE_EMERGE',
    licensingStatus: 'STRICTLY_PROHIBITED',
    prohibitionReason: 'Illiquid order books, manipulation risk, and high impact slippage violate Capital Safety Law',
    allowedInstruments: []
  }
];

class MarketCoverageRegistry {
  constructor(universes = DEFAULT_MARKET_UNIVERSES) {
    this.universes = new Map();
    this.instrumentToUniverse = new Map();

    for (const u of universes) {
      this.universes.set(u.universeId, u);
      if (Array.isArray(u.allowedInstruments)) {
        for (const sym of u.allowedInstruments) {
          this.instrumentToUniverse.set(sym, u.universeId);
        }
      }
    }
  }

  /**
   * Verify whether a given ticker instrument is operational and eligible for trade generation
   * @param {string} symbol e.g. 'TCS.NS', 'EURUSD=X', 'BTC-USD'
   * @returns {Object} Validation outcome
   */
  validateInstrumentEligibility(symbol, options = {}) {
    if (!symbol || typeof symbol !== 'string') {
      return {
        isEligible: false,
        tier: MarketTier.UNSUPPORTED,
        code: 'INVALID_SYMBOL',
        reason: 'Missing or malformed ticker symbol'
      };
    }

    const universeId = this.instrumentToUniverse.get(symbol);
    if (!universeId) {
      // Unmapped symbol defaults to UNSUPPORTED
      return {
        isEligible: false,
        tier: MarketTier.UNSUPPORTED,
        symbol,
        code: 'MARKET_UNSUPPORTED',
        reason: `Symbol ${symbol} does not belong to any authorized market universe. Never classify unverified markets as operational.`
      };
    }

    const universe = this.universes.get(universeId);
    if (!universe) {
      return {
        isEligible: false,
        tier: MarketTier.UNSUPPORTED,
        symbol,
        code: 'UNIVERSE_NOT_FOUND',
        reason: `Universe ${universeId} metadata missing`
      };
    }

    if (universe.tier === MarketTier.UNSUPPORTED) {
      return {
        isEligible: false,
        tier: universe.tier,
        symbol,
        code: 'PROHIBITED_MARKET',
        reason: universe.prohibitionReason || `Market ${universe.name} is classified as UNSUPPORTED`
      };
    }

    if (universe.tier === MarketTier.PENDING_LICENSING) {
      return {
        isEligible: false,
        tier: universe.tier,
        symbol,
        code: 'PENDING_LICENSING',
        reason: `Market ${universe.name} is awaiting authorized commercial data licensing. Live/paper orders blocked.`
      };
    }

    if (universe.tier === MarketTier.VALIDATED_RESEARCH && options.allowResearch !== true) {
      return {
        isEligible: false,
        tier: universe.tier,
        symbol,
        code: 'RESEARCH_ONLY_MARKET',
        reason: `Market ${universe.name} is classified as VALIDATED_RESEARCH. Live execution is prohibited until authorized licensing.`
      };
    }

    // OPERATIONAL or VALIDATED_RESEARCH
    return {
      isEligible: true,
      tier: universe.tier,
      symbol,
      universeId: universe.universeId,
      universeName: universe.name,
      currency: universe.currency,
      exchange: universe.exchange,
      sessionHours: universe.sessionHours,
      supportedIntervals: universe.supportedIntervals
    };
  }

  getUniverse(universeId) {
    return this.universes.get(universeId) || null;
  }

  listUniverses() {
    return Array.from(this.universes.values());
  }
}

module.exports = {
  MarketTier,
  MarketCoverageRegistry,
  DEFAULT_MARKET_UNIVERSES
};
