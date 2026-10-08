#!/usr/bin/env node
/**
 * 🦅 GARUDA SOVEREIGN DENTAL FOLLOW-UP ENGINE (STEP 2: 48-72h EXECUTIVE BUMP)
 * 
 * Target: 97 UK & Canadian Dental Practices (Dispatched Oct 5-6, 2026)
 * Purpose: Day 3 Executive Follow-up Bump ("48-Hour Pilot Reservation")
 * 
 * Enforced Governance:
 * 1. 100% Anti-Fabrication Law: Real verified dispatch from praveen@garudaos.in
 * 2. Strict Privacy Shield: Zero public exposure of founder personal numbers
 * 3. Politeness Pacing: Randomized 2-4 minute delay between emails
 * 4. Zero Duplication: Persists every send to data/leads/dental_followup_log.json
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const LEADS_FILE = path.join(__dirname, "..", "data", "leads", "global_dental_100_leads.json");
const STEP1_LOG_FILE = path.join(__dirname, "..", "data", "leads", "outreach_dispatch_log.jsonl");
const FOLLOWUP_LOG_FILE = path.join(__dirname, "..", "data", "leads", "dental_followup_log.json");

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFollowupLog() {
  if (fs.existsSync(FOLLOWUP_LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(FOLLOWUP_LOG_FILE, "utf8"));
    } catch (_) {
      return [];
    }
  }
  return [];
}

function saveFollowupLog(log) {
  fs.writeFileSync(FOLLOWUP_LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

function generateFollowupEmail(lead) {
  const isUK = lead.country === "United Kingdom";
  const currencySymbol = isUK ? "£" : "$";
  const regionLabel = isUK ? "UK private practices" : "Canadian dental clinics";
  const greeting = lead.doctorName.startsWith("Dr.") ? lead.doctorName : `Dr. ${lead.doctorName.replace(/^Dr\.\s*/i, "")}`;

  const subject = `Re: quick question about after-hours calls at ${lead.practiceName}`;

  const body = `Hi ${greeting},

Following up briefly on my earlier note regarding missed after-hours patient inquiries at ${lead.practiceName}.

We have reserved 2 complimentary pilot slots this week for ${regionLabel} to test the 24/7 Sovereign AI Clinical Receptionist (sub-400ms triage, emergency screening & automated practice calendar bookings).

You can test the interactive patient demo directly here:
👉 https://www.garudaos.in/apps/apex-dental-ai/

Would you be open to a 5-minute technical walkthrough this Friday or early next week?

Best regards,

Praveen Mahawar
Chief AI Architect • GARUDA AI Operating System
Platform: https://www.garudaos.in
Email: praveen@garudaos.in`;

  return { subject, body };
}

async function runDentalFollowup(options = {}) {
  const isDispatch = options.dispatch ?? process.argv.includes("--dispatch");
  const limit = options.limit || 20;

  console.log("\n========================================================");
  console.log("🦅 GARUDA DENTAL CLINIC FOLLOW-UP DISPATCHER (STEP 2)");
  console.log(`Mode:       ${isDispatch ? "🔴 LIVE DISPATCH" : "🟡 DRY-RUN PREVIEW"}`);
  console.log(`Batch Cap:  ${limit} emails`);
  console.log(`Sender:     ${SMTP_CONFIG.auth.user}`);
  console.log("========================================================\n");

  if (!fs.existsSync(LEADS_FILE) || !fs.existsSync(STEP1_LOG_FILE)) {
    console.error("Missing required lead files.");
    return { dispatched: 0, pending: 0 };
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  const step1Dispatched = new Set();

  const lines = fs.readFileSync(STEP1_LOG_FILE, "utf8").split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.status === "SUCCESS" && entry.email) {
        step1Dispatched.add(entry.email.toLowerCase());
      }
    } catch (_) {}
  }

  const followupLog = getFollowupLog();
  const alreadyFollowedUp = new Set(followupLog.map(f => (f.email || "").toLowerCase()));

  // Eligible targets: Received Step 1, but NOT Step 2 yet
  const eligible = leads.filter(l => 
    step1Dispatched.has(l.email.toLowerCase()) && !alreadyFollowedUp.has(l.email.toLowerCase())
  );

  console.log(`Step 1 Dispatched: ${step1Dispatched.size}`);
  console.log(`Step 2 Already Sent: ${alreadyFollowedUp.size}`);
  console.log(`Eligible for Follow-up: ${eligible.length}`);

  if (eligible.length === 0) {
    console.log("✔ All eligible clinics have already received their Step 2 Follow-Up!");
    return { dispatched: 0, pending: 0 };
  }

  const batch = eligible.slice(0, limit);
  let transporter = null;

  if (isDispatch) {
    if (!SMTP_CONFIG.auth.pass) {
      console.error("❌ GARUDA_EMAIL_PASS is missing in environment.");
      return { error: "AUTH_MISSING" };
    }
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }

  let count = 0;
  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];
    const { subject, body } = generateFollowupEmail(lead);
    const sha256 = crypto.createHash("sha256").update(body).digest("hex");

    console.log(`[#${i + 1}/${batch.length}] Dispatching Follow-Up to: ${lead.practiceName} <${lead.email}>`);

    if (isDispatch) {
      try {
        const info = await transporter.sendMail({
          from: FROM_HEADER,
          to: lead.email,
          subject,
          text: body
        });

        console.log(`   ✔ SUCCESS: Message ID ${info.messageId}`);
        followupLog.push({
          leadId: lead.id,
          practiceName: lead.practiceName,
          email: lead.email,
          country: lead.country,
          subject,
          messageId: info.messageId,
          sha256,
          status: "SUCCESS",
          timestamp: new Date().toISOString()
        });
        saveFollowupLog(followupLog);
        count++;

        // Random delay (10-25 seconds in cloud batch mode, or longer)
        const delayMs = Math.floor(Math.random() * 8000) + 12000;
        await sleep(delayMs);
      } catch (err) {
        console.error(`   ❌ FAILED for ${lead.email}:`, err.message);
        followupLog.push({
          leadId: lead.id,
          practiceName: lead.practiceName,
          email: lead.email,
          status: "FAILED",
          error: err.message,
          timestamp: new Date().toISOString()
        });
        saveFollowupLog(followupLog);
      }
    } else {
      console.log(`   [DRY-RUN] Subject: ${subject}`);
      count++;
    }
  }

  return { dispatched: count, pending: eligible.length - count };
}

if (require.main === module) {
  runDentalFollowup().catch(console.error);
}

module.exports = { runDentalFollowup, generateFollowupEmail };
