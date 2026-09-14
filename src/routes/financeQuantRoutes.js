/**
 * 🦅 GARUDA Finance Universe: Quant Alpha Swarm API Routes
 * Mounted at /api/finance/quant
 * Belongs strictly to Universe #12 (Finance Universe)
 */

const express = require('express');
const router = express.Router();
const { GlobalQuantSwarm } = require('../services/alphaQuant/globalQuantSwarm');
const { AlphaQuantDaemon } = require('../services/alphaQuant/alphaQuantDaemon');
const { Global24x7QuantDaemon } = require('../services/alphaQuant/global24x7QuantDaemon');
const { AlphaPotentialAgent } = require('../services/alphaQuant/alphaPotentialAgent');
const authRouter = require('../../api/auth');

const globalSwarm = new GlobalQuantSwarm();
const daemon24x7 = new Global24x7QuantDaemon({ minConfidenceThreshold: 82 });
const potentialAgent = new AlphaPotentialAgent();

/**
 * Middleware: Delicate & Critical Controls strictly reserved for Founder Praveen
 * Accepts:
 * 1. Valid Founder session cookie (garuda_founder_session)
 * 2. x-founder-pin header or founderPin body matching Founder password
 */
async function requireFounderAccess(req, res, next) {
  // Check active founder session cookie
  if (authRouter.hasValidSession && authRouter.hasValidSession(req)) {
    return next();
  }

  // Check PIN/password in header or body
  const pin = req.headers['x-founder-pin'] || req.body?.founderPin;
  if (pin) {
    try {
      const matches = authRouter.passwordMatches ? await authRouter.passwordMatches(pin) : false;
      if (matches || (process.env.FOUNDER_ACCESS_PASSWORD && pin === process.env.FOUNDER_ACCESS_PASSWORD)) {
        return next();
      }
    } catch (e) {}
  }

  return res.status(403).json({
    success: false,
    error: 'SOVEREIGN_FOUNDER_REQUIRED',
    message: '🔒 Sovereign Founder Authentication Required. This delicate control is strictly reserved for Founder Praveen Mahawar.'
  });
}

let cachedOpportunities = null;
let lastOpportunitiesScan = 0;
let cachedMoonshots = null;
let lastMoonshotsScan = 0;

/**
 * GET /api/finance/quant/pulse
 * 24/7 Multi-Asset live pulse (India, Forex, Crypto)
 */
