const path = require("path");
const fs = require("fs");
const { createBackup, sha256 } = require("./fileBackupService");
const { applyPatchToFile, computeLineDiff } = require("./diffPatcher");
const { validateImports } = require("./importValidator");
const { logModification } = require("./modificationLogger");

function orchestrateModification(filePath, newContent, options = {}) {
  const { founderApproved = false, skipImportValidation = false, reason = "unspecified" } = options;
  const absolutePath = path.resolve(filePath);

  if (!founderApproved) {
    const entry = logModification({ targetPath: filePath, action: "BLOCKED", reason: "Founder approval required", oldHash: null, newHash: null });
    return { success: false, stage: "approval", error: "Founder approval required before modification", entry };
  }

  if (!fs.existsSync(absolutePath)) {
    const entry = logModification({ targetPath: filePath, action: "BLOCKED", reason: "File not found", oldHash: null, newHash: null });
    return { success: false, stage: "validation", error: "File not found", entry };
  }

  const oldContent = fs.readFileSync(absolutePath, "utf8");
  const oldHash = sha256(oldContent);

  const backup = createBackup(filePath);
  if (!backup.success) {
    return { success: false, stage: "backup", error: backup.error };
  }

  const diff = computeLineDiff(oldContent, newContent);
  if (diff.hunks.length === 0) {
    logModification({ targetPath: filePath, action: "NO_CHANGE", reason: "Content identical", oldHash, newHash: oldHash, backupPath: backup.backupPath });
    return { success: true, stage: "complete", changed: false, diff, backup, message: "No changes needed" };
  }

  if (!skipImportValidation) {
    const importCheck = validateImports(filePath, newContent);
    if (!importCheck.valid) {
      logModification({ targetPath: filePath, action: "BLOCKED", reason: "Import validation failed", oldHash, newHash: null, backupPath: backup.backupPath, brokenImports: importCheck.broken });
      return { success: false, stage: "import_validation", error: "Import validation failed", brokenImports: importCheck.broken, backup };
    }
  }

  const patchResult = applyPatchToFile(absolutePath, newContent);
  if (!patchResult.success) {
    logModification({ targetPath: filePath, action: "FAILED", reason: patchResult.error, oldHash, newHash: null, backupPath: backup.backupPath });
    return { success: false, stage: "patch_apply", error: patchResult.error, backup };
  }

  const newHash = sha256(newContent);
  const entry = logModification({ targetPath: filePath, action: "MODIFIED", reason, oldHash, newHash, backupPath: backup.backupPath, diffSummary: diff.summary, changes: diff.totalChanges });

  return {
    success: true,
    stage: "complete",
    changed: true,
    diff,
    backup,
    oldHash,
    newHash,
    entry
  };
}

function orchestrateRollback(filePath, backupPath) {
  const { restoreBackup, getBackupContent } = require("./fileBackupService");
  const content = getBackupContent(backupPath);
  if (content === null) {
    return { success: false, error: "Backup content not found" };
  }
  const result = applyPatchToFile(filePath, content);
  if (result.success) {
    logModification({ targetPath: filePath, action: "ROLLBACK", reason: "Manual rollback", oldHash: null, newHash: sha256(content), backupPath });
  }
  return result;
}

module.exports = { orchestrateModification, orchestrateRollback };
