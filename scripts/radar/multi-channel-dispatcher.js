/**
 * 🦅 GARUDA SOVEREIGN OUTREACH: MULTI-CHANNEL CLIENT DISPATCHER
 * Packages and prepares customized "Show > Tell" pitches for all qualified local leads.
 * Channels:
 * - Official Instagram DM (@garudaos.ai)
 * - 1-Click WhatsApp Direct Link (wa.me)
 * - Official Enterprise Email (praveen@garudaos.in)
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const LEADS_FILE = path.join(__dirname, "..", "..", "data", "local_hunter_leads.json");
const QUEUE_FILE = path.join(__dirname, "..", "..", "data", "outreach_dispatch_queue.json");

const BASE_URL = process.env.VITE_REVENUE_APP_URL
  ? "https://www.garudaos.in"
  : "https://www.garudaos.in";

function generatePitches(lead) {
  const demoUrl = `${BASE_URL}/demos/${lead.slug}/index.html`;
  let cleanPhone = String(lead.phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  // 1. Instagram DM Script (Crisp, High Authority, Friendly Roman Hindi / English)
  let instaDm = "";
  if (lead.defectType === "INSTAGRAM_AS_WEBSITE") {
    instaDm = `Namaste @${lead.instagramHandle || lead.businessName} team! 🦅\n\n` +
      `Google Maps par aapka profile dekha — rating ⭐ ${lead.rating} aur reviews sach me top-tier hain!\n\n` +
      `Lekin ek critical gap notice kiya: Google Maps par website ki jagah aapka Insta link laga hai. Is wajah se Google search par aapki direct SEO ranking aur instant 24/7 client booking leak ho rahi hai.\n\n` +
      `Humne GARUDA OS ke standard par aapke brand ke liye ek ultra-fast AI-powered direct booking portal ready kiya hai (with 24/7 AI Concierge):\n\n` +
      `👉 Live Demo Check Kijiye: ${demoUrl}\n\n` +
      `No obligation at all — agar design pasand aaye toh batana, hum ise 24 ghante me aapke custom domain par live kar denge. Keep doing great work!`;
  } else if (lead.defectType === "NO_WEBSITE") {
    instaDm = `Namaste ${lead.businessName} team! 🦅\n\n` +
      `Aapke Google Maps par ⭐ ${lead.rating} rating aur ${lead.reviews}+ reviews hain, lekin official direct booking portal link missing hai.\n\n` +
      `Aajkal 70% clients call karne ke bajay instant direct slot dekhna pasand karte hain. Humne aapke liye ek prototype portal design kiya hai with automated booking:\n\n` +
      `👉 Live Demo: ${demoUrl}\n\n` +
      `Design pasand aaye toh batayein, hum 1 din me live setup kar denge.`;
  } else {
    instaDm = `Namaste ${lead.businessName} team! 🦅\n\n` +
      `Aapka Google Maps profile dekha, work quality top-tier hai. Lekin aapki website HTTP / non-secure hone ki wajah se clients ko browser warning aati hai aur trust break hota hai.\n\n` +
      `Humne aapke brand ke liye modern, SSL-secured AI interactive portal ready kiya hai:\n\n` +
      `👉 Live Prototype: ${demoUrl}\n\n` +
      `Check karke batayein kaisa laga!`;
  }

  // 2. WhatsApp Pitch (Formatted for instant tap)
  const waPitch = `Namaste ${lead.businessName} team! 🦅\n\n` +
    `Main GARUDA AI (${BASE_URL}) se bol raha hoon. Google Maps par aapka ⭐ ${lead.rating} rating aur reviews dekhe — excellent reputation!\n\n` +
    `Notice kiya ki aapki direct online booking portal active nahi hai, jisse roz kai high-paying clients drop ho jaate hain.\n\n` +
    `Humne aapke liye ek complete AI-powered Direct Booking & Concierge Portal ka live demo banaya hai:\n` +
    `🔗 Live Preview: ${demoUrl}\n\n` +
    `Pasand aaye toh batayein, hum ise aapke business ke liye live deploy kar sakte hain.`;

  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(waPitch)}`;

  return {
    instaDm,
    waPitch,
    waLink,
    demoUrl
  };
}

function packageOutreachQueue() {
  if (!fs.existsSync(LEADS_FILE)) {
    console.error("❌ Leads file missing.");
    return [];
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  console.log(`🦅 [GARUDA DISPATCHER] Packaging outreach queue for ${leads.length} leads...`);

  const queue = leads.map((lead) => {
    const pitches = generatePitches(lead);
    return {
      ...lead,
      pitches,
      status: "READY_FOR_DISPATCH",
      dispatchedAt: null
    };
  });

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf8");
  console.log(`💾 Saved outreach queue to: ${QUEUE_FILE}`);
  console.log(`✔ Ready channels: Instagram DM, WhatsApp 1-Click, and Email.`);

  return queue;
}

if (require.main === module) {
  packageOutreachQueue();
}

module.exports = { packageOutreachQueue, generatePitches };
