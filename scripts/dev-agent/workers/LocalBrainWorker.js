const fs = require("fs");
const path = require("path");
const SafeCommandRunner = require("../core/SafeCommandRunner");

function walkDirectory(rootDir, depth = 2, currentDepth = 0, entries = []) {
  if (!fs.existsSync(rootDir) || currentDepth > depth) {
    return entries;
  }

  const dirents = fs.readdirSync(rootDir, { withFileTypes: true });
  const skippedNames = new Set([".git", "node_modules", "dist", "coverage", "uploads", "reports", ".DS_Store"]);

  dirents.forEach((dirent) => {
    if (skippedNames.has(dirent.name)) {
      return;
    }

    const fullPath = path.join(rootDir, dirent.name);
    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");

    entries.push({
      name: dirent.name,
      path: relativePath,
      type: dirent.isDirectory() ? "directory" : "file",
      depth: currentDepth
    });

    if (dirent.isDirectory()) {
      walkDirectory(fullPath, depth, currentDepth + 1, entries);
    }
  });

  return entries;
}

class LocalBrainWorker {
  constructor({ role = "general", rootDir = process.cwd(), commandRunner = null } = {}) {
    this.role = role;
    this.rootDir = rootDir;
    this.commandRunner = commandRunner || new SafeCommandRunner({ rootDir });
  }

  readProjectStructure(depth = 2) {
    return walkDirectory(this.rootDir, depth).slice(0, 400);
  }

  scanFiles(patterns = []) {
    const normalizedPatterns = Array.isArray(patterns) ? patterns : [patterns];
    const structure = this.readProjectStructure(3);

    return structure.filter((entry) => {
      if (entry.type !== "file") {
        return false;
      }

      if (normalizedPatterns.length === 0) {
        return true;
      }

      return normalizedPatterns.some((pattern) => entry.path.includes(pattern));
    });
  }

  generateTaskMetadata(task = {}) {
    return {
      role: this.role,
      taskId: task.id || `${this.role}-${Date.now()}`,
      title: task.title || task.name || "Untitled Task",
      workerType: task.workerType || this.role,
      readOnly: true,
      generatedAt: new Date().toISOString()
    };
  }

  runSyntaxChecks(files = []) {
    const normalizedFiles = Array.isArray(files) ? files : [files];
    return normalizedFiles.map((filePath) => {
      try { return this.commandRunner.runSyntaxCheck(filePath); }
      catch (error) { return { targetFile: filePath, status: "FAILED", error: { code: "TARGET_REJECTED", message: error.message }, shellUsed: false }; }
    });
  }

  runExistingTests(files = []) {
    const normalizedFiles = Array.isArray(files) ? files : [files];
    if (!normalizedFiles.filter(Boolean).length) {
      return [{ status: "FAILED", error: { code: "TEST_TARGET_REQUIRED", message: "Explicit *.test.js targets are required" }, shellUsed: false }];
    }
    return normalizedFiles.map((filePath) => {
      try { return this.commandRunner.runNodeTest(filePath); }
      catch (error) { return { targetFile: filePath, status: "FAILED", error: { code: "TARGET_REJECTED", message: error.message }, shellUsed: false }; }
    });
  }

  prepareReports(payload = {}) {
    return {
      role: this.role,
      summary: payload.summary || "Read-only report prepared.",
      generatedAt: new Date().toISOString(),
      readOnly: true
    };
  }

  propose(task = {}, context = {}) {
    const metadata = this.generateTaskMetadata(task);

    return {
      ...metadata,
      task,
      context,
      analysis: {
        structureSample: this.readProjectStructure(1).slice(0, 20),
        files: this.scanFiles(task.files || []),
        note: "Deterministic local proposal generated without external AI."
      },
      proposalStatus: "READY_FOR_REVIEW"
    };
  }

  reviewProposal(proposal = {}) {
    const task = proposal.task || {};
    const allowed = Array.isArray(task.allowedActions) ? task.allowedActions : [];
    const hasWriteAction = allowed.some((action) => ["commit", "merge", "deploy", "paid_api", "push", "write_source", "file_write"].includes(action));

    return {
      approved: !hasWriteAction,
      reviewer: this.role,
      reviewedAt: new Date().toISOString(),
      reason: hasWriteAction ? "proposal_contains_write_actions" : "read_only_proposal_approved"
    };
  }
}

module.exports = LocalBrainWorker;
module.exports.LocalBrainWorker = LocalBrainWorker;
