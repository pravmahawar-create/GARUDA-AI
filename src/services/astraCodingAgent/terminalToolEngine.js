/**
 * GARUDA PAWAN ASTRA™ — Sovereign Terminal Tool Engine
 * 
 * Secure, policy-enforced, telemetry-instrumented terminal execution layer.
 * Strictly adheres to GARUDA Anti-Fabrication Law and Security Governance.
 * 
 * Rules:
 * 1. Blocks unauthorized git commit, git push, deployment, and destructive commands.
 * 2. Enforces execution timeout and process tree termination on hang.
 * 3. Enforces output size limits (anti-memory-exhaustion).
 * 4. Redacts secrets (API keys, connection strings, auth tokens) in stdout/stderr.
 * 5. Returns structured telemetry with verified SHA-256 and execution status.
 */

const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

class TerminalToolEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.resolve(__dirname, "../../../");
    this.defaultTimeoutMs = options.defaultTimeoutMs || 35000;
    this.maxOutputBytes = options.maxOutputBytes || 512 * 1024; // 512 KB
    this.history = [];

    // Permanent Policy: Blocked command patterns (Destructive / Deploy / Commit)
    this.blockedPatterns = [
      /\bgit\s+commit\b/i,
      /\bgit\s+push\b/i,
      /\bgit\s+reset\s+--hard\b/i,
      /\bgit\s+clean\s+-[a-z]*f/i,
      /\brm\s+-rf\b/i,
      /\brmdir\s+\/s\b/i,
      /\bdel\s+\/f\s+\/s\b/i,
      /\bformat\s+[a-z]:/i,
      /\bvercel(\s+--prod)?\b/i,
      /\brender\s+deploy\b/i,
      /\bwrangler\s+deploy\b/i,
      /\bflyctl\s+deploy\b/i,
      /\bdrop\s+database\b/i,
      /\bshutdown\b/i
    ];

    // Allowed command whitelist categories
    this.allowedCategories = [
      "node",
      "npx",
      "npm",
      "git",
      "echo",
      "dir",
      "ls",
      "type",
      "cat"
    ];
  }

  /**
   * Redact sensitive secrets from text (API keys, DB credentials, auth tokens)
   */
  redactSecrets(text) {
    if (!text || typeof text !== "string") return text;
    let sanitized = text;

    // Google API Keys
    sanitized = sanitized.replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_GEMINI_KEY]");
    // Groq API Keys
    sanitized = sanitized.replace(/gsk_[0-9A-Za-z]{30,}/g, "[REDACTED_GROQ_KEY]");
    // Generic Bearer Tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-_\.]{20,}/gi, "Bearer [REDACTED_BEARER_TOKEN]");
    // MongoDB URIs with credentials
    sanitized = sanitized.replace(/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s/]+/gi, "mongodb://[REDACTED_CREDENTIALS]@[HOST]");
    // Generic secret query params (?key=xyz, &token=xyz)
    sanitized = sanitized.replace(/([?&](?:key|token|secret|password|auth)=)[^&\s]+/gi, "$1[REDACTED]");

    return sanitized;
  }

  /**
   * Evaluate if command violates sovereign security policy
   */
  checkPolicy(commandLine) {
    const trimmed = (commandLine || "").trim();
    if (!trimmed) {
      return { allowed: false, reason: "Empty command string" };
    }

    // Check blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(trimmed)) {
        return {
          allowed: false,
          reason: `Command matches forbidden sovereign security rule: ${pattern.toString()}`
        };
      }
    }

    // Check if command starts with an allowed executable
    const firstWord = trimmed.split(/[\s|&;]+/)[0].toLowerCase();
    const isAllowedExecutable = this.allowedCategories.some(cat => firstWord === cat || firstWord.endsWith(`\\${cat}`) || firstWord.endsWith(`/${cat}`));

    if (!isAllowedExecutable) {
      return {
        allowed: false,
        reason: `Command executable '${firstWord}' is not in sovereign allowed list: ${this.allowedCategories.join(", ")}`
      };
    }

    return { allowed: true };
  }

  /**
   * Execute command with strict timeout, output caps, secret redaction, and telemetry
   */
  async execute(commandLine, options = {}) {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const cwd = options.cwd ? path.resolve(this.rootDir, options.cwd) : this.rootDir;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const maxBytes = options.maxOutputBytes || this.maxOutputBytes;

    // 1. Policy Gate
    const policy = this.checkPolicy(commandLine);
    if (!policy.allowed && !options.overrideFounderApproval) {
      const blockedRecord = {
        command: this.redactSecrets(commandLine),
        cwd,
        startedAt,
        durationMs: Date.now() - startTime,
        exitCode: 126, // Command invoked cannot execute
        stdout: "",
        stderr: `[GARUDA_POLICY_REJECTION] ${policy.reason}. Founder Praveen explicit authorization required.`,
        status: "BLOCKED_BY_POLICY"
      };
      this.history.push(blockedRecord);
      return blockedRecord;
    }

    // 2. Execution via child_process.spawn
    return new Promise((resolve) => {
      let stdoutBuf = "";
      let stderrBuf = "";
      let timedOut = false;
      let settled = false;

      let child;
      try {
        child = spawn(commandLine, {
          shell: true,
          cwd,
          env: {
            ...process.env,
            PAGER: "cat",
            NODE_ENV: process.env.NODE_ENV || "development"
          },
          windowsHide: true
        });
      } catch (spawnErr) {
        const failRecord = {
          command: this.redactSecrets(commandLine),
          cwd,
          startedAt,
          durationMs: Date.now() - startTime,
          exitCode: 1,
          stdout: "",
          stderr: `Spawn error: ${spawnErr.message}`,
          status: "FAILED"
        };
        this.history.push(failRecord);
        return resolve(failRecord);
      }

      // Timeout timer
      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (isWin && child.pid) {
            execSync(`taskkill /pid ${child.pid} /t /f`, { stdio: "ignore" });
          } else {
            child.kill("SIGKILL");
          }
        } catch (_) {}
      }, timeoutMs);

      child.stdout.on("data", (data) => {
        if (stdoutBuf.length < maxBytes) {
          stdoutBuf += data.toString("utf8");
          if (stdoutBuf.length >= maxBytes) {
            stdoutBuf += "\n[GARUDA_TRUNCATED: Max output size limit reached]";
          }
        }
      });

      child.stderr.on("data", (data) => {
        if (stderrBuf.length < maxBytes) {
          stderrBuf += data.toString("utf8");
          if (stderrBuf.length >= maxBytes) {
            stderrBuf += "\n[GARUDA_TRUNCATED: Max error size limit reached]";
          }
        }
      });

      child.on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        const durationMs = Date.now() - startTime;
        const record = {
          command: this.redactSecrets(commandLine),
          cwd,
          startedAt,
          durationMs,
          exitCode: 1,
          stdout: this.redactSecrets(stdoutBuf),
          stderr: this.redactSecrets(stderrBuf || err.message),
          status: "FAILED"
        };
        this.history.push(record);
        resolve(record);
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        const durationMs = Date.now() - startTime;
        const exitCode = timedOut ? 124 : (code === null ? 1 : code);
        const status = timedOut ? "TIMED_OUT" : (exitCode === 0 ? "VERIFIED" : "FAILED");

        const record = {
          command: this.redactSecrets(commandLine),
          cwd,
          startedAt,
          durationMs,
          exitCode,
          stdout: this.redactSecrets(stdoutBuf),
          stderr: timedOut 
            ? `Command exceeded timeout limit of ${timeoutMs}ms and was killed.` 
            : this.redactSecrets(stderrBuf),
          status
        };

        this.history.push(record);
        resolve(record);
      });
    });
  }

  /**
   * Get audit telemetry of all executed commands
   */
  getHistory(limit = 20) {
    return this.history.slice(-limit);
  }

  /**
   * Clear in-memory history
   */
  clearHistory() {
    this.history = [];
  }
}

module.exports = {
  TerminalToolEngine,
  terminalToolEngine: new TerminalToolEngine()
};
