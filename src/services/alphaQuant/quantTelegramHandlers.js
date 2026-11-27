/**
 * 🦅 GARUDA Alpha-Quant: Telegram Command Center Handlers
 * Dedicated handlers for all quantitative and market intelligence commands:
 * /quant, /nifty, /stocks, /bullish, /bearish, /leaders, /laggards,
 * /pulse, /crypto, /forex, /killswitch
 */

const { MarketDataFeed, BENCHMARK_SYMBOL } = require('./marketDataFeed');
const { ConfluenceScorer } = require('./confluenceScorer');
const { OptionChainRadar } = require('./optionChainRadar');
const { DerivativesMath } = require('./derivativesMath');
const { AlphaPotentialAgent } = require('./alphaPotentialAgent');
const { ForexFeed, FOREX_PAIRS } = require('./forexFeed');
const { GlobalQuantSwarm } = require('./globalQuantSwarm');
const { Global24x7QuantDaemon } = require('./global24x7QuantDaemon');
const { defaultBroadMarketScanner } = require('./broadMarketScanner');
const { defaultCloudScheduler } = require('./quantCloudScheduler');
const { defaultPersistenceService } = require('./quantPersistenceService');

const globalSwarm = new GlobalQuantSwarm();
const daemon24x7 = new Global24x7QuantDaemon({ minConfidenceThreshold: 80 });
const dataFeed = new MarketDataFeed();
const scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 });
const optionRadar = new OptionChainRadar();
const potentialAgent = new AlphaPotentialAgent();
const forexFeed = new ForexFeed();

const REGULATORY_FOOTER = 
`\n─────────────────────────
🛡️ *GARUDA Risk Governance*: Virtual Paper-Trade Active. Capital 100% Protected.
⚠️ *Educational Simulation Only*: Not SEBI registered investment advice. 9 out of 10 individual traders in equity F&O incur net financial losses.`;

/**
 * /quant — Master Quantitative Swarm Cockpit
 */
async function handleQuantSummary() {
  try {
    const status = daemon24x7.getStatus();
    const active = status.activeMarkets;
    const wallet = status.wallet;
    const stats = status.stats;

    let msg = `🦅 *GARUDA Alpha-Quant: Master Cockpit* 🦅\n`;
    msg += `Active Universe: *Universe #12 (Finance Universe)*\n`;
    msg += `─────────────────────────\n\n`;

    msg += `💼 *Virtual Paper Portfolio*:\n`;
    msg += `• Current Balance: *₹${Number((wallet.cash || 100000).toFixed(2)).toLocaleString('en-IN')}*\n`;
    msg += `• Realized P&L: *${(wallet.realizedPnl || 0) >= 0 ? '+' : ''}₹${Number((wallet.realizedPnl || 0).toFixed(2)).toLocaleString('en-IN')}*\n`;
    msg += `• Win Rate: *${stats.winRatePercent || 0}%* (${stats.winCount || 0}W / ${stats.lossCount || 0}L)\n`;
    msg += `• Open Positions: *${status.openPositions ? status.openPositions.length : 0} active*\n\n`;

    msg += `🌐 *Active 24/7 Swarm Desks*:\n`;
    msg += `• 🇮🇳 Indian Equities (NSE): *${active.isIndiaOpen ? '🟢 LIVE (Trading Hours)' : '⏸️ CLOSED (Opens Mon-Fri 09:15 AM)'}*\n`;
    msg += `• 🌍 Global Forex 24/5: *${active.isForexOpen ? '🟢 LIVE (London/NY)' : '⏸️ WEEKEND STANDBY'}*\n`;
    msg += `• 🪙 Crypto 24/7/365: *🟢 ACTIVE NON-STOP*\n\n`;

    msg += `🔒 *Risk Governance & Circuit Breakers*:\n`;
    msg += `• Daily Profit Lock: *+₹${status.dailyProfitTargetInr.toLocaleString('en-IN')}* [${status.isProfitLockedToday ? '🔒 LOCKED' : 'OPEN'}]\n`;
    msg += `• Daily Loss Limit: *-₹${status.dailyMaxLossInr.toLocaleString('en-IN')}* [${status.isLossLockedToday ? '🛑 DEFENSE LOCKED' : 'OPEN'}]\n`;
    msg += `• Sovereign Kill Switch: *${status.isEmergencyPaused ? '🛑 ENGAGED (Paused)' : '✅ DISENGAGED (Operational)'}*\n`;

    msg += REGULATORY_FOOTER;
    return { success: true, command: 'quant', message: msg };
  } catch (err) {
    return { success: false, command: 'quant', message: `[Quant Error] Failed to fetch cockpit status: ${err.message}` };
  }
}

