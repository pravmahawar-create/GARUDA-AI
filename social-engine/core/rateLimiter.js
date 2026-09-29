/**
 * GARUDA Social Engine - Rate Limiter
 * Principle: Enforce responsible, reliable operations with cooldowns, jitter, and daily ceilings.
 */

const DEFAULT_CONFIGS = {
  linkedin: { maxHourly: 5, maxDaily: 25, minIntervalMs: 60000, baseJitterMs: 15000 },
  facebook: { maxHourly: 6, maxDaily: 30, minIntervalMs: 45000, baseJitterMs: 12000 },
  instagram: { maxHourly: 4, maxDaily: 20, minIntervalMs: 90000, baseJitterMs: 20000 }
};

class RateLimiter {
  constructor(customConfigs = {}) {
    this.configs = { ...DEFAULT_CONFIGS, ...customConfigs };
    this.state = new Map(); // platform -> { actions: [timestamps], dailyDate: string, dailyCount: number }
  }

  _getState(platform) {
    const today = new Date().toISOString().slice(0, 10);
    if (!this.state.has(platform)) {
      this.state.set(platform, { actions: [], dailyDate: today, dailyCount: 0 });
    }
    const current = this.state.get(platform);
    if (current.dailyDate !== today) {
      current.dailyDate = today;
      current.dailyCount = 0;
      current.actions = [];
    }
    return current;
  }

  canExecute(platform) {
    const config = this.configs[platform] || { maxHourly: 5, maxDaily: 20, minIntervalMs: 60000, baseJitterMs: 10000 };
    const pState = this._getState(platform);

    if (pState.dailyCount >= config.maxDaily) {
      return { allowed: false, reason: 'DAILY_CEILING_REACHED', waitMs: 3600000 };
    }

    const now = Date.now();
    const oneHourAgo = now - 3600000;
    pState.actions = pState.actions.filter(t => t > oneHourAgo);

    if (pState.actions.length >= config.maxHourly) {
      const oldestInWindow = pState.actions[0];
      const waitMs = Math.max(0, 3600000 - (now - oldestInWindow));
      return { allowed: false, reason: 'HOURLY_CEILING_REACHED', waitMs };
    }

    if (pState.actions.length > 0) {
      const lastAction = pState.actions[pState.actions.length - 1];
      const elapsed = now - lastAction;
      if (elapsed < config.minIntervalMs) {
        return { allowed: false, reason: 'MIN_INTERVAL_COOLDOWN', waitMs: config.minIntervalMs - elapsed };
      }
    }

    return { allowed: true, reason: 'OK', waitMs: 0 };
  }

  recordExecution(platform) {
    const pState = this._getState(platform);
    const now = Date.now();
    pState.actions.push(now);
    pState.dailyCount++;
  }

  getJitter(platform) {
    const config = this.configs[platform] || { baseJitterMs: 10000 };
    const randomFraction = Math.random();
    return Math.floor(randomFraction * config.baseJitterMs);
  }
}

module.exports = RateLimiter;
