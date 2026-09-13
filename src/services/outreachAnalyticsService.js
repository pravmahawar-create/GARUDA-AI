/**
 * GARUDA Outreach Analytics Service — Deep Analysis & Strategy
 *
 * Analyzes outreach patterns, identifies what's working,
 * recommends strategy changes, and tracks improvement over time.
 */

const fs = require("fs");
const path = require("path");
const feedbackLoop = require("./feedbackLoopService");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const STRATEGY_LOG = path.join(DATA_DIR, "strategy-changes.json");
const EMAIL_TEMPLATES = path.join(DATA_DIR, "email-templates.json");

// ──────────────────────────────────────────────────────────────────────────────
// 1. EMAIL TEMPLATE MANAGEMENT — Track which templates work
// ──────────────────────────────────────────────────────────────────────────────

function loadTemplates() {
  try {
    if (!fs.existsSync(EMAIL_TEMPLATES)) return { templates: [], active: null };
    return JSON.parse(fs.readFileSync(EMAIL_TEMPLATES, "utf8"));
  } catch {
    return { templates: [], active: null };
  }
}

function saveTemplates(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(EMAIL_TEMPLATES, JSON.stringify(data, null, 2));
}

function registerTemplate({ id, name, subject, body, category }) {
  const data = loadTemplates();
  const template = {
    id: id || `tpl_${Date.now()}`,
    name,
    subject,
    body,
    category: category || "general",
    createdAt: new Date().toISOString(),
    stats: { sent: 0, replied: 0, positive: 0, negative: 0, replyRate: 0 }
  };
  data.templates.push(template);
  saveTemplates(data);
  console.log(`[Analytics] Template registered: ${name}`);
  return template.id;
}

function getTemplatePerformance() {
  const data = loadTemplates();
  const feedback = feedbackLoop.loadFeedbackDB();

  // Update stats from feedback data
  for (const tpl of data.templates) {
    const related = feedback.campaigns.filter(c => c.template === tpl.name || c.template === tpl.id);
    tpl.stats.sent = related.length;
    tpl.stats.replied = related.filter(c => c.replied).length;
    tpl.stats.positive = related.filter(c => c.replySentiment === "positive").length;
    tpl.stats.negative = related.filter(c => c.replySentiment === "negative").length;
    tpl.stats.replyRate = tpl.stats.sent > 0
      ? ((tpl.stats.replied / tpl.stats.sent) * 100).toFixed(1)
      : 0;
  }

  // Sort by reply rate
  data.templates.sort((a, b) => parseFloat(b.stats.replyRate) - parseFloat(a.stats.replyRate));

  saveTemplates(data);
  return data.templates;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. STRATEGY TRACKER — Log strategy changes and their impact
// ──────────────────────────────────────────────────────────────────────────────

function loadStrategyLog() {
  try {
    if (!fs.existsSync(STRATEGY_LOG)) return [];
    return JSON.parse(fs.readFileSync(STRATEGY_LOG, "utf8"));
  } catch {
    return [];
  }
}

function saveStrategyLog(log) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STRATEGY_LOG, JSON.stringify(log, null, 2));
}

function logStrategyChange({ change, reason, expectedImpact, previousMetric }) {
  const log = loadStrategyLog();
  const entry = {
    id: `strat_${Date.now()}`,
    change,
    reason,
    expectedImpact,
    previousMetric,
    changedAt: new Date().toISOString(),
    measuredAt: null,
    actualImpact: null,
    status: "active"
  };
  log.push(entry);
  saveStrategyLog(log);
  console.log(`[Analytics] Strategy change logged: ${change}`);
  return entry.id;
}