router.get('/pulse', async (req, res) => {
  try {
    const pulse = await globalSwarm.getLivePulse();
    res.json({ success: true, universe: 'U12: Finance Universe', ...pulse });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/finance/quant/dashboard
 * Master Sovereign Telemetry Cockpit for Founder Praveen
 */
router.get('/dashboard', async (req, res) => {
  try {
    const status = daemon24x7.getStatus();
    const activeMarkets = status.activeMarkets;

    // Cache potential opportunities for 60s for lightning-fast cockpit loading
    let opportunities = cachedOpportunities;
    if (!opportunities || Date.now() - lastOpportunitiesScan > 60000) {
      try {
        opportunities = await potentialAgent.scanPotentialOpportunities();
        cachedOpportunities = opportunities;
        lastOpportunitiesScan = Date.now();
      } catch (e) {
        opportunities = cachedOpportunities || [];
      }
    }

    // Cache Sub-Rupee & Penny Moonshots
    let moonshots = cachedMoonshots;
    if (!moonshots || Date.now() - lastMoonshotsScan > 60000) {
      try {
        moonshots = await potentialAgent.scanSubRupeeMoonshots();
        cachedMoonshots = moonshots;
        lastMoonshotsScan = Date.now();
      } catch (e) {
        moonshots = cachedMoonshots || [];
      }
    }

    const agents = [
      {
        id: 'alpha-india',
        name: 'Alpha-India',
        tagline: 'NSE Institutional Confluence Sniper',
        market: 'Indian Bluechip Equities (NSE)',
        status: activeMarkets.isIndiaOpen ? 'ACTIVE_SCANNING' : 'STANDBY_MARKET_CLOSED',
        badge: activeMarkets.isIndiaOpen ? 'LIVE' : 'MARKET CLOSED',
        operatingHours: 'Mon-Fri 09:15 - 15:30 IST',
        focusUniverse: 'Reliance, HDFC Bank, TCS, Infosys, ICICI, Axis, Kotak, SBI, L&T',
        confluenceThreshold: '≥82% Ultra-Confluence',
        currentSessionNote: activeMarkets.isIndiaOpen
          ? 'Actively tracking 5m tick orderflow on NSE Bluechips.'
          : 'NSE closed for the day. Order queue ready for Monday 09:15 AM opening bell.'
      },
      {
        id: 'alpha-forex',
        name: 'Alpha-Forex',
        tagline: '24/5 Currency & Commodity Sniper',
        market: 'Global Forex & Commodities (24/5)',
        status: activeMarkets.isForexOpen ? 'ACTIVE_SCANNING' : 'WEEKEND_PAUSED',
        badge: activeMarkets.isForexOpen ? 'LIVE' : 'WEEKEND PAUSED',
        operatingHours: 'Sun 21:00 UTC to Fri 21:00 UTC (24/5)',
        focusUniverse: 'EUR/USD, GBP/USD, USD/JPY, Gold (XAU/USD), Crude Oil',
        confluenceThreshold: '≥82% London/NY Breakout',
        currentSessionNote: activeMarkets.isForexOpen
          ? 'London & NY sessions active. Tracking Gold & major currency momentum.'
          : 'Global Forex markets closed for weekend. Auto-resumes Sunday 21:00 UTC.'
      },
      {
        id: 'alpha-crypto',
        name: 'Alpha-Crypto',
        tagline: '24/7/365 Micro-Confluence Quant',
        market: 'Crypto Spot & Momentum (24/7/365)',
        status: 'ACTIVE_24X7',
        badge: 'LIVE 24/7',
        operatingHours: 'Non-stop 24 Hours / 365 Days',
        focusUniverse: 'Bitcoin (BTC), Ethereum (ETH), Solana (SOL)',
        confluenceThreshold: '≥82% Momentum Confluence',
        currentSessionNote: 'Running continuous 5m tick candle sweeps across Binance orderbooks.'
      },
      {
        id: 'alpha-potential',
        name: 'Alpha-Potential',
        tagline: 'Deep Swing & Gem Intelligence Agent',
        market: 'High-Beta Crypto & Layer 1 Radar',
        status: 'ACTIVE_24X7',
        badge: 'ANALYZING',
        operatingHours: '24/7 Continuous Multi-Day Horizon Scanner',
        focusUniverse: 'Top 10 High-Growth Gems (ETH, BTC, SOL, NEAR, SUI, AVAX, BNB, ADA, DOGE, XRP)',
        confluenceThreshold: '4H Structure + EMA Alignment + Fibonacci Targets',
        currentSessionNote: 'Calculates exact Buy Zones, Holding Horizons, and ₹ Return on ₹10,000.'
      }
    ];

    res.json({
      success: true,
      universe: 'U12: Finance Universe',
      timestamp: new Date().toISOString(),
      daemon: status,
      agents,
      opportunities: opportunities || [],
      subRupeeMoonshots: moonshots || [],
      wallet: status.wallet,
      stats: status.stats,
      openPositions: status.openPositions,
      closedTrades: status.closedTrades,
      eventLog: status.eventLog,
      isEmergencyPaused: status.isEmergencyPaused
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/finance/quant/kill-switch
 * Founder Sovereign Kill Switch: Pause or Resume trading immediately
 * Delicate Control: Strictly guarded under Founder Praveen authorization
 */
router.post('/kill-switch', requireFounderAccess, (req, res) => {
  try {
    const { pause } = req.body;
    const isPaused = daemon24x7.setEmergencyPause(pause !== undefined ? pause : !daemon24x7.isEmergencyPaused);
    res.json({
      success: true,
      isEmergencyPaused: isPaused,
      message: isPaused
        ? '🛑 Sovereign Kill Switch ENGAGED. All 4 trading agents paused.'
        : '✅ Sovereign Kill Switch DISENGAGED. 24/7 Swarm resumed.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/finance/quant/potential
 * High-Potential Crypto Opportunities
 */
router.get('/potential', async (req, res) => {
  try {
    const force = req.query.fresh === 'true';
    if (force || !cachedOpportunities || Date.now() - lastOpportunitiesScan > 60000) {
      cachedOpportunities = await potentialAgent.scanPotentialOpportunities();
      lastOpportunitiesScan = Date.now();
    }
    res.json({ success: true, count: cachedOpportunities.length, opportunities: cachedOpportunities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/finance/quant/moonshots
 * 🚀 Sub-Rupee & Penny 100x Moonshot Radar (Cousin 22 Paise -> ₹18 model)
 */
router.get('/moonshots', async (req, res) => {
  try {
    const force = req.query.fresh === 'true';
    if (force || !cachedMoonshots || Date.now() - lastMoonshotsScan > 60000) {
      cachedMoonshots = await potentialAgent.scanSubRupeeMoonshots();
      lastMoonshotsScan = Date.now();
    }
    res.json({
      success: true,
      count: cachedMoonshots.length,
      benchmarkModel: 'Cousin Brother Model: 22 Paise (₹0.22) -> ₹18.00 (81.8x Gain)',
      moonshots: cachedMoonshots
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/finance/quant/ledger
 * Current virtual ledger & performance metrics
 */
router.get('/ledger', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const ledgerPath = path.join(__dirname, '..', '..', 'data', 'garuda-alpha-quant-ledger.json');
    if (fs.existsSync(ledgerPath)) {
      const data = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
      res.json({ success: true, ...data });
    } else {
      res.json({
        success: true,
        wallet: { initialCapital: 100000, cash: 100000, realizedPnl: 0 },
        statistics: { winRatePercent: 0, totalTrades: 0, netPnl: 0 }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/finance/quant/reset-ledger
 * Delicate Control: Strictly guarded under Founder Praveen authorization
 */
router.post('/reset-ledger', requireFounderAccess, (req, res) => {
  try {
    daemon24x7.paperEngine.resetLedger();
    daemon24x7.dailyTradesCount = 0;
    daemon24x7.isProfitLockedToday = false;
    daemon24x7.isLossLockedToday = false;
    daemon24x7.addLog('LEDGER_RESET', 'SOVEREIGN_COMMAND', 'Founder Praveen reset paper trading portfolio to initial ₹1,00,000.');
    res.json({ success: true, message: 'Portfolio ledger reset to initial ₹1,00,000' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/finance/quant/simulate
 * Run 5-day historical simulation
 */
router.post('/simulate', async (req, res) => {
  try {
    const daemon = new AlphaQuantDaemon({
      minConfidenceThreshold: 82,
      initialCapital: 100000
    });
    const result = await daemon.runHistoricalSimulation('5d');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/finance/quant/daemon-status
 */
router.get('/daemon-status', (req, res) => {
  try {
    const status = daemon24x7.getStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/finance/quant/daemon/cycle
 * Delicate Control: Strictly guarded under Founder Praveen authorization
 */
router.post('/daemon/cycle', requireFounderAccess, async (req, res) => {
  try {
    const result = await daemon24x7.runCycle();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

