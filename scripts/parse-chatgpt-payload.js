const fs = require('fs');

const payload3 = fs.readFileSync('output/chatgpt_payload_3.txt', 'utf8');
const payload8 = fs.readFileSync('output/chatgpt_payload_8.txt', 'utf8');

console.log('Payload 3 snippet:', payload3.substring(0, 300));
console.log('Payload 8 snippet:', payload8.substring(0, 300));

// Let's search for JSON data in payload3 or payload8
[payload3, payload8].forEach((p, pIdx) => {
  // Look for text parts or messages
  const matches = p.match(/"parts":\s*\[(.*?)\]/g);
  if (matches) {
    console.log(`Payload ${pIdx} has ${matches.length} parts matches!`);
  }
  
  // Look for author role
  const authorMatches = p.match(/"role":\s*"([^"]+)"/g);
  if (authorMatches) {
    console.log(`Payload ${pIdx} has roles:`, authorMatches);
  }
});
