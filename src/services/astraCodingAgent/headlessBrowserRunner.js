/**
 * 🦅 GARUDA PAWAN ASTRA — HEADLESS BROWSER RUNNER & RUNTIME VERIFICATION ENGINE
 * 
 * Capabilities:
 * 1. Headless Chromium Lifecycle: Isolated execution via Puppeteer
 * 2. Real-Time Telemetry: Intercepts console.error, pageerror, network failures, HTTP 4xx/5xx
 * 3. Semantic Interaction Engine: Click, fill, assertVisible, assertText
 * 4. Diagnostic Error Classification: Categorizes failures into structured self-healing inputs
 * 5. Bounded Execution: Enforces strict timeouts to prevent hanging processes
 */

const puppeteer = require("puppeteer");

class HeadlessBrowserRunner {
  constructor(options = {}) {
    this.defaultTimeoutMs = options.timeoutMs || 8000;
    this.headless = options.headless !== undefined ? options.headless : "new";
  }

  /**
   * Classify runtime errors into structured categories for surgical self-healing
   */
  classifyError(errorObj) {
    const msg = String(errorObj?.message || errorObj || "").toLowerCase();
    const stack = String(errorObj?.stack || "");

    if (msg.includes("referenceerror") || msg.includes("is not defined")) {
      return {
        category: "RUNTIME_REFERENCE",
        rootCause: "Undefined symbol or missing function declaration",
        severity: "high",
        recoverable: true
      };
    }

    if (msg.includes("typeerror") || msg.includes("cannot read properties") || msg.includes("is not a function")) {
      return {
        category: "RUNTIME_TYPE",
        rootCause: "Type mismatch or null/undefined member access",
        severity: "high",
        recoverable: true
      };
    }

    if (msg.includes("syntaxerror") || msg.includes("unexpected token")) {
      return {
        category: "SYNTAX",
        rootCause: "Syntax error in script block or JSON payload",
        severity: "critical",
        recoverable: true
      };
    }

    if (msg.includes("net::err") || msg.includes("failed to fetch") || msg.includes("404") || msg.includes("500")) {
      return {
        category: "NETWORK",
        rootCause: "Network failure, broken asset URL, or offline resource",
        severity: "medium",
        recoverable: true
      };
    }

    if (msg.includes("waiting for selector") || msg.includes("element not found") || msg.includes("failed to click")) {
      return {
        category: "UI_INTERACTION",
        rootCause: "Target UI element missing from DOM or not clickable",
        severity: "medium",
        recoverable: true
      };
    }

    return {
      category: "UNKNOWN",
      rootCause: msg || "Unclassified runtime exception",
      severity: "medium",
      recoverable: true
    };
  }

  /**
   * Run standalone HTML content in headless browser sandbox (alias for verifyHtml)
   */
  async runSandbox(htmlContent, options = {}) {
    return this.verifyHtml(htmlContent, options);
  }

  /**
   * Run standalone HTML content in headless browser and collect runtime diagnostics
   * @param {string} htmlContent - Full HTML string to test
   * @param {object} options - { interactions: [], timeoutMs: 8000 }
   */
  async verifyHtml(htmlContent, options = {}) {
    const startTime = Date.now();
    const consoleErrors = [];
    const pageErrors = [];
    const networkFailures = [];
    const httpFailures = [];
    const interactionResults = [];
    let browser = null;

    try {
      browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run"
        ]
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(options.timeoutMs || this.defaultTimeoutMs);

      // 1. Setup Telemetry Listeners
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("pageerror", (err) => {
        pageErrors.push({
          message: err.message,
          stack: err.stack,
          classification: this.classifyError(err)
        });
      });

      page.on("requestfailed", (req) => {
        networkFailures.push({
          url: req.url(),
          errorText: req.failure()?.errorText || "Request failed"
        });
      });

      page.on("response", (res) => {
        if (res.status() >= 400) {
          httpFailures.push({
            url: res.url(),
            status: res.status()
          });
        }
      });

      // 2. Load HTML Content
      await page.setContent(htmlContent, {
        waitUntil: "load",
        timeout: options.timeoutMs || this.defaultTimeoutMs
      });

      // Give event loop a short tick for immediate onload scripts
      await new Promise((r) => setTimeout(r, 200));

      // 3. Execute Interactions (if specified)
      if (Array.isArray(options.interactions) && options.interactions.length > 0) {
        for (let i = 0; i < options.interactions.length; i++) {
          const action = options.interactions[i];
          const actionStart = Date.now();

          try {
            if (action.type === "click") {
              await page.waitForSelector(action.target, { timeout: 3000 });
              await page.click(action.target);
              await new Promise((r) => setTimeout(r, 150)); // UI transition tick
              interactionResults.push({
                index: i,
                action: "click",
                target: action.target,
                success: true,
                durationMs: Date.now() - actionStart
              });
            } else if (action.type === "fill") {
              await page.waitForSelector(action.target, { timeout: 3000 });
              await page.type(action.target, action.value || "");
              interactionResults.push({
                index: i,
                action: "fill",
                target: action.target,
                success: true,
                durationMs: Date.now() - actionStart
              });
            } else if (action.type === "assertVisible") {
              await page.waitForSelector(action.target, { visible: true, timeout: 3000 });
              interactionResults.push({
                index: i,
                action: "assertVisible",
                target: action.target,
                success: true,
                durationMs: Date.now() - actionStart
              });
            } else if (action.type === "assertText") {
              await page.waitForSelector(action.target, { timeout: 3000 });
              const text = await page.$eval(action.target, (el) => el.innerText || el.textContent);
              const matched = text.includes(action.expected);
              if (!matched) {
                throw new Error(`Text assertion failed: Expected "${action.expected}" in "${action.target}", got "${text}"`);
              }
              interactionResults.push({
                index: i,
                action: "assertText",
                target: action.target,
                expected: action.expected,
                success: true,
                durationMs: Date.now() - actionStart
              });
            }
          } catch (actErr) {
            interactionResults.push({
              index: i,
              action: action.type,
              target: action.target,
              success: false,
              error: actErr.message,
              classification: this.classifyError(actErr),
              durationMs: Date.now() - actionStart
            });
            // Don't abort remaining checks unless configured
            if (options.stopOnActionFailure) break;
          }
        }
      }

      const totalDuration = Date.now() - startTime;
      const hasErrors = pageErrors.length > 0 || consoleErrors.length > 0 || interactionResults.some(r => !r.success);

      // 4. Formulate Structured Diagnosis Payload
      const primaryError = pageErrors[0] || (consoleErrors.length > 0 ? { message: consoleErrors[0] } : null);
      const classification = primaryError ? this.classifyError(primaryError) : null;

      return {
        status: hasErrors ? "FAILED" : "PASSED",
        passed: !hasErrors,
        totalDurationMs: totalDuration,
        consoleErrors,
        pageErrors,
        networkFailures,
        httpFailures,
        interactionResults,
        diagnostics: hasErrors ? {
          primaryError: primaryError?.message,
          stack: primaryError?.stack,
          classification,
          suggestedRemedy: classification?.rootCause
        } : null
      };

    } catch (launchErr) {
      return {
        status: "RUNNER_ERROR",
        passed: false,
        totalDurationMs: Date.now() - startTime,
        error: launchErr.message,
        classification: this.classifyError(launchErr)
      };
    } finally {
      if (browser) {
        try { await browser.close(); } catch {}
      }
    }
  }
}

module.exports = { HeadlessBrowserRunner };
