/**
 * 🦅 GARUDA AEGIS — BROWSER INTERACTION ENGINE
 * 
 * Responsibilities:
 * 1. Headless Chromium lifecycle management via Puppeteer.
 * 2. Connects to authorized web agent URLs with strict timeout bounds.
 * 3. Autonomous discovery of chat elements (inputs, submit buttons, response bubbles).
 * 4. Multi-turn message transmission (type, submit, wait for streaming completion).
 * 5. Real-time DOM telemetry capture (rendered text, console logs, page errors, HTTP failures).
 * 6. High-fidelity binary PNG screenshot capture with cryptographic SHA-256 hashing.
 * 
 * Core Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const puppeteer = require("puppeteer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class BrowserInteractionEngine {
  constructor(options = {}) {
    this.defaultTimeoutMs = options.timeoutMs || 25000;
    this.headless = options.headless !== undefined ? options.headless : "new";
    this.browser = null;
    this.page = null;
    this.telemetry = {
      consoleErrors: [],
      pageErrors: [],
      networkFailures: [],
      httpFailures: []
    };
  }

  /**
   * Launch browser and navigate to target agent URL with telemetry listeners
   */
  async launchSession(targetUrl, options = {}) {
    const startTime = Date.now();
    this.telemetry = {
      consoleErrors: [],
      pageErrors: [],
      networkFailures: [],
      httpFailures: []
    };

    const viewport = options.viewport || { width: 1280, height: 800 };
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run"
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(viewport);
    this.page.setDefaultTimeout(timeoutMs);

    // Setup Telemetry Listeners
    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        this.telemetry.consoleErrors.push(msg.text());
      }
    });

    this.page.on("pageerror", (err) => {
      this.telemetry.pageErrors.push({
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    });

    this.page.on("requestfailed", (req) => {
      this.telemetry.networkFailures.push({
        url: req.url(),
        errorText: req.failure()?.errorText || "Request failed",
        timestamp: new Date().toISOString()
      });
    });

    this.page.on("response", (res) => {
      if (res.status() >= 400) {
        this.telemetry.httpFailures.push({
          url: res.url(),
          status: res.status(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Navigate to target
    const navResponse = await this.page.goto(targetUrl, {
      waitUntil: options.waitUntil || "domcontentloaded",
      timeout: timeoutMs
    });

    // Settle tick for initial scripts
    await new Promise((r) => setTimeout(r, options.settleMs || 500));

    return {
      success: true,
      targetUrl,
      httpStatus: navResponse ? navResponse.status() : 200,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Autonomous discovery of chat UI controls (input, submit, messages)
   */
  async discoverChatControls(customSelectors = {}) {
    if (!this.page) throw new Error("No active browser page session.");

    const candidateInputs = [
      customSelectors.input,
      "#chat-input",
      "textarea#message",
      "textarea[placeholder*='message' i]",
      "textarea[placeholder*='ask' i]",
      "input[type='text'][placeholder*='message' i]",
      "input[type='text'][placeholder*='ask' i]",
      "input#chat-input",
      "input[name='message']",
      "textarea",
      "input[type='text']"
    ].filter(Boolean);

    const candidateSubmits = [
      customSelectors.submit,
      "#send-btn",
      "#chat-submit",
      "button[type='submit']",
      "button[aria-label*='send' i]",
      "button.send-button",
      "button.submit-button",
      "form button"
    ].filter(Boolean);

    const candidateMessages = [
      customSelectors.messages,
      ".stage-canvas-page",
      ".stage-page",
      ".stage-canvas",
      "#messages",
      ".chat-messages",
      ".messages-container",
      ".message-list",
      "[data-testid='chat-messages']",
      "#chat-log",
      "main",
      "[role='main']",
      "body"
    ].filter(Boolean);

    let resolvedInput = null;
    for (let i = 0; i < candidateInputs.length; i++) {
      const sel = candidateInputs[i];
      const waitTime = (i === 0 || sel === "textarea" || sel === customSelectors.input) ? 20000 : 1500;
      try {
        const el = await this.page.waitForSelector(sel, { timeout: waitTime });
        if (el) {
          resolvedInput = sel;
          break;
        }
      } catch (_) {}
    }

    let resolvedSubmit = null;
    for (let i = 0; i < candidateSubmits.length; i++) {
      const sel = candidateSubmits[i];
      const waitTime = (i === 0 || sel === customSelectors.submit) ? 5000 : 1000;
      try {
        const el = await this.page.waitForSelector(sel, { timeout: waitTime });
        if (el) {
          resolvedSubmit = sel;
          break;
        }
      } catch (_) {}
    }

    let resolvedMessages = null;
    for (let i = 0; i < candidateMessages.length; i++) {
      const sel = candidateMessages[i];
      const waitTime = (i === 0 || sel === customSelectors.messages) ? 5000 : 1000;
      try {
        const el = await this.page.waitForSelector(sel, { timeout: waitTime });
        if (el) {
          resolvedMessages = sel;
          break;
        }
      } catch (_) {}
    }

    return {
      inputSelector: resolvedInput,
      submitSelector: resolvedSubmit,
      messagesSelector: resolvedMessages,
      discovered: Boolean(resolvedInput)
    };
  }

  /**
   * Send a message turn and capture the rendered response with streaming/settling support
   */
  async sendMessageTurn(messageText, options = {}) {
    if (!this.page) throw new Error("No active browser session.");

    const startTime = Date.now();
    const inputSelector = options.inputSelector || "textarea";
    const submitSelector = options.submitSelector;
    const messagesSelector = options.messagesSelector || "#messages";
    const timeoutMs = options.timeoutMs || 20000;

    // 1. Snapshot previous response count or DOM text
    const initialDomState = await this.page.evaluate((mSel) => {
      const container = document.querySelector(mSel);
      if (!container) return { text: "", messageCount: 0 };
      const items = container.querySelectorAll(".message, .chat-bubble, li, p, div");
      return {
        text: container.innerText || "",
        messageCount: items.length
      };
    }, messagesSelector);

    // 2. Clear and type the message into input
    await this.page.waitForSelector(inputSelector, { timeout: options.inputTimeoutMs || 15000 });
    await this.page.click(inputSelector);
    // Select all and delete previous text if any
    await this.page.keyboard.down("Control");
    await this.page.keyboard.press("A");
    await this.page.keyboard.up("Control");
    await this.page.keyboard.press("Backspace");

    await this.page.type(inputSelector, messageText, { delay: options.typeDelay || 10 });

    // 3. Submit: Always press Enter on input, and click submit button if available
    await this.page.keyboard.press("Enter");
    if (submitSelector) {
      try {
        const btn = await this.page.$(submitSelector);
        if (btn) await btn.click();
      } catch (_) {}
    }

    // 4. Wait for response text to appear and settle
    let responseText = "";
    const pollIntervalMs = 300;
    const maxWaitMs = timeoutMs;
    const settleThresholdMs = options.settleThresholdMs || 1500;
    let lastChangeTime = Date.now();
    let prevText = initialDomState.text;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));

      // Check if the agent is actively streaming or showing "Working…" / "Thinking…"
      const isWorking = await this.page.evaluate(() => {
        const bodyText = document.body ? document.body.innerText : "";
        const progressEl = document.querySelector(".stage-progress-copy, .shimmer-text, .spinner, [aria-busy='true']");
        const progressText = progressEl ? (progressEl.innerText || "") : "";
        return progressText.includes("Working") || progressText.includes("Thinking") || bodyText.includes("Working…") || bodyText.includes("Thinking…");
      });

      if (isWorking) {
        lastChangeTime = Date.now();
        continue;
      }

      const currentDomState = await this.page.evaluate((mSel) => {
        const container = document.querySelector(mSel);
        if (!container) return { text: "", rawHtml: "" };
        // Extract latest assistant message if structured, or full text
        const botMessages = container.querySelectorAll(".assistant, .bot-message, .agent-response, [data-sender='bot'], [data-sender='assistant']");
        if (botMessages.length > 0) {
          const lastBot = botMessages[botMessages.length - 1];
          return {
            text: (lastBot.innerText || lastBot.textContent || "").trim(),
            rawHtml: lastBot.outerHTML
          };
        }
        return {
          text: (container.innerText || container.textContent || "").trim(),
          rawHtml: container.innerHTML
        };
      }, messagesSelector);

      if (currentDomState.text !== prevText && currentDomState.text.length > 0) {
        prevText = currentDomState.text;
        lastChangeTime = Date.now();
      } else if (currentDomState.text.length > 0 && currentDomState.text !== initialDomState.text) {
        // Text has settled for threshold duration
        if (Date.now() - lastChangeTime >= settleThresholdMs) {
          responseText = currentDomState.text;
          break;
        }
      }
    }

    // If still empty, grab whatever current text is in the messages container
    if (!responseText) {
      responseText = await this.page.evaluate((mSel) => {
        const container = document.querySelector(mSel);
        return container ? (container.innerText || container.textContent || "").trim() : "";
      }, messagesSelector);
    }

    // Smart assistant response isolating: if container returned full body with user text, extract the reply
    if (responseText && responseText.includes(messageText)) {
      const parts = responseText.split(messageText);
      const afterUser = parts[parts.length - 1].trim();
      if (afterUser.length > 0) {
        responseText = afterUser
          .replace(/Updating the page…[\s\S]*$/i, '')
          .replace(/Ask about dental care[\s\S]*$/i, '')
          .replace(/Speak[\s\S]*$/i, '')
          .replace(/Activity details are not available[\s\S]*$/i, '')
          .trim();
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      userMessage: messageText,
      agentResponse: responseText,
      durationMs,
      timestamp: new Date().toISOString(),
      telemetry: { ...this.telemetry }
    };
  }

  /**
   * Capture a full-page binary PNG screenshot and return path and SHA-256
   */
  async captureScreenshot(destFilePath) {
    if (!this.page) throw new Error("No active browser session.");

    const targetDir = path.dirname(destFilePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const buffer = await this.page.screenshot({
      path: destFilePath,
      fullPage: true,
      type: "png"
    });

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    return {
      filePath: destFilePath,
      sha256,
      sizeBytes: buffer.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract current DOM snapshot
   */
  async extractDomSnapshot() {
    if (!this.page) return "";
    return await this.page.content();
  }

  /**
   * Close active browser session cleanly
   */
  async closeSession() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (_) {}
      this.browser = null;
      this.page = null;
    }
  }
}

module.exports = { BrowserInteractionEngine };
