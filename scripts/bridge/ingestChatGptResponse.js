/**
 * 🦅 GARUDA BRIDGE — CHATGPT RESPONSE INGESTOR
 * Validates, authenticates, and ingests forensic review responses from ChatGPT.
 * Enforces correlation ID matching, duplicate prevention, and Founder approval gates.
 * 
 * Founder: Praveen Mahawar
 * Operating Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateSchema } = require('./schemaValidator');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BRIDGE_DIR = path.join(ROOT_DIR, 'data', 'bridge');
const TASKS_DIR = path.join(BRIDGE_DIR, 'tasks');
const INBOX_DIR = path.join(BRIDGE_DIR, 'inbox');
const REVIEWS_DIR = path.join(BRIDGE_DIR, 'reviews');
const ARCHIVE_DIR = path.join(BRIDGE_DIR, 'archive');
const STATE_DIR = path.join(BRIDGE_DIR, 'state');
const SCHEMAS_DIR = path.join(BRIDGE_DIR, 'schemas');

// Load schemas
const reviewSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'review.schema.json'), 'utf8'));

// Memory service integration (graceful fallback)
let memoryService = null;
try {
  memoryService = require(path.join(ROOT_DIR, 'src', 'services', 'persistentMemory', 'memoryService'));
} catch (err) {
  // Suppress, memory is optional in standalone test harness
}

/**
 * Extracts JSON content even if wrapped in Markdown code fences.
 */
function extractJsonPayload(rawText) {
  if (typeof rawText !== 'string') return null;

  const trimmed = rawText.trim();

  // If directly JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Continue to regex
    }
  }

  // Check for ```json ... ``` code fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {
      throw new Error(`Extracted code block contained invalid JSON: ${e.message}`);
    }
  }

  // Attempt substring match between first { and last }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      throw new Error(`Failed to parse candidate JSON substring: ${e.message}`);
    }
  }

  throw new Error('No valid JSON object or markdown code fence found in review payload.');
}

/**
 * Ingests a review file and drives the bridge state machine.
 */
