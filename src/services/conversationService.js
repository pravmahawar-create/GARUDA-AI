const ConversationThread = require("../models/ConversationThread");
const { v4: uuidv4 } = require("crypto");

// In-memory fallback if MongoDB connection is pending or offline
const memoryStore = new Map();

function generateThreadId() {
  return `thread_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function deriveTitle(messages = []) {
  const firstUser = messages.find((m) => m && m.role === "user" && typeof m.text === "string" && m.text.trim());
  if (firstUser) {
    const text = firstUser.text.trim();
    return text.length > 40 ? `${text.slice(0, 37)}...` : text;
  }
  return "Founder Conversation";
}

async function listThreads(limit = 20) {
  try {
    const docs = await ConversationThread.find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    if (docs && docs.length) {
      return docs.map((doc) => ({
        threadId: doc.threadId,
        title: doc.title || "Founder Conversation",
        messageCount: Array.isArray(doc.messages) ? doc.messages.length : 0,
        updatedAt: doc.updatedAt || doc.createdAt
      }));
    }
  } catch (err) {
    // Mongo unavailable, fallback to memoryStore
  }

  const memoryList = Array.from(memoryStore.values())
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit)
    .map((thread) => ({
      threadId: thread.threadId,
      title: thread.title,
      messageCount: thread.messages.length,
      updatedAt: thread.updatedAt
    }));

  return memoryList;
}

async function getOrCreateThread(threadId = null) {
  const targetId = (typeof threadId === "string" && threadId.trim()) ? threadId.trim() : generateThreadId();

  try {
    let doc = await ConversationThread.findOne({ threadId: targetId });
    if (!doc) {
      const defaultWelcome = {
        id: `msg_${Date.now()}_0`,
        role: "garuda",
        text: "Founder access granted. GARUDA is prepared to orchestrate your next move.",
        mode: "conversation",
        timestamp: new Date()
      };
      doc = await ConversationThread.create({
        threadId: targetId,
        title: "Founder Conversation",
        messages: [defaultWelcome]
      });
    }
    return doc.toObject ? doc.toObject() : doc;
  } catch (err) {
    // Fallback in-memory thread
    if (!memoryStore.has(targetId)) {
      const defaultWelcome = {
        id: `msg_${Date.now()}_0`,
        role: "garuda",
        text: "Founder access granted. GARUDA is prepared to orchestrate your next move.",
        mode: "conversation",
        timestamp: new Date().toISOString()
      };
      memoryStore.set(targetId, {
        threadId: targetId,
        title: "Founder Conversation",
        messages: [defaultWelcome],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    return memoryStore.get(targetId);
  }
}

async function appendMessages(threadId, newMessages = []) {
  const targetId = (typeof threadId === "string" && threadId.trim()) ? threadId.trim() : generateThreadId();
  const normalizedList = (Array.isArray(newMessages) ? newMessages : [newMessages])
    .filter(Boolean)
    .map((msg, index) => ({
      id: msg.id || `msg_${Date.now()}_${index}`,
      role: msg.role || "user",
      text: String(msg.text || msg.content || "").trim(),
      mode: msg.mode || "conversation",
      missionStatus: msg.missionStatus || null,
      evidence: msg.evidence || null,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }))
    .filter((msg) => msg.text.length > 0);

  if (!normalizedList.length) {
    return getOrCreateThread(targetId);
  }

  try {
    let doc = await ConversationThread.findOne({ threadId: targetId });
    if (!doc) {
      doc = new ConversationThread({
        threadId: targetId,
        title: deriveTitle(normalizedList),
        messages: []
      });
    }

    doc.messages.push(...normalizedList);
    if (!doc.title || doc.title === "Founder Conversation") {
      doc.title = deriveTitle(doc.messages);
    }
    doc.updatedAt = new Date();
    await doc.save();
    return doc.toObject ? doc.toObject() : doc;
  } catch (err) {
    // Memory store fallback
    let thread = memoryStore.get(targetId);
    if (!thread) {
      thread = {
        threadId: targetId,
        title: deriveTitle(normalizedList),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    thread.messages.push(...normalizedList);
    if (!thread.title || thread.title === "Founder Conversation") {
      thread.title = deriveTitle(thread.messages);
    }
    thread.updatedAt = new Date().toISOString();
    memoryStore.set(targetId, thread);
    return thread;
  }
}

async function deleteThread(threadId) {
  if (!threadId) return false;
  try {
    await ConversationThread.deleteOne({ threadId });
  } catch {
    // Ignore error
  }
  memoryStore.delete(threadId);
  return true;
}

module.exports = {
  listThreads,
  getOrCreateThread,
  appendMessages,
  deleteThread,
  generateThreadId
};
