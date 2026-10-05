/**
 * GARUDA AUTONOMOUS REVENUE HUNTER - CLOUD 24/7 DAEMON
 * Runs on Render Cloud independently of Founder's laptop.
 * Survives laptop shutdown, network disconnects, and container restarts.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const AutonomousRevenueHunter = require('../../social-engine/autonomousRevenueHunter');
const TelegramAlertService = require('../../social-engine/notifications/telegramAlertService');
const { acquireProcessLock, isScoutFrozen } = require('./unified-lead-guard');

const LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'social-engine.log');
const INTERVAL_MINUTES = parseInt(process.env.GARUDA_HUNTER_INTERVAL_MINUTES || '60', 10);

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [CLOUD_HUNTER] ${msg}\n`;
  console.log(line.trim());
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (_) {}
}

async function startCloudHunter() {
  if (isScoutFrozen()) {
    log('🧊 Revenue Hunter FROZEN by Founder until further order. Exiting cleanly.');
    process.exit(0);
  }
  log('================================================================');
  log('ðŸ¦… GARUDA AUTONOMOUS REVENUE HUNTER DAEMON INITIALIZING');
  log('Runtime: Render Cloud (24/7 Independent of Laptop Power State)');
  log(`Cycle Frequency: Every ${INTERVAL_MINUTES} minutes`);
  log('Scope: 20+ Software Categories (Web, Apps, SaaS, MVPs, Automation, AI, APIs)');
  log('Policy: Human-Gated Approval | Global Kill Switch Supported');
  log('================================================================');

  // Single-instance protection
  const lock = acquireProcessLock('revenue_hunter_cloud_daemon');
  if (!lock.acquired) {
    log(`âš ï¸ Another Revenue Hunter daemon is already running under PID ${lock.existingPid}. Terminating duplicate.`);
    process.exit(0);
  }

  const hunter = new AutonomousRevenueHunter({
    cycleIntervalMs: INTERVAL_MINUTES * 60 * 1000
  });

  const telegram = new TelegramAlertService();

  // Send boot notification to Founder Telegram
  try {
    await telegram.sendAlert(
      'INFO',
      'ðŸ¦… Autonomous Revenue Hunter Live on Render Cloud',
      `Hunter running 24/7 in cloud.\nâ€¢ Multi-Scout: Active (Search, Conversation, Social)\nâ€¢ 20+ Categories: Websites, SaaS, MVPs, Mobile Apps, Automation, APIs\nâ€¢ Laptop Independence: 100% (Continues when laptop is closed)`
    );
  } catch (err) {
    log(`Telegram boot notice note: ${err.message}`);
  }

  // Initial immediate run after warm-up delay (10s)
  setTimeout(async () => {
    try {
      log('Executing initial warm-up hunter cycle...');
      const summary = await hunter.runCycle({ dryRun: false });
      log(`Initial cycle finished: ${summary.leadsDiscovered} discovered, ${summary.leadsQualified} qualified, ${summary.queuedForApproval} queued.`);

      // 🦅 Run High-Intent Problem Signal Scout on Cloud
      try {
        log('⚡ [SIGNAL_SCOUT] Running High-Intent Tech Problem Scout on Render Cloud...');
        const { runScout } = require('../radar/tech-problem-scout');
        await runScout({ notifyTelegram: true });
        log('✔ [SIGNAL_SCOUT] Scout completed and Telegram alert dispatched.');
      } catch (scoutErr) {
        log(`⚠ [SIGNAL_SCOUT] Scout cycle note: ${scoutErr.message}`);
      }

      log('Checking scheduled social content items on Render startup...');
      const ContentScheduler = require('../../social-engine/content/contentScheduler');
      const contentRes = await ContentScheduler.runSchedulerCycle({ dryRun: false });
      log(`Initial content cycle finished: ${contentRes.evaluated} evaluated, ${contentRes.published} published.`);
    } catch (e) {
      log(`Initial cycle error: ${e.message}`);
    }
  }, 10000);

  // Arm recurring schedule for Revenue Hunter & Signal Scout
  hunter.startScheduler(INTERVAL_MINUTES * 60 * 1000);

  // Recurring Problem Signal Scout (every 60 minutes)
  const scoutInterval = setInterval(async () => {
    try {
      log('⚡ [SIGNAL_SCOUT] Recurring High-Intent Tech Problem Scout running...');
      const { runScout } = require('../radar/tech-problem-scout');
      await runScout({ notifyTelegram: true });
      log('✔ [SIGNAL_SCOUT] Recurring scout completed.');
    } catch (scoutErr) {
      log(`⚠ [SIGNAL_SCOUT] Recurring scout error: ${scoutErr.message}`);
    }
  }, INTERVAL_MINUTES * 60 * 1000);

  // Arm recurring schedule for Content Scheduler (every 15 minutes)
  const contentInterval = setInterval(async () => {
    try {
      const ContentScheduler = require('../../social-engine/content/contentScheduler');
      const contentRes = await ContentScheduler.runSchedulerCycle({ dryRun: false });
      if (contentRes.evaluated > 0) {
        log(`[CONTENT_SCHEDULER] Evaluated ${contentRes.evaluated} posts: ${contentRes.published} published, ${contentRes.failed} failed.`);
      }
    } catch (err) {
      log(`[CONTENT_SCHEDULER] Recurring cycle error: ${err.message}`);
    }
  }, 15 * 60 * 1000);

  // Graceful shutdown handlers
  const shutdown = () => {
    log('🛑 Graceful shutdown signal received. Stopping cloud hunter, scouts & content schedulers...');
    clearInterval(scoutInterval);
    clearInterval(contentInterval);
    hunter.stopScheduler();
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  startCloudHunter().catch(err => {
    console.error('Fatal Revenue Hunter daemon error:', err);
    process.exit(1);
  });
}

module.exports = { startCloudHunter };
