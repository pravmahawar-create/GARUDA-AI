/**
 * GARUDA Social Engine - Master Orchestrator
 * Principle: Worker isolation. LinkedIn failure does not terminate Facebook or Instagram.
 * Exponential backoff with jitter, graceful shutdown, Telegram alerts.
 */

const { WorkerStateMachine, WORKER_STATES } = require('./stateMachine');
const HealthMonitor = require('./healthMonitor');
const RateLimiter = require('./rateLimiter');
const SessionManager = require('../browser/sessionManager');
const TelegramAlertService = require('../notifications/telegramAlertService');
const StateStore = require('../persistence/stateStore');
const LeadDeduplication = require('../leads/leadDeduplication');
const OutreachQueue = require('../outreach/outreachQueue');

class GarudaSocialOrchestrator {
  constructor(config = {}) {
    this.config = config;
    this.stateStore = new StateStore();
    this.rateLimiter = new RateLimiter();
    this.telegram = new TelegramAlertService();
    this.deduplication = new LeadDeduplication();
    this.outreachQueue = new OutreachQueue();

    this.workers = new Map(); // platform -> { stateMachine, healthMonitor, sessionManager, backoffAttempts, timer }
    this.isShuttingDown = false;

    this._setupProcessHandlers();
  }

  registerPlatform(platform, AdapterClass, adapterOptions = {}) {
    const stateMachine = new WorkerStateMachine(platform, (t) => {
      console.log(`[Worker:${platform}] Transition: ${t.from} -> ${t.to} (${t.reason})`);
    });

    const healthMonitor = new HealthMonitor(platform);
    const sessionManager = new SessionManager(platform, adapterOptions);

    this.workers.set(platform, {
      platform,
      AdapterClass,
      adapterOptions,
      stateMachine,
      healthMonitor,
      sessionManager,
      adapter: null,
      backoffAttempts: 0,
      timer: null
    });
  }

  _calculateBackoff(attempts) {
    const baseDelay = 1000;
    const maxDelay = 60000;
    const exp = Math.min(maxDelay, baseDelay * Math.pow(2, attempts));
    const jitter = Math.floor(Math.random() * 2000);
    return Math.min(maxDelay, exp + jitter);
  }

  async startWorker(platform) {
    const worker = this.workers.get(platform);
    if (!worker || this.isShuttingDown) return;

    try {
      worker.stateMachine.transition(WORKER_STATES.STARTING_BROWSER, 'Starting worker session');
      const sessionResult = await worker.sessionManager.initializeSession(worker.adapterOptions.cookies || []);

      if (!sessionResult.success) {
        if (sessionResult.code === 'PROFILE_LOCKED') {
          console.warn(`[Orchestrator:${platform}] Profile locked by another instance. Retrying with backoff.`);
          this._scheduleRestart(worker, 'PROFILE_LOCKED');
          return;
        }
        throw new Error(sessionResult.error || sessionResult.reason || 'Session launch failed');
      }

      worker.adapter = new worker.AdapterClass(worker.sessionManager, worker.healthMonitor);
      worker.stateMachine.transition(WORKER_STATES.AUTH_CHECK, 'Verifying platform credentials');

      const authResult = await worker.adapter.verifyAuthentication(sessionResult.page);
      if (!authResult.authenticated) {
        if (authResult.challenge) {
          worker.stateMachine.transition(WORKER_STATES.SECURITY_BLOCKED, `Challenge: ${authResult.challenge.type}`);
          this.stateStore.increment('securityBlocks');
          await this.telegram.sendAlert('SECURITY', `${platform.toUpperCase()} Security Challenge`, `Challenge detected: ${authResult.challenge.type}. Worker halted to protect account.`);
          await worker.sessionManager.closeSession();
          return; // Do NOT loop or retry on security challenge!
        }

        if (authResult.status === 'FAILED' && !authResult.retryable) {
          worker.stateMachine.transition(WORKER_STATES.FAILED, `Platform error: ${authResult.reason}`);
          this.stateStore.increment('authenticationFailures');
          await this.telegram.sendAlert('ERROR', `${platform.toUpperCase()} Auth Failed`, `Reason: ${authResult.reason}. Halting retries.`);
          await worker.sessionManager.closeSession();
          return;
        }

        worker.stateMachine.transition(WORKER_STATES.AUTH_EXPIRED, 'Session credentials required');
        this.stateStore.increment('authenticationFailures');
        await this.telegram.sendAlert('WARNING', `${platform.toUpperCase()} Login Required`, 'Session cookie expired. Update credentials.');
        await worker.sessionManager.closeSession();
        return;
      }

      worker.stateMachine.transition(WORKER_STATES.READY, 'Platform authenticated and ready');
      this.stateStore.increment('workersHealthy');
      worker.backoffAttempts = 0; // Reset backoff on stable state

      // Worker is ready for operational cycle
      console.log(`[Orchestrator] ✅ ${platform.toUpperCase()} Worker online and operational.`);
    } catch (err) {
      console.error(`[Orchestrator:${platform}] Worker error:`, err.message);
      this.stateStore.increment('workersFailed');
      worker.healthMonitor.recordError();
      await worker.sessionManager.closeSession();
      this._scheduleRestart(worker, err.message);
    }
  }

  _scheduleRestart(worker, reason) {
    if (this.isShuttingDown) return;

    worker.backoffAttempts++;
    const delay = this._calculateBackoff(worker.backoffAttempts);
    console.log(`[Orchestrator:${worker.platform}] Restarting in ${Math.round(delay / 1000)}s (Attempt #${worker.backoffAttempts}). Reason: ${reason}`);

    worker.timer = setTimeout(() => {
      this.startWorker(worker.platform);
    }, delay);
  }

  async startAll() {
    console.log('🦅 [GARUDA SOCIAL ENGINE] Starting registered platform workers...');
    for (const platform of this.workers.keys()) {
      this.startWorker(platform);
    }
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    console.log('\n🛑 [GARUDA SOCIAL ENGINE] Initiating graceful shutdown...');

    for (const [platform, worker] of this.workers.entries()) {
      if (worker.timer) clearTimeout(worker.timer);
      try {
        worker.stateMachine.transition(WORKER_STATES.STOPPING, 'Graceful shutdown signal');
        await worker.sessionManager.closeSession();
        worker.stateMachine.transition(WORKER_STATES.STOPPED, 'Session closed cleanly');
        console.log(`✔ [Orchestrator] ${platform} worker stopped cleanly.`);
      } catch (err) {
        console.error(`[Orchestrator] Error stopping ${platform}:`, err.message);
      }
    }
    console.log('🦅 [GARUDA SOCIAL ENGINE] Shutdown complete.');
  }

  _setupProcessHandlers() {
    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('uncaughtException', async (err) => {
      console.error('[FATAL UNCAUGHT EXCEPTION]:', err);
      await this.shutdown();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('[UNHANDLED REJECTION]:', reason);
    });
  }
}

module.exports = GarudaSocialOrchestrator;
