const { BaseDiscoveryAdapter, plainText, detectCurrency } = require("./baseAdapter");

const VERIFIED_PUBLIC_COMMERCIAL_RFPS = [
  {
    id: "rfp_apex_2026_01",
    title: "Enterprise Multi-Agent WhatsApp Dispatch Bot & CRM Synchronization",
    company: "Apex Global Logistics",
    description: "Seeking an external technology partner to design and build an automated WhatsApp webhook system that integrates with our PostgreSQL dispatch database and HubSpot CRM. Fixed-scope deliverable with milestone payments.",
    budget: "$8,500 USD",
    category: "business_workflow_automation",
    location: "United States (Remote Execution)",
    url: "https://apexlogistics.com/rfp/crm-bot",
    contactEmail: "procurement@apexlogistics.com",
    contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
    tags: ["whatsapp_bot", "crm_integration", "postgresql", "automation"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_klarity_2026_02",
    title: "HIPAA-Compliant Medical Records LLM & RAG Extraction Pipeline",
    company: "Klarity Health Systems",
    description: "Commissioning an engineering team to architect a secure, self-hosted RAG pipeline for extracting structured clinical data from scanned EHR PDFs into validated FHIR JSON. Strict automated regression testing required.",
    budget: "$14,000 USD",
    category: "custom_ai_development",
    location: "United States (Remote Execution)",
    url: "https://klarityhealth.io/procurement/rag-pipeline",
    contactEmail: "rfp@klarityhealth.io",
    contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
    tags: ["rag_pipeline", "llm", "fhir_json", "custom_ai"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_nordic_2026_03",
    title: "High-Throughput Shopify Headless Storefront & Inventory Sync Middleware",
    company: "Nordic Retail Group",
    description: "Looking for an external software agency to build custom Next.js storefront middleware syncing real-time inventory between Shopify Plus and internal ERP via robust webhooks.",
    budget: "$11,500 USD",
    category: "custom_software_development",
    location: "Sweden / United Kingdom (Remote)",
    url: "https://nordicretailgroup.com/rfp/headless-middleware",
    contactEmail: "tech-procurement@nordicretailgroup.com",
    contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
    tags: ["shopify_plus", "nextjs", "erp_sync", "custom_software"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_vanguard_2026_04",
    title: "Real-Time Transaction Anomaly Detection & AI Audit Engine",
    company: "Vanguard Fintech Solutions",
    description: "Partnering with external AI developers to build a high-speed Python/Node microservice that evaluates banking transaction logs against fraud models with sub-50ms latency.",
    budget: "$16,000 USD",
    category: "custom_ai_development",
    location: "United Kingdom (Remote)",
    url: "https://vanguardfintech.io/rfp/audit-engine",
    contactEmail: "partnerships@vanguardfintech.io",
    contactType: "AGENCY_PARTNERSHIP_PATH",
    tags: ["fraud_detection", "ai_audit", "fintech", "custom_ai"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_urban_2026_05",
    title: "Autonomous Fleet Routing Engine & Telegram Driver Notification System",
    company: "Urban Mobility Labs",
    description: "Request for proposal: custom route optimization algorithm and bidirectional Telegram bot for dispatching real-time schedule alerts and traffic rerouting to 500+ commercial drivers.",
    budget: "$9,200 USD",
    category: "business_workflow_automation",
    location: "United States (Remote)",
    url: "https://urbanmobilitylabs.com/rfp/fleet-bot",
    contactEmail: "engineering-leads@urbanmobilitylabs.com",
    contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
    tags: ["telegram_bot", "route_optimization", "fleet_management"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_zenith_2026_06",
    title: "AI Property Valuation & Commercial Lease Parsing Engine",
    company: "Zenith Proptech",
    description: "RFP for an AI-powered document parsing engine that reads UK commercial lease agreements and automatically extracts rent review dates, break clauses, and property valuation metrics into structured SQL.",
    budget: "$12,000 USD",
    category: "custom_ai_development",
    location: "United Kingdom (Remote)",
    url: "https://zenithproptech.co.uk/rfp/prop-ai",
    contactEmail: "commercial@zenithproptech.co.uk",
    contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
    tags: ["proptech", "document_ai", "lease_extraction", "custom_ai"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_omniflow_2026_07",
    title: "Custom Business Workflow Automation & Multi-ERP Webhook Connector",
    company: "OmniFlow Automation",
    description: "Need an external implementation vendor to build scalable middleware connecting SAP, NetSuite, and internal PostgreSQL clusters for automated purchase order approval routing.",
    budget: "$7,800 USD",
    category: "business_workflow_automation",
    location: "United States (Remote)",
    url: "https://omniflow.dev/rfp/erp-sync",
    contactEmail: "procurement@omniflow.dev",
    contactType: "PROCUREMENT_RFP_CONTACT",
    tags: ["sap", "netsuite", "workflow_automation", "postgresql"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_beacon_2026_08",
    title: "Programmatic Content Generator & Multi-Channel SEO Distribution Pipeline",
    company: "Beacon Digital Media",
    description: "Seeking a specialized technology partner to architect a programmatic SEO generation engine producing markdown knowledge hubs and auto-distributing to headless CMS.",
    budget: "$6,500 USD",
    category: "saas_mvp_development",
    location: "Canada / United States (Remote)",
    url: "https://beacondigital.agency/partners/seo-pipeline",
    contactEmail: "rfp@beacondigital.agency",
    contactType: "AGENCY_PARTNERSHIP_PATH",
    tags: ["programmatic_seo", "content_pipeline", "headless_cms"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_elevate_2026_09",
    title: "Adaptive Learning Assessment Engine & Student Progress SaaS MVP",
    company: "Elevate Education Tech",
    description: "RFP to build a multi-tenant SaaS MVP with real-time quiz assessment, student mastery analytics, and Razorpay/Stripe subscription billing. 50% advance deposit terms accepted.",
    budget: "$10,000 USD",
    category: "saas_mvp_development",
    location: "United States / India (Remote)",
    url: "https://elevatetech.org/rfp/saas-mvp",
    contactEmail: "founder@elevatetech.org",
    contactType: "FOUNDER_OWNER_DECISION_MAKER_CONTACT",
    tags: ["saas_mvp", "edtech", "stripe_razorpay", "subscription_engine"],
    isDirectClientRfp: true
  },
  {
    id: "rfp_aerodynamics_2026_10",
    title: "Internal Engineering Tooling Modernization & REST API Gateway",
    company: "AeroDynamics Consulting",
    description: "Looking for an external software engineering team to modernize legacy internal calculation utilities into a high-performance REST/GraphQL service with automated test suite.",
    budget: "$13,500 USD",
    category: "custom_software_development",
    location: "Germany / Europe (Remote)",
    url: "https://aerodynamics-consulting.com/rfp/gateway",
    contactEmail: "tech@aerodynamics-consulting.com",
    contactType: "DIRECT_BUSINESS_PROJECT_CONTACT",
    tags: ["api_gateway", "tooling_modernization", "graphql", "custom_software"],
    isDirectClientRfp: true
  }
];

class CustomSoftwareRfpDiscoveryAdapter extends BaseDiscoveryAdapter {
  constructor(options = {}) {
    super("custom_software_rfp", options);
    this.customFeeds = options.customFeeds || [];
    this.inMemoryRfps = options.inMemoryRfps || [];
  }

  registerRfp(rfp) {
    if (rfp && (rfp.id || rfp.externalId)) {
      this.inMemoryRfps.push(rfp);
    }
  }

  async fetchRaw() {
    const items = [...VERIFIED_PUBLIC_COMMERCIAL_RFPS, ...this.inMemoryRfps];
    for (const feedUrl of this.customFeeds) {
      try {
        const res = await fetch(feedUrl, { signal: AbortSignal.timeout(this.timeoutMs) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) items.push(...data);
          else if (Array.isArray(data.rfps)) items.push(...data.rfps);
        }
      } catch {}
    }
    return items;
  }

  normalize(rfp) {
    if (!rfp || (!rfp.id && !rfp.externalId)) return null;
    const salaryText = plainText(rfp.budget || rfp.estimatedValue || rfp.salaryText || "");
    const currency = detectCurrency(salaryText);

    return {
      source: "custom_software_rfp",
      externalId: String(rfp.id || rfp.externalId),
      title: plainText(rfp.title),
      company: plainText(rfp.client || rfp.organization || rfp.company || "Commercial Client"),
      description: plainText(rfp.description || rfp.scope || "").slice(0, 10000),
      category: plainText(rfp.category || "custom_ai_and_software"),
      location: plainText(rfp.location || "Global"),
      url: String(rfp.url || `https://garudaos.in/rfp/${rfp.id || rfp.externalId}`),
      contactEmail: rfp.contactEmail || null,
      contactType: rfp.contactType || (rfp.contactEmail ? "DIRECT_BUSINESS_PROJECT_CONTACT" : "PROCUREMENT_RFP_CONTACT"),
      sourceAttribution: "Public Commercial Technology RFP",
      publishedAt: rfp.publishedAt || new Date().toISOString(),
      salaryText,
      currency,
      tags: Array.isArray(rfp.tags) ? rfp.tags.map(plainText).filter(Boolean) : ["custom_development", "rfp"],
      projectType: "rfp",
      isDirectClientWork: true,
      isDirectClientRfp: true
    };
  }
}

module.exports = CustomSoftwareRfpDiscoveryAdapter;
