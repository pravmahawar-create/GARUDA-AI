/**
 * 🦅 GARUDA OS — FINTECH OBSERVABILITY, SECRET REDACTION & ALERTING
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 14, 15, 16 & 25
 * Controlled Pilot Mandate: Observability, Secret Redaction, Multi-Tier Alerting & High-Value Safety
 */

const crypto = require("crypto");

// Sensitive keys that must NEVER appear in logs or public API responses
const SENSITIVE_KEY_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /cert/i,
  /private[_-]?key/i,
  /password/i,
  /authorization/i,
  /signature/i,
  /credential/i,
  /cvv/i,
  /pin/i
];

/**
 * Recursively deep-redacts sensitive keys from objects, arrays, and strings
 */
function redactSecrets(data, depth = 0) {
  if (depth > 10) return "[MAX_DEPTH_REACHED]";
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Check if string contains private keys or bearer tokens
    if (data.includes("BEGIN PRIVATE KEY") || data.includes("BEGIN RSA PRIVATE KEY")) {
      return "[REDACTED_PRIVATE_KEY]";
    }
    if (data.startsWith("Bearer ") && data.length > 15) {
      return `Bearer ${data.slice(7, 11)}...[REDACTED]`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSecrets(item, depth + 1));
  }

  if (typeof data === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitive) {
        if (typeof value === "string" && value.length > 8) {
          sanitized[key] = `${value.slice(0, 3)}...[REDACTED_${key.toUpperCase()}]`;
        } else {
          sanitized[key] = `[REDACTED_${key.toUpperCase()}]`;
        }
      } else {
        sanitized[key] = redactSecrets(value, depth + 1);
      }
    }
    return sanitized;
  }

  return data;
}

class FintechObservability {
  constructor() {
    this.metrics = {
      providerApiLatency: {}, // providerId -> { count, totalMs, minMs, maxMs, avgMs }
      apiFailures: {},        // providerId -> count
      webhookFailures: {
        invalidSignature: 0,
        expiredTimestamp: 0,
        futureTimestamp: 0,
        replayedNonce: 0,
        malformedPayload: 0,
        total: 0
      },
      duplicateEvents: 0,
      reconciliationMismatches: 0,
      manualReviewCount: 0,
      providerOutages: [],
      settlementDelays: 0,
      highValueTransactions: 0
    };

    this.alerts = []; // { id, severity, title, details, timestamp, acknowledged }
    this.alertListeners = [];

    // High-Value Transaction Configuration
    // Configurable via FINTECH_HIGH_VALUE_THRESHOLD (default $250,000 USD)
    this.highValueThresholdUSD = Number(process.env.FINTECH_HIGH_VALUE_THRESHOLD) || 250000;
  }

  /**
   * Records API Latency for an external provider request
   */
  recordLatency(providerId, latencyMs) {
    if (!this.metrics.providerApiLatency[providerId]) {
      this.metrics.providerApiLatency[providerId] = {
        count: 0,
        totalMs: 0,
        minMs: latencyMs,
        maxMs: latencyMs,
        avgMs: latencyMs
      };
    }
    const stat = this.metrics.providerApiLatency[providerId];
    stat.count += 1;
    stat.totalMs += latencyMs;
    stat.minMs = Math.min(stat.minMs, latencyMs);
    stat.maxMs = Math.max(stat.maxMs, latencyMs);
    stat.avgMs = Math.round(stat.totalMs / stat.count);
  }

  /**
   * Records provider API failure
   */
  recordApiFailure(providerId, endpoint, error) {
    this.metrics.apiFailures[providerId] = (this.metrics.apiFailures[providerId] || 0) + 1;

    // Check if failure rate requires alerting
    if (this.metrics.apiFailures[providerId] >= 3) {
      this.dispatchAlert("HIGH", `Elevated API Failures on ${providerId}`, {
        providerId,
        endpoint,
        error: error?.message || String(error),
        totalFailures: this.metrics.apiFailures[providerId]
      });
    }
  }

  /**
   * Records webhook failure categories
   */
  recordWebhookFailure(category, details = {}) {
    this.metrics.webhookFailures.total += 1;
    if (category in this.metrics.webhookFailures) {
      this.metrics.webhookFailures[category] += 1;
    }

    if (category === "replayedNonce") {
      this.dispatchAlert("HIGH", "Suspicious Webhook Nonce Replay Attempt Intercepted", details);
    }
  }

  /**
   * Records an ambiguous reconciliation routed to MANUAL_REVIEW
   */
  recordManualReview(transactionId, reason, amount) {
    this.metrics.manualReviewCount += 1;
    this.metrics.reconciliationMismatches += 1;

    this.dispatchAlert("HIGH", `Reconciliation Quarantined into MANUAL_REVIEW: ${reason}`, {
      transactionId,
      reason,
      amount
    });
  }

  /**
   * High-Value Transaction Gate Evaluation
   */
  evaluateHighValueGate({ amount, currency = "USD", merchantId, transactionId }) {
    // Normalize to USD equivalent approximately for evaluation
    let usdAmount = Number(amount);
    const curr = String(currency).toUpperCase();
    if (curr === "AED") usdAmount = amount / 3.67;
    else if (curr === "INR") usdAmount = amount / 85;
    else if (curr === "EUR") usdAmount = amount * 1.08;
    else if (curr === "GBP") usdAmount = amount * 1.28;

    const isHighValue = usdAmount >= this.highValueThresholdUSD;

    if (isHighValue) {
      this.metrics.highValueTransactions += 1;
      this.dispatchAlert("MEDIUM", `High-Value Commercial Transaction Gate Engaged: ${currency} ${amount.toLocaleString()}`, {
        transactionId,
        merchantId,
        amount,
        currency,
        usdEquivalent: Math.round(usdAmount),
        thresholdUSD: this.highValueThresholdUSD,
        requiresEnhancedReconciliation: true
      });
    }

    return {
      isHighValue,
      usdEquivalent: Math.round(usdAmount),
      thresholdUSD: this.highValueThresholdUSD,
      requiresEnhancedVerification: isHighValue,
      requiresDualSignoff: isHighValue && usdAmount >= 1000000 // Whales above $1M
    };
  }

  /**
   * Multi-Tier Alert Dispatcher
   * Severity: CRITICAL | HIGH | MEDIUM
   */
  dispatchAlert(severity, title, details = {}) {
    const alert = {
      id: `alt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      severity: ["CRITICAL", "HIGH", "MEDIUM"].includes(severity) ? severity : "MEDIUM",
      title,
      details: redactSecrets(details),
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > 200) this.alerts.pop(); // Keep last 200 alerts

    // Trigger listeners
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        console.error("Alert listener error:", err.message);
      }
    }

    return alert;
  }

  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      highValueThresholdUSD: this.highValueThresholdUSD,
      ...this.metrics,
      activeAlertsCount: this.alerts.filter(a => !a.acknowledged).length,
      criticalAlertsCount: this.alerts.filter(a => a.severity === "CRITICAL" && !a.acknowledged).length
    };
  }

  getAlerts(severityFilter = null) {
    if (!severityFilter) return this.alerts;
    return this.alerts.filter(a => a.severity === severityFilter);
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }
}

const defaultObservability = new FintechObservability();

module.exports = {
  FintechObservability,
  defaultObservability,
  redactSecrets
};
