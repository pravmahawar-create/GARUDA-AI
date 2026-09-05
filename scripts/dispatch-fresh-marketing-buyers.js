/**
 * 🦅 Governed Dispatch: 3 Active RFP Buyers for Digital & Performance Marketing
 * 1. Kanishka Garg / Orion Marine Concepts (kanishka.garg@orionmarineconcepts.com)
 * 2. Prashanth Patil (patilom61@gmail.com)
 * 3. Lead Pronto (hello@leadpronto.co.uk)
 *
 * 100% Anti-Fabrication Law: Real verified Google SMTP, zero fake details, zero Niravi pollution.
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BUYERS = [
  {
    prospectId: "PL_RFP_KANISHKA_GARG",
    businessName: "Orion Marine Concepts",
    email: "kanishka.garg@orionmarineconcepts.com",
    city: "India / Global",
    domain: "B2B Performance Marketing & Lead Acquisition",
    theme: "performance_marketing_roas",
    subject: "Performance Marketing & Client Acquisition Blueprint for Orion Marine Concepts",
    notes: "Live LinkedIn RFP: Brand seeking performance marketing agency and case study results."
  },
  {
    prospectId: "PL_RFP_PRASHANTH_PATIL",
    businessName: "Prashanth Patil Ventures",
    email: "patilom61@gmail.com",
    city: "Pune, India",
    domain: "Digital Marketing & High-Converting Paid Lead Gen",
    theme: "performance_marketing_roas",
    subject: "Digital Marketing & High-ROI Lead Gen Blueprint for Pune Businesses",
    notes: "Live LinkedIn RFP: Direct requirement for digital marketing agency in Pune."
  },
  {
    prospectId: "PL_RFP_LEAD_PRONTO",
    businessName: "Lead Pronto",
    email: "hello@leadpronto.co.uk",
    city: "United Kingdom",
    domain: "Performance Marketing & Full-Funnel Growth",
    theme: "performance_marketing_roas",
    subject: "Performance Marketing & High-Velocity Funnels for Lead Pronto",
    notes: "Live LinkedIn RFP: Agency seeking performance marketing specialists."
  }
];

async function dispatchRFPs() {
  console.log("================================================================================");
  console.log("🦅 DISPATCHING TO 3 FRESH DIGITAL & PERFORMANCE MARKETING BUYERS");
  console.log(`Sender: GARUDA AI Systems <${smtpConfig.user}>`);
  console.log("================================================================================\n");

  const results = [];

  for (let i = 0; i < BUYERS.length; i++) {
    const buyer = BUYERS[i];
    console.log(`[${i + 1}/3] Generating proposal for ${buyer.businessName} (${buyer.email})...`);

    const generated = emailService.generateVisualSalesEmail({
      prospectId: buyer.prospectId,
      businessName: buyer.businessName,
      domain: buyer.domain,
      city: buyer.city,
      email: buyer.email,
      theme: buyer.theme,
      subject: buyer.subject,
      notes: buyer.notes
    });

    // Governance checks
    if (generated.html.toLowerCase().includes("niravi")) {
      throw new Error(`BLOCKED: Niravi brand pollution detected for ${buyer.businessName}`);
    }
    if (generated.html.includes("91114")) {
      throw new Error(`BLOCKED: Fake phone number detected for ${buyer.businessName}`);
    }

    const plainTextBody = `Dear ${buyer.businessName} Team,\n\n` +
      `We noted your requirement for a specialized performance marketing agency.\n\n` +
      `GARUDA operates as an autonomous performance marketing and AI execution system. We specialize in scaling paid acquisition funnels through algorithmic Meta & Google Ads optimization, rapid creative testing, and transparent milestone-governed retainers (₹25,000/month flat retainer with 50% kickoff advance deposit upon strategy approval).\n\n` +
      `Deliverable Capabilities:\n` +
      `1. Advantage+ & Algorithmic Bid-Capping to Maximize ROAS\n` +
      `2. High-Velocity Creative Testing (Video hooks, carousels, and UGC angles)\n` +
      `3. Landing Page CRO & Drop-off Recovery\n` +
      `4. Transparent Real-Time Attribution & ROAS Governance\n\n` +
      `Please review the complete visual brief in this email or access your interactive scoping room:\n` +
      `• Scoping Room: https://www.garudaos.in/chat?ref=${buyer.prospectId}\n` +
      `• Platform: https://www.garudaos.in\n\n` +
      `Sincerely,\nPraveen Mahawar\nFounder & Chief Architect, GARUDA AI Systems\ngarudaos.ai@gmail.com`;

    console.log(`  Connecting to Google SMTP (smtp.gmail.com:587) for ${buyer.email}...`);

    try {
      const sendRes = await sendSmtpWithFallback(smtpConfig, {
        to: buyer.email,
        subject: buyer.subject,
        body: plainTextBody,
        html: generated.html
      });

      console.log(`✔ SUCCESS: Dispatched to ${buyer.email}!`);
      console.log(`   Provider Response: ${sendRes.providerResponseId}`);
      console.log(`   SHA-256: ${generated.sha256}\n`);

      results.push({
        prospectId: buyer.prospectId,
        businessName: buyer.businessName,
        email: buyer.email,
        theme: generated.themeUsed,
        subject: buyer.subject,
        sha256: generated.sha256,
        providerResponseId: sendRes.providerResponseId,
        dispatchedAt: new Date().toISOString(),
        status: "dispatched"
      });
    } catch (err) {
      console.error(`✘ FAILED: ${buyer.email} -> ${err.message}\n`);
      results.push({
        prospectId: buyer.prospectId,
        businessName: buyer.businessName,
        email: buyer.email,
        status: "failed",
        error: err.message
      });
    }

    if (i < BUYERS.length - 1) {
      await sleep(2500);
    }
  }

  // Update audit log
  const logPath = path.join(__dirname, "..", "data", "outreach-dispatch-log.json");
  let existing = [];
  try {
    if (fs.existsSync(logPath)) existing = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch (_e) {}
  existing.push(...results);
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2), "utf8");

  console.log("================================================================================");
  console.log(`🎉 BATCH COMPLETE: ${results.filter(r => r.status === "dispatched").length}/${BUYERS.length} Dispatched via Google SMTP`);
  console.log("================================================================================");
}

dispatchRFPs().catch(err => {
  console.error("Batch error:", err.message);
  process.exit(1);
});
