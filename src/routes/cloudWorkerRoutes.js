/**
 * 🦅 GARUDA Cloud Worker Mobile Command Routes (Mission B006)
 * Endpoints for mobile task submission, live status polling, pause/resume, and 1-tap approvals.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const CloudTaskWorker = require('../../scripts/bridge/cloudTaskWorker');

const worker = new CloudTaskWorker();

/**
 * Timing-safe string comparison using fixed-size SHA-256 digest
 * Guarantees constant-time comparison without leaking length or character timing
 */
function safeSecretCompare(provided, configured) {
  if (typeof provided !== 'string' || typeof configured !== 'string') return false;
  if (!provided || !configured) return false;
  const hashProvided = crypto.createHash('sha256').update(provided).digest();
  const hashConfigured = crypto.createHash('sha256').update(configured).digest();
  return crypto.timingSafeEqual(hashProvided, hashConfigured);
}

/**
 * Safely extracts client credentials from headers
 * Accepts:
 *  - x-founder-key
 *  - x-founder-pin
 *  - authorization (Bearer <token> or raw <token>)
 */
function extractCandidateCredentials(req) {
  if (!req || !req.headers) return [];
  const candidates = [];

  const keyHeader = req.headers['x-founder-key'];
  if (typeof keyHeader === 'string' && keyHeader.trim()) {
    candidates.push(keyHeader.trim());
  }

  const pinHeader = req.headers['x-founder-pin'];
  if (typeof pinHeader === 'string' && pinHeader.trim()) {
    candidates.push(pinHeader.trim());
  }

  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.trim()) {
    const trimmed = authHeader.trim();
    if (/^bearer\s+/i.test(trimmed)) {
      const token = trimmed.replace(/^bearer\s+/i, '').trim();
      if (token) candidates.push(token);
    } else {
      candidates.push(trimmed);
    }
  }

  return candidates;
}

/**
 * Reads server-side configured Founder secrets
 * Fails closed if none are configured
 */
function getValidServerSecrets() {
  const secretEnvVars = [
    'FOUNDER_ADMIN_KEY',
    'GARUDA_FOUNDER_KEY',
    'FOUNDER_SECRET',
    'FOUNDER_SESSION_SECRET',
    'FOUNDER_ACCESS_PASSWORD'
  ];

  const valid = [];
  for (const envVar of secretEnvVars) {
    const val = process.env[envVar];
    if (typeof val === 'string' && val.trim().length > 0) {
      valid.push(val.trim());
    }
  }
  return valid;
}

/**
 * Hardened Founder Authentication Middleware (Mission B009)
 * 1. Fails closed if server secrets are missing
 * 2. Never trusts client assertion headers (x-founder-authorized)
 * 3. Uses server-side configured credentials only
 * 4. Timing-safe constant-time secret comparison
 * 5. Rejects missing, invalid and malformed credentials
 * 6. Never reveals secrets in logs or responses
 */
function checkFounderAuth(req, res, next) {
  // Property 1: Fail closed if required environment secrets are missing
  const validSecrets = getValidServerSecrets();
  if (validSecrets.length === 0) {
    return res.status(503).json({
      success: false,
      error: 'SERVER_AUTH_UNCONFIGURED',
      message: 'Founder authorization service unavailable: server credentials unconfigured.'
    });
  }

  // Property 5: Reject missing or malformed credentials
  const candidatePins = extractCandidateCredentials(req);
  if (candidatePins.length === 0) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED_FOUNDER_ACCESS',
      message: 'Founder authorization required for Cloud Worker control.'
    });
  }

  // Property 2, 3, 4: Strict server-side verification using timing-safe comparison
  let isAuthenticated = false;
  for (const pin of candidatePins) {
    for (const secret of validSecrets) {
      if (safeSecretCompare(pin, secret)) {
        isAuthenticated = true;
        break;
      }
    }
    if (isAuthenticated) break;
  }

  if (!isAuthenticated) {
    // Property 6: Generic error message without revealing secrets
    return res.status(401).json({
      success: false,
      error: 'INVALID_FOUNDER_CREDENTIALS',
      message: 'Invalid Founder authorization credentials.'
    });
  }

  return next();
}

router.use(checkFounderAuth);

/**
 * POST /api/founder/gateway/worker/submit
 * Submits a new mobile task
 */
router.post('/submit', (req, res) => {
  try {
    const payload = req.body || {};
    const result = worker.submitTask(payload);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/founder/gateway/worker/tasks
 * Lists all tasks in the cloud queue
 */
router.get('/tasks', (req, res) => {
  try {
    const queue = worker.loadQueue();
    res.json({ success: true, count: queue.tasks.length, tasks: queue.tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/founder/gateway/worker/task/:taskId
 * Retrieves task status, current step, checkpoints, and logs
 */
router.get('/task/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = worker.getTask(taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    const logs = worker.getLogs(taskId);
    const checkpoint = worker.loadLatestCheckpoint(taskId);
    res.json({ success: true, task, logs, checkpoint });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/worker/task/:taskId/run
 * Runs or continues task execution
 */
router.post('/task/:taskId/run', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await worker.runTask(taskId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/worker/task/:taskId/pause
 * Pauses active task
 */
router.post('/task/:taskId/pause', (req, res) => {
  try {
    const { taskId } = req.params;
    const result = worker.pauseTask(taskId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/worker/task/:taskId/resume
 * Resumes paused task
 */
router.post('/task/:taskId/resume', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await worker.resumeTask(taskId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/worker/task/:taskId/cancel
 * Aborts task execution
 */
router.post('/task/:taskId/cancel', (req, res) => {
  try {
    const { taskId } = req.params;
    const result = worker.cancelTask(taskId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/worker/task/:taskId/approve
 * 1-Tap Founder authorization for protected action
 */
router.post('/task/:taskId/approve', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await worker.approveTask(taskId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/founder/gateway/worker/task/:taskId/reject
 * 1-Tap Founder rejection of protected action
 */
router.post('/task/:taskId/reject', (req, res) => {
  try {
    const { taskId } = req.params;
    const result = worker.rejectTask(taskId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = {
  router,
  worker,
  checkFounderAuth,
  safeSecretCompare,
  extractCandidateCredentials,
  getValidServerSecrets
};
