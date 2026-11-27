/**
 * 🦅 GARUDA ALPHA-QUANT — MISSION AQ-003
 * Phase 3: Fresh Market Data Validator (Anti-Lookahead & Fail-Closed Freshness)
 *
 * Guarantees:
 * 1. Fetches fresh market data from public REST feeds (Binance v3 for Crypto 24/7,
 *    Yahoo Finance v8 for NSE Equities, Forex 24/5, Spot Gold GC=F proxy, Daily Swing).
 * 2. NEVER replays historical local JSON files as live market ticks.
 * 3. Strips currently-forming incomplete candle (closeTime > now) before signal analysis.
 * 4. Validates timestamp monotonicity, OHLC structural completeness, and staleness bounds.
 * 5. Fails closed (status: 'STALE' | 'MARKET_CLOSED' | 'UNAVAILABLE') if feed is stale or down.
 */

const { MarketDataFeed } = require('./marketDataFeed');

const INTERVAL_MS = Object.freeze({
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000
});

class AQ003MarketDataValidator {
  constructor(options = {}) {
    this.marketDataFeed = options.marketDataFeed || new MarketDataFeed();
    // Max allowed age of latest tick/closed bar before failing closed
    this.maxTickStaleSeconds = options.maxTickStaleSeconds || 90;
    this.maxIntradayBarStaleSeconds = options.maxIntradayBarStaleSeconds || 900; // 15m tolerance for 5m closed bar + Yahoo delay
    this.maxDailyBarStaleSeconds = options.maxDailyBarStaleSeconds || (96 * 3600); // Weekend + holiday tolerance for daily CNC
    this.fetchFn = options.fetchFn || global.fetch;
  }

  getMarketSessionState(now = new Date()) {
    const utcDay = now.getUTCDay();
    const utcHour = now.getUTCHours();
    const totalMinutesIST = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;

    // NSE Equity MIS/CNC session: Mon-Fri 09:15 (555) to 15:30 (930) IST
    const isWeekdayIST = (() => {
      // Shift UTC by +5:30 to get IST day of week
      const istDate = new Date(now.getTime() + (330 * 60 * 1000));
      const istDay = istDate.getUTCDay();
      return istDay >= 1 && istDay <= 5;
    })();
    const isIndiaOpen = isWeekdayIST && totalMinutesIST >= 555 && totalMinutesIST <= 930;
    const isIndiaEntryOpen = isWeekdayIST && totalMinutesIST >= 555 && totalMinutesIST <= 885; // 09:15 - 14:45 IST

    // Forex 24/5: Sun 21:00 UTC -> Fri 20:00 UTC (with Friday 20:00 UTC weekend gap cutoff)
    const isForexOpen = !((utcDay === 5 && utcHour >= 20) || utcDay === 6 || (utcDay === 0 && utcHour < 21));

    // Crypto 24/7/365
    const isCryptoOpen = true;

    return {
      evaluatedAt: now.toISOString(),
      isIndiaOpen,
      isIndiaEntryOpen,
      isForexOpen,
      isCryptoOpen,
      istMinutesOfDay: totalMinutesIST,
      utcDay,
      utcHour
    };
  }

