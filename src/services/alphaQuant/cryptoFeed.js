/**
 * 🦅 GARUDA Alpha-Quant: Crypto 24/7/365 Data Feed
 * Streams live real-time tick data for BTC/USDT, ETH/USDT, SOL/USDT
 * via Binance Public REST API with Yahoo Finance fallback.
 */

const { MarketDataFeed } = require('./marketDataFeed');

const CRYPTO_PAIRS = [
  { symbol: 'BTCUSDT', yahooSymbol: 'BTC-USD', name: 'Bitcoin', assetClass: 'Crypto' },
  { symbol: 'ETHUSDT', yahooSymbol: 'ETH-USD', name: 'Ethereum', assetClass: 'Crypto' },
  { symbol: 'SOLUSDT', yahooSymbol: 'SOL-USD', name: 'Solana', assetClass: 'Crypto' }
];

class CryptoFeed {
  constructor() {
    this.marketDataFeed = new MarketDataFeed();
  }

  /**
   * Fetch 5-minute candles from Binance public API
   */
  async fetchBinanceCandles(symbol, interval = '5m', limit = 100) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'GARUDA-Quant/1.0' } });
      if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
      const raw = await res.json();
      
      const candles = raw.map(c => ({
        time: new Date(c[0]),
        timestamp: Math.floor(c[0] / 1000),
        open: Number(parseFloat(c[1]).toFixed(2)),
        high: Number(parseFloat(c[2]).toFixed(2)),
        low: Number(parseFloat(c[3]).toFixed(2)),
        close: Number(parseFloat(c[4]).toFixed(2)),
        volume: Number(parseFloat(c[5]).toFixed(4))
      }));

      return candles;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch candles with automatic Yahoo Finance fallback
   */
  async fetchCandles(pairObj, interval = '5m', range = '5d') {
    // 1. Try Binance
    const binanceCandles = await this.fetchBinanceCandles(pairObj.symbol, interval, 120);
    if (binanceCandles && binanceCandles.length >= 50) {
      return binanceCandles;
    }

    // 2. Fallback to Yahoo Finance
    return this.marketDataFeed.fetchCandles(pairObj.yahooSymbol, interval, range);
  }

  /**
   * Enrich crypto candles with technical indicators
   */
  enrichIndicators(candles) {
    return this.marketDataFeed.enrichIndicators(candles);
  }
}

module.exports = {
  CryptoFeed,
  CRYPTO_PAIRS
};
