const fs = require('fs');
const path = require('path');

function findLargestFiles(dirPath, minMB = 5) {
  const largeFiles = [];

  function traverse(current) {
    try {
      const items = fs.readdirSync(current, { withFileTypes: true });
      for (const item of items) {
        if (item.name === '.git' || item.name === 'node_modules') continue;
        const full = path.join(current, item.name);
        if (item.isDirectory()) {
          traverse(full);
        } else if (item.isFile()) {
          try {
            const stats = fs.statSync(full);
            const sizeMB = stats.size / (1024 * 1024);
            if (sizeMB >= minMB) {
              largeFiles.push({
                file: full.replace('C:\\Users\\hp\\OneDrive\\', ''),
                sizeMB: sizeMB.toFixed(2),
                ext: path.extname(item.name)
              });
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  traverse(dirPath);
  return largeFiles.sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB));
}

console.log('--- Top Large Files (> 5MB) in GARUDA-AI (excluding node_modules) ---');
const large = findLargestFiles('C:\\Users\\hp\\OneDrive\\GARUDA\\GARUDA-AI', 5);
console.log(JSON.stringify(large.slice(0, 30), null, 2));

// Also find temp test screenshots in output folder
console.log('\n--- Screenshots in output/ folder ---');
const outputDir = 'C:\\Users\\hp\\OneDrive\\GARUDA\\GARUDA-AI\\output';
const outputFiles = fs.readdirSync(outputDir)
  .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
  .map(f => {
    const s = fs.statSync(path.join(outputDir, f));
    return { name: f, sizeKB: (s.size / 1024).toFixed(1) };
  });
console.log(`Found ${outputFiles.length} screenshots in output/ totaling ${(outputFiles.reduce((a,b)=>a+parseFloat(b.sizeKB), 0)/1024).toFixed(2)} MB`);
