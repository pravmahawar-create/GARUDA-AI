const { createBackup, restoreBackup, listBackups, getBackupContent, sha256 } = require("./fileBackupService");
const { computeLineDiff, applyDiff, applyPatchToFile, generatePatchReport } = require("./diffPatcher");
const { validateImports, extractModuleReferences } = require("./importValidator");
const { orchestrateModification, orchestrateRollback } = require("./modificationOrchestrator");
const { logModification, getLogEntries, getLogEntriesForFile, clearLog } = require("./modificationLogger");

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  getBackupContent,
  sha256,
  computeLineDiff,
  applyDiff,
  applyPatchToFile,
  generatePatchReport,
  validateImports,
  extractModuleReferences,
  orchestrateModification,
  orchestrateRollback,
  logModification,
  getLogEntries,
  getLogEntriesForFile,
  clearLog
};
