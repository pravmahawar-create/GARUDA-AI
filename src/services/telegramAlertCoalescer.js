/**
 * GARUDA Telegram Alert Coalescer
 *
 * Prevents duplicate/repeated Telegram messages.
 * Groups similar alerts and sends them as one message.
 *
 * Problem: Multiple workers send Telegram alerts at the same time,
 * causing 5-10 duplicate messages for the same thing.
 *
 * Solution: Queue alerts, deduplicate, coalesce into one message.
 */

const telegramBotService = require("./telegramBotService");

// ──────────────────────────────────────────────────────────────────────────────
// 1. ALERT QUEUE — Batch alerts before sending
// ──────────────────────────────────────────────────────────────────────────────

const alertQueue = [];
let flushTimer = null;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds

// Track sent alerts to prevent duplicates
const sentAlerts = new Map(); // key -> { count, lastSent, firstSeen }
const DEDUP_WINDOW_MS = 300000; // 5 minutes

// ──────────────────────────────────────────────────────────────────────────────
// 2. COALESCE — Add alert to queue (deduplicated)
// ──────────────────────────────────────────────────────────────────────────────

function queueAlert(title, body, { priority = "normal", dedupeKey } = {}) {
  // Create deduplication key
  const key = dedupeKey || `${title}:${body.slice(0, 100)}`;

  // Check if same alert was sent recently
  const existing = sentAlerts.get(key);
  if (existing) {
    existing.count++;
    existing.lastSent = Date.now();

    // Only send update if count reaches threshold
    if (existing.count < 3) {
      console.log(`[AlertCoalescer] Deduped: ${title.slice(0, 50)} (${existing.count}x)`);
      return; // Skip this one
    }
    // After 3 duplicates, send one summary
    if (existing.count === 3) {
      body = `${body}\n\n[⚡ ye alert ${existing.count} baar aaya — sirf ek baar bhej rahe hain]`;
    }
    if (existing.count > 3 && existing.count % 10 !== 0) {
      return; // Throttle after 3
    }
  } else {
    sentAlerts.set(key, { count: 1, lastSent: Date.now(), firstSeen: Date.now() });
  }

  alertQueue.push({ title, body, priority, timestamp: Date.now() });

  // Start flush timer if not running
  if (!flushTimer) {
    flushTimer = setTimeout(flushAlerts, FLUSH_INTERVAL_MS);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. FLUSH — Send batched alerts
// ──────────────────────────────────────────────────────────────────────────────

async function flushAlerts() {
  if (alertQueue.length === 0) {
    flushTimer = null;
    return;
  }

  const alerts = alertQueue.splice(0, alertQueue.length);
  flushTimer = null;

  // Group by priority
  const high = alerts.filter(a => a.priority === "high");
  const normal = alerts.filter(a => a.priority === "normal");
  const low = alerts.filter(a => a.priority === "low");

  // Send high priority immediately
  for (const alert of high) {
    await telegramBotService.sendFounderAlert(alert.title, alert.body);
  }

  // Coalesce normal alerts into one message
  if (normal.length > 0) {
    if (normal.length === 1) {
      await telegramBotService.sendFounderAlert(normal[0].title, normal[0].body);
    } else {
      const combined = normal.map((a, i) => `**${i + 1}. ${a.title}**\n${a.body}`).join("\n\n---\n\n");
      await telegramBotService.sendFounderAlert(
        `📋 GARUDA Update (${normal.length} alerts)`,
        combined.slice(0, 4000)
      );
    }
  }

  // Low priority: batch and send less frequently
  if (low.length > 0) {
    const combined = low.map(a => `• ${a.title}: ${a.body.slice(0, 100)}`).join("\n");
    await telegramBotService.sendFounderAlert(
      `📊 GARUDA Status (${low.length} items)`,
      combined.slice(0, 4000)
    );
  }

  console.log(`[AlertCoalescer] Flushed ${alerts.length} alerts (H:${high.length} N:${normal.length} L:${low.length})`);
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. CLEANUP — Remove old dedup entries
// ──────────────────────────────────────────────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of sentAlerts.entries()) {
    if (now - data.lastSent > DEDUP_WINDOW_MS) {
      sentAlerts.delete(key);
    }
  }
}, 60000);

// ──────────────────────────────────────────────────────────────────────────────
// 5. DIRECT SEND — For urgent alerts (bypass queue)
// ──────────────────────────────────────────────────────────────────────────────

async function sendImmediate(title, body) {
  return telegramBotService.sendFounderAlert(title, body);
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. FLUSH NOW — Force flush (for shutdown)
// ──────────────────────────────────────────────────────────────────────────────

async function flushNow() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flushAlerts();
}

module.exports = {
  queueAlert,
  sendImmediate,
  flushNow,
  flushAlerts
};
