const crypto = require("crypto");
const { spawnSync } = require("child_process");

const SUPPORTED_WORKERS = Object.freeze([
  "local_brain_worker",
  "aider",
  "gemini",
  "cline",
  "copilot"
]);

const EXECUTION_MODES = Object.freeze({
  LOCAL_EXECUTION: "LOCAL_EXECUTION",
  APPROVAL_GATED: "APPROVAL_GATED",
  PREVIEW_ONLY: "PREVIEW_ONLY"
});

const EXECUTION_MODE = EXECUTION_MODES.LOCAL_EXECUTION;

const DEFAULT_TIMEOUT_MS = 120000;
const MAX_TIMEOUT_MS = 600000;

const DEFAULT_WORKER_COMMANDS = Object.freeze({
  aider: {
    command: "aider",
    args: ["--message", "{prompt}", "--no-auto-commits"]
  },
  gemini: {
    command: "gemini",
    args: ["-p", "{prompt}"]
  },
  cline: {
    command: "cline",
    args: ["--prompt", "{prompt}"]
  },
  copilot: {
    command: "gh",
    args: ["copilot", "suggest", "-t", "shell", "{prompt}"]
  }
});

function fingerprintPrompt(prompt) {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(prompt || ""))
    .digest("hex");
}

function getFounderApprovalState(context = {}) {
  const environmentApproved =
    process.env.GARUDA_FOUNDER_APPROVED === "true" ||
    Boolean(process.env.GARUDA_FOUNDER_APPROVAL_TOKEN);

  const contextApproval = context.approvalState || {};
  const contextApproved =
    contextApproval.founderApproved === true ||
    contextApproval.approved === true ||
    context.founderApproved === true;

  return environmentApproved || contextApproved;
}

function getExternalExecutionState() {
  return process.env.GARUDA_EXTERNAL_WORKER_EXECUTION === "true";
}

function resolveExecutionMode(worker, context = {}) {
  if (worker === "local_brain_worker") {
    return EXECUTION_MODES.LOCAL_EXECUTION;
  }

  const founderApproved = getFounderApprovalState(context);
  const externalExecutionEnabled = getExternalExecutionState();

  if (founderApproved && externalExecutionEnabled) {
    return EXECUTION_MODES.APPROVAL_GATED;
  }

  return EXECUTION_MODES.PREVIEW_ONLY;
}

function resolveAdapterStatus(worker, executionMode) {
  if (
    worker === "local_brain_worker" &&
    executionMode === EXECUTION_MODES.LOCAL_EXECUTION
  ) {
    return "LOCAL_EXECUTION_READY";
  }

  if (executionMode === EXECUTION_MODES.APPROVAL_GATED) {
    return "EXTERNAL_EXECUTION_READY";
  }

  return "REQUEST_PREPARED";
}

function normalizeTimeout(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(Math.floor(parsed), MAX_TIMEOUT_MS);
}

function replaceTemplateValue(value, replacements) {
  return String(value).replace(/\{(\w+)\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(replacements, key)
      ? String(replacements[key])
      : "";
  });
}

function resolveWorkerCommand(worker, request) {
  const context = request.context || {};
  const configuredCommands = context.workerCommands || {};
  const configured = configuredCommands[worker];
  const defaults = DEFAULT_WORKER_COMMANDS[worker];

  const definition = configured || defaults;

  if (!definition || !definition.command) {
    return null;
  }

  const replacements = {
    prompt: request.prompt,
    goal: request.goal,
    rootDir: context.rootDir || process.cwd()
  };

  return {
    command: replaceTemplateValue(definition.command, replacements),
    args: Array.isArray(definition.args)
      ? definition.args.map((arg) =>
          replaceTemplateValue(arg, replacements)
        )
      : [],
    cwd: context.rootDir || process.cwd(),
    env: {
      ...process.env,
      ...(context.environment || {})
    }
  };
}

function commandExists(command, cwd) {
  const checker =
    process.platform === "win32"
      ? { command: "where", args: [command] }
      : { command: "which", args: [command] };

  const result = spawnSync(checker.command, checker.args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    timeout: 10000
  });

  return result.status === 0;
}

function sanitizeExecutionResult(result) {
  return {
    exitCode:
      typeof result.status === "number"
        ? result.status
        : null,
    signal: result.signal || null,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim(),
    error: result.error ? result.error.message : null
  };
}

