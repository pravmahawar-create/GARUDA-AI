/**
 * 🦅 GARUDA — Indore WhatsApp Auto Batch Runner (Cognizant)
 * Run on Cognizant laptop AFTER QR scan (session cached in data/whatsapp-session)
 * Usage: node scripts/run-indore-whatsapp-batch.js
 * Sends 5 Indore high-margin pitches via WhatsAppAutonomousDriver with 6-10s pacing + SHA log
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const WhatsAppAutonomousDriver = require("./whatsapp-autonomous-driver");

const DATA_DIR = path.join(__dirname, "..", "data");
const TARGETS_FILE = path.join(DATA_DIR, "indore-highmargin-targets.json");
const LOG_FILE = path.join(DATA_DIR, "indore-whatsapp-dispatch-log.json");

function buildMessage(t) {
  // Use rich pitch from indore_launcher logic if available, else fallback
  const scopingUrl = `https://www.garudaos.in/chat?ref=${t.id}`;
  return `*Namaste ${t.contactPerson}*,\nMain Praveen Mahawar bol raha hoon (Founder, GARUDA AI Operating System - Indore).\n\n*Problem:* ${t.painPoint}\n\n*GARUDA Solution for ${t.businessName}:*\n${t.solution}\n\n*Deal:* ${t.dealSize} (50% advance). Setup in 48 hours.\nLive demo: 👉 ${scopingUrl}\n\nKya aaj 5-minute ka live walkthrough karein?\n- Praveen Mahawar (Founder, GARUDA OS | praveen@garudaos.in)`;
}

async function main() {
  console.log("\n🦅 GARUDA Indore WhatsApp Auto Batch — Cognizant");
  console.log("Targets:", TARGETS_FILE);
  if (!fs.existsSync(TARGETS_FILE)) { console.error("Targets file missing"); process.exit(1); }
  const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, "utf8"));
  console.log(`Loaded ${targets.length} Indore targets: ${targets.map(t=>t.businessName).join(", ")}\n`);

  const driver = new WhatsAppAutonomousDriver();
  // Session already cached after QR scan in Cognizant — will auto-detect chat-list
  await driver.init(false);
  if (!driver.isReady) {
    console.warn("⚠️ Driver not ready — QR scan may still be needed. Waiting 10s...");
    await new Promise(r=>setTimeout(r,10000));
  }
  const results = await driver.dispatchBatch(targets, buildMessage);
  fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2), "utf8");
  console.log(`\n✔ Batch complete — log saved: ${LOG_FILE}`);
  // Keep browser open for reply monitoring
  console.log("Browser will stay open for reply monitoring. Close manually when done.");
}

if (require.main === module) { main().catch(e=>{ console.error(e); process.exit(1); }); }
module.exports = { buildMessage };
