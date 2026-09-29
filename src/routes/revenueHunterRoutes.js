/**
 * GARUDA Autonomous Revenue Hunter API Routes
 * Provides Founder Control, Telemetry, Autonomy Modes, and Opportunity Endpoints.
 * Cloud-First, fully authenticated for Founder Praveen governance.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const AutonomousRevenueHunter = require('../../social-engine/autonomousRevenueHunter');
const OutreachPolicyEngine = require('../../social-engine/outreach/policyEngine');
const OutreachQueue = require('../../social-engine/outreach/outreachQueue');
const LeadDeduplication = require('../../social-engine/leads/leadDeduplication');
const { isMongoConnected } = require('../database/db');

// Singleton instances
const hunterInstance = new AutonomousRevenueHunter();
const queue = new OutreachQueue();
const dedup = new LeadDeduplication();

/**
 * GET /api/revenue-hunter/status
 * Clean operational observability telemetry for Founder Dashboard
 */
router.get('/status', (req, res) => {
  try {
    const telemetry = hunterInstance.getTelemetry();
    res.json({
      success: true,
      data: {
        ...telemetry,
        mongoConnected: isMongoConnected(),
        environment: process.env.NODE_ENV || 'production'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/revenue-hunter/mode
 * Change Autonomy Mode: SAFE_AUTONOMOUS | APPROVAL_REQUIRED | STOPPED
 */
router.post('/mode', (req, res) => {
  try {
    const { mode, actor, reason } = req.body;
    if (!mode) {
      return res.status(400).json({ success: false, error: 'mode is required (SAFE_AUTONOMOUS, APPROVAL_REQUIRED, STOPPED)' });
    }
    const result = OutreachPolicyEngine.setAutonomyMode(mode, actor || 'founder_praveen', reason || 'Founder API update');
    res.json({
      success: true,
      message: `Autonomy Mode updated to: ${result.mode}`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/revenue-hunter/kill-switch
 * Emergency stop / engage Founder Kill Switch
 */
router.post('/kill-switch', (req, res) => {
  try {
    const { active, reason } = req.body;
    const actor = req.body.actor || 'founder_praveen';
    const payload = OutreachPolicyEngine.setKillSwitch(Boolean(active), actor, reason || 'API trigger');
    res.json({
      success: true,
      message: `Global Kill Switch ${active ? 'ENGAGED (HALT ALL OUTREACH)' : 'DISENGAGED'}`,
      data: payload
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/revenue-hunter/opportunities
 * Fetch high-intent commercial opportunities (HOT_OPPORTUNITY)
 */
router.get('/opportunities', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const Opportunity = require('../models/Opportunity');
      const opps = await Opportunity.find({}).sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, count: opps.length, source: 'mongodb', data: opps });
    }

    const oppFile = path.join(__dirname, '..', '..', 'data', 'leads', 'hot_opportunities.json');
    if (fs.existsSync(oppFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(oppFile, 'utf8'));
        return res.json({ success: true, count: data.length, source: 'local_file', data });
      } catch (_) {}
    }
    res.json({ success: true, count: 0, source: 'none', data: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/revenue-hunter/activity
 * View recent hunter activity and diagnostic logs
 */
router.get('/activity', (req, res) => {
  try {
    const logFile = path.join(__dirname, '..', '..', 'logs', 'social-engine.log');
    if (fs.existsSync(logFile)) {
      const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
      const recent = lines.slice(-100);
      return res.json({ success: true, count: recent.length, lines: recent });
    }
    res.json({ success: true, count: 0, lines: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/revenue-hunter/queue
 * Get pending and approved outreach records
 */
router.get('/queue', (req, res) => {
  try {
    const filter = req.query.status || 'pending';
    let items = [];
    if (filter === 'pending') {
      items = queue.getPendingApproval();
    } else if (filter === 'approved') {
      items = queue.getFounderApproved();
    } else {
      items = queue.queue;
    }
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/revenue-hunter/founder-approve
 * Explicit Founder Approval for queued outreach
 */
router.post('/founder-approve', (req, res) => {
  try {
    const { queueId, actor } = req.body;
    if (!queueId) {
      return res.status(400).json({ success: false, error: 'queueId is required' });
    }
    const approvalRes = queue.approve(queueId, actor || 'founder_praveen');
    if (!approvalRes.success) {
      return res.status(400).json(approvalRes);
    }
    res.json({
      success: true,
      message: `Outreach approved for ${approvalRes.item.lead?.name}`,
      data: approvalRes.item
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/revenue-hunter/founder-reject
 * Reject outreach draft
 */
router.post('/founder-reject', (req, res) => {
  try {
    const { queueId, reason } = req.body;
    if (!queueId) {
      return res.status(400).json({ success: false, error: 'queueId is required' });
    }
    const rejRes = queue.reject(queueId, reason || 'REJECTED_BY_FOUNDER');
    res.json(rejRes);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/revenue-hunter/run-cycle
 * Trigger on-demand cycle (dryRun: true/false)
 */
router.post('/run-cycle', async (req, res) => {
  try {
    const dryRun = req.body.dryRun !== false; // default true for safety
    const result = await hunterInstance.runCycle({ dryRun });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/revenue-hunter/leads
 * Pull discovered and qualified leads
 */
router.get('/leads', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const SocialRevenueLead = require('../models/SocialRevenueLead');
      const leads = await SocialRevenueLead.find({}).sort({ discoveredAt: -1 }).limit(50);
      return res.json({ success: true, count: leads.length, source: 'mongodb', data: leads });
    }

    const leadsFile = path.join(__dirname, '..', '..', 'data', 'leads', 'social_leads.jsonl');
    if (!fs.existsSync(leadsFile)) {
      return res.json({ success: true, count: 0, source: 'local_empty', data: [] });
    }
    const lines = fs.readFileSync(leadsFile, 'utf8').trim().split('\n').filter(Boolean);
    const leads = lines.slice(-50).map(l => {
      try { return JSON.parse(l); } catch (_) { return null; }
    }).filter(Boolean);
    res.json({ success: true, count: leads.length, source: 'local_file', data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
