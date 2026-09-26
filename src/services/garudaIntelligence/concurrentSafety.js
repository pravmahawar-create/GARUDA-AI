const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOCK_TIMEOUT_MS = 5000;
const LOCK_RETRY_MS = 10;
const MAX_LOCK_RETRIES = 500;

class FileLock {
  constructor(filePath) {
    this.lockPath = filePath + '.lock';
    this.held = false;
  }

  acquire() {
    const deadline = Date.now() + LOCK_TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        fs.mkdirSync(path.dirname(this.lockPath), { recursive: true });
        const fd = fs.openSync(this.lockPath, 'wx');
        fs.writeFileSync(fd, String(process.pid));
        fs.closeSync(fd);
        this.held = true;
        return true;
      } catch (err) {
        if (err.code === 'EEXIST') {
          this._cleanStaleLock();
          const spinStart = Date.now();
          while (Date.now() - spinStart < LOCK_RETRY_MS) { /* spin */ }
          continue;
        }
        if (err.code === 'EACCES') {
          this._cleanStaleLock();
          continue;
        }
        throw err;
      }
    }
    return false;
  }

  release() {
    if (this.held) {
      try { fs.unlinkSync(this.lockPath); } catch {}
      this.held = false;
    }
  }

  _cleanStaleLock() {
    try {
      const stat = fs.statSync(this.lockPath);
      const age = Date.now() - stat.mtimeMs;
      if (age > LOCK_TIMEOUT_MS * 2) {
        fs.unlinkSync(this.lockPath);
      }
    } catch {}
  }

  withLock(fn) {
    if (!this.acquire()) {
      throw new Error(`Failed to acquire lock: ${this.lockPath}`);
    }
    try {
      return fn();
    } finally {
      this.release();
    }
  }
}

class StoreIntegrity {
  static computeLineCount(filePath) {
    if (!fs.existsSync(filePath)) return 0;
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) return 0;
    return content.split('\n').filter(Boolean).length;
  }

  static computeFileHash(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static verifyWrite(filePath, expectedCount) {
    const actualCount = this.computeLineCount(filePath);
    return {
      valid: actualCount === expectedCount,
      expected: expectedCount,
      actual: actualCount
    };
  }

  static computeStoreFingerprint(dirPath, storeNames) {
    const fingerprint = {};
    for (const name of storeNames) {
      const fp = path.join(dirPath, name);
      fingerprint[name] = {
        exists: fs.existsSync(fp),
        lineCount: this.computeLineCount(fp),
        hash: this.computeFileHash(fp)
      };
    }
    return fingerprint;
  }
}

class StaleIndexDetector {
  constructor() {
    this.fileMtimes = {};
  }

  snapshotMtimes(dirPath, storeNames) {
    const snapshot = {};
    for (const name of storeNames) {
      const fp = path.join(dirPath, name);
      try {
        const stat = fs.statSync(fp);
        snapshot[name] = stat.mtimeMs;
      } catch {
        snapshot[name] = 0;
      }
    }
    this.fileMtimes[dirPath] = snapshot;
    return snapshot;
  }

  isStale(dirPath, storeNames) {
    const previous = this.fileMtimes[dirPath];
    if (!previous) return true;
    for (const name of storeNames) {
      const fp = path.join(dirPath, name);
      try {
        const stat = fs.statSync(fp);
        if (stat.mtimeMs !== previous[name]) return true;
      } catch {
        if (previous[name] !== 0) return true;
      }
    }
    return false;
  }

  getChangedFiles(dirPath, storeNames) {
    const previous = this.fileMtimes[dirPath];
    if (!previous) return storeNames;
    const changed = [];
    for (const name of storeNames) {
      const fp = path.join(dirPath, name);
      try {
        const stat = fs.statSync(fp);
        if (stat.mtimeMs !== previous[name]) changed.push(name);
      } catch {
        if (previous[name] !== 0) changed.push(name);
      }
    }
    return changed;
  }
}

module.exports = { FileLock, StoreIntegrity, StaleIndexDetector };
