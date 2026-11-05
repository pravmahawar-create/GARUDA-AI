/**
 * 🦅 GARUDA SOVEREIGN MOTHER BRAIN — CUSTOMER ANALYTICS ENGINE
 * 
 * Production-Grade Customer Intelligence & Behavioral Analytics Engine:
 * 1. RFM Scoring & Quintile Segmentation (Champions, Loyalists, At-Risk, etc.)
 * 2. Customer Lifetime Value (Historical & Predictive CLV)
 * 3. Churn Risk Probability Scoring & Classification
 * 4. Cohort Retention Matrix (Acquisition Cohorts by Month)
 * 5. Statistical Spend Anomaly Detection (Z-Score Based)
 * 6. Executive Portfolio Metrics & Strategic Insights
 * 
 * Sovereign Security Standards:
 * - Anti-Prototype Pollution Protection (__proto__, constructor, prototype)
 * - Strict Input Validation & Type Sanitization
 * - Zero External Runtime Dependencies (Pure Node.js)
 * - Sub-millisecond Execution Latency
 * 
 * Founder & Chief Architect: Praveen Mahawar
 * Operating System: GARUDA OS (garudaos.in)
 */

class CustomerAnalytics {
  constructor(options = {}) {
    this.grossMargin = typeof options.grossMargin === "number" ? Math.max(0, Math.min(1, options.grossMargin)) : 0.70;
    this.defaultLifespanYears = typeof options.defaultLifespanYears === "number" ? Math.max(1, options.defaultLifespanYears) : 3;
    this.anomalyThresholdZ = typeof options.anomalyThresholdZ === "number" ? options.anomalyThresholdZ : 2.5;
  }

  /**
   * Sanitizes object keys to block prototype pollution attacks.
   */
  static sanitizeRecord(obj) {
    if (!obj || typeof obj !== "object") return {};
    const safe = {};
    for (const key of Object.keys(obj)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      safe[key] = obj[key];
    }
    return safe;
  }

  /**
   * Validates customer record integrity.
   */
  validateCustomer(customer) {
    if (!customer || typeof customer !== "object") {
      throw new TypeError("Invalid customer: record must be a non-null object.");
    }
    const safe = CustomerAnalytics.sanitizeRecord(customer);
    if (!safe.id && safe.id !== 0) {
      throw new Error("Validation Error: Customer record missing required 'id'.");
    }
    const signupDate = safe.signupDate ? new Date(safe.signupDate) : null;
    if (signupDate && isNaN(signupDate.getTime())) {
      throw new Error(`Validation Error: Invalid signupDate '${safe.signupDate}' for customer ${safe.id}.`);
    }

    return {
      id: String(safe.id),
      name: safe.name ? String(safe.name).trim() : `Customer_${safe.id}`,
      email: safe.email ? String(safe.email).trim().toLowerCase() : null,
      signupDate: signupDate || new Date()
    };
  }

  /**
   * Validates transaction record integrity.
   */
  validateTransaction(tx) {
    if (!tx || typeof tx !== "object") {
      throw new TypeError("Invalid transaction: record must be a non-null object.");
    }
    const safe = CustomerAnalytics.sanitizeRecord(tx);
    if (!safe.id && safe.id !== 0) {
      throw new Error("Validation Error: Transaction missing required 'id'.");
    }
    if (!safe.customerId && safe.customerId !== 0) {
      throw new Error("Validation Error: Transaction missing required 'customerId'.");
    }

    const amount = Number(safe.amount);
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      throw new Error(`Validation Error: Transaction ${safe.id} has invalid amount '${safe.amount}'. Must be positive number.`);
    }

    const txDate = new Date(safe.date);
    if (isNaN(txDate.getTime())) {
      throw new Error(`Validation Error: Transaction ${safe.id} has invalid date '${safe.date}'.`);
    }

