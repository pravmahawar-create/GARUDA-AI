/**
 * 🦅 GARUDA SOVEREIGN REVENUE COCKPIT: LOCAL ACQUISITION DISPATCHER
 * Compiles all verified high-leakage leads, creates 1-click dispatch links,
 * and sends an executive summary to Founder Praveen's Telegram.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const telegram = require("../../src/services/telegramBotService");
const QUEUE_FILE = path.join(__dirname, "..", "..", "data", "outreach_dispatch_queue.json");

async function dispatchCockpitSummary() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.error("Queue file not found. Run multi-channel-dispatcher.js first.");
    return;
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  console.log(`🦅 Dispatching Sovereign Acquisition Briefing for ${queue.length} targets...`);

  const headerMsg = 
    `🦅 *GARUDA LOCAL RADAR: LIVE ACQUISITION COCKPIT*\n\n` +
    `Founder Praveen ji, humare AI Radar ne Indore & Bhopal ke *${queue.length} high-ticket businesses* ko scan aur qualify kar liya hai.\n\n` +
    `In sabke Google Maps par ⭐ 4.5+ rating hai lekin inki *website missing/broken* hai. Humne inke liye *Live Interactive Demos (with 24/7 AI Concierge)* generate kar diye hain.\n\n` +
    `Neeche top hot targets ki list aur 1-click preview/outreach links hain:`;

  await telegram.sendMessage(headerMsg);
  await new Promise((r) => setTimeout(r, 800));

  for (let i = 0; i < Math.min(queue.length, 6); i++) {
    const q = queue[i];
    const card = 
      `📍 *#${i + 1} ${q.businessName}* (${q.city})\n` +
      `🏷 *Niche:* ${q.niche}\n` +
      `📞 *Phone:* ${q.phone || "N/A"}\n` +
      `⚠️ *Defect:* \`${q.defectType}\`\n` +
      `🌐 *Live AI Demo:* ${q.pitches.demoUrl}\n` +
      `👉 *1-Tap WhatsApp Pitch:*\n${q.pitches.waLink}`;

    await telegram.sendMessage(card);
    await new Promise((r) => setTimeout(r, 600));
  }

  const footerMsg = 
    `✔ *Saare Demos & Pitches Ready Hain!*\n` +
    `Official Handle: *@garudaos.ai* (Instagram Session Active 🟢)\n` +
    `Monitoring Daemon: *Active*\n\n` +
    `Jab bhi kisi client ka reply ya inquiry aayegi, GARUDA instant push notification aapke Telegram par bhej dega!`;

  await telegram.sendMessage(footerMsg);
  console.log("✔ Briefing successfully dispatched to Founder Telegram!");
}

if (require.main === module) {
  dispatchCockpitSummary().catch(console.error);
}

module.exports = { dispatchCockpitSummary };
