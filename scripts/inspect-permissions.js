const fs = require('fs');
const buf = fs.readFileSync('C:/Users/hp/AppData/Local/agy/bin/agy.exe');
const str = buf.toString('latin1');

function findContext(keyword) {
  let idx = 0;
  console.log('=== Matches for:', keyword);
  while ((idx = str.indexOf(keyword, idx + 1)) !== -1) {
    console.log(str.substring(Math.max(0, idx - 50), Math.min(str.length, idx + 150)));
    console.log('---');
    if (idx > 50000000) break; // just sample
  }
}

findContext('/permissions');
findContext('/mode');
findContext('auto-approve');
findContext('permission_preset');
