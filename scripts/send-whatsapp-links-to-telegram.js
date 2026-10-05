/**
 * 🦅 GARUDA Telegram Dispatcher for WhatsApp Outreach Links
 * Sends the 6 clinic 1-click WhatsApp outreach links directly to Founder Praveen's Telegram.
 */

require("dotenv").config();
const telegram = require("../src/services/telegramBotService");
const { STEP3_CLINIC_TARGETS, generateWhatsAppScript } = require("./dispatch-wave2-revenue-closers");

async function run() {
  console.log("🦅 Dispatching 6 Clinic WhatsApp Outreach Links to Founder Praveen's Telegram...");

  const intro = `🦅 *GARUDA SOVEREIGN REVENUE ENGINE*\n*1-Click WhatsApp Clinic Outreach Links*\n\nLaptop par kisi aur ka WhatsApp logged in hai, isliye aap apne phone se in 6 verified clinics ko seedha WhatsApp bhej sakte hain.\n\nNeeche diye har link par tap kijiye — aapke phone ka WhatsApp pre-filled pitch ke saath open ho jayega. Bas *SEND* tap karna hai:`;

  await telegram.sendMessage(intro);

  for (let i = 0; i < STEP3_CLINIC_TARGETS.length; i++) {
    const c = STEP3_CLINIC_TARGETS[i];
    const rawPhone = String(c.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const script = generateWhatsAppScript(c);
    const encodedText = encodeURIComponent(script);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    const clinicCard = `📍 *#${i + 1} ${c.businessName}* (${c.city})\n👨‍⚕️ *Doctor:* ${c.doctorName}\n📞 *Phone:* +91 ${c.phone}\n💰 *Deal Size:* ${c.dealSize}\n\n👉 *Tap to Send WhatsApp:*\n${waUrl}`;

    await telegram.sendMessage(clinicCard);
    // slight delay for message ordering
    await new Promise((r) => setTimeout(r, 600));
  }

  const outro = `✔ *Saare 6 links ready hain!*\nJab bhi koi doctor "Yes / Interested" bolegi ya call maangegi, GARUDA Closer Agent seedha aapke phone par notification alert bhej dega.`;
  await telegram.sendMessage(outro);

  console.log("✔ All 6 links dispatched to Founder Telegram successfully!");
}

run().catch(console.error);
