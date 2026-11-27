/**
 * 🦅 GARUDA BRIDGE — CHATGPT PAYLOAD FORMATTER
 * Consolidates structured tasks, execution reports, git diffs, and evidence
 * into a single, high-contrast review prompt for Founder's ChatGPT session.
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
const OUTBOX_DIR = path.join(BRIDGE_DIR, 'outbox');
const SCHEMAS_DIR = path.join(BRIDGE_DIR, 'schemas');

// Load schemas
const taskSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'task.schema.json'), 'utf8'));
const reportSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'report.schema.json'), 'utf8'));
const reviewSchema = JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, 'review.schema.json'), 'utf8'));

/**
 * Sanitizes sensitive data, API keys, tokens, and Founder personal escalation numbers.
 */
function sanitizeContent(text) {
  if (typeof text !== 'string') return text;

  let sanitized = text;

  // Founder Personal Escalation Number Protection
  sanitized = sanitized.replace(/(\+91\s*|91)?9098750362/g, '[REDACTED_INTERNAL_ESCALATION]');

  // Common API key prefixes
  sanitized = sanitized.replace(/gho_[A-Za-z0-9_]{20,}/g, '[REDACTED_GITHUB_TOKEN]');
  sanitized = sanitized.replace(/sk-[A-Za-z0-9_-]{20,}/g, '[REDACTED_OPENAI_KEY]');
  sanitized = sanitized.replace(/AIza[A-Za-z0-9_-]{30,}/g, '[REDACTED_GEMINI_KEY]');
  sanitized = sanitized.replace(/nvapi-[A-Za-z0-9_-]{20,}/g, '[REDACTED_NVIDIA_KEY]');
  sanitized = sanitized.replace(/gsk_[A-Za-z0-9_-]{20,}/g, '[REDACTED_GROQ_KEY]');

  return sanitized;
}

/**
 * Formats a single consolidated review payload.
 */
