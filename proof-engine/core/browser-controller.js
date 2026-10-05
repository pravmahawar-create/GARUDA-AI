/**
 * 🦅 GARUDA PRODUCT PROOF ENGINE - BROWSER CONTROLLER
 * 
 * Manages Puppeteer lifecycle, human-like interaction physics,
 * smooth scrolling, realistic typing, and viewport isolation.
 */

const puppeteer = require('puppeteer');
const http = require('http');
const path = require('path');
const fs = require('fs');

class BrowserController {
  constructor() {
    this.browser = null;
    this.server = null;
  }

  /**
   * Starts a clean static/preview server for the product build if not already running
   */
  async ensureServer(appDir, port) {
    return new Promise((resolve, reject) => {
      // Test if already running on port
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        resolve({ port, reusable: true });
      });

      req.on('error', () => {
        // Not running, launch internal static preview server from dist/
        const distDir = path.join(appDir, 'dist');
        if (!fs.existsSync(distDir)) {
          return reject(new Error(`[BrowserController] Product build not found at ${distDir}. Run npm run build first.`));
        }

        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.webmanifest': 'application/manifest+json',
          '.wasm': 'application/wasm'
        };

        this.server = http.createServer((req, res) => {
          let reqPath = req.url.split('?')[0];
          if (reqPath === '/') reqPath = '/index.html';
          let filePath = path.join(distDir, reqPath);

          // SPA Fallback: If file doesn't exist, serve index.html
          if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            filePath = path.join(distDir, 'index.html');
          }

          const ext = path.extname(filePath).toLowerCase();
          const contentType = mimeTypes[ext] || 'application/octet-stream';

          fs.readFile(filePath, (err, content) => {
            if (err) {
              res.writeHead(500);
              res.end(`Server Error: ${err.code}`);
            } else {
              res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
              res.end(content, 'utf-8');
            }
          });
        });

        this.server.listen(port, '127.0.0.1', () => {
          console.log(`🌐 [BrowserController] Product server active at http://127.0.0.1:${port}`);
          resolve({ port, reusable: false });
        });

        this.server.on('error', reject);
      });
    });
  }

  /**
   * Launches headless browser with Retina-grade pixel density
   */
  async launchBrowser(viewportConfig = { width: 1080, height: 1920, isMobile: true }) {
    console.log(`🚀 [BrowserController] Launching Chromium (${viewportConfig.width}x${viewportConfig.height})...`);
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--force-device-scale-factor=1',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    const page = await this.browser.newPage();
    await page.setViewport({
      width: viewportConfig.width,
      height: viewportConfig.height,
      deviceScaleFactor: 1,
      isMobile: viewportConfig.isMobile || false,
      hasTouch: viewportConfig.isMobile || false
    });

    return { browser: this.browser, page };
  }

  /**
   * Human-like interaction helpers
   */
  getHelpers() {
    return {
      sleep: (ms) => new Promise(r => setTimeout(r, ms)),

      realisticClick: async (page, elementOrSelector) => {
        let el = elementOrSelector;
        if (typeof elementOrSelector === 'string') {
          el = await page.$(elementOrSelector);
        }
        if (!el) return false;

        // Ensure element is scrolled into view before computing coordinates
        await el.evaluate(e => e.scrollIntoView({ behavior: 'smooth', block: 'center' })).catch(() => {});
        await new Promise(r => setTimeout(r, 200));

        const box = await el.boundingBox();
        if (!box) {
          await el.click().catch(() => {});
          return true;
        }

        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height / 2;

        await page.mouse.move(targetX, targetY, { steps: 10 });
        await new Promise(r => setTimeout(r, 60));
        await page.mouse.down();
        await new Promise(r => setTimeout(r, 90));
        await page.mouse.up();
        await el.click().catch(() => {});
        return true;
      },

      realisticType: async (page, elementOrSelector, text) => {
        let el = elementOrSelector;
        if (typeof elementOrSelector === 'string') {
          el = await page.$(elementOrSelector);
        }
        if (!el) return false;

        await el.click({ clickCount: 3 });
        await new Promise(r => setTimeout(r, 80));
        await page.keyboard.press('Backspace');

        for (const char of text) {
          await page.keyboard.sendCharacter(char);
          const jitter = 35 + Math.floor(Math.random() * 40);
          await new Promise(r => setTimeout(r, jitter));
        }
        return true;
      },

      smoothScroll: async (page, targetY, durationMs = 600) => {
        await page.evaluate(async ({ targetY, durationMs }) => {
          return new Promise((resolve) => {
            const startY = window.scrollY || document.documentElement.scrollTop || 0;
            const diff = targetY - startY;
            const startTime = performance.now();

            function step(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / durationMs, 1);
              // Ease-in-out cubic
              const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

              window.scrollTo(0, startY + diff * ease);

              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                resolve();
              }
            }
            requestAnimationFrame(step);
          });
        }, { targetY, durationMs });
      }
    };
  }

  async close() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

module.exports = new BrowserController();
