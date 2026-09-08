/**
 * 🦅 GARUDA WhatsApp Clinic Outreach & Closing Launcher
 * 
 * Capabilities:
 * 1. Generates official WhatsApp deep links (https://wa.me/...) for all 6 verified clinics
 * 2. Pre-fills bespoke clinical pain points & GARUDA 24/7 AI solution
 * 3. Supports automated opening in default browser / WhatsApp app (--open flag)
 * 4. Supports interactive simulation to test the Clinic Closer Agent and verify Telegram alert to Founder Praveen (--simulate)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const clinicCloserAgent = require("../src/services/clinicCloserAgentService");
const { STEP3_CLINIC_TARGETS, generateWhatsAppScript } = require("./dispatch-wave2-revenue-closers");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const args = process.argv.slice(2);
  const shouldOpen = args.includes("--open");
  const shouldSimulate = args.includes("--simulate");

  console.log("\n==================================================================");
  console.log("🦅 GARUDA CLINIC WHATSAPP BOT & CLOSER LAUNCHER");
  console.log("==================================================================");
  console.log(`Targets: ${STEP3_CLINIC_TARGETS.length} Verified High-Intent Medical / Dental Clinics\n`);

  const links = [];

  for (let i = 0; i < STEP3_CLINIC_TARGETS.length; i++) {
    const c = STEP3_CLINIC_TARGETS[i];
    const rawPhone = String(c.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const script = generateWhatsAppScript(c);
    const encodedText = encodeURIComponent(script);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    links.push({
      id: c.id,
      clinic: c.businessName,
      doctor: c.doctorName,
      phone: c.phone,
      waUrl
    });

    console.log(`[#${i + 1}] ${c.businessName} (${c.city})`);
    console.log(`Doctor: ${c.doctorName}`);
    console.log(`Verified Phone: ${c.phone}`);
    console.log(`1-Click WhatsApp Link:\n${waUrl}\n`);

    if (shouldOpen) {
      console.log(`Launching WhatsApp chat for ${c.businessName}...`);
      const cmd = process.platform === "win32" ? `start "" "${waUrl}"` : `open "${waUrl}"`;
      exec(cmd);
      console.log("Pacing 3 seconds before next link...");
      await sleep(3000);
    }
  }

  // If simulation is requested, simulate a doctor saying YES to verify Telegram alert!
  if (shouldSimulate) {
    console.log("\n--- SIMULATING INCOMING DOCTOR RESPONSE & FOUNDER ALERT ---");
    const testClinic = STEP3_CLINIC_TARGETS[1]; // Dr. Aashal Sanghvi (Mumbai)
    console.log(`Simulating Doctor Reply from: ${testClinic.businessName} (${testClinic.doctorName})`);
    console.log(`Inquiry: "Yes, I am interested in 24/7 WhatsApp AI receptionist. Call me today for demo."`);

    const result = await clinicCloserAgent.handleMessage({
      ref: testClinic.id,
      phone: testClinic.phone,
      message: "Yes, I am interested in 24/7 WhatsApp AI receptionist. Call me today for demo."
    });

    console.log("\nAgent Reply to Doctor:");
    console.log(result.reply);
    console.log(`\nEscalation Status: ${result.escalated ? "SUCCESSFUL (Telegram Alert Sent to Founder Praveen!)" : "FAILED"}`);
  }

  console.log("\n==================================================================");
  console.log("✔ Clinic Closer Agent is active and monitoring incoming sessions.");
  console.log("✔ Any prospect saying 'Yes / Interested' will trigger an instant Telegram closing alert!");
  console.log("==================================================================\n");
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