/**
 * /nifty — Live Nifty 50 Spot, SuperTrend & ATM Options Strategy
 */
async function handleNiftyQuant() {
  try {
    const rawCandles = await dataFeed.fetchCandles(BENCHMARK_SYMBOL, '5m', '2d');
    if (!rawCandles || rawCandles.length < 25) {
      return { success: false, command: 'nifty', message: '⚠️ Market data feed connection delay. Nifty 50 tick candles currently refreshing.' };
    }

    const enriched = dataFeed.enrichIndicators(rawCandles);
    const curr = enriched[enriched.length - 1];
    const prev = enriched[enriched.length - 2];
    const history = enriched.slice(-25, -1);

    const vixData = await dataFeed.fetchIndiaVix();
    const macro15m = await dataFeed.fetchMacro15mTrend();
    const optionChain = optionRadar.evaluateOptionChain(curr.close, { vix: vixData.vix, macroTrend: macro15m.macroTrend });
    const signal = scorer.evaluateSetup(curr, history, curr, { is24x7: false, optionChain });

    // Strike & Black-Scholes Greeks
    const strikeInterval = curr.close > 35000 ? 100 : 50;
    const atmStrike = Math.round(curr.close / strikeInterval) * strikeInterval;
    const tYears = DerivativesMath.calculateDaysToWeeklyExpiry(curr.time);
    const iv = (vixData.vix || 14.5) / 100.0;

    const callPrice = DerivativesMath.blackScholesPrice(curr.close, atmStrike, tYears, iv, 0.065, 'CE');
    const putPrice = DerivativesMath.blackScholesPrice(curr.close, atmStrike, tYears, iv, 0.065, 'PE');
    const rr = DerivativesMath.calculateDynamicRiskReward(curr.close, curr.atr, 0.52, vixData.vix);

    let msg = `🦅 *GARUDA NIFTY 50 OPTIONS SNIPER* 🦅\n`;
    msg += `📅 *LTP*: *₹${curr.close}* | SuperTrend (7,3): *₹${curr.supertrend}* [${curr.supertrendDirection}]\n`;
    msg += `🧭 *15m Macro Tide*: ${macro15m.macroTrend} (${macro15m.confidence}% conviction)\n`;
    msg += `⚡ *India VIX*: ${vixData.vix} [${vixData.regime}]\n`;
    msg += `─────────────────────────\n\n`;

    msg += `🎯 *ATM Contracts (${atmStrike} Strike)*:\n`;
    msg += `• *NIFTY ${atmStrike} CE*: ~₹${callPrice} (Delta: +0.52)\n`;
    msg += `• *NIFTY ${atmStrike} PE*: ~₹${putPrice} (Delta: -0.48)\n\n`;

    msg += `⚖️ *Dynamic Sniper Targets (1 Lot = 25 Qty)*:\n`;
    msg += `• Stop-Loss: *${rr.optionSlPoints} pts* (~₹${Math.round(rr.optionSlPoints * 25)} max risk)\n`;
    msg += `• Target 1: *+${rr.optionTarget1Points} pts* (Trail SL to Cost + 1.5pt)\n`;
    msg += `• Target 2: *+${rr.optionTarget2Points} pts* (+₹${Math.round(rr.optionTarget2Points * 25)} profit)\n`;
    msg += `• Monster Runner: *+${rr.optionMonsterPoints} pts* (+₹${Math.round(rr.optionMonsterPoints * 25)} jackpot)\n\n`;

    msg += `📊 *Confluence Setup*: *${signal.score}%* [${signal.direction}]\n`;
    msg += `• PCR (Synthetic Model): *${optionChain.pcr}* [${optionChain.sentiment}]\n`;
    msg += `• Key Call Wall: ₹${optionChain.callResistanceWall} | Put Base: ₹${optionChain.putSupportWall}\n`;

    msg += REGULATORY_FOOTER;
    return { success: true, command: 'nifty', message: msg };
  } catch (err) {
    return { success: false, command: 'nifty', message: `[Nifty Error] ${err.message}` };
  }
}