  /**
   * Validate OHLC array structure, monotonic timestamps, and separate completed bars from forming bar.
   */
  validateCandles(candles, interval = '5m', nowMs = Date.now(), maxBarAgeSeconds = this.maxIntradayBarStaleSeconds) {
    if (!Array.isArray(candles) || candles.length === 0) {
      return { valid: false, code: 'EMPTY_CANDLE_SERIES', reason: 'No candles returned from provider', closedCandles: [], latestPrice: null };
    }

    const barMs = INTERVAL_MS[interval] || (5 * 60 * 1000);
    const sanitized = [];
    let prevTs = -1;

    for (const c of candles) {
      const tsMs = c.time instanceof Date ? c.time.getTime() : (typeof c.timestamp === 'number' ? (c.timestamp > 1e12 ? c.timestamp : c.timestamp * 1000) : NaN);
      const open = Number(c.open);
      const high = Number(c.high);
      const low = Number(c.low);
      const close = Number(c.close);
      const volume = Number(c.volume || 0);

      if (!Number.isFinite(tsMs) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
        return { valid: false, code: 'NON_FINITE_OHLC', reason: 'Candle contains NaN or non-finite OHLC values', closedCandles: [], latestPrice: null };
      }
      if (open <= 0 || high <= 0 || low <= 0 || close <= 0 || high < low || high < Math.max(open, close) || low > Math.min(open, close)) {
        return { valid: false, code: 'CORRUPTED_OHLC_GEOMETRY', reason: `Invalid OHLC bounds at ${new Date(tsMs).toISOString()}`, closedCandles: [], latestPrice: null };
      }
      if (tsMs <= prevTs) {
        return { valid: false, code: 'NON_MONOTONIC_TIMESTAMPS', reason: `Duplicate or out-of-order candle timestamp at ${new Date(tsMs).toISOString()}`, closedCandles: [], latestPrice: null };
      }
      prevTs = tsMs;

      const closeTimeMs = c.closeTimeMs != null ? Number(c.closeTimeMs) : (tsMs + barMs - 1);
      sanitized.push({
        time: new Date(tsMs),
        timestamp: Math.floor(tsMs / 1000),
        timestampMs: tsMs,
        closeTimeMs,
        isComplete: closeTimeMs <= nowMs,
        open,
        high,
        low,
        close,
        volume: Number.isFinite(volume) ? volume : 0
      });
    }

    // Strict Anti-Lookahead: Signal evaluation uses ONLY closed/completed candles
    const closedCandles = sanitized.filter(c => c.isComplete);
    const formingCandle = sanitized.find(c => !c.isComplete) || null;
    const lastBar = sanitized[sanitized.length - 1];
    const lastClosed = closedCandles.length > 0 ? closedCandles[closedCandles.length - 1] : null;

    if (!lastClosed || closedCandles.length < 30) {
      return {
        valid: false,
        code: 'INSUFFICIENT_COMPLETED_CANDLES',
        reason: `Only ${closedCandles.length} completed candles available (minimum 30 required)`,
        closedCandles,
        formingCandle,
        latestPrice: lastBar.close
      };
    }

    const latestTimestampMs = formingCandle ? formingCandle.timestampMs : lastClosed.closeTimeMs;
    const ageSeconds = Math.max(0, Number(((nowMs - latestTimestampMs) / 1000).toFixed(2)));
    const closedBarAgeSeconds = Math.max(0, Number(((nowMs - lastClosed.closeTimeMs) / 1000).toFixed(2)));

    if (closedBarAgeSeconds > maxBarAgeSeconds) {
      return {
        valid: false,
        code: 'MARKET_DATA_STALE',
        reason: `Latest closed candle is ${closedBarAgeSeconds}s old (> ${maxBarAgeSeconds}s limit)`,
        closedCandles,
        formingCandle,
        latestPrice: lastBar.close,
        ageSeconds,
        closedBarAgeSeconds,
        latestBarTimestamp: new Date(lastClosed.timestampMs).toISOString()
      };
    }

    // Realistic next-available execution price: open of forming bar (next bar open) or latest tick
    const nextExecutionPrice = formingCandle ? formingCandle.open : lastBar.close;

    return {
      valid: true,
      code: 'FRESH_VERIFIED',
      closedCandles,
      formingCandle,
      latestPrice: lastBar.close,
      nextExecutionPrice,
      ageSeconds,
      closedBarAgeSeconds,
      latestBarTimestamp: new Date(lastClosed.timestampMs).toISOString(),
      executionTimestamp: new Date(formingCandle ? formingCandle.timestampMs : nowMs).toISOString()
    };
  }

