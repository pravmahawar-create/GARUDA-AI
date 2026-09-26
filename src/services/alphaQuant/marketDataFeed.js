/**
 * 🦅 GARUDA Alpha-Quant: Market Data Feed & Technical Indicators Engine
 * Fetches real-time / historical candlestick data for NSE/BSE securities
 * and computes institutional-grade technical indicators.
 */

const https = require('https');

// Top liquid Nifty 50 securities for high-probability trading
const DEFAULT_SYMBOLS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy/Retail' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure' }
];

const BENCHMARK_SYMBOL = '^NSEI'; // Nifty 50 Index

class MarketDataFeed {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Fetch 5-minute candlestick chart from Yahoo Finance API
   */
  async fetchCandles(symbol, interval = '5m', range = '5d') {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status} fetching ${symbol}`);
      }
      
      const data = await res.json();
      const r = data.chart?.result?.[0];
      if (!r || !r.timestamp) {
        return [];
      }

      const timestamps = r.timestamp;
      const q = r.indicators.quote[0];
      const candles = [];

      for (let i = 0; i < timestamps.length; i++) {
        if (q.open[i] != null && q.close[i] != null && q.high[i] != null && q.low[i] != null) {
          candles.push({
            time: new Date(timestamps[i] * 1000),
            timestamp: timestamps[i],
            open: Number(q.open[i].toFixed(2)),
            high: Number(q.high[i].toFixed(2)),
            low: Number(q.low[i].toFixed(2)),
            close: Number(q.close[i].toFixed(2)),
            volume: q.volume[i] || 0
          });
        }
      }

      return candles;
    } catch (err) {
      console.warn(`[MarketDataFeed] Failed to fetch candles for ${symbol}:`, err.message);
      return [];
    }
  }

  /**
   * Calculate Simple Moving Average (SMA)
   */
  calculateSMA(values, period) {
    const sma = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        sma.push(null);
        continue;
      }
      const slice = values.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      sma.push(Number((sum / period).toFixed(2)));
    }
    return sma;
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  calculateEMA(values, period) {
    const ema = [];
    const k = 2 / (period + 1);
    let prevEma = null;

    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        ema.push(null);
        continue;
      }
      if (prevEma === null) {
        const slice = values.slice(i - period + 1, i + 1);
        prevEma = slice.reduce((a, b) => a + b, 0) / period;
        ema.push(Number(prevEma.toFixed(2)));
        continue;
      }
      prevEma = (values[i] - prevEma) * k + prevEma;
      ema.push(Number(prevEma.toFixed(2)));
    }
    return ema;
  }

  /**
   * Calculate Relative Strength Index (RSI 14)
   */
  calculateRSI(closes, period = 14) {
    const rsi = [];
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < closes.length; i++) {
      if (i === 0) {
        rsi.push(null);
        continue;
      }

      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      if (i <= period) {
        gains += gain;
        losses += loss;
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          rsi.push(Number((100 - (100 / (1 + rs))).toFixed(2)));
        } else {
          rsi.push(null);
        }
      } else {
        const prevAvgGain = ((rsi[i - 1] === null ? gains / period : (gains * (period - 1) + gain) / period));
        // Wilder's smoothing
        gains = (gains * (period - 1) + gain) / period;
        losses = (losses * (period - 1) + loss) / period;
        const rs = losses === 0 ? 100 : gains / losses;
        rsi.push(Number((100 - (100 / (1 + rs))).toFixed(2)));
      }
    }
    return rsi;
  }

  /**
   * Calculate MACD (12, 26, 9)
   */
  calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);
    const macdLine = [];

    for (let i = 0; i < closes.length; i++) {
      if (fastEMA[i] === null || slowEMA[i] === null) {
        macdLine.push(null);
      } else {
        macdLine.push(Number((fastEMA[i] - slowEMA[i]).toFixed(2)));
      }
    }

    // Filter valid MACD values to compute Signal Line
    const validStartIndex = macdLine.findIndex(v => v !== null);
    const validMacdValues = macdLine.slice(validStartIndex);
    const signalValues = this.calculateEMA(validMacdValues, signalPeriod);

    const signalLine = new Array(validStartIndex).fill(null).concat(signalValues);
    const histogram = [];

    for (let i = 0; i < closes.length; i++) {
      if (macdLine[i] === null || signalLine[i] === null) {
        histogram.push(null);
      } else {
        histogram.push(Number((macdLine[i] - signalLine[i]).toFixed(2)));
      }
    }

    return { macdLine, signalLine, histogram };
  }

  /**
   * Calculate Session Volume Weighted Average Price (VWAP)
   */
  calculateVWAP(candles) {
    const vwap = [];
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    let currentDay = null;

    for (const c of candles) {
      const candleDay = c.time.toDateString();
      if (candleDay !== currentDay) {
        // Reset VWAP at start of each trading session
        currentDay = candleDay;
        cumulativeTPV = 0;
        cumulativeVolume = 0;
      }

      const typicalPrice = (c.high + c.low + c.close) / 3;
      cumulativeTPV += typicalPrice * c.volume;
      cumulativeVolume += c.volume;

      if (cumulativeVolume === 0) {
        vwap.push(c.close);
      } else {
        vwap.push(Number((cumulativeTPV / cumulativeVolume).toFixed(2)));
      }
    }

    return vwap;
  }

  /**
   * Calculate Average True Range (ATR 14) for volatility & stop-loss
   */
  calculateATR(candles, period = 14) {
    const atr = [];
    const trueRanges = [];

    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        trueRanges.push(candles[i].high - candles[i].low);
        atr.push(null);
        continue;
      }

      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      trueRanges.push(tr);

      if (i < period) {
        atr.push(null);
      } else if (i === period) {
        const sum = trueRanges.slice(1, period + 1).reduce((a, b) => a + b, 0);
        atr.push(Number((sum / period).toFixed(2)));
      } else {
        const prevAtr = atr[i - 1];
        const currentAtr = (prevAtr * (period - 1) + tr) / period;
        atr.push(Number(currentAtr.toFixed(2)));
      }
    }

    return atr;
  }

  /**
   * Calculate Average Directional Index (ADX 14) for trend strength & chop filter
   */
  calculateADX(candles, period = 14) {
    if (candles.length < period * 2) return new Array(candles.length).fill(null);

    const tr = [];
    const plusDM = [];
    const minusDM = [];

    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        tr.push(candles[i].high - candles[i].low);
        plusDM.push(0);
        minusDM.push(0);
        continue;
      }

      const highDiff = candles[i].high - candles[i - 1].high;
      const lowDiff = candles[i - 1].low - candles[i].low;

      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

      const trueRange = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      tr.push(trueRange);
    }

    const adx = new Array(candles.length).fill(null);
    let smoothedTR = 0;
    let smoothedPlusDM = 0;
    let smoothedMinusDM = 0;

    for (let i = 1; i <= period; i++) {
      smoothedTR += tr[i];
      smoothedPlusDM += plusDM[i];
      smoothedMinusDM += minusDM[i];
    }

    const dx = new Array(candles.length).fill(null);

    for (let i = period; i < candles.length; i++) {
      if (i > period) {
        smoothedTR = smoothedTR - (smoothedTR / period) + tr[i];
        smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i];
        smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i];
      }

      const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
      const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
      const diSum = plusDI + minusDI;
      const currentDX = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
      dx[i] = currentDX;

      if (i === period * 2 - 1) {
        const sumDX = dx.slice(period, period * 2).reduce((a, b) => a + b, 0);
        adx[i] = Number((sumDX / period).toFixed(2));
      } else if (i >= period * 2) {
        const prevADX = adx[i - 1];
        adx[i] = Number(((prevADX * (period - 1) + currentDX) / period).toFixed(2));
      }
    }

    return adx;
  }

  /**
   * Enrich raw candles with full technical indicators
   */
  enrichIndicators(candles) {
    if (candles.length < 50) return [];

    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);

    const ema9 = this.calculateEMA(closes, 9);
    const ema21 = this.calculateEMA(closes, 21);
    const ema50 = this.calculateEMA(closes, 50);
    const ema200 = this.calculateEMA(closes, Math.min(200, Math.floor(closes.length * 0.75)));
    const rsi = this.calculateRSI(closes, 14);
    const { macdLine, signalLine, histogram } = this.calculateMACD(closes, 12, 26, 9);
    const volumeSMA = this.calculateSMA(volumes, 20);
    const vwap = this.calculateVWAP(candles);
    const atr = this.calculateATR(candles, 14);
    const adx = this.calculateADX(candles, 14);

    return candles.map((c, i) => ({
      ...c,
      ema9: ema9[i],
      ema21: ema21[i],
      ema50: ema50[i],
      ema200: ema200[i],
      rsi: rsi[i],
      macd: macdLine[i],
      macdSignal: signalLine[i],
      macdHist: histogram[i],
      volumeSMA: volumeSMA[i],
      volumeRatio: volumeSMA[i] && volumeSMA[i] > 0 ? Number((c.volume / volumeSMA[i]).toFixed(2)) : 1.0,
      vwap: vwap[i],
      atr: atr[i],
      adx: adx[i]
    }));
  }
}

module.exports = {
  MarketDataFeed,
  DEFAULT_SYMBOLS,
  BENCHMARK_SYMBOL
};
