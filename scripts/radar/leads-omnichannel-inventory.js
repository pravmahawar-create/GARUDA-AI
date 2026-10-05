const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '..', '..', 'data', 'leads', 'outreach_dispatch_log.jsonl');
const contactedEmails = new Set();
if (fs.existsSync(logPath)) {
  fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).forEach(l => {
    try {
      const p = JSON.parse(l);
      if (p.email) contactedEmails.add(p.email.toLowerCase().trim());
      if (p.recipientEmail) contactedEmails.add(p.recipientEmail.toLowerCase().trim());
    } catch {}
  });
}

console.log('=== GARUDA OMNICHANNEL OUTREACH AUDIT ===');
console.log('Total verified already contacted emails:', contactedEmails.size);

const files = [
  'data/leads/international_dental_50_leads.json',
  'data/leads/global_dental_100_leads.json',
  'data/leads/us_dental_50_leads.json',
  'data/agency-whitelabel-targets.json',
  'data/leads/cooked_tech_leads.json'
];

let totalUncontacted = 0;
let totalWithPhone = 0;

for (const rel of files) {
  const full = path.join(__dirname, '..', '..', rel);
  if (fs.existsSync(full)) {
    try {
      const data = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (Array.isArray(data)) {
        const uncontacted = data.filter(d => d.email && !contactedEmails.has(d.email.toLowerCase().trim()));
        const withPhone = data.filter(d => d.phone || d.whatsapp);
        console.log(`[${rel}] Total: ${data.length} | Uncontacted: ${uncontacted.length} | Has Phone: ${withPhone.length}`);
        totalUncontacted += uncontacted.length;
        totalWithPhone += withPhone.length;
      }
    } catch (e) {
      console.log(`[${rel}] Error: ${e.message}`);
    }
  } else {
    console.log(`[${rel}] File does not exist.`);
  }
}

console.log(`\nTOTAL PENDING UNCONTACTED TARGETS: ${totalUncontacted}`);
console.log(`TOTAL TARGETS WITH PHONE/WHATSAPP: ${totalWithPhone}`);