function formatPayload(taskId, options = {}) {
  if (!taskId) {
    throw new Error('taskId is required to format ChatGPT review payload.');
  }

  const taskPath = path.join(TASKS_DIR, `task_${taskId}.json`);
  const reportPath = path.join(INBOX_DIR, `report_${taskId}.json`);

  if (!fs.existsSync(taskPath)) {
    throw new Error(`Task file not found: ${taskPath}`);
  }
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Execution report file not found: ${reportPath}`);
  }

  const rawTask = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const rawReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  // 1. Strict Schema Validation
  const taskVal = validateSchema(rawTask, taskSchema);
  if (!taskVal.valid) {
    throw new Error(`Task schema validation failed: ${taskVal.errors.join('; ')}`);
  }

  const reportVal = validateSchema(rawReport, reportSchema);
  if (!reportVal.valid) {
    throw new Error(`Execution report schema validation failed: ${reportVal.errors.join('; ')}`);
  }

  // 2. Correlation ID Check
  if (rawTask.correlationId !== rawReport.correlationId) {
    throw new Error(`Correlation ID mismatch: Task=${rawTask.correlationId}, Report=${rawReport.correlationId}`);
  }
  if (rawTask.taskId !== rawReport.taskId) {
    throw new Error(`Task ID mismatch: Task=${rawTask.taskId}, Report=${rawReport.taskId}`);
  }

  const correlationId = rawTask.correlationId;
  const missionId = rawTask.missionId;
  const taskType = rawTask.taskType;
  const taskTitle = rawTask.title;
  const taskDesc = rawTask.description;
  const targetFiles = rawTask.targetFiles || [];
  const riskLevel = rawTask.governance?.riskLevel || 'LOW';

  // 3. Build Command Results Table
  let commandsTable = '| Command | Exit Code | Status | Output Summary |\n| :--- | :---: | :---: | :--- |\n';
  (rawReport.commandResults || []).forEach(cmd => {
    const statusIcon = cmd.passed ? '🟢 PASS' : '🔴 FAIL';
    const outSummary = sanitizeContent(cmd.stdoutSummary || cmd.stderrSummary || 'N/A').replace(/[\r\n]+/g, ' ').slice(0, 100);
    commandsTable += `| \`${cmd.command}\` | \`${cmd.exitCode}\` | ${statusIcon} | ${outSummary} |\n`;
  });

  // 4. Build File Modifications Table
  let filesTable = '| Modified File | Pre SHA-256 | Post SHA-256 | Bytes Changed |\n| :--- | :---: | :---: | :---: |\n';
  (rawReport.fileModifications || []).forEach(fm => {
    const pre = fm.preSha256 ? `\`${fm.preSha256.slice(0, 12)}...\`` : '*(New File)*';
    const post = fm.postSha256 ? `\`${fm.postSha256.slice(0, 12)}...\`` : '*(Deleted)*';
    filesTable += `| \`${fm.path}\` | ${pre} | ${post} | ${fm.bytesChanged ?? 0} |\n`;
  });

  // 5. Build Evidence Summary
  const manifestSha = rawReport.evidence?.manifestSha256 || 'N/A';
  const manifestPath = rawReport.evidence?.manifestPath || 'N/A';
  const artifactsCount = rawReport.evidence?.artifacts?.length || 0;

  // 6. Generate Review Instruction Payload
  const payloadLines = [
    `# 🦅 GARUDA OPERATING SYSTEM — FORENSIC PEER REVIEW REQUEST`,
    ``,
    `**Mission ID:** \`${missionId}\`  `,
    `**Task ID:** \`${taskId}\`  `,
    `**Correlation ID:** \`${correlationId}\`  `,
    `**Timestamp:** \`${new Date().toISOString()}\`  `,
    `**Executor:** \`${rawReport.executor}\`  `,
    `**Task Type:** \`${taskType}\` | **Risk Level:** \`${riskLevel}\`  `,
    ``,
    `---`,
    ``,
    `## 1. Task Definition & Scope`,
    `- **Title:** ${taskTitle}`,
    `- **Description:** ${sanitizeContent(taskDesc)}`,
    `- **Target Files:** ${targetFiles.map(f => `\`${f}\``).join(', ') || 'None'}`,
    `- **Verification Command:** \`${rawTask.verificationCommand || 'None'}\``,
    ``,
    `---`,
    ``,
    `## 2. Execution Results & Telemetry`,
    `- **Execution Status:** \`${rawReport.status}\``,
    `- **Duration:** \`${rawReport.executionDurationMs} ms\``,
    ``,
    `### Commands Executed:`,
    commandsTable,
    ``,
    `---`,
    ``,
    `## 3. Physical File Changes & Cryptographic Hashes`,
    filesTable,
    ``,
    `---`,
    ``,
    `## 4. Evidence Integrity`,
    `- **Manifest Path:** \`${manifestPath}\``,
    `- **Manifest SHA-256:** \`${manifestSha}\``,
    `- **Artifacts Sealed:** \`${artifactsCount}\``,
    ``,
    `---`,
    ``,
    `## 5. Reviewer Instructions & Expected Output Format`,
    ``,
    `Please conduct an independent forensic audit of the above execution report.`,
    `Evaluate syntax validity, regression risks, anti-fabrication compliance, and evidence completeness.`,
    ``,
    `**CRITICAL REQUIREMENT:** You MUST return your response as a single, valid JSON block conforming exactly to the schema below. Do not wrap in markdown text outside the code block.`,
    ``,
    `\`\`\`json`,
    `{`,
    `  "reviewId": "REV_${Date.now()}_${crypto.randomBytes(3).toString('hex')}",`,
    `  "taskId": "${taskId}",`,
    `  "correlationId": "${correlationId}",`,
    `  "missionId": "${missionId}",`,
    `  "reviewer": "chatgpt-forensic-auditor",`,
    `  "verdict": "PASS | NEEDS_FIX | CRITICAL_FAIL | APPROVAL_REQUIRED",`,
    `  "qualityScore": 95,`,
    `  "defectsIdentified": [],`,
    `  "missingEvidence": [],`,
    `  "antiFabricationAudit": {`,
    `    "claimsVerified": true,`,
    `    "hallucinationsDetected": false,`,
    `    "notes": "Verified against test exit codes and SHA-256 evidence."`,
    `  },`,
    `  "nextRecommendedAction": "Proceed to next scheduled task.",`,
    `  "requestedProtectedOperation": "NONE",`,
    `  "reviewedAt": "${new Date().toISOString()}"`,
    `}`,
    `\`\`\``
  ];

  const payloadContent = payloadLines.join('\n');
  const payloadPath = path.join(OUTBOX_DIR, `chatgpt_payload_${taskId}.md`);
  const latestPath = path.join(OUTBOX_DIR, 'latest_chatgpt_payload.md');

  // Atomic file write using temporary file
  const tmpPath = `${payloadPath}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpPath, payloadContent, 'utf8');
  fs.renameSync(tmpPath, payloadPath);

  // Update latest payload
  fs.copyFileSync(payloadPath, latestPath);

  const sha256 = crypto.createHash('sha256').update(payloadContent).digest('hex');

  return {
    success: true,
    taskId,
    correlationId,
    missionId,
    payloadPath,
    latestPath,
    bytesWritten: Buffer.byteLength(payloadContent, 'utf8'),
    sha256
  };
}

// CLI execution capability
if (require.main === module) {
  const args = process.argv.slice(2);
  const taskId = args[0];

  if (!taskId) {
    console.error('Usage: node scripts/bridge/formatChatGptPayload.js <taskId>');
    process.exit(1);
  }

  try {
    const res = formatPayload(taskId);
    console.log(`✅ [PAYLOAD GENERATED] ${res.payloadPath} (SHA-256: ${res.sha256.slice(0, 16)}...)`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ [PAYLOAD ERROR] ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  formatPayload,
  sanitizeContent
};
