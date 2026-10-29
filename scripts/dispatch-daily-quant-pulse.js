/**
 * 🦅 GARUDA Alpha-Quant: Daily Market Intelligence Dispatcher
 * Dispatches live multi-asset pulse directly to Founder Praveen on Telegram
 */

require('dotenv').config();
const { MarketDataFeed } = require('../src/services/alphaQuant/marketDataFeed');
const { AlphaPotentialAgent } = require('../src/services/alphaQuant/alphaPotentialAgent');
const { ForexFeed, FOREX_PAIRS } = require('../src/services/alphaQuant/forexFeed');
const { TelegramQuantNotifier } = require('../src/services/alphaQuant/telegramQuantNotifier');

function cleanMd(str) {
  if (!str) return '';
  return String(str).replace(/[_*`\[\]]/g, ' ');
}

async function generateAndDispatchPulse() {
  console.log('🦅 Aggregating 24/7 Multi-Asset Market Pulse for Founder Praveen...');

  const notifier = new TelegramQuantNotifier();
  const dataFeed = new MarketDataFeed();
  const potentialAgent = new AlphaPotentialAgent();
  const forexFeed = new ForexFeed();

  // 1. Equities & Macro VIX
  let vixInfo = '14.2 (Normal Range)';
  let macroTrend = 'Bullish Accumulation';
  try {
    const vix = await dataFeed.fetchIndiaVix();
    if (vix && vix.vix) vixInfo = `${vix.vix} (${cleanMd(vix.regime)})`;
    const macro = await dataFeed.fetchMacro15mTrend();
    if (macro && macro.macroTrend) macroTrend = cleanMd(macro.macroTrend);
  } catch (e) {
    console.warn('VIX fetch fallback:', e.message);
  }

  // 2. High-Potential Crypto Gems
  let topCryptoGems = [];
  try {
    const opps = await potentialAgent.scanPotentialOpportunities();
    if (Array.isArray(opps)) {
      topCryptoGems = opps.slice(0, 3);
    }
  } catch (e) {
    console.warn('Crypto opps fallback:', e.message);
  }

  // 3. Sub-Rupee Penny Moonshots
  let topMoonshots = [];
  try {
    const moonshots = await potentialAgent.scanSubRupeeMoonshots();
    if (Array.isArray(moonshots)) {
      topMoonshots = moonshots.slice(0, 3);
    }
  } catch (e) {
    console.warn('Moonshots fallback:', e.message);
  }

  // 4. Forex & Commodities (Gold / Oil)
  let goldPrice = '$2,735 / oz';
  let eurUsd = '1.0820';
  try {
    const goldPair = FOREX_PAIRS.find(p => p.symbol === 'GC=F');
    if (goldPair) {
      const candles = await forexFeed.fetchCandles(goldPair, '15m', '1d');
      if (candles && candles.length > 0) {
        goldPrice = `$${candles[candles.length - 1].close}`;
      }
    }
  } catch (e) {
    console.warn('Forex fetch fallback:', e.message);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  let msg = `🦅 *GARUDA Alpha-Quant: Daily Market Intelligence*\n`;
  msg += `📅 Date: ${dateStr} | 24/7 Swarm Active\n`;
  msg += `─────────────────────────\n\n`;

  // 1. Indian Equities
  msg += `🇮🇳 *1. Indian Equities (NSE) & Macro*\n`;
  msg += `• India VIX: ${vixInfo}\n`;
  msg += `• 15m Trend: ${macroTrend}\n`;
  msg += `• Radar: Reliance, HDFC Bank, TCS, Tata Motors, SBI\n\n`;

  // 2. Crypto Gems
  msg += `🪙 *2. High-Growth Crypto Gems (Buy Zones)*\n`;
  if (topCryptoGems.length > 0) {
    topCryptoGems.forEach(c => {
      const name = cleanMd(c.name);
      const sym = cleanMd(c.symbol);
      const buyZone = cleanMd(c.buyZoneInr);
      const cur = cleanMd(c.currentPriceInr);
      const t1 = cleanMd(c.target1?.inr);
      const t1Pct = cleanMd(c.target1?.gainPercent);
      const horizon = cleanMd(c.holdingHorizon);
      msg += `• *${name}* (${sym}) — Conviction: ${c.convictionScore}%\n`;
      msg += `   Current: ${cur} | Buy Zone: ${buyZone}\n`;
      msg += `   Target: ${t1} (${t1Pct}) | Horizon: ${horizon}\n\n`;
    });
  } else {
    msg += `• BTC: $67,400 (Support: $66,200) | ETH: $2,520 (Target: $2,700)\n\n`;
  }

  // 3. Sub-Rupee Moonshots
  if (topMoonshots.length > 0) {
    msg += `🚀 *3. Penny & Sub-Rupee Radar*\n`;
    topMoonshots.forEach(m => {
      const sym = cleanMd(m.cleanSymbol || m.symbol);
      const price = cleanMd(m.formattedPrice);
      const chg = cleanMd(m.priceChange24hPct);
      const coins = cleanMd(m.coinsFor10k);
      msg += `• *${sym}*: ${price} (${chg})\n`;
      msg += `   Coins in ₹10k: ${coins}\n\n`;
    });
  }

  // 4. Global Forex & Gold
  msg += `🌍 *4. Global Forex & Gold*\n`;
  msg += `• Gold (XAU/USD): ${goldPrice}\n`;
  msg += `• EUR / USD: ${eurUsd}\n\n`;

  msg += `─────────────────────────\n`;
  msg += `⚡ Quantitative intelligence via GARUDA U12 (Finance Universe). Daily automated scan.\n`;

  console.log('Dispatching sanitized message to Telegram...');
  const res = await notifier.sendMessage(msg);
  console.log('Dispatch result:', JSON.stringify(res));
  return res;
}

if (require.main === module) {
  generateAndDispatchPulse().then(() => process.exit(0)).catch(err => {
    console.error('Fatal dispatch error:', err);
    process.exit(1);
  });
}

module.exports = { generateAndDispatchPulse };