class ExternalWorkerAdapter {
  buildRequest(worker, goal, context = {}) {
    const selectedWorker = String(worker || "").trim();

    if (!SUPPORTED_WORKERS.includes(selectedWorker)) {
      throw new Error(
        `Unsupported worker: ${selectedWorker || "unknown"}`
      );
    }

    const prompt = context.prompt || "";
    const promptFingerprint =
      context.promptFingerprint || fingerprintPrompt(prompt);
    const executionMode = resolveExecutionMode(
      selectedWorker,
      context
    );
    const adapterStatus = resolveAdapterStatus(
      selectedWorker,
      executionMode
    );

    return {
      worker: selectedWorker,
      goal: goal || "",
      prompt,
      context,
      estimatedCost:
        context.estimatedCost ||
        context.estimatedCostLevel ||
        "local_preferred",
      requiresApproval:
        selectedWorker === "local_brain_worker"
          ? false
          : context.requiresApproval !== false,
      executionMode,
      promptFingerprint,
      adapterStatus,
      executionReady:
        selectedWorker === "local_brain_worker" ||
        executionMode === EXECUTION_MODES.APPROVAL_GATED,
      externalExecutionEnabled: getExternalExecutionState(),
      founderApproved: getFounderApprovalState(context),
      createdAt: new Date().toISOString()
    };
  }

  preview(worker, goal, context = {}) {
    const request = this.buildRequest(worker, goal, context);

    return {
      success: true,
      executed: false,
      skipped: true,
      reason: "preview_only",
      request
    };
  }

  executeLocal(request, handler) {
    if (typeof handler !== "function") {
      return {
        success: false,
        executed: false,
        skipped: true,
        reason: "local_worker_handler_missing",
        request
      };
    }

    try {
      const output = handler(request);

      return {
        success: true,
        executed: true,
        skipped: false,
        reason: "local_worker_executed",
        worker: request.worker,
        output,
        request
      };
    } catch (error) {
      return {
        success: false,
        executed: true,
        skipped: false,
        reason: "local_worker_execution_failed",
        worker: request.worker,
        error: error.message,
        request
      };
    }
  }

  executeExternal(request) {
    if (request.executionMode !== EXECUTION_MODES.APPROVAL_GATED) {
      return {
        success: false,
        executed: false,
        skipped: true,
        reason: "external_execution_not_approved",
        request
      };
    }

    if (!request.founderApproved) {
      return {
        success: false,
        executed: false,
        skipped: true,
        reason: "founder_approval_required",
        request
      };
    }

    if (!request.externalExecutionEnabled) {
      return {
        success: false,
        executed: false,
        skipped: true,
        reason: "external_execution_disabled",
        request
      };
    }

    const commandDefinition = resolveWorkerCommand(
      request.worker,
      request
    );

    if (!commandDefinition) {
      return {
        success: false,
        executed: false,
        skipped: true,
        reason: "worker_command_not_configured",
        request
      };
    }

    if (
      !commandExists(
        commandDefinition.command,
        commandDefinition.cwd
      )
    ) {
      return {
        success: false,
        executed: false,
        skipped: true,
        reason: "worker_cli_not_found",
        command: commandDefinition.command,
        request
      };
    }

    const timeout = normalizeTimeout(
      request.context && request.context.timeoutMs
    );

    const execution = spawnSync(
      commandDefinition.command,
      commandDefinition.args,
      {
        cwd: commandDefinition.cwd,
        env: commandDefinition.env,
        encoding: "utf8",
        windowsHide: true,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        shell: false
      }
    );

    const result = sanitizeExecutionResult(execution);
    const success =
      result.exitCode === 0 &&
      !result.error;

    return {
      success,
      executed: true,
      skipped: false,
      reason: success
        ? "external_worker_executed"
        : "external_worker_execution_failed",
      worker: request.worker,
      command: commandDefinition.command,
      args: commandDefinition.args.map((arg) =>
        arg === request.prompt ? "[PROMPT]" : arg
      ),
      timeout,
      result,
      request
    };
  }

  execute(worker, goal, context = {}) {
    const request = this.buildRequest(worker, goal, context);

    if (request.worker === "local_brain_worker") {
      return this.executeLocal(
        request,
        context.localWorkerHandler
      );
    }

    if (request.executionMode === EXECUTION_MODES.PREVIEW_ONLY) {
      return {
        success: true,
        executed: false,
        skipped: true,
        reason: "preview_only",
        request
      };
    }

    return this.executeExternal(request);
  }
}

module.exports = ExternalWorkerAdapter;
module.exports.ExternalWorkerAdapter = ExternalWorkerAdapter;
module.exports.SUPPORTED_WORKERS = SUPPORTED_WORKERS;
module.exports.EXECUTION_MODE = EXECUTION_MODE;
module.exports.EXECUTION_MODES = EXECUTION_MODES;
module.exports.DEFAULT_WORKER_COMMANDS = DEFAULT_WORKER_COMMANDS;
module.exports.resolveExecutionMode = resolveExecutionMode;
module.exports.getFounderApprovalState = getFounderApprovalState;