  async fetchFreshBinanceData(symbol, interval = '5m', limit = 120, nowMs = Date.now()) {
    const klineEndpoints = [
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    ];
    const tickerEndpoints = [
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${symbol}`
    ];

    let rawKlines = null;
    let providerUsed = null;
    for (const url of klineEndpoints) {
      try {
        const res = await this.fetchFn(url, { headers: { 'User-Agent': 'GARUDA-AQ003/1.0' }, signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          rawKlines = await res.json();
          providerUsed = url.includes('binance.vision') ? 'BINANCE_VISION_REST' : 'BINANCE_REST_V3';
          break;
        }
      } catch (e) {}
    }

    if (!Array.isArray(rawKlines)) {
      return { valid: false, isLive: false, dataFreshness: 'UNAVAILABLE', code: 'BINANCE_UNREACHABLE', symbol, dataSource: 'BINANCE_DISCONNECTED' };
    }

    const candles = rawKlines.map(c => ({
      time: new Date(c[0]),
      timestamp: Math.floor(c[0] / 1000),
      closeTimeMs: Number(c[6]),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5])
    }));

    const validation = this.validateCandles(candles, interval, nowMs, this.maxIntradayBarStaleSeconds);

    // Fetch live ticker for fresh mark-to-market & tick age check
    let liveTick = null;
    for (const url of tickerEndpoints) {
      try {
        const res = await this.fetchFn(url, { headers: { 'User-Agent': 'GARUDA-AQ003/1.0' }, signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const t = await res.json();
          const tickAgeSec = Math.max(0, Number(((nowMs - Number(t.closeTime)) / 1000).toFixed(2)));
          liveTick = {
            price: parseFloat(t.lastPrice),
            closeTimeMs: Number(t.closeTime),
            tickAgeSeconds: tickAgeSec
          };
          break;
        }
      } catch (e) {}
    }

    if (liveTick && liveTick.tickAgeSeconds > this.maxTickStaleSeconds) {
      return {
        ...validation,
        valid: false,
        isLive: false,
        dataFreshness: 'STALE',
        code: 'TICK_STALE',
        reason: `Binance live tick age ${liveTick.tickAgeSeconds}s exceeds ${this.maxTickStaleSeconds}s`,
        symbol,
        dataSource: providerUsed
      };
    }

    const enrichedClosed = validation.closedCandles.length >= 28
      ? this.marketDataFeed.enrichIndicators(validation.closedCandles)
      : [];

    return {
      ...validation,
      symbol,
      isLive: validation.valid,
      dataFreshness: validation.valid ? 'REALTIME_TICK' : validation.code,
      dataSource: providerUsed,
      livePrice: liveTick ? liveTick.price : validation.latestPrice,
      tickAgeSeconds: liveTick ? liveTick.tickAgeSeconds : validation.ageSeconds,
      enrichedClosedCandles: enrichedClosed
    };
  }

  async fetchFreshYahooData(symbol, interval = '5m', range = '5d', options = {}) {
    const nowMs = options.nowMs || Date.now();
    const isDaily = interval === '1d';
    const maxStale = options.maxBarAgeSeconds || (isDaily ? this.maxDailyBarStaleSeconds : this.maxIntradayBarStaleSeconds);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

    try {
      const res = await this.fetchFn(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) {
        return { valid: false, isLive: false, dataFreshness: 'UNAVAILABLE', code: `YAHOO_HTTP_${res.status}`, symbol, dataSource: 'YAHOO_FINANCE_V8' };
      }
      const data = await res.json();
      const r = data?.chart?.result?.[0];
      if (!r || !Array.isArray(r.timestamp) || !r.indicators?.quote?.[0]) {
        return { valid: false, isLive: false, dataFreshness: 'UNAVAILABLE', code: 'EMPTY_YAHOO_PAYLOAD', symbol, dataSource: 'YAHOO_FINANCE_V8' };
      }

      const tsList = r.timestamp;
      const q = r.indicators.quote[0];
      const barMs = INTERVAL_MS[interval] || (5 * 60 * 1000);
      const candles = [];
      for (let i = 0; i < tsList.length; i++) {
        if (q.open[i] != null && q.high[i] != null && q.low[i] != null && q.close[i] != null) {
          const tsMs = tsList[i] * 1000;
          candles.push({
            time: new Date(tsMs),
            timestamp: tsList[i],
            closeTimeMs: tsMs + barMs - 1,
            open: Number(q.open[i].toFixed(4)),
            high: Number(q.high[i].toFixed(4)),
            low: Number(q.low[i].toFixed(4)),
            close: Number(q.close[i].toFixed(4)),
            volume: q.volume[i] || 0
          });
        }
      }

      const validation = this.validateCandles(candles, interval, nowMs, maxStale);
      const marketPrice = r.meta?.regularMarketPrice || validation.latestPrice;
      const marketTimeMs = r.meta?.regularMarketTime ? r.meta.regularMarketTime * 1000 : null;
      const tickAgeSeconds = marketTimeMs ? Math.max(0, Number(((nowMs - marketTimeMs) / 1000).toFixed(2))) : validation.ageSeconds;
      const enrichedClosed = validation.closedCandles.length >= 28
        ? this.marketDataFeed.enrichIndicators(validation.closedCandles)
        : [];

      return {
        ...validation,
        symbol,
        isLive: validation.valid && (options.marketOpen !== false),
        dataFreshness: options.marketOpen === false ? 'MARKET_CLOSED_EOD' : (validation.valid ? 'REALTIME_TICK' : validation.code),
        dataSource: 'YAHOO_FINANCE_V8',
        livePrice: marketPrice,
        tickAgeSeconds,
        enrichedClosedCandles: enrichedClosed
      };
    } catch (e) {
      return {
        valid: false,
        isLive: false,
        dataFreshness: 'UNAVAILABLE',
        code: 'YAHOO_FETCH_ERROR',
        reason: e.message,
        symbol,
        dataSource: 'YAHOO_FINANCE_V8'
      };
    }
  }
}

module.exports = {
  AQ003MarketDataValidator,
  INTERVAL_MS
};
