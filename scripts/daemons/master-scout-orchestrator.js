/**
 * GARUDA MASTER SOCIAL SCOUT ORCHESTRATOR
 * 
 * SOVEREIGN DIRECTIVES:
 * 1. Single-Instance Protection: Enforces 1 active orchestrator via atomic PID lockfile.
 * 2. Graceful Shutdown & Stale Process Cleanup: Cleans up child scouts on exit/kill.
 * 3. Child Watchdog: Auto-restarts crashed child scouts after 15s delay.
 * 4. 100% Anti-Fabrication:
 *    - Runtime classified truthfully: "Local Background Daemon (Active while host machine is awake)"
 *    - WhatsApp clearly reported: "BLOCKED / UNCONFIGURED"
 *    - Alerts routed strictly to verified Telegram Bot (@Garudaos_AI_bot).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const telegram = require('../../src/services/telegramBotService');
const { acquireProcessLock } = require('./unified-lead-guard');

const LOG_FILE = path.join(__dirname, '..', '..', 'data', 'leads', 'master_scout_activity.log');
if (!fs.existsSync(path.dirname(LOG_FILE))) fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

function log(msg) {
  const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const line = `[${new Date().toISOString()} | IST: ${istTime}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

const SCOUTS = [
  { name: 'Facebook-Scout', script: path.join(__dirname, 'facebook-scout-daemon.js') },
  { name: 'LinkedIn-Scout', script: path.join(__dirname, 'linkedin-scout-daemon.js') },
  { name: 'Instagram-Scout', script: path.join(__dirname, 'instagram-scout-daemon.js') }
];

const activeChildren = new Map();
let isShuttingDown = false;

function spawnScout(scout) {
  if (isShuttingDown) return null;

  log(`🚀 Spawning ${scout.name}...`);
  const child = spawn('node', [scout.script], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  activeChildren.set(scout.name, child);

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const l of lines) {
      if (l.trim()) log(`[${scout.name}] ${l}`);
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const l of lines) {
      if (l.trim()) log(`[${scout.name}:ERR] ${l}`);
    }
  });

  child.on('exit', (code, signal) => {
    activeChildren.delete(scout.name);
    if (!isShuttingDown) {
      log(`⚠️ ${scout.name} exited with code ${code}, signal ${signal}. Watchdog auto-restart in 15 seconds...`);
      setTimeout(() => spawnScout(scout), 15000);
    }
  });

  return child;
}

function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log(`🛑 [ORCHESTRATOR] Received ${signal}. Initiating graceful shutdown of all child scouts...`);

  for (const [name, child] of activeChildren.entries()) {
    try {
      log(`   Terminating ${name} (PID ${child.pid})...`);
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        try {
          execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
        } catch {
          child.kill('SIGTERM');
        }
      } else {
        child.kill('SIGTERM');
      }
    } catch (e) {
      // Ignore
    }
  }

  log(`✔ [ORCHESTRATOR] All child scouts signaled. Orchestrator shutdown complete.`);
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

async function startOrchestrator() {
  // 1. Single-Instance Protection: Acquire atomic process lock
  const lock = acquireProcessLock('master_scout_orchestrator');
  if (!lock.acquired) {
    console.error(`🚨 [ORCHESTRATOR FATAL] Another Master Scout Orchestrator is ALREADY running under PID ${lock.existingPid}.`);
    console.error(`🔒 Aborting duplicate launch to prevent process contention and duplicate outreach.`);
    process.exit(1);
  }

  log('================================================================');
  log('🦅 GARUDA MASTER SOCIAL SCOUT ORCHESTRATOR INITIALIZED (HARDENED)');
  log('Runtime Mode: Local Background Daemon (Active while host machine is awake)');
  log('Fleet Composition: Facebook Scout (30m) + LinkedIn Scout (30m) + Instagram Scout (30m)');
  log('Policy: STRICT PRIVATE DMs ONLY | NO Public Comments | Cross-Platform Dedup Active');
  log('Escalation Status: Telegram = ACTIVE (@Garudaos_AI_bot) | WhatsApp = BLOCKED / UNCONFIGURED');
  log(`Master Process PID: ${process.pid}`);
  log('================================================================');

  // Notify Founder via Telegram
  try {
    await telegram.sendFounderAlert(
      '🦅 GARUDA MASTER SCOUTS DEPLOYED (HARDENED)',
      'Autonomous scout daemons initialized with strict Anti-Fabrication & Single-Instance controls:\n\n' +
      '• Facebook Scout: Strict Private Messenger DMs only (Buyer qualification)\n' +
      '• Instagram Scout: Strict Private Direct Messages only (@garudaos.ai)\n' +
      '• LinkedIn Scout: Strict InMail/Private Message mode (Auth status monitored)\n' +
      '• Zero Public Comments: Enforced globally across all scouts\n' +
      '• Cross-Platform Dedup: Active (FB ↔ IG ↔ LinkedIn unified ledger)\n\n' +
      'Status: Inbound inquiries trigger instant Telegram alerts. WhatsApp is unconfigured.'
    );
  } catch (e) {
    log(`Telegram alert notice: ${e.message}`);
  }

  // Spawn each scout
  for (const scout of SCOUTS) {
    spawnScout(scout);
  }
}

if (require.main === module) {
  startOrchestrator();
}

module.exports = { startOrchestrator, spawnScout };
