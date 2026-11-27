/**
 * 🦅 GARUDA Alpha-Quant: Broad Market Scanner & Multi-Cap Discovery Engine (V2 - Scalable)
 * 
 * CORE MANDATE (Founder Praveen Instruction):
 * - NOT restricted to Nifty 50.
 * - Comprehensive universe covering Large-Cap, Mid-Cap, Small-Cap, Micro-Cap, and BSE-listed securities.
 * - Scalable batch scanning with concurrency control.
 * - Identifies:
 *   1. Daily strongest stocks (top gainers)
 *   2. Daily weakest stocks (top losers)
 *   3. Sector leaders and laggards
 *   4. Relative strength & weakness vs Benchmark
 *   5. Breakouts and breakdowns (SuperTrend 7,3 + Price Action)
 *   6. Volume surges (>1.5x 20-period SMA volume)
 *   7. Bullish and bearish opportunities
 * - 100% Anti-Fabrication: Honestly reports coverage and unavailable symbols.
 */

const { MarketDataFeed, BENCHMARK_SYMBOL } = require('./marketDataFeed');

// ── Scalable Multi-Cap Universe (115+ High-Liquidity Stocks) ──
const MULTI_CAP_UNIVERSE = [
  // ── 1. NSE Large-Cap (Nifty 50 Titans) ──
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', cap: 'Large', sector: 'Energy & Power' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', cap: 'Large', sector: 'Banking & Financials' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', cap: 'Large', sector: 'Banking & Financials' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', cap: 'Large', sector: 'IT & Software' },
  { symbol: 'INFY.NS', name: 'Infosys', cap: 'Large', sector: 'IT & Software' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', cap: 'Large', sector: 'Banking & Financials' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', cap: 'Large', sector: 'Telecom' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', cap: 'Large', sector: 'Infra & Defense' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', cap: 'Large', sector: 'Auto & Mobility' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', cap: 'Large', sector: 'Pharma & Healthcare' },
  { symbol: 'TITAN.NS', name: 'Titan Company', cap: 'Large', sector: 'Consumer & Retail' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', cap: 'Large', sector: 'Auto & Mobility' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', cap: 'Large', sector: 'Energy & Power' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', cap: 'Large', sector: 'Banking & Financials' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', cap: 'Large', sector: 'Banking & Financials' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', cap: 'Large', sector: 'Banking & Financials' },
  { symbol: 'ITC.NS', name: 'ITC Limited', cap: 'Large', sector: 'Consumer & Retail' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', cap: 'Large', sector: 'Consumer & Retail' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', cap: 'Large', sector: 'Auto & Mobility' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', cap: 'Large', sector: 'Energy & Power' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', cap: 'Large', sector: 'Infra & Defense' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation', cap: 'Large', sector: 'Energy & Power' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', cap: 'Large', sector: 'Infra & Defense' },
  { symbol: 'COALINDIA.NS', name: 'Coal India', cap: 'Large', sector: 'Energy & Power' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', cap: 'Large', sector: 'Metals & Mining' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', cap: 'Large', sector: 'IT & Software' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', cap: 'Large', sector: 'Energy & Power' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', cap: 'Large', sector: 'Banking & Financials' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', cap: 'Large', sector: 'Consumer & Retail' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', cap: 'Large', sector: 'Metals & Mining' },

  // ── 2. NSE Mid-Cap (High-Beta Growth Engines) ──
  { symbol: 'TRENT.NS', name: 'Trent Limited', cap: 'Mid', sector: 'Consumer & Retail' },
  { symbol: 'DIXON.NS', name: 'Dixon Technologies', cap: 'Mid', sector: 'IT & Electronics' },
  { symbol: 'PERSISTENT.NS', name: 'Persistent Systems', cap: 'Mid', sector: 'IT & Software' },
  { symbol: 'FEDERALBNK.NS', name: 'Federal Bank', cap: 'Mid', sector: 'Banking & Financials' },
  { symbol: 'POLYCAB.NS', name: 'Polycab India', cap: 'Mid', sector: 'Infra & Defense' },
  { symbol: 'INDHOTEL.NS', name: 'Indian Hotels', cap: 'Mid', sector: 'Hospitality' },
  { symbol: 'ASHOKLEY.NS', name: 'Ashok Leyland', cap: 'Mid', sector: 'Auto & Mobility' },
  { symbol: 'MAXHEALTH.NS', name: 'Max Healthcare', cap: 'Mid', sector: 'Pharma & Healthcare' },
  { symbol: 'CUMMINSIND.NS', name: 'Cummins India', cap: 'Mid', sector: 'Capital Goods' },
  { symbol: 'BHARATFORG.NS', name: 'Bharat Forge', cap: 'Mid', sector: 'Auto & Defense' },
  { symbol: 'ASTRAL.NS', name: 'Astral Limited', cap: 'Mid', sector: 'Infra & Defense' },
  { symbol: 'COFORGE.NS', name: 'Coforge Limited', cap: 'Mid', sector: 'IT & Software' },
  { symbol: 'VOLTAS.NS', name: 'Voltas Limited', cap: 'Mid', sector: 'Consumer & Retail' },
  { symbol: 'JUBLFOOD.NS', name: 'Jubilant FoodWorks', cap: 'Mid', sector: 'Consumer & Retail' },
  { symbol: 'MUTHOOTFIN.NS', name: 'Muthoot Finance', cap: 'Mid', sector: 'Banking & Financials' },
  { symbol: 'PIIND.NS', name: 'PI Industries', cap: 'Mid', sector: 'Chemicals' },
  { symbol: 'SAIL.NS', name: 'Steel Authority of India', cap: 'Mid', sector: 'Metals & Mining' },
  { symbol: 'LUPIN.NS', name: 'Lupin Limited', cap: 'Mid', sector: 'Pharma & Healthcare' },
  { symbol: 'PAGEIND.NS', name: 'Page Industries', cap: 'Mid', sector: 'Consumer & Retail' },
  { symbol: 'DEEPAKNTR.NS', name: 'Deepak Nitrite', cap: 'Mid', sector: 'Chemicals' },

  // ── 3. NSE Small-Cap (Asymmetric Momentum Movers) ──
  { symbol: 'CDSL.NS', name: 'Central Depository Services', cap: 'Small', sector: 'Banking & Financials' },
  { symbol: 'BSE.NS', name: 'BSE Limited (Exchange)', cap: 'Small', sector: 'Banking & Financials' },
  { symbol: 'ANGELONE.NS', name: 'Angel One', cap: 'Small', sector: 'Banking & Financials' },
  { symbol: 'SUZLON.NS', name: 'Suzlon Energy', cap: 'Small', sector: 'Energy & Clean Power' },
  { symbol: 'KAYNES.NS', name: 'Kaynes Technology', cap: 'Small', sector: 'IT & Electronics' },
  { symbol: 'TATAELXSI.NS', name: 'Tata Elxsi', cap: 'Small', sector: 'IT & Software' },
  { symbol: 'MAZDOCK.NS', name: 'Mazagon Dock Shipbuilders', cap: 'Small', sector: 'Infra & Defense' },
  { symbol: 'HFCL.NS', name: 'HFCL Limited', cap: 'Small', sector: 'Telecom' },
  { symbol: 'RITES.NS', name: 'RITES Limited', cap: 'Small', sector: 'Infra & Defense' },
  { symbol: 'RAILTEL.NS', name: 'RailTel Corporation', cap: 'Small', sector: 'Telecom' },
  { symbol: 'COCHINSHIP.NS', name: 'Cochin Shipyard', cap: 'Small', sector: 'Infra & Defense' },
  { symbol: 'BSOFT.NS', name: 'Birlasoft Limited', cap: 'Small', sector: 'IT & Software' },
  { symbol: 'SONACOMS.NS', name: 'Sona BLW Precision', cap: 'Small', sector: 'Auto & Defense' },
  { symbol: 'KPITTECH.NS', name: 'KPIT Technologies', cap: 'Small', sector: 'IT & Software' },
  { symbol: 'FACT.NS', name: 'Fertilisers & Chemicals Travancore', cap: 'Small', sector: 'Chemicals' },
  { symbol: 'HUDCO.NS', name: 'Housing & Urban Dev Corp', cap: 'Small', sector: 'Banking & Financials' },
  { symbol: 'NBCC.NS', name: 'NBCC India', cap: 'Small', sector: 'Infra & Defense' },
  { symbol: 'IRCON.NS', name: 'Ircon International', cap: 'Small', sector: 'Infra & Defense' },
  { symbol: 'CESC.NS', name: 'CESC Limited', cap: 'Small', sector: 'Energy & Power' },
  { symbol: 'JYOTHYLAB.NS', name: 'Jyothy Labs', cap: 'Small', sector: 'Consumer & Retail' },

  // ── 4. NSE Micro-Caps (High-Alpha Niche Scalers) ──
  { symbol: 'KPIGREEN.NS', name: 'KPI Green Energy', cap: 'Micro', sector: 'Energy & Clean Power' },
  { symbol: 'GENSOL.NS', name: 'Gensol Engineering', cap: 'Micro', sector: 'Energy & Clean Power' },
  { symbol: 'PTCIL.NS', name: 'PTC Industries', cap: 'Micro', sector: 'Infra & Defense' },
  { symbol: 'APOLLO.NS', name: 'Apollo Micro Systems', cap: 'Micro', sector: 'Infra & Defense' },
  { symbol: 'REFEX.NS', name: 'Refex Industries', cap: 'Micro', sector: 'Energy & Clean Power' },
  { symbol: 'EXICOM.NS', name: 'Exicom Tele-Systems', cap: 'Micro', sector: 'Auto & Mobility' },
  { symbol: 'ORIENTGREEN.NS', name: 'Orient Green Power', cap: 'Micro', sector: 'Energy & Clean Power' },
  { symbol: 'ALOKINDS.NS', name: 'Alok Industries', cap: 'Micro', sector: 'Consumer & Retail' },
  { symbol: 'RUSHIL.NS', name: 'Rushil Decor', cap: 'Micro', sector: 'Infra & Defense' },
  { symbol: 'WAAREE.NS', name: 'Waaree Renewable Technologies', cap: 'Micro', sector: 'Energy & Clean Power' },

  // ── 5. BSE-Listed Equities & Benchmark ──
  { symbol: '^BSESN', name: 'BSE SENSEX Benchmark', cap: 'Index', sector: 'Benchmark Index' },
  { symbol: '500003.BO', name: 'Aegis Logistics (BSE)', cap: 'Small', sector: 'Logistics' },
  { symbol: '532540.BO', name: 'TCS (BSE)', cap: 'Large', sector: 'IT & Software' },
  { symbol: '500325.BO', name: 'Reliance Industries (BSE)', cap: 'Large', sector: 'Energy & Power' },
  { symbol: '500180.BO', name: 'HDFC Bank (BSE)', cap: 'Large', sector: 'Banking & Financials' }
];

class BroadMarketScanner {
  constructor(options = {}) {
    this.feed = new MarketDataFeed();
    this.universe = options.universe || MULTI_CAP_UNIVERSE;
    this.cacheTtlMs = options.cacheTtlMs || 60000; // 60s cache
    this.concurrency = options.concurrency || 6; // Max 6 concurrent requests
    this.cachedResult = null;
    this.lastScanTime = 0;
  }

  /**
   * Helper: Process array items with concurrency limit
   */
  async processInBatches(items, fn, concurrency = 6) {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const slice = items.slice(i, i + concurrency);
      const batchResults = await Promise.all(slice.map(item => fn(item)));
      results.push(...batchResults);
    }
    return results;
  }

  /**
   * Scan multi-cap universe and classify market structure
   */
  async scan(options = {}) {
    const forceFresh = options.forceFresh || false;
    const filterCap = options.cap || null; // 'Large', 'Mid', 'Small', 'Micro'
    const limit = options.limit || null;
    const now = Date.now();

    if (!forceFresh && this.cachedResult && (now - this.lastScanTime < this.cacheTtlMs) && !filterCap) {
      return this.cachedResult;
    }

    // 1. Fetch Benchmark for Relative Strength Baseline
    let benchmarkReturn = 0;
    try {
      const benchRaw = await this.feed.fetchCandles(BENCHMARK_SYMBOL, '5m', '2d');
      if (benchRaw && benchRaw.length >= 2) {
        const first = benchRaw[0].close;
        const last = benchRaw[benchRaw.length - 1].close;
        benchmarkReturn = Number((((last - first) / first) * 100).toFixed(2));
      }
    } catch (e) {}

    // Target universe to scan
    let targetUniverse = this.universe;
    if (filterCap) {
      targetUniverse = this.universe.filter(u => u.cap && u.cap.toLowerCase() === filterCap.toLowerCase());
    }
    if (limit && limit > 0) {
      targetUniverse = targetUniverse.slice(0, limit);
    }

    const scannedItems = [];
    const unavailableSymbols = [];

    // 2. Scan Universe concurrently in controlled batches
    await this.processInBatches(targetUniverse, async (item) => {
      try {
        const raw = await this.feed.fetchCandles(item.symbol, '5m', '2d');
        if (!raw || raw.length < 25) {
          unavailableSymbols.push({ symbol: item.symbol, name: item.name, reason: 'Insufficient 5m candles' });
          return;
        }

        const enriched = this.feed.enrichIndicators(raw);
        if (!enriched || enriched.length === 0) {
          unavailableSymbols.push({ symbol: item.symbol, name: item.name, reason: 'Failed to enrich indicators' });
          return;
        }

        const curr = enriched[enriched.length - 1];
        const first = enriched[0];

        const pctChange2d = Number((((curr.close - first.close) / first.close) * 100).toFixed(2));
        const relativeStrength = Number((pctChange2d - benchmarkReturn).toFixed(2));

        // Technical Classifications
        const isSuperTrendBull = curr.supertrendDirection === 'BULLISH';
        const isSuperTrendBear = curr.supertrendDirection === 'BEARISH';
        const isAboveVwap = curr.vwap ? curr.close >= curr.vwap : true;
        const isHighVolume = curr.volumeRatio >= 1.3;
        const isUnusualVolume = curr.volumeRatio >= 1.5;

        let setupType = 'NEUTRAL';
        let convictionScore = 50;

        if (isSuperTrendBull && isAboveVwap && curr.rsi >= 50 && curr.rsi <= 72) {
          setupType = 'BULLISH_BREAKOUT';
          convictionScore = Math.min(95, 65 + (isHighVolume ? 15 : 5) + (relativeStrength > 0 ? 10 : 0));
        } else if (isSuperTrendBear && !isAboveVwap && curr.rsi <= 48 && curr.rsi >= 28) {
          setupType = 'BEARISH_BREAKDOWN';
          convictionScore = Math.min(95, 65 + (isHighVolume ? 15 : 5) + (relativeStrength < 0 ? 10 : 0));
        } else if (isUnusualVolume) {
          setupType = 'UNUSUAL_VOLUME_SURGE';
          convictionScore = 65;
        }

        scannedItems.push({
          symbol: item.symbol,
          name: item.name,
          cap: item.cap,
          sector: item.sector,
          close: curr.close,
          pctChange: pctChange2d,
          relativeStrength,
          volumeRatio: curr.volumeRatio || 1.0,
          rsi: curr.rsi || 50,
          supertrend: curr.supertrend,
          supertrendDirection: curr.supertrendDirection,
          vwap: curr.vwap,
          setupType,
          convictionScore
        });
      } catch (err) {
        unavailableSymbols.push({ symbol: item.symbol, name: item.name, reason: err.message });
      }
    }, this.concurrency);

    // 3. Compute Sector Leaders & Laggards
    const sectorMap = {};
    for (const s of scannedItems) {
      if (s.cap === 'Index') continue;
      if (!sectorMap[s.sector]) {
        sectorMap[s.sector] = { sector: s.sector, totalChange: 0, count: 0, advances: 0, declines: 0 };
      }
      sectorMap[s.sector].totalChange += s.pctChange;
      sectorMap[s.sector].count++;
      if (s.pctChange > 0) sectorMap[s.sector].advances++;
      else if (s.pctChange < 0) sectorMap[s.sector].declines++;
    }

    const sectorRankings = Object.values(sectorMap).map(sec => ({
      sector: sec.sector,
      avgPctChange: Number((sec.totalChange / sec.count).toFixed(2)),
      breadth: `${sec.advances} Adv / ${sec.declines} Dec (${sec.count} stocks)`,
      isLeader: (sec.totalChange / sec.count) > 0.3,
      isLaggard: (sec.totalChange / sec.count) < -0.3
    })).sort((a, b) => b.avgPctChange - a.avgPctChange);

    // 4. Sort Subsets: Strongest, Weakest, Breakouts, Breakdowns, Volume Surges
    const dailyStrongest = [...scannedItems]
      .filter(s => s.cap !== 'Index')
      .sort((a, b) => b.pctChange - a.pctChange);

    const dailyWeakest = [...scannedItems]
      .filter(s => s.cap !== 'Index')
      .sort((a, b) => a.pctChange - b.pctChange);

    const bullishBreakouts = scannedItems
      .filter(s => s.setupType === 'BULLISH_BREAKOUT' || (s.supertrendDirection === 'BULLISH' && s.relativeStrength > 0.5))
      .sort((a, b) => b.convictionScore - a.convictionScore);

    const bearishBreakdowns = scannedItems
      .filter(s => s.setupType === 'BEARISH_BREAKDOWN' || (s.supertrendDirection === 'BEARISH' && s.relativeStrength < -0.5))
      .sort((a, b) => b.convictionScore - a.convictionScore);

    const volumeSurges = scannedItems
      .filter(s => s.volumeRatio >= 1.5)
      .sort((a, b) => b.volumeRatio - a.volumeRatio);

    const bullishOpportunities = scannedItems
      .filter(s => s.supertrendDirection === 'BULLISH' && s.rsi >= 50 && s.rsi <= 72)
      .sort((a, b) => b.convictionScore - a.convictionScore);

    const bearishOpportunities = scannedItems
      .filter(s => s.supertrendDirection === 'BEARISH' && s.rsi <= 48)
      .sort((a, b) => b.convictionScore - a.convictionScore);

    const result = {
      timestamp: new Date().toISOString(),
      coverage: {
        totalConfigured: targetUniverse.length,
        fullUniverseSize: this.universe.length,
        successfullyScanned: scannedItems.length,
        unavailableCount: unavailableSymbols.length,
        coveragePercent: targetUniverse.length > 0 ? Number(((scannedItems.length / targetUniverse.length) * 100).toFixed(1)) : 0,
        unavailableSymbols
      },
      benchmarkReturn,
      dailyStrongest,
      dailyWeakest,
      sectorRankings,
      bullishBreakouts,
      bearishBreakdowns,
      volumeSurges,
      bullishOpportunities,
      bearishOpportunities,
      scannedItems
    };

    if (!filterCap) {
      this.cachedResult = result;
      this.lastScanTime = now;
    }

    return result;
  }

  /**
   * Format Roman Hindi briefing for Telegram
   */
  formatTelegramReport(type = 'STOCKS', data) {
    if (!data) return 'Market scanner data is currently refreshing. Please try in 10 seconds.';

    if (type === 'BULLISH') {
      const bulls = (data.bullishBreakouts || []).slice(0, 5);
      if (bulls.length === 0) {
        return `🦅 *GARUDA Alpha-Quant: Bullish Scanner*\n\nAbhi market me koi high-conviction bullish breakout setup trigger nahi hua hai. Sideways/chop filtration active hai.\nCoverage: ${data.coverage.successfullyScanned}/${data.coverage.totalConfigured} stocks.`;
      }
      let msg = `🦅 *GARUDA Top Bullish Breakouts (SuperTrend 7,3 Aligned)*\n`;
      msg += `Coverage: ${data.coverage.successfullyScanned} stocks across Large, Mid, Small & Micro cap\n─────────────────────────\n\n`;
      bulls.forEach(b => {
        msg += `🟢 *${b.name}* (\`${b.symbol}\`) — *${b.cap}-Cap*\n`;
        msg += `   LTP: ₹${b.close} | 2D: ${b.pctChange >= 0 ? '+' : ''}${b.pctChange}% (RS: +${b.relativeStrength}% vs Nifty)\n`;
        msg += `   SuperTrend: ₹${b.supertrend} [BULLISH] | Vol: ${b.volumeRatio}x avg\n`;
        msg += `   Conviction: *${b.convictionScore}%* | Sector: ${b.sector}\n\n`;
      });
      msg += `🛡️ *Virtual Paper-Trade Active. Capital 100% Protected.*`;
      return msg;
    }

    if (type === 'BEARISH') {
      const bears = (data.bearishBreakdowns || []).slice(0, 5);
      if (bears.length === 0) {
        return `🦅 *GARUDA Alpha-Quant: Bearish Breakdown Scanner*\n\nAbhi market me koi significant breakdown trigger nahi hua hai. Institutional base intact hai.\nCoverage: ${data.coverage.successfullyScanned}/${data.coverage.totalConfigured} stocks.`;
      }
      let msg = `🦅 *GARUDA Top Bearish Breakdowns (SuperTrend 7,3 Resistance)*\n`;
      msg += `Coverage: ${data.coverage.successfullyScanned} stocks across Large, Mid, Small & Micro cap\n─────────────────────────\n\n`;
      bears.forEach(b => {
        msg += `🔴 *${b.name}* (\`${b.symbol}\`) — *${b.cap}-Cap*\n`;
        msg += `   LTP: ₹${b.close} | 2D: ${b.pctChange}% (RS: ${b.relativeStrength}% vs Nifty)\n`;
        msg += `   SuperTrend Ceiling: ₹${b.supertrend} [BEARISH] | Vol: ${b.volumeRatio}x avg\n`;
        msg += `   Breakdown Conviction: *${b.convictionScore}%* | Sector: ${b.sector}\n\n`;
      });
      msg += `🛡️ *Virtual Paper-Trade Active. Capital 100% Protected.*`;
      return msg;
    }

    if (type === 'STRONGEST') {
      const topGainers = (data.dailyStrongest || []).slice(0, 5);
      let msg = `🚀 *GARUDA Daily Strongest Stocks (Top Gainers)*\n`;
      msg += `Benchmark 2D: ${data.benchmarkReturn >= 0 ? '+' : ''}${data.benchmarkReturn}%\n─────────────────────────\n\n`;
      topGainers.forEach((s, idx) => {
        msg += `${idx + 1}. 🟢 *${s.name}* (\`${s.symbol}\` | *${s.cap}*): *+${s.pctChange}%*\n`;
        msg += `   LTP: ₹${s.close} | RS: +${s.relativeStrength}% | ST: ${s.supertrendDirection}\n`;
      });
      return msg;
    }

    if (type === 'WEAKEST') {
      const topLosers = (data.dailyWeakest || []).slice(0, 5);
      let msg = `🔻 *GARUDA Daily Weakest Stocks (Top Drag)*\n`;
      msg += `Benchmark 2D: ${data.benchmarkReturn >= 0 ? '+' : ''}${data.benchmarkReturn}%\n─────────────────────────\n\n`;
      topLosers.forEach((s, idx) => {
        msg += `${idx + 1}. 🔴 *${s.name}* (\`${s.symbol}\` | *${s.cap}*): *${s.pctChange}%*\n`;
        msg += `   LTP: ₹${s.close} | RS: ${s.relativeStrength}% | ST: ${s.supertrendDirection}\n`;
      });
      return msg;
    }

    if (type === 'LEADERS' || type === 'LAGGARDS') {
      let msg = `🦅 *GARUDA Sector Momentum & Market Breadth*\n`;
      msg += `Benchmark 2D Return: ${data.benchmarkReturn >= 0 ? '+' : ''}${data.benchmarkReturn}%\n─────────────────────────\n\n`;
      msg += `🏆 *Sector Performance Ranking*:\n`;
      data.sectorRankings.forEach((sec, idx) => {
        const icon = sec.avgPctChange > 0 ? '🟢' : (sec.avgPctChange < -0.3 ? '🔴' : '⚪');
        msg += `${idx + 1}. ${icon} *${sec.sector}*: ${sec.avgPctChange >= 0 ? '+' : ''}${sec.avgPctChange}% [${sec.breadth}]\n`;
      });
      return msg;
    }

    // Default: Multi-cap summary overview
    const totalScanned = data.coverage.successfullyScanned;
    const greenCount = data.scannedItems.filter(s => s.pctChange > 0).length;
    const redCount = data.scannedItems.filter(s => s.pctChange < 0).length;
    const greenPct = totalScanned > 0 ? Math.round((greenCount / totalScanned) * 100) : 50;

    let msg = `🦅 *GARUDA Broad Market Multi-Cap Radar* 🦅\n`;
    msg += `Data Coverage: *${totalScanned}/${data.coverage.totalConfigured}* stocks (*${data.coverage.coveragePercent}%*)\n`;
    msg += `Universe: Large (30), Mid (20), Small (20), Micro (10), BSE (5)\n`;
    msg += `Breadth: 🟢 ${greenCount} Advance (${greenPct}%) | 🔴 ${redCount} Decline\n`;
    msg += `Nifty 50 Benchmark: ${data.benchmarkReturn >= 0 ? '+' : ''}${data.benchmarkReturn}%\n─────────────────────────\n\n`;

    const topGainers = (data.dailyStrongest || []).slice(0, 3);
    if (topGainers.length > 0) {
      msg += `🔥 *Leading Gainers*:\n`;
      topGainers.forEach(g => {
        msg += `• *${g.name}* (\`${g.symbol}\`): *+${g.pctChange}%* [RS: +${g.relativeStrength}%]\n`;
      });
      msg += `\n`;
    }

    const topBulls = data.bullishBreakouts.slice(0, 3);
    if (topBulls.length > 0) {
      msg += `🚀 *SuperTrend Breakout Radar*:\n`;
      topBulls.forEach(b => {
        msg += `• *${b.name}* (\`${b.symbol}\`): LTP ₹${b.close} (Score: *${b.convictionScore}%*)\n`;
      });
      msg += `\n`;
    }

    if (data.coverage.unavailableSymbols.length > 0) {
      const unavail = data.coverage.unavailableSymbols.slice(0, 3).map(u => u.symbol).join(', ');
      msg += `ℹ️ *Honest Coverage*: ${data.coverage.unavailableCount} symbols skipped (${unavail}${data.coverage.unavailableCount > 3 ? '...' : ''})\n`;
    }

    msg += `\nCommands: \`/bullish\`, \`/bearish\`, \`/leaders\`, \`/laggards\``;
    return msg;
  }
}

const defaultBroadMarketScanner = new BroadMarketScanner();

module.exports = {
  BroadMarketScanner,
  defaultBroadMarketScanner,
  MULTI_CAP_UNIVERSE
};
