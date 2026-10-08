/**
 * GARUDA SOVEREIGN DELTA SYNC ENGINE
 * Automatically packages only newly created/modified files since the base backup.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VAULT_DIR = 'E:\\GARUDA_BACKUP_VAULT';
const BASE_FILE = path.join(VAULT_DIR, 'garuda_workspace_files.tar.gz');

if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

const baseMtime = fs.existsSync(BASE_FILE) ? fs.statSync(BASE_FILE).mtimeMs : 0;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const deltaArchiveName = `DELTA_UPDATE_${timestamp}.tar.gz`;
const deltaArchivePath = path.join(VAULT_DIR, deltaArchiveName);
const latestDeltaPath = path.join(VAULT_DIR, 'LATEST_DELTA_UPDATE.tar.gz');

console.log(`[GARUDA-DELTA] Scanning for files modified after: ${new Date(baseMtime).toLocaleString()}`);

// Collect modified files
const trackedDirs = [
  { root: 'D:\\GARUDA-AI', prefix: 'GARUDA-AI' },
  { root: 'C:\\Users\\hp\\.gemini\\antigravity-cli', prefix: 'antigravity-cli' }
];

const fileListPath = path.join(VAULT_DIR, 'modified_files.txt');
let modifiedCount = 0;
let fileListStream = fs.createWriteStream(fileListPath, { flags: 'w' });

function scanDir(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (/node_modules|\.git|\.chrome-profile|\.cache|dist|build|\.next|bin|updater|crashes/.test(entry.name)) continue;
        scanDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.mtimeMs > baseMtime) {
            fileListStream.write(fullPath + '\n');
            modifiedCount++;
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}

for (const td of trackedDirs) {
  if (fs.existsSync(td.root)) {
    scanDir(td.root);
  }
}

fileListStream.end();

fileListStream.on('finish', () => {
  console.log(`[GARUDA-DELTA] Found ${modifiedCount} newly modified/created files.`);
  if (modifiedCount === 0) {
    console.log('[GARUDA-DELTA] Zero modifications detected. Everything is already safe in Base Vault!');
    return;
  }

  try {
    // Tar the list of files
    execSync(`tar.exe -czf "${deltaArchivePath}" -T "${fileListPath}"`, { stdio: 'inherit' });
    if (fs.existsSync(latestDeltaPath)) fs.unlinkSync(latestDeltaPath);
    fs.copyFileSync(deltaArchivePath, latestDeltaPath);
    console.log(`[GARUDA-DELTA] SUCCESS! Delta created at: ${deltaArchivePath}`);
    console.log(`[GARUDA-DELTA] Fast Link: ${latestDeltaPath}`);
  } catch (err) {
    console.error('[GARUDA-DELTA] Error archiving:', err.message);
  }
});
