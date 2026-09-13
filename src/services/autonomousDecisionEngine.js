/**
 * GARUDA Autonomous Decision Engine
 *
 * Allows GARUDA to make small decisions without founder approval.
 * Big decisions still need founder approval.
 *
 * Decision Tiers:
 * - AUTO: GARUDA decides and executes (email template changes, timing)
 * - SUGGEST: GARUDA suggests, founder approves (new campaigns, strategy shifts)
 * - ESCALATE: Founder must decide (money, client commitments, legal)
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DECISIONS_LOG = path.join(DATA_DIR, "autonomous-decisions.json");
const DECISION_RULES = path.join(DATA_DIR, "decision-rules.json");

// ──────────────────────────────────────────────────────────────────────────────
// 1. DECISION CATEGORIES — What can GARUDA decide alone?
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_RULES = {
  // AUTO — GARUDA decides and executes
  AUTO: [
    "switch_to_best_template",
    "pause_low_performing_campaign",
    "adjust_send_time",
    "retry_bounced_email_with_different_subject",
    "send_followup_after_3_days",
    "update_email_subject_line",
    "blacklist_unresponsive_domains",
    "prioritize_high_engagement_categories"
  ],
  // SUGGEST — GARUDA suggests, founder approves
  SUGGEST: [
    "start_new_campaign",
    "change_email_strategy",
    "add_new_target_segment",
    "increase_send_frequency",
    "create_new_template",
    "switch_to_different_platform"
  ],
  // ESCALATE — Founder must decide
  ESCALATE: [
    "spend_money",
    "commit_to_client",
    "sign_contract",
    "hire_someone",
    "launch_paid_ads",
    "share_revenue_data",
    "accept_deal_terms"
  ]
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. LOAD / SAVE
// ──────────────────────────────────────────────────────────────────────────────

function loadRules() {
  try {
    if (!fs.existsSync(DECISION_RULES)) return DEFAULT_RULES;
    return { ...DEFAULT_RULES, ...JSON.parse(fs.readFileSync(DECISION_RULES, "utf8")) };
  } catch {
    return DEFAULT_RULES;
  }
}

function loadDecisionsLog() {
  try {
    if (!fs.existsSync(DECISIONS_LOG)) return [];
    return JSON.parse(fs.readFileSync(DECISIONS_LOG, "utf8"));
  } catch {
    return [];
  }
}

function saveDecisionsLog(log) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DECISIONS_LOG, JSON.stringify(log, null, 2));
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. MAKE DECISION — Core decision logic
// ──────────────────────────────────────────────────────────────────────────────

function makeDecision({ type, context, reason, impact }) {
  const rules = loadRules();
  const log = loadDecisionsLog();

  // Determine tier
  let tier = "ESCALATE";
  if (rules.AUTO.includes(type)) tier = "AUTO";
  else if (rules.SUGGEST.includes(type)) tier = "SUGGEST";

  const decision = {
    id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    tier,
    context,
    reason,
    impact,
    decidedAt: new Date().toISOString(),
    status: tier === "AUTO" ? "executed" : "pending",
    executedAt: tier === "AUTO" ? new Date().toISOString() : null,
    founderApproved: tier === "AUTO" ? true : false,
    result: null
  };

  log.push(decision);
  saveDecisionsLog(log);

  console.log(`[DecisionEngine] ${tier}: ${type} — ${reason}`);

  return decision;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. AUTO-DECISIONS — What GARUDA can do automatically
// ──────────────────────────────────────────────────────────────────────────────

function autoSwitchToBestTemplate(analysis) {
  if (!analysis.bestTemplate || !analysis.worstTemplate) return null;
  const bestRate = parseFloat(analysis.bestTemplate.replyRate);
  const worstRate = parseFloat(analysis.worstTemplate.replyRate);

  if (bestRate > worstRate + 3 && bestRate > 1) {
    return makeDecision({
      type: "switch_to_best_template",
      context: `Best: "${analysis.bestTemplate.name}" (${bestRate}%) vs Worst: "${analysis.worstTemplate.name}" (${worstRate}%)`,
      reason: `Performance gap is ${bestRate - worstRate}%`,
      impact: `Expected reply rate improvement: ${bestRate - worstRate}%`
    });
  }
  return null;
}

function autoPauseLowCampaign(analysis) {
  const replyRate = parseFloat(analysis.summary?.replyRate || 0);
  const totalSent = analysis.summary?.sent || 0;

  if (replyRate < 0.5 && totalSent >= 20) {
    return makeDecision({
      type: "pause_low_performing_campaign",
      context: `Reply rate: ${replyRate}% with ${totalSent} emails sent`,
      reason: "Campaign performing below minimum threshold",
      impact: "Stop wasting emails on ineffective approach"
    });
  }
  return null;
}

function autoAdjustSendTime(timingAnalysis) {
  if (timingAnalysis.bestHour) {
    return makeDecision({
      type: "adjust_send_time",
      context: `Best time: ${timingAnalysis.bestHour.hour}:00 IST on ${timingAnalysis.bestDay?.day || "weekdays"}`,
      reason: "Timing analysis shows higher reply rates at this time",
      impact: "Expected 10-20% improvement in open/reply rates"
    });
  }
  return null;
}

function autoBlacklistDomains(domainAnalysis) {
  const badDomains = Object.entries(domainAnalysis.domains || {})
    .filter(([_, data]) => data.sent >= 5 && data.replyRate === "0" && data.bounceRate > 20)
    .map(([domain, data]) => ({ domain, bounceRate: data.bounceRate }));

  if (badDomains.length > 0) {
    return makeDecision({
      type: "blacklist_unresponsive_domains",
      context: `Domains with >20% bounce rate: ${badDomains.map(d => d.domain).join(", ")}`,
      reason: "High bounce rate damages sender reputation",
      impact: "Improved deliverability and sender score"
    });
  }
  return null;
}

function autoSendFollowup(outreachEntry) {
  if (!outreachEntry.replied && outreachEntry.sentAt) {
    const daysSinceSent = (Date.now() - new Date(outreachEntry.sentAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSent >= 3 && daysSinceSent <= 7) {
      return makeDecision({
        type: "send_followup_after_3_days",
        context: `No reply from ${outreachEntry.to} after ${Math.round(daysSinceSent)} days`,
        reason: "3-day followup window reached",
        impact: "Potential 2-3% additional reply rate"
      });
    }
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. RUN ALL AUTO-DECISIONS — Analyze and act
// ──────────────────────────────────────────────────────────────────────────────

function runAutoDecisions() {
  const feedbackLoop = require("./feedbackLoopService");
  const analytics = require("./outreachAnalyticsService");

  const analysis = feedbackLoop.analyzePerformance();
  const timing = analytics.analyzeSendTimes();
  const domains = analytics.analyzeDomains();

  const decisions = [];

  // Run all auto-decision checks
  const d1 = autoSwitchToBestTemplate(analysis);
  if (d1) decisions.push(d1);

  const d2 = autoPauseLowCampaign(analysis);
  if (d2) decisions.push(d2);

  const d3 = autoAdjustSendTime(timing);
  if (d3) decisions.push(d3);

  const d4 = autoBlacklistDomains(domains);
  if (d4) decisions.push(d4);

  // Check for followups needed
  const db = feedbackLoop.loadFeedbackDB();
  for (const entry of db.campaigns) {
    const d5 = autoSendFollowup(entry);
    if (d5) decisions.push(d5);
  }

  console.log(`[DecisionEngine] Auto-executed ${decisions.length} decisions`);
  return decisions;
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. GET PENDING DECISIONS — What needs founder approval
// ──────────────────────────────────────────────────────────────────────────────

function getPendingDecisions() {
  const log = loadDecisionsLog();
  return log.filter(d => d.status === "pending");
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. APPROVE DECISION — Founder approves a pending decision
// ──────────────────────────────────────────────────────────────────────────────

function approveDecision(decisionId) {
  const log = loadDecisionsLog();
  const decision = log.find(d => d.id === decisionId);
  if (!decision) return null;

  decision.status = "executed";
  decision.founderApproved = true;
  decision.executedAt = new Date().toISOString();
  saveDecisionsLog(log);

  console.log(`[DecisionEngine] Approved: ${decision.type}`);
  return decision;
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. DECISION SUMMARY — For dashboard
// ──────────────────────────────────────────────────────────────────────────────

function getDecisionSummary() {
  const log = loadDecisionsLog();
  const total = log.length;
  const auto = log.filter(d => d.tier === "AUTO").length;
  const suggest = log.filter(d => d.tier === "SUGGEST").length;
  const escalate = log.filter(d => d.tier === "ESCALATE").length;
  const pending = log.filter(d => d.status === "pending").length;
  const executed = log.filter(d => d.status === "executed").length;

  return {
    total,
    auto,
    suggest,
    escalate,
    pending,
    executed,
    recentDecisions: log.slice(-5).reverse()
  };
}

module.exports = {
  makeDecision,
  runAutoDecisions,
  getPendingDecisions,
  approveDecision,
  getDecisionSummary,
  DEFAULT_RULES
};
