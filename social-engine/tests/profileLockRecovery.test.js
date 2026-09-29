/**
 * Profile Lock & Crash Recovery Test Suite
 * Tests safe liveness verification, stale PID recovery, and collision prevention.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ProfileLockManager = require('../browser/profileLockManager');

function runProfileLockTests() {
  console.log('--- Testing Profile Lock & Crash Recovery ---');

  const tempTestDir = path.join(os.tmpdir(), `garuda_lock_test_${Date.now()}`);
  const lockMgr = new ProfileLockManager(tempTestDir);

  try {
    // 1. Clean acquire
    const r1 = lockMgr.acquireLock('facebook');
    assert.strictEqual(r1.acquired, true);
    assert.strictEqual(r1.pid, process.pid);

    // 2. Active PID blocks concurrent worker
    const r2 = lockMgr.acquireLock('facebook');
    assert.strictEqual(r2.acquired, false);
    assert.strictEqual(r2.pid, process.pid);
    assert.ok(r2.reason.includes('Active process'));

    // 3. Stale PID recovery test
    // Inject a fake lock with a non-existent PID (e.g. 99999999)
    const lockFile = lockMgr.getLockFilePath('facebook');
    const staleData = {
      pid: 99999999, // Unlikely to exist
      platform: 'facebook',
      profileDir: r1.profileDir,
      acquiredAt: '2026-09-01T00:00:00.000Z'
    };
    fs.writeFileSync(lockFile, JSON.stringify(staleData), 'utf8');

    // Acquire should detect dead PID, unlink stale file, and successfully acquire
    const r3 = lockMgr.acquireLock('facebook');
    assert.strictEqual(r3.acquired, true);
    assert.strictEqual(r3.pid, process.pid);

    // 4. Malformed lockfile recovery
    fs.writeFileSync(lockFile, 'CORRUPTED_JSON_NOT_VALID', 'utf8');
    const r4 = lockMgr.acquireLock('facebook');
    assert.strictEqual(r4.acquired, true);
    assert.strictEqual(r4.pid, process.pid);

    // 5. Clean release
    const rel = lockMgr.releaseLock('facebook');
    assert.strictEqual(rel.released, true);
    assert.strictEqual(fs.existsSync(lockFile), false);

    console.log('✔ Profile Lock & Crash Recovery: ALL ASSERTIONS PASSED');
    return true;
  } finally {
    try {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

if (require.main === module) {
  runProfileLockTests();
}

module.exports = runProfileLockTests;
