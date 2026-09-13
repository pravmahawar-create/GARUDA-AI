/**
 * GARUDA Feedback Loop Service — Core Tracking Engine
 *
 * Tracks: Email Sent → Delivered → Opened → Replied → Converted
 * Analyzes: What worked, what didn't
 * Adapts: Strategy changes based on results
 *
 * This is GARUDA's "learning from mistakes" system.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const FEEDBACK_DB = path.join(DATA_DIR, "feedback-loop-db.json");
const OUTREACH_LOG = path.join(DATA_DIR, "outreach-dispatch-log.json");

// ──────────────────────────────────────────────────────────────────────────────
// 1. FEEDBACK DATABASE — Track every outreach attempt
// ──────────────────────────────────────────────────────────────────────────────

function loadFeedbackDB() {
  try {
    if (!fs.existsSync(FEEDBACK_DB)) return { campaigns: [], insights: [], lastAnalysis: null };
    const raw = fs.readFileSync(FEEDBACK_DB, "utf8");
    return JSON.parse(raw);
  } catch {
    return { campaigns: [], insights: [], lastAnalysis: null };
  }
}

function saveFeedbackDB(db) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FEEDBACK_DB, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("[FeedbackLoop] Save failed:", e.message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. RECORD — Track when email is sent
// ──────────────────────────────────────────────────────────────────────────────

function recordEmailSent({ campaignId, to, subject, template, category, metadata = {} }) {
  const db = loadFeedbackDB();
  const entry = {
    id: `outreach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    campaignId: campaignId || "unknown",
    to,
    subject,
    template: template || "default",
    category: category || "general",
    sentAt: new Date().toISOString(),
    status: "sent",
    delivered: null,
    opened: null,
    replied: null,
    repliedAt: null,
    replySentiment: null,
    converted: false,
    metadata
  };
  db.campaigns.push(entry);
  saveFeedbackDB(db);
  console.log(`[FeedbackLoop] Recorded: ${to} | Template: ${template} | Campaign: ${campaignId}`);
  return entry.id;
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. RECORD RESPONSE — Track when reply comes
// ──────────────────────────────────────────────────────────────────────────────

function recordReply(outreachId, { replyText, sentiment, repliedAt }) {
  const db = loadFeedbackDB();
  const entry = db.campaigns.find(c => c.id === outreachId);
  if (!entry) {
    console.log(`[FeedbackLoop] Outreach ${outreachId} not found`);
    return false;
  }
  entry.replied = true;
  entry.repliedAt = repliedAt || new Date().toISOString();
  entry.replySentiment = sentiment || analyzeSentiment(replyText || "");
  entry.status = "replied";
  saveFeedbackDB(db);
  console.log(`[FeedbackLoop] Reply recorded: ${entry.to} | Sentiment: ${entry.replySentiment}`);
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. RECORD DELIVERY — Track bounce/delivery status
// ──────────────────────────────────────────────────────────────────────────────

function recordDelivery(outreachId, { delivered, bounceType }) {
  const db = loadFeedbackDB();
  const entry = db.campaigns.find(c => c.id === outreachId);
  if (!entry) return false;
  entry.delivered = delivered;
  entry.bounceType = bounceType || null;
  entry.status = delivered ? "delivered" : "bounced";
  saveFeedbackDB(db);
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. SENTIMENT ANALYSIS — Basic text sentiment
// ──────────────────────────────────────────────────────────────────────────────

function analyzeSentiment(text) {
  if (!text) return "unknown";
  const lower = text.toLowerCase();
  const positive = ["thanks", "thank you", "interested", "tell me more", "let's talk", "schedule", "demo", "yes", "great", "awesome", "love it", "impressed"];
  const negative = ["not interested", "no thanks", "unsubscribe", "stop", "remove", "spam", "don't contact", "go away", "busy", "later"];
  const neutral = ["received", "noted", "okay", "ok", "will review", "team will review"];

  const posCount = positive.filter(w => lower.includes(w)).length;
  const negCount = negative.filter(w => lower.includes(w)).length;
  const neuCount = neutral.filter(w => lower.includes(w)).length;

  if (negCount > 0) return "negative";
  if (posCount > 0) return "positive";
  if (neuCount > 0) return "neutral";
  return "unknown";
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. ANALYSIS — What's working, what's not
// ──────────────────────────────────────────────────────────────────────────────

function analyzePerformance() {
  const db = loadFeedbackDB();
  const campaigns = db.campaigns;

  if (campaigns.length === 0) {
    return { error: "No campaigns tracked yet" };
  }

  // Overall stats
  const total = campaigns.length;
  const sent = campaigns.filter(c => c.status === "sent" || c.status === "delivered" || c.status === "replied" || c.status === "bounced").length;
  const delivered = campaigns.filter(c => c.delivered === true).length;
  const bounced = campaigns.filter(c => c.status === "bounced").length;
  const replied = campaigns.filter(c => c.replied === true).length;
  const positiveReplies = campaigns.filter(c => c.replySentiment === "positive").length;
  const negativeReplies = campaigns.filter(c => c.replySentiment === "negative").length;

  // Rates
  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : 0;
  const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) : 0;
  const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(1) : 0;

  // Template performance
  const templates = {};
  for (const c of campaigns) {
    const t = c.template || "default";
    if (!templates[t]) templates[t] = { sent: 0, replied: 0, positive: 0, negative: 0 };
    templates[t].sent++;
    if (c.replied) templates[t].replied++;
    if (c.replySentiment === "positive") templates[t].positive++;
    if (c.replySentiment === "negative") templates[t].negative++;
  }

  // Calculate template reply rates
  for (const [name, data] of Object.entries(templates)) {
    data.replyRate = data.sent > 0 ? ((data.replied / data.sent) * 100).toFixed(1) : 0;
  }

  // Category performance
  const categories = {};
  for (const c of campaigns) {
    const cat = c.category || "general";
    if (!categories[cat]) categories[cat] = { sent: 0, replied: 0 };
    categories[cat].sent++;
    if (c.replied) categories[cat].replied++;
  }

  for (const [name, data] of Object.entries(categories)) {
    data.replyRate = data.sent > 0 ? ((data.replied / data.sent) * 100).toFixed(1) : 0;
  }

  // Best performing template
  const bestTemplate = Object.entries(templates)
    .sort((a, b) => parseFloat(b[1].replyRate) - parseFloat(a[1].replyRate))[0];

  // Worst performing template
  const worstTemplate = Object.entries(templates)
    .sort((a, b) => parseFloat(a[1].replyRate) - parseFloat(b[1].replyRate))[0];

  // Time-based analysis (last 7 days vs before)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentCampaigns = campaigns.filter(c => new Date(c.sentAt).getTime() > weekAgo);
  const oldCampaigns = campaigns.filter(c => new Date(c.sentAt).getTime() <= weekAgo);

  const recentReplyRate = recentCampaigns.length > 0
    ? ((recentCampaigns.filter(c => c.replied).length / recentCampaigns.length) * 100).toFixed(1)
    : 0;
  const oldReplyRate = oldCampaigns.length > 0
    ? ((oldCampaigns.filter(c => c.replied).length / oldCampaigns.length) * 100).toFixed(1)
    : 0;

  // Generate insights and recommendations
  const insights = [];
  const recommendations = [];

  if (parseFloat(replyRate) < 2) {
    insights.push({
      type: "CRITICAL",
      message: `Reply rate bahut kam hai (${replyRate}%). Email template change karo.`,
      action: "Personalized subject line banao, value proposition clear karo"
    });
    recommendations.push({
      priority: "HIGH",
      area: "Email Template",
      current: "Generic cold email — 0% reply rate",
      change: "Personalized first line + specific value prop + social proof",
      expectedImpact: "Reply rate 0% → 3-5%"
    });
    recommendations.push({
      priority: "HIGH",
      area: "Subject Line",
      current: "Generic subject — low open rate",
      change: "Company name + specific problem + solution hint",
      expectedImpact: "Open rate increase"
    });
  }

  if (parseFloat(bounceRate) > 10) {
    insights.push({
      type: "WARNING",
      message: `Bounce rate zyada hai (${bounceRate}%). Email list clean karo.`,
      action: "Invalid emails hatao, verified list use karo"
    });
  }

  if (bestTemplate && parseFloat(bestTemplate[1].replyRate) > 5) {
    insights.push({
      type: "SUCCESS",
      message: `Template "${bestTemplate[0]}" accha kaam kar raha hai (${bestTemplate[1].replyRate}% reply rate)`,
      action: "Is template ko zyada use karo"
    });
  }

  if (worstTemplate && parseFloat(worstTemplate[1].replyRate) === 0 && worstTemplate[1].sent >= 5) {
    insights.push({
      type: "CRITICAL",
      message: `Template "${worstTemplate[0]}" bilkul kaam nahi kar raha (0% reply rate, ${worstTemplate[1].sent} emails)`,
      action: "Is template ko band karo ya rewrite karo"
    });
    recommendations.push({
      priority: "HIGH",
      area: "Template Selection",
      current: `Using worst performing template "${worstTemplate[0]}" — 0% reply rate`,
      change: `Switch to better template or rewrite completely`,
      expectedImpact: "Immediate improvement"
    });
  }

  if (parseFloat(recentReplyRate) > parseFloat(oldReplyRate)) {
    insights.push({
      type: "TREND",
      message: `Performance improve ho raha hai (Last 7d: ${recentReplyRate}% vs Before: ${oldReplyRate}%)`,
      action: "Current strategy continue karo"
    });
  } else if (parseFloat(recentReplyRate) < parseFloat(oldReplyRate)) {
    insights.push({
      type: "TREND",
      message: `Performance gir raha hai (Last 7d: ${recentReplyRate}% vs Before: ${oldReplyRate}%)`,
      action: "Strategy change karo"
    });
  }

  const result = {
    summary: {
      total,
      sent,
      delivered,
      bounced,
      replied,
      positiveReplies,
      negativeReplies,
      deliveryRate: `${deliveryRate}%`,
      replyRate: `${replyRate}%`,
      bounceRate: `${bounceRate}%`
    },
    templates,
    categories,
    trends: {
      last7Days: { count: recentCampaigns.length, replyRate: `${recentReplyRate}%` },
      before: { count: oldCampaigns.length, replyRate: `${oldReplyRate}%` }
    },
    bestTemplate: bestTemplate ? { name: bestTemplate[0], ...bestTemplate[1] } : null,
    worstTemplate: worstTemplate ? { name: worstTemplate[0], ...worstTemplate[1] } : null,
    insights,
    analyzedAt: new Date().toISOString()
  };

  // Save analysis
  db.insights.push(result);
  db.lastAnalysis = result.analyzedAt;
  saveFeedbackDB(db);

  return result;
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. STRATEGY RECOMMENDATIONS — What to change
// ──────────────────────────────────────────────────────────────────────────────

function getStrategyRecommendations() {
  const analysis = analyzePerformance();
  if (analysis.error) return [analysis.error];

  const recommendations = [];
  const replyRate = parseFloat(analysis.summary.replyRate);

  if (replyRate < 1) {
    recommendations.push({
      priority: "HIGH",
      area: "Email Template",
      current: "Generic cold email",
      changeTo: "Personalized first line + specific value prop + social proof",
      expectedImpact: "Reply rate 1% → 3-5%"
    });
    recommendations.push({
      priority: "HIGH",
      area: "Subject Line",
      current: "Generic subject",
      changeTo: "Company name + specific problem + solution hint",
      expectedImpact: "Open rate increase"
    });
  }

  if (replyRate >= 1 && replyRate < 5) {
    recommendations.push({
      priority: "MEDIUM",
      area: "Follow-up Sequence",
      current: "Single email",
      changeTo: "3-touch sequence: Day 0, Day 3, Day 7",
      expectedImpact: "Reply rate +2-3%"
    });
  }

  if (analysis.bestTemplate) {
    recommendations.push({
      priority: "MEDIUM",
      area: "Template Selection",
      current: "Using worst performing template",
      changeTo: `Switch to "${analysis.bestTemplate.name}" (best performer: ${analysis.bestTemplate.replyRate}% reply rate)`,
      expectedImpact: "Immediate improvement"
    });
  }

  if (analysis.summary.bounceRate > 10) {
    recommendations.push({
      priority: "HIGH",
      area: "Email List",
      current: `${analysis.summary.bounceRate}% bounce rate`,
      changeTo: "Verify emails before sending, remove invalid addresses",
      expectedImpact: "Better sender reputation"
    });
  }

  // Category-based recommendations
  for (const [cat, data] of Object.entries(analysis.categories)) {
    if (data.sent >= 5 && data.replyRate === "0") {
      recommendations.push({
        priority: "HIGH",
        area: `Category: ${cat}`,
        current: "Zero replies in this category",
        changeTo: "Re-evaluate targeting or messaging for this category",
        expectedImpact: "Potential new revenue channel"
      });
    }
  }

  return recommendations;
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. IMPORT FROM EXISTING LOGS — Migrate old dispatch data
// ──────────────────────────────────────────────────────────────────────────────

function importFromDispatchLog(logFilePath, campaignId) {
  try {
    if (!fs.existsSync(logFilePath)) {
      console.log(`[FeedbackLoop] Log file not found: ${logFilePath}`);
      return 0;
    }
    const logs = JSON.parse(fs.readFileSync(logFilePath, "utf8"));
    const db = loadFeedbackDB();
    let imported = 0;

    for (const log of logs) {
      // Check if already imported
      const exists = db.campaigns.some(c => c.to === log.email && c.sentAt === log.timestamp);
      if (exists) continue;

      db.campaigns.push({
        id: `imported_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        campaignId: campaignId || path.basename(logFilePath, ".json"),
        to: log.email || log.to || "unknown",
        subject: log.subject || "No subject",
        template: log.template || "imported",
        category: campaignId || "imported",
        sentAt: log.timestamp || log.sentAt || new Date().toISOString(),
        status: log.status === "dispatched_fallback" ? "sent" : (log.status || "sent"),
        delivered: log.providerResponseId?.includes("250") ? true : null,
        opened: null,
        replied: log.responded || false,
        repliedAt: null,
        replySentiment: null,
        converted: false,
        metadata: { importedFrom: logFilePath, originalId: log.id }
      });
      imported++;
    }

    saveFeedbackDB(db);
    console.log(`[FeedbackLoop] Imported ${imported} entries from ${path.basename(logFilePath)}`);
    return imported;
  } catch (e) {
    console.error(`[FeedbackLoop] Import failed: ${e.message}`);
    return 0;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 9. IMPORT ALL EXISTING DISPATCH LOGS
// ──────────────────────────────────────────────────────────────────────────────

function importAllExistingLogs() {
  const logFiles = [
    { path: "data/agency-whitelabel-dispatch-log.json", campaign: "agency-whitelabel" },
    { path: "data/digital-marketing-dispatch-log.json", campaign: "digital-marketing" },
    { path: "data/followup-dispatch-log.json", campaign: "followup" },
    { path: "data/outreach-dispatch-log.json", campaign: "outreach" },
    { path: "data/revenue-wave-dispatch-log.json", campaign: "revenue-wave" },
    { path: "data/revenue-wave2-dispatch-log.json", campaign: "revenue-wave2" },
    { path: "data/subcontracting-50lakh-dispatch-log.json", campaign: "subcontracting" },
    { path: "data/warmup-top5-dispatch-log.json", campaign: "warmup" },
    { path: "data/seed-velocity-dispatch.json", campaign: "seed-velocity" }
  ];

  let totalImported = 0;
  for (const { path: logPath, campaign } of logFiles) {
    const fullPath = path.join(__dirname, "..", "..", logPath);
    const count = importFromDispatchLog(fullPath, campaign);
    totalImported += count;
  }

  console.log(`[FeedbackLoop] Total imported: ${totalImported} entries`);
  return totalImported;
}

// ──────────────────────────────────────────────────────────────────────────────
// 10. DASHBOARD — Quick summary for founder
// ──────────────────────────────────────────────────────────────────────────────

function getDashboard() {
  const analysis = analyzePerformance();
  const recommendations = getStrategyRecommendations();

  return {
    overview: analysis.summary || {},
    topInsights: (analysis.insights || []).slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    bestTemplate: analysis.bestTemplate,
    worstTemplate: analysis.worstTemplate,
    trends: analysis.trends,
    lastAnalyzed: analysis.analyzedAt
  };
}

module.exports = {
  recordEmailSent,
  recordReply,
  recordDelivery,
  analyzeSentiment,
  analyzePerformance,
  getStrategyRecommendations,
  importFromDispatchLog,
  importAllExistingLogs,
  getDashboard,
  loadFeedbackDB
};
