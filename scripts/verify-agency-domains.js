const dns = require("dns").promises;
const dnsSync = require("dns");
dnsSync.setServers(["8.8.8.8", "1.1.1.1"]);

const candidates = [
  {
    agencyName: "Social Beat",
    city: "Chennai & Bangalore",
    domain: "socialbeat.in",
    email: "enquiry@socialbeat.in",
    contactPerson: "Digital Tech & Partnerships Team",
    retainerClients: "60+",
    currentBottleneck: "High volume of enterprise retail & FMCG clients asking for real-time WhatsApp conversational lead funnels and localized conversational commerce.",
    whiteLabelOffer: "Custom WhatsApp AI lead funnels and conversational commerce micro-apps in 48 hours flat under strict white-label NDA."
  },
  {
    agencyName: "Indus Net Technologies (INT.)",
    city: "Kolkata",
    domain: "indusnet.co.in",
    email: "info@indusnet.co.in",
    contactPerson: "Enterprise Solutions & Partner Alliance Lead",
    retainerClients: "100+",
    currentBottleneck: "Mid-market BFSI and healthcare clients requiring rapid conversational AI integrations without locking up core sprint resources.",
    whiteLabelOffer: "Zero-overhead sovereign AI engineering node. Enterprise-grade micro-services delivered in 48-72 hours under your label."
  },
  {
    agencyName: "TechAhead Software",
    city: "Noida / Delhi NCR",
    domain: "techaheadcorp.com",
    email: "sales@techaheadcorp.com",
    contactPerson: "VP of Engineering & Client Delivery",
    retainerClients: "50+",
    currentBottleneck: "US & Indian SME clients demanding automated ReAct-style agentic workflow backends alongside their mobile apps.",
    whiteLabelOffer: "Turnkey multi-agent automation backends and PWA wrappers. 100% silent delivery under your client contracts."
  },
  {
    agencyName: "Pulp Strategy Communications",
    city: "New Delhi / Gurgaon",
    domain: "pulpstrategy.com",
    email: "contact@pulpstrategy.com",
    contactPerson: "Strategy & Tech Operations Head",
    retainerClients: "40+",
    currentBottleneck: "B2B brands seeking 24/7 autonomous lead qualification agents to eliminate dropped website inquiry leaks.",
    whiteLabelOffer: "Autonomous lead qualification web widgets and WhatsApp routing delivered in 48 hours. Keep 55% net project margin."
  },
  {
    agencyName: "AdGlobal360",
    city: "Gurgaon",
    domain: "adglobal360.com",
    email: "info@adglobal360.com",
    contactPerson: "Marketing Technology & Solutions Director",
    retainerClients: "75+",
    currentBottleneck: "Automotive & real estate clients demanding sub-second response conversational portals across multi-channel campaigns.",
    whiteLabelOffer: "Instant AI conversational triage and webhook dispatch engine. Full white-label delivery with SHA-256 integrity verification."
  },
  {
    agencyName: "EZ Rankings",
    city: "Noida / Delhi NCR",
    domain: "ezrankings.com",
    email: "contactus@ezrankings.com",
    contactPerson: "Business Growth & Alliances Lead",
    retainerClients: "80+",
    currentBottleneck: "Global SEO & SME clients wanting interactive conversion chatbots and AI landing page nodes at scale.",
    whiteLabelOffer: "High-speed conversion bot backends and interactive widgets delivered in 48 hours under your brand."
  }
];

async function verifyAll() {
  console.log("🔍 Verifying MX records and domain deliverability for 6 new agency candidates...\n");
  const verified = [];

  for (const c of candidates) {
    try {
      const mx = await dns.resolveMx(c.domain);
      if (mx && mx.length > 0) {
        console.log(`✔ [VERIFIED] ${c.agencyName} (${c.domain}) — MX: ${mx[0].exchange} (Priority: ${mx[0].priority})`);
        verified.push(c);
      } else {
        console.warn(`✖ [NO MX] ${c.agencyName} (${c.domain})`);
      }
    } catch (err) {
      console.error(`✖ [FAIL] ${c.agencyName} (${c.domain}): ${err.message}`);
    }
  }

  console.log(`\nVerified ${verified.length} / ${candidates.length} agencies.`);
  return verified;
}

verifyAll().catch(console.error);
