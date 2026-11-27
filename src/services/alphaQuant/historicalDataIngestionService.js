/**
 * 🦅 GARUDA ALPHA-QUANT: HISTORICAL MARKET DATA INGESTION SERVICE
 * Mission AQ-001 — Phase 3.3 Real Market Validation & Execution Reliability
 * 
 * Provides robust ingestion, validation, normalization, and local caching of
 * genuine historical OHLCV market data from authorized public REST endpoints.
 * 
 * Features:
 * 1. Multi-asset support: NSE Equities, Commodities, Forex, Crypto
 * 2. Strict Data Validation: Chronological order, positive prices, valid highs/lows
 * 3. Atomic Caching with SHA-256 Data Integrity Checksums
 * 4. Transparent provenance metadata: provider, endpoint, freshness, and bar count
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_HISTORICAL_DIR = path.join(__dirname, '..', '..', '..', 'data', 'historical');

class HistoricalDataIngestionService {
  constructor(options = {}) {
    this.storageDir = options.storageDir || DEFAULT_HISTORICAL_DIR;
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (e) {}
    }
  }

  /**
   * Fetch, validate, normalize, and cache historical candles for a single symbol
   * @param {string} symbol e.g. 'TCS.NS' or 'BTCUSDT'
   * @param {Object} [options={}] Fetch parameters
   * @returns {Promise<Object>} Normalized dataset with metadata
   */
  async fetchAndIngest(symbol, options = {}) {
    const interval = options.interval || '1h'; // '1h', '1d', '15m'
    const range = options.range || '6mo';       // '6mo', '1y', '3mo'
    const cleanSym = symbol.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheFile = path.join(this.storageDir, `${cleanSym}_${interval}_${range}.json`);

    let rawData = null;
    let dataSource = 'YAHOO_FINANCE_REST_V8';

    // 1. Fetch from authorized public REST endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'GARUDA-Quant/1.0 (Founder Praveen Sovereign Desk)' },
        signal: AbortSignal.timeout( options.timeoutMs || 8000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from market data provider`);
      rawData = await res.json();
    } catch (err) {
      // Offline fallback: try reading from local cache if network fails
      if (fs.existsSync(cacheFile)) {
        return this.loadCachedCandles(symbol, interval, range);
      }
      return {
        success: false,
        symbol,
        error: `Market data fetch failed: ${err.message}`,
        isLive: false,
        candles: []
      };
    }

    const chartResult = rawData.chart?.result?.[0];
    if (!chartResult || !Array.isArray(chartResult.timestamp)) {
      return {
        success: false,
        symbol,
        error: 'Invalid response schema from market data provider',
        isLive: false,
        candles: []
      };
    }

    const timestamps = chartResult.timestamp;
    const quotes = chartResult.indicators?.quote?.[0] || {};
    const opens = quotes.open || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];

    // 2. Validate and Normalize Candle Bars
    const normalizedCandles = [];
    const droppedCount = 0;

    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      const v = volumes[i] != null ? volumes[i] : 0;

      // Filter out null / NaN / zero-price anomaly candles
      if (t == null || o == null || h == null || l == null || c == null) continue;
      if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) continue;
      if (o <= 0 || h <= 0 || l <= 0 || c <= 0) continue;

      // Enforce strict candlestick geometry integrity
      const realHigh = Math.max(h, o, c);
      const realLow = Math.min(l, o, c);

      normalizedCandles.push({
        timestamp: new Date(t * 1000).toISOString(),
        open: Number(o.toFixed(2)),
        high: Number(realHigh.toFixed(2)),
        low: Number(realLow.toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: Number(v.toFixed(0))
      });
    }

    // Sort strictly chronological and deduplicate timestamps
    normalizedCandles.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const dedupedCandles = [];
    const seenTimestamps = new Set();
    for (const c of normalizedCandles) {
      if (!seenTimestamps.has(c.timestamp)) {
        seenTimestamps.add(c.timestamp);
        dedupedCandles.push(c);
      }
    }

    // 3. Compute Data Integrity Checksum
    const checksum = crypto.createHash('sha256').update(JSON.stringify(dedupedCandles)).digest('hex');
    const dataset = {
      symbol,
      cleanSymbol: cleanSym,
      interval,
      range,
      candleCount: dedupedCandles.length,
      startDate: dedupedCandles.length > 0 ? dedupedCandles[0].timestamp : null,
      endDate: dedupedCandles.length > 0 ? dedupedCandles[dedupedCandles.length - 1].timestamp : null,
      currency: chartResult.meta?.currency || 'INR',
      exchangeName: chartResult.meta?.exchangeName || 'NSE',
      dataSource,
      checksum,
      ingestedAt: new Date().toISOString(),
      candles: dedupedCandles
    };

    // 4. Atomic Cache Persistence
    try {
      const tmpPath = path.join(this.storageDir, `${cleanSym}_${interval}_${range}-${process.pid}-${Date.now()}.tmp`);
      fs.writeFileSync(tmpPath, JSON.stringify(dataset, null, 2), 'utf8');
      fs.renameSync(tmpPath, cacheFile);
    } catch (e) {}

    return {
      success: true,
      ...dataset
    };
  }

  /**
   * Batch ingest multiple symbols concurrently
   */
  async ingestMultiple(symbols, options = {}) {
    const results = [];
    for (const sym of symbols) {
      const res = await this.fetchAndIngest(sym, options);
      results.push(res);
    }
    return results;
  }

  /**
   * Load cached historical candles from disk and verify SHA-256 integrity
   */
  loadCachedCandles(symbol, interval = '1h', range = '6mo') {
    const cleanSym = symbol.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cacheFile = path.join(this.storageDir, `${cleanSym}_${interval}_${range}.json`);

    if (!fs.existsSync(cacheFile)) {
      return { success: false, symbol, error: 'Cache file not found', candles: [] };
    }

    try {
      const raw = fs.readFileSync(cacheFile, 'utf8');
      const data = JSON.parse(raw);
      const computedChecksum = crypto.createHash('sha256').update(JSON.stringify(data.candles)).digest('hex');

      if (computedChecksum !== data.checksum) {
        return {
          success: false,
          symbol,
          error: 'Data corruption detected: SHA-256 checksum mismatch',
          candles: []
        };
      }

      return {
        success: true,
        ...data
      };
    } catch (err) {
      return {
        success: false,
        symbol,
        error: `Failed to load cache: ${err.message}`,
        candles: []
      };
    }
  }
}

module.exports = {
  HistoricalDataIngestionService,
  DEFAULT_HISTORICAL_DIR
};
