/**
 * GARUDA Social Engine - Browser Health Monitor
 * Monitors browser responsiveness, navigation, memory, and worker health.
 */

class HealthMonitor {
  constructor(platform) {
    this.platform = platform;
    this.lastSuccessfulNavigation = null;
    this.lastHeartbeat = Date.now();
    this.authStatus = 'UNKNOWN';
    this.securityChallengeState = false;
    this.errorCount = 0;
  }

  recordHeartbeat() {
    this.lastHeartbeat = Date.now();
  }

  recordNavigation(url) {
    this.lastSuccessfulNavigation = {
      url,
      timestamp: new Date().toISOString()
    };
    this.recordHeartbeat();
  }

  setAuthStatus(status) {
    this.authStatus = status;
  }

  setSecurityChallenge(active) {
    this.securityChallengeState = Boolean(active);
  }

  recordError() {
    this.errorCount++;
  }

  async checkHealth(browser, page) {
    this.recordHeartbeat();
    let browserStatus = 'disconnected';
    let pageStatus = 'unavailable';

    if (browser && browser.isConnected()) {
      browserStatus = 'healthy';
    }

    if (page && !page.isClosed()) {
      try {
        const title = await Promise.race([
          page.title(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Page responsiveness timeout')), 4000))
        ]);
        if (typeof title === 'string') {
          pageStatus = 'healthy';
        }
      } catch (err) {
        pageStatus = `unresponsive (${err.message})`;
      }
    }

    const memoryUsage = process.memoryUsage();

    return {
      platform: this.platform,
      browser: browserStatus,
      page: pageStatus,
      authentication: this.authStatus,
      securityChallenge: this.securityChallengeState,
      lastSuccessfulNavigation: this.lastSuccessfulNavigation ? this.lastSuccessfulNavigation.url : null,
      lastHeartbeatAgeSeconds: Math.floor((Date.now() - this.lastHeartbeat) / 1000),
      memoryPressureMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      errorCount: this.errorCount,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = HealthMonitor;
