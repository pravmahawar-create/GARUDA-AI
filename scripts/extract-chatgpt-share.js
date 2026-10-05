const fs = require('fs');
const path = require('path');

const contentPath = 'C:/Users/hp/.gemini/antigravity-cli/brain/0e60c4a0-c3bb-4b58-ac7b-09a426acdc64/.system_generated/steps/964/content.md';
const html = fs.readFileSync(contentPath, 'utf8');

console.log('HTML total length:', html.length);

// 1. Search for __NEXT_DATA__
const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
if (nextDataMatch) {
  console.log('Found __NEXT_DATA__!');
  fs.writeFileSync('output/chatgpt_conversation_raw.json', nextDataMatch[1]);
} else {
  console.log('Searching for other conversation JSON payloads...');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  let found = 0;
  scripts.forEach((s, idx) => {
    if (s.includes('linear_conversation') || s.includes('serverResponse') || s.includes('mapping') || s.includes('Google जानकारी की समीक्षा')) {
      console.log(`Script #${idx} matched keywords! Length: ${s.length}`);
      fs.writeFileSync(`output/chatgpt_payload_${idx}.txt`, s);
      found++;
    }
  });
  console.log('Total matched scripts:', found);
}
