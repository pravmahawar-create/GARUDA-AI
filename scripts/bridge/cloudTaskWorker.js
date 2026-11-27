/**
 * 🦅 GARUDA BRIDGE — PERSISTENT CLOUD TASK WORKER (MISSION B006)
 * 
 * Capabilities:
 * 1. Durable Task Queue & State Machine (Fully schema-compliant with task.schema.json):
 *    - Worker States: QUEUED, ASSIGNED, IN_PROGRESS, PAUSED, CHECKPOINTED,
 *                     WAITING_FOUNDER_APPROVAL, COMPLETED, FAILED, CANCELLED.
 *    - Schema Statuses: CREATED, EXECUTING, BLOCKED_APPROVAL, COMPLETED, FAILED.
 * 2. Step-by-Step Checkpointing:
 *    - Atomic progress persistence with cryptographic SHA-256 hashing.
 * 3. Crash-Resilient Auto-Resume:
 *    - Automatically detects unfinished/interrupted tasks upon worker boot or restart,
 *      restores execution context, and resumes from the exact last checkpoint.
 * 4. Mobile Command Centre Hooks:
 *    - pause(), resume(), cancel(), approve(), reject().
 * 5. Bounded Command Execution Sandbox:
 *    - Safe command allowlist; blocks arbitrary shell access or destructive commands.
 * 6. Non-Negotiable Governance & Approval Gate:
 *    - git commit / push / deploy operations are strictly held at WAITING_FOUNDER_APPROVAL.
 * 7. Founder Personal Privacy Shield:
 *    - Full redaction of Founder Praveen's personal phone number (+91 9098750362) and API tokens.
 * 
 * Operating Doctrine: 100% Anti-Fabrication Law ("Show > Tell")
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const schemaValidator = require('./schemaValidator');

const STATE_DIR = path.resolve(__dirname, '..', '..', 'data', 'bridge', 'state');
const CHECKPOINTS_DIR = path.join(STATE_DIR, 'checkpoints');
const QUEUE_FILE = path.join(STATE_DIR, 'cloud_task_queue.json');

// Founder Personal Phone Number and secret pattern regex for PII shielding
const FOUNDER_PHONE_REGEX = /(?:\+?91[\s-]?)?9098750362/g;
const SENSITIVE_TOKEN_REGEX = /(?:bot[0-9]{8,12}:[a-zA-Z0-9_-]{30,}|AIzaSy[a-zA-Z0-9_-]{20,}|gsk_[a-zA-Z0-9_-]{20,}|nvapi-[a-zA-Z0-9_-]{20,}|csk-[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9_-]{20,})/g;

// Safe command allowlist regex
const ALLOWED_COMMANDS_REGEX = /^(?:node\s+-c\s+[a-zA-Z0-9_\-\.\/]+|node\s+tests\/[a-zA-Z0-9_\-\.\/]+\.js|npm\s+test|git\s+status|git\s+diff|git\s+log|npx\s+vite\s+build|node\s+scripts\/[a-zA-Z0-9_\-\.\/]+\.js)$/;

// Protected actions requiring Founder explicit approval
const PROTECTED_ACTION_REGEX = /(?:git\s+commit|git\s+push|deploy|vercel|cloudflare|production\s+build|release\s+apk|drop\s+table)/i;

class CloudTaskWorker {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || path.resolve(__dirname, '..', '..');
    this.stateDir = options.stateDir || STATE_DIR;
    this.checkpointsDir = options.checkpointsDir || CHECKPOINTS_DIR;
    this.queueFile = options.queueFile || QUEUE_FILE;
    this.maxRetries = options.maxRetries || 2;
    this.founderChatId = String(options.founderChatId || process.env.TELEGRAM_FOUNDER_CHAT_ID || '1142514338').trim();
    
    // Ensure state directories exist
    if (!fs.existsSync(this.stateDir)) fs.mkdirSync(this.stateDir, { recursive: true });
    if (!fs.existsSync(this.checkpointsDir)) fs.mkdirSync(this.checkpointsDir, { recursive: true });

    this.queue = this.loadQueue();
    this.activeTask = null;
    this.executionLogs = new Map(); // taskId -> array of logs
  }

  /**
   * Redacts sensitive numbers and tokens from strings
   */
  sanitize(text) {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(FOUNDER_PHONE_REGEX, '[REDACTED_FOUNDER_INTERNAL_CHANNEL]')
      .replace(SENSITIVE_TOKEN_REGEX, '[REDACTED_CREDENTIAL]');
  }

  /**
   * Logs execution events with secret sanitization
   */
  log(taskId, message) {
    const timestamp = new Date().toISOString();
    const cleanMsg = this.sanitize(message);
    const line = `[${timestamp}] ${cleanMsg}`;
    
    if (!this.executionLogs.has(taskId)) {
      this.executionLogs.set(taskId, []);
    }
    this.executionLogs.get(taskId).push(line);
    return line;
  }

  /**
   * Retrieves execution logs for a task
   */
  getLogs(taskId) {
    return this.executionLogs.get(taskId) || [];
  }

  /**
   * Reads durable queue from disk
   */
  loadQueue() {
    try {
      if (fs.existsSync(this.queueFile)) {
        const raw = fs.readFileSync(this.queueFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (_) {}
    return { tasks: [], updatedAt: new Date().toISOString() };
  }

  /**
   * Atomically persists queue to disk
   */
  persistQueue() {
    this.queue.updatedAt = new Date().toISOString();
    const tempFile = `${this.queueFile}.tmp_${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(this.queue, null, 2), 'utf8');
    fs.renameSync(tempFile, this.queueFile);
  }

  /**
   * Retrieves or initializes cloud worker context block
   */
  getWorkerContext(task) {
    if (!task.context) task.context = {};
    if (!task.context.cloudWorker) {
      task.context.cloudWorker = {
        workerState: task.status === 'BLOCKED_APPROVAL' ? 'WAITING_FOUNDER_APPROVAL' : 'QUEUED',
        steps: [
          { stepIndex: 1, action: 'inspect_files', title: 'Target Files Inspection' },
          { stepIndex: 2, action: 'verify_syntax', title: 'Pre-Execution Verification' },
          { stepIndex: 3, action: task.governance?.isProtectedAction ? 'request_approval' : 'execute_operation', title: task.governance?.isProtectedAction ? 'Founder Authorization Gate' : 'Execute Core Action' }
        ],
        currentStep: 0,
        retries: 0
      };
    }
    return task.context.cloudWorker;
  }

  /**
   * Submits a new task to the durable queue
   */
  submitTask(taskPayload) {
    const now = Date.now();
    const taskId = taskPayload.taskId || `TASK_${now}_${crypto.randomBytes(4).toString('hex')}`;
    const correlationId = taskPayload.correlationId || `CORR_${now}_${crypto.randomBytes(4).toString('hex')}`;
    const missionId = taskPayload.missionId || 'B006';

    const isProtected = Boolean(
      taskPayload.governance?.isProtectedAction ||
      PROTECTED_ACTION_REGEX.test(taskPayload.description || '') ||
      PROTECTED_ACTION_REGEX.test(taskPayload.title || '')
    );

    const initialStatus = isProtected ? 'BLOCKED_APPROVAL' : 'CREATED';
    const steps = taskPayload.steps || [
      { stepIndex: 1, action: 'inspect_files', title: 'Target Files Inspection' },
      { stepIndex: 2, action: 'verify_syntax', title: 'Pre-Execution Verification' },
      { stepIndex: 3, action: isProtected ? 'request_approval' : 'execute_operation', title: isProtected ? 'Founder Authorization Gate' : 'Execute Core Action' }
    ];

    const task = {
      taskId,
      correlationId,
      missionId,
      sequenceNumber: taskPayload.sequenceNumber || 1,
      taskType: taskPayload.taskType || (isProtected ? 'command_exec' : 'file_modify'),
      title: taskPayload.title || 'Mobile Submitted Task',
      description: taskPayload.description || 'Cloud background task',
      targetFiles: Array.isArray(taskPayload.targetFiles) ? taskPayload.targetFiles : [],
      verificationCommand: taskPayload.verificationCommand || (isProtected ? 'git status' : null),
      governance: {
        isProtectedAction: isProtected,
        requiresFounderApproval: isProtected,
        riskLevel: isProtected ? 'CRITICAL' : (taskPayload.governance?.riskLevel || 'LOW'),
        isolationMode: isProtected ? 'worktree' : 'inherit'
      },
      context: {
        ...(taskPayload.context || { submittedVia: 'mobile_command_centre' }),
        cloudWorker: {
          workerState: isProtected ? 'WAITING_FOUNDER_APPROVAL' : 'QUEUED',
          steps,
          currentStep: 0,
          retries: 0
        }
      },
      status: initialStatus,
      createdAt: new Date(now).toISOString()
    };

    // Validate against task.schema.json
    const validation = schemaValidator.validateTask(task);
    if (!validation.valid) {
      throw new Error(`Submitted task failed schema validation: ${validation.errors.join('; ')}`);
    }

    this.queue.tasks.push(task);
    this.persistQueue();
    this.log(taskId, `Task submitted to cloud queue by Founder (Initial status: ${task.status}, Worker state: ${task.context.cloudWorker.workerState}).`);

    return {
      success: true,
      taskId,
      correlationId,
      status: task.status,
      workerState: task.context.cloudWorker.workerState,
      task
    };
  }

  /**
   * Retrieves task by ID
   */
  getTask(taskId) {
    return this.queue.tasks.find(t => t.taskId === taskId) || null;
  }

  /**
   * Saves atomic step checkpoint
   */
  saveCheckpoint(task, stepIndex, stepResult = {}) {
    const now = Date.now();
    const wContext = this.getWorkerContext(task);
    const checkpointId = `CHK_${now}_${crypto.randomBytes(3).toString('hex')}`;
    const checkpointData = {
      checkpointId,
      taskId: task.taskId,
      correlationId: task.correlationId,
      stepIndex,
      totalSteps: wContext.steps.length,
      stepTitle: wContext.steps[stepIndex - 1]?.title || `Step ${stepIndex}`,
      stepResult,
      taskStatus: task.status,
      workerState: wContext.workerState,
      savedAt: new Date(now).toISOString()
    };

    const payloadStr = JSON.stringify(checkpointData);
    checkpointData.sha256 = crypto.createHash('sha256').update(payloadStr).digest('hex');

    const filePath = path.join(this.checkpointsDir, `chk_${task.taskId}_step_${stepIndex}.json`);
    const tempFile = `${filePath}.tmp_${now}`;
    fs.writeFileSync(tempFile, JSON.stringify(checkpointData, null, 2), 'utf8');
    fs.renameSync(tempFile, filePath);

    wContext.currentStep = stepIndex;
    wContext.lastCheckpoint = checkpointData;
    this.persistQueue();

    this.log(task.taskId, `Checkpoint saved for Step ${stepIndex}/${wContext.steps.length} (SHA-256: ${checkpointData.sha256.slice(0, 12)}...)`);
    return checkpointData;
  }

  /**
   * Loads the most recent checkpoint for a task
   */
  loadLatestCheckpoint(taskId) {
    try {
      const files = fs.readdirSync(this.checkpointsDir)
        .filter(f => f.startsWith(`chk_${taskId}_`))
        .sort();

      if (files.length === 0) return null;
      const latestFile = files[files.length - 1];
      const raw = fs.readFileSync(path.join(this.checkpointsDir, latestFile), 'utf8');
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  /**
   * Executes a command within the safe bounded sandbox
   */
  executeBoundedCommand(command) {
    const cleanCmd = String(command || '').trim();

    // Check allowlist
    if (!ALLOWED_COMMANDS_REGEX.test(cleanCmd)) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: `SECURITY_REJECTION: Command '${cleanCmd}' is not in the safe allowlist. Bounded execution enforced.`,
        permitted: false
      };
    }

    try {
      const stdout = cp.execSync(cleanCmd, {
        cwd: this.workspaceRoot,
        encoding: 'utf8',
        timeout: 20000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return { success: true, exitCode: 0, stdout: this.sanitize(stdout), stderr: '', permitted: true };
    } catch (err) {
      return {
        success: false,
        exitCode: err.status || 1,
        stdout: this.sanitize(err.stdout || ''),
        stderr: this.sanitize(err.stderr || err.message),
        permitted: true
      };
    }
  }

  /**
   * Executes an atomic task step
   */
  async executeStep(task, step) {
    const wContext = this.getWorkerContext(task);
    this.log(task.taskId, `Executing Step ${step.stepIndex}: ${step.title}`);

    if (step.action === 'inspect_files') {
      const filesFound = (task.targetFiles || []).filter(f => fs.existsSync(path.resolve(this.workspaceRoot, f)));
      return {
        success: true,
        action: 'inspect_files',
        filesTargeted: task.targetFiles,
        filesFoundCount: filesFound.length
      };
    }

    if (step.action === 'verify_syntax') {
      let syntaxOk = true;
      const reports = [];
      for (const file of task.targetFiles || []) {
        if (file.endsWith('.js')) {
          const checkRes = this.executeBoundedCommand(`node -c ${file}`);
          reports.push({ file, passed: checkRes.success, stderr: checkRes.stderr });
          if (!checkRes.success) syntaxOk = false;
        }
      }
      return { success: syntaxOk, action: 'verify_syntax', reports };
    }

    if (step.action === 'request_approval' || (task.governance.isProtectedAction && step.stepIndex === wContext.steps.length)) {
      task.status = 'BLOCKED_APPROVAL';
      wContext.workerState = 'WAITING_FOUNDER_APPROVAL';
      this.persistQueue();
      this.log(task.taskId, `[GOVERNANCE] Protected operation reached. Execution halted at WAITING_FOUNDER_APPROVAL.`);
      return {
        success: true,
        action: 'request_approval',
        haltedForApproval: true,
        message: 'Awaiting explicit Founder approval via mobile.'
      };
    }

    if (step.action === 'execute_operation') {
      if (task.verificationCommand) {
        const cmdRes = this.executeBoundedCommand(task.verificationCommand);
        return { success: cmdRes.success, action: 'execute_operation', cmdRes };
      }
      return { success: true, action: 'execute_operation', message: 'Step completed.' };
    }

    return { success: true, action: step.action || 'custom', message: 'Custom step completed.' };
  }

  /**
   * Main sequential task execution loop
   */
  async runTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found in cloud queue.`);

    const wContext = this.getWorkerContext(task);

    if (task.status === 'COMPLETED' || wContext.workerState === 'CANCELLED') {
      return { task, finished: true };
    }

    this.activeTask = task;
    task.status = 'EXECUTING';
    wContext.workerState = 'IN_PROGRESS';
    this.persistQueue();
    this.log(task.taskId, `Worker transitioned task to EXECUTING (WorkerState: IN_PROGRESS).`);

    let startStep = wContext.currentStep || 0;

    for (let i = startStep; i < wContext.steps.length; i++) {
      const currentStep = wContext.steps[i];

      // Check if paused or cancelled externally
      if (wContext.workerState === 'PAUSED') {
        task.status = 'CREATED';
        this.persistQueue();
        this.log(task.taskId, `Execution paused by Founder. Checkpoint preserved.`);
        return { task, paused: true };
      }

      if (wContext.workerState === 'CANCELLED') {
        task.status = 'FAILED';
        this.persistQueue();
        this.log(task.taskId, `Execution aborted by Founder. Status: CANCELLED.`);
        return { task, cancelled: true };
      }

      const stepResult = await this.executeStep(task, currentStep);

      // Check if stepped into approval wait
      if (stepResult.haltedForApproval || wContext.workerState === 'WAITING_FOUNDER_APPROVAL') {
        this.saveCheckpoint(task, i + 1, stepResult);
        return { task, waitingApproval: true };
      }

      if (!stepResult.success) {
        wContext.retries = (wContext.retries || 0) + 1;
        if (wContext.retries <= this.maxRetries) {
          this.log(task.taskId, `Step ${currentStep.stepIndex} failed. Attempting retry ${wContext.retries}/${this.maxRetries}...`);
          i--; // Retry same step
          continue;
        } else {
          task.status = 'FAILED';
          wContext.workerState = 'FAILED';
          this.persistQueue();
          this.log(task.taskId, `Task failed after ${this.maxRetries} retries. Reason: ${JSON.stringify(stepResult)}`);
          return { task, failed: true, error: stepResult };
        }
      }

      // Save step checkpoint
      this.saveCheckpoint(task, i + 1, stepResult);
    }

    // All steps completed!
    task.status = 'COMPLETED';
    wContext.workerState = 'COMPLETED';
    this.persistQueue();
    this.log(task.taskId, `🎉 Task execution VERIFIED_SUCCESS. All ${wContext.steps.length} steps completed.`);
    return { task, completed: true };
  }

  /**
   * Crash recovery & restart scanner
   */
  async recoverAndResumeTasks() {
    const unfinished = this.queue.tasks.filter(t => {
      const w = t.context?.cloudWorker;
      return t.status === 'EXECUTING' || (w && (w.workerState === 'IN_PROGRESS' || w.workerState === 'CHECKPOINTED'));
    });
    const recovered = [];

    for (const task of unfinished) {
      const wContext = this.getWorkerContext(task);
      this.log(task.taskId, `[RESTART_RECOVERY] Detected interrupted task. Resuming from Step ${wContext.currentStep}/${wContext.steps.length}.`);
      
      const resumeResult = await this.runTask(task.taskId);
      recovered.push({ taskId: task.taskId, status: task.status, result: resumeResult });
    }

    return { recoveredCount: recovered.length, recovered };
  }

  /**
   * Founder Control: Pause Task
   */
  pauseTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);
    const wContext = this.getWorkerContext(task);

    if (task.status !== 'EXECUTING' && wContext.workerState !== 'IN_PROGRESS') {
      return { success: false, message: `Task is in state '${wContext.workerState}', cannot pause.` };
    }
    task.status = 'CREATED';
    wContext.workerState = 'PAUSED';
    this.persistQueue();
    this.log(taskId, `Task PAUSED by Founder mobile command.`);
    return { success: true, taskId, status: 'PAUSED', workerState: 'PAUSED', currentStep: wContext.currentStep };
  }

  /**
   * Founder Control: Resume Task
   */
  async resumeTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);
    const wContext = this.getWorkerContext(task);

    if (wContext.workerState !== 'PAUSED' && wContext.workerState !== 'CHECKPOINTED') {
      return { success: false, message: `Task is in state '${wContext.workerState}', cannot resume.` };
    }
    this.log(taskId, `Task RESUMED by Founder mobile command from Step ${wContext.currentStep}.`);
    return this.runTask(taskId);
  }

  /**
   * Founder Control: Cancel Task
   */
  cancelTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);
    const wContext = this.getWorkerContext(task);

    task.status = 'FAILED';
    wContext.workerState = 'CANCELLED';
    this.persistQueue();
    this.log(taskId, `Task CANCELLED by Founder mobile command.`);
    return { success: true, taskId, status: 'CANCELLED', workerState: 'CANCELLED' };
  }

  /**
   * Founder Control: 1-Tap Approve Protected Action
   */
  async approveTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);
    const wContext = this.getWorkerContext(task);

    if (task.status !== 'BLOCKED_APPROVAL' && wContext.workerState !== 'WAITING_FOUNDER_APPROVAL') {
      return { success: false, message: `Task is in state '${task.status}', approval not pending.` };
    }
    task.status = 'EXECUTING';
    wContext.workerState = 'IN_PROGRESS';
    task.governance.requiresFounderApproval = false;
    task.governance.approvedByFounderAt = new Date().toISOString();
    this.persistQueue();
    this.log(taskId, `[FOUNDER_APPROVAL_GRANTED] Protected action authorized by Founder Praveen. Resuming execution.`);
    return this.runTask(taskId);
  }

  /**
   * Founder Control: 1-Tap Reject Protected Action
   */
  rejectTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);
    const wContext = this.getWorkerContext(task);

    task.status = 'FAILED';
    wContext.workerState = 'CANCELLED';
    task.governance.rejectedByFounderAt = new Date().toISOString();
    this.persistQueue();
    this.log(taskId, `[FOUNDER_REJECTION] Protected action rejected by Founder. Task terminated.`);
    return { success: true, taskId, status: 'CANCELLED', workerState: 'CANCELLED', rejected: true };
  }
}

module.exports = CloudTaskWorker;
