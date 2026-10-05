const fs = require('fs');

const content = fs.readFileSync('public/apps/kist/index.html', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

const devanagariRegex = /[\u0900-\u097F]/;
const findings = [];

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (devanagariRegex.test(line)) {
    findings.push({ lineNum, line: line.trim() });
  }
});

console.log('Total Devanagari lines:', findings.length);
findings.forEach(f => {
  // Check if it's within the Hindi dictionary (around lines 940-1015)
  const isDict = f.lineNum >= 940 && f.lineNum <= 1015;
  console.log(`[${isDict ? 'DICT' : 'UI'}] L${f.lineNum}: ${f.line.substring(0, 100)}`);
});
