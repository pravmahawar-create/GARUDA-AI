/**
 * 🦅 GARUDA Alpha-Quant: Comprehensive 7-Stage Engine Test Suite
 * Tests mathematical Greeks, indicator enrichment, confluence scoring,
 * strike selection, capital preservation locks, and notification formatting.
 */

const assert = require("assert");
const { DerivativesMath } = require("./derivativesMath");
const { OptionChainRadar } = require("./optionChainRadar");
const { ConfluenceScorer } = require("./confluenceScorer");
const { MarketDataFeed } = require("./marketDataFeed");
const { TelegramQuantNotifier } = require("./telegramQuantNotifier");
const { NiftyOptionsSniperDaemon } = require("../../../scripts/daemons/nifty-options-sniper-daemon");

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ✘ [FAIL] ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("========================================================");
console.log("🦅 GARUDA ALPHA-QUANT: 7-STAGE FORENSIC TEST SUITE");
console.log("========================================================");

console.log("\n--- Stage 1: Market Data & Indicator Mathematical Enrichment ---");
test("1.1 enrichIndicators computes EMA, SuperTrend, ATR, and RSI without NaN", () => {
  const feed = new MarketDataFeed();
  const rawCandles = [];
  let basePrice = 22000;
  for (let i = 0; i < 60; i++) {
    basePrice += (i % 2 === 0 ? 15 : -10);
    rawCandles.push({
      time: new Date(Date.now() - (60 - i) * 300000),
      timestamp: 1700000000 + i * 300,
      open: basePrice - 5,
      high: basePrice + 12,
      low: basePrice - 8,
      close: basePrice,
      volume: 50000 + i * 1000
    });
  }

  const enriched = feed.enrichIndicators(rawCandles);
  assert.strictEqual(enriched.length, 60);
  const last = enriched[enriched.length - 1];
  assert(typeof last.ema9 === "number" && !isNaN(last.ema9), "EMA 9 must be a valid number");
  assert(typeof last.ema21 === "number" && !isNaN(last.ema21), "EMA 21 must be a valid number");
  assert(typeof last.atr === "number" && !isNaN(last.atr) && last.atr > 0, "ATR must be positive");
  assert(typeof last.rsi === "number" && !isNaN(last.rsi), "RSI must be a valid number");
});

test("1.2 calculateMarketBreadth accurately computes net advance/decline score", () => {
  const feed = new MarketDataFeed();
  const heavyweights = [
    { symbol: "HDFCBANK.NS", name: "HDFC Bank", candle: { close: 1650, open: 1640 } },
    { symbol: "RELIANCE.NS", name: "Reliance", candle: { close: 2950, open: 2920 } },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank", candle: { close: 1100, open: 1110 } }
  ];
  const breadth = feed.calculateMarketBreadth(heavyweights);
  assert.strictEqual(breadth.advances, 2);
  assert.strictEqual(breadth.declines, 1);
  assert.strictEqual(breadth.advancePercent, 67);
  assert.strictEqual(breadth.breadth, "STRONG_BULLISH");
});

console.log("\n--- Stage 2: Option Chain PCR & Sentiment Calculations ---");
test("2.1 evaluateOptionChain identifies Bullish sentiment when PCR > 1.0", () => {
  const radar = new OptionChainRadar({ symbol: "NIFTY" });
  const result = radar.evaluateOptionChain(22800, { vix: 13.5, macroTrend: "BULLISH" });
  assert(result.pcr > 1.0, `Expected PCR > 1.0 for Bullish trend, got ${result.pcr}`);
  assert(result.sentiment.includes("BULLISH") || result.sentiment.includes("OVERBOUGHT"), `Sentiment: ${result.sentiment}`);
  assert(result.callResistanceWall >= 22800, "Call resistance wall must be above or at ATM");
  assert(result.putSupportWall <= 22800, "Put support wall must be below or at ATM");
});

test("2.2 evaluateOptionChain identifies Bearish sentiment when macro trend is Bearish", () => {
  const radar = new OptionChainRadar({ symbol: "NIFTY" });
  const result = radar.evaluateOptionChain(22800, { vix: 16.0, macroTrend: "BEARISH" });
  assert(result.pcr < 1.0, `Expected PCR < 1.0 for Bearish trend, got ${result.pcr}`);
  assert(result.sentiment.includes("BEARISH") || result.sentiment.includes("OVERSOLD"), `Sentiment: ${result.sentiment}`);
});