function ingestReview(reviewFilePath, options = {}) {
  const targetPath = reviewFilePath || path.join(REVIEWS_DIR, 'chatgpt_review.json');

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Review file not found: ${targetPath}`);
  }

  const rawFileContent = fs.readFileSync(targetPath, 'utf8');
  if (!rawFileContent.trim()) {
    throw new Error('Review file is completely empty (0 bytes).');
  }

  // 1. Cleanly parse JSON
  const reviewData = extractJsonPayload(rawFileContent);

  // 2. Strict Schema Validation
  const valResult = validateSchema(reviewData, reviewSchema);
  if (!valResult.valid) {
    throw new Error(`Review schema validation failed: ${valResult.errors.join('; ')}`);
  }

  const taskId = reviewData.taskId;
  const correlationId = reviewData.correlationId;
  const verdict = reviewData.verdict;
  const qualityScore = reviewData.qualityScore;
  const requestedProtectedOp = reviewData.requestedProtectedOperation || 'NONE';

  // 3. Verify original task exists
  const taskPath = path.join(TASKS_DIR, `task_${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    throw new Error(`Referenced task not found in bridge: ${taskPath}`);
  }

  const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf8'));

  // 4. Verify Correlation ID matches
  if (taskData.correlationId !== correlationId) {
    throw new Error(`Correlation ID mismatch: Task=${taskData.correlationId}, Review=${correlationId}`);
  }

  // 5. Duplicate Response Prevention
  const archivePath = path.join(ARCHIVE_DIR, `task_${taskId}_review.json`);
  if (fs.existsSync(archivePath) && !options.allowOverwrite) {
    throw new Error(`Duplicate review response: Task '${taskId}' has already been ingested and archived at ${archivePath}`);
  }

  // 6. Security Governance Gate on Protected Operations
  // ChatGPT review is an UNTRUSTED external input and CANNOT directly authorize commits/pushes/deploys!
  let governanceStatus = 'CLEAN';
  let nextTaskStatus = 'READY';

  const protectedOps = ['GIT_COMMIT', 'GIT_PUSH', 'DEPLOY', 'DATABASE_MIGRATION'];
  if (protectedOps.includes(requestedProtectedOp)) {
    governanceStatus = 'PROTECTED_OPERATION_HELD_FOR_FOUNDER';
    nextTaskStatus = 'WAITING_FOUNDER_APPROVAL';
    console.warn(`[GARUDA-BRIDGE-GOVERNANCE] Review requested protected operation '${requestedProtectedOp}'. Halted at WAITING_FOUNDER_APPROVAL.`);
  }

  // 7. Atomic Archival
  const archiveTmp = `${archivePath}.tmp.${Date.now()}`;
  fs.writeFileSync(archiveTmp, JSON.stringify(reviewData, null, 2), 'utf8');
  fs.renameSync(archiveTmp, archivePath);

  // 8. Inscribe Synapse Experience / Lesson
  if (memoryService) {
    try {
      memoryService.remember({
        mission: taskData.missionId,
        taskId,
        action: `bridge_review_ingest_${verdict}`,
        outcome: verdict === 'PASS' ? 'success' : 'needs_attention',
        score: qualityScore,
        defects: reviewData.defectsIdentified,
        tags: ['bridge', 'chatgpt_review', verdict.toLowerCase()]
      });
    } catch (_) {}
  }

  // 9. Prepare Next Task (or Corrective Task)
  let nextTask = null;
  const currentSeq = taskData.sequenceNumber || 1;

  if (verdict === 'PASS') {
    const nextTaskId = `TASK_${Date.now()}_SEQ${currentSeq + 1}`;
    nextTask = {
      taskId: nextTaskId,
      correlationId,
      missionId: taskData.missionId,
      sequenceNumber: currentSeq + 1,
      taskType: 'test_verification',
      title: `Subsequent Task following ${taskData.title}`,
      description: reviewData.nextRecommendedAction || 'Execute subsequent verification step.',
      targetFiles: taskData.targetFiles || [],
      verificationCommand: taskData.verificationCommand || null,
      governance: {
        isProtectedAction: requestedProtectedOp !== 'NONE',
        requiresFounderApproval: requestedProtectedOp !== 'NONE',
        riskLevel: requestedProtectedOp !== 'NONE' ? 'HIGH' : 'LOW',
        isolationMode: 'inherit'
      },
      context: {
        previousTaskId: taskId,
        previousVerdict: verdict,
        previousQualityScore: qualityScore
      },
      status: nextTaskStatus,
      createdAt: new Date().toISOString()
    };
  } else if (verdict === 'NEEDS_FIX' || verdict === 'CRITICAL_FAIL') {
    const fixTaskId = `TASK_${Date.now()}_FIX${currentSeq}`;
    nextTask = {
      taskId: fixTaskId,
      correlationId,
      missionId: taskData.missionId,
      sequenceNumber: currentSeq,
      taskType: 'file_modify',
      title: `Corrective Patch for ${taskData.title}`,
      description: `Remediate defects identified in review: ${(reviewData.defectsIdentified || []).join('; ') || 'Review indicated fixes required.'}`,
      targetFiles: taskData.targetFiles || [],
      verificationCommand: taskData.verificationCommand || null,
      governance: {
        isProtectedAction: false,
        requiresFounderApproval: false,
        riskLevel: 'MEDIUM',
        isolationMode: 'worktree'
      },
      context: {
        defectsToRemediate: reviewData.defectsIdentified,
        parentTaskId: taskId,
        previousQualityScore: qualityScore
      },
      status: 'READY',
      createdAt: new Date().toISOString()
    };
  }

  if (nextTask) {
    const nextTaskPath = path.join(TASKS_DIR, `task_${nextTask.taskId}.json`);
    const nextTmp = `${nextTaskPath}.tmp.${Date.now()}`;
    fs.writeFileSync(nextTmp, JSON.stringify(nextTask, null, 2), 'utf8');
    fs.renameSync(nextTmp, nextTaskPath);
  }

  // 10. Update Bridge State Registry
  const statePath = path.join(STATE_DIR, 'bridge_state.json');
  let currentState = { missions: {}, activeTasks: {}, latestArchived: null };
  if (fs.existsSync(statePath)) {
    try {
      currentState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (_) {}
  }

  currentState.activeTasks[taskId] = {
    status: verdict,
    qualityScore,
    governanceStatus,
    ingestedAt: new Date().toISOString(),
    nextTaskId: nextTask ? nextTask.taskId : null
  };
  currentState.latestArchived = taskId;

  const stateTmp = `${statePath}.tmp.${Date.now()}`;
  fs.writeFileSync(stateTmp, JSON.stringify(currentState, null, 2), 'utf8');
  fs.renameSync(stateTmp, statePath);

  // 11. Clean original review file if it was the default inbox file to prevent accidental re-runs
  if (path.resolve(targetPath) === path.resolve(REVIEWS_DIR, 'chatgpt_review.json') && !options.preserveSource) {
    try {
      fs.unlinkSync(targetPath);
    } catch (_) {}
  }

  const sha256 = crypto.createHash('sha256').update(JSON.stringify(reviewData)).digest('hex');

  return {
    success: true,
    taskId,
    correlationId,
    verdict,
    qualityScore,
    governanceStatus,
    archivedPath: archivePath,
    nextTask: nextTask ? { taskId: nextTask.taskId, title: nextTask.title, status: nextTask.status } : null,
    sha256
  };
}

// CLI execution capability
if (require.main === module) {
  const args = process.argv.slice(2);
  const reviewFile = args[0] || null;

  try {
    const res = ingestReview(reviewFile);
    console.log(`✅ [REVIEW INGESTED] Task=${res.taskId} Verdict=${res.verdict} (Score: ${res.qualityScore}/100)`);
    if (res.nextTask) {
      console.log(`   Next Task Prepared: [${res.nextTask.status}] ${res.nextTask.taskId} - ${res.nextTask.title}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(`❌ [INGEST ERROR] ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  ingestReview,
  extractJsonPayload
};
