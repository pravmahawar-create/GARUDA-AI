// GARUDA Tutoring Web-Scan CLI
// Usage: node scripts/garuda-tutoring-scan.js [usa|dubai|both]
// Runs the real web-research background job once (useful for local testing /
// manual kicks). Telegram command "tutoring leads usa/dubai" starts the same
// job non-blocking on the server.
require("dotenv").config();
const scout = require("../src/services/tutoringLeadScoutService");

async function main() {
  const location = String(process.argv[2] || "both").toLowerCase();
  const maxSites = Math.max(1, Number(process.env.TUTORING_MAX_SITES) || 20);
  const result = await scout.runTutoringScanOnce({ location, maxSites, notifyFounder: false });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });