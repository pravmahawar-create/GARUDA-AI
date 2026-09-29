/**
 * GARUDA Social Engine - Session Manager
 * Orchestrates profile locking, browser lifecycle, page allocation, and graceful teardown.
 */

const StealthBrowserFactory = require('./stealthBrowserFactory');
const ProfileLockManager = require('./profileLockManager');

class SessionManager {
  constructor(platform, options = {}) {
    this.platform = platform;
    this.options = options;
    this.lockManager = new ProfileLockManager(options.baseSessionsDir);
    this.browser = null;
    this.page = null;
    this.sessionMode = null;
    this.isLocked = false;
  }

  async initializeSession(cookies = []) {
    // 1. Try CDP attach first if user configured it
    if (this.options.useCdp) {
      const cdpUrl = this.options.cdpUrl || 'http://127.0.0.1:9222';
      const cdpResult = await StealthBrowserFactory.connectToExistingBrowser(cdpUrl);
      if (cdpResult.success) {
        this.browser = cdpResult.browser;
        this.sessionMode = 'CDP';
        this.page = await this.browser.newPage();
        return { success: true, mode: 'CDP', page: this.page };
      }
    }

    // 2. Fall back to isolated profile launch with lock
    const lockResult = this.lockManager.acquireLock(this.platform);
    if (!lockResult.acquired) {
      return { success: false, reason: lockResult.reason, code: 'PROFILE_LOCKED' };
    }
    this.isLocked = true;

    const launchResult = await StealthBrowserFactory.launchIsolatedBrowser(lockResult.profileDir, this.options);
    if (!launchResult.success) {
      this.lockManager.releaseLock(this.platform);
      this.isLocked = false;
      return { success: false, error: launchResult.error, code: 'LAUNCH_FAILED' };
    }

    this.browser = launchResult.browser;
    this.sessionMode = 'ISOLATED';
    this.page = await this.browser.newPage();

    // Hydrate cookies if provided
    if (Array.isArray(cookies) && cookies.length > 0) {
      try {
        await this.page.setCookie(...cookies);
      } catch (err) {
        console.warn(`[SessionManager:${this.platform}] Warning setting cookies: ${err.message}`);
      }
    }

    return { success: true, mode: 'ISOLATED', page: this.page };
  }

  async closeSession() {
    if (this.page && !this.page.isClosed()) {
      try { await this.page.close(); } catch (_) {}
      this.page = null;
    }

    if (this.browser) {
      try {
        if (this.sessionMode === 'CDP') {
          await this.browser.disconnect();
        } else {
          await this.browser.close();
        }
      } catch (_) {}
      this.browser = null;
    }

    if (this.isLocked) {
      this.lockManager.releaseLock(this.platform);
      this.isLocked = false;
    }
  }
}

module.exports = SessionManager;