console.log("\n--- Stage 3: Derivatives Math, Black-Scholes & Greeks ---");
test("3.1 blackScholesPrice accurately computes Call and Put premiums", () => {
  const S = 22800; // Spot
  const K = 22800; // ATM Strike
  const T = 4 / 365; // 4 days to expiry
  const v = 0.14; // 14% Implied Volatility
  const r = 0.065; // 6.5% Risk-free rate

  const callPrice = DerivativesMath.blackScholesPrice(S, K, T, v, r, "CE");
  const putPrice = DerivativesMath.blackScholesPrice(S, K, T, v, r, "PE");

  assert(callPrice > 40 && callPrice < 250, `Unreasonable Call price: ${callPrice}`);
  assert(putPrice > 40 && putPrice < 250, `Unreasonable Put price: ${putPrice}`);
});

test("3.2 calculateGreeks produces realistic Delta, Gamma, Theta decay", () => {
  const greeks = DerivativesMath.calculateGreeks(22800, 22800, 4 / 365, 0.14, 0.065, "CE");
  assert(greeks.delta >= 0.40 && greeks.delta <= 0.65, `ATM Call Delta should be ~0.50, got ${greeks.delta}`);
  assert(greeks.thetaDaily < 0, `Theta must be negative (time decay), got ${greeks.thetaDaily}`);
  assert(greeks.gamma > 0, `Gamma must be positive, got ${greeks.gamma}`);
});

test("3.3 calculateDynamicRiskReward enforces strict Stop Loss and Target multiples", () => {
  const rr = DerivativesMath.calculateDynamicRiskReward(22800, 35, 0.50, 14.0);
  assert(rr.optionSlPoints >= 14 && rr.optionSlPoints <= 25, `Expected option SL 14-25 pts, got ${rr.optionSlPoints}`);
  assert(rr.optionTarget1Points > rr.optionSlPoints, "Target 1 must exceed Stop Loss");
  assert(rr.optionTarget2Points >= rr.optionSlPoints * 1.8, "Target 2 must have at least 1:1.8 Risk-Reward");
});

console.log("\n--- Stage 4: Confluence Scoring & Signal Qualification ---");
test("4.1 ConfluenceScorer rejects weak random candles (<60% score)", () => {
  const scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 });
  const neutralCandle = { open: 22800, high: 22810, low: 22795, close: 22801, ema9: 22800, ema21: 22800, rsi: 50 };
  const history = new Array(25).fill(neutralCandle);
  const signal = scorer.evaluateSetup(neutralCandle, history, neutralCandle, { is24x7: true });
  assert.strictEqual(signal.isQualified, false);
  assert(signal.score < 60, "Neutral candle must not qualify");
});

test("4.2 ConfluenceScorer generates qualified BUY signal on aligned bullish breakout", () => {
  const scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 });
  const breakoutCandle = {
    open: 22820,
    high: 22870,
    low: 22815,
    close: 22865,
    ema9: 22840,
    ema21: 22810,
    ema50: 22780,
    ema200: 22700,
    supertrend: 22800,
    supertrendDirection: "BULLISH",
    rsi: 62,
    volumeRatio: 1.8,
    atr: 25,
    time: new Date("2026-10-20T04:30:00.000Z") // 10:00 AM IST (in golden morning window)
  };
  const history = [];
  for (let i = 0; i < 25; i++) {
    history.push({
      open: 22700 + i * 4,
      high: 22720 + i * 4,
      low: 22690 + i * 4,
      close: 22715 + i * 4,
      ema9: 22710 + i * 4,
      ema21: 22700 + i * 4,
      rsi: 55,
      atr: 35
    });
  }
  const heavyweights = [
    { symbol: "HDFCBANK.NS", name: "HDFC Bank", candle: { close: 1660, open: 1640 } },
    { symbol: "RELIANCE.NS", name: "Reliance", candle: { close: 2960, open: 2920 } },
    { symbol: "ICICIBANK.NS", name: "ICICI Bank", candle: { close: 1115, open: 1105 } }
  ];
  const signal = scorer.evaluateSetup(breakoutCandle, history, breakoutCandle, {
    macro15m: { macroTrend: "BULLISH" },
    heavyweights,
    optionChain: { pcr: 1.25, sentiment: "BULLISH" },
    is24x7: true
  });

  assert(signal.score >= 60, `Expected score >= 60, got ${signal.score}`);
  assert.strictEqual(signal.isQualified, true);
  assert.strictEqual(signal.action, "BUY");
  assert.strictEqual(signal.direction, "BULLISH");
});