/**
 * /stocks — Broad Market Multi-Cap Radar Summary
 */
async function handleStocksScanner() {
  try {
    const scanResult = await defaultBroadMarketScanner.scan();
    const msg = defaultBroadMarketScanner.formatTelegramReport('STOCKS', scanResult);
    return { success: true, command: 'stocks', message: msg + REGULATORY_FOOTER };
  } catch (err) {
    return { success: false, command: 'stocks', message: `[Scanner Error] ${err.message}` };
  }
}

/**
 * /bullish — Top Bullish Breakouts across Large, Mid & Small Cap
 */
async function handleBullishStocks() {
  try {
    const scanResult = await defaultBroadMarketScanner.scan();
    const msg = defaultBroadMarketScanner.formatTelegramReport('BULLISH', scanResult);
    return { success: true, command: 'bullish', message: msg + REGULATORY_FOOTER };
  } catch (err) {
    return { success: false, command: 'bullish', message: `[Bullish Error] ${err.message}` };
  }
}

/**
 * /bearish — Top Bearish Breakdowns
 */
async function handleBearishStocks() {
  try {
    const scanResult = await defaultBroadMarketScanner.scan();
    const msg = defaultBroadMarketScanner.formatTelegramReport('BEARISH', scanResult);
    return { success: true, command: 'bearish', message: msg + REGULATORY_FOOTER };
  } catch (err) {
    return { success: false, command: 'bearish', message: `[Bearish Error] ${err.message}` };
  }
}

/**
 * /leaders & /laggards — Sector Momentum & Relative Strength
 */
async function handleSectorLeaders() {
  try {
    const scanResult = await defaultBroadMarketScanner.scan();
    const msg = defaultBroadMarketScanner.formatTelegramReport('LEADERS', scanResult);
    return { success: true, command: 'leaders', message: msg + REGULATORY_FOOTER };
  } catch (err) {
    return { success: false, command: 'leaders', message: `[Leaders Error] ${err.message}` };
  }
}

async function handleSectorLaggards() {
  try {
    const scanResult = await defaultBroadMarketScanner.scan();
    const msg = defaultBroadMarketScanner.formatTelegramReport('LAGGARDS', scanResult);
    return { success: true, command: 'laggards', message: msg + REGULATORY_FOOTER };
  } catch (err) {
    return { success: false, command: 'laggards', message: `[Laggards Error] ${err.message}` };
  }
}

/**
 * /pulse — 1-Tap Trigger for Immediate Morning Market Intelligence Dispatch
 */
async function handlePulseDispatch(params = {}) {
  try {
    const force = params.force === true || (params.raw && /force/i.test(params.raw));
    const result = await defaultCloudScheduler.triggerNow(force);

    let msg = `🦅 *GARUDA Autonomous Market Pulse Triggered* 🦅\n\n`;
    if (result.alreadyDispatchedToday) {
      msg += `ℹ️ ${result.message}\n`;
      msg += `Last Dispatched: *${result.lastConfirmation?.sentAt || 'Today'}* (${result.dateKey})`;
    } else if (result.success) {
      msg += `✅ *Delivery Confirmed to Telegram!*\n`;
      msg += `• Date: *${result.delivery.dateKey}*\n`;
      msg += `• Sent At: *${result.delivery.sentAt}*\n`;
      msg += `• Attempts: *${result.delivery.attempts}*\n`;
      msg += `• Status: *${result.delivery.status}*\n\n`;
      msg += `Complete market dossier with Crypto Gems, Penny Moonshots, Forex & Macro VIX dispatched to your chat.`;
    } else {
      msg += `⚠️ Dispatch encountered an error: ${result.error || 'Check cloud logs'}`;
    }

    return { success: true, command: 'pulse', message: msg };
  } catch (err) {
    return { success: false, command: 'pulse', message: `[Pulse Error] ${err.message}` };
  }
}

/**
 * /crypto — High-Growth Crypto Gems & Sub-Rupee Penny Moonshots
 */
