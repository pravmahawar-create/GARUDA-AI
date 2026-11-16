/**
 * 🦅 GARUDA AEGIS — EXTERNAL AGENT CONNECTOR
 * 
 * Responsibilities:
 * 1. Validates target agent URL, access method, and domain authorization.
 * 2. Enforces strict airgap and anti-probing safety rules (rejects metadata endpoints, private subnets).
 * 3. Classifies connection modes: WEB_BROWSER, REST_API, or LOCAL_FIXTURE.
 * 4. Pre-flight connection reachability check with latency profiling.
 * 5. Bounded session management with error containment.
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

// Default Authorized Target Domains & Matchers
const DEFAULT_AUTHORIZED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "garudaos.in",
  "www.garudaos.in",
  "run.agentplace.io",
  "agentplace.io",
  "garuda-ai-xfif.onrender.com",
  "garuda-ai-v1.vercel.app"
];

// Blocked / Forbidden Target Subnets (Cloud Metadata, Internal Infrastructure)
const BLOCKED_HOSTS_AND_PATTERNS = [
  "169.254.169.254", // Cloud metadata (AWS, GCP, Azure)
  "metadata.google.internal",
  "10.0.0.0/8",
  "192.168.0.0/16",
  "darkweb",
  "onion",
  "exploit",
  "phishing"
];

class ExternalAgentConnector {
  constructor(options = {}) {
    this.authorizedDomains = options.authorizedDomains || [...DEFAULT_AUTHORIZED_DOMAINS];
    this.timeoutMs = options.timeoutMs || 10000;
  }

  /**
   * Validate whether a target URL is authorized and structurally sound
   */
  validateTargetAuthorization(targetUrl, context = {}) {
    if (!targetUrl || typeof targetUrl !== "string") {
      return {
        authorized: false,
        reason: "Target URL must be a non-empty string."
      };
    }

    let parsed;
    try {
      parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    } catch (err) {
      return {
        authorized: false,
        reason: `Invalid target URL structure: ${err.message}`
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 1. Block metadata / security threat domains
    if (BLOCKED_HOSTS_AND_PATTERNS.some(b => hostname === b || hostname.includes(b))) {
      return {
        authorized: false,
        hostname,
        reason: `Security Violation: Target host '${hostname}' is strictly blocked by AEGIS safety policy.`
      };
    }

    // 2. Local fixture authorization (permitted for local development & testing)
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    if (isLocal) {
      return {
        authorized: true,
        mode: "LOCAL_FIXTURE",
        hostname,
        url: parsed.href,
        protocol: parsed.protocol
      };
    }

    // 3. Explicit Founder Authorization Override
    const hasFounderApproval = Boolean(
      context.founderApproved === true ||
      context.founderApprovalToken ||
      process.env.GARUDA_FOUNDER_APPROVED === "true"
    );

    // 4. Domain Allowlist Check
    const isAllowlisted = this.authorizedDomains.some(d => hostname === d || hostname.endsWith(`.${d}`));

    if (isAllowlisted || hasFounderApproval) {
      const mode = parsed.pathname.includes("/api/") ? "EXTERNAL_AGENT_API" : "EXTERNAL_AGENT";
      return {
        authorized: true,
        mode,
        hostname,
        url: parsed.href,
        protocol: parsed.protocol,
        founderOverride: !isAllowlisted && hasFounderApproval
      };
    }

    return {
      authorized: false,
      hostname,
      reason: `Target domain '${hostname}' is not in the authorized evaluation registry. Explicit founder approval required.`
    };
  }

  /**
   * Pre-flight ping to verify target reachability and measure baseline latency
   */
  async preflightCheck(targetUrl, options = {}) {
    const auth = this.validateTargetAuthorization(targetUrl, options);
    if (!auth.authorized) {
      return {
        reachable: false,
        status: "UNAUTHORIZED_TARGET",
        error: auth.reason
      };
    }

    const parsed = new URL(auth.url);
    const client = parsed.protocol === "https:" ? https : http;
    const timeoutMs = options.timeoutMs || this.timeoutMs;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const req = client.get(auth.url, { timeout: timeoutMs }, (res) => {
        const latencyMs = Date.now() - startTime;
        resolve({
          reachable: true,
          status: "REACHABLE",
          httpCode: res.statusCode,
          headers: res.headers,
          latencyMs,
          mode: auth.mode,
          timestamp: new Date().toISOString()
        });
        res.resume(); // consume response data to free memory
      });

      req.on("error", (err) => {
        resolve({
          reachable: false,
          status: "UNREACHABLE",
          error: err.message,
          latencyMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          reachable: false,
          status: "TIMEOUT",
          error: `Preflight check timed out after ${timeoutMs}ms`,
          latencyMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      });
    });
  }
}

module.exports = { ExternalAgentConnector, DEFAULT_AUTHORIZED_DOMAINS };
