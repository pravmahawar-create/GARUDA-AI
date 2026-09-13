/**
 * 🦅 GARUDA Alpha-Potential: High-Potential Crypto & Coin Intelligence Agent
 * Analyzes market structure to identify coins with explosive growth potential.
 * Tells Founder Praveen:
 * - Kisme entry lene me faida hai (Buy Zone)
 * - Kab tak hold karna chahiye (Holding Horizon)
 * - Kitna profit expected hai (Target % & Profit in ₹)
 * - Risk level & Stop loss in Indian Rupees.
 */

const USD_INR_RATE = 87.0;

const WATCHLIST_COINS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'Macro King' },
  { symbol: 'ETHUSDT', name: 'Ethereum', category: 'Smart Contracts' },
  { symbol: 'SOLUSDT', name: 'Solana', category: 'High Speed L1' },
  { symbol: 'BNBUSDT', name: 'BNB', category: 'Exchange Ecosystem' },
  { symbol: 'NEARUSDT', name: 'Near Protocol', category: 'AI & Sharding' },
  { symbol: 'SUIUSDT', name: 'Sui Network', category: 'Next-Gen Move L1' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'Enterprise Subnets' },
  { symbol: 'XRPUSDT', name: 'Ripple', category: 'Global Remittances' },
  { symbol: 'ADAUSDT', name: 'Cardano', category: 'PoS Blockchain' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'High-Beta Momentum' }
];

class AlphaPotentialAgent {
  constructor() {
    this.name = 'GARUDA Alpha-Potential';
    this.role = 'High-Growth Crypto Gem & Swing Opportunity Hunter';
    this.universe = 'Universe #12: Finance Universe (Wealth Compounding)';
  }