async function handleCryptoRadar() {
  try {
    const gems = await potentialAgent.scanPotentialOpportunities();
    const moonshots = await potentialAgent.scanSubRupeeMoonshots();

    let msg = `🪙 *GARUDA High-Alpha Crypto & Moonshot Radar* 🪙\n`;
    msg += `24/7/365 Non-Stop Autonomous Sweeps\n─────────────────────────\n\n`;

    msg += `💎 *Top Swing Accumulation Gems*:\n`;
    gems.slice(0, 3).forEach(g => {
      msg += `• *${g.name}* (\`${g.symbol}\`) — Score: *${g.convictionScore}%*\n`;
      msg += `   LTP: ${g.currentPriceInr} (${g.currentPriceUsd}) | Buy Zone: ${g.buyZoneInr}\n`;
      msg += `   Target: ${g.target1.inr} (${g.target1.gainPercent}) | Horizon: ${g.holdingHorizon}\n\n`;
    });

    msg += `🚀 *Sub-Rupee & Penny Moonshots (<₹10)*:\n`;
    msg += `_Cousin Benchmark Model: 22 Paise -> ₹18 (81.8x)_\n`;
    moonshots.slice(0, 4).forEach(m => {
      msg += `• *${m.cleanSymbol || m.symbol}*: *${m.formattedPrice}* (24h: ${m.priceChange24hPct >= 0 ? '+' : ''}${m.priceChange24hPct}%)\n`;
      msg += `   Coins in ₹10,000: *${Number(m.coinsFor10k || 0).toLocaleString('en-IN')}*\n`;
      msg += `   10x Target: ₹${m.target10xPriceInr} (₹1 Lakh value)\n\n`;
    });

    msg += REGULATORY_FOOTER;
    return { success: true, command: 'crypto', message: msg };
  } catch (err) {
    return { success: false, command: 'crypto', message: `[Crypto Error] ${err.message}` };
  }
}

/**
 * /forex — Global Currencies, Gold & Crude Oil
 */
async function handleForexRadar() {
  try {
    let msg = `🌍 *GARUDA Global Forex & Commodities Radar* 🌍\n`;
    msg += `24/5 Institutional Flow Monitoring\n─────────────────────────\n\n`;

    for (const fp of FOREX_PAIRS) {
      try {
        const candles = await forexFeed.fetchCandles(fp, '15m', '1d');
        if (candles && candles.length > 0) {
          const last = candles[candles.length - 1];
          const first = candles[0];
          const chg = Number((((last.close - first.close) / first.close) * 100).toFixed(2));
          const icon = chg >= 0 ? '🟢' : '🔴';
          msg += `• ${icon} *${fp.name}* (\`${fp.symbol}\`): *$${last.close}* (${chg >= 0 ? '+' : ''}${chg}%)\n`;
        }
      } catch (e) {}
    }

    msg += `\n🕒 Forex Session: London & New York Active\n`;
    msg += REGULATORY_FOOTER;
    return { success: true, command: 'forex', message: msg };
  } catch (err) {
    return { success: false, command: 'forex', message: `[Forex Error] ${err.message}` };
  }
}

const { defaultMarketDataConnectors } = require('./realMarketDataConnectors');

/**
 * /pcr or /options — Real NSE Option Chain & OI/PCR Intelligence
 */
