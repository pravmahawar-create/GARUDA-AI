/**
 * 🦅 GARUDA RADAR — REAL-TIME OUTREACH ENGAGEMENT & READ TRACKER
 * 
 * Features:
 * 1. Invisible 1x1 transparent GIF tracking pixel (/api/track/open)
 * 2. High-speed, non-cached delivery with zero tracking lag
 * 3. Immutable audit trail logging into data/email-opens-audit.jsonl
 * 4. Instant WhatsApp & Telegram escalation to Founder Praveen (+91 9098750362)
 * 5. Link click routing & engagement attribution (/api/track/click)
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 1x1 transparent GIF buffer (43 bytes)
const TRANSPARENT_1X1_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

const AUDIT_LOG_FILE = path.join(__dirname, '..', '..', 'data', 'email-opens-audit.jsonl');

function parseDevice(userAgent = '') {
  const ua = String(userAgent).toLowerCase();
  if (ua.includes('iphone')) return 'Apple iPhone';
  if (ua.includes('ipad')) return 'Apple iPad';
  if (ua.includes('android')) return 'Android Mobile';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac Desktop';
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('linux')) return 'Linux System';
  if (ua.includes('googleimageproxy')) return 'Gmail Image Proxy (Prefetch / Open)';
  return 'Desktop / Unknown Device';
}

async function alertFounderOnOpen(event) {
  const message = [
    '🚨 *GARUDA RADAR: EMAIL OPENED!*',
    `🏢 *Target*: ${event.targetId}`,
    `📧 *Email*: ${event.email || '(unknown)'}`,
    `📱 *Device*: ${event.device}`,
    `⏱ *Time*: ${new Date(event.openedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
    `🔗 *Open Scoping Room*: https://www.garudaos.in/chat?ref=${encodeURIComponent(event.targetId)}`
  ].join('\n');

  // Suppress external dispatches during test executions or test target IDs
  if (process.env.NODE_ENV === 'test' || String(event.targetId).includes('TEST')) {
    return;
  }

  // 1. WhatsApp Notification
  try {
    const { sendFounderWhatsAppAlert, isCloudConfigured } = require('../services/whatsappCloudService');
    if (isCloudConfigured && isCloudConfigured()) {
      await sendFounderWhatsAppAlert(message);
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // 2. Telegram Notification
  try {
    const telegram = require('../services/telegramBotService');
    if (telegram.isConfigured && telegram.isConfigured()) {
      await telegram.sendMessage(message);
    }
  } catch (err) {
    // Non-blocking fallback
  }
}

/**
 * GET /api/track/open
 * Invisible Tracking Pixel Endpoint
 */
router.get('/open', async (req, res) => {
  const targetId = String(req.query.id || req.query.ref || 'UNKNOWN').trim();
  const email = String(req.query.e || req.query.email || '').trim();
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const device = parseDevice(userAgent);

  const event = {
    targetId,
    email,
    ip,
    userAgent,
    device,
    openedAt: timestamp
  };

  // 1. Persist audit trail immediately
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG_FILE), { recursive: true });
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(event) + '\n', 'utf8');
  } catch (err) {
    console.error('[GARUDA RADAR] Error persisting open event:', err.message);
  }

  // 2. Trigger asynchronous founder escalation
  alertFounderOnOpen(event).catch(() => {});

  // 3. Return 1x1 transparent GIF with anti-caching headers
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': TRANSPARENT_1X1_GIF.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*'
  });
  return res.end(TRANSPARENT_1X1_GIF);
});

/**
 * GET /api/track/click
 * Link Click & Redirect Attribution Endpoint
 */
router.get('/click', async (req, res) => {
  const targetId = String(req.query.id || req.query.ref || 'UNKNOWN').trim();
  const email = String(req.query.e || req.query.email || '').trim();
  const dest = String(req.query.dest || `https://www.garudaos.in/chat?ref=${encodeURIComponent(targetId)}`).trim();

  const clickEvent = {
    action: 'LINK_CLICKED',
    targetId,
    email,
    dest,
    clickedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    userAgent: req.headers['user-agent'] || ''
  };

  // Persist click event
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG_FILE), { recursive: true });
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(clickEvent) + '\n', 'utf8');
  } catch (err) {}

  // Alert founder
  if (process.env.NODE_ENV === 'test' || String(targetId).includes('TEST')) {
    return res.redirect(302, dest);
  }

  const alertMsg = [
    '🔥 *GARUDA RADAR: CLIENT CLICKED LINK!*',
    `🏢 *Target*: ${targetId}`,
    `📧 *Email*: ${email}`,
    `🔗 *Destination*: ${dest}`,
    `⏱ *Time*: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`
  ].join('\n');

  try {
    const telegram = require('../services/telegramBotService');
    if (telegram.isConfigured && telegram.isConfigured()) {
      telegram.sendMessage(alertMsg).catch(() => {});
    }
  } catch (e) {}

  return res.redirect(302, dest);
});

module.exports = router;
