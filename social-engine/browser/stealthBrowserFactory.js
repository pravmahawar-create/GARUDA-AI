/**
 * GARUDA Social Engine - Universal Browser Session Manager
 * Filename: stealthBrowserFactory.js (Maintained for backward compatibility)
 * Principle 2: Does NOT implement fingerprint spoofing or evasive circumvention.
 * Responsibilities:
 *  - CDP Connection to user-controlled Chrome (e.g. http://127.0.0.1:9222)
 *  - Launching isolated browser instances with clean flags and separated user data directories
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DEFAULT_CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

class StealthBrowserFactory {
  /**
   * Connect to an existing, user-controlled browser via Chrome DevTools Protocol (CDP)
   * @param {string} browserURL - e.g. 'http://127.0.0.1:9222'
   * @returns {Promise<import('puppeteer').Browser>}
   */
  static async connectToExistingBrowser(browserURL = 'http://127.0.0.1:9222') {
    try {
      const browser = await puppeteer.connect({
        browserURL,
        defaultViewport: { width: 1366, height: 768 }
      });
      return { success: true, browser, mode: 'CDP_ATTACH' };
    } catch (err) {
      return {
        success: false,
        error: `Failed to attach to browser at ${browserURL}: ${err.message}`,
        mode: 'CDP_ATTACH'
      };
    }
  }

  /**
   * Launch a clean, isolated browser instance
   * @param {string} userDataDir - Dedicated profile directory
   * @param {object} options - Launch options
   * @returns {Promise<import('puppeteer').Browser>}
   */
  static async launchIsolatedBrowser(userDataDir, options = {}) {
    const chromeExecutable = options.executablePath || (fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined);

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1366,768'
    ];

    if (userDataDir) {
      args.push(`--user-data-dir=${userDataDir}`);
    }

    try {
      const browser = await puppeteer.launch({
        executablePath: chromeExecutable,
        headless: options.headless !== undefined ? options.headless : 'new',
        args,
        defaultViewport: { width: 1366, height: 768 }
      });

      return { success: true, browser, mode: 'ISOLATED_LAUNCH' };
    } catch (err) {
      return {
        success: false,
        error: `Failed to launch isolated browser: ${err.message}`,
        mode: 'ISOLATED_LAUNCH'
      };
    }
  }
}

module.exports = StealthBrowserFactory;
