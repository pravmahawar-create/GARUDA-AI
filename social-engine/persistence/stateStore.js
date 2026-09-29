/**
 * GARUDA Social Engine - State Store & Observability Metrics
 * Persists internal counters, metrics, and operational history.
 */

const fs = require('fs');
const path = require('path');

class StateStore {
  constructor(filePath = null) {
    this.storeFile = filePath || path.join(__dirname, '..', '..', 'data', 'leads', 'social_engine_metrics.json');
    const dir = path.dirname(this.storeFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.metrics = this._loadMetrics();
  }

  _loadMetrics() {
    const defaults = {
      workersRunning: 0,
      workersHealthy: 0,
      workersFailed: 0,
      leadsDiscovered: 0,
      leadsVerified: 0,
      leadsUnknown: 0,
      leadsRejected: 0,
      duplicatesRemoved: 0,
      outreachQueued: 0,
      outreachApproved: 0,
      outreachCompleted: 0,
      securityBlocks: 0,
      authenticationFailures: 0,
      browserRestarts: 0,
      totalConfidenceSum: 0,
      confidenceMeasurementCount: 0,
      averageExtractionConfidence: 0,
      lastUpdated: new Date().toISOString()
    };

    if (fs.existsSync(this.storeFile)) {
      try {
        return { ...defaults, ...JSON.parse(fs.readFileSync(this.storeFile, 'utf8')) };
      } catch (_) {
        return defaults;
      }
    }
    return defaults;
  }

  _persist() {
    try {
      this.metrics.lastUpdated = new Date().toISOString();
      if (this.metrics.confidenceMeasurementCount > 0) {
        this.metrics.averageExtractionConfidence = Math.round(
          this.metrics.totalConfidenceSum / this.metrics.confidenceMeasurementCount
        );
      }
      fs.writeFileSync(this.storeFile, JSON.stringify(this.metrics, null, 2), 'utf8');
    } catch (err) {
      console.error('[StateStore] Failed to persist metrics:', err.message);
    }
  }

  increment(metricKey, amount = 1) {
    if (this.metrics[metricKey] !== undefined) {
      this.metrics[metricKey] += amount;
      this._persist();
    }
  }

  recordConfidence(score) {
    if (typeof score === 'number' && score >= 0) {
      this.metrics.totalConfidenceSum += score;
      this.metrics.confidenceMeasurementCount++;
      this._persist();
    }
  }

  getSnapshot() {
    return { ...this.metrics };
  }
}

module.exports = StateStore;
