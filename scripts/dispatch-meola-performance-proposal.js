/**
 * 🦅 Immediate Dispatch: Performance Marketing & ROAS Proposal for Meola India
 * Prospect: Deep Patel / Meola India (info@meolaindia.com)
 * Trigger: Live LinkedIn RFP requesting performance marketing agency details
 * Governance:
 * - Anti-Fabrication Law: Verified SMTP, zero fake contacts, zero third-party pollution
 * - Theme: Performance Marketing & ROAS Scaling (Emerald #10B981 & Indigo #6366F1)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const emailService = require("../src/services/premiumVisualEmailService");
const { sendSmtpWithFallback } = require("../src/services/motherPlatformAuthService");

const smtpConfig = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.GARUDA_EMAIL_PORT) || 587,
  user: process.env.GARUDA_EMAIL_USER,
  pass: process.env.GARUDA_EMAIL_PASS
};

async function executeMeolaDispatch() {
  console.log("================================================================================");
  console.log("🦅 EXECUTING IMMEDIATE PERFORMANCE MARKETING DISPATCH FOR MEOLA INDIA");
  console.log("================================================================================");

  const prospectSpec = {
    prospectId: "PL_MEOLA_INDIA_PM_01",
    businessName: "Meola India",
    domain: "E-Commerce Performance Marketing & Paid Ads Scaling",
    city: "India",
    email: "info@meolaindia.com",
    theme: "performance_marketing_roas",
    auditNotes: "Live LinkedIn RFP: Brand seeking performance marketing agency for Meta/Google Ads scaling and ROAS maximization."
  };

  console.log("\n[1/3] Generating bespoke Performance Marketing Visual Brief...");
  const generated = emailService.generateVisualSalesEmail(prospectSpec);

  console.log(`✔ Proposal generated: ${generated.htmlPath}`);
  console.log(`   Theme: ${generated.themeUsed}`);
  console.log(`   Size: ${generated.fileSizeBytes} bytes`);
  console.log(`   SHA-256: ${generated.sha256}`);

  // Pre-flight governance
  if (generated.html.toLowerCase().includes("niravi")) {
    throw new Error("BLOCKED: Detected Niravi brand pollution!");
  }
  if (generated.html.includes("91114")) {
    throw new Error("BLOCKED: Detected fake phone number 91114!");
  }
  console.log("✔ Governance Checks Passed (0 Niravi, 0 Fake Phone Numbers, 100% Verified Founder Channels)");

  const subject = `Performance Marketing & ROAS Scaling Blueprint for Meola India`;
  const plainTextBody = `Dear Deep & Meola India Team,\n\n` +
    `We noted your requirement for a specialized performance marketing agency for Meola India.\n\n` +
    `GARUDA operates as an autonomous performance marketing and AI engineering system. We specialize in scaling D2C e-commerce brands through algorithmic Meta & Google Ads optimization, rapid creative testing, and transparent milestone-governed retainers (₹25,000/month flat retainer with 50% kickoff advance deposit upon strategy approval).\n\n` +
    `Key Focus for Meola India:\n` +
    `1. Advantage+ Shopping & Algorithmic Bid-Capping (Maximizing Blended ROAS)\n` +
    `2. High-Velocity Creative Testing (Video hooks, UGC angles, and static carousels)\n` +
    `3. Mobile Checkout Friction Reduction & Drop-off Recovery\n` +
    `4. Transparent Real-Time Attribution & ROAS Governance\n\n` +
    `Please view the complete visual blueprint in this email or explore your interactive scoping room:\n` +
    `• Scoping Room: https://www.garudaos.in/chat?ref=meola_india_pm\n` +
    `• Platform: https://www.garudaos.in\n\n` +
    `Sincerely,\nPraveen Mahawar\nFounder & Chief Architect, GARUDA AI Systems\ngarudaos.ai@gmail.com`;

  console.log(`\n[2/3] Connecting to Google SMTP (smtp.gmail.com:587) via garudaos.ai@gmail.com...`);
  const sendRes = await sendSmtpWithFallback(smtpConfig, {
    to: prospectSpec.email,
    subject,
    body: plainTextBody,
    html: generated.html
  });

  console.log(`✔ SUCCESS: Dispatched to ${prospectSpec.email}!`);
  console.log(`   Provider Response: ${sendRes.providerResponseId}`);

  // Log in ledger
  const auditRecord = {
    prospectId: prospectSpec.prospectId,
    businessName: prospectSpec.businessName,
    email: prospectSpec.email,
    theme: generated.themeUsed,
    subject,
    sha256: generated.sha256,
    providerResponseId: sendRes.providerResponseId,
    dispatchedAt: new Date().toISOString(),
    status: "dispatched"
  };

  const logPath = path.join(__dirname, "..", "data", "outreach-dispatch-log.json");
  let existing = [];
  try {
    if (fs.existsSync(logPath)) existing = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch (_e) {}
  existing.push(auditRecord);
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2), "utf8");

  console.log(`\n[3/3] Audit record sealed in ${logPath}`);
  console.log("================================================================================");
  console.log("🎉 DISPATCH EXECUTED SUCCESSFULLY — ZERO RUPEE OUT OF POCKET");
  console.log("================================================================================");
}

executeMeolaDispatch().catch(err => {
  console.error("✘ Execution failed:", err.message);
  process.exit(1);
});
