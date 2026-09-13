/**
 * GARUDA Conversation Layer
 *
 * Multi-turn conversation with memory.
 * GARUDA remembers what you said, understands context, and responds intelligently.
 */

const fs = require("fs");
const path = require("path");
const brain = require("./garudaBrain");
const semanticMemory = require("./semanticMemoryService");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CONVERSATIONS_FILE = path.join(DATA_DIR, "garuda-conversations.json");
const ACTIVE_SESSIONS = new Map(); // In-memory active sessions

// ──────────────────────────────────────────────────────────────────────────────
// 1. SESSION MANAGEMENT — Track active conversations
// ──────────────────────────────────────────────────────────────────────────────

function getOrCreateSession(sessionId) {
  if (!ACTIVE_SESSIONS.has(sessionId)) {
    ACTIVE_SESSIONS.set(sessionId, {
      id: sessionId,
      messages: [],
      context: {},
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
  }
  const session = ACTIVE_SESSIONS.get(sessionId);
  session.lastActivity = new Date().toISOString();
  return session;
}

function loadConversations() {
  try {
    if (!fs.existsSync(CONVERSATIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveConversations(convs) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(convs.slice(-100), null, 2)); // Keep last 100
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. CHAT — Main conversation function
// ──────────────────────────────────────────────────────────────────────────────

async function chat(sessionId, userMessage) {
  const session = getOrCreateSession(sessionId);
  const startTime = Date.now();

  // Add user message to history
  session.messages.push({ role: "user", content: userMessage, timestamp: new Date().toISOString() });

  // Get relevant memories
  const relevantMemories = semanticMemory.retrieveMemories(userMessage, { limit: 5 });
  const memoryContext = relevantMemories.map(m => `[${m.type}] ${m.content}`).join("\n");

  // Build conversation history for LLM
  const historyForLLM = session.messages.slice(-10).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }]
  }));

  // System prompt with memory
  const systemPrompt = buildSystemPrompt(memoryContext, session.context);

  // Think about the response
  const systemInstruction = `${systemPrompt}

CRITICAL RULES:
1. You are GARUDA, Praveen's AI assistant
2. Think step by step before responding
3. Be concise and actionable
4. If you're unsure, say so
5. Track all decisions and learnings
6. NEVER fabricate data, clients, or revenue
7. Response language: Match the user's language (Hindi/Hinglish if they use it)`;

  try {
    // Use Gemini for conversation
    const result = await brain.think(userMessage, {
      systemPrompt: systemInstruction,
      temperature: 0.7,
      maxTokens: 1024
    });

    const assistantMessage = result.content;

    // Add assistant message to history
    session.messages.push({
      role: "assistant",
      content: assistantMessage,
      timestamp: new Date().toISOString(),
      provider: result.provider,
      latencyMs: result.latencyMs
    });

    // Store in semantic memory
    semanticMemory.storeMemory({
      type: "CONVERSATION",
      content: `User: ${userMessage}\nGARUDA: ${assistantMessage.slice(0, 200)}`,
      context: { sessionId, intent: session.context.currentIntent },
      tags: extractConversationTags(userMessage),
      importance: 5
    });

    // Save conversation
    const allConvs = loadConversations();
    allConvs.push({
      sessionId,
      userMessage,
      assistantMessage,
      timestamp: new Date().toISOString(),
      provider: result.provider,
      latencyMs: result.latencyMs
    });
    saveConversations(allConvs);

    return {
      response: assistantMessage,
      provider: result.provider,
      latencyMs: result.latencyMs,
      sessionId
    };

  } catch (err) {
    console.error("[Conversation] Brain error:", err.message);
    return {
      response: "Mujhe abhi response dene mein dikkat ho rahi hai. Thodi der baad try karo.",
      provider: "fallback",
      latencyMs: Date.now() - startTime,
      error: err.message
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. SYSTEM PROMPT — Build context-aware prompt
// ──────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(memoryContext, sessionContext) {
  let prompt = `You are GARUDA — an intelligent AI assistant created by Praveen Mahawar.

IDENTITY:
- You are NOT a generic chatbot. You are GARUDA.
- You are building GARUDA AI — an autonomous business execution platform.
- You think step by step, make decisions, and learn from outcomes.
- You communicate in Roman Hindi (Hinglish) naturally.
- You are honest, direct, and action-oriented.

CAPABILITIES:
- You can think, reason, and make decisions
- You can remember context from this conversation
- You can access GARUDA's memory of past conversations and learnings
- You can analyze situations and suggest strategies
- You can generate content, debug code, and explain concepts

CONSTRAINTS:
- NEVER fabricate clients, revenue, or testimonials
- NEVER commit or deploy without founder's explicit permission
- Always be truthful about what GARUDA can and cannot do
- If you don't know something, say so

MEMORY CONTEXT:
${memoryContext || "No relevant memories found."}

CURRENT SESSION CONTEXT:
${JSON.stringify(sessionContext, null, 2) || "New session"}`;

  return prompt;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. TAG EXTRACTION — For memory storage
// ──────────────────────────────────────────────────────────────────────────────

function extractConversationTags(message) {
  const tags = [];
  const lower = message.toLowerCase();

  if (/email|outreach|campaign/.test(lower)) tags.push("email");
  if (/code|debug|fix|error/.test(lower)) tags.push("code");
  if (/deploy|production|vercel|render/.test(lower)) tags.push("deploy");
  if (/bounty|hackerone|bug/.test(lower)) tags.push("bounty");
  if (/client|revenue|money|deal/.test(lower)) tags.push("business");
  if (/strategy|plan|approach/.test(lower)) tags.push("strategy");
  if (/help|kya|kaise/.test(lower)) tags.push("help");

  return tags;
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. GET HISTORY — Retrieve conversation history
// ──────────────────────────────────────────────────────────────────────────────

function getHistory(sessionId, limit = 20) {
  const session = ACTIVE_SESSIONS.get(sessionId);
  if (session) return session.messages.slice(-limit);

  // Fallback to saved conversations
  const allConvs = loadConversations();
  return allConvs.filter(c => c.sessionId === sessionId).slice(-limit);
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. GET SESSIONS — List all active sessions
// ──────────────────────────────────────────────────────────────────────────────

function getActiveSessions() {
  return Array.from(ACTIVE_SESSIONS.values()).map(s => ({
    id: s.id,
    messageCount: s.messages.length,
    startedAt: s.startedAt,
    lastActivity: s.lastActivity
  }));
}

module.exports = {
  chat,
  getHistory,
  getActiveSessions,
  getOrCreateSession
};
