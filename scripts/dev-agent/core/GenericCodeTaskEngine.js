/**
 * GARUDA Generic Code Task Engine
 *
 * Bridges a small natural-language engineering task to the governed engineering
 * pipeline through the existing LLM abstraction (src/rag/llmAdapter).
 *
 * The LLM produces a STRUCTURED PROPOSAL ONLY. It never touches the workspace.
 * The EngineeringBrain validates artifacts in an isolated temp workspace, builds
 * a patch, and the controlled executor applies it under the founder-approval gate.
 */

const EngineeringBrain = require("./EngineeringBrain");
const { validateProposal } = require("./EngineeringProposalPolicy");
const llmAdapter = require("../../../src/rag/llmAdapter");

const GENERIC_CODE_PROMPT = `You are GARUDA's governed code-generation brain.
Transform the engineering task into a STRICT JSON object. No markdown, no prose, no code fences. Only JSON.

Required JSON schema:
{
  "task": "restated bounded task",
  "confidence": 0.0-1.0,
  "targetFiles": ["src/generated/<name>.js", "src/generated/<name>.test.js"],
  "implementationPlan": { "summary": "short summary", "steps": ["step 1", "step 2"] },
  "proposedChanges": [
    { "path": "src/generated/<name>.js", "content": "full module source" },
    { "path": "src/generated/<name>.test.js", "content": "full node:assert test source that requires the module relatively and passes" }
  ],
  "verification": { "tests": ["src/generated/<name>.test.js"] }
}

Constraints (mandatory):
- targetFiles and proposedChanges paths MUST start with "src/generated/" (new files only).
- Exactly one non-test module (.js) and at least one test (.test.js) that requires it relatively and PASSES.
- No destructive operations, no dependency installation, no child_process, no writes outside proposed files.
- Code must be plain CommonJS Node.js using only built-ins + node:assert in tests.
- Never reference files you are not creating.`;

function stripCodeFences(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

function parseStructuredOutput(answerText) {
  const cleaned = stripCodeFences(answerText);
  if (!cleaned) return null;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  const slice = cleaned.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Generate a governed generic code task from a natural-language engineering task.
 *
 * @param {object} options
 * @param {string} options.task            - small, well-scoped engineering task
 * @param {string} [options.intentId]      - bounded intent id
 * @param {string} [options.rootDir]       - workspace root (default cwd)
 * @param {Function} [options.llm]         - injectable async (args)=>answer for tests
 * @returns {Promise<object>} structured result: task, plan, proposedChanges,
 *          buildResult, status, patch, evidence, policy
 */
async function generateGenericCodeTask({
  task,
  intentId,
  rootDir = process.cwd(),
  llm = null
} = {}) {
  if (!task || typeof task !== "string" || !task.trim()) {
    throw new Error("GENERIC_CODE_TASK_REQUIRED");
  }
  if (task.trim().length > 2000) throw new Error("GENERIC_CODE_TASK_TOO_LONG");

  const generate = llm || ((args) => llmAdapter.generateAnswer(args));
  const response = await generate({
    query: task,
    systemPrompt: GENERIC_CODE_PROMPT,
    metadata: { capability: "generic_code_task" }
  });

  const answerText = response && (response.answer || response.response);
  if (!answerText) throw new Error("GENERIC_CODE_TASK_EMPTY_LLM_OUTPUT");

  const parsed = parseStructuredOutput(answerText);
  if (!parsed) throw new Error("GENERIC_CODE_TASK_MALFORMED_OUTPUT");

  const proposal = {
    schemaVersion: "1.0",
    intentId: String(intentId || parsed.intentId || "generic-code-task").slice(0, 120),
    summary: String(parsed.task || task).slice(0, 500),
    confidence: parsed.confidence,
    artifactSpec: {
      template: "generic_code_task",
      task: String(parsed.task || task).slice(0, 2000),
      targetFiles: parsed.targetFiles,
      implementationPlan: parsed.implementationPlan,
      proposedChanges: parsed.proposedChanges,
      verification: parsed.verification
    }
  };

  const validated = validateProposal(proposal);
  const brain = new EngineeringBrain({ rootDir });
  const buildResult = brain.build(validated.artifactSpec);

  return {
    status: buildResult.status,
    engine: buildResult.engine,
    task: validated.artifactSpec.task,
    intentId: validated.intentId,
    targetFiles: validated.artifactSpec.targetFiles,
    implementationPlan: validated.artifactSpec.implementationPlan,
    proposedChanges: validated.artifactSpec.proposedChanges,
    verification: validated.artifactSpec.verification,
    policy: validated.policy,
    intelligenceUsed: true,
    requiresFounderApprovalToApply: buildResult.requiresFounderApprovalToApply,
    commitPushDeployAllowed: buildResult.commitPushDeployAllowed,
    sourceTreeModified: buildResult.sourceTreeModified,
    patch: buildResult.patch,
    patchSha256: buildResult.patchSha256,
    evidence: buildResult.evidence,
    buildResult,
    provider: response && response.provider ? response.provider : null,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  GENERIC_CODE_PROMPT,
  generateGenericCodeTask,
  parseStructuredOutput,
  stripCodeFences
};