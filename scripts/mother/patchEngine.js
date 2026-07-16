const fs = require("fs");
const path = require("path");
const { evaluateConstitutionGate } = require("./constitution");

function ensureBackupDir() {
  const dir = "scripts/mother/backups";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

function createBackup(filePath, original) {
  const dir = ensureBackupDir();
  const safeName = filePath.replace(/[\\/]/g, "__");
  const backupPath = path.join(dir, `${Date.now()}__${safeName}.bak`);

  fs.writeFileSync(backupPath, original);
  return backupPath;
}

function patchFile({ filePath, find, replace, requireApproval = true }) {
  const constitutionGate = evaluateConstitutionGate("patch");
  if (!constitutionGate.allowed) {
    return {
      success: false,
      filePath,
      status: "BLOCKED_BY_CONSTITUTION",
      reason: "constitution_validation_failed"
    };
  }

  if (requireApproval) {
    return {
      success: false,
      filePath,
      reason: "Founder approval required before patch."
    };
  }

  if (!fs.existsSync(filePath)) {
    return { success: false, filePath, reason: "File not found" };
  }

  const original = fs.readFileSync(filePath, "utf8");

  if (!original.includes(find)) {
    return { success: false, filePath, reason: "Find block not found" };
  }

  const backupPath = createBackup(filePath, original);

  try {
    const updated = original.replace(find, replace);
    fs.writeFileSync(filePath, updated);

    return {
      success: true,
      filePath,
      backupPath,
      changed: original !== updated
    };
  } catch (error) {
    fs.writeFileSync(filePath, original);

    return {
      success: false,
      filePath,
      backupPath,
      reason: error.message,
      rolledBack: true
    };
  }
}

module.exports = { patchFile };