    return {
      id: String(safe.id),
      customerId: String(safe.customerId),
      amount: Math.round(amount * 100) / 100,
      date: txDate
    };
  }

  /**
   * Calculates RFM (Recency, Frequency, Monetary) quintile metrics and segments.
   */
  calculateRFM(customers = [], transactions = [], referenceDate = new Date()) {
    const refTime = new Date(referenceDate).getTime();
    if (isNaN(refTime)) throw new TypeError("Invalid referenceDate.");

    // Validate customers & transactions
    const safeCustomers = (Array.isArray(customers) ? customers : []).map(c => this.validateCustomer(c));
    const safeTx = (Array.isArray(transactions) ? transactions : []).map(t => this.validateTransaction(t));

    // Group transactions by customer
    const txByCustomer = new Map();
    for (const tx of safeTx) {
      if (!txByCustomer.has(tx.customerId)) {
        txByCustomer.set(tx.customerId, []);
      }
      txByCustomer.get(tx.customerId).push(tx);
    }

    // Compute raw R, F, M values
    const profiles = [];
    for (const cust of safeCustomers) {
      const txs = txByCustomer.get(cust.id) || [];
      const frequency = txs.length;
      let monetary = 0;
      let lastTxDate = null;

      for (const t of txs) {
        monetary += t.amount;
        if (!lastTxDate || t.date > lastTxDate) {
          lastTxDate = t.date;
        }
      }

      // Recency in days
      const daysSinceLastOrder = lastTxDate ? Math.max(0, Math.floor((refTime - lastTxDate.getTime()) / (1000 * 60 * 60 * 24))) : 999;

      profiles.push({
        customerId: cust.id,
        name: cust.name,
        recencyDays: daysSinceLastOrder,
        frequency,
        monetary: Math.round(monetary * 100) / 100,
        lastTransactionDate: lastTxDate ? lastTxDate.toISOString() : null
      });
    }

    if (profiles.length === 0) {
      return { profiles: [], segmentCounts: {}, totalRevenue: 0 };
    }

    // Quintile scoring (1-5)
    // Recency: Lower days = Higher score (5 is best)
    // Frequency & Monetary: Higher value = Higher score (5 is best)
    const sortedR = [...profiles].map(p => p.recencyDays).sort((a, b) => a - b);
    const sortedF = [...profiles].map(p => p.frequency).sort((a, b) => a - b);
    const sortedM = [...profiles].map(p => p.monetary).sort((a, b) => a - b);

    const getQuintile = (val, sorted, invert = false) => {
      if (sorted.length === 0) return 1;
      const rank = sorted.findIndex(v => v >= val);
      const percentile = rank === -1 ? 1 : rank / sorted.length;
      let score;
      if (percentile <= 0.2) score = 1;
      else if (percentile <= 0.4) score = 2;
      else if (percentile <= 0.6) score = 3;
      else if (percentile <= 0.8) score = 4;
      else score = 5;
      return invert ? 6 - score : score;
    };

    const segmentCounts = {};
    let totalRevenue = 0;

    for (const p of profiles) {
      p.rScore = getQuintile(p.recencyDays, sortedR, true);
      p.fScore = getQuintile(p.frequency, sortedF, false);
      p.mScore = getQuintile(p.monetary, sortedM, false);
      p.rfmScore = `${p.rScore}${p.fScore}${p.mScore}`;

      // Segment Classification
      p.segment = this._classifySegment(p.rScore, p.fScore, p.mScore);
      segmentCounts[p.segment] = (segmentCounts[p.segment] || 0) + 1;
      totalRevenue += p.monetary;
    }

    return {
      profiles,
      segmentCounts,
      totalCustomers: profiles.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    };
  }

  _classifySegment(r, f, m) {
    if (r >= 4 && f >= 3 && m >= 2) return "CHAMPIONS";
    if (f >= 3 && r >= 3) return "LOYAL_CUSTOMERS";
    if (r >= 4 && f >= 2) return "POTENTIAL_LOYALISTS";
    if (r >= 4 && f === 1) return "NEW_CUSTOMERS";
    if (r >= 3 && f <= 2 && m >= 2) return "PROMISING";
    if (r === 3 && f >= 3 && m >= 2) return "NEED_ATTENTION";
    if (r === 2 && f <= 2) return "ABOUT_TO_SLEEP";
    if (r <= 2 && f >= 3 && m >= 3) return "AT_RISK";
    if (r <= 2 && f <= 2 && m <= 2) return "HIBERNATING";
    return "LOST";
  }

  /**
   * Calculates Customer Lifetime Value (Historical & Predictive CLV).
   */
  calculateLTV(customers = [], transactions = [], options = {}) {
    const grossMargin = typeof options.grossMargin === "number" ? options.grossMargin : this.grossMargin;
    const lifespanYears = typeof options.lifespanYears === "number" ? options.lifespanYears : this.defaultLifespanYears;

    const safeCustomers = (Array.isArray(customers) ? customers : []).map(c => this.validateCustomer(c));
    const safeTx = (Array.isArray(transactions) ? transactions : []).map(t => this.validateTransaction(t));

    const txByCust = new Map();
    for (const tx of safeTx) {
      if (!txByCust.has(tx.customerId)) txByCust.set(tx.customerId, []);
      txByCust.get(tx.customerId).push(tx);
    }

    const results = [];
    let portfolioHistoricalTotal = 0;
    let portfolioPredictiveTotal = 0;

    for (const cust of safeCustomers) {
      const txs = txByCust.get(cust.id) || [];
      const count = txs.length;
      let totalSpend = 0;
      let firstTxDate = cust.signupDate;
      let lastTxDate = null;

      for (const t of txs) {
        totalSpend += t.amount;
        if (!firstTxDate || t.date < firstTxDate) firstTxDate = t.date;
        if (!lastTxDate || t.date > lastTxDate) lastTxDate = t.date;
      }

      const historicalLtv = Math.round(totalSpend * 100) / 100;
      const averageOrderValue = count > 0 ? Math.round((totalSpend / count) * 100) / 100 : 0;

      // Calculate annual purchase rate
      const tenureDays = Math.max(1, Math.floor((Date.now() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24)));
      const annualFrequency = count > 0 ? Math.max(1, (count / tenureDays) * 365) : 0;

      // Predictive CLV formula: (AOV * AnnualFrequency * GrossMargin) * LifespanYears
      const annualValue = averageOrderValue * annualFrequency * grossMargin;
      const predictiveClv = Math.round((historicalLtv + (annualValue * lifespanYears)) * 100) / 100;

      portfolioHistoricalTotal += historicalLtv;
      portfolioPredictiveTotal += predictiveClv;

      results.push({
        customerId: cust.id,
        name: cust.name,
        ordersCount: count,
        averageOrderValue,
        historicalLtv,
        predictiveClv,
        grossMarginAssumed: grossMargin,
        projectedYears: lifespanYears
      });
    }

    const avgHistorical = results.length > 0 ? Math.round((portfolioHistoricalTotal / results.length) * 100) / 100 : 0;
    const avgPredictive = results.length > 0 ? Math.round((portfolioPredictiveTotal / results.length) * 100) / 100 : 0;

    return {
      customerLtv: results,
      portfolioHistoricalTotal: Math.round(portfolioHistoricalTotal * 100) / 100,
      portfolioPredictiveTotal: Math.round(portfolioPredictiveTotal * 100) / 100,
      averageHistoricalLtv: avgHistorical,
      averagePredictiveLtv: avgPredictive
    };
  }

  /**
   * Evaluates Churn Risk Probability Score (0.0 to 1.0) and Risk Classification.
   */
  predictChurnRisk(customer, transactions = [], referenceDate = new Date()) {
    const safeCust = this.validateCustomer(customer);
    const safeTx = (Array.isArray(transactions) ? transactions : [])
      .map(t => this.validateTransaction(t))
      .filter(t => t.customerId === safeCust.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const refTime = new Date(referenceDate).getTime();

    if (safeTx.length === 0) {
      const daysSinceSignup = Math.max(0, Math.floor((refTime - safeCust.signupDate.getTime()) / (1000 * 60 * 60 * 24)));
      const score = daysSinceSignup > 60 ? 0.95 : daysSinceSignup > 30 ? 0.65 : 0.30;
      return {
        customerId: safeCust.id,
        churnProbability: score,
        riskTier: score >= 0.70 ? "HIGH_RISK" : score >= 0.35 ? "MODERATE_RISK" : "LOW_RISK",
        reason: "Zero historical purchases. Signup age decay.",
        recommendation: score >= 0.70 ? "Send high-urgency welcome incentive" : "Deploy onboarding nurture email"
      };
    }

    if (safeTx.length === 1) {
      const daysSinceTx = Math.max(0, Math.floor((refTime - safeTx[0].date.getTime()) / (1000 * 60 * 60 * 24)));
      let score = Math.min(1.0, daysSinceTx / 90);
      score = Math.round(score * 100) / 100;
      return {
        customerId: safeCust.id,
        churnProbability: score,
        riskTier: score >= 0.70 ? "HIGH_RISK" : score >= 0.35 ? "MODERATE_RISK" : "LOW_RISK",
        reason: `Single purchase ${daysSinceTx} days ago.`,
        recommendation: score >= 0.70 ? "Execute 2nd purchase re-engagement offer" : "Standard cross-sell follow-up"
      };
    }

    // Multiple purchases: calculate historical average order gap
    let totalGaps = 0;
    for (let i = 1; i < safeTx.length; i++) {
      const gap = Math.max(1, Math.floor((safeTx[i].date.getTime() - safeTx[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)));
      totalGaps += gap;
    }
    const avgGap = totalGaps / (safeTx.length - 1);
    const lastTx = safeTx[safeTx.length - 1];
    const daysSinceLast = Math.max(0, Math.floor((refTime - lastTx.date.getTime()) / (1000 * 60 * 60 * 24)));

    // Ratio of current dormancy to typical cycle
    const dormancyRatio = daysSinceLast / avgGap;

    // Monetary trajectory: recent spend vs overall average
    const recentTx = safeTx.slice(-2);
    const recentAvg = (recentTx[0].amount + recentTx[1].amount) / 2;
    const overallAvg = safeTx.reduce((acc, t) => acc + t.amount, 0) / safeTx.length;
    const spendTrajectory = overallAvg > 0 ? recentAvg / overallAvg : 1.0;

    let churnProb = 0.0;
    if (dormancyRatio <= 1.0) {
      churnProb = 0.15 * dormancyRatio;
    } else if (dormancyRatio <= 2.0) {
      churnProb = 0.15 + 0.35 * (dormancyRatio - 1.0);
    } else if (dormancyRatio <= 3.5) {
      churnProb = 0.50 + 0.30 * ((dormancyRatio - 2.0) / 1.5);
    } else {
      churnProb = Math.min(0.99, 0.80 + 0.19 * ((dormancyRatio - 3.5) / 2.0));
    }

    // Adjust based on spend trajectory (declining spend increases churn risk)
    if (spendTrajectory < 0.7) churnProb = Math.min(0.99, churnProb + 0.10);
    if (spendTrajectory > 1.3) churnProb = Math.max(0.05, churnProb - 0.08);

    churnProb = Math.round(churnProb * 100) / 100;
    const riskTier = churnProb >= 0.70 ? "HIGH_RISK" : churnProb >= 0.35 ? "MODERATE_RISK" : "LOW_RISK";

    let recommendation;
    if (riskTier === "HIGH_RISK") {
      recommendation = "Deploy high-priority win-back campaign with direct executive outreach or discount.";
    } else if (riskTier === "MODERATE_RISK") {
      recommendation = "Trigger engagement check-in and product recommendation quiz.";
    } else {
      recommendation = "Maintain regular loyalty rewards and VIP updates.";
    }

    return {
      customerId: safeCust.id,
      churnProbability: churnProb,
      riskTier,
      averageOrderGapDays: Math.round(avgGap * 10) / 10,
      daysSinceLastOrder: daysSinceLast,
      dormancyRatio: Math.round(dormancyRatio * 100) / 100,
      spendTrajectory: Math.round(spendTrajectory * 100) / 100,
      recommendation
    };
  }

  /**
   * Generates Cohort Retention Matrix based on Acquisition Month.
   */
  generateCohortMatrix(customers = [], transactions = []) {
    const safeCust = (Array.isArray(customers) ? customers : []).map(c => this.validateCustomer(c));
    const safeTx = (Array.isArray(transactions) ? transactions : []).map(t => this.validateTransaction(t));

    // Map each customer to their cohort (month of signup or first transaction)
    const custFirstMonth = new Map();
    for (const c of safeCust) {
      const month = `${c.signupDate.getFullYear()}-${String(c.signupDate.getMonth() + 1).padStart(2, "0")}`;
      custFirstMonth.set(c.id, month);
    }
    for (const tx of safeTx) {
      if (!custFirstMonth.has(tx.customerId)) {
        const month = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
        custFirstMonth.set(tx.customerId, month);
      }
    }

    // Cohort tracking structure
    const cohorts = new Map(); // "YYYY-MM" -> { size, activeByMonthIndex: Map<number, Set<customerId>> }

    for (const [custId, cohortMonth] of custFirstMonth.entries()) {
      if (!cohorts.has(cohortMonth)) {
        cohorts.set(cohortMonth, { size: 0, months: new Map() });
      }
      cohorts.get(cohortMonth).size++;
    }

    for (const tx of safeTx) {
      const cohortMonth = custFirstMonth.get(tx.customerId);
      if (!cohortMonth) continue;

      const [cYear, cMonth] = cohortMonth.split("-").map(Number);
      const txYear = tx.date.getFullYear();
      const txMonth = tx.date.getMonth() + 1;

      const monthIndex = (txYear - cYear) * 12 + (txMonth - cMonth);
      if (monthIndex < 0) continue;

      const cohortData = cohorts.get(cohortMonth);
      if (!cohortData.months.has(monthIndex)) {
        cohortData.months.set(monthIndex, new Set());
      }
      cohortData.months.get(monthIndex).add(tx.customerId);
    }

    // Format output table
    const matrix = [];
    const sortedCohorts = Array.from(cohorts.keys()).sort();

    for (const cohortName of sortedCohorts) {
      const cData = cohorts.get(cohortName);
      const retention = {};
      const maxMonth = Math.max(0, ...Array.from(cData.months.keys()));

      for (let m = 0; m <= Math.min(12, maxMonth); m++) {
        const activeCount = cData.months.has(m) ? cData.months.get(m).size : (m === 0 ? cData.size : 0);
        const rate = cData.size > 0 ? Math.round((activeCount / cData.size) * 1000) / 10 : 0;
        retention[`M${m}`] = { active: activeCount, ratePercent: rate };
      }

      matrix.push({
        cohort: cohortName,
        totalCustomers: cData.size,
        retention
      });
    }

    return matrix;
  }

  /**
   * Statistical Spend Anomaly Detection (Z-Score Based).
   */
  detectSpendAnomalies(transactions = [], thresholdZ = null) {
    const threshold = typeof thresholdZ === "number" ? thresholdZ : this.anomalyThresholdZ;
    const safeTx = (Array.isArray(transactions) ? transactions : []).map(t => this.validateTransaction(t));

    if (safeTx.length < 3) return { anomalies: [], count: 0, mean: 0, stdDev: 0 };

    const amounts = safeTx.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (amounts.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return { anomalies: [], count: 0, mean, stdDev: 0 };

    const anomalies = [];
    for (const tx of safeTx) {
      const zScore = (tx.amount - mean) / stdDev;
      if (Math.abs(zScore) >= threshold) {
        anomalies.push({
          transactionId: tx.id,
          customerId: tx.customerId,
          amount: tx.amount,
          date: tx.date.toISOString(),
          zScore: Math.round(zScore * 100) / 100,
          anomalyType: zScore > 0 ? "HIGH_SPEND_SPIKE" : "LOW_SPEND_OUTLIER"
        });
      }
    }

    return {
      anomalies,
      count: anomalies.length,
      mean: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      thresholdZ: threshold
    };
  }

  /**
   * Generates Executive Summary Portfolio Metrics & Health Assessment.
   */
  generateExecutiveSummary(customers = [], transactions = [], referenceDate = new Date()) {
    const rfm = this.calculateRFM(customers, transactions, referenceDate);
    const ltv = this.calculateLTV(customers, transactions);
    const anomalies = this.detectSpendAnomalies(transactions);

    let highRiskCount = 0;
    for (const cust of customers) {
      const risk = this.predictChurnRisk(cust, transactions, referenceDate);
      if (risk.riskTier === "HIGH_RISK") highRiskCount++;
    }

    const churnRate = customers.length > 0 ? Math.round((highRiskCount / customers.length) * 1000) / 10 : 0;
    const championsCount = rfm.segmentCounts["CHAMPIONS"] || 0;
    const loyalCount = rfm.segmentCounts["LOYAL_CUSTOMERS"] || 0;
    const healthyBasePct = customers.length > 0 ? Math.round(((championsCount + loyalCount) / customers.length) * 1000) / 10 : 0;

    // Overall Customer Portfolio Health Score (0 - 100)
    let healthScore = 70;
    if (healthyBasePct > 30) healthScore += 15;
    if (churnRate > 30) healthScore -= 20;
    if (rfm.totalCustomers > 10) healthScore += 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      portfolioHealthScore: healthScore,
      totalCustomers: rfm.totalCustomers,
      totalRevenue: rfm.totalRevenue,
      averageHistoricalLtv: ltv.averageHistoricalLtv,
      averagePredictiveLtv: ltv.averagePredictiveLtv,
      churnRiskCustomers: highRiskCount,
      churnRatePercent: churnRate,
      healthyBasePercent: healthyBasePct,
      segmentDistribution: rfm.segmentCounts,
      anomaliesDetected: anomalies.count,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  CustomerAnalytics
};