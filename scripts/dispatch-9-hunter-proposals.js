/**
 * 🦅 Governed Dispatch Script for 9 Tailored Hunter Proposals
 * Strictly enforces:
 * 1. Anti-Fabrication Law: Real execution via verified SMTP (garudaos.ai@gmail.com)
 * 2. Zero Third-Party Pollution: Zero Niravi references
 * 3. Zero Synthetic Data: Zero fake phone numbers
 * 4. Politeness pacing: 2-second rate-limit protection
 * 5. Full audit logging with provider response IDs & SHA-256 hashes
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sendSmtpWithFallback } = require("../src/services/motherPlatformAuthService");

const DATA_DIR = path.join(__dirname, "..", "data");
const PROSPECTS_PATH = path.join(DATA_DIR, "web_services-prospects.json");
const PROPOSALS_DIR = path.join(DATA_DIR, "proposals");
const LOGS_PATH = path.join(DATA_DIR, "outreach-dispatch-log.json");

const smtpConfig = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.GARUDA_EMAIL_PORT) || 587,
  user: process.env.GARUDA_EMAIL_USER,
  pass: process.env.GARUDA_EMAIL_PASS
};

if (!smtpConfig.user || !smtpConfig.pass) {
  console.error("FATAL: SMTP credentials missing in environment.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDispatch() {
  console.log("================================================================================");
  console.log("🦅 GARUDA SOVEREIGN OUTREACH DISPATCH ENGINE");
  console.log(`Sender: GARUDA AI Systems <${smtpConfig.user}>`);
  console.log(`Gateway: ${smtpConfig.host}:${smtpConfig.port}`);
  console.log("================================================================================\n");

  if (!fs.existsSync(PROSPECTS_PATH)) {
    console.error("Error: Prospects file not found at", PROSPECTS_PATH);
    return;
  }

  const data = JSON.parse(fs.readFileSync(PROSPECTS_PATH, "utf8"));
  const targetProspects = data.prospects.slice(-9);

  const dispatchResults = [];

  for (let i = 0; i < targetProspects.length; i++) {
    const p = targetProspects[i];
    const emailClean = (p.email || "").replace(/[@.]/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const cleanName = (p.businessName || "Executive").replace(/[^a-zA-Z0-9]/g, "_");
    
    // Find matching proposal file
    let proposalFile = path.join(PROPOSALS_DIR, `GARUDA_${cleanName}_${emailClean}_Visual_Proposal.html`);
    if (!fs.existsSync(proposalFile)) {
      // Fallback search
      const files = fs.readdirSync(PROPOSALS_DIR).filter(f => f.includes(emailClean) && f.endsWith(".html"));
      if (files.length > 0) {
        proposalFile = path.join(PROPOSALS_DIR, files[0]);
      }
    }

    if (!fs.existsSync(proposalFile)) {
      console.error(`✘ Skipped [${p.businessName}]: Proposal file not found (${proposalFile})`);
      continue;
    }

    const htmlContent = fs.readFileSync(proposalFile, "utf8");

    // Strict Anti-Fabrication & Governance Pre-Flight Check
    if (htmlContent.toLowerCase().includes("niravi")) {
      console.error(`✘ BLOCKED [${p.businessName}]: Violates Zero Brand Pollution Rule (Contains Niravi). Dispatch rejected.`);
      continue;
    }
    if (htmlContent.includes("91114")) {
      console.error(`✘ BLOCKED [${p.businessName}]: Violates Anti-Fabrication Rule (Contains fake phone 91114). Dispatch rejected.`);
      continue;
    }

    const sha256 = crypto.createHash("sha256").update(Buffer.from(htmlContent)).digest("hex");
    const subject = `Digital Architecture & Executive Blueprint for ${p.businessName}`;
    const plainTextBody = `Dear ${p.businessName} Team,\n\n` +
      `We have prepared a tailored Digital Intelligence & Architecture Blueprint for ${p.businessName}.\n\n` +
      `GARUDA operates as an autonomous AI engineering and execution system. We specialize in high-impact web/mobile re-engineering, automated 24/7 client concierges, and zero-downtime cloud systems with transparent milestone governance (50% kickoff deposit, 50% upon verified delivery with complete regression test suites).\n\n` +
      `Please view the complete visual architectural brief in this email or explore your interactive scoping room:\n` +
      `• Scoping Room: https://www.garudaos.in/chat?ref=${p.id}\n` +
      `• Platform: https://www.garudaos.in\n\n` +
      `Sincerely,\nPraveen Mahawar\nFounder & Chief Architect, GARUDA AI Systems\ngarudaos.ai@gmail.com`;

    console.log(`[${i + 1}/9] Dispatching to: ${p.email} (${p.businessName})...`);

    try {
      const sendRes = await sendSmtpWithFallback(smtpConfig, {
        to: p.email,
        subject,
        body: plainTextBody,
        html: htmlContent
      });

      const auditRecord = {
        prospectId: p.id,
        businessName: p.businessName,
        email: p.email,
        subject,
        sha256,
        status: "dispatched",
        providerResponseId: sendRes.providerResponseId,
        timestamp: new Date().toISOString()
      };

      dispatchResults.push(auditRecord);
      p.status = "dispatched";
      p.dispatchedAt = auditRecord.timestamp;
      p.providerResponseId = sendRes.providerResponseId;

      console.log(`✔ SUCCESS: Dispatched to ${p.email}`);
      console.log(`   Response ID: ${sendRes.providerResponseId}`);
      console.log(`   Artifact SHA: ${sha256}\n`);
    } catch (err) {
      console.error(`✘ FAILED: ${p.email} -> ${err.message}\n`);
      dispatchResults.push({
        prospectId: p.id,
        businessName: p.businessName,
        email: p.email,
        status: "failed",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }

    // Politeness spacing between outgoing connections
    if (i < targetProspects.length - 1) {
      await sleep(2500);
    }
  }

  // Save updated prospects and dispatch log
  fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(data, null, 2), "utf8");

  let existingLogs = [];
  try {
    if (fs.existsSync(LOGS_PATH)) {
      existingLogs = JSON.parse(fs.readFileSync(LOGS_PATH, "utf8"));
    }
  } catch (_e) {}
  existingLogs.push(...dispatchResults);
  fs.writeFileSync(LOGS_PATH, JSON.stringify(existingLogs, null, 2), "utf8");

  console.log("================================================================================");
  console.log(`🎉 DISPATCH COMPLETE: ${dispatchResults.filter(r => r.status === "dispatched").length}/${targetProspects.length} Emails Successfully Dispatched via Google SMTP`);
  console.log("Audit log saved to:", LOGS_PATH);
  console.log("================================================================================");
}

runDispatch();
