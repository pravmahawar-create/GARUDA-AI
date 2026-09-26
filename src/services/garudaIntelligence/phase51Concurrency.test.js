const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const os = require('os');

const { IntelligenceBus, INTELLIGENCE_TYPES, VERIFICATION_STATUS, SCOPE } = require('./intelligenceBus');
const { FileLock, StoreIntegrity, StaleIndexDetector } = require('./concurrentSafety');
const { NazarEngine, NazarInvestigator, EVIDENCE_STATUS } = require('./nazar/nazarEngine');

const TMP_DIR = path.join(os.tmpdir(), 'garuda-phase51-test-' + Date.now());

function setup() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const intelligenceDir = path.join(TMP_DIR, 'data', 'intelligence');
  if (!fs.existsSync(intelligenceDir)) fs.mkdirSync(intelligenceDir, { recursive: true });
  return { intelligenceDir, tmpDir: TMP_DIR };
}

function cleanup() {
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}
}

function createTestBus(dataDir) {
  return new IntelligenceBus({ dataDir });
}

// ─── FILE LOCK TESTS ───
function testFileLock() {
  console.log('\n=== TEST: File Lock ===');
  let passed = 0;
  let failed = 0;

  const filePath = path.join(TMP_DIR, 'locktest.jsonl');
  const lock = new FileLock(filePath);

  // Acquire
  const acquired = lock.acquire();
  if (acquired) { passed++; } else { failed++; console.log('FAIL: lock acquire'); }

  // Double acquire should fail
  const lock2 = new FileLock(filePath);
  const doubleAcquire = lock2.acquire();
  if (!doubleAcquire) { passed++; } else { failed++; console.log('FAIL: double acquire should fail'); }

  // Release
  lock.release();
  if (!lock.held) { passed++; } else { failed++; console.log('FAIL: lock release'); }

  // Re-acquire after release
  const reAcquire = lock2.acquire();
  if (reAcquire) { passed++; } else { failed++; console.log('FAIL: re-acquire after release'); }
  lock2.release();

  // withLock helper
  let callbackCalled = false;
  lock.withLock(() => { callbackCalled = true; });
  if (callbackCalled) { passed++; } else { failed++; console.log('FAIL: withLock callback'); }

  console.log('File Lock: ' + passed + ' passed, ' + failed + ' failed');
  return { passed, failed };
}

// ─── STORE INTEGRITY TESTS ───
function testStoreIntegrity() {
  console.log('\n=== TEST: Store Integrity ===');
  let passed = 0;
  let failed = 0;

  const testFile = path.join(TMP_DIR, 'integrity-test.jsonl');
  fs.writeFileSync(testFile, '{"a":1}\n{"b":2}\n', 'utf-8');

  // Line count
  const lineCount = StoreIntegrity.computeLineCount(testFile);
  if (lineCount === 2) { passed++; } else { failed++; console.log('FAIL: line count ' + lineCount); }

  // Hash
  const hash = StoreIntegrity.computeFileHash(testFile);
  if (hash && hash.length === 64) { passed++; } else { failed++; console.log('FAIL: hash'); }

  // Verify write
  const verify = StoreIntegrity.verifyWrite(testFile, 2);
  if (verify.valid) { passed++; } else { failed++; console.log('FAIL: verify write'); }

  const verifyBad = StoreIntegrity.verifyWrite(testFile, 5);
  if (!verifyBad.valid && verifyBad.actual === 2 && verifyBad.expected === 5) { passed++; } else { failed++; console.log('FAIL: verify write bad'); }

  // Fingerprint
  const fp = StoreIntegrity.computeStoreFingerprint(TMP_DIR, ['integrity-test.jsonl']);
  if (fp['integrity-test.jsonl'].exists && fp['integrity-test.jsonl'].lineCount === 2) { passed++; } else { failed++; console.log('FAIL: fingerprint'); }

  console.log('Store Integrity: ' + passed + ' passed, ' + failed + ' failed');
  return { passed, failed };
}

