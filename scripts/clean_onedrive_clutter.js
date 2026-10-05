const fs = require('fs');
const path = require('path');

console.log('=== STARTING SAFE ONEDRIVE STORAGE CLEANUP ===\n');

let totalDeletedFiles = 0;
let totalBytesFreed = 0;
const deletedCategories = {
  archiveUnusedMedia: { count: 0, bytes: 0 },
  outputRawDuplicates: { count: 0, bytes: 0 },
  outputTempScreenshots: { count: 0, bytes: 0 },
  outputShortsTempFiles: { count: 0, bytes: 0 }
};

function safeDeleteFile(filePath, category) {
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        totalDeletedFiles++;
        totalBytesFreed += stat.size;
        deletedCategories[category].count++;
        deletedCategories[category].bytes += stat.size;
      }
    }
  } catch (err) {
    console.error(`Failed to delete ${filePath}: ${err.message}`);
  }
}

function safeDeleteDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to remove dir ${dirPath}: ${err.message}`);
  }
}

// 1. CLEAN data/archive-mp4-unused/
const archiveDir = path.resolve(__dirname, '../data/archive-mp4-unused');
if (fs.existsSync(archiveDir)) {
  const files = fs.readdirSync(archiveDir);
  console.log(`Cleaning data/archive-mp4-unused (${files.length} files)...`);
  for (const f of files) {
    safeDeleteFile(path.join(archiveDir, f), 'archiveUnusedMedia');
  }
}

// 2. CLEAN output/raw/ duplicate & intermediate test clips
const outputRawDir = path.resolve(__dirname, '../output/raw');
if (fs.existsSync(outputRawDir)) {
  const rawFiles = fs.readdirSync(outputRawDir);
  console.log(`Cleaning output/raw intermediate files (${rawFiles.length} files)...`);
  for (const f of rawFiles) {
    // Keep master_source if needed, or clean all test raw files
    if (f !== 'master_source.mp4') {
      safeDeleteFile(path.join(outputRawDir, f), 'outputRawDuplicates');
    }
  }
}

// 3. CLEAN output/ temporary test screenshots (preserving only key verified proofs)
const outputDir = path.resolve(__dirname, '../output');
const keepProofs = new Set([
  'aarna_car_world_unwired_proof.png',
  'live_fixed_talk_to_architect_proof.png',
  'live_login_after_google_click.png',
  'live_production_enterprise_proof.png',
  'profile_headline_industry_live_proof.png'
]);

if (fs.existsSync(outputDir)) {
  const outputFiles = fs.readdirSync(outputDir);
  console.log(`Scanning output/ root for temporary screenshots (${outputFiles.length} files)...`);
  for (const f of outputFiles) {
    const full = path.join(outputDir, f);
    if (fs.statSync(full).isFile() && !keepProofs.has(f)) {
      safeDeleteFile(full, 'outputTempScreenshots');
    }
  }
}

// 4. CLEAN output/shorts/ intermediate frame captures & temp audio folders
const shortsDir = path.resolve(__dirname, '../output/shorts');
if (fs.existsSync(shortsDir)) {
  const shortsFiles = fs.readdirSync(shortsDir);
  for (const item of shortsFiles) {
    const full = path.join(shortsDir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item.startsWith('temp_20s_') || item === 'test_swara') {
        // Delete all files in temp folders
        const subfiles = fs.readdirSync(full);
        for (const sf of subfiles) {
          safeDeleteFile(path.join(full, sf), 'outputShortsTempFiles');
        }
        safeDeleteDir(full);
      }
    } else if (fs.statSync(full).isFile()) {
      // Intermediate test JPGs and temporary test mp4s
      if (
        item.startsWith('test_20s_') ||
        item.startsWith('snap_') ||
        item.startsWith('final_rasta2_snap') ||
        item.startsWith('rasta2_snap') ||
        item === 'arcade_snap.jpg' ||
        item === 'arcade_test_clip.mp4' ||
        item === 'GARUDA_20S_OPTION_A_TEST.mp4'
      ) {
        safeDeleteFile(full, 'outputShortsTempFiles');
      }
    }
  }
}

console.log('\n=== CLEANUP COMPLETED SUCCESSFULLY ===');
console.log(`Total Files Deleted: ${totalDeletedFiles}`);
console.log(`Total Storage Freed: ${(totalBytesFreed / (1024 * 1024)).toFixed(2)} MB (${(totalBytesFreed / (1024 * 1024 * 1024)).toFixed(3)} GB)`);
console.log('\nCategory Breakdown:');
console.log(`- Archive Unused Videos (data/archive-mp4-unused): ${deletedCategories.archiveUnusedMedia.count} files, ${(deletedCategories.archiveUnusedMedia.bytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`- Raw Duplicate Video Tests (output/raw): ${deletedCategories.outputRawDuplicates.count} files, ${(deletedCategories.outputRawDuplicates.bytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`- Temporary Test Screenshots (output/*.png): ${deletedCategories.outputTempScreenshots.count} files, ${(deletedCategories.outputTempScreenshots.bytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`- Shorts Temp Frames & Audio Snippets (output/shorts): ${deletedCategories.outputShortsTempFiles.count} files, ${(deletedCategories.outputShortsTempFiles.bytes / (1024 * 1024)).toFixed(2)} MB`);
