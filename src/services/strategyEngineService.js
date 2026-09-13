/**
 * GARUDA Strategy Engine — Ties Everything Together
 *
 * Reads: Feedback Loop + Analytics + Decisions + Memory + Self-Analytics
 * Outputs: Actionable strategies with priorities
 *
 * This is GARUDA's "brain" that connects all modules.
 */

const feedbackLoop = require("./feedbackLoopService");
const analytics = require("./outreachAnalyticsService");
const decisions = require("./autonomousDecisionEngine");
const memory = require("./semanticMemoryService");
const selfAnalytics = require("./selfAnalyticsService");

// ──────────────────────────────────────────────────────────────────────────────
// 1. GENERATE STRATEGY — The master strategy
// ──────────────────────────────────────────────────────────────────────────────

function generateStrategy() {
  const performance = feedbackLoop.analyzePerformance();
  const recommendations = feedbackLoop.getStrategyRecommendations();
  const decisionSummary = decisions.getDecisionSummary();
  const memoryStats = memory.getMemoryStats();
  const health = selfAnalytics.healthCheck();
  const effectiveness = selfAnalytics.analyzeEffectiveness();

  // Build strategy based on current state
  const strategy = {
    generatedAt: new Date().toISOString(),
    currentSituation: assessSituation(performance, health),
    immediateActions: getImmediateActions(performance, decisionSummary),
    shortTermStrategy: getShortTermStrategy(performance, effectiveness),
    longTermGoals: getLongTermGoals(performance, memoryStats),
    riskAssessment: assessRisks(performance, health),
    confidenceScore: calculateConfidence(performance, memoryStats, health)
  };

  // Store strategy in memory
  memory.storeMemory({
    type: memory.MEMORY_TYPES.STRATEGY,
    content: `Strategy generated: ${strategy.currentSituation.summary}. Confidence: ${strategy.confidenceScore}%`,
    context: strategy,
    tags: ["strategy", "auto-generated"],
    importance: 8
  });

  return strategy;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. ASSESS SITUATION — Where are we now?
// ──────────────────────────────────────────────────────────────────────────────

function assessSituation(performance, health) {
  const replyRate = parseFloat(performance.summary?.replyRate || 0);
  const totalSent = performance.summary?.total || 0;
  const healthStatus = health.status;

  let situation = "UNKNOWN";
  let summary = "";

  if (totalSent === 0) {
    situation = "NOT_STARTED";
    summary = "Koi outreach start nahi hua. Pehla email bhejo.";
  } else if (replyRate === 0 && totalSent >= 20) {
    situation = "CRITICAL";
    summary = `${totalSent} emails bheje, 0 reply. Strategy bilkul galat hai.`;
  } else if (replyRate < 2) {
    situation = "STRUGGLING";
    summary = `Reply rate ${replyRate}% hai. Improve karna padega.`;
  } else if (replyRate < 5) {
    situation = "DECENT";
    summary = `Reply rate ${replyRate}% hai. Accha hai par aur better ho sakta hai.`;
  } else if (replyRate < 10) {
    situation = "GOOD";
    summary = `Reply rate ${replyRate}% hai. Strategy kaam kar rahi hai.`;
  } else {
    situation = "EXCELLENT";
    summary = `Reply rate ${replyRate}% hai. Bahut accha performance!`;
  }

  if (healthStatus === "CRITICAL") {
    summary += " WARNING: System health critical hai!";
  }

  return { situation, summary, replyRate, totalSent, healthStatus };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. IMMEDIATE ACTIONS — Abhi kya karna hai
// ──────────────────────────────────────────────────────────────────────────────

function getImmediateActions(performance, decisionSummary) {
  const actions = [];
  const replyRate = parseFloat(performance.summary?.replyRate || 0);

  if (replyRate === 0 && performance.summary?.sent >= 10) {
    actions.push({
      priority: "CRITICAL",
      action: "SAAB STOP KARO",
      reason: "0% reply rate. Email template bilkul galat hai.",
      steps: [
        "Current email template band karo",
        "Naya template banao: personalized + specific value",
        "10 emails test karo naye template se",
        "Reply rate check karo"
      ]
    });
  }

  if (performance.worstTemplate && performance.worstTemplate.sent >= 5) {
    actions.push({
      priority: "HIGH",
      action: `Template "${performance.worstTemplate.name}" band karo`,
      reason: `${performance.worstTemplate.sent} emails, 0 replies`,
      steps: ["Is template ko use mat karo", "Best template pe switch karo"]
    });
  }

  if (decisionSummary.pending > 0) {
    actions.push({
      priority: "MEDIUM",
      action: `${decisionSummary.pending} pending decisions approve karo`,
      reason: "GARUDA kuch decisions ka wait kar raha hai",
      steps: ["Dashboard pe jao", "Pending decisions review karo", "Approve karo"]
    });
  }

  return actions;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. SHORT-TERM STRATEGY — 7 din ka plan
// ──────────────────────────────────────────────────────────────────────────────

function getShortTermStrategy(performance, effectiveness) {
  const replyRate = parseFloat(performance.summary?.replyRate || 0);
  const strategy = [];

  if (replyRate < 2) {
    strategy.push({
      day: "Day 1-2",
      action: "Template Rewrite",
      details: "Naya email template banao: Company name + specific problem + proof + CTA",
      expected: "Template ready for testing"
    });
    strategy.push({
      day: "Day 3-4",
      action: "A/B Testing",
      details: "2 templates banao, 20-20 emails bhejo, compare karo",
      expected: "Data on which template works"
    });
    strategy.push({
      day: "Day 5-7",
      action: "Scale Winner",
      details: "Jo template better kare, usse zyada bhejo",
      expected: "Reply rate 2-5% tak improve"
    });
  } else {
    strategy.push({
      day: "Day 1-3",
      action: "Double Down",
      details: "Jo template kaam kar raha hai, usse aur bhejo",
      expected: "More replies, more leads"
    });
    strategy.push({
      day: "Day 4-5",
      action: "Follow-up Sequence",
      details: "Non-responders ko 3 din baad followup bhejo",
      expected: "Additional 2-3% replies"
    });
    strategy.push({
      day: "Day 6-7",
      action: "New Segment Test",
      details: "Naye target segment pe test karo",
      expected: "New revenue channel"
    });
  }

  return strategy;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. LONG-TERM GOALS — 30 din ka plan
// ──────────────────────────────────────────────────────────────────────────────

function getLongTermGoals(performance, memoryStats) {
  return [
    { goal: "Reply rate 5%+ tak lao", timeline: "30 days", metric: "replyRate" },
    { goal: "First paying client lo", timeline: "30 days", metric: "revenue" },
    { goal: "100+ emails track karo", timeline: "30 days", metric: "totalOutreach" },
    { goal: "3 working templates identify karo", timeline: "30 days", metric: "templates" },
    { goal: "Autonomous decisions 10+ karo", timeline: "30 days", metric: "autoDecisions" }
  ];
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. RISK ASSESSMENT — Kya galat ho sakta hai
// ──────────────────────────────────────────────────────────────────────────────

function assessRisks(performance, health) {
  const risks = [];
  const replyRate = parseFloat(performance.summary?.replyRate || 0);

  if (replyRate === 0) {
    risks.push({
      risk: "Zero Revenue",
      probability: "HIGH",
      impact: "CRITICAL",
      mitigation: "Template rewrite + strategy change immediately"
    });
  }

  if (health.status === "CRITICAL") {
    risks.push({
      risk: "System Down",
      probability: "MEDIUM",
      impact: "HIGH",
      mitigation: "System health check karo, errors fix karo"
    });
  }

  const bounceRate = parseFloat(performance.summary?.bounceRate || 0);
  if (bounceRate > 15) {
    risks.push({
      risk: "Email Deliverability Destroyed",
      probability: "HIGH",
      impact: "HIGH",
      mitigation: "Email list clean karo, verified emails use karo"
    });
  }

  return risks;
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. CONFIDENCE SCORE — How confident is GARUDA?
// ──────────────────────────────────────────────────────────────────────────────

function calculateConfidence(performance, memoryStats, health) {
  let score = 50; // base

  const replyRate = parseFloat(performance.summary?.replyRate || 0);
  if (replyRate > 5) score += 20;
  else if (replyRate > 2) score += 10;
  else if (replyRate === 0) score -= 20;

  if (memoryStats.totalMemories > 10) score += 10;
  if (memoryStats.successRate !== "N/A") {
    const sr = parseFloat(memoryStats.successRate);
    if (sr > 70) score += 10;
    else if (sr < 30) score -= 10;
  }

  if (health.status === "HEALTHY") score += 10;
  else if (health.status === "CRITICAL") score -= 20;

  return Math.max(0, Math.min(100, score));
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. MASTER DASHBOARD — Sab kuch ek jagah
// ──────────────────────────────────────────────────────────────────────────────

function getMasterDashboard() {
  return {
    strategy: generateStrategy(),
    performance: feedbackLoop.analyzePerformance(),
    decisions: decisions.getDecisionSummary(),
    memory: memory.getMemoryStats(),
    selfAnalytics: selfAnalytics.getDashboard(),
    feedbackDashboard: feedbackLoop.getDashboard(),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  generateStrategy,
  getMasterDashboard,
  assessSituation,
  getImmediateActions,
  getShortTermStrategy,
  getLongTermGoals,
  assessRisks,
  calculateConfidence
};