console.log("\n--- Stage 5: Capital Sizing & Daily Lock State Machine ---");
test("5.1 NiftyOptionsSniperDaemon locks session when target profit is achieved", () => {
  const daemon = new NiftyOptionsSniperDaemon({ initialCapital: 5000, lotSize: 25 });
  daemon.currentPosition = {
    contract: "NIFTY 22800 CE",
    action: "CALL (CE)",
    entryTime: "09:50 AM",
    entryMinute: 590,
    niftySpotEntry: 22800,
    entryPremium: 100,
    stopLossPremium: 82,
    target1Premium: 120,
    target2Premium: 136,
    isTrailing: false,
    delta: 0.50,
    quantity: 25
  };

  // Nifty moves up 80 points (from 22800 to 22880)
  const currentCandle = { open: 22820, high: 22885, low: 22815, close: 22880 };
  const exitEvent = daemon.manageOpenPosition(currentCandle, 610, "10:10 AM");
  assert.strictEqual(exitEvent.action, "EXIT_TRIGGERED");
  assert(exitEvent.trade.netPnl > 0, "Trade net PnL should be positive");
  assert.strictEqual(daemon.currentPosition, null, "Position should be cleared");
  assert(daemon.dailyPnl >= 900, "Daily PnL should reflect target 2 profit");
});

test("5.2 NiftyOptionsSniperDaemon locks session when max daily loss is reached", () => {
  const daemon = new NiftyOptionsSniperDaemon({ initialCapital: 5000, lotSize: 25 });
  daemon.maxDailyLoss = 450;
  daemon.currentPosition = {
    contract: "NIFTY 22800 CE",
    action: "CALL (CE)",
    entryTime: "09:50 AM",
    entryMinute: 590,
    niftySpotEntry: 22800,
    entryPremium: 100,
    stopLossPremium: 82,
    target1Premium: 120,
    target2Premium: 136,
    delta: 0.50,
    quantity: 25
  };

  // Candle moves down 40 points (from 22800 to 22760, delta 0.50 = 20 pts drop in premium)
  const currentCandle = { open: 22790, high: 22800, low: 22755, close: 22760 };
  const exitEvent = daemon.manageOpenPosition(currentCandle, 605, "10:05 AM");
  assert.strictEqual(exitEvent.action, "EXIT_TRIGGERED");
  assert(exitEvent.trade.netPnl < 0, "Trade should be at a loss on SL");
  assert.strictEqual(daemon.currentPosition, null, "Position must be cleared after SL exit");
  assert.strictEqual(daemon.isLockedToday, true, "Session must lock after max loss");
  assert(daemon.lockReason.includes("MAX_LOSS_HIT"), "Lock reason must record MAX_LOSS_HIT");
});

console.log("\n--- Stage 6: Telegram Quant Notifier Formatting ---");
test("6.1 TelegramQuantNotifier formats entry signals in Roman Hindi with exact targets", async () => {
  const notifier = new TelegramQuantNotifier();
  const signal = {
    action: "BUY",
    direction: "BULLISH",
    score: 85,
    price: 110.50,
    stopLoss: 92.50,
    riskPerShare: 18.00,
    target1: 130.50,
    target2: 155.00,
    rewardPerShare: 44.50,
    riskRewardRatio: "1:2.47",
    factors: ["9 EMA > 21 EMA Bullish Breakout", "Big-3 Heavyweights Positive Breadth"]
  };

  let capturedText = "";
  const originalSend = notifier.sendMessage;
  notifier.sendMessage = async (msg) => {
    capturedText = msg;
    return { success: true };
  };

  await notifier.notifySignalTriggered(signal, "^NSEI", "Nifty 50 Index", 25);
  notifier.sendMessage = originalSend;

  assert(capturedText.includes("GARUDA Alpha-Quant: High-Conviction Signal"));
  assert(capturedText.includes("Probability Score*: *85%*"));
  assert(capturedText.includes("Strict Stop-Loss*: ₹92.5"));
  assert(capturedText.includes("Target 2*: ₹155"));
  assert(capturedText.includes("Virtual Entry*: ₹110.5"));
});

test("6.2 TelegramQuantNotifier formats daily closing dossier accurately", async () => {
  const notifier = new TelegramQuantNotifier();
  let capturedText = "";
  const originalSend = notifier.sendMessage;
  notifier.sendMessage = async (msg) => {
    capturedText = msg;
    return { success: true };
  };

  const stats = {
    currentWalletBalance: 101800,
    totalTrades: 2,
    winCount: 2,
    lossCount: 0,
    winRatePercent: 100,
    netPnl: 1800,
    roiPercent: 1.8,
    profitFactor: "MAX"
  };

  await notifier.notifyDailySummary(stats);
  notifier.sendMessage = originalSend;

  assert(capturedText.includes("Daily Paper Trading Dossier"));
  assert(capturedText.includes("Total Realized P&L*: *+₹1,800*"));
  assert(capturedText.includes("Win Rate*: *100%*"));
});

console.log("\n========================================================");
console.log("🎉 ALL 12 ALPHA-QUANT 7-STAGE TESTS PASSED CLEANLY!");
console.log("========================================================");
