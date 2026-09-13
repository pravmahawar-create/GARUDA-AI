/**
 * 🦅 GARUDA Finance Universe: Quant Alpha Swarm API Routes
 * Mounted at /api/finance/quant
 * Belongs strictly to Universe #12 (Finance Universe)
 */

const express = require('express');
const router = express.Router();
const { GlobalQuantSwarm } = require('../services/alphaQuant/globalQuantSwarm');
const { AlphaQuantDaemon } = require('../services/alphaQuant/alphaQuantDaemon');

const globalSwarm = new GlobalQuantSwarm();

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

module.exports = router;
