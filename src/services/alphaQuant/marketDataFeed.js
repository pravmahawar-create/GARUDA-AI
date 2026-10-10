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

// Top 3 institutional heavyweights making up ~29% of Nifty 50
const HEAVYWEIGHT_SYMBOLS = [
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', weight: 11.5 },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', weight: 9.2 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', weight: 8.0 }
];

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

  /**
   * Fetch Live India VIX for dynamic volatility adaptation
   */
  async fetchIndiaVix() {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=5d`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0];
      const validCloses = quotes?.close?.filter(x => x != null) || [];
      const currentVix = validCloses.length > 0 ? Number(validCloses[validCloses.length - 1].toFixed(2)) : 14.5;

      let regime = 'NORMAL_VOLATILITY';
      let slPoints = 18.0;
      let tgt1Points = 20.0;
      let tgt2Points = 36.0;

      if (currentVix < 12.5) {
        regime = 'LOW_VOLATILITY';
        slPoints = 14.0;
        tgt1Points = 18.0;
        tgt2Points = 28.0;
      } else if (currentVix > 16.5) {
        regime = 'HIGH_VOLATILITY';
        slPoints = 24.0;
        tgt1Points = 28.0;
        tgt2Points = 54.0;
      }

      return {
        vix: currentVix,
        regime,
        recommendedSLPoints: slPoints,
        recommendedTgt1Points: tgt1Points,
        recommendedTgt2Points: tgt2Points,
        note: `VIX ${currentVix} [${regime}] -> Dynamic SL: ${slPoints} pts | Tgt: ${tgt2Points} pts`
      };
    } catch (err) {
      return {
        vix: 14.5,
        regime: 'NORMAL_VOLATILITY',
        recommendedSLPoints: 18.0,
        recommendedTgt1Points: 20.0,
        recommendedTgt2Points: 36.0,
        note: 'Default baseline volatility profile active.'
      };
    }
  }

  /**
   * Fetch 15-minute Macro Trend for Multi-Timeframe Fractal Matrix
   */
  async fetchMacro15mTrend(symbol = BENCHMARK_SYMBOL) {
    try {
      const raw15m = await this.fetchCandles(symbol, '15m', '5d');
      if (!raw15m || raw15m.length < 20) {
        return { macroTrend: 'SIDEWAYS', reason: 'Insufficient 15m data' };
      }

      const closes = raw15m.map(c => c.close);
      const ema9 = this.calculateEMA(closes, 9);
      const ema21 = this.calculateEMA(closes, 21);
      const ema50 = this.calculateEMA(closes, 50);
      const rsi = this.calculateRSI(closes, 14);

      const latest = raw15m[raw15m.length - 1];
      const curEma9 = ema9[ema9.length - 1];
      const curEma21 = ema21[ema21.length - 1];
      const curEma50 = ema50[ema50.length - 1];
      const curRsi = rsi[rsi.length - 1] || 50;

      let macroTrend = 'SIDEWAYS';
      let confidence = 50;

      if (curEma9 > curEma21 && latest.close >= curEma21 && curRsi >= 50) {
        macroTrend = 'BULLISH';
        confidence = (curEma21 > curEma50) ? 90 : 75;
      } else if (curEma9 < curEma21 && latest.close <= curEma21 && curRsi <= 50) {
        macroTrend = 'BEARISH';
        confidence = (curEma21 < curEma50) ? 90 : 75;
      }

      return {
        macroTrend,
        confidence,
        timeframe: '15m',
        close: latest.close,
        rsi: curRsi,
        ema9: curEma9,
        ema21: curEma21,
        summary: `15m Macro Trend: ${macroTrend} (${confidence}% conviction, RSI: ${curRsi})`
      };
    } catch (err) {
      return { macroTrend: 'SIDEWAYS', confidence: 50, error: err.message };
    }
  }

  /**
   * Calculate Market Breadth (Constituents Advance/Decline Ratio)
   */
  calculateMarketBreadth(constituents = []) {
    if (!constituents || constituents.length === 0) {
      return { breadth: 'NEUTRAL', advancePercent: 50, advances: 0, declines: 0 };
    }

    let advances = 0;
    let declines = 0;

    for (const c of constituents) {
      if (c.candle) {
        if (c.candle.close > c.candle.open) advances++;
        else if (c.candle.close < c.candle.open) declines++;
      }
    }

    const total = advances + declines || 1;
    const advancePercent = Math.round((advances / total) * 100);

    let breadth = 'NEUTRAL';
    if (advancePercent >= 65) breadth = 'STRONG_BULLISH';
    else if (advancePercent <= 35) breadth = 'STRONG_BEARISH';

    return {
      breadth,
      advancePercent,
      advances,
      declines,
      summary: `Market Breadth: ${advances} Advances / ${declines} Declines (${advancePercent}% Green) [${breadth}]`
    };
  }
}

module.exports = {
  MarketDataFeed,
  DEFAULT_SYMBOLS,
  HEAVYWEIGHT_SYMBOLS,
  BENCHMARK_SYMBOL
};
