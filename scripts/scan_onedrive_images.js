const fs = require('fs');
const path = require('path');

function getDirSummary(dirPath) {
  let imageCount = 0;
  let imageBytes = 0;
  let videoBytes = 0;
  let totalBytes = 0;
  let fileCount = 0;

  function traverse(current) {
    try {
      const items = fs.readdirSync(current, { withFileTypes: true });
      for (const item of items) {
        if (item.name === '.git') continue;
        const full = path.join(current, item.name);
        if (item.isDirectory()) {
          traverse(full);
        } else if (item.isFile()) {
          try {
            const stats = fs.statSync(full);
            totalBytes += stats.size;
            fileCount++;
            const ext = path.extname(item.name).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.svg'].includes(ext)) {
              imageCount++;
              imageBytes += stats.size;
            } else if (['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wav', '.mp3'].includes(ext)) {
              videoBytes += stats.size;
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  traverse(dirPath);
  return {
    dir: path.basename(dirPath),
    totalGB: (totalBytes / (1024 * 1024 * 1024)).toFixed(2),
    imageMB: (imageBytes / (1024 * 1024)).toFixed(2),
    imageCount,
    videoMB: (videoBytes / (1024 * 1024)).toFixed(2),
    totalFiles: fileCount
  };
}

const oneDriveRoot = 'C:\\Users\\hp\\OneDrive';
const subdirs = fs.readdirSync(oneDriveRoot, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => path.join(oneDriveRoot, d.name));

console.log('Analyzing OneDrive storage breakdown...');
const summaries = subdirs.map(getDirSummary);
console.log(JSON.stringify(summaries, null, 2));

// Specifically check GARUDA subfolders
const garudaDir = 'C:\\Users\\hp\\OneDrive\\GARUDA';
if (fs.existsSync(garudaDir)) {
  const garudaSubdirs = fs.readdirSync(garudaDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(garudaDir, d.name));
  console.log('\nGARUDA Subfolder Breakdown:');
  console.log(JSON.stringify(garudaSubdirs.map(getDirSummary), null, 2));
}
