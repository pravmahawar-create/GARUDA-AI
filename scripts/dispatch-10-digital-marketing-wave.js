/**
 * 🦅 GARUDA Governed Dispatch: 10 Digital Marketing Agencies & High-Intent Brand RFPs
 *
 * Targets:
 * 1. Ambeytech Digital (info@ambeytech.com)
 * 2. Traffic Tail (info@traffictail.com)
 * 3. Solitek IT & Marketing (hello@solitek.ae)
 * 4. WaysPro Tech (hello@waysprotech.com)
 * 5. Lead Pronto (hello@leadpronto.co.uk)
 * 6. Wow Infotech (sales@wowinfotech.com)
 * 7. Meola India (info@meolaindia.com)
 * 8. Prashanth Patil Ventures (patilom61@gmail.com)
 * 9. Orion Marine Concepts (kanishka.garg@orionmarineconcepts.com)
 * 10. Stylox Brand (vishal@stylox.co.in)
 *
 * Doctrine & Guarantees:
 * - 100% Anti-Fabrication Law: Real verified Zoho SMTP (praveen@garudaos.in)
 * - Zero Fake Numbers: Praveen Mahawar direct line +91 9098750362
 * - Zero Niravi Pollution
 * - Dynamic Visual Excellence: Tailored dark theme layouts (Emerald ROAS, Gulf Gold, UK Cyan)
 * - Direct Founder Alert: Qualified responses forward to WhatsApp (+91 9098750362) & Telegram
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const emailService = require("../src/services/premiumVisualEmailService");
const { sendSmtpWithFallback } = require("../src/services/motherPlatformAuthService");

const smtpConfig = {
  host: process.env.GARUDA_EMAIL_HOST || "smtp.zoho.in",
  port: Number(process.env.GARUDA_EMAIL_PORT) || 465,
  user: process.env.GARUDA_EMAIL_USER || "praveen@garudaos.in",
  pass: process.env.GARUDA_EMAIL_PASS
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TARGETS = [
  {
    prospectId: "PL_MKT_AMBEYTECH_DELHI",
    businessName: "Ambeytech Digital",
    email: "info@ambeytech.com",
    city: "Noida / Delhi NCR",
    domain: "Digital Marketing & White-Label Web Funnels",
    theme: "performance_marketing_roas",
    dealSize: "₹25,000 / month flat retainer",
    subject: "White-Label 48-Hour Web & AI Funnel Execution Pod for Ambeytech Digital",
    notes: "Top Delhi NCR Digital Marketing Agency: Scaling client funnel turnaround with zero tech debt."
  },
  {
    prospectId: "PL_MKT_TRAFFIC_TAIL_DELHI",
    businessName: "Traffic Tail",
    email: "info@traffictail.com",
    city: "Delhi NCR",
    domain: "Performance Marketing & Conversion Funnels",
    theme: "performance_marketing_roas",
    dealSize: "₹25,000 / month flat retainer",
    subject: "High-Velocity Web & AI Funnel Engineering Pod for Traffic Tail",
    notes: "High-Volume Digital Agency: Automated WhatsApp lead capture and sub-second landing pages."
  },
  {
    prospectId: "PL_MKT_SOLITEK_DUBAI",
    businessName: "Solitek IT & Marketing",
    email: "hello@solitek.ae",
    city: "Dubai, UAE",
    domain: "Gulf Digital Marketing & Custom Tech Solutions",
    theme: "gulf_luxury_tech",
    dealSize: "AED 2,500 / month ($680 USD)",
    subject: "Autonomous 48-Hour Full-Stack Engineering & AI Node for Solitek Dubai",
    notes: "UAE Agency Partner: Fast headless web delivery and automated CRM triage under white-label NDA."
  },
  {
    prospectId: "PL_MKT_WAYSPRO_DUBAI",
    businessName: "WaysPro Tech",
    email: "hello@waysprotech.com",
    city: "Dubai, UAE",
    domain: "GCC Digital Marketing & High-Converting Funnels",
    theme: "gulf_luxury_tech",
    dealSize: "AED 2,500 / month ($680 USD)",
    subject: "White-Label Web Architecture & AI Automation Node for WaysPro Tech Dubai",
    notes: "Dubai Agency Partner: 48-hour sprint execution for luxury and enterprise client campaigns."
  },
  {
    prospectId: "PL_MKT_LEAD_PRONTO_UK",
    businessName: "Lead Pronto UK",
    email: "hello@leadpronto.co.uk",
    city: "United Kingdom",
    domain: "Performance Marketing & B2B Lead Acquisition",
    theme: "uk_creative_tech",
    dealSize: "£1,200 / month ($1,500 USD)",
    subject: "High-Velocity Conversion Funnel & AI Sprint Node for Lead Pronto UK",
    notes: "UK Lead Generation Agency: Full-funnel speed, deterministic tracking, and zero dev lag."
  },
  {
    prospectId: "PL_MKT_WOW_INFOTECH",
    businessName: "Wow Infotech",
    email: "sales@wowinfotech.com",
    city: "India / Global",
    domain: "Custom App & Digital Marketing Engineering",
    theme: "performance_marketing_roas",
    dealSize: "₹25,000 / month flat retainer",
    subject: "White-Label 48-Hour Sprint Pod & AI Automation for Wow Infotech",
    notes: "Digital & App Agency: Resource overflow relief and sub-100ms PWA conversion delivery."
  },
  {
    prospectId: "PL_MKT_MEOLA_INDIA_RFP",
    businessName: "Meola India",
    email: "info@meolaindia.com",
    city: "India",
    domain: "B2C Brand Performance Marketing & Paid Acquisition",
    theme: "performance_marketing_roas",
    dealSize: "₹35,000 Sprint + ₹25,000/mo Retainer",
    subject: "Algorithmic Performance Marketing & High-ROAS Acquisition Blueprint for Meola India",
    notes: "Live RFP: Brand actively seeking performance marketing agency with proven ROAS systems."
  },
  {
    prospectId: "PL_MKT_PRASHANTH_PATIL_RFP",
    businessName: "Prashanth Patil Ventures",
    email: "patilom61@gmail.com",
    city: "Pune, India",
    domain: "High-Converting Local & Regional Lead Generation",
    theme: "performance_marketing_roas",
    dealSize: "₹25,000 / month flat retainer",
    subject: "Digital Marketing & Automated Client Acquisition Blueprint for Pune Businesses",
    notes: "Live RFP: Direct requirement for specialized digital marketing agency in Pune."
  },
  {
    prospectId: "PL_MKT_ORION_MARINE_RFP",
    businessName: "Orion Marine Concepts",
    email: "kanishka.garg@orionmarineconcepts.com",
    city: "India / Global",
    domain: "B2B Performance Marketing & Lead Acquisition",
    theme: "performance_marketing_roas",
    dealSize: "₹35,000 Sprint + ₹25,000/mo Retainer",
    subject: "Performance Marketing & Client Acquisition Blueprint for Orion Marine Concepts",
    notes: "Live RFP: Seeking performance marketing agency, case studies, and transparent attribution."
  },
  {
    prospectId: "PL_MKT_STYLOX_BRAND_RFP",
    businessName: "Stylox Brand (Vishal Mehra)",
    email: "vishal@stylox.co.in",
    city: "India",
    domain: "B2B Lead Generation & High-Converting Commerce Funnels",
    theme: "performance_marketing_roas",
    dealSize: "₹25,000 / month flat retainer",
    subject: "B2B Lead Generation & High-Conversion Funnel Blueprint for Stylox",
    notes: "Live RFP: Direct requirement for B2B lead generation agency and automated follow-ups."
  }
];

const LOGS_PATH = path.join(__dirname, "..", "data", "digital-marketing-dispatch-log.json");

async function dispatchMarketingWave(options = {}) {
  const isDryRun = options.dryRun !== false && !process.argv.includes("--live");

  console.log("==================================================================");
  console.log("🦅 GARUDA DIGITAL MARKETING & BRAND RFP DISPATCH WAVE");
  console.log("==================================================================");
  console.log("Mode:", isDryRun ? "DRY-RUN (Verification Only)" : "LIVE DISPATCH (Zoho SMTP: " + smtpConfig.user + ")");
  console.log("Accounts:", TARGETS.length, "Verified Marketing Targets");
  console.log("Founder Direct Line: +91 9098750362 | Email: praveen@garudaos.in\n");

  let existingLogs = [];
  try {
    if (fs.existsSync(LOGS_PATH)) {
      existingLogs = JSON.parse(fs.readFileSync(LOGS_PATH, "utf8"));
    }
  } catch {}

  const results = [];

  for (let i = 0; i < TARGETS.length; i++) {
    const target = TARGETS[i];
    console.log(`[#${i + 1}/${TARGETS.length}] Processing: ${target.businessName} (${target.city})`);
    console.log(`Recipient: ${target.email}`);
    console.log(`Deal Profile: ${target.dealSize}`);
    console.log(`Scoping Room: https://www.garudaos.in/chat?ref=${target.prospectId}`);

    // Check skip if already dispatched
    const priorSuccess = existingLogs.find(x => x.email === target.email && x.status === "dispatched");
    if (priorSuccess && (process.argv.includes("--retry-failed") || options.retryFailed)) {
      console.log(`[SKIP] ${target.businessName} already dispatched (${priorSuccess.providerResponseId}).\n`);
      results.push(priorSuccess);
      continue;
    }

    const generated = emailService.generateVisualSalesEmail({
      prospectId: target.prospectId,
      businessName: target.businessName,
      domain: target.domain,
      city: target.city,
      email: target.email,
      theme: target.theme,
      subject: target.subject,
      notes: target.notes
    });

    // Anti-fabrication & governance validation
    if (generated.html.toLowerCase().includes("niravi")) {
      throw new Error(`[BLOCKED] Niravi brand pollution detected for ${target.businessName}`);
    }
    if (generated.html.includes("91114")) {
      throw new Error(`[BLOCKED] Fake phone number detected for ${target.businessName}`);
    }

    const sha256 = crypto.createHash("sha256").update(generated.html).digest("hex");
    console.log(`SHA-256 Digest: ${sha256}`);

    if (isDryRun) {
      console.log(`[DRY-RUN] Verified HTML (${Buffer.byteLength(generated.html)} bytes). Skipping live SMTP.\n`);
      results.push({
        prospectId: target.prospectId,
        businessName: target.businessName,
        email: target.email,
        dealSize: target.dealSize,
        subject: target.subject,
        sha256,
        status: "dry_run_verified",
        timestamp: new Date().toISOString()
      });
    } else {
      let attempts = 0;
      let sent = false;
      while (attempts < 3 && !sent) {
        attempts++;
        try {
          console.log(`[LIVE] Sending attempt ${attempts} from ${smtpConfig.user} to ${target.email}...`);
          const sendResult = await sendSmtpWithFallback(smtpConfig, {
            from: `"Praveen Mahawar | GARUDA OS" <${smtpConfig.user}>`,
            to: target.email,
            replyTo: "praveen@garudaos.in",
            subject: target.subject,
            html: generated.html
          });

          console.log(`[SUCCESS] SMTP Response: ${sendResult.messageId || "250 OK"}`);
          results.push({
            prospectId: target.prospectId,
            businessName: target.businessName,
            email: target.email,
            dealSize: target.dealSize,
            subject: target.subject,
            sha256,
            status: "dispatched",
            providerResponseId: sendResult.messageId || "250 OK",
            timestamp: new Date().toISOString()
          });
          sent = true;

          console.log("Pacing: sleeping 5000ms to safeguard deliverability...\n");
          await sleep(5000);
        } catch (err) {
          console.error(`[ERROR] Attempt ${attempts} failed for ${target.email}: ${err.message}`);
          if (attempts < 3) {
            console.log("Backing off 4000ms before retry...");
            await sleep(4000);
          } else {
            results.push({
              prospectId: target.prospectId,
              businessName: target.businessName,
              email: target.email,
              dealSize: target.dealSize,
              subject: target.subject,
              sha256,
              status: "failed",
              error: err.message,
              timestamp: new Date().toISOString()
            });
            console.log("");
          }
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(LOGS_PATH), { recursive: true });
  fs.writeFileSync(LOGS_PATH, JSON.stringify(results, null, 2), "utf8");
  console.log(`Audit log saved to: ${LOGS_PATH}`);

  return results;
}

if (require.main === module) {
  const isLive = process.argv.includes("--live");
  dispatchMarketingWave({ dryRun: !isLive }).catch(console.error);
}

module.exports = {
  dispatchMarketingWave,
  TARGETS
};