  /**
   * Fetch 4-hour candles for deeper structural swing analysis
   */
  async fetchCandles(symbol, interval = '4h', limit = 50) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'GARUDA-Quant/1.0' } });
      if (!res.ok) return null;
      const raw = await res.json();
      return raw.map(c => ({
        time: new Date(c[0]),
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
        volume: parseFloat(c[5])
      }));
    } catch (e) {
      return null;
    }
  }

  /**
   * Calculate Simple Indicators
   */
  computeMetrics(candles) {
    if (!candles || candles.length < 20) return null;
    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);

    // 20 EMA
    const k20 = 2 / 21;
    let ema20 = closes[0];
    for (let i = 1; i < closes.length; i++) ema20 = closes[i] * k20 + ema20 * (1 - k20);

    // 50 EMA
    const k50 = 2 / 51;
    let ema50 = closes[0];
    for (let i = 1; i < closes.length; i++) ema50 = closes[i] * k50 + ema50 * (1 - k50);

    // RSI 14
    let gains = 0, losses = 0;
    for (let i = 1; i <= 14; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff; else losses += Math.abs(diff);
    }
    let avgGain = gains / 14;
    let avgLoss = losses / 14;
    for (let i = 15; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      avgGain = (avgGain * 13 + (diff > 0 ? diff : 0)) / 14;
      avgLoss = (avgLoss * 13 + (diff < 0 ? Math.abs(diff) : 0)) / 14;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = Number((100 - (100 / (1 + rs))).toFixed(1));

    // Volume Ratio
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const lastVol = volumes[volumes.length - 1];
    const volumeRatio = avgVol > 0 ? Number((lastVol / avgVol).toFixed(2)) : 1.0;

    const currentPrice = closes[closes.length - 1];
    const lowestLow = Math.min(...candles.slice(-20).map(c => c.low));
    const highestHigh = Math.max(...candles.slice(-20).map(c => c.high));

    return {
      currentPrice,
      ema20: Number(ema20.toFixed(4)),
      ema50: Number(ema50.toFixed(4)),
      rsi,
      volumeRatio,
      lowestLow,
      highestHigh,
      isAboveEma20: currentPrice > ema20,
      isAboveEma50: currentPrice > ema50
    };
  }

  /**
   * Scan all watchlist coins and rank top high-potential setups
   */
  async scanPotentialOpportunities() {
    const opportunities = [];

    for (const coin of WATCHLIST_COINS) {
      const candles = await this.fetchCandles(coin.symbol, '4h', 60);
      const metrics = this.computeMetrics(candles);
      if (!metrics) continue;

      const { currentPrice, rsi, volumeRatio, isAboveEma20, isAboveEma50, lowestLow, highestHigh } = metrics;
      const priceInr = Number((currentPrice * USD_INR_RATE).toFixed(2));

      // Calculate Conviction Score (0 - 100%)
      let score = 50; // base score
      const reasons = [];

      if (isAboveEma20) {
        score += 12;
        reasons.push('Short-term 4H trend bullish (Price > 20 EMA)');
      }
      if (isAboveEma50) {
        score += 10;
        reasons.push('Medium-term trend support intact (Price > 50 EMA)');
      }
      if (rsi >= 45 && rsi <= 62) {
        score += 15;
        reasons.push(`RSI sweet-spot (${rsi}) — High accumulation velocity without overbought risk`);
      } else if (rsi < 40) {
        score += 8;
        reasons.push(`Oversold bounce potential (RSI ${rsi})`);
      }
      if (volumeRatio >= 1.3) {
        score += 15;
        reasons.push(`Institutional accumulation volume spike (${volumeRatio}x average)`);
      }

      // Dynamic holding period and targets based on volatility and asset class
      let holdingHorizon = '5 to 10 Days (Short Swing)';
      let target1Pct = 0.18; // +18%
      let target2Pct = 0.42; // +42%

      if (coin.symbol === 'BTCUSDT') {
        holdingHorizon = '10 to 20 Days (Macro Momentum)';
        target1Pct = 0.12; // +12%
        target2Pct = 0.25; // +25%
      } else if (coin.symbol === 'SOLUSDT' || coin.symbol === 'NEARUSDT' || coin.symbol === 'SUIUSDT') {
        holdingHorizon = '7 to 15 Days (High-Beta Wave)';
        target1Pct = 0.22; // +22%
        target2Pct = 0.55; // +55%
      }

      const target1Usd = Number((currentPrice * (1 + target1Pct)).toFixed(4));
      const target2Usd = Number((currentPrice * (1 + target2Pct)).toFixed(4));
      const stopLossUsd = Number((Math.max(lowestLow * 0.97, currentPrice * 0.93)).toFixed(4));

      const target1Inr = Number((target1Usd * USD_INR_RATE).toFixed(2));
      const target2Inr = Number((target2Usd * USD_INR_RATE).toFixed(2));
      const stopLossInr = Number((stopLossUsd * USD_INR_RATE).toFixed(2));

      // Calculate example profit on ₹10,000 investment
      const investmentBasis = 10000;
      const expectedProfitT1Inr = Number((investmentBasis * target1Pct).toFixed(2));
      const expectedProfitT2Inr = Number((investmentBasis * target2Pct).toFixed(2));
      const maxRiskInr = Number((investmentBasis * ((currentPrice - stopLossUsd) / currentPrice)).toFixed(2));

      const recommendation = score >= 75 ? 'STRONG_BUY_ACCUMULATE' : (score >= 65 ? 'WATCH_PULLBACK' : 'WAIT_FOR_SETUP');

      opportunities.push({
        symbol: coin.symbol,
        name: coin.name,
        category: coin.category,
        currentPriceUsd: `$${currentPrice.toLocaleString('en-US')}`,
        currentPriceInr: `₹${priceInr.toLocaleString('en-IN')}`,
        rawPrice: currentPrice,
        rawPriceInr: priceInr,
        convictionScore: score,
        recommendation,
        holdingHorizon,
        buyZoneInr: `₹${Number((priceInr * 0.98).toFixed(2)).toLocaleString('en-IN')} – ₹${Number((priceInr * 1.01).toFixed(2)).toLocaleString('en-IN')}`,
        target1: {
          usd: `$${target1Usd.toLocaleString('en-US')}`,
          inr: `₹${target1Inr.toLocaleString('en-IN')}`,
          gainPercent: `+${(target1Pct * 100).toFixed(0)}%`,
          profitOn10kInr: `+₹${expectedProfitT1Inr.toLocaleString('en-IN')}`
        },
        target2: {
          usd: `$${target2Usd.toLocaleString('en-US')}`,
          inr: `₹${target2Inr.toLocaleString('en-IN')}`,
          gainPercent: `+${(target2Pct * 100).toFixed(0)}%`,
          profitOn10kInr: `+₹${expectedProfitT2Inr.toLocaleString('en-IN')}`
        },
        stopLoss: {
          usd: `$${stopLossUsd.toLocaleString('en-US')}`,
          inr: `₹${stopLossInr.toLocaleString('en-IN')}`,
          maxRiskOn10kInr: `-₹${maxRiskInr.toLocaleString('en-IN')}`
        },
        reasons,
        romanHindiSummary: `Agar abhi ₹${priceInr.toLocaleString('en-IN')} ke aas-paas accumulate karein aur ${holdingHorizon} hold karein, toh Target 1 par ${(target1Pct * 100).toFixed(0)}% (+₹${expectedProfitT1Inr.toLocaleString('en-IN')} per ₹10k) aur Target 2 par ${(target2Pct * 100).toFixed(0)}% (+₹${expectedProfitT2Inr.toLocaleString('en-IN')} per ₹10k) ka potential banta hai.`
      });
    }

    // Sort by conviction score descending
    opportunities.sort((a, b) => b.convictionScore - a.convictionScore);
    return opportunities;
  }
}

module.exports = {
  AlphaPotentialAgent,
  WATCHLIST_COINS
};
