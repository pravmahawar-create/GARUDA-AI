#!/usr/bin/env node
/**
 * 🦅 GARUDA SOVEREIGN ZOHO SAFE OUTREACH DISPATCHER
 * 
 * Safety Directives:
 * 1. ZERO ZOHO BLOCK GUARANTEE: Never burst emails. Enforces 4-7 min randomized human delay.
 * 2. DAILY BATCH GOVERNANCE: Strictly caps daily sends (default: 15/day) to keep sender reputation 100% clean.
 * 3. DYNAMIC CONTENT VARIATION: Rotates 3 high-converting subject lines and personalizes doctor/city/clinic.
 * 4. DRY-RUN SAFEGUARD: Defaults to dry-run preview unless --dispatch flag is explicitly provided.
 * 
 * Founder: Praveen Mahawar
 */

const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Load Environment
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const LEADS_FILE = path.join(__dirname, "..", "data", "leads", "global_dental_100_leads.json");
const LOG_FILE = path.join(__dirname, "..", "data", "leads", "outreach_dispatch_log.jsonl");

// SMTP Configuration
const SMTP_CONFIG = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: parseInt(process.env.GARUDA_EMAIL_PORT || "465", 10),
  secure: true,
  auth: {
    user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
    pass: process.env.GARUDA_EMAIL_PASS || ""
  }
};

const FROM_HEADER = `"Praveen Mahawar — GARUDA Dental AI" <${SMTP_CONFIG.auth.user}>`;

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate Personalized Dynamic Email
function generateEmail(lead, index) {
  const isUK = lead.country === "United Kingdom";
  const isCA = lead.country === "Canada";
  const currencySymbol = isUK ? "£" : "$";
  const regionalLoss = isUK ? "£1,200+" : "$1,500+";
  const regionalRev = isUK ? "£8,000 to £12,000/month" : "$10,000 to $15,000/month";
  const regionLabel = isUK ? "UK private dental practices" : isCA ? "Canadian dental practices" : "US dental practices";
  const voiceAccent = isUK ? "natural, polite British English voice" : "natural, polite American voice";

  const subjects = [
    `quick question about after-hours calls at ${lead.practiceName}`,
    `${lead.doctorName} - missed patient calls after 5pm?`,
    `24/7 dental receptionist demo for ${lead.practiceName}`
  ];
  const subject = subjects[index % subjects.length];

  const greeting = lead.doctorName.startsWith("Dr.") ? lead.doctorName : `Dr. ${lead.doctorName.replace(/^Dr\.\s*/i, "")}`;

  const body = `Hi ${greeting},

I noticed ${lead.practiceName} has an excellent reputation for quality patient care in ${lead.city}.

A quick operational question: what currently happens when an emergency patient calls your clinic with a severe toothache on Friday at 6:30 PM or over the weekend?

In most ${lead.city} practices, after-hours calls go to a standard answering machine, and the patient simply calls the next dentist on Google (${regionalLoss} revenue lost).

We built a 24/7 Sovereign AI Clinical Receptionist specifically for ${regionLabel}. It:
1. Answers in under 400 milliseconds in a ${voiceAccent}.
2. Triages acute emergencies (severe pain, chipped tooth, swelling) with clinical care guidance.
3. Handles booking, inquiries, and syncs directly into your practice calendar.

I set up an interactive 60-second web simulation where you can test calling the AI yourself:
👉 https://www.garudaos.in/apps/apex-dental-ai/

Would you be open to a 5-minute chat on how this preserves an estimated ${regionalRev} in after-hours patient revenue?

Best regards,

Praveen Mahawar
Chief AI Architect • GARUDA AI Operating System
Platform: https://www.garudaos.in
Email: praveen@garudaos.in`;

  return { subject, body };
}

// Main Dispatcher Logic
async function main() {
  const args = process.argv.slice(2);
  const isDispatch = args.includes("--dispatch");
  const limitArg = args.find(a => a.startsWith("--limit="));
  const dailyLimit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 15;

  console.log(`\n================================================================`);
  console.log(`🦅 GARUDA ZOHO SAFE OUTREACH DISPATCHER`);
  console.log(`Mode:       ${isDispatch ? "🔴 LIVE DISPATCH (Real Emails)" : "🟡 DRY-RUN PREVIEW (No Emails Sent)"}`);
  console.log(`Daily Cap:  ${dailyLimit} emails/day (Zoho Anti-Abuse Safe Guard)`);
  console.log(`Sender:     ${SMTP_CONFIG.auth.user}`);
  console.log(`================================================================\n`);

  if (!fs.existsSync(LEADS_FILE)) {
    console.error(`Error: Leads file not found at ${LEADS_FILE}`);
    process.exit(1);
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  console.log(`Loaded ${leads.length} curated dental practice targets.`);

  // Load already dispatched leads to support auto-resume & zero duplicates
  const dispatchedEmails = new Set();
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.status === "SUCCESS" && entry.email) {
          dispatchedEmails.add(entry.email.toLowerCase());
        }
      } catch (_) {}
    }
  }
  console.log(`Already dispatched previously: ${dispatchedEmails.size} clinics.`);

  // Filter out already sent leads
  const pendingLeads = leads.filter(l => !dispatchedEmails.has(l.email.toLowerCase()));
  console.log(`Pending leads remaining: ${pendingLeads.length}.\n`);

  // Target slice for today
  const targets = pendingLeads.slice(0, dailyLimit);

  let transporter = null;
  if (isDispatch) {
    if (!SMTP_CONFIG.auth.pass) {
      console.error(`❌ Error: GARUDA_EMAIL_PASS is missing in environment variables. Aborting dispatch.`);
      process.exit(1);
    }
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }

  for (let i = 0; i < targets.length; i++) {
    const lead = targets[i];
    const { subject, body } = generateEmail(lead, i);

    console.log(`----------------------------------------------------------------`);
    console.log(`[${i + 1}/${targets.length}] ${lead.practiceName} (${lead.city}, ${lead.state})`);
    console.log(`To:      ${lead.email}`);
    console.log(`Subject: ${subject}`);
    console.log(`----------------------------------------------------------------`);

    if (isDispatch) {
      try {
        console.log(`⏳ Dispatching to ${lead.email}...`);
        const info = await transporter.sendMail({
          from: FROM_HEADER,
          to: lead.email,
          subject: subject,
          text: body
        });
        console.log(`✅ DISPATCHED: MessageID: ${info.messageId}`);

        // Log result
        const logEntry = JSON.stringify({
          timestamp: new Date().toISOString(),
          leadId: lead.id,
          practiceName: lead.practiceName,
          email: lead.email,
          messageId: info.messageId,
          status: "SUCCESS"
        }) + "\n";
        fs.appendFileSync(LOG_FILE, logEntry, "utf8");

        // Enforce 4-7 min randomized human delay unless last email
        if (i < targets.length - 1) {
          const delaySec = Math.floor(Math.random() * (420 - 240 + 1)) + 240; // 240s to 420s (4 to 7 minutes)
          console.log(`🛡️ ZOHO ANTI-SPAM GUARD: Sleeping for ${Math.round(delaySec / 60)} minutes before next send...\n`);
          await sleep(delaySec * 1000);
        }
      } catch (err) {
        console.error(`❌ Send Failed for ${lead.email}: ${err.message}`);
      }
    } else {
      console.log(body);
      console.log(`[DRY-RUN] Email generated cleanly. Use '--dispatch --limit=15' to send.\n`);
    }
  }

  console.log(`\n================================================================`);
  console.log(`Batch complete. ${targets.length} targets processed.`);
  console.log(`================================================================\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
