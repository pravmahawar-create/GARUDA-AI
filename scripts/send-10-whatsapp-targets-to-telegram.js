/**
 * 🦅 Sends all 10 staged WhatsApp Clinic targets with 1-click links to Founder Praveen's Telegram
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const telegram = require("../src/services/telegramBotService");

const TARGETS_FILE = path.join(__dirname, "..", "data", "leads", "whatsapp_outreach_targets.json");

async function main() {
  if (!fs.existsSync(TARGETS_FILE)) {
    console.error("Targets file not found");
    return;
  }

  const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, "utf8"));

  const intro = 
    `🦅 *GARUDA SOVEREIGN REVENUE FLEET*\n` +
    `*10 Hot Dental Clinic WhatsApp Targets Active*\n\n` +
    `Founder Praveen ji, aapke aadesh par automated WhatsApp dispatcher run ho raha hai. Saath hi sath aapke phone ke liye saare 10 verified clinics ke 1-Click WhatsApp links neeche pesh hain:\n`;

  await telegram.sendMessage(intro);

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const raw = String(t.phone || "").replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${raw}?text=${encodeURIComponent(t.messageText)}`;

    const card = 
      `📍 *#${i + 1} ${t.practiceName}* (${t.city}, ${t.country})\n` +
      `📞 *Phone:* ${t.phone}\n` +
      `🌐 *Demo:* https://www.garudaos.in/chat?ref=${t.leadId}\n\n` +
      `👉 *Direct 1-Click WhatsApp:* [Open WhatsApp](${waUrl})`;

    await telegram.sendMessage(card);
    await new Promise(r => setTimeout(r, 600));
  }

  const outro = `✔ *Saare 10 targets Telegram par successfully transmit ho gaye hain!*\nAutomated cloud reply monitor active hai — kisi bhi reply par instant ping aayega.`;
  await telegram.sendMessage(outro);

  console.log("✔ Sent all 10 clinic cards to Telegram successfully!");
}

main().catch(console.error);
