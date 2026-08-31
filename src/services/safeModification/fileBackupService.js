const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function sanitizePath(filePath) {
  return filePath.replace(/[/\\:]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sha256(content) {
  return crypto.createHash("sha256").update(typeof content === "string" ? content : JSON.stringify(content)).digest("hex");
}

function createBackup(filePath) {
  ensureBackupDir();
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    return { success: false, error: "File not found", targetPath: filePath };
  }
  const content = fs.readFileSync(absolutePath, "utf8");
  const hash = sha256(content);
  const timestamp = Date.now();
  const sanitized = sanitizePath(filePath);
  const backupFileName = `${timestamp}__${sanitized}.bak`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);
  fs.writeFileSync(backupPath, content, "utf8");
  return {
    success: true,
    backupPath,
    backupFileName,
    originalPath: filePath,
    originalHash: hash,
    originalSize: content.length,
    createdAt: new Date(timestamp).toISOString()
  };
}

function restoreBackup(backupPath) {
  const absoluteBackup = path.resolve(backupPath);
  if (!fs.existsSync(absoluteBackup)) {
    return { success: false, error: "Backup file not found", backupPath };
  }
  const content = fs.readFileSync(absoluteBackup, "utf8");
  const restoredFrom = path.basename(absoluteBackup);
  const originalPath = restoredFrom.replace(/^\d+__/, "").replace(/\.bak$/, "").replace(/_/g, "/");
  return {
    success: true,
    content,
    restoredFrom,
    intendedPath: originalPath,
    hash: sha256(content)
  };
}

function listBackups(filePath) {
  ensureBackupDir();
  const sanitized = filePath ? sanitizePath(filePath) : null;
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".bak"));
  const filtered = sanitized ? files.filter((f) => f.includes(sanitized)) : files;
  return filtered.sort().reverse().map((f) => {
    const parts = f.split("__");
    const timestamp = parseInt(parts[0], 10);
    return {
      fileName: f,
      path: path.join(BACKUP_DIR, f),
      createdAt: new Date(timestamp).toISOString()
    };
  });
}

function getBackupContent(backupPath) {
  const absolute = path.resolve(backupPath);
  if (!fs.existsSync(absolute)) return null;
  return fs.readFileSync(absolute, "utf8");
}

module.exports = { createBackup, restoreBackup, listBackups, getBackupContent, sha256, BACKUP_DIR };