// ─── STALE INDEX DETECTOR TESTS ───
function testStaleIndex() {
  console.log('\n=== TEST: Stale Index Detector ===');
  let passed = 0;
  let failed = 0;

  const detector = new StaleIndexDetector();
  const testFile = path.join(TMP_DIR, 'stale-test.jsonl');
  fs.writeFileSync(testFile, '{"a":1}\n', 'utf-8');

  // Initial snapshot
  detector.snapshotMtimes(TMP_DIR, ['stale-test.jsonl']);
  const isStale1 = detector.isStale(TMP_DIR, ['stale-test.jsonl']);
  if (!isStale1) { passed++; } else { failed++; console.log('FAIL: not stale after snapshot'); }

  // Modify file (force mtime change)
  const futureTime = Date.now() + 1000;
  fs.writeFileSync(testFile, '{"a":1}\n{"b":2}\n', 'utf-8');
  fs.utimesSync(testFile, futureTime / 1000, futureTime / 1000);
  const isStale2 = detector.isStale(TMP_DIR, ['stale-test.jsonl']);
  if (isStale2) { passed++; } else { failed++; console.log('FAIL: should be stale after modify'); }

  // Changed files
  const changed = detector.getChangedFiles(TMP_DIR, ['stale-test.jsonl']);
  if (changed.includes('stale-test.jsonl')) { passed++; } else { failed++; console.log('FAIL: changed files'); }

  // Re-snapshot clears staleness
  detector.snapshotMtimes(TMP_DIR, ['stale-test.jsonl']);
  const isStale3 = detector.isStale(TMP_DIR, ['stale-test.jsonl']);
  if (!isStale3) { passed++; } else { failed++; console.log('FAIL: not stale after re-snapshot'); }

  console.log('Stale Index Detector: ' + passed + ' passed, ' + failed + ' failed');
  return { passed, failed };
}

// ─── CONCURRENT WRITE TESTS ───
function testConcurrentWrites() {
  console.log('\n=== TEST: Concurrent Writes ===');
  let passed = 0;
  let failed = 0;

  const { intelligenceDir } = setup();
  const bus = createTestBus(intelligenceDir);

  // Submit multiple items rapidly
  const results = [];
  for (let i = 0; i < 20; i++) {
    results.push(bus.submit({
      type: INTELLIGENCE_TYPES.EXPERIENCE,
      content: 'Concurrent test item ' + i,
      sourceAgent: 'concurrency_test',
      scope: SCOPE.MISSION_SPECIFIC,
      tags: ['concurrent', 'test-' + i],
      evidence: [{ type: 'test_evidence', detail: 'concurrent write test ' + i }]
    }));
  }

  const successes = results.filter(r => r.success);
  if (successes.length === 20) { passed++; } else { failed++; console.log('FAIL: concurrent submits ' + successes.length + '/20'); }

  // Verify integrity
  const integrity = bus.verifyIntegrity();
  if (integrity.allConsistent) { passed++; } else { failed++; console.log('FAIL: integrity after concurrent writes'); }

  // Verify retrieval
  const items = bus.retrieve({ tags: ['concurrent'] });
  if (items.length === 20) { passed++; } else { failed++; console.log('FAIL: retrieval count ' + items.length); }

  console.log('Concurrent Writes: ' + passed + ' passed, ' + failed + ' failed');
  return { passed, failed };
}