async function handleOptionChain(params = {}) {
  try {
    const symbol = params.symbol || 'NIFTY';
    const chainData = await defaultMarketDataConnectors.fetchNseOptionChain(symbol);

    let msg = `⚡ *GARUDA NSE Option Chain & OI Radar (${symbol})* ⚡\n`;
    msg += `Spot Price: *₹${chainData.underlyingSpot}* | Time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n─────────────────────────\n\n`;

    msg += `📊 *Put-Call Ratio (PCR)*: *${chainData.pcr}*\n`;
    msg += `Sentiment: *${chainData.sentiment}*\n\n`;

    msg += `🧱 *Key Institutional Option Walls*:\n`;
    msg += `• 🛡️ *Put Support Floor*: *₹${chainData.putSupportWall}* (Heavy Put Writing)\n`;
    msg += `• 🛑 *Call Resistance Ceiling*: *₹${chainData.callResistanceWall}* (Call Writers Clamping)\n\n`;

    msg += `📈 *Open Interest (OI) Volume*:\n`;
    msg += `• Total Call OI: *${Number(chainData.totalCeOi || 0).toLocaleString('en-IN')}*\n`;
    msg += `• Total Put OI: *${Number(chainData.totalPeOi || 0).toLocaleString('en-IN')}*\n\n`;

    // Transparent Data Source Attribution
    const sourceIcon = chainData.isLive ? '🟢 LIVE' : '🟡 MODEL ESTIMATED';
    msg += `📡 Data Source: *${sourceIcon}* (${chainData.dataSource})\n`;
    if (chainData.notice) {
      msg += `_Note: ${chainData.notice}_\n`;
    }

    msg += REGULATORY_FOOTER;
    return { success: true, command: 'pcr', message: msg, chainData };
  } catch (err) {
    return { success: false, command: 'pcr', message: `[Option Chain Error] ${err.message}` };
  }
}

/**
 * /killswitch — Sovereign Emergency Control
 */
async function handleKillSwitch(params = {}, context = {}) {
  try {
    // 1. Authenticate Founder
    if (context && context.isFounder === false && context.founderApproved === false) {
      return {
        success: false,
        command: 'killswitch',
        unauthorized: true,
        message: `⛔ *ACCESS DENIED*: Sovereign Kill Switch controls strictly reserved for Founder Praveen Mahawar.`
      };
    }

    const raw = String(params.raw || '').toLowerCase();
    let action = 'status';

    if (raw.includes('pause') || raw.includes('stop') || raw.includes('halt') || raw.includes('off')) {
      action = 'pause';
    } else if (raw.includes('resume') || raw.includes('start') || raw.includes('on')) {
      action = 'resume';
    }

    let isPaused = daemon24x7.isEmergencyPaused;
    let message = '';

    if (action === 'pause') {
      isPaused = daemon24x7.setEmergencyPause(true);
      message = `🛑 *SOVEREIGN KILL SWITCH ENGAGED by Founder Praveen!*\n\nAll 4 autonomous trading agents (Alpha-India, Alpha-Forex, Alpha-Crypto, Alpha-Potential) have been HALTED immediately. Zero new positions will be evaluated.`;
    } else if (action === 'resume') {
      // Require explicit confirmation
      const isConfirmed = raw.includes('confirm') || params.confirmed === true;
      if (!isConfirmed) {
        return {
          success: false,
          command: 'killswitch',
          requiresConfirmation: true,
          isEmergencyPaused: isPaused,
          message: `⚠️ *SOVEREIGN KILL SWITCH: RESUME CONFIRMATION REQUIRED*\n\nKill Switch ko disengage karne aur 24/7 autonomous trading swarm ko wapas resume karne ke liye explicit pushti zaroori hai.\n\nResuming confirm karne ke liye ye command execute karein:\n👉 \`/killswitch resume confirm\``
        };
      }

      isPaused = daemon24x7.setEmergencyPause(false);
      message = `✅ *SOVEREIGN KILL SWITCH DISENGAGED by Founder Praveen!*\n\n24/7 Swarm has RESUMED normal autonomous operation across active sessions.`;
    } else {
      message = `🦅 *Sovereign Kill Switch Status*:\n\n• Current State: *${isPaused ? '🛑 ENGAGED (All Trading Halted)' : '✅ DISENGAGED (Trading Operational)'}*\n\nUsage:\n• \`/killswitch pause\` — Halt all agents immediately\n• \`/killswitch resume confirm\` — Resume normal operations (Requires confirmation)`;
    }

    return { success: true, command: 'killswitch', isEmergencyPaused: isPaused, message };
  } catch (err) {
    return { success: false, command: 'killswitch', message: `[KillSwitch Error] ${err.message}` };
  }
}

module.exports = {
  handleQuantSummary,
  handleNiftyQuant,
  handleStocksScanner,
  handleBullishStocks,
  handleBearishStocks,
  handleSectorLeaders,
  handleSectorLaggards,
  handlePulseDispatch,
  handleCryptoRadar,
  handleForexRadar,
  handleOptionChain,
  handleKillSwitch,
  REGULATORY_FOOTER
};
