/**
 * 🦅 GARUDA Alpha-Quant: Forex & Commodities 24/5 Data Feed
 * Streams real-time tick data for global currency pairs and gold/oil.
 */

const { MarketDataFeed } = require('./marketDataFeed');

const FOREX_PAIRS = [
  { symbol: 'EURUSD=X', name: 'EUR / USD', assetClass: 'Forex' },
  { symbol: 'GBPUSD=X', name: 'GBP / USD', assetClass: 'Forex' },
  { symbol: 'USDJPY=X', name: 'USD / JPY', assetClass: 'Forex' },
  { symbol: 'GC=F', name: 'Gold (XAU/USD)', assetClass: 'Commodity' },
  { symbol: 'CL=F', name: 'Crude Oil', assetClass: 'Commodity' }
];

class ForexFeed {
  constructor() {
    this.marketDataFeed = new MarketDataFeed();
  }

  async fetchCandles(pairObj, interval = '5m', range = '5d') {
    return this.marketDataFeed.fetchCandles(pairObj.symbol, interval, range);
  }

  enrichIndicators(candles) {
    return this.marketDataFeed.enrichIndicators(candles);
  }
}

module.exports = {
  ForexFeed,
  FOREX_PAIRS
};
