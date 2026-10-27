const fs = require('fs');
const path = require('path');

const sessDir = 'C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 3\\Sessions';

function inspect() {
  if (!fs.existsSync(sessDir)) {
    console.log('Session dir does not exist');
    return;
  }
  const files = fs.readdirSync(sessDir);
  console.log('Session files in Profile 3:', files);

  files.forEach(f => {
    const full = path.join(sessDir, f);
    const stat = fs.statSync(full);
    console.log(f, '-> Size:', stat.size, 'bytes, Modified:', stat.mtime);
    if (stat.size > 0 && stat.size < 5000000) {
      try {
        const content = fs.readFileSync(full, 'latin1');
        const matches = content.match(/https?:\/\/[a-zA-Z0-9\.\_\-\/\?\=\&\%\#]+/g) || [];
        const filtered = Array.from(new Set(matches)).filter(u => 
          !u.includes('google.com/chrome') && 
          !u.includes('clients2.google') &&
          !u.includes('optimizationguide') &&
          !u.includes('gstatic.com')
        );
        console.log('Active URLs found in', f, ':', filtered.slice(0, 15));
      } catch (e) {
        console.log('Error reading', f, ':', e.message);
      }
    }
  });
}

inspect();
