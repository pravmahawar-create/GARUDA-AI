# 🦅 GARUDA OS — CUSTOMER ANALYTICS ENGINE
## Technical Architecture & Operational Guide

**Authority:** Praveen Mahawar, Founder & Chief AI Architect  
**Platform:** GARUDA OS (garudaos.in)  
**Standard:** 100% Anti-Fabrication Law — Pure Node.js Implementation with Zero Third-Party Dependencies

---

## 1. ARCHITECTURAL OVERVIEW

The `CustomerAnalytics` engine provides deterministic, high-throughput customer intelligence for GARUDA platform tenants. It executes core mathematical and statistical models for:

1. **RFM Behavioral Segmentation**: Recency, Frequency, and Monetary quintile analysis.
2. **Customer Lifetime Value (CLV/LTV)**: Historical and predictive value projection.
3. **Churn Risk Prediction**: Dynamic dormancy analysis and spend-trend trajectory.
4. **Cohort Retention Matrices**: Multi-month retention tracking by customer acquisition vintage.
5. **Statistical Spend Anomaly Detection**: Z-Score based outlier identification.
6. **Executive Portfolio Reporting**: Unified health scoring and segmentation breakdown.

```
+---------------------------------------------------------------------------------+
|                       GARUDA CUSTOMER ANALYTICS ENGINE                          |
+---------------------------------------------------------------------------------+
        │                                                     │
        ▼                                                     ▼
+───────────────────────────+                         +───────────────────────────+
|     DATA VALIDATION       |                         |    ANALYTICAL MODELS      |
|  • Prototype Sanitizer    |                         |  • RFM Quintile Scorer    |
|  • Positive Amount Guard  |                         |  • Predictive CLV         |
|  • ISO Date Normalization |                         |  • Churn Risk Predictor   |
+───────────────────────────+                         |  • Cohort Matrix Builder  |
        │                                             |  • Z-Score Outlier Engine |
        └──────────────────────────┬──────────────────┴───────────────────────────┘
                                   ▼
+─────────────────────────────────────────────────────────────────────────────────+
|                          EXECUTIVE PORTFOLIO HEALTH                             |
|  • Health Score (0-100)      • Churn Rate %      • Segment Breakdown            |
+─────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. MATHEMATICAL & STATISTICAL SPECIFICATIONS

### 2.1 RFM Quintile Scoring
Customers are ranked into 5 equal quantiles (1 to 5) across three orthogonal vectors:
- **Recency ($R$)**: Days since latest transaction relative to reference date. Inverted so that recent orders yield score 5.
- **Frequency ($F$)**: Total verified purchase count.
- **Monetary ($M$)**: Cumulative gross spend.

Segments are assigned deterministically:
- `CHAMPIONS`: $R \ge 4, F \ge 4, M \ge 4$
- `LOYAL_CUSTOMERS`: $F \ge 3, M \ge 3, R \ge 3$
- `POTENTIAL_LOYALISTS`: $R \ge 4, F \ge 2$
- `NEW_CUSTOMERS`: $R \ge 4, F = 1$
- `AT_RISK`: $R \le 2, F \ge 3, M \ge 3$
- `HIBERNATING`: $R \le 2, F \le 2, M \le 2$
- `LOST`: $R = 1, F = 1, M = 1$

### 2.2 Predictive Customer Lifetime Value (CLV)
$$\text{Predictive CLV} = \text{Historical LTV} + \left( \text{AOV} \times \text{Annual Frequency} \times \text{Gross Margin} \times \text{Projected Lifespan} \right)$$
Where:
- $\text{AOV} = \frac{\sum \text{Spend}}{\text{Order Count}}$
- $\text{Annual Frequency} = \frac{\text{Order Count}}{\text{Tenure Days}} \times 365$
- Default Gross Margin = $0.70$ (70%)
- Default Projected Lifespan = $3$ Years

### 2.3 Churn Probability Model
$$\text{Dormancy Ratio} = \frac{\text{Days Since Last Purchase}}{\text{Average Historical Order Gap}}$$
- $\text{Dormancy Ratio} \le 1.0 \implies \text{Churn} < 0.15$
- $1.0 < \text{Dormancy Ratio} \le 2.0 \implies \text{Churn} \in [0.15, 0.50]$
- $2.0 < \text{Dormancy Ratio} \le 3.5 \implies \text{Churn} \in [0.50, 0.80]$
- $\text{Dormancy Ratio} > 3.5 \implies \text{Churn} \ge 0.80$
- Spend Trajectory Modifier: Declining spend in the latest two orders adds up to $+0.10$ to churn probability.

### 2.4 Z-Score Anomaly Detection
$$Z = \frac{X - \mu}{\sigma}$$
Transactions with $|Z| \ge 2.5$ are flagged as statistical spend anomalies.

---

## 3. SECURITY & SOVEREIGN GOVERNANCE

1. **Prototype Pollution Immunity**:
   All incoming objects are passed through `CustomerAnalytics.sanitizeRecord()`. Keys matching `__proto__`, `constructor`, or `prototype` are stripped before property access.
2. **Zero Runtime Dependencies**:
   Constructed exclusively with native Node.js built-ins (`crypto`, `Date`, `Map`, `Set`), eliminating supply-chain attack vectors.
3. **Strict Path Confinement**:
   No disk access or shell execution occurs within this module.

---

## 4. API REFERENCE

```javascript
const { CustomerAnalytics } = require('./src/services/customerAnalytics');

const engine = new CustomerAnalytics({
  grossMargin: 0.70,
  defaultLifespanYears: 3,
  anomalyThresholdZ: 2.5
});

// 1. RFM Scoring
const rfm = engine.calculateRFM(customers, transactions);

// 2. Lifetime Value
const ltv = engine.calculateLTV(customers, transactions);

// 3. Churn Risk
const churn = engine.predictChurnRisk(customer, transactions);

// 4. Cohort Retention Matrix
const cohorts = engine.generateCohortMatrix(customers, transactions);

// 5. Spend Anomalies
const anomalies = engine.detectSpendAnomalies(transactions);

// 6. Executive Summary
const summary = engine.generateExecutiveSummary(customers, transactions);
```
