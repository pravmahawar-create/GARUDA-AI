/**
 * 🦅 GARUDA CLI — SESSION PERSISTENCE & RESUME ENGINE
 * 
 * Manages atomic disk persistence of agent sessions, historical context,
 * changed file hashes, tool execution logs, and seamless resumption via --resume.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_SESSIONS_DIR = path.resolve(__dirname, "..", "..", ".garuda", "sessions");

class SessionManager {
  constructor(sessionsDir = DEFAULT_SESSIONS_DIR) {
    this.sessionsDir = path.resolve(sessionsDir);
    this._ensureDir();
  }

  _ensureDir() {
    try {
      if (!fs.existsSync(this.sessionsDir)) {
        fs.mkdirSync(this.sessionsDir, { recursive: true });
      }
    } catch (_) {}
  }

  createSession(initialData = {}) {
    this._ensureDir();
    const sessionId = `session_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date().toISOString();

    const session = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      status: "active",
      messages: initialData.messages || [],
      changedFiles: initialData.changedFiles || [],
      toolsExecuted: initialData.toolsExecuted || [],
      approvals: initialData.approvals || [],
      metadata: initialData.metadata || {}
    };

    this.saveSession(session);
    return session;
  }

  saveSession(session) {
    if (!session || !session.id) return false;
    this._ensureDir();

    session.updatedAt = new Date().toISOString();

    // Sanitize any potential secret values before writing to disk
    const sanitized = JSON.parse(JSON.stringify(session, (key, value) => {
      if (typeof key === "string" && (key.includes("KEY") || key.includes("SECRET") || key.includes("TOKEN") || key.includes("PASSWORD"))) {
        return "[REDACTED]";
      }
      return value;
    }));

    const targetFile = path.join(this.sessionsDir, `${session.id}.json`);
    const tempFile = path.join(this.sessionsDir, `${session.id}.${Date.now()}.${crypto.randomBytes(3).toString("hex")}.tmp`);

    try {
      // Atomic write: write to temp file then rename
      fs.writeFileSync(tempFile, JSON.stringify(sanitized, null, 2), "utf8");
      fs.renameSync(tempFile, targetFile);
      return true;
    } catch (err) {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (_) {}
      return false;
    }
  }

  loadSession(sessionId) {
    this._ensureDir();
    const cleanId = String(sessionId).replace(/[^a-zA-Z0-9_\-]/g, "");
    const filePath = path.join(this.sessionsDir, `${cleanId}.json`);

    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, "utf8");
      return JSON.parse(content);
    } catch (err) {
      // Corrupted session file recovery
      return null;
    }
  }

  listSessions() {
    this._ensureDir();
    try {
      const files = fs.readdirSync(this.sessionsDir).filter(f => f.endsWith(".json"));
      const sessions = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.sessionsDir, file), "utf8");
          const parsed = JSON.parse(content);
          sessions.push({
            id: parsed.id,
            createdAt: parsed.createdAt,
            updatedAt: parsed.updatedAt,
            messageCount: parsed.messages?.length || 0,
            status: parsed.status || "active"
          });
        } catch (_) {
          // Skip corrupted files
        }
      }

      // Sort newest first
      return sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (_) {
      return [];
    }
  }

  getMostRecentSession() {
    const list = this.listSessions();
    if (list.length === 0) return null;
    return this.loadSession(list[0].id);
  }
}

module.exports = {
  SessionManager,
  DEFAULT_SESSIONS_DIR
};
