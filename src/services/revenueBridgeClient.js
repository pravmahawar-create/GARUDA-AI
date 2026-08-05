const DEFAULT_TIMEOUT_MS = 8000;

function normalizeBaseUrl(value) {
  return String(value || "http://127.0.0.1:4001").replace(/\/$/, "");
}

function contractMalformed(payload) {
  return !payload || typeof payload !== "object" || typeof payload.success !== "boolean";
}

class RevenueBridgeClient {
  constructor(options = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl || process.env.GARUDA_REVENUE_BRIDGE_URL || "http://127.0.0.1:4001");
    this.token = String(options.token || process.env.MOTHER_BRIDGE_TOKEN || process.env.GARUDA_MOTHER_BRIDGE_TOKEN || "").trim();
    this.timeoutMs = Number(options.timeoutMs || process.env.GARUDA_REVENUE_BRIDGE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  }

  async request(method, routePath, body, extraHeaders = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs > 0 ? this.timeoutMs : DEFAULT_TIMEOUT_MS);

    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      ...extraHeaders
    };

    if (this.token) {
      headers["x-garuda-mother-token"] = this.token;
    }

    try {
      const response = await fetch(`${this.baseUrl}${routePath}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal
      });

      const payload = await response.json().catch(() => null);
      if (contractMalformed(payload)) {
        return {
          ok: false,
          status: response.status,
          error: {
            code: "MALFORMED_RESPONSE",
            message: "Revenue bridge returned a non-contract payload."
          },
          raw: payload
        };
      }

      if (!response.ok || payload.success !== true) {
        const code = payload && payload.error && payload.error.code
          ? payload.error.code
          : (response.status === 401 ? "UNAUTHORIZED" : "REMOTE_ERROR");
        const message = payload && payload.error && payload.error.message
          ? payload.error.message
          : `Revenue bridge request failed with HTTP ${response.status}.`;

        return {
          ok: false,
          status: response.status,
          error: { code, message },
          data: payload.data || null,
          raw: payload
        };
      }

      return {
        ok: true,
        status: response.status,
        data: payload.data || payload,
        raw: payload
      };
    } catch (error) {
      const isAbort = error && error.name === "AbortError";
      return {
        ok: false,
        status: 0,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: isAbort
            ? `Revenue bridge request timed out after ${this.timeoutMs}ms.`
            : `Revenue bridge unavailable: ${error.message}`
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  getHealth() {
    return this.request("GET", "/api/mother-bridge/health");
  }

  getCapabilities() {
    return this.request("GET", "/api/mother-bridge/capabilities");
  }

  evaluateWork(input = {}, founderApproved = false) {
    const headers = founderApproved ? { "x-garuda-founder-approved": "true" } : {};
    return this.request("POST", "/api/mother-bridge/evaluate-work", input, headers);
  }

  runDiscoveryCycle(founderApproved = false) {
    const headers = founderApproved ? { "x-garuda-founder-approved": "true" } : {};
    return this.request("POST", "/api/mother-bridge/discovery-cycle", {}, headers);
  }
}

module.exports = {
  RevenueBridgeClient,
  contractMalformed,
  normalizeBaseUrl
};
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-01T12:54:02.336Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-01T12:54:03.925Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-01T12:54:06.243Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-02T06:29:34.755Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-02T07:47:21.021Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-02T08:09:42.683Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-02T08:27:36.349Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-02T08:42:00.467Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
// GARUDA_SELF_DEVELOPMENT_TOUCHPOINT capability=mother.revenue_bridge_connectivity timestamp=2026-08-02T11:00:09.909Z objective=Create a minimal governed touchpoint inside selected capability surface for mother.revenue_bridge_connectivity
