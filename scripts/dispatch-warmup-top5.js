/**
 * 🦅 GARUDA Day-1 Warm-Up Outreach Engine (Top 5 High-Potential Clients)
 * Strictly enforces:
 * 1. 100% Anti-Fabrication Law: Verified dispatch from praveen@garudaos.in
 * 2. Visual-First Executive Briefs: "Rang, Roop aur Mood" tailored to each prospect
 * 3. Politeness Pacing: 6-second rate-limiting delay between sends
 * 4. RFC 5322 Compliant Headers: "Praveen Mahawar" <praveen@garudaos.in>
 * 5. Full Audit Logging with Provider Response IDs
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { sendSmtpWithFallback } = require("../src/services/motherPlatformAuthService");

const DATA_DIR = path.join(__dirname, "..", "data");
const PROPOSALS_DIR = path.join(DATA_DIR, "proposals");
const WARMUP_LOG_PATH = path.join(DATA_DIR, "warmup-top5-dispatch-log.json");

const smtpConfig = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: Number(process.env.GARUDA_EMAIL_PORT) || 465,
  user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
  pass: process.env.GARUDA_EMAIL_PASS
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TOP_5_PROSPECTS = [
  {
    prospectId: "PL_1788543878143_b77f63",
    businessName: "Stellified",
    email: "hello@stellified.co.uk",
    subject: "Digital Architecture & Executive Blueprint for Stellified",
    proposalFile: "GARUDA_Stellified_Visual_Proposal.html"
  },
  {
    prospectId: "PL_1788544292562_e19866",
    businessName: "Global Media Insight",
    email: "liz@globalmedia.ae",
    subject: "Digital Architecture & Executive Blueprint for Global Media Insight",
    proposalFile: "GARUDA_Global_Media_Insight_Visual_Proposal.html"
  },
  {
    prospectId: "PL_1788544357758_c1f428",
    businessName: "Pixelfield",
    email: "hello@pixelfield.co.uk",
    subject: "Digital Architecture & Executive Blueprint for Pixelfield",
    proposalFile: "GARUDA_Pixelfield_Visual_Proposal.html"
  },
  {
    prospectId: "PL_1788544361534_0757e6",
    businessName: "Appinventiv",
    email: "info@appinventiv.com",
    subject: "Digital Architecture & Executive Blueprint for Appinventiv",
    proposalFile: "GARUDA_Appinventiv_Visual_Proposal.html"
  },
  {
    prospectId: "PL_MEOLA_INDIA_PM_01",
    businessName: "Meola India",
    email: "info@meolaindia.com",
    subject: "Performance Marketing & Scaling Blueprint for Meola India",
    proposalFile: "GARUDA_Meola_India_info_meolaindia_com_Visual_Proposal.html"
  }
];

async function runWarmupDispatch() {
  console.log("================================================================================");
  console.log("🦅 GARUDA FOUNDER DESK: TOP 5 HIGH-POTENTIAL WARM-UP DISPATCH");
  console.log(`Sender: "Praveen Mahawar" <${smtpConfig.user}>`);
  console.log(`Gateway: ${smtpConfig.host}:${smtpConfig.port} (Direct SSL/TLS)`);
  console.log("================================================================================\n");

  const results = [];

  for (let i = 0; i < TOP_5_PROSPECTS.length; i++) {
    const p = TOP_5_PROSPECTS[i];
    const proposalPath = path.join(PROPOSALS_DIR, p.proposalFile);

    if (!fs.existsSync(proposalPath)) {
      console.error(`Proposal file not found for ${p.businessName}: ${proposalPath}`);
      continue;
    }

    const htmlContent = fs.readFileSync(proposalPath, "utf8");
    const sha256 = crypto.createHash("sha256").update(Buffer.from(htmlContent)).digest("hex");

    const plainTextBody = `Dear ${p.businessName} Leadership,\n\n` +
      `We have prepared a tailored Digital Intelligence & Architecture Blueprint for ${p.businessName}.\n\n` +
      `GARUDA operates as an autonomous AI engineering and execution system. We specialize in high-impact web/mobile re-engineering, automated 24/7 client concierges, and zero-downtime cloud systems with transparent milestone governance (50% kickoff deposit, 50% upon verified delivery with complete regression test suites).\n\n` +
      `Please view the complete visual architectural brief in this email or explore your interactive scoping room:\n` +
      `• Scoping Room: https://www.garudaos.in/chat?ref=${p.prospectId}\n` +
      `• Platform: https://www.garudaos.in\n\n` +
      `Sincerely,\nPraveen Mahawar\nFounder & Chief Architect, GARUDA AI Systems\npraveen@garudaos.in`;

    console.log(`[${i + 1}/5] Dispatching to: ${p.email} (${p.businessName})...`);

    try {
      const sendRes = await sendSmtpWithFallback(smtpConfig, {
        to: p.email,
        subject: p.subject,
        body: plainTextBody,
        html: htmlContent
      });

      const audit = {
        prospectId: p.prospectId,
        businessName: p.businessName,
        email: p.email,
        subject: p.subject,
        sha256,
        status: "dispatched",
        providerResponseId: sendRes.providerResponseId,
        timestamp: new Date().toISOString()
      };

      results.push(audit);
      console.log(`   ✔ Dispatched successfully! Server: ${sendRes.providerResponseId}`);
    } catch (err) {
      console.error(`   ✖ Dispatch failed: ${err.message}`);
      results.push({
        prospectId: p.prospectId,
        businessName: p.businessName,
        email: p.email,
        status: "failed",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }

    if (i < TOP_5_PROSPECTS.length - 1) {
      console.log("   [Warm-up Rate Limiter] Waiting 6 seconds before next dispatch...\n");
      await sleep(6000);
    }
  }

  fs.writeFileSync(WARMUP_LOG_PATH, JSON.stringify(results, null, 2));
  console.log("\n================================================================================");
  console.log(`Warm-up dispatch complete! ${results.filter(r => r.status === "dispatched").length}/5 emails accepted.`);
  console.log(`Audit log saved to: ${WARMUP_LOG_PATH}`);
  console.log("================================================================================");
}

if (require.main === module) {
  runWarmupDispatch().catch(console.error);
}

module.exports = { runWarmupDispatch };
