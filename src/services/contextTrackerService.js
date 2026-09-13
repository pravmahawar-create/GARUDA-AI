/**
 * GARUDA Context Tracker
 *
 * Tracks what's being discussed across sessions.
 * Understands ongoing projects, pending tasks, and user preferences.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CONTEXT_FILE = path.join(DATA_DIR, "context-tracker.json");

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONTEXT TYPES
// ──────────────────────────────────────────────────────────────────────────────

const CONTEXT_TYPES = {
  TOPIC: "topic",           // What's being discussed
  TASK: "task",             // What needs to be done
  DECISION: "decision",     // What was decided
  PREFERENCE: "preference", // What user likes/dislikes
  PROJECT: "project",       // Ongoing project context
  ISSUE: "issue"            // Problem being tracked
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. LOAD / SAVE
// ──────────────────────────────────────────────────────────────────────────────

function loadContext() {
  try {
    if (!fs.existsSync(CONTEXT_FILE)) return { topics: {}, tasks: [], decisions: [], projects: {} };
    return JSON.parse(fs.readFileSync(CONTEXT_FILE, "utf8"));
  } catch {
    return { topics: {}, tasks: [], decisions: [], projects: {} };
  }
}

function saveContext(ctx) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONTEXT_FILE, JSON.stringify(ctx, null, 2));
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. TRACK — Update context from conversation
// ──────────────────────────────────────────────────────────────────────────────

function trackFromMessage(userMessage, assistantResponse, intent) {
  const ctx = loadContext();
  const now = new Date().toISOString();

  // Track topic
  if (intent?.topic) {
    if (!ctx.topics[intent.topic]) {
      ctx.topics[intent.topic] = {
        firstMentioned: now,
        lastMentioned: now,
        mentionCount: 0,
        relatedMessages: []
      };
    }
    ctx.topics[intent.topic].lastMentioned = now;
    ctx.topics[intent.topic].mentionCount++;
    ctx.topics[intent.topic].relatedMessages.push({
      user: userMessage.slice(0, 100),
      assistant: assistantResponse.slice(0, 100),
      timestamp: now
    });
    // Keep last 10 messages per topic
    if (ctx.topics[intent.topic].relatedMessages.length > 10) {
      ctx.topics[intent.topic].relatedMessages = ctx.topics[intent.topic].relatedMessages.slice(-10);
    }
  }

  // Track tasks (if intent suggests action needed)
  if (intent?.actionRequired) {
    ctx.tasks.push({
      description: intent.summary,
      topic: intent.topic,
      urgency: intent.urgency,
      createdAt: now,
      status: "pending"
    });
    // Keep last 20 tasks
    if (ctx.tasks.length > 20) ctx.tasks = ctx.tasks.slice(-20);
  }

  // Track decisions
  if (intent?.intent === "decision" || /decide|choose|pick|select/.test(userMessage.toLowerCase())) {
    ctx.decisions.push({
      question: userMessage.slice(0, 200),
      answer: assistantResponse.slice(0, 200),
      timestamp: now
    });
    if (ctx.decisions.length > 20) ctx.decisions = ctx.decisions.slice(-20);
  }

  saveContext(ctx);
  return ctx;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. GET CONTEXT — What's currently relevant
// ──────────────────────────────────────────────────────────────────────────────

function getCurrentContext() {
  const ctx = loadContext();
  const now = Date.now();

  // Get active topics (mentioned in last 24 hours)
  const activeTopics = {};
  for (const [topic, data] of Object.entries(ctx.topics)) {
    const hoursSinceLast = (now - new Date(data.lastMentioned).getTime()) / 3600000;
    if (hoursSinceLast < 24) {
      activeTopics[topic] = data;
    }
  }

  // Get pending tasks
  const pendingTasks = ctx.tasks.filter(t => t.status === "pending");

  // Get recent decisions
  const recentDecisions = ctx.decisions.slice(-5);

  return {
    activeTopics,
    pendingTasks,
    recentDecisions,
    totalTopics: Object.keys(ctx.topics).length,
    totalTasks: ctx.tasks.length,
    totalDecisions: ctx.decisions.length
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. RESUME — Get context for resuming a conversation
// ──────────────────────────────────────────────────────────────────────────────

function getResumeContext(sessionId) {
  const ctx = loadContext();

  // Build a summary of what's been discussed
  const activeTopics = Object.entries(ctx.topics)
    .filter(([_, data]) => {
      const hoursSinceLast = (Date.now() - new Date(data.lastMentioned).getTime()) / 3600000;
      return hoursSinceLast < 168; // Last 7 days
    })
    .sort((a, b) => new Date(b[1].lastMentioned) - new Date(a[1].lastMentioned));

  const pendingTasks = ctx.tasks.filter(t => t.status === "pending");

  let summary = "PREVIOUS CONTEXT:\n";
  if (activeTopics.length > 0) {
    summary += "Active topics: " + activeTopics.map(([t, d]) => `${t} (${d.mentionCount}x)`).join(", ") + "\n";
  }
  if (pendingTasks.length > 0) {
    summary += "Pending tasks: " + pendingTasks.map(t => t.description).join("; ") + "\n";
  }
  if (ctx.decisions.length > 0) {
    summary += "Recent decisions: " + ctx.decisions.slice(-3).map(d => d.question.slice(0, 50)).join("; ");
  }

  return summary;
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. COMPLETE TASK — Mark a task as done
// ──────────────────────────────────────────────────────────────────────────────

function completeTask(taskIndex) {
  const ctx = loadContext();
  if (ctx.tasks[taskIndex]) {
    ctx.tasks[taskIndex].status = "completed";
    ctx.tasks[taskIndex].completedAt = new Date().toISOString();
    saveContext(ctx);
    return true;
  }
  return false;
}

module.exports = {
  trackFromMessage,
  getCurrentContext,
  getResumeContext,
  completeTask,
  CONTEXT_TYPES
};
