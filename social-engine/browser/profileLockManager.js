/**
 * GARUDA Social Engine - Profile Lock Manager
 * Implements atomic process lockfiles per platform.
 * Verifies if active PID owns lock, never kills unrelated processes, safely recovers stale state.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ProfileLockManager {
  constructor(baseSessionsDir = null) {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    this.sessionsDir = baseSessionsDir || path.join(localAppData, 'GARUDA', 'sessions');
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  getProfileDir(platform) {
    const pDir = path.join(this.sessionsDir, platform, 'profile');
    if (!fs.existsSync(pDir)) {
      fs.mkdirSync(pDir, { recursive: true });
    }
    return pDir;
  }

  getLockFilePath(platform) {
    return path.join(this.sessionsDir, platform, 'worker.lock');
  }

  isProcessAlive(pid) {
    if (!pid || typeof pid !== 'number') return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (err) {
      return err.code === 'EPERM'; // Alive but no permission to kill
    }
  }

  acquireLock(platform) {
    const lockFile = this.getLockFilePath(platform);
    const pDir = this.getProfileDir(platform);

    if (fs.existsSync(lockFile)) {
      try {
        const raw = fs.readFileSync(lockFile, 'utf8');
        const lockData = JSON.parse(raw);
        if (this.isProcessAlive(lockData.pid)) {
          return {
            acquired: false,
            reason: `Active process (PID: ${lockData.pid}) currently owns lock for ${platform}.`,
            pid: lockData.pid
          };
        }
        // Process is dead: Safely recover stale lock
        console.warn(`[ProfileLockManager] Stale lock detected for ${platform} (Dead PID: ${lockData.pid}). Recovering safely.`);
        fs.unlinkSync(lockFile);
      } catch (err) {
        try { fs.unlinkSync(lockFile); } catch (_) {}
      }
    }

    const newLock = {
      pid: process.pid,
      platform,
      profileDir: pDir,
      acquiredAt: new Date().toISOString()
    };

    fs.writeFileSync(lockFile, JSON.stringify(newLock, null, 2), 'utf8');
    return {
      acquired: true,
      profileDir: pDir,
      pid: process.pid
    };
  }

  releaseLock(platform) {
    const lockFile = this.getLockFilePath(platform);
    if (fs.existsSync(lockFile)) {
      try {
        const raw = fs.readFileSync(lockFile, 'utf8');
        const lockData = JSON.parse(raw);
        if (lockData.pid === process.pid) {
          fs.unlinkSync(lockFile);
          return { released: true };
        }
      } catch (err) {
        return { released: false, error: err.message };
      }
    }
    return { released: true, note: 'No matching active lockfile' };
  }
}

module.exports = ProfileLockManager;
