const fs = require("fs");
const path = require("path");

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
  constructor({ role = "general", rootDir = process.cwd() } = {}) {
    this.role = role;
    this.rootDir = rootDir;
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
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      const exists = fs.existsSync(absolutePath);

      return {
        filePath,
        exists,
        status: exists ? "NOT_RUN" : "MISSING",
        reason: exists ? "syntax_check_available" : "file_not_found"
      };
    });
  }

  runExistingTests(command = "npm test") {
    return {
      command,
      status: "NOT_EXECUTED",
      reason: "read_only_analysis_only"
    };
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
    const hasBlockedActions = Array.isArray(task.blockedActions) && task.blockedActions.some((action) => ["commit", "merge", "deploy", "paid_api", "push"].includes(action));

    return {
      approved: !hasBlockedActions,
      reviewer: this.role,
      reviewedAt: new Date().toISOString(),
      reason: hasBlockedActions ? "proposal_contains_blocked_actions" : "read_only_proposal_approved"
    };
  }
}

module.exports = LocalBrainWorker;
module.exports.LocalBrainWorker = LocalBrainWorker;