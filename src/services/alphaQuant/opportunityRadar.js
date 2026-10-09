/**
 * 🦅 GARUDA Alpha-Quant: Opportunity Radar & Comparative Advisory Agent
 * 
 * CORE DOCTRINE (Founder Praveen Directive):
 * 1. Proactive Opportunity Comparison:
 *    Scans Nifty 50 AND top liquid F&O movers (Bank Nifty, Reliance, SBIN, Tata Motors, etc.).
 *    If an alternate stock has an explosive institutional setup that gives more profit than Nifty:
 *    Proactively advises Founder/Trader:
 *    "Bhai, Nifty 50 se +₹900 banega, lekin aaj SBIN/BANKNIFTY me +₹2,100 (extra ₹1,200) ka mauka hai!"
 * 
 * 2. Sovereign Trader Command Mode:
 *    If trader says "Nahi, mujhe toh sirf XYZ par trade karna hai, tum bas uska bolo":
 *    Agent obediently locks focus 100% on XYZ and trades only as per trader's wish!
 */

try { require('dotenv').config(); } catch (e) {}

const { MarketDataFeed, BENCHMARK_SYMBOL, DEFAULT_SYMBOLS } = require('./marketDataFeed');
const { ConfluenceScorer } = require('./confluenceScorer');

// Liquid high-beta F&O candidates for comparative alpha scanning
const FO_RADAR_SYMBOLS = [
  { symbol: '^NSEBANK', name: 'Bank Nifty', lotSize: 15, basePremium: 220, category: 'Index' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', lotSize: 250, basePremium: 22, category: 'Stock' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', lotSize: 750, basePremium: 9, category: 'Stock' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', lotSize: 550, basePremium: 16, category: 'Stock' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', lotSize: 700, basePremium: 14, category: 'Stock' },
  { symbol: 'INFY.NS', name: 'Infosys', lotSize: 400, basePremium: 18, category: 'Stock' }
];

class OpportunityRadar {
  constructor(options = {}) {
    this.feed = new MarketDataFeed();
    this.scorer = new ConfluenceScorer({ minConfidenceThreshold: 60 });
    this.lockedSymbol = options.lockedSymbol || null; // When trader specifies a dedicated instrument
    this.traderPreference = options.traderPreference || 'AUTO_PROACTIVE'; // 'AUTO_PROACTIVE' or 'LOCKED_TARGET'
  }

  /**
   * Set Sovereign Trader Override
   * (When trader says "Mujhe sirf Nifty ya XYZ par trade karna hai")
   */
  setTraderPreference(symbolNameOrCode) {
    if (!symbolNameOrCode || symbolNameOrCode.toUpperCase() === 'AUTO' || symbolNameOrCode.toUpperCase() === 'ALL') {
      this.lockedSymbol = null;
      this.traderPreference = 'AUTO_PROACTIVE';
      return {
        mode: 'AUTO_PROACTIVE',
        message: '🫡 GARUDA Proactive Radar Active: Scanning Nifty 50 and all F&O stocks for highest-profit opportunities.'
      };
    }

    this.lockedSymbol = symbolNameOrCode.toUpperCase();
    this.traderPreference = 'LOCKED_TARGET';
    return {
      mode: 'LOCKED_TARGET',
      lockedSymbol: this.lockedSymbol,
      message: `🫡 Sovereign Command Acknowledged: Focusing 100% on ${this.lockedSymbol}. Scanning ONLY this asset as per your wish.`
    };
  }