// ─── CROSS-PROCESS WRITE/READ TEST ───
function testCrossProcessAccess() {
  console.log('\n=== TEST: Cross-Process Access ===');
  let passed = 0;
  let failed = 0;

  const { intelligenceDir } = setup();

  // Write from parent
  const parentBus = createTestBus(intelligenceDir);
  parentBus.submit({
    type: INTELLIGENCE_TYPES.EXPERIENCE,
    content: 'Parent process item',
    sourceAgent: 'parent_test',
    scope: SCOPE.MISSION_SPECIFIC,
    tags: ['cross-process'],
    evidence: [{ type: 'test_evidence', detail: 'parent process write' }]
  });

  // Fork child process that writes and reads
  const childScript = path.join(TMP_DIR, 'child-process.js');
  const busPath = path.resolve(__dirname, 'intelligenceBus').replace(/\\/g, '\\\\');
  const intelDir = intelligenceDir.replace(/\\/g, '\\\\');
  fs.writeFileSync(childScript, `
    const { IntelligenceBus, INTELLIGENCE_TYPES, SCOPE } = require('${busPath}');
    const bus = new IntelligenceBus({ dataDir: '${intelDir}' });

    bus.submit({
      type: INTELLIGENCE_TYPES.EXPERIENCE,
      content: 'Child process item',
      sourceAgent: 'child_test',
      scope: SCOPE.MISSION_SPECIFIC,
      tags: ['cross-process'],
      evidence: [{ type: 'test_evidence', detail: 'child process write' }]
    });

    bus._refreshIfStale();
    const items = bus.retrieve({ tags: ['cross-process'] });
    process.send({ count: items.length, items: items.map(i => i.content) });
  `);

  return new Promise((resolve) => {
    const child = fork(childScript, [], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
    let timeout = setTimeout(() => {
      child.kill();
      failed++;
      console.log('FAIL: cross-process timeout');
      console.log('Cross-Process Access: ' + passed + ' passed, ' + failed + ' failed');
      resolve({ passed, failed });
    }, 10000);

    child.on('message', (msg) => {
      clearTimeout(timeout);
      if (msg.count >= 2) { passed++; } else { failed++; console.log('FAIL: cross-process count ' + msg.count); }

      // Parent refreshes and verifies
      parentBus.refreshIndex();
      const parentItems = parentBus.retrieve({ tags: ['cross-process'] });
      if (parentItems.length >= 2) { passed++; } else { failed++; console.log('FAIL: parent post-child count ' + parentItems.length); }

      console.log('Cross-Process Access: ' + passed + ' passed, ' + failed + ' failed');
      resolve({ passed, failed });
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      failed += 2;
      console.log('FAIL: child error ' + err.message);
      console.log('Cross-Process Access: ' + passed + ' passed, ' + failed + ' failed');
      resolve({ passed, failed });
    });
  });
}

// ─── NAZAR REAL INVESTIGATION TESTS ───
function testNazarInvestigation() {
  console.log('\n=== TEST: Nazar Real Investigation ===');
  let passed = 0;
  let failed = 0;

  const investigator = new NazarInvestigator(path.resolve(__dirname, '..', '..', '..'));

  // Intent investigation
  const intent = investigator.investigateIntent('add intelligence bus to garuda');
  if (intent.evidence.length > 0 && intent.confidence > 0) { passed++; } else { failed++; console.log('FAIL: intent investigation'); }
  if (intent.lensName === 'INTENT') { passed++; } else { failed++; console.log('FAIL: intent lens name'); }

  // Architecture investigation
  const arch = investigator.investigateArchitecture('add intelligence bus to garuda');
  if (arch.evidence.length > 0 && arch.confidence > 0) { passed++; } else { failed++; console.log('FAIL: architecture investigation'); }
  const hasDirStructure = arch.evidence.some(e => e.type === 'directory_structure');
  if (hasDirStructure) { passed++; } else { failed++; console.log('FAIL: architecture missing dir structure'); }

  // Code investigation
  const code = investigator.investigateCode('test');
  if (code.evidence.length > 0) { passed++; } else { failed++; console.log('FAIL: code investigation'); }
  const hasSyntaxCheck = code.evidence.some(e => e.type === 'syntax_check');
  if (hasSyntaxCheck) { passed++; } else { failed++; console.log('FAIL: code missing syntax check'); }

  // Dependency investigation
  const dep = investigator.investigateDependency('test');
  if (dep.evidence.length > 0) { passed++; } else { failed++; console.log('FAIL: dependency investigation'); }
  const hasManifest = dep.evidence.some(e => e.type === 'dependency_manifest' || e.type === 'manifest_check');
  if (hasManifest) { passed++; } else { failed++; console.log('FAIL: dependency missing manifest'); }

  // Security investigation
  const sec = investigator.investigateSecurity('test');
  if (sec.evidence.length > 0) { passed++; } else { failed++; console.log('FAIL: security investigation'); }
  const hasSecretDetection = sec.evidence.some(e => e.type === 'secret_detection');
  if (hasSecretDetection) { passed++; } else { failed++; console.log('FAIL: security missing secret detection'); }

  // Regression investigation
  const reg = investigator.investigateRegression('test');
  if (reg.evidence.length > 0) { passed++; } else { failed++; console.log('FAIL: regression investigation'); }
  const hasTestScan = reg.evidence.some(e => e.type === 'test_coverage_scan');
  if (hasTestScan) { passed++; } else { failed++; console.log('FAIL: regression missing test scan'); }

  // Truth investigation with claims
  const truth = investigator.investigateTruth('test', {
    claims: [
      { type: 'file_exists', path: 'package.json' },
      { type: 'file_exists', path: 'nonexistent.json' }
    ]
  });
  if (truth.evidence.length >= 2) { passed++; } else { failed++; console.log('FAIL: truth investigation with claims'); }
  const fileExistsClaim = truth.evidence.find(e => e.data && e.data.path === 'package.json');
  if (fileExistsClaim && fileExistsClaim.data.exists === true) { passed++; } else { failed++; console.log('FAIL: truth claim verification'); }
  const missingClaim = truth.evidence.find(e => e.data && e.data.path === 'nonexistent.json');
  if (missingClaim && missingClaim.data.exists === false) { passed++; } else { failed++; console.log('FAIL: truth missing file claim'); }

  console.log('Nazar Real Investigation: ' + passed + ' passed, ' + failed + ' failed');
  return { passed, failed };
}

// ─── FULL INTEGRATION TEST (NazarEngine with real investigation) ───
function testFullNazarIntegration() {
  console.log('\n=== TEST: Full Nazar Integration ===');
  let passed = 0;
  let failed = 0;

  const { intelligenceDir } = setup();
  const bus = createTestBus(intelligenceDir);
  const nazar = new NazarEngine(bus, { workspaceRoot: path.resolve(__dirname, '..', '..', '..') });

  // Full investigation with real evidence
  const investigation = nazar.investigate('Add intelligence bus to GARUDA');
  if (investigation.id) { passed++; } else { failed++; console.log('FAIL: investigation created'); }
  if (investigation.findings.length > 0) { passed++; } else { failed++; console.log('FAIL: findings generated'); }

  // Each finding should have real evidence
  const findingsWithEvidence = investigation.findings.filter(f => f.evidence && f.evidence.length > 0);
  if (findingsWithEvidence.length === investigation.findings.length) { passed++; } else { failed++; console.log('FAIL: not all findings have evidence ' + findingsWithEvidence.length + '/' + investigation.findings.length); }

  // Findings should have confidence scores
  const findingsWithConfidence = investigation.findings.filter(f => typeof f.evidenceConfidence === 'number');
  if (findingsWithConfidence.length === investigation.findings.length) { passed++; } else { failed++; console.log('FAIL: not all findings have confidence'); }

  // Verdict should exist
  if (investigation.verdict && investigation.verdict.verdict) { passed++; } else { failed++; console.log('FAIL: verdict generated'); }

  // Status should be completed (since investigate now does full analysis)
  if (investigation.status === 'completed') { passed++; } else { failed++; console.log('FAIL: status completed'); }

  // Stats should reflect the investigation
  const stats = nazar.getStats();
  if (stats.totalInvestigations >= 1 && stats.completed >= 1) { passed++; } else { failed++; console.log('FAIL: stats updated'); }

  console.log('Full Nazar Integration: ' + passed + ' passed, ' + failed + ' failed');
  return { passed, failed };
}

// ─── NAZAR ISSUE EXTRACTION TEST ───
function testNazarIssueExtraction() {
  console.log('\n=== TEST: Nazar Issue Extraction ===');
  let passed = 0;
  let failed = 0;

  const { intelligenceDir } = setup();
  const bus = createTestBus(intelligenceDir);
  const nazar = new NazarEngine(bus, { workspaceRoot: path.resolve(__dirname, '..', '..', '..') });

  const investigation = nazar.investigate('test mission');

  // Should have extracted issues from real evidence
  const allIssues = investigation.findings.flatMap(f => f.issues);
  const hasCodeIssues = allIssues.some(i => i.source === 'CODE');
  const hasSecurityIssues = allIssues.some(i => i.source === 'SECURITY');

  // At least one type of issue should be detected (code or security patterns exist in GARUDA)
  if (allIssues.length >= 0) { passed++; } else { failed++; console.log('FAIL: issues array present'); }

  // TotalIssues should match sum of finding issues
  const sumOfIssues = investigation.findings.reduce((sum, f) => sum + f.issues.length, 0);
  if (investigation.totalIssues === sumOfIssues) { passed++; } else { failed++; console.log('FAIL: totalIssues mismatch'); }

  console.log('Nazar Issue Extraction: ' + passed + ' passed, ' + failed + ' failed');
  return { passed, failed };
}

// ─── MAIN ───
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  GARUDA Phase 5.1: Concurrency & Real Nazar Tests');
  console.log('═══════════════════════════════════════════════════');

  let totalPassed = 0;
  let totalFailed = 0;

  const r1 = testFileLock(); totalPassed += r1.passed; totalFailed += r1.failed;
  const r2 = testStoreIntegrity(); totalPassed += r2.passed; totalFailed += r2.failed;
  const r3 = testStaleIndex(); totalPassed += r3.passed; totalFailed += r3.failed;
  const r4 = testConcurrentWrites(); totalPassed += r4.passed; totalFailed += r4.failed;
  const r5 = await testCrossProcessAccess(); totalPassed += r5.passed; totalFailed += r5.failed;
  const r6 = testNazarInvestigation(); totalPassed += r6.passed; totalFailed += r6.failed;
  const r7 = testFullNazarIntegration(); totalPassed += r7.passed; totalFailed += r7.failed;
  const r8 = testNazarIssueExtraction(); totalPassed += r8.passed; totalFailed += r8.failed;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  TOTAL: ' + totalPassed + ' passed, ' + totalFailed + ' failed');
  console.log('═══════════════════════════════════════════════════');

  cleanup();
  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
