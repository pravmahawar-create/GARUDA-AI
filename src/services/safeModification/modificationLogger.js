const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(process.cwd(), "data", "modification-log.jsonl");

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function logModification(entry) {
  ensureLogDir();
  const record = {
    timestamp: new Date().toISOString(),
    ...entry
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(record) + "\n", "utf8");
  return record;
}

function getLogEntries(limit = 50) {
  ensureLogDir();
  if (!fs.existsSync(LOG_FILE)) return [];
  const content = fs.readFileSync(LOG_FILE, "utf8").trim();
  if (!content) return [];
  const lines = content.split("\n");
  return lines.slice(-limit).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

function getLogEntriesForFile(filePath, limit = 20) {
  return getLogEntries(500).filter((e) => e.targetPath === filePath).slice(-limit);
}

function clearLog() {
  ensureLogDir();
  fs.writeFileSync(LOG_FILE, "", "utf8");
}

module.exports = { logModification, getLogEntries, getLogEntriesForFile, clearLog, LOG_FILE };