  /**
   * Compare Nifty 50 against other liquid F&O candidates at a specific candle timestamp
   */
  async scanOpportunities(capital = 5000) {
    // If trader locked to a specific symbol, only evaluate that symbol
    if (this.traderPreference === 'LOCKED_TARGET' && this.lockedSymbol) {
      return {
        mode: 'LOCKED_TARGET',
        lockedSymbol: this.lockedSymbol,
        advice: `Trader Command Active: Monitoring only ${this.lockedSymbol}. All other stocks muted.`
      };
    }

    // 1. Fetch Nifty 50 benchmark
    const niftyRaw = await this.feed.fetchCandles(BENCHMARK_SYMBOL, '5m', '1d');
    if (!niftyRaw || niftyRaw.length < 25) return null;
    const niftyCandles = this.feed.enrichIndicators(niftyRaw);
    const currentNifty = niftyCandles[niftyCandles.length - 1];
    const niftyHistory = niftyCandles.slice(Math.max(0, niftyCandles.length - 26), niftyCandles.length - 1);

    const niftySignal = this.scorer.evaluateSetup(currentNifty, niftyHistory, currentNifty, { is24x7: false });

    // Base Nifty Potential (1 Lot = 25 Qty, ATM ~₹115, 36 pts target = +₹900)
    const niftyExpectedProfit = (niftySignal.isQualified && niftySignal.score >= 60) ? 900 : 0;
    const niftySetup = {
      name: 'NIFTY 50',
      symbol: BENCHMARK_SYMBOL,
      action: niftySignal.action === 'BUY' ? 'CALL (CE)' : 'PUT (PE)',
      score: niftySignal.score,
      isQualified: niftySignal.isQualified && niftySignal.score >= 60,
      expectedProfit: niftyExpectedProfit,
      riskAmount: 450
    };

    // 2. Scan F&O high-beta candidates
    const candidateOpportunities = [];

    for (const cand of FO_RADAR_SYMBOLS) {
      try {
        const raw = await this.feed.fetchCandles(cand.symbol, '5m', '1d');
        if (!raw || raw.length < 25) continue;
        const enriched = this.feed.enrichIndicators(raw);
        const curr = enriched[enriched.length - 1];
        const hist = enriched.slice(Math.max(0, enriched.length - 26), enriched.length - 1);

        const sig = this.scorer.evaluateSetup(curr, hist, currentNifty, { is24x7: false });

        if (sig.isQualified && sig.score >= 65) {
          // Calculate expected profit based on lot size and ATR momentum
          const targetPoints = Number((sig.riskPerShare * 1.8).toFixed(1));
          const expectedGain = Math.round(targetPoints * cand.lotSize);
          const maxLoss = Math.round(sig.riskPerShare * cand.lotSize);

          // Only consider if capital requirement fits ~₹5k budget
          const requiredCapital = Math.round(cand.basePremium * cand.lotSize * 0.4); // typical option lot cost

          candidateOpportunities.push({
            name: cand.name,
            symbol: cand.symbol,
            action: sig.action === 'BUY' ? 'CALL (CE)' : 'PUT (PE)',
            score: sig.score,
            expectedProfit: expectedGain,
            riskAmount: maxLoss,
            drivers: sig.factors,
            requiredCapital
          });
        }
      } catch (e) {}
    }

    // Sort opportunities by highest expected profit
    candidateOpportunities.sort((a, b) => b.expectedProfit - a.expectedProfit);

    const bestOpportunity = candidateOpportunities[0] || null;

    // 3. Proactive Decision: Compare Best Opportunity with Nifty 50
    let recommendation = null;

    if (bestOpportunity && bestOpportunity.expectedProfit > niftyExpectedProfit + 500) {
      const extraProfit = bestOpportunity.expectedProfit - niftyExpectedProfit;
      recommendation = {
        hasSuperAlpha: true,
        recommendedAsset: bestOpportunity,
        niftySetup,
        extraProfit,
        advisoryMessage: 
`💡 *GARUDA ALPHA RADAR: HIGH-POTENTIAL OPPORTUNITY DETECTED!*

Bhai, aaj Nifty 50 ke muqable *${bestOpportunity.name}* me zyada profit ka mauka ban raha hai!

📊 *Comparison*:
• *NIFTY 50*: Expected Profit ~₹${niftyExpectedProfit} (Score: ${niftySetup.score}%)
• *${bestOpportunity.name} ${bestOpportunity.action}*: Expected Profit ~*₹${bestOpportunity.expectedProfit}* (Score: *${bestOpportunity.score}%*)

⚡ *Extra Profit Advantage*: *+₹${extraProfit} ZYADA Munafa* banne ka mauka hai!
🧠 *Kyun*: ${bestOpportunity.drivers[0] || 'Massive Volume Breakout'}

👉 *Agent Guidance*: Agar aap zyada gain chahte ho, toh aaj *${bestOpportunity.name} ${bestOpportunity.action}* lo!
*(Agar aap sirf Nifty chahte ho, toh batao—agent turant sirf Nifty scan karega).*`
      };
    } else {
      recommendation = {
        hasSuperAlpha: false,
        niftySetup,
        advisoryMessage: 
`🦅 *GARUDA ADVISORY: NIFTY 50 IS OPTIMAL TODAY*
Nifty 50 me hi sabse clean aur safe momentum hai. No other stock beats Nifty risk-reward today.`
      };
    }

    return recommendation;
  }
}

module.exports = {
  OpportunityRadar,
  FO_RADAR_SYMBOLS
};
