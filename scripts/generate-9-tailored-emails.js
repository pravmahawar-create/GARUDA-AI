/**
 * 🦅 Generates 9 Tailored Visual Emails for Hunter Prospects
 * Strictly adhering to the Golden Rule:
 * 1. Visual-First Executive Layout
 * 2. Tailored to each business's "Rang, Roop aur Mood"
 * 3. Zero Niravi mentions
 * 4. Zero fake phone numbers or unverified emails
 * 5. Cryptographic SHA-256 evidence on disk
 */

const fs = require("fs");
const path = require("path");
const emailService = require("../src/services/premiumVisualEmailService");

const PROSPECTS_PATH = path.join(__dirname, "..", "data", "web_services-prospects.json");

const PROSPECT_CONFIGS = [
  {
    id: "PL_1788543878143_b77f63",
    email: "hello@stellified.co.uk",
    businessName: "Stellified",
    city: "Glasgow, UK",
    domain: "High-Performance Web Design & Modern Architecture",
    theme: "uk_creative_tech",
    auditNotes: "Audit: 3.7s page load time, outdated legacy layout, sub-second speed potential"
  },
  {
    id: "PL_1788544292562_e19866",
    email: "liz@globalmedia.ae",
    businessName: "Global Media Insight",
    city: "Dubai, UAE",
    domain: "Enterprise Website Maintenance & AMC Services",
    theme: "gulf_luxury_tech",
    auditNotes: "Audit: 2.6s load, UAE enterprise AMC market, round-the-clock uptime automation"
  },
  {
    id: "PL_1788544292562_f37b74",
    email: "liz@globalmediainsight.agency",
    businessName: "Global Media Insight",
    city: "Dubai, UAE",
    domain: "Enterprise Website Maintenance & AMC Services",
    theme: "gulf_luxury_tech",
    auditNotes: "Audit: UAE regional agency domain, enterprise SLA self-healing automation"
  },
  {
    id: "PL_1788544292562_fd90af",
    email: "francis@globalmediainsight.agency",
    businessName: "Global Media Insight",
    city: "Dubai, UAE",
    domain: "Enterprise Website Maintenance & AMC Services",
    theme: "gulf_luxury_tech",
    auditNotes: "Audit: Technical executive contact, cloud resilience and automated backup monitoring"
  },
  {
    id: "PL_1788544292562_941b4a",
    email: "francis@globalmedia.ae",
    businessName: "Global Media Insight",
    city: "Dubai, UAE",
    domain: "Enterprise Website Maintenance & AMC Services",
    theme: "gulf_luxury_tech",
    auditNotes: "Audit: Corporate UAE contact, high-concurrency client portal acceleration"
  },
  {
    id: "PL_1788544357758_c1f428",
    email: "hello@pixelfield.co.uk",
    businessName: "Pixelfield",
    city: "London, UK",
    domain: "Mobile App & Product Engineering",
    theme: "london_cyber_studio",
    auditNotes: "Audit: High-end UK mobile studio, React Native/Flutter CI/CD and automated regression QA"
  },
  {
    id: "PL_1788544361534_0757e6",
    email: "info@appinventiv.com",
    businessName: "Appinventiv",
    city: "London / Global",
    domain: "Enterprise Digital Transformation & Scalable Apps",
    theme: "enterprise_global_tech",
    auditNotes: "Audit: Large scale enterprise app engineering, AI multi-agent workflow orchestration"
  },
  {
    id: "PL_1788545110924_34abf4",
    email: "paviterjeetkaur@gmail.com",
    businessName: "Paviterjeet Kaur Web Studio",
    city: "India",
    domain: "Boutique Web Design & Conversion Optimization",
    theme: "boutique_creative_studio",
    auditNotes: "Audit: 2019 legacy framework, speed optimization, high-converting client booking funnels"
  },
  {
    id: "PL_1788545490054_c42aca",
    email: "info@giksindia.com",
    businessName: "GIKS India",
    city: "Pune, India",
    domain: "Legacy Codebase Modernization & Cloud Infrastructure",
    theme: "modern_it_cloud",
    auditNotes: "Audit: 2017 legacy stack, serverless cloud migration, automated uptime guards"
  }
];

function generateAll() {
  console.log("=== GENERATING 9 TAILORED VISUAL SALES EMAILS ===");
  const results = [];

  for (const cfg of PROSPECT_CONFIGS) {
    const res = emailService.generateVisualSalesEmail({
      prospectId: cfg.id,
      businessName: cfg.businessName,
      city: cfg.city,
      domain: cfg.domain,
      email: cfg.email,
      theme: cfg.theme,
      notes: cfg.auditNotes
    });

    results.push({
      id: cfg.id,
      businessName: cfg.businessName,
      email: cfg.email,
      themeUsed: res.themeUsed,
      subject: res.subject,
      htmlPath: res.htmlPath,
      fileSizeBytes: res.fileSizeBytes,
      sha256: res.sha256
    });

    console.log(`✔ [${cfg.businessName}] (${cfg.email})`);
    console.log(`   Theme: ${res.themeUsed} | Size: ${res.fileSizeBytes} bytes`);
    console.log(`   SHA-256: ${res.sha256}`);
    console.log(`   Path: ${res.htmlPath}`);
  }

  // Update data/web_services-prospects.json with polished business names and proposal references
  if (fs.existsSync(PROSPECTS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROSPECTS_PATH, "utf8"));
      for (const p of data.prospects) {
        const found = results.find(r => r.id === p.id || r.email === p.email);
        if (found) {
          p.businessName = found.businessName;
          p.visualProposal = {
            subject: found.subject,
            htmlPath: found.htmlPath,
            sha256: found.sha256,
            generatedAt: new Date().toISOString()
          };
          p.status = "proposal_ready";
        }
      }
      fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(data, null, 2), "utf8");
      console.log(`\n✔ Updated data/web_services-prospects.json with visual proposal metadata`);
    } catch (e) {
      console.error("Failed to update prospects json:", e.message);
    }
  }

  console.log("\nAll 9 Tailored Visual Emails successfully created!");
}

generateAll();