function measureStrategyImpact(strategyId) {
  const log = loadStrategyLog();
  const entry = log.find(s => s.id === strategyId);
  if (!entry) return null;

  const analysis = feedbackLoop.analyzePerformance();
  entry.measuredAt = new Date().toISOString();
  entry.actualImpact = {
    replyRate: analysis.summary?.replyRate,
    deliveryRate: analysis.summary?.deliveryRate,
    bounceRate: analysis.summary?.bounceRate
  };
  entry.status = "measured";
  saveStrategyLog(log);
  return entry;
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. A/B TESTING — Compare two approaches
// ──────────────────────────────────────────────────────────────────────────────

function compareTemplates(templateA, templateB) {
  const feedback = feedbackLoop.loadFeedbackDB();
  const campaigns = feedback.campaigns;

  const aData = campaigns.filter(c => c.template === templateA);
  const bData = campaigns.filter(c => c.template === templateB);

  const getStats = (data) => ({
    sent: data.length,
    replied: data.filter(c => c.replied).length,
    positive: data.filter(c => c.replySentiment === "positive").length,
    negative: data.filter(c => c.replySentiment === "negative").length,
    replyRate: data.length > 0 ? ((data.filter(c => c.replied).length / data.length) * 100).toFixed(1) : 0
  });

  const a = getStats(aData);
  const b = getStats(bData);

  const winner = parseFloat(a.replyRate) > parseFloat(b.replyRate) ? templateA : templateB;
  const confidence = Math.abs(parseFloat(a.replyRate) - parseFloat(b.replyRate));

  return {
    templateA: { name: templateA, ...a },
    templateB: { name: templateB, ...b },
    winner,
    confidence: confidence > 10 ? "HIGH" : confidence > 5 ? "MEDIUM" : "LOW",
    recommendation: confidence > 5
      ? `Use "${winner}" — ${confidence}% better performance`
      : "Both templates performing similarly — try a new variant"
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. TIME-BASED ANALYSIS — Best/worst times to send
// ──────────────────────────────────────────────────────────────────────────────

function analyzeSendTimes() {
  const feedback = feedbackLoop.loadFeedbackDB();
  const campaigns = feedback.campaigns;

  const hourStats = {};
  const dayStats = {};

  for (const c of campaigns) {
    if (!c.sentAt) continue;
    const date = new Date(c.sentAt);
    const hour = date.getHours();
    const day = date.toLocaleDateString("en-US", { weekday: "long" });

    if (!hourStats[hour]) hourStats[hour] = { sent: 0, replied: 0 };
    hourStats[hour].sent++;
    if (c.replied) hourStats[hour].replied++;

    if (!dayStats[day]) dayStats[day] = { sent: 0, replied: 0 };
    dayStats[day].sent++;
    if (c.replied) dayStats[day].replied++;
  }

  // Calculate reply rates
  for (const [hour, data] of Object.entries(hourStats)) {
    data.replyRate = data.sent > 0 ? ((data.replied / data.sent) * 100).toFixed(1) : 0;
  }
  for (const [day, data] of Object.entries(dayStats)) {
    data.replyRate = data.sent > 0 ? ((data.replied / data.sent) * 100).toFixed(1) : 0;
  }

  // Find best/worst
  const bestHour = Object.entries(hourStats).sort((a, b) => parseFloat(b[1].replyRate) - parseFloat(a[1].replyRate))[0];
  const bestDay = Object.entries(dayStats).sort((a, b) => parseFloat(b[1].replyRate) - parseFloat(a[1].replyRate))[0];

  return {
    byHour: hourStats,
    byDay: dayStats,
    bestHour: bestHour ? { hour: bestHour[0], ...bestHour[1] } : null,
    bestDay: bestDay ? { day: bestDay[0], ...bestDay[1] } : null,
    recommendation: bestHour
      ? `Best time to send: ${bestHour[0]}:00 IST on ${bestDay?.[0] || "any day"}`
      : "Not enough data for timing analysis"
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. DOMAIN ANALYSIS — Which email domains respond
// ──────────────────────────────────────────────────────────────────────────────

function analyzeDomains() {
  const feedback = feedbackLoop.loadFeedbackDB();
  const campaigns = feedback.campaigns;

  const domains = {};

  for (const c of campaigns) {
    if (!c.to) continue;
    const domain = c.to.split("@")[1] || "unknown";
    if (!domains[domain]) domains[domain] = { sent: 0, replied: 0, bounced: 0 };
    domains[domain].sent++;
    if (c.replied) domains[domain].replied++;
    if (c.status === "bounced") domains[domain].bounced++;
  }

  for (const [domain, data] of Object.entries(domains)) {
    data.replyRate = data.sent > 0 ? ((data.replied / data.sent) * 100).toFixed(1) : 0;
    data.bounceRate = data.sent > 0 ? ((data.bounced / data.sent) * 100).toFixed(1) : 0;
  }

  // Find best/worst domains
  const bestDomain = Object.entries(domains)
    .filter(([_, d]) => d.sent >= 3)
    .sort((a, b) => parseFloat(b[1].replyRate) - parseFloat(a[1].replyRate))[0];

  const worstDomain = Object.entries(domains)
    .filter(([_, d]) => d.sent >= 3)
    .sort((a, b) => parseFloat(a[1].replyRate) - parseFloat(b[1].replyRate))[0];

  return {
    domains,
    bestDomain: bestDomain ? { domain: bestDomain[0], ...bestDomain[1] } : null,
    worstDomain: worstDomain ? { domain: worstDomain[0], ...worstDomain[1] } : null
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. COMPREHENSIVE REPORT — Everything in one place
// ──────────────────────────────────────────────────────────────────────────────

function generateFullReport() {
  const performance = feedbackLoop.analyzePerformance();
  const recommendations = feedbackLoop.getStrategyRecommendations();
  const templates = getTemplatePerformance();
  const timing = analyzeSendTimes();
  const domains = analyzeDomains();
  const strategies = loadStrategyLog().slice(-5);

  return {
    generatedAt: new Date().toISOString(),
    performance,
    recommendations,
    templates,
    timing,
    domains,
    recentStrategies: strategies,
    executive_summary: {
      totalOutreach: performance.summary?.total || 0,
      replyRate: performance.summary?.replyRate || "0%",
      bestTemplate: performance.bestTemplate?.name || "None yet",
      topRecommendation: recommendations[0]?.change || "Start tracking",
      healthScore: calculateHealthScore(performance)
    }
  };
}

function calculateHealthScore(performance) {
  if (!performance.summary) return 0;
  const replyRate = parseFloat(performance.summary.replyRate) || 0;
  const deliveryRate = parseFloat(performance.summary.deliveryRate) || 0;
  const bounceRate = parseFloat(performance.summary.bounceRate) || 0;

  let score = 0;
  score += Math.min(replyRate * 10, 40); // Max 40 from reply rate
  score += Math.min(deliveryRate * 0.3, 30); // Max 30 from delivery
  score += Math.max(0, 30 - bounceRate * 3); // Max 30 from low bounce

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. AUTO-ADAPT — Let GARUDA learn and change strategy
// ──────────────────────────────────────────────────────────────────────────────

function autoAdaptStrategy() {
  const analysis = feedbackLoop.analyzePerformance();
  const recommendations = feedbackLoop.getStrategyRecommendations();
  const actions = [];

  // Auto-switch to best performing template
  if (analysis.bestTemplate && analysis.worstTemplate) {
    const bestRate = parseFloat(analysis.bestTemplate.replyRate);
    const worstRate = parseFloat(analysis.worstTemplate.replyRate);

    if (bestRate > worstRate + 5 && bestRate > 2) {
      actions.push({
        action: "SWITCH_TEMPLATE",
        from: analysis.worstTemplate.name,
        to: analysis.bestTemplate.name,
        reason: `Best template has ${bestRate}% reply rate vs ${worstRate}%`
      });
    }
  }

  // Alert if performance is terrible
  const replyRate = parseFloat(analysis.summary?.replyRate || 0);
  if (replyRate < 1 && analysis.summary?.sent >= 10) {
    actions.push({
      action: "PAUSE_OUTREACH",
      reason: `Reply rate is ${replyRate}% with ${analysis.summary?.sent} emails sent. Need to revise strategy before sending more.`,
      impact: "STOP all outreach until template is rewritten"
    });
  }

  // Recommend time-based changes
  const timing = analyzeSendTimes();
  if (timing.bestHour) {
    actions.push({
      action: "OPTIMIZE_TIMING",
      recommendation: `Send emails at ${timing.bestHour.hour}:00 IST on ${timing.bestDay?.day || "weekdays"}`,
      reason: `Highest reply rate observed at this time`
    });
  }

  return {
    autoActions: actions,
    manualRecommendations: recommendations,
    healthScore: calculateHealthScore(analysis),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  registerTemplate,
  getTemplatePerformance,
  logStrategyChange,
  measureStrategyImpact,
  compareTemplates,
  analyzeSendTimes,
  analyzeDomains,
  generateFullReport,
  autoAdaptStrategy,
  loadTemplates
};
